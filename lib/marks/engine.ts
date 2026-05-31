// Suns placement engine (S2). architecture.md §4.8, feature-contribution-board.md §3.
// Placement is SYSTEM-CONTROLLED (users never position — anti-griefing guardrail).
// DETERMINISTIC: seeded from mark ids + gutter dims so SSR and client agree → ZERO CLS
// (no post-hydration scrollHeight probe). Packs bottom-up like droplets in a bucket;
// fundedPct scales size/crowding, NEVER emptiness — the gutter is always full (cold-start safe).
import type { BoardSeed, PlacedSun, SunMark } from '@/lib/marks/types';

const SIZE_FLOOR = 40; // a $5 first-timer still gets a dignified, visible mark
const SIZE_CAP = 320; // a large donor never eats the screen
const SIZE_K = 30; // sublinear growth coefficient

// sizeScore from settled contribution — sublinear (log) + floor. Monotonic; refund shrinks.
export function recomputeSunSize(ownUsd: number, inheritedUsd: number): number {
  const total = Math.max(0, ownUsd) + Math.max(0, inheritedUsd);
  return Math.min(SIZE_CAP, SIZE_FLOOR + SIZE_K * Math.log1p(total));
}

// Deterministic PRNG (mulberry32) — keeps placement stable server↔client.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(marks: SunMark[], gutter: { w: number; h: number }): number {
  let h = 2166136261 ^ Math.round(gutter.w) ^ (Math.round(gutter.h) << 1);
  for (const m of marks) {
    for (let i = 0; i < m.id.length; i++) {
      h ^= m.id.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
  }
  return h >>> 0;
}

// Radius for a mark: sizeScore scaled by sizeContrast and gently compressed as fundedPct rises
// (high funded% → many small crowded suns; low funded% → fewer, larger, comfortable suns).
function radiusFor(mark: SunMark, seed: BoardSeed, base: number): number {
  const norm = (mark.sizeScore - SIZE_FLOOR) / (SIZE_CAP - SIZE_FLOOR); // 0..1
  const contrast = 1 + (seed.sizeContrast - 1) * norm;
  const crowdShrink = 1 - 0.35 * seed.fundedPct; // higher funded → smaller suns
  const r = base * (0.55 + 0.9 * norm) * contrast * crowdShrink;
  return Math.max(6, r);
}

/**
 * Pack suns into a gutter (one side). Returns absolute {x,y,r} per mark.
 * The caller renders two gutters and applies the centre-fade mask; the engine only places.
 * With zero marks returns [] — the component shows the cold-start "be the first" state.
 *
 * `maxSuns` (CB-12/CB-14): a HARD CAP on placed suns. Without it the row-by-row bottom-up
 * fill scaled with the document height — on a ~9209px page that meant THOUSANDS of suns
 * concentrated near the bottom with a near-empty mid band. When `maxSuns` is set we switch
 * to an EVEN row layout that spreads min(maxSuns, marks.length) suns across the FULL gutter
 * height (every third populated, never-empty, bounded DOM count). When omitted the original
 * bottom-up behaviour is preserved so existing callers/tests are unaffected.
 */
