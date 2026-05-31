'use client';
/**
 * ProfilePage — main client component for /u/[handle].
 *
 * DOM structure mirrors mocks/profile-v4.2.html exactly:
 *   GlobalNav (gnav)
 *   StickyCompactHeader (chead — slides in after scroll)
 *   main.hrt-container.xl.layout (CSS grid: maincol + rightrail)
 *     .maincol:
 *       section.hero  (ProfileHero — P1/P3/P6/P8)
 *       section.carousel  (SunsBoard — markwall)
 *       section.carousel  (FundraiserCarousel — P5)
 *       section.spread    (ShareSpread — P8 studio)
 *       div.recbanner     (P9 recurring nudge — PersonalizedSlot)
 *       div.tabbar-wrap   (TabBar — Activity / About)
 *       section.tabpanel#tab-activity  (ActivityFeed with digest link)
 *       section.tabpanel#tab-about     (AboutTab)
 *     .rightrail:
 *       div.pymkpanel (PYMK — P4 PersonalizedSlot)
 *   Footer (gfooter)
 *   DigestModal (modal overlay — opened by digestlink)
 *   SunsLayer (gutter suns, behind content)
 *
 * isOwnerView: computed client-side:
 *   usePersona().isProfileOwner && handle === 'janahan'
 *
 * L3.5: PersonalizedSlot for what_you_missed (P2), pymk_panel (P4), recurring_nudge (P9)
 * are NEVER unmounted.
 *
 * GUARDRAILS:
 *  - NO dollar figures on suns board
 *  - NO green CTA on white
 *  - NO internal index (P#/S#/etc.) in rendered text
 */

import React, { useState, useCallback } from 'react';
// profile.css is imported from app/u/[handle]/page.tsx for correct Next.js CSS bundling
import { usePersona } from '@/lib/overlay/context';
import { PersonalizedSlot } from '@/components/slots/PersonalizedSlot';
import { Footer } from '@/components/shared/Footer';
import { ProfileHero } from '@/components/profile/ProfileHero';
import { SunsBoard } from '@/components/profile/SunsBoard';
import { FundraiserCarousel } from '@/components/profile/FundraiserCarousel';
import { ShareSpread } from '@/components/profile/ShareSpread';
import { StickyCompactHeader } from '@/components/profile/StickyCompactHeader';
import { ActivityFeed } from '@/components/profile/ActivityFeed';
import { AboutTab } from '@/components/profile/AboutTab';
import { DigestEmailMockup } from '@/components/profile/DigestEmailMockup';
import type { ProfileRow } from '@/lib/db/queries';
import type { SimilarCard, ActivityRow, PymkCard, ShareChannel, PageContext } from '@/lib/types';
import type { BoardSeed } from '@/lib/marks/types';
import type { OverlayAttrs } from '@/lib/overlay/types';

// ---- Overlay attrs per delta ----

const OVERLAY_P1: OverlayAttrs = {
  'data-overlay-tier': '2',
  'data-overlay-events': 'Follow Clicked',
  'data-overlay-delta': 'P1',
  'data-overlay-metric': 'Follow + value-prop microcopy',
  'data-overlay-why':
    'Value-prop line under Follow makes the benefit explicit. Maher 2012: social-tie retention ~2×. The downstream feed (P2) is the multiplier. GFM platformizing the social graph backend.',
  'data-overlay-dashboard': 'retention',
};

const OVERLAY_P2: OverlayAttrs = {
  'data-overlay-tier': '2',
  'data-overlay-events': 'Section Viewed',
  'data-overlay-delta': 'P2',
  'data-overlay-metric': 'Activity Feed Engaged; Digest Email Opened',
  'data-overlay-why':
    '"What you missed" groups new activity since the viewer\'s last visit, giving followers a clear reason to return to the profile.',
  'data-overlay-dashboard': 'retention',
};

const OVERLAY_P3: OverlayAttrs = {
  'data-overlay-tier': '1',
  'data-overlay-events': 'Follow Clicked',
  'data-overlay-delta': 'P3',
  'data-overlay-metric': 'Cause pills in hero — identity legibility',
  'data-overlay-why':
    'Surfaces existing causes from the data model at a glance. Identity legibility plausibly lifts follow trust (Maher 2012: the cause is the tie).',
  'data-overlay-dashboard': 'donate-funnel',
};

const OVERLAY_P4: OverlayAttrs = {
  'data-overlay-tier': '2',
  'data-overlay-events': 'Section Viewed',
  'data-overlay-delta': 'P4',
  'data-overlay-metric': 'PYMK Follow Clicked, pymk_rank_position',
  'data-overlay-why':
    'Reordering PYMK suggestions by second-degree social graph proximity surfaces people the viewer is more likely to know, lifting follow rate.',
  'data-overlay-dashboard': 'retention',
};

