'use client';
// OverlayLayer — dim layer + tier highlights + MetricBlob orchestration.
// design-overlay.md — "The overlay" + "The metric blob" + "Data the overlay reads" sections.
//
// Prev/next blob stepping:
//   MetricBlob dispatches CustomEvent 'overlay-step' with detail.direction = 'prev'|'next'.
//   OverlayLayer listens for it and advances regionIndex, re-rendering MetricBlob with new attrs.
//   This keeps MetricBlobProps frozen (no onPrev/onNext props) while giving the blob's
//   ◂ ▸ buttons real behavior. See MetricBlob.tsx for the dispatch site.
//
// Click interception (capture phase):
//   While overlay is ON, ALL clicks are captured before they reach their targets.
//   - Click on the pill (data-overlay-pill) → ignored (pill handles itself at z-index 1000+).
//   - Click on a [data-overlay-tier] region → open MetricBlob for that region, stop propagation.
//   - Click anywhere else on the dim → absorbed (stop propagation, do nothing).
//   Underlying donate/share/follow actions do NOT fire while overlay is ON.
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useOverlay } from '@/lib/overlay/context';
import type { OverlayAttrs } from '@/lib/overlay/types';
import { MetricBlob } from './MetricBlob';

interface HighlightRegion {
  el: Element;
  attrs: OverlayAttrs;
  regionLabel: string;
  rect: DOMRect;
}

// Read OverlayAttrs off an element. Returns null if data-overlay-tier is missing.
function readAttrs(el: Element): OverlayAttrs | null {
  const tier = el.getAttribute('data-overlay-tier') as OverlayAttrs['data-overlay-tier'] | null;
  if (!tier) return null;
  return {
    'data-overlay-tier': tier,
    'data-overlay-events': el.getAttribute('data-overlay-events') ?? '',
    'data-overlay-delta': (el.getAttribute('data-overlay-delta') ?? 'D1') as OverlayAttrs['data-overlay-delta'],
    'data-overlay-metric': el.getAttribute('data-overlay-metric') ?? '',
    'data-overlay-why': el.getAttribute('data-overlay-why') ?? '',
    'data-overlay-dashboard': (el.getAttribute('data-overlay-dashboard') ?? 'donate-funnel') as OverlayAttrs['data-overlay-dashboard'],
  };
}

// Check prefers-reduced-motion once per render (not inside effects so it is stable).
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// CB-35: detect top-bar / nav elements that must not be highlighted.
// An element is a top-bar candidate if it:
//   a) is inside a <nav> or [role="banner"], OR
//   b) has computed position: fixed|sticky AND its bounding rect top is within
//      TOP_BAR_THRESHOLD px of the viewport top.
// This is purely structural — no edits to nav/header files required.
const TOP_BAR_THRESHOLD = 80; // px from viewport top considered a "top bar"

function isTopBarElement(el: Element): boolean {
  // (a) Inside a <nav> or [role="banner"]
  if (el.closest('nav') !== null) return true;
  if (el.closest('[role="banner"]') !== null) return true;

  // (b) Computed position is fixed/sticky AND near the top of the viewport
  if (typeof window !== 'undefined' && el instanceof HTMLElement) {
    const pos = window.getComputedStyle(el).position;
    if (pos === 'fixed' || pos === 'sticky') {
      const rect = el.getBoundingClientRect();
      if (rect.top >= 0 && rect.top < TOP_BAR_THRESHOLD) return true;
    }
  }
  return false;
}

// CB-68: resolve a region's on-screen rect. <Instrumented> wraps in `display:contents`
// (no layout box → getBoundingClientRect all-zero), so fall back to the UNION of the
// element's laid-out descendants. Returns null when nothing is rendered (hidden) → skip.
function regionRect(el: Element): DOMRect | null {
  const own = el.getBoundingClientRect();
  let raw: DOMRect | null = (own.width > 0 || own.height > 0) ? own : null;
  if (!raw) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, found = false;
    for (const child of Array.from(el.querySelectorAll('*'))) {
      const r = child.getBoundingClientRect();
      if (r.width > 0 || r.height > 0) {
        found = true;
        if (r.left < minX) minX = r.left;
        if (r.top < minY) minY = r.top;
        if (r.right > maxX) maxX = r.right;
        if (r.bottom > maxY) maxY = r.bottom;
      }
    }
    raw = found ? new DOMRect(minX, minY, maxX - minX, maxY - minY) : null;
  }
  if (!raw) return null;
  // CB-102: clamp to the viewport. A region wrapping a horizontally-scrollable carousel can
  // have a rect far wider than the screen (its off-screen cards) — on mobile that produced a
  // cutout hole wider/taller than the viewport, blowing out the dim so highlights didn't pop
  // ("shaded like the rest"). Desktop rects already sit within the wide viewport, so unchanged.
  if (typeof window === 'undefined') return raw;
  const vw = window.innerWidth, vh = window.innerHeight;
  const left = Math.max(0, Math.min(raw.left, vw));
  const top = Math.max(0, Math.min(raw.top, vh));
  const right = Math.max(0, Math.min(raw.right, vw));
  const bottom = Math.max(0, Math.min(raw.bottom, vh));
  return new DOMRect(left, top, Math.max(0, right - left), Math.max(0, bottom - top));
}

