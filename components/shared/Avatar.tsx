/**
 * Avatar — circular avatar with initial, profile picture, or generic person glyph.
 * Server component.
 *
 * Render priority:
 *  1. If pfpUrl is provided → renders a <img> (named persona PFP)
 *  2. If initial is a non-empty string → renders the initial letter
 *  3. If initial === '' → renders generic person SVG glyph (anonymous)
 *
 * Optional showTrophy prop renders a small trophy badge overlay.
 * Existing callers that only pass initial (and optionally bg/fg/size/label)
 * continue working unchanged — pfpUrl and showTrophy are additive.
 */

import React from 'react';

export interface AvatarProps {
  /** Background color — any CSS color value or token var(). */
  bg?: string;
  /** Foreground / text color. */
  fg?: string;
  /** Single character initial. Empty string triggers generic person icon. */
  initial: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxxl';
  /** Accessible label for the avatar. */
  label?: string;
  /**
   * Deterministic placeholder image URL for named personas.
   * When present, renders an <img> instead of the initial/glyph.
   * Anonymous personas must NOT have this set.
   */
  pfpUrl?: string;
  /**
   * When true, renders a small trophy badge overlay for high-impact personas.
   * Kept subtle — uses design tokens.
   */
  showTrophy?: boolean;
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps['size']>, string> = {
  sm:   'w-8 h-8 text-body-sm',            // 32px
  md:   'w-10 h-10 text-body-md',           // 40px (spacing-2.5 approx)
  lg:   'w-14 h-14 text-heading-sm',        // 56px
  xl:   'w-[var(--hrt-size-spacing-7)] h-[var(--hrt-size-spacing-7)] text-heading-md', // 56px
  xxxl: 'w-[var(--hrt-size-spacing-12)] h-[var(--hrt-size-spacing-12)] text-heading-lg', // 96px
};

// Fallback person SVG path (filled currentColor)
function PersonGlyph() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="w-[55%] h-[55%]"
    >
      <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5Z" />
    </svg>
  );
}

// Small trophy badge — positioned at bottom-right of the avatar circle
function TrophyBadge() {
  return (
    <span
      data-testid="avatar-trophy"
      aria-label="Top contributor"
      className={[
        'absolute bottom-0 right-0',
        'flex items-center justify-center',
        'w-[40%] h-[40%] min-w-[12px] min-h-[12px]',
        'rounded-full',
        'bg-[var(--hrt-color-surface-brand-medium)]',
        'text-[0.5rem] leading-none select-none',
        'ring-1 ring-[var(--hrt-color-surface-default,#fff)]',
      ].join(' ')}
    >
      🏆
    </span>
  );
}

export function Avatar({
  bg,
  fg,
  initial,
  size = 'md',
  label,
  pfpUrl,
  showTrophy,
}: AvatarProps) {
  // Default brand-medium bg / brand-strong text, overridden by explicit props
  const backgroundColor = bg ?? 'var(--hrt-color-surface-brand-medium)';
  const color = fg ?? 'var(--hrt-color-text-brand-strong)';

  const showGlyph = !pfpUrl && initial === '';
  const showInitial = !pfpUrl && initial !== '';
  const showPfp = Boolean(pfpUrl);

  const accessibleLabel = label ?? (showGlyph ? 'User avatar' : initial);

  return (
    <span
      role="img"
      aria-label={accessibleLabel}
      className={[
        'relative inline-flex items-center justify-content-center justify-center',
        'rounded-full font-bold flex-none overflow-visible select-none',
        SIZE_CLASSES[size],
      ].join(' ')}
      style={{ backgroundColor, color }}
    >
      {showPfp && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={pfpUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover rounded-full"
        />
      )}
      {showGlyph && <PersonGlyph />}
      {showInitial && initial}
      {showTrophy && <TrophyBadge />}
    </span>
  );
}
