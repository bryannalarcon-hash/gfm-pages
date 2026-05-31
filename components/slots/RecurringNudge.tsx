'use client';
/**
 * RecurringNudge — slot 'recurring_nudge' (P9).
 *
 * Matches mock structure: div.recbanner with .recbanner__txt + CTA button.
 * Populated: "You've supported {organizerName} {donationCount} times — consider a monthly gift?"
 * null content: sanctioned ZERO-HEIGHT collapse (still rendered, just invisible).
 *
 * L3.5 rule: NEVER unmounts.
 * Production rule: SHOW for authenticated viewer with 2+ donations in past 12 months.
 */

import React from 'react';
import { Instrumented } from '@/components/overlay/Instrumented';
import type { SlotComponentProps } from '@/lib/personalization/slots';

function pluralTimes(n: number): string {
  return n === 1 ? '1 time' : `${n} times`;
}

export function RecurringNudge({ data, overlay }: SlotComponentProps<'recurring_nudge'>) {
  const { content } = data;

  // Sanctioned zero-height collapse — region stays in DOM, no visible content.
  if (!content) {
    return (
      <Instrumented attrs={overlay} regionLabel="recurring-nudge">
        <div
          data-slot="recurring_nudge"
          data-section-name="Recurring Nudge"
          aria-hidden="true"
          style={{ height: 0, overflow: 'hidden' }}
        />
      </Instrumented>
    );
  }

  return (
    <Instrumented attrs={overlay} regionLabel="recurring-nudge">
      <div
        data-slot="recurring_nudge"
        data-section-name="Recurring Nudge"
        className="recbanner"
        role="region"
        aria-label="Make your donation recurring"
      >
        <span className="recbanner__txt">
          You&rsquo;ve supported {content.organizerName} {pluralTimes(content.donationCount)} — consider a
          monthly gift?
        </span>
        <a
          className="btn btn--primary btn--sm"
          data-variant="primary"
          href="/f/"
        >
          Set up recurring →
        </a>
      </div>
    </Instrumented>
  );
}