// CB-26: exported for unit testing. Compute clamped top/left for the blob card
// so it never overflows the viewport on any side.
// Returns { top, left } both guaranteed within [GAP, dim - size - GAP].
export function clampBlobPosition(
  rect: { top: number; bottom: number; left: number },
  innerWidth: number,
  innerHeight: number,
  blobWidth: number,
  blobHeight: number,
  gap: number,
): { top: number; left: number } {
  // Prefer placing below the region; fall back to above if it would overflow bottom.
  const belowTop = rect.bottom + gap;
  let top: number;
  if (belowTop + blobHeight <= innerHeight - gap) {
    top = belowTop;
  } else {
    // Place above; clamp so it doesn't go above gap.
    top = rect.top - blobHeight - gap;
  }
  // Clamp into [gap, innerHeight - blobHeight - gap]
  top = Math.max(gap, Math.min(top, innerHeight - blobHeight - gap));

  // Horizontal: align to region left, clamped to [gap, innerWidth - blobWidth - gap]
  const left = Math.max(gap, Math.min(rect.left, innerWidth - blobWidth - gap));

  return { top, left };
}

export function OverlayLayer(): JSX.Element | null {
  const { demoMode, overlayOn } = useOverlay();
  const pathname = usePathname();

  // All visible [data-overlay-tier] regions in DOM order.
  const [regions, setRegions] = useState<HighlightRegion[]>([]);
  // Which region's blob is open (-1 = none).
  const [activeIndex, setActiveIndex] = useState(-1);
  // rects version key — bumped on scroll/resize so highlight boxes recompute.
  const [rectsKey, setRectsKey] = useState(0);

  const rafRef = useRef<number | null>(null);
  const reducedMotion = prefersReducedMotion();

  // Scan DOM and build regions list.
  const buildRegions = useCallback(() => {
    const nodes = Array.from(document.querySelectorAll<Element>('[data-overlay-tier]'));
    const next: HighlightRegion[] = [];
    for (const el of nodes) {
      // Skip if not visible (no layout box).
      if (!(el instanceof HTMLElement) && !(el instanceof SVGElement)) continue;
      // CB-68: <Instrumented> wraps regions in `display:contents` (no layout box), so
      // getClientRects() is empty and getBoundingClientRect() is all-zero — which used to
      // skip EVERY instrumented region (only ~2 raw-div regions highlighted). regionRect()
      // resolves the real box as the union of laid-out descendants; null = genuinely hidden.
      const rect = regionRect(el);
      if (!rect) continue;
      const attrs = readAttrs(el);
      if (!attrs) continue;

      // CB-35: skip elements inside a <nav>, [role="banner"], or any fixed/sticky
      // top bar (position: fixed|sticky AND rect.top near 0).
      // This is structural — no edits needed to nav files.
      if (isTopBarElement(el)) continue;

      const regionLabel =
        el.getAttribute('data-overlay-region') ??
        attrs['data-overlay-metric'] ??
        'element';
      next.push({ el, attrs, regionLabel, rect });
    }
    setRegions(next);
  }, []);

  // Throttled recompute of rects on scroll/resize.
  const scheduleRecompute = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      // Re-read rects from existing elements (regionRect handles display:contents wrappers).
      setRegions((prev) =>
        prev.map((r) => ({ ...r, rect: regionRect(r.el) ?? r.rect })),
      );
      setRectsKey((k) => k + 1);
    });
  }, []);

  // Activate / deactivate overlay.
  useEffect(() => {
    if (!demoMode) return;
    if (overlayOn) {
      buildRegions();
    } else {
      setRegions([]);
      setActiveIndex(-1);
    }
  }, [demoMode, overlayOn, buildRegions]);

  // Re-scan when persona changes (slots collapse/expand shifting rects).
  // We listen for the storage 'overlayPersona' key change which the context already mirrors,
  // but the simplest hook is to rebuild whenever overlayOn is true and regions is non-empty.
  // The context will re-render us on persona change so buildRegions will re-fire.
  useEffect(() => {
    if (overlayOn && demoMode) buildRegions();
  }, [overlayOn, demoMode, buildRegions]);

  // Scroll + resize listeners.
  useEffect(() => {
    if (!overlayOn) return;
    window.addEventListener('scroll', scheduleRecompute, { passive: true });
    window.addEventListener('resize', scheduleRecompute, { passive: true });
    return () => {
      window.removeEventListener('scroll', scheduleRecompute);
      window.removeEventListener('resize', scheduleRecompute);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [overlayOn, scheduleRecompute]);

  // MetricBlob prev/next stepping via CustomEvent from MetricBlob's ◂ ▸ buttons.
  // CB-48: skip regions whose element has no valid on-page rect (zero-area or detached).
  //        Advance in the requested direction until a region with non-zero area is found.
  //        This prevents empty-target cards from causing a scroll/jump.
  useEffect(() => {
    if (!overlayOn) return;
    function onStep(e: Event) {
      const { direction } = (e as CustomEvent<{ direction: 'prev' | 'next' }>).detail;
      setActiveIndex((idx) => {
        if (idx < 0 || regions.length === 0) return idx;
        const step = direction === 'prev' ? -1 : 1;
        let next = (idx + step + regions.length) % regions.length;
        // Walk at most regions.length steps to find a valid (non-zero-area) region.
        for (let attempts = 0; attempts < regions.length; attempts++) {
          const r = regions[next].el.getBoundingClientRect();
          if (r.width > 0 || r.height > 0) return next;
          next = (next + step + regions.length) % regions.length;
        }
        // All regions have zero area — stay put.
        return idx;
      });
    }
    window.addEventListener('overlay-step', onStep);
    return () => window.removeEventListener('overlay-step', onStep);
  }, [overlayOn, regions]);

  // Click interception (capture phase, whole document).
  useEffect(() => {
    if (!overlayOn) return;
    // CB-18: the overlay is fully suppressed on /dashboard (see the `return null` below). The
    // render guard runs AFTER hooks, so without this check the capture handler would still
    // install and stopPropagation()/preventDefault() every click on the dashboard while
    // overlayOn is persisted true — silently swallowing the demo-data toggle (and every other
    // control) with NO visible dim to explain why ("the button isn't working").
    if (pathname?.startsWith('/dashboard')) return;

    function onClickCapture(e: MouseEvent) {
      const target = e.target as Element | null;
      if (!target) return;

      // Let clicks on the pill through — it carries data-overlay-pill or is at z-index 1000.
      if (target.closest('[data-overlay-pill]')) return;

      // Let clicks inside the MetricBlob card through — the card sits at z-index 1002 and
      // is interactive (close button, nav buttons, dashboard link). Without this exception
      // the capture handler swallows the "See this on the dashboard →" anchor click.
      if (target.closest('.ov-blob-card')) return;

      // Prevent ALL underlying actions first.
      e.stopPropagation();
      e.preventDefault();

      // The dim layer (position:fixed, zIndex:900, pointerEvents:all) is the top-most
      // clickable surface while the overlay is ON. Clicks always land on the dim, never
      // directly on the underlying [data-overlay-tier] elements. We must therefore use
      // coordinate-based hit testing against each region's bounding rect.
      const cx = e.clientX;
      const cy = e.clientY;

      // First try element ancestry (works if somehow the target IS a tier element).
      const regionEl = target.closest('[data-overlay-tier]');
      if (regionEl) {
        const idx = regions.findIndex((r) => r.el === regionEl);
        if (idx >= 0) {
          setActiveIndex(idx);
          return;
        }
      }

      // Coordinate hit test against all known regions.
      // CB-84: use regionRect(el) instead of el.getBoundingClientRect() so that
      // display:contents wrappers (<Instrumented>) are resolved to their children's
      // union rect — same as buildRegions does. Raw getBoundingClientRect() on a
      // display:contents element is always zero, making those highlights dead on click.
      const hitIdx = regions.findIndex(({ el }) => {
        const r = regionRect(el);
        if (!r) return false;
        return cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;
      });
      if (hitIdx >= 0) {
        setActiveIndex(hitIdx);
        return;
      }

      // Click on the dim away from any instrumented region — absorbed, close any open blob.
      setActiveIndex(-1);
    }

    document.addEventListener('click', onClickCapture, { capture: true });
    return () => document.removeEventListener('click', onClickCapture, { capture: true });
  }, [overlayOn, regions, pathname]);

  // CB-18: suppress the overlay on /dashboard to keep the internal analytics surface clean.
  // We do NOT write to localStorage — the user's prior overlay state is preserved so
  // returning to a product page restores it automatically.
  if (pathname?.startsWith('/dashboard')) return null;

  if (!demoMode || !overlayOn) return null;

  // CB-17: highlights must visually pop above the dim scrim. Use a consistent 3px outline
  // on all breakpoints (was 2px on desktop) so the bright ring is unmistakably above the tint.
  const outlineWidth = 3;
  const activeRegion = activeIndex >= 0 ? regions[activeIndex] : null;

  return (
    <>
      {/* Dim scrim with highlight cut-outs (CB-17).
          A single masked SVG paints the dim EVERYWHERE EXCEPT the instrumented
          regions: a white full-screen mask rect with black rects punched at each
          highlight's viewport rect. Black mask pixels hide the dim, so the real
          page content shows at FULL brightness inside each highlight — the regions
          visibly pop above the scrim while the rest of the page stays dimmed.
          (Previously a flat inset:0 tint covered the highlights too, so they read
          as dimmed — the CB-17 defect.) CB-99: pointerEvents:'none' so the scrim does
          NOT block touch-scroll on mobile — the document capture-phase click handler
          still intercepts TAPS by coordinate (a tap fires a `click` it preventDefaults;
          a scroll is `touchmove`, never a click, so scrolling passes through). */}
      <svg
        aria-hidden="true"
        width="100%"
        height="100%"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 900,
          pointerEvents: 'none',
        }}
      >
        <defs>
          <mask id="ov-dim-cutout">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {regions.map((region, i) => {
              const { rect } = region;
              return (
                <rect
                  key={i}
                  x={rect.left}
                  y={rect.top}
                  width={rect.width}
                  height={rect.height}
                  rx={8}
                  fill="black"
                />
              );
            })}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          mask="url(#ov-dim-cutout)"
          style={{ fill: 'var(--overlay-dim)' }}
        />
      </svg>

      {/* Highlight boxes — absolutely positioned over each instrumented region */}
      {regions.map((region, i) => {
        const { rect, attrs } = region;
        const tier = attrs['data-overlay-tier'];
        const outlineColor =
          tier === '1'
            ? 'var(--overlay-tier1-outline)'
            : 'var(--overlay-tier2-outline)';
        const glowColor =
          tier === '1'
            ? 'var(--overlay-tier1-glow)'
            : 'var(--overlay-tier2-glow)';

        // Positioned relative to the viewport.
        const style: React.CSSProperties = {
          position: 'fixed',
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          zIndex: 901,
          outline: `${outlineWidth}px solid ${outlineColor}`,
          borderRadius: 'var(--hrt-size-radius-md)',
          boxShadow: reducedMotion ? 'none' : `0 0 12px ${glowColor}`,
          pointerEvents: 'none', // clicks fall through to the capture handler above
          cursor: 'pointer',
        };

        return (
          <div
            key={i}
            aria-label={`Show metric for ${region.regionLabel}`}
            style={style}
          />
        );
      })}

      {/* MetricBlob — rendered when a region is active */}
      {activeRegion && (
        <BlobPositioner
          region={activeRegion}
          regionIndex={activeIndex}
          regionCount={regions.length}
          onClose={() => setActiveIndex(-1)}
          rectsKey={rectsKey}
        />
      )}
    </>
  );
}

