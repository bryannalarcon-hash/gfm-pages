'use client';
// FundraisersTab — C4, C5.
// Matches mocks/community-v4.2.html fundraisers tab section exactly:
//   C5 "From causes you follow" strip (PersonalizedSlot similar_carousel)
//   C5 filter pills (.filters)
//   C4 leaderboard momentum prompt (.leaderprompt)
//   Top fundraisers list (.lpcards with .fcard--condensed)
//   Search bar + grid (.searchbar + .grid)

import React from 'react';
import type { SimilarCard, PageContext } from '@/lib/types';
import type { OverlayAttrs } from '@/lib/overlay/types';
import { Instrumented } from '@/components/overlay/Instrumented';
import { PersonalizedSlot } from '@/components/slots/PersonalizedSlot';
import { capture } from '@/lib/analytics/capture';

function momentumCopy(
  momentum: 'high' | 'slow' | 'near_goal' | undefined,
  communityName: string,
  recentDonorCount: number,
  nearGoalLeader: SimilarCard | null,
  fundraiserCount: number,
): { eyebrow: string; text: string; ctaLabel: string | null; ctaVariant: 'primary' | 'secondary'; state: string } {
  if (momentum === 'high' && recentDonorCount >= 10) {
    return {
      eyebrow: 'Active momentum',
      text: `${recentDonorCount} people donated to ${communityName} in the last 24 hours.`,
      ctaLabel: 'See all fundraisers →',
      ctaVariant: 'secondary',
      state: 'active',
    };
  }
  if (momentum === 'near_goal' && nearGoalLeader) {
    const gap = nearGoalLeader.goalUsd - nearGoalLeader.raisedUsd;
    const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;
    return {
      eyebrow: 'Near-goal leader',
      text: `${nearGoalLeader.title} is ${fmt(gap)} from its goal.`,
      ctaLabel: null,
      ctaVariant: 'secondary',
      state: 'near',
    };
  }
  return {
    eyebrow: 'Quiet period',
    text: `${fundraiserCount} fundraisers are raising for ${communityName} — add yours.`,
    ctaLabel: 'Start a GoFundMe',
    ctaVariant: 'primary',
    state: 'quiet',
  };
}

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

interface FundraisersTabProps {
  trending: SimilarCard[];
  nearGoalLeader: SimilarCard | null;
  recentDonorCount: number;
  communityName: string;
  communityId: string;
  pageCtx: PageContext;
  overlayC4: OverlayAttrs;
  overlayC5: OverlayAttrs;
  hidden?: boolean;
}