const OVERLAY_P5: OverlayAttrs = {
  'data-overlay-tier': '1',
  'data-overlay-events': 'Fundraiser Clicked Through',
  'data-overlay-delta': 'P5',
  'data-overlay-metric': 'Carousel state-aware copy (goal-gradient)',
  'data-overlay-why':
    'One state line per card (over-goal / near-goal / default). Cryder 2013 goal-gradient at the profile level.',
  'data-overlay-dashboard': 'donate-funnel',
};

const OVERLAY_P6: OverlayAttrs = {
  'data-overlay-tier': '2',
  'data-overlay-events': 'Section Viewed',
  'data-overlay-delta': 'P6',
  'data-overlay-metric': 'Repeat-organizer tenure badge (trust signal)',
  'data-overlay-why':
    'Blackbaud P2P: returning organizers raise $501 median vs $222 first-timers. Surfacing tenure gives a quality signal before click-through.',
  'data-overlay-dashboard': 'donate-funnel',
};

const OVERLAY_P8: OverlayAttrs = {
  'data-overlay-tier': '2',
  'data-overlay-events': 'Share Clicked',
  'data-overlay-delta': 'P8',
  'data-overlay-metric': 'AI per-channel profile share copy',
  'data-overlay-why':
    'LLM copy per (profile, channel), cached. Low-volume but high-trust acquisition channel.',
  'data-overlay-dashboard': 'share-trends',
};

const OVERLAY_P9: OverlayAttrs = {
  'data-overlay-tier': '1',
  'data-overlay-events': 'Section Viewed',
  'data-overlay-delta': 'P9',
  'data-overlay-metric': 'Organizer-level recurring nudge',
  'data-overlay-why':
    'Profile is the only surface that knows "you\'ve given X times to this person." Recurring donors ~10–20× LTV.',
  'data-overlay-dashboard': 'nsm',
};

export interface ProfilePageProps {
  profile: ProfileRow;
  fundraisers: SimilarCard[];
  pymkByGraph: PymkCard[];
  pymkDefault: PymkCard[];
  activity: ActivityRow[];
  copyByChannel: Partial<Record<ShareChannel, string>>;
  boardSeed: BoardSeed;
  supporterCount: number;
  page: PageContext;
}

