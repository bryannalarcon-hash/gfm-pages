'use client';

/**
 * SunsDemoControl — CB-30 demo-only funding-% slider.
 *
 * DEMO-GATED: renders null unless NEXT_PUBLIC_DEMO_MODE === 'true'.
 * Allows overriding `fundedPct` (0–100%) to drive sun sparsity + size live:
 *   - less filled  → SPARSER (fewer suns) + LARGER radii
 *   - more filled  → DENSER  (more suns)  + SMALLER radii
 *
 * Positioning:
 *   - Bottom-left corner to avoid the overlay pill ([data-overlay-pill]) at bottom-right.
 *   - `data-demo-control` + `data-overlay-ignore` attributes so layout/overlay systems
 *     know this element is not page content and should not affect measurement.
 *   - pointer-events: auto (it must be interactive) but z-index above the gutter layer
 *     (z-index: -1) and below the main content stack.
 *
 * Styling:
 *   - Uses only design-system tokens (--hrt-*) — no green CTA on white, no hardcoded hex.
 *   - Neutral surface with a subdued border; the slider thumb uses the brand accent token.
 *
 * Accessibility:
 *   - The <input type="range"> has an aria-label and aria-valuetext so screen readers
 *     announce "Funding 35%" correctly.
 *   - The control itself is not aria-hidden — a demo operator needs to interact with it.
 *
 * CLS / hydration safety:
 *   - Component is client-only ('use client') and mounts after hydration.
 *   - The parent (SunsLayer) starts from seed.fundedPct (SSR value) and only switches to
 *     the user's override after the first onChange interaction — no hydration mismatch.
 */

import React from 'react';

export interface SunsDemoControlProps {
  /** Current funding percentage (0–1) shown on the slider */
  value: number;
  /** Called with new 0–1 value whenever the slider moves */
  onChange: (pct: number) => void;
}

/**
 * Demo slider for the funding percentage that drives sun sparsity and size.
 * Returns null when NEXT_PUBLIC_DEMO_MODE is not 'true'.
 */
export function SunsDemoControl({ value, onChange }: SunsDemoControlProps) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') return null;

  const pct = Math.round(value * 100);

  return (
    <div
      data-demo-control="suns-funded-pct"
      data-overlay-ignore="true"
      style={{
        position: 'fixed',
        bottom: '1.25rem',
        left: '1.25rem',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.375rem',
        background: 'var(--hrt-color-surface-neutral-subtle, #f5f5f5)',
        border: '1px solid var(--hrt-color-border-neutral, #d0d0d0)',
        borderRadius: 'var(--hrt-size-radius-lg, 10px)',
        padding: '0.625rem 0.875rem',
        minWidth: '180px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
        // pointer-events auto — user must interact with this control
        pointerEvents: 'auto',
      }}
    >
      {/* Label row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          fontSize: 'var(--hrt-size-font-body-xs, 11px)',
          color: 'var(--hrt-color-text-subtle, #666)',
          fontWeight: 600,
          letterSpacing: '0.02em',
          userSelect: 'none',
        }}
      >
        <span>Demo: funding %</span>
        <span
          style={{
            fontVariantNumeric: 'tabular-nums',
            color: 'var(--hrt-color-text-default, #1a1a1a)',
            minWidth: '2.5ch',
            textAlign: 'right',
          }}
        >
          {pct}%
        </span>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={pct}
        aria-label="Funding percentage (demo)"
        aria-valuetext={`${pct}% funded`}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        style={{
          // Use the native range input; accent-color applies the brand token for the thumb/track.
          // accent-color is supported in all modern browsers; falls back to the OS default.
          accentColor: 'var(--hrt-color-surface-brand-strong, #4a9d44)',
          width: '100%',
          margin: 0,
          cursor: 'pointer',
        }}
      />

      {/* Sparse ↔ Dense hint */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 'var(--hrt-size-font-body-xs, 10px)',
          color: 'var(--hrt-color-text-subtle, #999)',
          userSelect: 'none',
        }}
      >
        <span>sparse + large</span>
        <span>dense + small</span>
      </div>
    </div>
  );
}
