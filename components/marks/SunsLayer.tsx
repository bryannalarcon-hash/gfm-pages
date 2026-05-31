'use client';

/**
 * SunsLayer — ambient gutter layer. Places suns in BOTH side gutters.
 *
 * Zero-CLS guarantee: gutter dimensions are expressed as CSS custom properties
 * computed from the layout (a CSS container-query / fixed breakpoint approach),
 * NOT a post-hydration scrollHeight probe. The packed placements are computed
 * using the SSR'd seed and a fixed gutter size derived from a known breakpoint
 * constant — server and client agree on the same value → no CLS.
 *
 * How we avoid the scrollHeight probe (marks-bg.js bug fix):
 *   The mock called `document.documentElement.scrollHeight` which varies
 *   post-hydration and produces CLS. Instead we:
 *   1. Accept gutterW and gutterH as props (provided by the server layout that
 *      knows the column/viewport geometry at render time), OR
 *   2. Fall back to a FIXED default height constant (1800px) that fills enough
 *      visual space before the real height is known — no reflow because the
 *      layer is position:absolute z-index:-1 and never shifts layout.
 *   3. A client-side ResizeObserver on the layer's own container measures the
 *      real container height and re-packs suns to fill the full page — CLS-safe
 *      because the layer is position:absolute, behind content, pointer-events:none.
 *   In practice, the Next.js layout passes gutterH derived from a CSS
 *   min-height constraint, not from a DOM measurement.
 *
 * Mobile rule (<700px): collapse to a faint scattered field at ~0.17 opacity.
 * Cold-start: if seed.marks is empty → "Be the first to light this up" state,
 *   ALSO densely filled with decorative anonymous suns (never reads empty).
 * fundedPct scales size/crowding, NEVER emptiness (engine contract).
 *
 * Accessibility: layer is aria-hidden="true"; aggregate count is rendered as
 * a visually-hidden text node for screen readers.
 *
 * Guardrails:
 *  - No dollar figures
 *  - System placement (packSuns decides x/y)
 *  - No scrollHeight probe
 *  - reducedMotion → static rest state
 *  - packSuns contract unchanged (lib/marks/engine.ts unit tests stay green)
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import type { SunsLayerProps, PlacedSun, SunMark as SunMarkType, SunGradient } from '@/lib/marks/types';
import { SUN_GRADIENTS } from '@/lib/marks/types';
import { packSuns } from '@/lib/marks/engine';
import { logoMaskStyle } from '@/lib/marks/logoMask';
import { SunsDemoControl } from '@/components/marks/SunsDemoControl';

// Fixed gutter geometry constants — derived from the known layout breakpoints.
// The content column is max-w-[680px] centered. At 1280px viewport the gutters
// are each ~300px wide. We use a conservative fixed constant so SSR and client
// emit the same DOM → zero CLS.
const GUTTER_W_DEFAULT = 300;
// SSR fallback height — covers most community/profile pages (~1200-1800px).
// For longer fundraiser pages, the ResizeObserver corrects to the real page height
// within ~100-200ms. position:absolute never causes CLS regardless of this value.
const LAYER_H_SSR_FALLBACK = 2000;

// Threshold below which we collapse to the faint mobile scatter field.
const MOBILE_BREAKPOINT = 700;

// Density default for the padding-mark size calc (overridden by seed.density per mount).
const DENSITY = 0.74;

// CB-12/CB-14: HARD CAP on suns per gutter — bounds total DOM nodes regardless of how tall
// the page is, and feeds packSuns the even-distribution path. Previously the count scaled with
// gutter AREA (~9209px × 2 gutters), producing ~7,756 masked spans on the community page.
// The cap spreads suns EVENLY over the full height so visible-viewport density matches the
// mock's airy look (~18–20 suns visible across both gutters per ~1000px viewport).
//  - Community: lighter look, but enough per-viewport suns to read full (not sparse)
//  - Fundraiser: a touch denser, still bounded
// CB-90: raised to match the v4.2 "physics board" reference, which reads as a DENSE CROWD
// surrounding the page (suns nearly touching toward the bottom) — not the airy field the
// lower caps produced. Still bounded DOM (a few hundred masked spans, fine for layout).
const SUNS_CAP_COMMUNITY = 150; // ≤ ~300 total across both gutters
const SUNS_CAP_FUNDRAISER = 180; // ≤ ~360 total across both gutters
// Density threshold separating the two mounts (community uses COMMUNITY_DENSITY = 0.38).
const COMMUNITY_DENSITY_THRESHOLD = 0.5;

/** Per-gutter sun cap derived from the seed density (community = lighter, fundraiser = denser). */
function gutterCapFor(density: number): number {
  return density < COMMUNITY_DENSITY_THRESHOLD ? SUNS_CAP_COMMUNITY : SUNS_CAP_FUNDRAISER;
}

