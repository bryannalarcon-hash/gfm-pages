'use client';

/**
 * SunMark — renders ONE sun mark: the GoFundMe rising-sun logo as a CSS mask
 * filled with a curated gradient. Decorative / aria-hidden.
 *
 * Guardrails honored (feature-contribution-board.md §3):
 *  - Logo mask primitive only (not a freeform drawing surface)
 *  - Gradient filled from SUN_GRADIENTS — no free hex
 *  - Size from props (r), never user-controlled
 *  - No dollar figures anywhere in DOM
 *  - isOwn → ring + "Your sun" label
 *  - isSharer → subtle dot marker
 *  - Animations: follow=static, share=wobble (own gradient), give=bolder wobble (own gradient)
 *  - ALL animations suppressed under reducedMotion
 *  - CB-31: animation uses mark's own gradient via CSS custom props — no hardcoded color override
 *  - CB-42: initials rendered on consented (displayName≠null) suns only — anonymous = none
 */

import { SunMark as SunMarkType, SUN_GRADIENTS } from '@/lib/marks/types';
import { logoMaskStyle } from '@/lib/marks/logoMask';

// CB-31: Wobble-only keyframes — color is always the sun's own gradient (set via inline style).
// Previously sunMarkColorShift cycled hardcoded hex values (brand→teal→gold) regardless of
// mark.gradient, causing every animated sun to collapse to the same color rotation.
// Fix: remove the background-overriding color-shift keyframe; keep wobble only so the sun's
// own gradient (from SUN_GRADIENTS[mark.gradient], set as inline background) always shows through.
const ANIMATION_CSS = `
@keyframes sunMarkWobble {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.22); }
}
@keyframes sunMarkWobbleBig {
  0%, 100% { transform: scale(1.05); }
  50%       { transform: scale(1.5); }
}
`;

// Inject animation CSS once into the document head (client-only, idempotent).
let animStyleInjected = false;
function ensureAnimStyles(): void {
  if (animStyleInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.dataset['sunMarkAnims'] = '1';
  el.textContent = ANIMATION_CSS;
  document.head.appendChild(el);
  animStyleInjected = true;
}

interface SunMarkProps {
  mark: SunMarkType;
  /** Radius in pixels — system-placed, never user-controlled */
  r: number;
  reducedMotion?: boolean;
  /** Absolute position (used by SunsLayer) */
  style?: React.CSSProperties;
}

export function SunMark({ mark, r, reducedMotion = false, style }: SunMarkProps) {
  // Inject animations on first client render
  if (typeof window !== 'undefined') {
    ensureAnimStyles();
  }

  const { from, to } = SUN_GRADIENTS[mark.gradient];
  const size = r * 2;

  // Determine animation: share → wobble; give → larger wobble.
  // CB-31: color-shift animation removed — it overrode mark.gradient with hardcoded colors.
  // The sun's gradient (from SUN_GRADIENTS[mark.gradient]) is always the inline background;
  // only the scale wobble is animated so color fidelity is preserved per curated gradient.
  const hasGive = mark.actions.includes('give');
  const hasShare = mark.actions.includes('share');

  let animationStyle: React.CSSProperties = {};
  if (!reducedMotion) {
    if (hasGive) {
      animationStyle = {
        animation: 'sunMarkWobbleBig 2.6s ease-in-out infinite',
      };
    } else if (hasShare) {
      animationStyle = {
        animation: 'sunMarkWobble 2.2s ease-in-out infinite',
      };
    }
  }

  // CB-42: derive initials from displayName (consent gate — only when non-null).
  // "Mike T." → "MT"; "Sarah K." → "SK"; "Carlos" → "C".
  // No dollar figures, no full name in rendered text — initials only (≤3 chars).
  const initials: string | null = mark.displayName
    ? mark.displayName
        .trim()
        .split(/\s+/)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .filter(Boolean)
        .slice(0, 3)
        .join('')
    : null;

  const baseStyle: React.CSSProperties = {
    display: 'inline-block',
    width: size,
    height: size,
    flexShrink: 0,
    background:
      mark.gradient === 'grey'
        ? 'var(--hrt-color-border-neutral)'
        : `linear-gradient(135deg, ${from}, ${to})`,
    ...logoMaskStyle,
    position: 'absolute',
    ...animationStyle,
    ...style,
  };

  // Ring + "Your sun" label for isOwn
  const ringSize = size + 16;
  const ringStyle: React.CSSProperties = {
    position: 'absolute',
    width: ringSize,
    height: ringSize,
    left: style?.left != null ? (style.left as number) - 8 : -8,
    top: style?.top != null ? (style.top as number) - 8 : -8,
    borderRadius: '50%',
    border: '3px solid var(--hrt-color-surface-brand)',
    boxShadow: '0 0 0 4px rgba(74,157,68,0.18)',
    pointerEvents: 'none',
  };

  const youLabelStyle: React.CSSProperties = {
    position: 'absolute',
    left: style?.left != null ? (style.left as number) + r : r,
    top: style?.top != null ? (style.top as number) - r - 12 : -r - 12,
    transform: 'translateX(-50%)',
    background: 'var(--hrt-color-surface-brand-strong)',
    color: '#fff',
    fontSize: '10px',
    fontWeight: 'var(--hrt-font-weight-bold)' as string,
    padding: '2px 7px',
    borderRadius: 'var(--hrt-size-radius-full)' as string,
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
  };

  // Sharer marker: a small dot badge
  const sharerDotStyle: React.CSSProperties = {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: 'var(--hrt-color-surface-brand)',
    border: '1.5px solid #fff',
    left: style?.left != null ? (style.left as number) + size - 6 : size - 6,
    top: style?.top != null ? (style.top as number) - 2 : -2,
    pointerEvents: 'none',
  };

  // CB-42: initials overlay — centered on the upper half-circle (the rising dome).
  // Positioned at the top-center of the sun span; font sized to ~35% of diameter.
  // Rendered ONLY when displayName is non-null (consent gate). aria-hidden — decorative.
  const initialsStyle: React.CSSProperties | null = initials
    ? {
        position: 'absolute',
        // Center horizontally over the sun; vertically at ~20% from top (dome center)
        left: style?.left != null ? (style.left as number) + r : r,
        top: style?.top != null ? (style.top as number) + size * 0.22 : size * 0.22,
        transform: 'translateX(-50%)',
        fontSize: Math.max(8, Math.round(size * 0.32)),
        fontWeight: 700,
        color: mark.gradient === 'grey' ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.88)',
        lineHeight: 1,
        pointerEvents: 'none',
        userSelect: 'none',
        letterSpacing: '0.04em',
      }
    : null;

  return (
    <>
      {/* The mark itself — aria-hidden, decorative */}
      <span
        aria-hidden="true"
        style={baseStyle}
        data-mark-id={mark.id}
        data-gradient={mark.gradient}
      />
      {/* CB-42: initials — only when displayName is non-null (consent gate).
          aria-hidden: decorative. No dollar figures. No full name. Initials only. */}
      {initials && initialsStyle && (
        <span aria-hidden="true" style={initialsStyle}>
          {initials}
        </span>
      )}
      {mark.isOwn && (
        <>
          <span aria-hidden="true" style={ringStyle} />
          <span aria-hidden="true" style={youLabelStyle}>
            Your sun
          </span>
        </>
      )}
      {mark.isSharer && !mark.isOwn && (
        <span aria-hidden="true" style={sharerDotStyle} />
      )}
    </>
  );
}
