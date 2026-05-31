import { describe, it, expect } from 'vitest';
import { packSuns, recomputeSunSize } from '@/lib/marks/engine';
import { mintShareId, inheritedFromAttributions, INHERIT_RATE } from '@/lib/marks/attribution';
import type { BoardSeed, SunMark } from '@/lib/marks/types';

function mark(id: string, sizeScore = 40): SunMark {
  return { id, ownerToken: 't_' + id, displayName: null, actions: ['follow'], gradient: 'grey', sizeScore };
}

function seed(marks: SunMark[], fundedPct = 0.5): BoardSeed {
  return { marks, fundedPct, density: 0.74, sizeContrast: 1 };
}

describe('recomputeSunSize (S4 — sublinear + floor, settled-only)', () => {
  it('applies a dignified floor for a tiny first gift', () => {
    expect(recomputeSunSize(5, 0)).toBeGreaterThanOrEqual(40);
  });
  it('is monotonic non-decreasing in total contribution', () => {
    let prev = -1;
    for (const usd of [0, 5, 25, 100, 500, 5000, 50000]) {
      const s = recomputeSunSize(usd, 0);
      expect(s).toBeGreaterThanOrEqual(prev);
      prev = s;
    }
  });
  it('is sublinear — a 100x larger gift is far less than 100x bigger', () => {
    const small = recomputeSunSize(50, 0);
    const huge = recomputeSunSize(5000, 0);
    expect(huge / small).toBeLessThan(3);
  });
  it('a refund (lower amount) shrinks the size', () => {
    const before = recomputeSunSize(200, 100);
    const afterRefund = recomputeSunSize(100, 100);
    expect(afterRefund).toBeLessThan(before);
  });
  it('counts own + inherited together', () => {
    expect(recomputeSunSize(0, 100)).toEqual(recomputeSunSize(100, 0));
  });
});

describe('packSuns (S2 — system-controlled, deterministic, gutter-fill)', () => {
  const gutter = { w: 120, h: 800 };

  it('returns [] for an empty board (cold-start handled by the component)', () => {
    expect(packSuns(seed([]), gutter)).toEqual([]);
  });

  it('is deterministic — same seed + gutter → identical placement (zero-CLS SSR↔client)', () => {
    const marks = Array.from({ length: 20 }, (_, i) => mark('m' + i, 40 + i));
    const a = packSuns(seed(marks), gutter);
    const b = packSuns(seed(marks), gutter);
    expect(a).toEqual(b);
  });

  it('places every mark inside the gutter bounds', () => {
    const marks = Array.from({ length: 30 }, (_, i) => mark('m' + i, 40 + (i % 10) * 20));
    const placed = packSuns(seed(marks), gutter);
    expect(placed).toHaveLength(30);
    for (const p of placed) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(gutter.w);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(gutter.h);
      expect(p.r).toBeGreaterThan(0);
    }
  });

  it('fundedPct scales crowding, never emptiness — high % still fills (placements remain)', () => {
    // Use a wider gutter + larger suns so radii clear the 6px floor and the crowd-shrink is observable.
    const bigGutter = { w: 220, h: 1000 };
    const marks = Array.from({ length: 24 }, (_, i) => mark('m' + i, 200));
    const low = packSuns(seed(marks, 0.1), bigGutter);
    const high = packSuns(seed(marks, 0.95), bigGutter);
    expect(low).toHaveLength(24); // never empty regardless of funded%
    expect(high).toHaveLength(24);
    // higher funded% → smaller suns (more crowded), so avg radius drops
    const avg = (ps: { r: number }[]) => ps.reduce((s, p) => s + p.r, 0) / ps.length;
    expect(avg(high)).toBeLessThan(avg(low));
  });
});

// ── CB-12/CB-14 fix: maxSuns hard cap + EVEN distribution over the FULL gutter height ──
// Root cause being fixed: on a tall page (~9209px) the row-by-row bottom-up fill
// produced thousands of suns concentrated near the bottom with a near-empty mid band.
// The cap bounds the TOTAL count; even distribution spreads them across the full height.