export function FundraisersTab({
  trending,
  nearGoalLeader,
  recentDonorCount,
  communityName,
  communityId,
  pageCtx,
  overlayC4,
  overlayC5,
  hidden,
}: FundraisersTabProps) {
  const fundraiserCount = trending.length;
  const momentum = pageCtx.pageState.momentum;
  const { eyebrow, text, ctaLabel, ctaVariant } = momentumCopy(
    momentum,
    communityName,
    recentDonorCount,
    nearGoalLeader,
    fundraiserCount,
  );

  const c5Candidates = {
    followedCategories: trending.slice(0, 3),
    trending: trending.slice(0, 3),
  };

  const handleFundraiserClick = (card: SimilarCard, section: string) => {
    capture('Fundraiser Clicked Through', {
      community_id: communityId,
      fundraiser_id: card.id,
      referrer_source: 'community_leaderboard',
      section,
    });
  };

  return (
    <section className="tabpanel" id="tab-fundraisers" role="tabpanel" data-screen-label="Fundraisers tab" hidden={hidden || undefined}>

      {/* C5: "From causes you follow" — PersonalizedSlot similar_carousel */}
      <Instrumented attrs={overlayC5} regionLabel="causes-you-follow">
        <div
          data-after-only
          data-overlay-tier="1"
          data-overlay-delta="C5"
          data-overlay-events="Fundraiser Clicked Through"
          data-overlay-metric="&quot;From causes you follow&quot; personalized strip"
          data-overlay-why="3 cards from categories matching the viewer's follow graph."
          data-overlay-dashboard="donate-funnel"
          style={{ marginBottom: 'var(--hrt-size-spacing-3)' }}
        >
          <PersonalizedSlot
            name="similar_carousel"
            page={pageCtx}
            candidates={c5Candidates}
            overlay={overlayC5}
            sectionName="causes_you_follow"
          />
        </div>
      </Instrumented>

      {/* C5: Filter pills */}
      <Instrumented attrs={overlayC5} regionLabel="fundraiser-filters">
        <div
          className="filters"
          data-after-only
          role="group"
          aria-label="Filter fundraisers"
          data-overlay-tier="1"
          data-overlay-delta="C5"
          data-overlay-events="Fundraiser Filter Applied"
          data-overlay-metric="Fundraiser filters activated"
          data-overlay-why="Existing GFM filter UI shipped SSR-by-default."
          data-overlay-dashboard="donate-funnel"
        >
          <button type="button" className="pill pill--neutral">Category ▾</button>
          <button type="button" className="pill pill--neutral">Time Period ▾</button>
          <button type="button" className="pill pill--neutral">Close to Goal ▾</button>
        </div>
      </Instrumented>

      {/* C4: Leaderboard momentum prompt */}
      <Instrumented attrs={overlayC4} regionLabel="leaderboard-momentum-prompt">
        <div
          className="leaderprompt"
          data-after-only
          data-overlay-tier="1"
          data-overlay-delta="C4"
          data-overlay-events="Fundraiser Clicked Through, Start Fundraiser Clicked"
          data-overlay-metric="Leaderboard momentum prompt"
          data-overlay-why="Mirrors fundraiser-page momentum prompt on a high-intent surface."
          data-overlay-dashboard="donate-funnel"
        >
          <div className="lpstate show">
            <div className="eyebrow">{eyebrow}</div>
            <p style={{ margin: 'var(--hrt-size-spacing-1) 0', fontWeight: 'var(--hrt-font-weight-bold)' as 'bold' }}>
              {text}
            </p>
            {ctaLabel && (
              <button
                type="button"
                className={ctaVariant === 'primary' ? 'btn btn--primary btn--sm' : 'btn btn--secondary btn--sm'}
              >
                {ctaLabel}
              </button>
            )}
          </div>
        </div>
      </Instrumented>

      {/* Top fundraisers */}
      <h2 className="section-h" style={{ margin: 'var(--hrt-size-spacing-3) 0 var(--hrt-size-spacing-2)' }}>
        Top fundraisers
      </h2>
      <div className="lpcards">
        {trending.slice(0, 3).map((card) => {
          const pct = card.goalUsd > 0 ? Math.min(100, (card.raisedUsd / card.goalUsd) * 100) : 0;
          return (
            <div className="fcard fcard--condensed" key={card.id}>
              <div className="ph fcard__img" aria-hidden="true">
                <span className="ph__label">img</span>
              </div>
              <div className="fcard__body">
                <div className="fcard__title">{card.title}</div>
                <div className="goalbar progresswrap">
                  <div className="goalbar__fill" style={{ width: `${pct.toFixed(0)}%` }} />
                </div>
                <div className="fcard__meta">
                  {formatUsd(card.raisedUsd)} raised
                  {card.goalUsd > 0 ? ` of ${formatUsd(card.goalUsd)}` : ''}
                </div>
              </div>
              <button
                type="button"
                className="btn btn--primary btn--sm"
                style={{ alignSelf: 'center' }}
                onClick={() => handleFundraiserClick(card, 'community_leaderboard')}
              >
                Donate
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 'var(--hrt-size-spacing-2)' }}>
        <button type="button" className="btn btn--secondary btn--sm">See all fundraisers</button>
      </div>

      {/* Search bar */}
      <div className="searchbar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        Search fundraisers in {communityName}
      </div>

      {/* Grid of all fundraisers */}
      <div className="grid">
        {trending.map((card) => {
          const pct = card.goalUsd > 0 ? Math.min(100, (card.raisedUsd / card.goalUsd) * 100) : 0;
          return (
            <div className="fcard" key={card.id}>
              <div className="ph fcard__img" aria-hidden="true">
                <span className="ph__label">card</span>
              </div>
              <div className="fcard__body">
                <div className="fcard__title">{card.title}</div>
                <div className="goalbar">
                  <div className="goalbar__fill" style={{ width: `${pct.toFixed(0)}%` }} />
                </div>
                <div className="fcard__meta">{formatUsd(card.raisedUsd)} raised</div>
                <a
                  href={`/f/${card.id}`}
                  className="btn btn--primary btn--sm"
                  onClick={() => handleFundraiserClick(card, 'main_list')}
                >
                  Donate
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
