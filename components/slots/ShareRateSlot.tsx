'use client';
/**
 * ShareRateSlot -- slot 'share_rate' (D9 share studio framing).
 *
 * L3.5 rule: structure is fixed across all personas. Only the headline copy
 * (eyebrow + heading + sub text) adapts based on the resolved mode:
 *   sharer  -- framed for someone who actively shares (Mike T./extrovert)
 *   sharee  -- warm-arrival framing acknowledging the referrer (shared_by_extro)
 *   default -- generic share encouragement (everyone else)
 *
 * NEVER unmounts. The slot region is always in the DOM. No layout shift.
 */

import React from 'react';
import { Instrumented } from '@/components/overlay/Instrumented';
import type { SlotComponentProps } from '@/lib/personalization/slots';

interface ShareCopy {
  eyebrow: string;
  heading: string;
  sub: string;
}

function getShareCopy(mode: 'sharer' | 'sharee' | 'default', referrerName: string | undefined): ShareCopy {
  if (mode === 'sharer') {
    return {
      eyebrow: 'Your shares make a real difference',
      heading: 'Send it to your network -- pick your channel',
      sub: 'You bring people in. Each share you send brings about $50 more to this cause -- we wrote a version for every channel.',
    };
  }
  if (mode === 'sharee' && referrerName) {
    return {
      eyebrow: `${referrerName} recommended this`,
      heading: 'Now help it reach even further',
      sub: `${referrerName} thought you would care about this. Pass it on -- each share brings about $50, and we have written one for every channel.`,
    };
  }
  // default
  return {
    eyebrow: 'Sharing raises 3x more',
    heading: 'Spread the word -- pick how you want to send it',
    sub: 'Each share brings about $50, on average. We wrote a version for every channel -- tap to send.',
  };
}

export function ShareRateSlot({ data, overlay }: SlotComponentProps<'share_rate'>) {
  const { mode, referrerName } = data.content;
  const copy = getShareCopy(mode, referrerName);

  return (
    <Instrumented attrs={overlay} regionLabel="share-rate-slot">
      <div
        data-slot="share_rate"
        data-section-name="Share Rate"
      >
        <div className="spread__eyebrow">{copy.eyebrow}</div>
        <h2 className="spread__head">{copy.heading}</h2>
        <p className="spread__sub">{copy.sub}</p>
      </div>
    </Instrumented>
  );
}