describe('packSuns — maxSuns hard cap (CB-12/CB-14)', () => {
  it('places at most maxSuns even when given far more marks', () => {
    const tallGutter = { w: 200, h: 9000 };
    const marks = Array.from({ length: 5000 }, (_, i) => mark('m' + i, 60));
    const placed = packSuns(seed(marks), tallGutter, 80);
    expect(placed.length).toBeLessThanOrEqual(80);
    expect(placed.length).toBeGreaterThan(0);
  });

  it('without a cap, still places every mark (existing contract preserved)', () => {
    const gutter = { w: 120, h: 800 };
    const marks = Array.from({ length: 30 }, (_, i) => mark('m' + i, 60));
    const placed = packSuns(seed(marks), gutter);
    expect(placed).toHaveLength(30);
  });

  it('is deterministic with a cap (same seed+gutter+cap → identical placement)', () => {
    const tallGutter = { w: 200, h: 9000 };
    const marks = Array.from({ length: 5000 }, (_, i) => mark('m' + i, 60));
    const a = packSuns(seed(marks), tallGutter, 80);
    const b = packSuns(seed(marks), tallGutter, 80);
    expect(a).toEqual(b);
  });

  it('distributes capped suns across the full height with a CB-44 bottom-heavy trend — every third has suns', () => {
    const tallGutter = { w: 200, h: 9000 };
    const marks = Array.from({ length: 5000 }, (_, i) => mark('m' + i, 60));
    const placed = packSuns(seed(marks), tallGutter, 90);
    const third = tallGutter.h / 3;
    const top = placed.filter((p) => p.y < third).length;
    const mid = placed.filter((p) => p.y >= third && p.y < 2 * third).length;
    const bot = placed.filter((p) => p.y >= 2 * third).length;
    // every third must have suns (no empty band — CB-12 never-empty guarantee preserved)
    expect(top).toBeGreaterThan(0);
    expect(mid).toBeGreaterThan(0);
    expect(bot).toBeGreaterThan(0);
    // CB-44/CB-90: the field is bottom-heavy (denser toward the ground), so bottom ≥ mid ≥ top.
    expect(bot).toBeGreaterThanOrEqual(mid);
    expect(mid).toBeGreaterThanOrEqual(top);
    // CB-90: the v4.2 reference is a DENSE CROWD — columns grow with depth on top of the
    // row-band warp, so the bottom is intentionally far denser than the airy top (measured
    // ~7× on the reference). Still BOUNDED (no runaway empty-top pathology) and the cap
    // limits the absolute total, so we assert a sane ceiling rather than the old ~4×.
    const counts = [top, mid, bot];
    expect(Math.max(...counts)).toBeLessThanOrEqual(Math.min(...counts) * 12);
  });

  it('keeps all capped suns inside the gutter bounds', () => {
    const tallGutter = { w: 200, h: 9000 };
    const marks = Array.from({ length: 5000 }, (_, i) => mark('m' + i, 60));
    const placed = packSuns(seed(marks), tallGutter, 80);
    for (const p of placed) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(tallGutter.w);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(tallGutter.h);
      expect(p.r).toBeGreaterThan(0);
    }
  });

  it('cap ≥ marks.length places all marks (cap does not truncate a small board)', () => {
    const gutter = { w: 120, h: 800 };
    const marks = Array.from({ length: 12 }, (_, i) => mark('m' + i, 60));
    const placed = packSuns(seed(marks), gutter, 200);
    expect(placed).toHaveLength(12);
  });

  // CB-90: the v4.2 "physics board" reference is a DENSE CROWD — suns pack into ≥4
  // horizontal columns per row, not the airy ≤3-column field we had. This pins the
  // raised perRow ceiling so the gutter reads like the packed throng in the reference PDF.
  it('packs a dense crowd — ≥4 horizontal columns in a wide gutter (CB-90)', () => {
    const gutter = { w: 240, h: 6000 };
    const marks = Array.from({ length: 5000 }, (_, i) => mark('m' + i, 60));
    const placed = packSuns(seed(marks, 0.8), gutter, 300);
    // packEven lays each row column-major (x strictly increases across a row, then drops
    // to col0 on the next row — adjacent column centres are spaced wider than the jitter).
    // So the longest run of increasing x == perRow. A dense crowd needs ≥4 columns.
    let maxRun = 1;
    let run = 1;
    for (let k = 1; k < placed.length; k++) {
      if (placed[k].x > placed[k - 1].x) run++;
      else run = 1;
      if (run > maxRun) maxRun = run;
    }
    expect(maxRun).toBeGreaterThanOrEqual(4);
  });

  // CB-91: suns must read as an ORGANIC MASS, not parallel straight vertical column rails.
  // A rigid column grid leaves EMPTY gaps between the lane centres; an organic field (per-row
  // phase offset + wide jitter) fills those gaps so a fine x-histogram has no interior holes.
  it('places suns as an organic mass — no empty inter-column gaps / rails (CB-91)', () => {
    const gutter = { w: 240, h: 6000 };
    const marks = Array.from({ length: 5000 }, (_, i) => mark('m' + i, 60));
    const placed = packSuns(seed(marks, 0.8), gutter, 300);
    // Sample the dense bottom third (most columns → most prone to visible rails).
    const xs = placed.filter((p) => p.y > (2 * gutter.h) / 3).map((p) => p.x);
    expect(xs.length).toBeGreaterThan(20);
    const lo = Math.min(...xs);
    const hi = Math.max(...xs);
    const bins = 10;
    const hist = new Array(bins).fill(0);
    for (const x of xs) hist[Math.min(bins - 1, Math.floor(((x - lo) / (hi - lo)) * bins))]++;
    // A rigid N-column grid leaves empty interior bins between the lanes; an organic mass fills them.
    const interiorEmpties = hist.slice(1, -1).filter((c) => c === 0).length;
    expect(interiorEmpties).toBe(0);
  });
});