export function ProfilePage({
  profile,
  fundraisers,
  pymkByGraph,
  pymkDefault,
  activity,
  copyByChannel,
  boardSeed,
  supporterCount: _supporterCount,
  page,
}: ProfilePageProps) {
  const user = usePersona();
  const [activeTab, setActiveTab] = useState<'activity' | 'about'>('activity');
  // P1 Follow state: derived from the active persona's organizerProfileIds so a persona
  // switch immediately shows the correct "Follow" / "Following" state without a page reload.
  // returning_lapsed follows Janahan's organizer profile; profile_owner sees their own profile.
  const [isFollowing, setIsFollowing] = useState(() => user.follows.organizerProfileIds.includes(profile.id));
  const [showDigest, setShowDigest] = useState(false);

  // Sync follow state when persona changes (L3.5 — no reload on persona switch).
  React.useEffect(() => {
    setIsFollowing(user.follows.organizerProfileIds.includes(profile.id));
  }, [user, profile.id]);


  // OWNER GATING — computed client-side:
  // isOwnerView = persona has isProfileOwner AND this handle is 'janahan'
  const isOwnerView = user.isProfileOwner && profile.handle === 'janahan';

  const handleFollowToggle = useCallback(() => {
    setIsFollowing((v) => !v);
  }, []);

  const handleShare = useCallback(() => {
    // scroll to share section or open native share
    const el = document.getElementById('share-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const newActivityCount = activity.length;
  const organizerName = profile.display_name;
  const firstName = organizerName.split(' ')[0];

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* CB-97: NO ambient gutter SunsLayer on the profile — the falling/background suns don't
          belong here. The profile's suns live ONLY in the "Suns across causes" SunsBoard
          section (identity board). Fundraiser/community keep their ambient SunsLayer. */}

      {/* Cross-surface top bar (UnifiedNav) is mounted once in app/layout.tsx. */}

      {/* Sticky compact header (scrolls in after hero) */}
      <StickyCompactHeader
        displayName={profile.display_name}
        isFollowing={isFollowing}
        isOwnerView={isOwnerView}
        onFollowToggle={handleFollowToggle}
        onShare={handleShare}
      />

      {/* Main 2-column layout */}
      <main className="hrt-container xl layout" id="main-content">
        {/* ─── Left / main column ─── */}
        <div className="maincol">

          {/* HERO — P1/P3/P6/P8 */}
          <ProfileHero
            profile={profile}
            fundraiserCount={fundraisers.length}
            isFollowing={isFollowing}
            isOwnerView={isOwnerView}
            copyByChannel={copyByChannel}
            onFollowToggle={handleFollowToggle}
            overlayP1={OVERLAY_P1}
            overlayP3={OVERLAY_P3}
            overlayP6={OVERLAY_P6}
            overlayP8={OVERLAY_P8}
            followingCount={38}
          />

          {/* SUNS COLLECTION BOARD (markwall — contribution identity) */}
          <SunsBoard seed={boardSeed} organizerFirstName={firstName} />

          {/* P5 — FUNDRAISER CAROUSEL */}
          {fundraisers.length > 0 && (
            <FundraiserCarousel
              fundraisers={fundraisers}
              profileHandle={profile.handle}
              organizerFirstName={firstName}
              overlay={OVERLAY_P5}
            />
          )}

          {/* P8 — SHARE STUDIO (spread) — below fundraisers + suns per profile ranking */}
          <div id="share-section">
            <ShareSpread
              profileDisplayName={profile.display_name}
              profileHandle={profile.handle}
              copyByChannel={copyByChannel}
              overlay={OVERLAY_P8}
            />
          </div>

          {/* P9 — RECURRING NUDGE (PersonalizedSlot — never unmounts) */}
          <PersonalizedSlot
            name="recurring_nudge"
            page={page}
            candidates={{ organizerName }}
            isOwnerView={isOwnerView}
            overlay={OVERLAY_P9}
            sectionName="recurring_nudge"
          />

          {/* TABS — Activity / About */}
          <div className="tabbar-wrap">
            <div className="tabbar" role="tablist">
              <button
                className="tabbar__tab"
                role="tab"
                aria-selected={activeTab === 'activity'}
                aria-controls="tab-activity"
                id="tab-btn-activity"
                onClick={() => setActiveTab('activity')}
                type="button"
              >
                Activity
              </button>
              <button
                className="tabbar__tab"
                role="tab"
                aria-selected={activeTab === 'about'}
                aria-controls="tab-about"
                id="tab-btn-about"
                onClick={() => setActiveTab('about')}
                type="button"
              >
                About
              </button>
            </div>
          </div>

          {/* ACTIVITY TAB */}
          <section
            className="tabpanel"
            id="tab-activity"
            role="tabpanel"
            aria-labelledby="tab-btn-activity"
            data-screen-label="Activity tab"
            hidden={activeTab !== 'activity'}
          >
            <ActivityFeed
              activity={activity}
              newActivityCount={newActivityCount}
              page={page}
              isOwnerView={isOwnerView}
              overlay={OVERLAY_P2}
              organizerName={organizerName}
            />
            {/* Digest email preview link (opens modal) */}
            <button
              type="button"
              className="digestlink"
              onClick={() => setShowDigest(true)}
            >
              Preview the weekly digest email →
            </button>
          </section>

          {/* ABOUT TAB */}
          <section
            className="tabpanel"
            id="tab-about"
            role="tabpanel"
            aria-labelledby="tab-btn-about"
            data-screen-label="About tab"
            hidden={activeTab !== 'about'}
          >
            <AboutTab profile={profile} isOwnerView={isOwnerView} />
          </section>
        </div>

        {/* ─── Right rail — PYMK panel (P4, desktop only) ─── */}
        <aside className="rightrail" aria-label="People you may know">
          <div
            className="pymkpanel"
            data-overlay-tier={OVERLAY_P4['data-overlay-tier']}
            data-overlay-delta={OVERLAY_P4['data-overlay-delta']}
            data-overlay-events={OVERLAY_P4['data-overlay-events']}
            data-overlay-metric={OVERLAY_P4['data-overlay-metric']}
            data-overlay-why={OVERLAY_P4['data-overlay-why']}
            data-overlay-dashboard={OVERLAY_P4['data-overlay-dashboard']}
          >
            <div
              className="section-h"
              style={{ fontSize: 'var(--hrt-size-font-heading-xs)', marginBottom: 'var(--hrt-size-spacing-2)' }}
            >
              People you may know
            </div>
            {/* P4 PYMK slot — never unmounts */}
            <PersonalizedSlot
              name="pymk_panel"
              page={page}
              candidates={{ pymkByGraph, pymkDefault }}
              overlay={OVERLAY_P4}
              sectionName="pymk"
            />
          </div>
        </aside>
      </main>

      <Footer />

      {/* P2 — Digest email modal (opened by digestlink button) */}
      {showDigest && (
        <div
          className="modal open"
          id="digestModal"
          role="dialog"
          aria-label="Weekly digest email preview"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDigest(false);
          }}
        >
          <div className="email">
            <div className="email__bar">
              <span className="email__logo">
                <span className="mark" aria-hidden="true" />
                gofundme
              </span>
              <button
                type="button"
                style={{ border: 'none', background: 'none', fontSize: 22, color: 'var(--hrt-color-text-supporting)', cursor: 'pointer' }}
                aria-label="Close digest preview"
                onClick={() => setShowDigest(false)}
              >
                ×
              </button>
            </div>
            <div className="email__body">
              <DigestEmailMockup />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
