'use client';
// CommunityPage — client shell for the community route.
// Matches mocks/community-v4.2.html page structure exactly:
//   GlobalNav + .chead (sticky, reveals on hero scroll)
//   .after-view > main.hrt-container.lg.page
//     .hero (CommunityHero)
//     .v4-block (marks-intro)
//     .tabbar-wrap (sticky tab bar)
//     .tabpanel sections (Activity / Fundraisers / About)
//   CommunitySunsSection (position:absolute z:-1 ambient gutter suns)
//   Footer
//
// Tab switching: aria-selected + hidden attribute (same as mock JS).
// PersonalizedSlot: C2 returning_banner / C3 pymk_panel / C5 similar_carousel NEVER unmount.

import React, { useState, useCallback } from 'react';
import type { CommunityRow, ActivityItem } from '@/components/community/types';
import type { SimilarCard, PymkCard, ShareChannel, PageContext } from '@/lib/types';
import type { BoardSeed } from '@/lib/marks/types';
import type { OverlayAttrs } from '@/lib/overlay/types';

import { Footer } from '@/components/shared/Footer';
import { CommunityHero } from '@/components/community/CommunityHero';
import { ActivityTab } from '@/components/community/ActivityTab';
import { FundraisersTab } from '@/components/community/FundraisersTab';
import { AboutTab } from '@/components/community/AboutTab';
import { CommunitySunsSection } from '@/components/community/CommunitySunsSection';
import { MarksIntroSection } from '@/components/community/MarksIntroSection';
import { ShareStudio } from '@/components/community/ShareStudio';
import { capture } from '@/lib/analytics/capture';

// Overlay attr objects — tier/delta/metric baked at build time

export const OVERLAY_C1: OverlayAttrs = {
  'data-overlay-tier': '2',
  'data-overlay-events': 'Community Followed',
  'data-overlay-delta': 'C1',
  'data-overlay-metric': 'Follow rate → Repeat Visits',
  'data-overlay-why':
    'First-class Follow CTA with explicit value prop and milestone gamification drives follow rate, the leading indicator for return visits.',
  'data-overlay-dashboard': 'retention',
};

export const OVERLAY_C2: OverlayAttrs = {
  'data-overlay-tier': '2',
  'data-overlay-events': 'Update Read,Section Viewed',
  'data-overlay-delta': 'C2',
  'data-overlay-metric': 'Activity Feed Viewed → Repeat Visits',
  'data-overlay-why':
    'Sticky divider orients returning members to unseen content, reducing bounce and driving scroll depth.',
  'data-overlay-dashboard': 'retention',
};

export const OVERLAY_C3: OverlayAttrs = {
  'data-overlay-tier': '2',
  'data-overlay-events': 'Section Viewed',
  'data-overlay-delta': 'C3',
  'data-overlay-metric': 'Follow rate (PYMK strip)',
  'data-overlay-why':
    "Inline Follow prompt in the PYMK strip closes the activation loop without a side-quest through a stranger's profile.",
  'data-overlay-dashboard': 'retention',
};

export const OVERLAY_C4: OverlayAttrs = {
  'data-overlay-tier': '1',
  'data-overlay-events': 'Fundraiser Clicked Through,Section Viewed',
  'data-overlay-delta': 'C4',
  'data-overlay-metric': 'Fundraiser Clicked Through → Donate',
  'data-overlay-why':
    'Contextual momentum prompt above the leaderboard primes urgency and drives click-through to high-intent fundraisers.',
  'data-overlay-dashboard': 'donate-funnel',
};

export const OVERLAY_C5: OverlayAttrs = {
  'data-overlay-tier': '1',
  'data-overlay-events': 'Fundraiser Clicked Through,Section Viewed',
  'data-overlay-delta': 'C5',
  'data-overlay-metric': 'Fundraiser Card Clicked (followed_causes)',
  'data-overlay-why':
    'Personalized strip of fundraisers from followed categories surfaces warm-traffic content at the top of the Fundraisers tab.',
  'data-overlay-dashboard': 'donate-funnel',
};