// ── CB-30: fundedPct drives BOTH sparsity (count) AND size (radius) ──
// Low fundedPct  → FEWER placed suns (sparser) AND larger average radius
// High fundedPct → MORE placed suns (denser)  AND smaller average radius
// Both must stay within the maxSuns cap (CB-12 contract preserved).
describe('packSuns — CB-30 fundedPct→sparsity+size mapping (packEven path)', () => {
  // Use a gutter + mark count that reliably exercises packEven (maxSuns supplied).
  // We need enough marks so the cap doesn't hit marks.length, and a wide gutter so
  // radii are well above the 6px/8px floor and the crowdShrink is clearly observable.
  const bigGutter = { w: 300, h: 2000 };
  const cap = 80;
  const manyMarks = Array.from({ length: 500 }, (_, i) => mark('m' + i, 120 + (i % 5) * 20));

  function seedWith(fundedPct: number): BoardSeed {
    return { marks: manyMarks, fundedPct, density: 0.74, sizeContrast: 1 };
  }
  const avg = (ps: { r: number }[]) =>
    ps.length === 0 ? 0 : ps.reduce((s, p) => s + p.r, 0) / ps.length;

  it('low fundedPct places FEWER suns than high (sparser field at low funding)', () => {
    const low  = packSuns(seedWith(0.05), bigGutter, cap);
    const high = packSuns(seedWith(0.95), bigGutter, cap);
    // High fundedPct must place more suns than low fundedPct — clearly sparser vs denser
    expect(high.length).toBeGreaterThan(low.length);
  });

  it('low fundedPct yields LARGER average radius than high (bigger suns when sparse)', () => {
    const low  = packSuns(seedWith(0.05), bigGutter, cap);
    const high = packSuns(seedWith(0.95), bigGutter, cap);
    expect(avg(low)).toBeGreaterThan(avg(high));
  });

  it('the count difference is PRONOUNCED — not just a rounding artifact', () => {
    const low  = packSuns(seedWith(0.0), bigGutter, cap);
    const high = packSuns(seedWith(1.0), bigGutter, cap);
    // At 0% funded the field should be meaningfully sparser than at 100%.
    // We require the high count to be at least 1.4× the low count.
    expect(high.length).toBeGreaterThanOrEqual(Math.round(low.length * 1.4));
  });

  it('both extremes respect the maxSuns cap (CB-12 contract preserved)', () => {
    const low  = packSuns(seedWith(0.0), bigGutter, cap);
    const high = packSuns(seedWith(1.0), bigGutter, cap);
    expect(low.length).toBeLessThanOrEqual(cap);
    expect(high.length).toBeLessThanOrEqual(cap);
    // Never empty — even at 0% funded there are suns in the gutter
    expect(low.length).toBeGreaterThan(0);
  });

  it('mapping is monotonic — higher fundedPct never decreases count', () => {
    const pcts = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1.0];
    let prev = -1;
    for (const pct of pcts) {
      const placed = packSuns(seedWith(pct), bigGutter, cap);
      expect(placed.length).toBeGreaterThanOrEqual(prev);
      prev = placed.length;
    }
  });

  it('mapping is monotonic — higher fundedPct never increases avg radius', () => {
    const pcts = [0, 0.25, 0.5, 0.75, 1.0];
    let prevAvg = Infinity;
    for (const pct of pcts) {
      const placed = packSuns(seedWith(pct), bigGutter, cap);
      const a = avg(placed);
      expect(a).toBeLessThanOrEqual(prevAvg + 0.5); // +0.5 tolerance for same-radius plateaus
      prevAvg = a;
    }
  });

  it('is deterministic — sparsity/size results are stable across repeated calls', () => {
    const s = seedWith(0.3);
    const a = packSuns(s, bigGutter, cap);
    const b = packSuns(s, bigGutter, cap);
    expect(a).toEqual(b);
  });
});