// Positions the blob near the target region and renders MetricBlob.
interface BlobPositionerProps {
  region: HighlightRegion;
  regionIndex: number;
  regionCount: number;
  onClose: () => void;
  rectsKey: number; // consumed to trigger position recalc on scroll/resize
}

function BlobPositioner({
  region,
  onClose,
}: BlobPositionerProps): JSX.Element {
  const BLOB_WIDTH = 360;
  const BLOB_HEIGHT_EST = 240; // estimate before paint
  const GAP = 8;

  let top: number | undefined;
  let left: number | undefined;

  if (typeof window !== 'undefined' && window.innerWidth >= 768) {
    // CB-26: use clampBlobPosition so card + controls always stay fully within viewport.
    const pos = clampBlobPosition(
      region.rect,
      window.innerWidth,
      window.innerHeight,
      BLOB_WIDTH,
      BLOB_HEIGHT_EST,
      GAP,
    );
    top = pos.top;
    left = pos.left;
  }
  // On mobile, CSS bottom-sheet override handles positioning (see MetricBlob.tsx style tag).

  return (
    <div
      style={{
        position: 'fixed',
        top: top ?? undefined,
        left: left ?? undefined,
        zIndex: 1002,
        pointerEvents: 'all',
      }}
    >
      <MetricBlob
        source={{
          kind: 'overlay',
          attrs: region.attrs,
          regionLabel: region.regionLabel,
        }}
        onClose={onClose}
      />
    </div>
  );
}
