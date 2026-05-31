'use client';

/**
 * FollowButton — follow/unfollow CTA.
 *
 * variant 'primary': bg #232323 / text #fff (NOT green on white — rule enforced).
 * variant 'ghost': outline/text style.
 * Following state: filled-muted surface (#f5f5f5) with checkmark.
 */

import React from 'react';
import { IconCheck } from './icons';

export interface FollowButtonProps {
  variant: 'primary' | 'ghost';
  following: boolean;
  label: string;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
}

export function FollowButton({ variant, following, label, onToggle, disabled, className }: FollowButtonProps) {
  // Following state: filled-muted regardless of variant
  const followingClasses =
    'bg-[var(--hrt-color-surface-neutral-subtle)] text-[var(--hrt-color-text-strong)] border-[var(--hrt-color-border-neutral-extra-subtle)] hover:bg-[var(--hrt-color-surface-neutral-medium)]';

  const primaryClasses =
    'bg-[var(--hrt-color-button-primary-surface)] text-[var(--hrt-color-button-primary-text)] border-transparent hover:bg-[var(--hrt-color-button-primary-surface-hover)]';

  const ghostClasses =
    'bg-transparent text-[var(--hrt-color-text-default)] border-[var(--hrt-color-button-secondary-border)] hover:bg-[#2323230d]';

  const disabledClasses =
    'bg-[var(--hrt-color-surface-neutral-subtle)] text-[var(--hrt-color-text-disabled)] border-[var(--hrt-color-border-disabled)] cursor-not-allowed pointer-events-none';

  let stateClasses: string;
  if (disabled) {
    stateClasses = disabledClasses;
  } else if (following) {
    stateClasses = followingClasses;
  } else {
    stateClasses = variant === 'primary' ? primaryClasses : ghostClasses;
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={following}
      aria-label={following ? `Unfollow — currently following ${label}` : `Follow ${label}`}
      className={[
        'inline-flex items-center justify-center gap-[var(--hrt-size-spacing-1)]',
        'rounded-full font-bold text-body-md leading-5',
        'min-h-[var(--hrt-size-spacing-5)] px-[var(--hrt-size-spacing-3)]',
        'border',
        'transition-[background,border-color] duration-[var(--hrt-time-transition-fast)] ease-[var(--hrt-ease-default)]',
        'select-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hrt-color-border-brand)]',
        stateClasses,
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {following && <IconCheck size={16} aria-hidden />}
      {following ? 'Following' : label}
    </button>
  );
}