export const OVERLAY_C6: OverlayAttrs = {
  'data-overlay-tier': '2',
  'data-overlay-events': 'Share Clicked',
  'data-overlay-delta': 'C6',
  'data-overlay-metric': 'Share rate per channel (community)',
  'data-overlay-why':
    'AI-generated per-channel share copy removes friction from the share flow, lifting share-click rate and expanding the top-of-funnel.',
  'data-overlay-dashboard': 'share-trends',
};

export const OVERLAY_C7: OverlayAttrs = {
  'data-overlay-tier': '2',
  'data-overlay-events': 'Page Viewed',
  'data-overlay-delta': 'C7',
  'data-overlay-metric': 'LCP / INP / CLS (performance guardrail)',
  'data-overlay-why':
    'SSR hero + stats eliminates CLS from async data; skeleton screens and deferred feed hydration keep INP under 200ms.',
  'data-overlay-dashboard': 'replays',
};

// NOTE: the ambient SunsLayer (CommunitySunsSection) is decorative and intentionally NOT an
// overlay region — instrumenting that full-page layer resolved its rect to the whole page,
// producing a full-viewport highlight ring + a full-viewport mask cut-out that erased the dim.
// The Suns-board S2 metric is highlighted on the bounded marks-intro region (MarksIntroSection).

const TABS = [
  { id: 'activity', label: 'Activity' },
  { id: 'fundraisers', label: 'Fundraisers' },
  { id: 'about', label: 'About' },
];

export interface CommunityPageProps {
  community: CommunityRow;
  activity: ActivityItem[];
  shareCopy: Partial<Record<ShareChannel, string>>;
  boardSeed: BoardSeed;
  supporterCount: number;
  trending: SimilarCard[];
  pymkCards: PymkCard[];
  nearGoalLeader: SimilarCard | null;
  recentDonorCount: number;
  pageCtx: PageContext;
}

