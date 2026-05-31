'use client';
// L3.5 client resolution glue. architecture.md §4.3, design-overlay.md "What happens when persona changes".
//
// A page fetches persona-INDEPENDENT candidate pools server-side (entity neighbours, trending,
// PYMK, activity, share copy, board seed) and passes them here. PersonalizedSlot reads the
// CURRENT persona via usePersona() and runs resolveSlot reactively — so a persona switch
// re-renders the slot CONTENT without ever changing page STRUCTURE (the slot region is always
// present; CLS ≈ 0). It also owns the Section Viewed dedup for the slot's region.
import { useMemo } from 'react';
import { usePersona } from '@/lib/overlay/context';
import { resolveSlot, type SlotName, type SlotContext, type SlotData } from '@/lib/personalization/slots';
import type { OverlayAttrs } from '@/lib/overlay/types';
import type { PageContext } from '@/lib/types';
import { useSectionViewed } from '@/lib/analytics/section-viewed';

import { ReturningBanner } from '@/components/slots/ReturningBanner';
import { SmartPresets } from '@/components/slots/SmartPresets';
import { SimilarCarousel } from '@/components/slots/SimilarCarousel';
import { WhatYouMissedFeed } from '@/components/slots/WhatYouMissedFeed';
import { PymkPanel } from '@/components/slots/PymkPanel';
import { RecurringNudge } from '@/components/slots/RecurringNudge';
import { ShareRateSlot } from '@/components/slots/ShareRateSlot';

export interface PersonalizedSlotProps<N extends SlotName> {
  name: N;
  page: PageContext;
  candidates?: SlotContext['candidates'];
  isOwnerView?: boolean;
  overlay: OverlayAttrs;
  sectionName: string; // for Section Viewed dedup
}

// Shared hook: resolve a slot against the current persona + injected candidates.
// The fundraiser DonationCard uses this directly to read personalized presets while owning
// its own funnel-event wiring.
export function useResolvedSlot<N extends SlotName>(
  name: N,
  page: PageContext,
  candidates?: SlotContext['candidates'],
  isOwnerView = false,
): Extract<SlotData, { name: N }> {
  const user = usePersona();
  return useMemo(
    () => resolveSlot(name, { user, page, isOwnerView, candidates }),
    [name, user, page, isOwnerView, candidates],
  );
}

export function PersonalizedSlot<N extends SlotName>(props: PersonalizedSlotProps<N>): JSX.Element {
  const { name, page, candidates, isOwnerView = false, overlay, sectionName } = props;
  const data = useResolvedSlot(name, page, candidates, isOwnerView);
  const sectionRef = useSectionViewed(sectionName);

  return (
    <div ref={sectionRef} data-section-name={sectionName} data-personalized-slot={name}>
      {renderSlot(data, overlay)}
    </div>
  );
}

function renderSlot(data: SlotData, overlay: OverlayAttrs): JSX.Element {
  switch (data.name) {
    case 'returning_banner':
      return <ReturningBanner data={data} overlay={overlay} />;
    case 'smart_presets':
      return <SmartPresets data={data} overlay={overlay} />;
    case 'similar_carousel':
      return <SimilarCarousel data={data} overlay={overlay} />;
    case 'what_you_missed':
      return <WhatYouMissedFeed data={data} overlay={overlay} />;
    case 'pymk_panel':
      return <PymkPanel data={data} overlay={overlay} />;
    case 'recurring_nudge':
      return <RecurringNudge data={data} overlay={overlay} />;
    case 'share_rate':
      return <ShareRateSlot data={data} overlay={overlay} />;
  }
}
