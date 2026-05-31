'use client';

/**
 * MobileFrameToggle — CB-58 demo-only "preview any page in a mobile frame" control.
 *
 * DEMO-GATED: the toggle button renders only when NEXT_PUBLIC_DEMO_MODE === 'true'
 * (via isDemoMode()). When demo is off it is a transparent pass-through — it just
 * renders {children} full-width with no chrome, exactly like the page renders today.
 *
 * Self-contained: mounted ONCE in app/layout.tsx wrapping {children} (inside
 * OverlayProvider), so no page-component edits are needed. The pages keep their
 * existing responsive CSS; constraining the wrapper width to ~390px makes those
 * mobile breakpoints fire, and the SunsLayer's <700px mobile scatter mode kicks in,
 * so the faded background suns are retained inside the frame.
 *
 * Positioning (no overlap with sibling demo chrome):
 *   - OverlayPill lives bottom-right ([data-overlay-pill]).
 *   - SunsDemoControl lives bottom-left ([data-demo-control]).
 *   - This toggle sits TOP-RIGHT (below the unified nav) — a distinct corner.
 *   - data-overlay-ignore so the overlay measurement scan skips it.
 *
 * Hydration safety:
 *   - Frame state starts OFF on both SSR and the first client render → identical
 *     markup, no hydration mismatch. The toggle is pure client state thereafter.
 *   - When OFF we render {children} directly (no wrapper element), so the page
 *     tree is byte-identical to the no-toggle baseline on first paint.
 */

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { isDemoMode } from '@/lib/personas/loader';

/**
 * CB-66: product routes where the mobile-view pill is allowed.
 * Pattern: starts with /f/, /communities/, or /u/.
 * The pill is hidden on / (deck) and /dashboard.
 */
function isProductRoute(pathname: string | null): boolean {
  // usePathname() can be null (e.g. during render in the test env / before hydration).
  // Guard so a null path never throws — treat unknown route as non-product (pill hidden).
  if (!pathname) return false;
  return (
    pathname.startsWith('/f/') ||
    pathname.startsWith('/communities/') ||
    pathname.startsWith('/u/')
  );
}

// Phone bezel geometry — mirrors mocks/mobile.html (.phone is 390px wide).
const FRAME_WIDTH = 390; // px — triggers the pages' mobile breakpoints + SunsLayer scatter

interface MobileFrameToggleProps {
  children: React.ReactNode;
}