export function CommunityPage({
  community,
  activity,
  shareCopy,
  boardSeed,
  supporterCount,
  trending,
  pymkCards,
  nearGoalLeader,
  recentDonorCount,
  pageCtx,
}: CommunityPageProps) {
  const [activeTab, setActiveTab] = useState('activity');
  const [following, setFollowing] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // C7: deferred hydration — feed starts as SSR skeleton, transitions in on idle
  const [feedReady, setFeedReady] = useState(false);

  React.useEffect(() => {
    // Trigger feed hydration after a brief idle (C7 deferred hydration).
    // We use setTimeout as the primary trigger (reliable; rIC has quirks in headless/perf-constrained contexts)
    const t = setTimeout(() => setFeedReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  // C1: Follow handler
  const handleFollow = useCallback(() => {
    setFollowing((prev) => {
      const next = !prev;
      if (next) {
        capture('Community Followed', {
          referrer_source: pageCtx.referrerSource,
          community_id: community.id,
          community_name: community.name,
        });
      }
      return next;
    });
  }, [community.id, community.name, pageCtx.referrerSource]);

  // C6: Share handler
  const handleShare = useCallback(
    (channel: ShareChannel, _copy: string) => {
      capture('Share Clicked', {
        share_channel: channel,
        share_context: 'community',
        community_id: community.id,
        referrer_source: pageCtx.referrerSource,
      });
      setShareOpen(false);
    },
    [community.id, pageCtx.referrerSource],
  );

  // Tab switch — Section Viewed event + aria state
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    capture('Section Viewed', {
      section: tabId,
      community_id: community.id,
    });
  }, [community.id]);

  return (
    // Relative container — anchors the zero-CLS SunsLayer (position:absolute z:-1)
    // Background is transparent so z:-1 suns show through gutters (overrides.css contract).
    <div className="relative min-h-screen" data-screen-label="Community page">
      {/* S2: SunsLayer — ambient gutter suns, always-present behind page */}
      <CommunitySunsSection
        boardSeed={boardSeed}
        supporterCount={supporterCount}
      />

      {/* Cross-surface top bar (UnifiedNav) is mounted once in app/layout.tsx. */}

      {/* Page content column — position:relative z-index:1 so it sits above the z:-1 SunsLayer */}
      <div className="after-view" style={{ position: 'relative', zIndex: 1 }}>
        <main className="hrt-container lg page">

          {/* ===== HERO ===== */}
          <CommunityHero
            community={community}
            following={following}
            onFollow={handleFollow}
            onShareOpen={() => setShareOpen(true)}
            shareOpen={shareOpen}
            shareCopy={shareCopy}
            onShare={handleShare}
            overlayC1={OVERLAY_C1}
            overlayC6={OVERLAY_C6}
            overlayC7={OVERLAY_C7}
            pageCtx={pageCtx}
          />

          {/* ===== SHARE STUDIO + MILESTONE + TOP INVITERS ===== */}
          <ShareStudio
            communityName={community.name}
            raisedUsd={community.raised_usd ?? 0}
            fundraiserCount={community.fundraiser_count ?? 0}
            followerCount={community.follower_count}
            shareCopy={shareCopy}
            communityId={community.id}
            pageCtx={pageCtx}
          />

          {/* ===== MARKS INTRO (v4.2 ambient) ===== */}
          {/* CB-34: pass community id + runtime follow flag so the sun button reacts to
              both the Follow click and persona switches (create→edit). */}
          <MarksIntroSection
            supporterCount={supporterCount}
            communityId={community.id}
            following={following}
          />

          {/* ===== STICKY TAB BAR ===== */}
          <div className="tabbar-wrap">
            <div className="tabbar" role="tablist">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`btn-tab-${tab.id}`}
                  aria-selected={activeTab === tab.id}
                  aria-controls={`tab-${tab.id}`}
                  className="tabbar__tab"
                  onClick={() => handleTabChange(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* ===== ACTIVITY TAB ===== */}
          {/* L3.5: PersonalizedSlot returning_banner + pymk_panel — NEVER unmount */}
          {/* We pass activeTab to each tab so it can self-apply hidden class */}
          <ActivityTab
            activity={activity}
            pymkCards={pymkCards}
            feedReady={feedReady}
            pageCtx={pageCtx}
            overlayC2={OVERLAY_C2}
            overlayC3={OVERLAY_C3}
            hidden={activeTab !== 'activity'}
          />

          {/* ===== FUNDRAISERS TAB ===== */}
          {/* L3.5: PersonalizedSlot similar_carousel — NEVER unmount */}
          <FundraisersTab
            trending={trending}
            nearGoalLeader={nearGoalLeader}
            recentDonorCount={recentDonorCount}
            communityName={community.name}
            communityId={community.id}
            pageCtx={pageCtx}
            overlayC4={OVERLAY_C4}
            overlayC5={OVERLAY_C5}
            hidden={activeTab !== 'fundraisers'}
          />

          {/* ===== ABOUT TAB ===== */}
          <AboutTab community={community} hidden={activeTab !== 'about'} />

        </main>
      </div>

      {/* Share sheet modal (C6) */}
      {shareOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Share ${community.name}`}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.4)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShareOpen(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 560,
              margin: '0 var(--hrt-size-spacing-2)',
              background: 'var(--hrt-color-surface-default)',
              borderRadius: 'var(--hrt-size-radius-xxxl) var(--hrt-size-radius-xxxl) 0 0',
              padding: 'var(--hrt-size-spacing-3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--hrt-size-spacing-2)' }}>
              <h2 style={{ margin: 0, fontSize: 'var(--hrt-size-font-heading-sm)', fontWeight: 'bold' }}>
                Share {community.name}
              </h2>
              <button
                type="button"
                onClick={() => setShareOpen(false)}
                aria-label="Close share sheet"
                className="btn btn--secondary btn--sm"
              >
                ✕
              </button>
            </div>
            <div className="studio">
              {Object.entries(shareCopy).slice(0, 2).map(([channel, copy]) => (
                <div className="scard" key={channel}>
                  <div className="scard__head">
                    <span style={{ textTransform: 'capitalize' }}>{channel}</span>
                  </div>
                  <div className="bubble">{copy}</div>
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    onClick={() => handleShare(channel as ShareChannel, copy ?? '')}
                  >
                    Share on {channel}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