export function packSuns(
  seed: BoardSeed,
  gutter: { w: number; h: number },
  maxSuns?: number,
): PlacedSun[] {
  const { marks, density } = seed;
  if (marks.length === 0 || gutter.w <= 0 || gutter.h <= 0) return [];

  const base = Math.min(gutter.w, gutter.h) * 0.06 * (0.8 + 0.4 * density);

  // CB-12/CB-14: when a cap is requested, ALWAYS use the even full-height distribution
  // (places min(cap, marks.length) suns). This fixes the bottom-heavy/mid-empty band even
  // when the supplied mark count exactly equals the cap.
  if (typeof maxSuns === 'number' && maxSuns > 0) {
    return packEven(seed, gutter, base, maxSuns);
  }

  const rand = mulberry32(hashSeed(marks, gutter));
  const placed: PlacedSun[] = [];

  // Bucket rows from the bottom up; bottom rows denser (more per row, less vertical gap).
  let y = gutter.h;
  let row = 0;
  let i = 0;
  while (i < marks.length && y > 0) {
    // bottom row denser → narrower vertical step near the bottom
    const depth = y / gutter.h; // 1 at bottom → 0 at top
    const rowGap = base * (1.4 - 0.5 * depth) * (1 / Math.max(0.4, density));
    const perRow = Math.max(1, Math.round((gutter.w / (base * 1.8)) * (0.7 + 0.6 * depth)));
    for (let c = 0; c < perRow && i < marks.length; c++, i++) {
      const mark = marks[i];
      const r = radiusFor(mark, seed, base);
      const cellW = gutter.w / perRow;
      const jitterX = (rand() - 0.5) * cellW * 0.5;
      const jitterY = (rand() - 0.5) * rowGap * 0.4;
      const x = cellW * (c + 0.5) + jitterX;
      placed.push({ mark, x: q(clamp(x, r, gutter.w - r)), y: q(clamp(y - rowGap * 0.5 + jitterY, r, gutter.h - r)), r: q(r) });
    }
    y -= rowGap;
    row++;
  }

  // If marks remain (very full board), tuck extras near the bottom with small radii.
  while (i < marks.length) {
    const mark = marks[i++];
    const r = Math.max(6, base * 0.5);
    placed.push({ mark, x: q(clamp(rand() * gutter.w, r, gutter.w - r)), y: q(clamp(gutter.h - rand() * base * 2, r, gutter.h - r)), r: q(r) });
  }

  return placed;
}

/**
 * CB-12/CB-14: place exactly ~maxSuns suns EVENLY over the full gutter height.
 * Rows are evenly spaced top→bottom so every third of the gutter is populated and the total
 * DOM node count is bounded regardless of how tall the page is. Sun SIZE is gutter-WIDTH
 * driven (a consistent fraction of the gutter) so suns read like the mock's ~40px icons
 * regardless of page height. Deterministic (seeded) → SSR/client agree → zero CLS.
 *
 * CB-30: fundedPct drives BOTH sparsity (count) AND size (radius).
 *   - low fundedPct  → fewer placed suns (sparser field) AND larger radii
 *   - high fundedPct → more placed suns (denser field)  AND smaller radii
 *
 * Count scaling: effectiveTotal = round(total × (0.4 + 0.6 × fundedPct))
 *   At 0% funded → 40% of cap placed; at 100% → 100% of cap placed.
 *   That gives a 2.5× count range, clearly visible. Clamped to [1, total].
 *
 * Size scaling: crowdShrink = 1 - 0.35 × fundedPct (was 0.25)
 *   Plus sparseBoost = 1 + 0.35 × (1 - fundedPct) applied when fewer suns are shown,
 *   so the larger suns at low fundedPct stand out even more (doubly pronounced).
 *
 * Both adjustments are deterministic (seeded) → SSR/client agree → zero CLS.
 * The CB-12 hard cap is still the outer limit; CB-30 varies WITHIN it.
 *
 * CB-44 — bottom-heavy SPATIAL trend (separable from the CB-30 density slider):
 *   The field is a sky→ground gradient. Suns get DENSER + SMALLER toward the BOTTOM
 *   and SPARSER + LARGER toward the TOP, like sediment settling in the bucket.
 *     - Vertical packing: instead of a uniform rowPitch we map each row index through a
 *       monotonic warp `depthWarp` so row bands compress toward the bottom → more rows
 *       (more suns) occupy the bottom third than the top third.
 *     - Per-sun radius: a `depthShrink` factor multiplies radius by ~1.35 at the very top
 *       down to ~0.7 at the very bottom, so a bottom sun reads smaller than a top sun of
 *       the same sizeScore.
 *   The CB-30 slider (fundedPct) scales the WHOLE field — `total` count and the
 *   crowdShrink/sparseBoost size multipliers apply uniformly on TOP of the spatial trend,
 *   shifting the gradient up/down without flattening it. Deterministic → zero CLS.
 */