export function MobileFrameToggle({ children }: MobileFrameToggleProps): JSX.Element {
  // Starts OFF on SSR + first client render → no hydration mismatch.
  const [frameOn, setFrameOn] = useState(false);
  const pathname = usePathname();

  // CB-94/CB-95: the mobile-frame toggle exists to PREVIEW the mobile frame on a DESKTOP
  // viewport — it's redundant on an already-narrow screen, and at the top-right it overlaps
  // the fundraiser donate bar's "Donate" button (covering it → unclickable on mobile). It is
  // hidden ≤700px via a CSS media query (see globals.css `[data-mobile-frame-toggle]`) — pure
  // CSS so it's instant + SSR-correct (no post-mount effect timing flake; `!important` beats
  // the inline display). The DOM node stays present (the CB-66 jsdom test asserts presence).

  // When demo mode is off, this component is a no-op pass-through: full-width page,
  // no toggle chrome. (We still render the children so the layout is unaffected.)
  if (!isDemoMode()) {
    return <>{children}</>;
  }

  // CB-66: pill must only appear on product pages (/f/*, /communities/*, /u/*).
  // On / (deck) and /dashboard the pill is hidden; the frame wrapper + children
  // still render normally — only the toggle button (pill) is suppressed.
  const showPill = isProductRoute(pathname);

  const toggleStyle: React.CSSProperties = {
    // TOP-RIGHT corner — distinct from the overlay pill (bottom-right) and the
    // suns funding slider (bottom-left). Nudged down so it clears the unified nav.
    position: 'fixed',
    top: 'calc(var(--hrt-size-spacing-8, 4rem) + env(safe-area-inset-top))',
    right: 'max(var(--hrt-size-spacing-2, 0.5rem), env(safe-area-inset-right))',
    zIndex: 1000,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--hrt-size-spacing-1, 0.25rem)',
    minHeight: 'var(--hrt-size-spacing-5, 2.5rem)',
    padding: 'var(--hrt-size-spacing-1, 0.25rem) var(--hrt-size-spacing-2, 0.5rem)',
    borderRadius: 'var(--hrt-size-radius-full, 999px)',
    fontSize: 'var(--hrt-size-font-body-xs, 11px)',
    fontWeight: 'var(--hrt-font-weight-bold, 700)' as React.CSSProperties['fontWeight'],
    background: frameOn ? '#232323' : 'var(--hrt-color-surface-neutral-subtle, #f5f5f5)',
    color: frameOn ? '#fff' : 'var(--hrt-color-text-supporting, #555)',
    border: frameOn ? 'none' : '1px solid var(--hrt-color-border-neutral, #d0d0d0)',
    boxShadow: 'var(--hrt-shadow-medium, 0 2px 8px rgba(0,0,0,0.12))',
    cursor: 'pointer',
    fontFamily: 'inherit',
  };

  return (
    <>
      {/* CB-66: pill only renders on product routes (/f/*, /communities/*, /u/*).
          Hidden on / (deck) and /dashboard. The frame toggle state resets
          implicitly via React reconciliation when the pill is absent. */}
      {showPill && (
        <button
          type="button"
          data-mobile-frame-toggle=""
          data-overlay-ignore="true"
          aria-pressed={frameOn}
          aria-label={frameOn ? 'Mobile preview on — exit mobile view' : 'Preview in mobile view'}
          style={toggleStyle}
          onClick={() => setFrameOn((on) => !on)}
        >
          <PhoneGlyph />
          <span>{frameOn ? 'Mobile view' : 'Mobile view'}</span>
        </button>
      )}

      {frameOn && showPill ? (
        // CB-96: the phone frame is a real IFRAME at FRAME_WIDTH loading the SAME route, so the
        // page gets a genuine narrow viewport → its viewport @media queries + Tailwind responsive
        // classes actually fire (true mobile layout). Constraining a container's WIDTH alone
        // does NOT trigger viewport media queries, which is why the old wrap-children approach
        // rendered the squeezed DESKTOP layout (e.g. profile showed only the PYMK column).
        // Recursion-safe: the inner page's toggle pill is auto-hidden by the ≤700px CSS gate
        // (CB-94) and its frameOn starts false (no nested frame).
        <div
          data-mobile-frame-backdrop=""
          aria-label="Mobile preview frame"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 900, // above content, below the toggle (1000) and overlay pill/menu
            background: 'var(--hrt-color-surface-neutral-subtle, #ececec)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: 'var(--hrt-size-spacing-6, 2rem) var(--hrt-size-spacing-2, 0.5rem)',
            overflow: 'auto',
          }}
        >
          {/* Device bezel — the element that constrains the page to phone width. */}
          <div
            data-mobile-frame="on"
            style={{
              position: 'relative',
              width: FRAME_WIDTH,
              maxWidth: `${FRAME_WIDTH}px`,
              maxHeight: '90vh',
              background: '#0b0b0c',
              borderRadius: 52,
              padding: 13,
              boxShadow:
                'var(--hrt-shadow-strong, 0 24px 64px rgba(0,0,0,0.4)), inset 0 0 0 2px #2a2a2c',
              boxSizing: 'border-box',
            }}
          >
            {/* Screen — a real iframe at phone width so the page renders TRUE mobile layout
                (its own viewport → @media + responsive classes fire). Scrolls internally. */}
            <iframe
              data-mobile-frame-screen=""
              title="Mobile preview"
              src={typeof window !== 'undefined' ? window.location.pathname + window.location.search : ''}
              style={{
                display: 'block',
                width: '100%',
                maxWidth: `${FRAME_WIDTH}px`,
                height: 'calc(90vh - 26px)',
                border: 0,
                borderRadius: 40,
                background: 'var(--hrt-color-surface-default, #fff)',
              }}
            />
          </div>
        </div>
      ) : (
        // OFF: identical to the no-toggle baseline — children render full-width,
        // no wrapper element (keeps SSR/first-render markup unchanged).
        children
      )}
    </>
  );
}

/** Simple phone glyph for the toggle button. */
function PhoneGlyph(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true">
      <rect
        x="7"
        y="2"
        width="10"
        height="20"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <line x1="11" y1="18.5" x2="13" y2="18.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
