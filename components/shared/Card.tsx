/**
 * Card — generic surface card.
 * bg #fff, token radius, optional shadow.
 * Server component (pure display).
 */

import React from 'react';

export interface CardProps {
  /** Inner padding size using spacing tokens. Defaults to 'md' (spacing-2 / 1rem). */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Adds medium box-shadow for raised appearance. */
  elevated?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const PADDING_CLASSES: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-[var(--hrt-size-spacing-1)]',
  md: 'p-[var(--hrt-size-spacing-2)]',
  lg: 'p-[var(--hrt-size-spacing-3)]',
};

export function Card({ padding = 'md', elevated = false, className, children }: CardProps) {
  return (
    <div
      className={[
        'bg-[var(--hrt-color-surface-raised)]',
        'border border-[var(--hrt-color-border-neutral-extra-subtle)]',
        'rounded-xxxl',
        elevated ? 'shadow-medium' : 'shadow-soft',
        PADDING_CLASSES[padding],
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