// CB-90: the v4.2 reference crowd is MOSTLY MUTED GREY with occasional colour accents — not
// the saturated rainbow the old curated mix produced. The decorative pads dominate the field,
// so weighting them ~2:1 grey:colour gives the calm crowd look; real marks still carry their
// own (coloured) gradients as the minority accents.
const PAD_GRADIENTS: SunGradient[] = ['grey', 'grey', 'gold', 'grey', 'grey', 'teal', 'grey', 'grey', 'violet', 'grey', 'grey', 'brand'];

// Cold-start placeholder sun colours for the "be the first" state (5 decorative) — mostly grey.
const COLD_GRADIENTS: SunGradient[] = ['grey', 'grey', 'gold', 'grey', 'teal'];
const COLD_SIZES = [28, 22, 34, 26, 30];

// Animation CSS injected once into the document head.
const FALL_ANIM_CSS = `
@keyframes sunsLayerFall {
  0%   { opacity: 0; transform: translateY(var(--sun-fall, -300px)); }
  72%  { opacity: 1; transform: translateY(0); }
  84%  { transform: translateY(-5px); }
  100% { opacity: 1; transform: translateY(0); }
}
`;

let fallAnimInjected = false;
function ensureFallAnim(): void {
  if (fallAnimInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.dataset['sunsLayerAnim'] = '1';
  el.textContent = FALL_ANIM_CSS;
  document.head.appendChild(el);
  fallAnimInjected = true;
}

interface SunsLayerInternalProps extends SunsLayerProps {
  /** Width of one gutter in px — from layout, NOT from scrollHeight/offsetWidth */
  gutterW?: number;
  /** Layer height in px — from layout constraint, NOT from scrollHeight */
  gutterH?: number;
  /** Whether we are below the mobile breakpoint (supplied by layout or CSS-only) */
  isMobile?: boolean;
}

/** Build gradient CSS string for a placed sun */
function gradientFor(gradient: SunGradient): string {
  const { from, to } = SUN_GRADIENTS[gradient];
  return gradient === 'grey'
    ? 'var(--hrt-color-border-neutral)'
    : `linear-gradient(135deg, ${from}, ${to})`;
}

/**
 * Build decorative padding marks. These are aria-hidden anonymous suns — no real mark data.
 * Their IDs are deterministic based on index so SSR/client agree (no Math.random).
 *
 * CB-12/CB-14 FIX: the count is now driven by a HARD CAP (`targetCount`), NOT by gutter AREA.
 * Previously the count scaled with the document height (~9209px), producing thousands of
 * masked spans concentrated near the bottom. Now we generate just enough pads to reach the
 * per-gutter cap; packSuns(maxSuns) then spreads them evenly across the full height.
 *
 * `sizeScoreBase` controls how large the padding suns are — community uses a higher base
 * so its (fewer) suns read a little larger, matching the mock's airy look.
 */
function buildPaddingMarks(
  realCount: number,
  targetCount: number,
  sizeScoreBase: number = 40,
): SunMarkType[] {
  const padCount = Math.max(0, targetCount - realCount);

  const pads: SunMarkType[] = [];
  for (let i = 0; i < padCount; i++) {
    // Deterministic gradient selection (no Math.random)
    const gradient = PAD_GRADIENTS[i % PAD_GRADIENTS.length];
    // Vary size using a deterministic pattern in the sizeScoreBase range
    const sizeVariant = sizeScoreBase + ((i * 7 + 3) % 13) * 6; // base..base+72 range
    pads.push({
      id: `__pad_${i}`,
      ownerToken: `__pad_${i}`,
      displayName: null,
      actions: ['follow'],
      gradient,
      sizeScore: sizeVariant,
      isOwn: false,
    });
  }
  return pads;
}

/** Render one placed sun as a positioned span — aria-hidden */
function PlacedSunSpan({
  ps,
  reducedMotion,
  layerH,
  delay,
}: {
  ps: PlacedSun;
  reducedMotion: boolean;
  layerH: number;
  delay: number;
}) {
  const { mark, x, y, r } = ps;
  const size = r * 2;
  const { from, to } = SUN_GRADIENTS[mark.gradient];
  const bg =
    mark.gradient === 'grey'
      ? 'var(--hrt-color-border-neutral)'
      : `linear-gradient(135deg, ${from}, ${to})`;

  const fallDist = Math.round(y + r + 120);
  const animStyle: React.CSSProperties =
    !reducedMotion
      ? {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ['--sun-fall' as any]: `-${fallDist}px`,
          animation: `sunsLayerFall 0.9s cubic-bezier(0.5,0,0.85,0.4) ${delay.toFixed(2)}s both`,
        }
      : {};

  // isOwn (viewer's own/contributor sun) OR isSharer (arrived via this sun's share link).
  const isHighlighted = mark.isOwn || mark.isSharer;

  // Initials helper — used ONLY by the ring LABEL below ("<Initial>'s Sun"), NOT as a
  // glyph on the sun. "Mike T." → "MT".
  const initialsFor = (name: string): string =>
    name.trim().split(/\s+/).map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase();

  // CB-78: NO letters/initials rendered ON the sun mark at all (supersedes CB-67, reverses
  // CB-42/CB-45). Identity is conveyed by the ring + "Your Sun"/"<…>'s Sun" label (CB-46/CB-80)
  // and by PFPs elsewhere (CB-76), never a glyph on the mark itself.
  const initials: string | null = null;

  const ringStyle: React.CSSProperties | null = isHighlighted
    ? {
        position: 'absolute',
        // CB-46: a clear CIRCLE around the sun — sized to the sun + a comfortable gap.
        width: size + 14,
        height: size + 14,
        left: x - r - 7,
        top: y - r - 7,
        borderRadius: '50%',
        border: '3px solid var(--hrt-color-surface-brand)',
        boxShadow: '0 0 0 4px rgba(74,157,68,0.18)',
        boxSizing: 'border-box',
        pointerEvents: 'none',
        zIndex: 3,
      }
    : null;

  // CB-46: label for own-sun OR sharer-sun highlight.
  //   isOwn   → "Your Sun"
  //   isSharer→ "<Initial>'s Sun" (e.g. "MT's Sun"); anonymous sharer → "Their Sun"
  const highlightLabel: string | null = mark.isOwn
    ? 'Your Sun'
    : mark.isSharer
    ? mark.displayName
      ? `${initialsFor(mark.displayName)}'s Sun`
      : 'Their Sun'
    : null;

  const youLabelStyle: React.CSSProperties | null = highlightLabel
    ? {
        position: 'absolute',
        left: x,
        top: y - r - 24,
        transform: 'translateX(-50%)',
        background: 'var(--hrt-color-surface-brand-strong)',
        color: '#fff',
        fontSize: '11px',
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: 'var(--hrt-size-radius-full)',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        // CB-46: sit above the ring (z=3) so the label is never clipped by the ring/sun.
        zIndex: 4,
      }
    : null;

  return (
    <>
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: size,
          height: size,
          left: x - r,
          top: y - r,
          background: bg,
          ...logoMaskStyle,
          zIndex: isHighlighted ? 2 : undefined,
          ...animStyle,
        }}
        data-mark-id={mark.id}
      />
      {initials && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: x,
            // CB-45: centre the initial on the sun's DOME. The mask's visual mass sits in
            // the upper ~⅔ of the box, so nudging up from centre lands it on the dome.
            top: y - r * 0.12,
            transform: 'translate(-50%, -50%)',
            // CB-45: larger glyph (≈40% of diameter) so it reads even on small gutter suns.
            fontSize: Math.max(9, Math.round(size * 0.4)),
            fontWeight: 800,
            lineHeight: 1,
            color: '#fff',
            // CB-45: contrast halo so the letter is legible over ANY curated gradient.
            textShadow: '0 1px 2px rgba(0,0,0,0.45)',
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            // CB-45: sit clearly ABOVE the masked sun span (which is auto/0 z when not
            // highlighted) so the initial is never covered by the sun or the fall animation.
            zIndex: 2,
          }}
        >
          {initials}
        </span>
      )}
      {isHighlighted && ringStyle && <span aria-hidden="true" style={ringStyle} />}
      {highlightLabel && youLabelStyle && (
        <span aria-hidden="true" style={youLabelStyle}>
          {highlightLabel}
        </span>
      )}
    </>
  );
}