// CB-44/CB-79/CB-90 bottom-heavy tuning constants.
// DEPTH_WARP < 1 makes bandEdge(k)=h*(k/rows)^WARP convex: big (tall) bands near the TOP,
// small (short) bands near the BOTTOM → more rows (more suns) land in the bottom third.
// CB-90 (reference-verified against screenshots/*physics board*.pdf): the v4.2 board is a
// DENSE CROWD — sparse+large suns at the top thickening into a packed throng of small suns
// at the bottom. A constant column count can't express that, so columns now GROW with depth
// (COLS_TOP near the top → COLS_BOTTOM near the ground) on TOP of the row-band warp. This is
// what makes the bottom read as a crowd (suns nearly touching) instead of an airy field.
const DEPTH_WARP = 0.5; // <1 compresses row bands toward the bottom (denser ground)
const DEPTH_SHRINK_TOP = 1.6; // radius multiplier at the very top (largest)
const DEPTH_SHRINK_BOTTOM = 0.5; // radius multiplier at the very bottom (smallest)
const COLS_TOP = 2; // columns per row near the top (sparse, large suns)
const COLS_BOTTOM = 5; // columns per row near the bottom (dense crowd of small suns)
const BASE_R_FRAC = 0.12; // sun radius as a fraction of gutter width