// ── CB-44: bottom-heavy SPATIAL trend (denser+smaller toward BOTTOM, sparser+larger toward TOP) ──
// Independent of the CB-30 density slider: the slider scales the field OVERALL (count+size)
// but must PRESERVE the top→bottom trend (it shifts the whole gradient, never flattens it).
describe('packSuns — CB-44 bottom-heavy density+size gradient (packEven path)', () => {
  const bigGutter = { w: 300, h: 2400 };
  const cap = 90;
  // Uniform sizeScore so the trend comes from SPATIAL position, not per-mark sizeScore variance.
  const manyMarks = Array.from({ length: 600 }, (_, i) => mark('m' + i, 120));

  function seedWith(fundedPct: number): BoardSeed {
    return { marks: manyMarks, fundedPct, density: 0.74, sizeContrast: 1 };
  }
  const avgR = (ps: { r: number }[]) =>
    ps.length === 0 ? 0 : ps.reduce((s, p) => s + p.r, 0) / ps.length;
  function thirds(ps: { y: number; r: number }[], h: number) {
    const t = h / 3;
    const top = ps.filter((p) => p.y < t);
    const bot = ps.filter((p) => p.y >= 2 * t);
    return { top, bot };
  }

  it('bottom third is DENSER than top third (more suns near the bottom)', () => {
    const placed = packSuns(seedWith(0.5), bigGutter, cap);
    const { top, bot } = thirds(placed, bigGutter.h);
    expect(bot.length).toBeGreaterThan(top.length);
  });

  it('bottom-third suns are SMALLER on average than top-third suns', () => {
    const placed = packSuns(seedWith(0.5), bigGutter, cap);
    const { top, bot } = thirds(placed, bigGutter.h);
    expect(avgR(bot)).toBeLessThan(avgR(top));
  });

  it('the trend is PRESERVED across slider extremes (slider scales overall, never flattens)', () => {
    for (const pct of [0, 0.5, 1]) {
      const placed = packSuns(seedWith(pct), bigGutter, cap);
      const { top, bot } = thirds(placed, bigGutter.h);
      // denser at bottom AND smaller at bottom at every funding level
      expect(bot.length).toBeGreaterThan(top.length);
      expect(avgR(bot)).toBeLessThan(avgR(top));
    }
  });

  it('the slider still changes OVERALL scale (count differs low vs high funding)', () => {
    const low = packSuns(seedWith(0.0), bigGutter, cap);
    const high = packSuns(seedWith(1.0), bigGutter, cap);
    // CB-30 contract preserved: overall count grows with funding
    expect(high.length).toBeGreaterThan(low.length);
    // CB-30 contract preserved: overall avg radius shrinks with funding
    expect(avgR(low)).toBeGreaterThan(avgR(high));
  });

  it('all suns remain inside the gutter bounds with the spatial trend', () => {
    const placed = packSuns(seedWith(0.5), bigGutter, cap);
    for (const p of placed) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(bigGutter.w);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(bigGutter.h);
      expect(p.r).toBeGreaterThan(0);
    }
  });

  it('is deterministic with the spatial trend (same seed → identical placement)', () => {
    const a = packSuns(seedWith(0.4), bigGutter, cap);
    const b = packSuns(seedWith(0.4), bigGutter, cap);
    expect(a).toEqual(b);
  });

  // CB-44 HYDRATION FIX: the bottom-heavy warp uses Math.pow (a transcendental) which can
  // drift in the last ULP between Node's V8 (SSR) and the browser's V8 (client), producing
  // e.g. width 41.87234890917354 vs ...355 → a React "Prop `style` did not match" warning
  // that fails the no-console-errors E2E gate. We quantize every placed x/y/r to ≤3 dp so
  // the serialized inline-style string is byte-identical on both sides. Guard that here:
  // every coordinate must equal its own round-to-3dp (no long irrational floats leak out).
  it('placed coordinates are quantized to ≤3 decimals (SSR↔client style-string parity)', () => {
    // Use a realistic irrational fundedPct (raised/goal) that previously produced long floats.
    const seedReal: BoardSeed = {
      marks: manyMarks,
      fundedPct: 0.6829268292682927,
      density: 0.74,
      sizeContrast: 1,
    };
    const round3 = (v: number) => Number(v.toFixed(3));
    for (const p of packSuns(seedReal, bigGutter, cap)) {
      expect(p.x).toBe(round3(p.x));
      expect(p.y).toBe(round3(p.y));
      expect(p.r).toBe(round3(p.r));
    }
  });
});

describe('attribution (S3 — single-touch 50% inherit, pseudonymous share id)', () => {
  it('mints unique, prefixed, PII-free share ids', () => {
    const input = { entityType: 'fundraiser' as const, entityId: 'f1', sharerToken: 'mike_t', channel: 'whatsapp' as const };
    const a = mintShareId(input);
    const b = mintShareId(input);
    expect(a).toMatch(/^shr_/);
    expect(a).not.toEqual(b); // unique per mint
    expect(a).not.toContain('mike_t'); // no PII / sharer identity baked in
  });

  it('credits exactly 50% of attributed donations to the last-touch sharer', () => {
    expect(INHERIT_RATE).toBe(0.5);
    expect(inheritedFromAttributions([100, 100])).toBe(100);
    expect(inheritedFromAttributions([])).toBe(0);
    expect(inheritedFromAttributions([50])).toBe(25);
  });
});
