'use client';
/**
 * WhatYouMissedFeed — slot 'what_you_missed' (P2).
 *
 * Populated: "Since your last visit — {newCount} new" heading + activity rows.
 * Each row shows a verb chip (UPDATED / PUBLISHED / DONATED), title, byline, age.
 *
 * null content: empty-state placeholder — still rendered, never unmounted.
 * The placeholder uses a "You're all caught up" muted message so the region
 * preserves layout space (no CLS from region appearing/disappearing per persona).
 *
 * L3.5 rule: NEVER return null / unmount.
 */

import React from 'react';
import { Instrumented } from '@/components/overlay/Instrumented';
import type { SlotComponentProps } from '@/lib/personalization/slots';
import type { ActivityRow } from '@/lib/types';

function ageLabel(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return '1 week ago';
  if (weeks < 5) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return '1 month ago';
  return `${months} months ago`;
}

const VERB_STYLES: Record<ActivityRow['verb'], { label: string; classes: string }> = {
  UPDATED: {
    label: 'Updated',
    classes: [
      'bg-[var(--hrt-color-surface-tip-medium)]',
      'text-[var(--hrt-color-text-tip)]',
    ].join(' '),
  },
  PUBLISHED: {
    label: 'Published',
    classes: [
      'bg-[var(--hrt-color-surface-brand-medium)]',
      'text-[var(--hrt-color-text-brand-strong)]',
    ].join(' '),
  },
  DONATED: {
    label: 'Donated',
    classes: [
      'bg-[var(--hrt-color-surface-neutral-subtle)]',
      'text-[var(--hrt-color-text-default)]',
    ].join(' '),
  },
};

interface ActivityRowItemProps {
  row: ActivityRow;
}

function ActivityRowItem({ row }: ActivityRowItemProps) {
  const { label, classes } = VERB_STYLES[row.verb];
  return (
    <li className="flex flex-col gap-[var(--hrt-size-spacing-1)]">
      <a
        href={row.href}
        className={[
          'flex flex-row items-start gap-[var(--hrt-size-spacing-1)]',
          'rounded-xl p-[var(--hrt-size-spacing-1)]',
          'hover:bg-[var(--hrt-color-surface-neutral-subtle)]',
          'transition-colors duration-[var(--hrt-time-transition-fast)]',
          'focus-visible:outline-2 focus-visible:outline-offset-2',
          'focus-visible:outline-[var(--hrt-color-border-brand)]',
          'no-underline',
        ].join(' ')}
      >
        {/* Verb chip */}
        <span
          className={[
            'flex-none mt-[2px] text-body-xs font-bold px-[var(--hrt-size-spacing-1)]',
            'py-[2px] rounded-full leading-none',
            classes,
          ].join(' ')}
          aria-label={label}
        >
          {label}
        </span>

        {/* Content */}
        <div className="flex flex-col flex-1 min-w-0 gap-[2px]">
          <span className="text-body-sm font-bold text-[var(--hrt-color-text-default)] line-clamp-2 leading-snug">
            {row.title}
          </span>
          <span className="text-body-xs text-[var(--hrt-color-text-supporting)]">
            {row.byline}
          </span>
          <span className="text-body-xs text-[var(--hrt-color-text-disabled)]">
            {ageLabel(row.ageDays)}
          </span>
        </div>
      </a>
    </li>
  );
}

export function WhatYouMissedFeed({ data, overlay }: SlotComponentProps<'what_you_missed'>) {
  const { content } = data;

  return (
    <Instrumented attrs={overlay} regionLabel="what-you-missed">
      <section
        data-slot="what_you_missed"
        data-section-name="What You Missed"
        aria-label="What you missed"
        className="flex flex-col gap-[var(--hrt-size-spacing-2)]"
      >
        {content === null ? (
          /* Empty-state placeholder — still rendered, never unmounted */
          <p
            className={[
              'text-body-sm text-[var(--hrt-color-text-disabled)]',
              'text-center py-[var(--hrt-size-spacing-2)] m-0',
            ].join(' ')}
            aria-live="polite"
          >
            You&rsquo;re all caught up
          </p>
        ) : (
          <>
            {/* "Since your last visit" heading */}
            <p className="text-body-sm font-bold text-[var(--hrt-color-text-default)] m-0">
              Since your last visit &mdash;{' '}
              <span className="text-[var(--hrt-color-text-brand-strong)]">
                {content.newCount} new
              </span>
            </p>

            {/* Activity rows */}
            <ul
              className="flex flex-col gap-[var(--hrt-size-spacing-1)] list-none m-0 p-0"
              aria-label={`${content.newCount} new activities since your last visit`}
            >
              {content.rows.map((row) => (
                <ActivityRowItem key={`${row.verb}-${row.href}`} row={row} />
              ))}
            </ul>
          </>
        )}
      </section>
    </Instrumented>
  );
}
