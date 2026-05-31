/**
 * Button — design-system pill button.
 *
 * Variants:
 *   primary   — bg #232323 / text #fff  (on white; the default CTA)
 *   secondary — bordered, transparent bg
 *   ghost     — text-only, no border
 *   on-strong — bg #ccf88e / text #274a34  (ONLY on a dark-green/brand-strong surface)
 *
 * Rules enforced here:
 *   • NO green CTA on white — on-strong is intentionally named to make misuse visible.
 *   • Disabled state → greyed text + border + cursor-not-allowed (every variant).
 *   • Every variant exposes a computed-style change on :hover via data-variant attribute.
 */

import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'on-strong';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
}

const BASE =
  'inline-flex items-center justify-center gap-1 rounded-full font-bold leading-5 border transition-[background,border-color,opacity] duration-[var(--hrt-time-transition-fast)] ease-[var(--hrt-ease-default)] whitespace-nowrap select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hrt-color-border-brand)]';

const SIZE_CLASSES: Record<ButtonSize, string> = {
  lg: 'min-h-[var(--hrt-size-spacing-6)] px-[var(--hrt-size-spacing-3)] text-body-md',
  md: 'min-h-[var(--hrt-size-spacing-5)] px-[var(--hrt-size-spacing-3)] text-body-md',
  sm: 'min-h-[var(--hrt-size-spacing-4)] px-[var(--hrt-size-spacing-2)] text-body-sm',
};

// Active (non-disabled) styles per variant — using inline CSS vars for token-exactness
const VARIANT_ENABLED: Record<ButtonVariant, string> = {
  'primary':
    'bg-[var(--hrt-color-button-primary-surface)] text-[var(--hrt-color-button-primary-text)] border-transparent hover:bg-[var(--hrt-color-button-primary-surface-hover)]',
  'secondary':
    'bg-transparent text-[var(--hrt-color-button-secondary-text)] border-[var(--hrt-color-button-secondary-border)] hover:bg-[#2323230d]',
  'ghost':
    'bg-transparent text-[var(--hrt-color-text-default)] border-transparent hover:bg-[#2323230d]',
  'on-strong':
    'bg-[var(--hrt-color-button-on-strong-surface)] text-[var(--hrt-color-button-on-strong-text)] border-transparent hover:brightness-95',
};

// Disabled styles — unified greyed appearance regardless of variant
const DISABLED_CLASSES =
  'bg-[var(--hrt-color-surface-neutral-subtle)] text-[var(--hrt-color-text-disabled)] border-[var(--hrt-color-border-disabled)] cursor-not-allowed pointer-events-none';

export function Button({
  variant = 'primary',
  size = 'lg',
  block = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  const variantClasses = disabled ? DISABLED_CLASSES : VARIANT_ENABLED[variant];

  return (
    <button
      disabled={disabled}
      aria-disabled={disabled}
      data-variant={variant}
      className={[
        BASE,
        SIZE_CLASSES[size],
        variantClasses,
        block ? 'w-full' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
