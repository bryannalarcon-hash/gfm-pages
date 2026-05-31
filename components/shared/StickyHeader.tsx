'use client';

/**
 * StickyHeader — sticks on scroll; optionally condenses its children.
 *
 * Uses IntersectionObserver on a sentinel element placed just below the header
 * to detect when the user has scrolled past the natural page flow.
 *
 * condensedOnScroll: passes data-condensed="true" to children via context
 * (and sets a CSS data attribute on the wrapper) so inner components can
 * shrink their padding/font-size with CSS.
 */

import React, { useEffect, useRef, useState } from 'react';

export interface StickyHeaderProps {
  children: React.ReactNode;
  condensedOnScroll?: boolean;
  className?: string;
  /** z-index; defaults to 40 (above most content, below modals) */
  zIndex?: number;
}

export function StickyHeader({
  children,
  condensedOnScroll = false,
  className,
  zIndex = 40,
}: StickyHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When sentinel leaves viewport (scrolled past it) → condensed
        setScrolled(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: '0px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const isCondensed = condensedOnScroll && scrolled;

  return (
    <>
      {/* Sentinel lives in normal flow, just before the sticky header's logical position */}
      <div ref={sentinelRef} aria-hidden="true" className="h-0 w-0 overflow-hidden" />

      <header
        data-condensed={isCondensed ? 'true' : undefined}
        className={[
          'sticky top-0',
          'bg-[var(--hrt-color-surface-default)]',
          isCondensed
            ? 'shadow-[var(--hrt-shadow-medium)]'
            : 'shadow-[var(--hrt-shadow-soft)]',
          'transition-shadow duration-[var(--hrt-time-transition-fast)] ease-[var(--hrt-ease-default)]',
          className ?? '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ zIndex }}
      >
        {children}
      </header>
    </>
  );
}
