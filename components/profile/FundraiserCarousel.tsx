'use client';
/**
 * FundraiserCarousel — P5 fundraiser carousel with state-aware line.
 *
 * Matches mock structure: section.carousel > h2.section-h + div.profile-carousel
 * Each card: .fcard > a > .ph.fcard__img + .fcard__body > title + goalbar + meta + stateline
 *
 * P5 (Tier 1): adds a single state-aware line under the progress bar:
 *   >= 100% funded: "Goal reached — still accepting donations" (.stateline--pos)
 *   >= 80% funded:  "$X to go" (.stateline--near)
 *   default:        no extra line
 *
 * CB-71: prev/next controls with aria-label "Previous"/"Next", dot indicators.
 * Card click fires 'Fundraiser Clicked Through' (EventName from lib/types).
 */

import React, { useCallback, useRef, useState } from 'react';
import { Instrumented } from '@/components/overlay/Instrumented';
import { capture } from '@/lib/analytics/capture';
import type { SimilarCard } from '@/lib/types';
import type { OverlayAttrs } from '@/lib/overlay/types';

export interface FundraiserCarouselProps {
  fundraisers: SimilarCard[];
  profileHandle: string;
  /** First name of the organizer for the heading ("Fundraisers by {firstName}") */
  organizerFirstName?: string;
  overlay: OverlayAttrs;
}

function pctFunded(card: SimilarCard): number {
  if (!card.goalUsd || card.goalUsd <= 0) return 0;
  return card.raisedUsd / card.goalUsd;
}

function stateAwareLine(card: SimilarCard): { text: string; cls: string } | null {
  const pct = pctFunded(card);
  if (pct >= 1) {
    return { text: 'Goal reached — still accepting donations', cls: 'stateline--pos' };
  }
  if (pct >= 0.8) {
    const toGo = card.goalUsd - card.raisedUsd;
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(toGo);
    return { text: `${formatted} to go`, cls: 'stateline--near' };
  }
  return null;
}

function goalbarWidth(card: SimilarCard): string {
  const pct = Math.min(pctFunded(card), 1);
  return `${Math.round(pct * 100)}%`;
}

function metaText(card: SimilarCard): string {
  const pct = pctFunded(card);
  const raisedK = card.raisedUsd >= 1000
    ? `$${(card.raisedUsd / 1000).toFixed(0)}k`
    : `$${card.raisedUsd.toLocaleString()}`;
  return `${Math.round(pct * 100)}% · ${raisedK} raised`;
}

interface CarouselCardProps {
  card: SimilarCard;
  profileHandle: string;
}

function CarouselCard({ card, profileHandle }: CarouselCardProps) {
  const stateLine = stateAwareLine(card);

  const handleClick = useCallback(() => {
    capture('Fundraiser Clicked Through', {
      referrer_source: 'profile',
      fundraiser_id: card.id,
      organizer_handle: profileHandle,
    });
  }, [card.id, profileHandle]);

  return (
    <div className="fcard">
      <a href={`/f/${card.id}`} onClick={handleClick} aria-label={card.title}>
        <div className="ph fcard__img">
          <span className="ph__label">card</span>
        </div>
      </a>
      <div className="fcard__body">
        <div className="fcard__title">{card.title}</div>
        <div className="goalbar">
          <div className="goalbar__fill" style={{ width: goalbarWidth(card) }} />
        </div>
        <div className="fcard__meta">{metaText(card)}</div>
        {stateLine && (
          <div className={`stateline ${stateLine.cls}`}>{stateLine.text}</div>
        )}
      </div>
    </div>
  );
}

export function FundraiserCarousel({
  fundraisers,
  profileHandle,
  organizerFirstName,
  overlay,
}: FundraiserCarouselProps) {
  // Hooks must run unconditionally and in a stable order on every render — declare them
  // BEFORE any early return (react-hooks/rules-of-hooks; strict in `next build`).
  const total = fundraisers.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  // Visible cards: ~1.1 on mobile (80% card shows peek of next), 2 on tablet+
  // We move by 1 card at a time.
  const goTo = useCallback((idx: number) => {
    // Wrap-around: previous from 0 goes to last, next from last goes to 0
    const wrapped = ((idx % total) + total) % total;
    setActiveIndex(wrapped);
    if (trackRef.current) {
      // Each card is 80% of track width + gap (8px). We approximate by scrolling
      // the track wrapper child by card unit width.
      const trackWrap = trackRef.current.parentElement;
      if (!trackWrap) return;
      const wrapWidth = trackWrap.clientWidth;
      // card width ≈ 80% of container minus gap
      const cardWidth = wrapWidth * 0.8;
      const gapPx = 8;
      const offset = wrapped * (cardWidth + gapPx);
      trackRef.current.style.transform = `translateX(-${offset}px)`;
    }
  }, [total]);

  const handlePrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
  const handleNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  // Nothing to render with no fundraisers — early return AFTER the hooks above.
  if (fundraisers.length === 0) return null;

  const headingName = organizerFirstName ?? profileHandle;

  return (
    <Instrumented attrs={overlay} regionLabel="fundraiser-carousel-p5">
      <section className="carousel" data-screen-label="Fundraiser carousel">
        <h2
          className="section-h"
          style={{ marginBottom: 'var(--hrt-size-spacing-2)' }}
        >
          Fundraisers by {headingName}
        </h2>

        {/* CB-71: profile carousel with prev/next controls */}
        <div className="profile-carousel">
          <div className="profile-carousel__track-wrap">
            <div className="profile-carousel__track" ref={trackRef}>
              {fundraisers.map((card) => (
                <CarouselCard
                  key={card.id}
                  card={card}
                  profileHandle={profileHandle}
                />
              ))}
            </div>
          </div>

          {/* Controls: prev arrow · dots · next arrow */}
          {total > 1 && (
            <div className="profile-carousel__controls">
              <button
                type="button"
                className="profile-carousel__arrow"
                aria-label="Previous"
                onClick={handlePrev}
              >
                ‹
              </button>

              <div className="profile-carousel__dots" role="tablist" aria-label="Fundraiser slides">
                {fundraisers.map((card, i) => (
                  <button
                    key={card.id}
                    type="button"
                    className="profile-carousel__dot"
                    role="tab"
                    aria-label={`Go to fundraiser ${i + 1}`}
                    aria-current={i === activeIndex ? 'true' : undefined}
                    data-carousel-dot=""
                    onClick={() => goTo(i)}
                  />
                ))}
              </div>

              <button
                type="button"
                className="profile-carousel__arrow"
                aria-label="Next"
                onClick={handleNext}
              >
                ›
              </button>
            </div>
          )}
        </div>
      </section>
    </Instrumented>
  );
}
