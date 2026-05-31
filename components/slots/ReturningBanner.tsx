'use client';
/**
 * ReturningBanner — slot 'returning_banner' (D8 + D13).
 *
 * Populated: a slim welcome-back banner with firstName, summaryLine, and a link.
 * null content: sanctioned ZERO-HEIGHT collapse — the region wrapper is always
 * rendered (height:0, overflow:hidden, aria-hidden) so page structure never changes.
 *
 * L3.5 rule: NEVER unmounts. The wrapper div is always in the DOM.
 */

import React from 'react';
import { Instrumented } from '@/components/overlay/Instrumented';
import type { SlotComponentProps } from '@/lib/personalization/slots';

export function ReturningBanner({ data, overlay }: SlotComponentProps<'returning_banner'>) {
  const { content } = data;

  // Sanctioned zero-height collapse when no returning-visitor identity is available.
  // The outer wrapper remains in the DOM to preserve page structure.
  if (!content) {
    return (
      <Instrumented attrs={overlay} regionLabel="returning-banner">
        <div
          data-slot="returning_banner"
          data-section-name="Returning Banner"
          aria-hidden="true"
          style={{ height: 0, overflow: 'hidden' }}
        />
      </Instrumented>
    );
  }

  return (
    <Instrumented attrs={overlay} regionLabel="returning-banner">
      <div
        data-slot="returning_banner"
        data-section-name="Returning Banner"
        className={[
          'w-full px-[var(--hrt-size-spacing-3)] py-[var(--hrt-size-spacing-1)]',
          'bg-[var(--hrt-color-surface-tip-medium)]',
          'border-b border-[var(--hrt-color-border-neutral-extra-subtle)]',
          'flex items-center gap-[var(--hrt-size-spacing-2)]',
        ].join(' ')}
        role="region"
        aria-label="Welcome back"
      >
        {/* Greeting + summary */}
        <p className="flex-1 text-body-sm text-[var(--hrt-color-text-default)] m-0 leading-snug">
          <span className="font-bold">Welcome back, {content.firstName}.</span>{' '}
          {content.summaryLine}
        </p>

        {/* Link — tokens only, no green CTA on white */}
        <a
          href={content.href}
          className={[
            'flex-none text-body-sm font-bold underline underline-offset-2',
            'text-[var(--hrt-color-text-default)]',
            'hover:opacity-70 transition-opacity duration-[var(--hrt-time-transition-fast)]',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hrt-color-border-brand)]',
          ].join(' ')}
        >
          See update
        </a>
      </div>
    </Instrumented>
  );
}
