'use client';
// MarksIntroSection — v4.2 Marks ambient intro strip.
// Matches mocks/community-v4.2.html marks-intro section exactly:
//   .v4-block > .marks-intro > .marks-intro__txt + button.marks-intro__btn
//   .marks-intro__txt: heading + paragraph + .board__legend
// The "Leave your sun" button is disabled until user does a qualifying action (Follow/Share/Give).
// NO dollar figures. NO internal index labels in rendered text.

import React, { useState, useCallback } from 'react';
import type { OverlayAttrs } from '@/lib/overlay/types';
import type { SunAction, SunGradient } from '@/lib/marks/types';
import { Instrumented } from '@/components/overlay/Instrumented';
import { SunsLegend } from '@/components/marks/SunsLegend';
import { SunCreateButton } from '@/components/marks/SunCreateButton';
import { SunCreateModal } from '@/components/marks/SunCreateModal';
import { usePersona } from '@/lib/overlay/context';
import { personaHasParticipated } from '@/lib/personalization/participation';

const MARKS_OVERLAY: OverlayAttrs = {
  'data-overlay-tier': '2',
  'data-overlay-events': 'Section Viewed, Mark Created',
  'data-overlay-delta': 'S2',
  'data-overlay-metric': 'Repeat Visits + Share — the collective reply',
  'data-overlay-why':
    'The hearts flanking this page are real supporters — follow places one, sharing colours it, giving grows it. System-placed + curated palette = un-weaponizable.',
  'data-overlay-dashboard': 'retention',
};

interface MarksIntroSectionProps {
  supporterCount: number;
  /** CB-34: this community's id, so participation can be derived from the persona. */
  communityId?: string;
  /**
   * CB-34: runtime follow flag for THIS community (lifted in CommunityPage). A Follow
   * click flips the sun button create→edit immediately, before any persona data changes.
   */
  following?: boolean;
}

export function MarksIntroSection({
  supporterCount,
  communityId,
  following = false,
}: MarksIntroSectionProps) {
  const displayCount = supporterCount > 0 ? supporterCount : 0;

  // CB-34: participant === follows this community (persona), OR clicked Follow this
  // session. Reacts live to BOTH the Follow click and persona switches via usePersona().
  const persona = usePersona();
  const personaParticipated = communityId
    ? personaHasParticipated(persona, { communityId })
    : false;
  const isParticipant = following || personaParticipated;

  const [sunModalOpen, setSunModalOpen] = useState(false);
  // Following-only on a community board → just the follow avenue is unlocked.
  const sunUnlocked: SunAction[] = isParticipant ? ['follow'] : [];
  const handleSunCommit = useCallback((_g: SunGradient, _consent: boolean) => {
    setSunModalOpen(false);
  }, []);

  return (
    <section className="v4-block" data-screen-label="Marks intro">
      <Instrumented attrs={MARKS_OVERLAY} regionLabel="marks-intro">
        <div className="marks-intro">
          <div className="marks-intro__txt">
            <div className="marks-intro__h">
              {displayCount > 0
                ? `${displayCount.toLocaleString()} supporters — and counting — around this page`
                : 'Be the first to light this community up'}
            </div>
            <p className="marks-intro__p">
              Every sun in the margins is someone who showed up.{' '}
              <b>Follow</b> lights yours · <b>sharing</b> colours it · <b>giving</b> grows it.
              No dollar figures — just presence.
            </p>
            {/* board__legend — three tiers rendered via SunsLegend (CB-13 fix).
                SunsLegend uses inline mask-image styles (the GFM rising-sun logo
                primitive) rather than bare CSS-class spans, which guarantees the
                mask is always applied regardless of CSS cascade specificity.
                Also handles reducedMotion correctly and matches the mock's animated
                demo-sun behavior (colour-shift + wobble for share; bigger wobble for give). */}
            <SunsLegend layout="row" />
          </div>
          {/* CB-34: create→edit. Participants (follow this community, or a Follow click
              this session) get an enabled "Edit my sun"; everyone else keeps the
              greyed-until-unlocked create state. */}
          <SunCreateButton
            isParticipant={isParticipant}
            onEdit={() => setSunModalOpen(true)}
          />
        </div>
        {/* CB-34: edit/create modal — controlled-open; built-in trigger hidden. */}
        <SunCreateModal
          unlockedBy={sunUnlocked}
          onCommit={handleSunCommit}
          open={sunModalOpen}
          onOpenChange={setSunModalOpen}
          hideTrigger
        />
      </Instrumented>
    </section>
  );
}