function packEven(
  seed: BoardSeed,
  gutter: { w: number; h: number },
  _base: number,
  maxSuns: number,
): PlacedSun[] {
  const { marks } = seed;
  const rand = mulberry32(hashSeed(marks, gutter));

  // Size is a fraction of GUTTER WIDTH (not min(w,h)) so suns read large like the mock.
  const baseR = Math.max(8, gutter.w * BASE_R_FRAC);
  const capTotal = Math.min(maxSuns, marks.length);

  // CB-30 — sparsity: scale effective count by fundedPct.
  // At 0% → 40% of the cap is placed (sparser). At 100% → 100% placed (denser).
  // We apply sparsity only when the board has more marks than we want to show
  // (cap-bound path). When marks.length ≤ maxSuns the board is not cap-bound, so
  // all real marks are shown regardless of fundedPct (existing contract preserved).
  // Clamped to [1, capTotal] so we always place at least 1 sun (never-empty guardrail).
  const sparsityFactor = 0.4 + 0.6 * clamp(seed.fundedPct, 0, 1);
  const sparseTarget = Math.max(1, Math.round(capTotal * sparsityFactor));
  // Preserve all marks when there are fewer than the cap (non-cap-bound board).
  const total = marks.length <= maxSuns ? capTotal : Math.min(capTotal, sparseTarget);

  // CB-30 — size: two factors that together make the effect pronounced:
  //   crowdShrink: at high fundedPct suns shrink (more of them, smaller)
  //   sparseBoost: at low fundedPct suns grow (fewer of them, bigger)
  // These are UNIFORM across the field — they scale the whole gradient (CB-44 trend intact).
  const crowdShrink = 1 - 0.35 * clamp(seed.fundedPct, 0, 1);
  const sparseBoost = 1 + 0.35 * (1 - clamp(seed.fundedPct, 0, 1));

  // CB-90 — depth-varying columns. We need ~`total` suns spread over the FULL height in
  // rows whose column count GROWS toward the bottom. Estimate the row count from the
  // average columns-per-row so Σ(cols per row) ≈ total, then warp the row bands so they
  // compress toward the bottom (more rows on the ground). Each band's column count and sun
  // radius are then driven by that band's depth.
  const avgCols = (COLS_TOP + COLS_BOTTOM) / 2;
  const rows = Math.max(1, Math.ceil(total / avgCols));

  // CB-44 — vertical band edges, warped so bands compress toward the BOTTOM.
  // bandEdge(k) = h * (k/rows)^DEPTH_WARP, monotonic increasing. With DEPTH_WARP<1 the
  // early (top) bands are TALL (few, sparse) and later (bottom) bands are SHORT (many,
  // dense). Each row r0 occupies [bandEdge(r0), bandEdge(r0+1)] and is centred in it.
  const bandEdge = (k: number) => gutter.h * Math.pow(k / rows, DEPTH_WARP);

  const placed: PlacedSun[] = [];
  let i = 0;
  for (let r0 = 0; r0 < rows && i < total; r0++) {
    const top = bandEdge(r0);
    const bottom = bandEdge(r0 + 1);
    const bandH = bottom - top;
    const bandCenter = top + bandH * 0.5;
    // depth: 0 at the very top → 1 at the very bottom (based on this band's centre).
    const depth = clamp(bandCenter / gutter.h, 0, 1);
    // CB-44 — radius shrinks with depth (smaller toward the bottom).
    const depthShrink = DEPTH_SHRINK_TOP + (DEPTH_SHRINK_BOTTOM - DEPTH_SHRINK_TOP) * depth;
    // CB-90 — columns grow with depth (more, smaller suns toward the bottom → crowd).
    const cols = Math.max(1, Math.round(COLS_TOP + (COLS_BOTTOM - COLS_TOP) * depth));
    const cellW = gutter.w / cols;
    // CB-91 — organic mass, not column rails. A per-ROW seeded phase shift slides the whole
    // row's baseline off the fixed lane centres so consecutive rows don't align into vertical
    // rails; combined with wide per-SUN jitter the columns blur into a heap. Drawn once per
    // row (deterministic order) → SSR↔client identical.
    const rowPhase = (rand() - 0.5) * cellW * 0.5;

    const inRow = Math.min(cols, total - i);
    for (let c = 0; c < inRow; c++, i++) {
      const mark = marks[i];
      // Per-sun size variation from its sizeScore, around the gutter-width baseR.
      const norm = clamp((mark.sizeScore - SIZE_FLOOR) / (SIZE_CAP - SIZE_FLOOR), 0, 1);
      const rad = Math.max(
        6,
        baseR * (0.7 + 0.6 * norm) * crowdShrink * sparseBoost * depthShrink,
      );
      // Wide horizontal jitter (±0.5 cell) + the per-row phase → suns roam across lane
      // boundaries so no straight column rail forms (CB-91). Clamp keeps them in-gutter.
      const jitterX = (rand() - 0.5) * cellW * 0.5;
      // Vertical jitter > half the band so adjacent rows interleave into a mass (CB-91).
      const jitterY = (rand() - 0.5) * bandH * 0.55;
      const x = cellW * (c + 0.5) + rowPhase + jitterX;
      const y = bandCenter + jitterY;
      // Quantize to a stable precision so Math.pow ULP drift can't surface as a
      // server/client style mismatch (hydration fix — see q()).
      placed.push({
        mark,
        x: q(clamp(x, rad, gutter.w - rad)),
        y: q(clamp(y, rad, gutter.h - rad)),
        r: q(rad),
      });
    }
  }
  return placed;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// CB-44 hydration fix: quantize a placement coordinate to a stable decimal precision.
// `Math.pow(k/rows, DEPTH_WARP)` (the CB-44 bottom-heavy warp) is a TRANSCENDENTAL — Node's
// V8 (SSR) and the browser's V8 (client) can disagree in the LAST ULP, so the same seed +
// gutter produced e.g. width 41.87234890917354 server vs 41.87234890917355 client → React
// "Prop `style` did not match" hydration warning (fails the no-console-errors E2E gate).
// Rounding to ROUND_DP (3) decimals collapses any sub-ULP drift to an identical string on
// both sides. 3 dp = ≤0.001px — far below any visible/CLS threshold, so placement is
// visually unchanged and still deterministic. Applied to EVERY placed x/y/r.
const ROUND_DP = 3;
function q(v: number): number {
  // Number(v.toFixed(n)) is itself deterministic across V8 builds (decimal→string→parse),
  // unlike a raw transcendental result, so it yields a byte-identical inline style value.
  return Number(v.toFixed(ROUND_DP));
}