/** Cold-start decorative sun (no real mark data) */
function ColdSunSpan({
  gradient,
  size,
  x,
  y,
}: {
  gradient: SunGradient;
  size: number;
  x: number;
  y: number;
}) {
  const bg = gradientFor(gradient);
  return (
    <span
      aria-hidden="true"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        left: x - size / 2,
        top: y - size / 2,
        background: bg,
        ...logoMaskStyle,
        opacity: 0.4,
      }}
    />
  );
}

export function SunsLayer({
  seed,
  reducedMotion,
  supporterCount: supporterCountProp,
  gutterW: gutterWProp = GUTTER_W_DEFAULT,
  gutterH: gutterHProp = LAYER_H_SSR_FALLBACK,
  isMobile = false,
  fundedPctOverride,
  onFundedPctChange,
}: SunsLayerInternalProps) {
  // Inject fall animation CSS on first client render
  if (typeof window !== 'undefined') {
    ensureFallAnim();
  }

  // CB-14: self-protecting reduced-motion guard. The layer honours the `reducedMotion` prop
  // AND independently re-checks `prefers-reduced-motion: reduce` after mount, so suns are
  // static even if a caller passes the prop late/incorrectly. SSR-safe: starts false (no
  // mismatch with server output), then disables animation on the client effect if the user
  // prefers reduced motion. position:absolute → toggling animation never causes CLS.
  const [prefersReduced, setPrefersReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setPrefersReduced(mq.matches);
    apply();
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, []);
  const noMotion = reducedMotion || prefersReduced;

  // CB-30: demo-mode fundedPct override.
  // Starts null (SSR uses seed.fundedPct, no hydration mismatch). Only set after the
  // user moves the slider — purely client-side state, never serialised or sent to the server.
  const [localDemoFundedPct, setLocalDemoFundedPct] = useState<number | null>(null);
  // CB-93: when the parent controls the funded% (fundedPctOverride !== undefined), defer to it
  // so the on-page progress bar and the suns share ONE source of truth. Otherwise keep the
  // original local state (community/profile, where there's no shared bar).
  const isControlled = fundedPctOverride !== undefined;
  const demoFundedPct = isControlled ? fundedPctOverride : localDemoFundedPct;
  const setDemoFundedPct = (pct: number) => {
    if (isControlled) onFundedPctChange?.(pct);
    else setLocalDemoFundedPct(pct);
  };
  // Effective fundedPct: demo override takes precedence after first user interaction.
  const effectiveFundedPct = demoFundedPct ?? seed.fundedPct;

  // FIX #3 + gutter width: Measure real container dimensions via ResizeObserver on the PARENT.
  // The layer is position:absolute so it can't size itself off the parent's min-height.
  // We observe the parent to get the actual rendered page height AND viewport width so we
  // can compute the true gutter width (viewport minus content column).
  // CLS-safe: the layer is position:absolute behind content, pointer-events:none,
  // so re-measuring never shifts layout elements.
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [measuredH, setMeasuredH] = useState<number | null>(null);
  const [measuredGutterW, setMeasuredGutterW] = useState<number | null>(null);

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor || typeof ResizeObserver === 'undefined') return;
    // CB-14: Walk up to find the nearest parent with a real rendered box.
    // `Instrumented` uses display:contents (no box) so anchor.parentElement is
    // zero-size and the ResizeObserver never fires with real dimensions.
    // We skip display:contents parents to land on the positioned relative container.
    let parent: HTMLElement | null = anchor.parentElement;
    while (parent && getComputedStyle(parent).display === 'contents') {
      parent = parent.parentElement;
    }
    if (!parent) return;

    function update() {
      const parentH = parent!.offsetHeight;
      if (parentH > 100) setMeasuredH(parentH);

      // Compute actual gutter width: find the first non-layer child block with a narrower
      // width (the content column) and compute: (viewport - contentW) / 2.
      // If no such element found, fall back to (viewport - 1152) / 2 (max-w-[72rem]).
      const vw = parent!.offsetWidth;
      // Try to find the main/section child with max-width constraint
      const contentCols = parent!.querySelectorAll('main, [class*="max-w-"]');
      let contentW = 0;
      for (const el of contentCols) {
        const w = (el as HTMLElement).offsetWidth;
        if (w > 400 && w < vw - 100) { contentW = Math.max(contentW, w); }
      }
      if (contentW === 0) {
        // fallback: use known max-w values (72rem=1152, 64rem=1024)
        contentW = Math.min(vw, 1152);
      }
      const gw = Math.max(80, (vw - contentW) / 2);
      setMeasuredGutterW(gw);
    }

    const obs = new ResizeObserver(update);
    obs.observe(parent);
    // Run once immediately, and also after a rAF to catch any late layout
    update();
    let rafId = requestAnimationFrame(update);
    return () => { obs.disconnect(); cancelAnimationFrame(rafId); };
  }, []);

  // Use measured dimensions or prop fallbacks
  const gutterH = measuredH ?? gutterHProp;
  const gutterW = measuredGutterW ?? gutterWProp;

  const isEmpty = seed.marks.length === 0;

  // CB-12/CB-14: HARD CAP per gutter — bounds total DOM nodes regardless of page height.
  const gutterCap = gutterCapFor(seed.density);

  // Pad real marks with decorative anonymous suns up to the CAP (not gutter area).
  // packSuns(maxSuns) then spreads them evenly across the full gutter height.
  // CB-30: inject effectiveFundedPct so the engine's sparsity+size mapping uses the
  // demo override (or the real seed value when no override is active).
  const paddedSeed = useMemo(() => {
    if (isEmpty || isMobile) return { ...seed, fundedPct: effectiveFundedPct };
    // sizeScoreBase scales with inverse density — community's (fewer) suns read a bit larger.
    const sizeScoreBase = Math.round(40 + (1 - seed.density / 0.74) * 100);
    // CB-92: pad the FIELD above the cap so packSuns(maxSuns) is genuinely cap-bound and its
    // fundedPct sparsity actually engages. Padding to exactly the cap made marks.length ===
    // maxSuns → packEven took the "preserve all marks" branch and pinned the count to the cap
    // (slider changed size only, never count). The cap's sparsity floor is 0.4×, so a field of
    // cap/0.4 guarantees enough marks to fill the cap at fundedPct=1 and to thin down at 0.
    const fieldCount = Math.ceil(gutterCap / 0.4);
    const pads = buildPaddingMarks(seed.marks.length, fieldCount, sizeScoreBase);
    return {
      ...seed,
      fundedPct: effectiveFundedPct,
      marks: [...seed.marks, ...pads],
    };
  }, [seed, isEmpty, isMobile, gutterCap, effectiveFundedPct]);

  // Pack both gutters deterministically (same seed → same output on server and client).
  // The cap drives packSuns into the EVEN distribution path (no bottom-heavy mid-empty band).
  // Re-runs whenever effectiveFundedPct changes (slider interaction), producing the live
  // re-sparsify/resize effect. CLS-safe: the layer is position:absolute, pointer-events:none.
  const { leftSuns, rightSuns } = useMemo(() => {
    if (isEmpty || isMobile) return { leftSuns: [], rightSuns: [] };
    const left = packSuns(paddedSeed, { w: gutterW, h: gutterH }, gutterCap);
    // Right gutter: reverse the marks order so the two gutters differ (mirrors the mock's
    // distinct arrangements) while staying deterministic SSR↔client.
    const rightSeed = { ...paddedSeed, marks: [...paddedSeed.marks].reverse() };
    const right = packSuns(rightSeed, { w: gutterW, h: gutterH }, gutterCap);
    return { leftSuns: left, rightSuns: right };
  }, [paddedSeed, gutterW, gutterH, isEmpty, isMobile, gutterCap]);

  // Aggregate count for a11y (screen readers get this, sighted users get the visual).
  // Prefer the true total (unbounded COUNT) passed in; seed.marks is LIMIT-bounded for
  // SSR payload so its length understates the real crowd (CB-24).
  const supporterCount = supporterCountProp ?? seed.marks.length;

  // Horizontal centre-fade mask: suns fade to transparent as they approach the content column.
  // The fade width is 30% of gutter width, min 30px max 140px — same logic as marks-bg.js setMask.
  const fadeW = Math.max(30, Math.min(140, gutterW * 0.6));

  // Layer wrapper: absolute, fixed height (= measured parent height), behind content, no pointer events.
  // We use a fixed pixel height (not 100%) so the layer reliably covers the full page regardless
  // of whether the parent has an explicit CSS height or only min-height.
  const layerStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: gutterH,
    zIndex: -1,
    pointerEvents: 'none',
    overflow: 'hidden',
    opacity: 0.95,
  };

  // Mobile: faint scatter field behind content
  if (isMobile) {
    // Static low-opacity marks scattered across the full layer
    const mobileMarks: React.ReactNode[] = [];
    const mobileCount = Math.min(60, Math.round(seed.marks.length * 0.4) || 20);
    for (let i = 0; i < mobileCount; i++) {
      const m = seed.marks[i % Math.max(1, seed.marks.length)];
      const grd = m ? m.gradient : COLD_GRADIENTS[i % COLD_GRADIENTS.length];
      const sz = 22 + (i % 3) * 8;
      const px = ((i * 137.5) % 100) + '%';
      const py = ((i * 97.3) % 100) + '%';
      mobileMarks.push(
        <span
          key={i}
          aria-hidden="true"
          style={{
            position: 'absolute',
            width: sz,
            height: sz,
            left: px,
            top: py,
            background: gradientFor(grd),
            ...logoMaskStyle,
            opacity: 0.17,
          }}
        />
      );
    }
    return (
      <>
        {/* Anchor for ResizeObserver — zero-size, outside aria-hidden */}
        <span ref={anchorRef} aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} />
        {/* Accessible aggregate — visually hidden */}
        <span
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            overflow: 'hidden',
            clip: 'rect(0 0 0 0)',
            whiteSpace: 'nowrap',
          }}
        >
          {supporterCount > 0
            ? `${supporterCount.toLocaleString()} supporter${supporterCount !== 1 ? 's' : ''} have left their mark`
            : 'Be the first to light this fundraiser up'}
        </span>
        <div aria-hidden="true" style={layerStyle}>
          {mobileMarks}
        </div>
        {/* CB-30: demo control — outside aria-hidden, bottom-left (avoids overlay pill at bottom-right) */}
        <SunsDemoControl value={effectiveFundedPct} onChange={setDemoFundedPct} />
      </>
    );
  }

  // Cold-start: deliberate "be the first" state — decorative suns filling the gutters evenly
  // (never reads empty — the "never empty" guardrail applies even to cold-start).
  // CB-12/CB-14: capped + evenly distributed, same as the populated state.
  if (isEmpty) {
    const coldCap = gutterCapFor(seed.density);
    const coldSizeBase = Math.round(40 + (1 - seed.density / 0.74) * 100);
    const coldDensePads = buildPaddingMarks(0, coldCap, coldSizeBase);
    const coldPaddedSeed = {
      ...seed,
      marks: coldDensePads,
    };
    const coldGutter = { w: gutterW, h: gutterH };
    const coldLeftSuns = coldDensePads.length > 0 ? packSuns(coldPaddedSeed, coldGutter, coldCap) : [];
    const coldRightSuns =
      coldDensePads.length > 0
        ? packSuns({ ...coldPaddedSeed, marks: [...coldDensePads].reverse() }, coldGutter, coldCap)
        : [];

    // Also keep the original 5 cold suns as a fallback/overlay (visible at bottom)
    const coldLeft: React.ReactNode[] = COLD_GRADIENTS.map((g, i) => (
      <ColdSunSpan
        key={`cold-l-${i}`}
        gradient={g}
        size={COLD_SIZES[i]}
        x={gutterW * 0.3 + (i % 3) * (gutterW * 0.25)}
        y={gutterH - 60 - i * 45}
      />
    ));
    const coldRight: React.ReactNode[] = COLD_GRADIENTS.map((g, i) => (
      <ColdSunSpan
        key={`cold-r-${i}`}
        gradient={g}
        size={COLD_SIZES[i]}
        x={gutterW * 0.7 - (i % 3) * (gutterW * 0.25)}
        y={gutterH - 60 - i * 45}
      />
    ));

    return (
      <>
        {/* Anchor for ResizeObserver — zero-size, outside aria-hidden */}
        <span ref={anchorRef} aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} />
        <span
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            overflow: 'hidden',
            clip: 'rect(0 0 0 0)',
            whiteSpace: 'nowrap',
          }}
        >
          Be the first to light this fundraiser up
        </span>
        <div aria-hidden="true" style={layerStyle}>
          {/* Left gutter cold suns */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: gutterW,
              height: gutterH,
              WebkitMaskImage: `linear-gradient(to right, #000 0, #000 ${Math.max(0, gutterW - fadeW)}px, transparent ${gutterW}px)`,
              maskImage: `linear-gradient(to right, #000 0, #000 ${Math.max(0, gutterW - fadeW)}px, transparent ${gutterW}px)`,
            }}
          >
            {/* Dense decorative suns via packSuns */}
            {coldLeftSuns.map((ps, i) => (
              <PlacedSunSpan
                key={`cold-packed-l-${i}`}
                ps={ps}
                reducedMotion={noMotion}
                layerH={gutterH}
                delay={((i * 0.13) % 0.5) + (1 - ps.y / gutterH) * 0.35}
              />
            ))}
            {/* Original 5 cold suns overlay at bottom */}
            {coldLeft}
          </div>
          {/* Right gutter cold suns */}
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: gutterW,
              height: gutterH,
              WebkitMaskImage: `linear-gradient(to left, #000 0, #000 ${Math.max(0, gutterW - fadeW)}px, transparent ${gutterW}px)`,
              maskImage: `linear-gradient(to left, #000 0, #000 ${Math.max(0, gutterW - fadeW)}px, transparent ${gutterW}px)`,
            }}
          >
            {coldRightSuns.map((ps, i) => (
              <PlacedSunSpan
                key={`cold-packed-r-${i}`}
                ps={ps}
                reducedMotion={noMotion}
                layerH={gutterH}
                delay={((i * 0.13) % 0.5) + (1 - ps.y / gutterH) * 0.35}
              />
            ))}
            {coldRight}
          </div>
          {/* Cold-start label */}
          <div
            style={{
              position: 'absolute',
              bottom: gutterH * 0.12,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--hrt-color-surface-brand-subtle)',
              border: '1px dashed var(--hrt-color-border-brand)',
              borderRadius: 'var(--hrt-size-radius-lg)',
              padding: '0.5rem 1rem',
              fontSize: 'var(--hrt-size-font-body-xs)',
              color: 'var(--hrt-color-text-brand-strong)',
              fontWeight: 700,
              textAlign: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            Be the first to light this up
          </div>
        </div>
        {/* CB-30: demo control — outside aria-hidden, bottom-left (avoids overlay pill at bottom-right) */}
        <SunsDemoControl value={effectiveFundedPct} onChange={setDemoFundedPct} />
      </>
    );
  }

  // Normal state: packed gutters with centre-fade mask
  return (
    <>
      {/* Anchor for ResizeObserver — zero-size, outside aria-hidden layer */}
      <span ref={anchorRef} aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} />
      {/* Accessible aggregate count — visually hidden, outside aria-hidden layer */}
      <span
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          whiteSpace: 'nowrap',
        }}
      >
        {supporterCount.toLocaleString()} supporter{supporterCount !== 1 ? 's' : ''} have left their mark
      </span>

      <div aria-hidden="true" style={layerStyle}>
        {/* Left gutter — fades toward the content column (right edge fades) */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: gutterW,
            height: gutterH,
            WebkitMaskImage: `linear-gradient(to right, #000 0, #000 ${Math.max(0, gutterW - fadeW)}px, transparent ${gutterW}px)`,
            maskImage: `linear-gradient(to right, #000 0, #000 ${Math.max(0, gutterW - fadeW)}px, transparent ${gutterW}px)`,
          }}
        >
          {leftSuns.map((ps, i) => (
            <PlacedSunSpan
              key={ps.mark.id + '-l-' + i}
              ps={ps}
              reducedMotion={noMotion}
              layerH={gutterH}
              // FIX #4: deterministic delay — no Math.random() in render (hydration mismatch)
              delay={((i * 0.13) % 0.5) + (1 - ps.y / gutterH) * 0.35}
            />
          ))}
        </div>

        {/* Right gutter — fades toward the content column (left edge fades) */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: gutterW,
            height: gutterH,
            WebkitMaskImage: `linear-gradient(to left, #000 0, #000 ${Math.max(0, gutterW - fadeW)}px, transparent ${gutterW}px)`,
            maskImage: `linear-gradient(to left, #000 0, #000 ${Math.max(0, gutterW - fadeW)}px, transparent ${gutterW}px)`,
          }}
        >
          {rightSuns.map((ps, i) => (
            <PlacedSunSpan
              key={ps.mark.id + '-r-' + i}
              ps={ps}
              reducedMotion={noMotion}
              layerH={gutterH}
              // FIX #4: deterministic delay
              delay={((i * 0.17) % 0.5) + (1 - ps.y / gutterH) * 0.35}
            />
          ))}
        </div>
      </div>
      {/* CB-30: demo control — outside aria-hidden, bottom-left (avoids overlay pill at bottom-right).
          Renders null when NEXT_PUBLIC_DEMO_MODE !== 'true'. */}
      <SunsDemoControl value={effectiveFundedPct} onChange={setDemoFundedPct} />
    </>
  );
}
