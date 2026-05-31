'use client';
// CommunityHero — C1, C6, C7.
// Matches mocks/community-v4.2.html hero section exactly:
//   .hero > .cover + .warmarrival + .hero__head + .hero__cta + .followmicro
// CB-15: .cover renders community.cover_image_url via next/image; falls back to .ph placeholder
//        if cover_image_url is null (404-safe: onError handler swaps to placeholder).
// Sticky .chead reveals on scroll past hero (IntersectionObserver, same logic as mock).
// NO green CTA on white — Follow uses btn--primary (#232323).

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import type { ShareChannel, PageContext } from '@/lib/types';
import type { CommunityRow } from '@/components/community/types';
import type { OverlayAttrs } from '@/lib/overlay/types';
import { Instrumented } from '@/components/overlay/Instrumented';
import { useOverlay } from '@/lib/overlay/context';
import { capture } from '@/lib/analytics/capture';

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

/**
 * CB-15: CoverImage — renders the community cover photo (16:9) via next/image.
 * Falls back to the .ph placeholder if src is null or the image 404s.
 * Desktop: aspect-ratio 21:9 (matches mock media query); Mobile: 16:9.
 */
function CoverImage({ src, alt }: { src: string | null; alt: string }) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div className="ph cover" aria-hidden="true">
        <span className="ph__label">community cover image · 16:9</span>
      </div>
    );
  }

  return (
    <div className="cover" style={{ position: 'relative', overflow: 'hidden' }}>
      <Image
        src={src}
        alt={`${alt} cover`}
        fill
        sizes="(min-width: 768px) 100vw, 100vw"
        style={{ objectFit: 'cover' }}
        priority
        onError={() => setErrored(true)}
      />
    </div>
  );
}

/** C1: Milestone gamification copy — fires at 5/25/100/500 thresholds */
function milestoneLabel(followerCount: number): string | null {
  // Beyond 500: social-proof copy (matches mock: "1,247 people are following — be #1,248!")
  if (followerCount >= 500) {
    return `${followerCount.toLocaleString()} people are following — be #${(followerCount + 1).toLocaleString()}!`;
  }
  const thresholds = [5, 25, 100, 500];
  for (const t of thresholds) {
    if (followerCount < t) {
      return `${followerCount} people are following — be #${followerCount + 1}!`;
    }
  }
  return null;
}

interface CommunityHeroProps {
  community: CommunityRow;
  following: boolean;
  onFollow: () => void;
  onShareOpen: () => void;
  shareOpen: boolean;
  shareCopy: Partial<Record<ShareChannel, string>>;
  onShare: (channel: ShareChannel, copy: string) => void;
  overlayC1: OverlayAttrs;
  overlayC6: OverlayAttrs;
  overlayC7: OverlayAttrs;
  pageCtx: PageContext;
}

export function CommunityHero({
  community,
  following,
  onFollow,
  onShareOpen,
  overlayC1,
  overlayC6,
  overlayC7,
}: CommunityHeroProps) {
  const [toastVisible, setToastVisible] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  // CB-49: drop the sticky bar below the scrim (z-index 900) while overlay is on,
  // so the scrim dims it. Must NOT highlight it (CB-35) — just be dimmed.
  const { overlayOn } = useOverlay();

  // Sticky chead reveal: IntersectionObserver on hero — same logic as mock JS
  useEffect(() => {
    const hero = heroRef.current;
    const chead = document.getElementById('chead');
    if (!hero || !chead || !('IntersectionObserver' in window)) return;
    const obs = new IntersectionObserver(
      ([e]) => chead.classList.toggle('show', !e.isIntersecting),
      { rootMargin: '-80px 0px 0px 0px' },
    );
    obs.observe(hero);
    return () => obs.disconnect();
  }, []);

  const handleFollow = useCallback(() => {
    onFollow();
    if (!following) {
      capture('Community Followed', {
        community_id: community.id,
        community_name: community.name,
      });
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 3500);
    }
  }, [following, onFollow, community.id, community.name]);

  const handleShare = useCallback(() => {
    capture('Share Clicked', {
      share_context: 'community',
      community_id: community.id,
    });
    onShareOpen();
  }, [community.id, onShareOpen]);

  const followerCount = community.follower_count;
  const raised = community.raised_usd ?? 0;
  const fundraiserCount = community.fundraiser_count ?? 0;
  const milestone = milestoneLabel(followerCount);

  return (
    <>
      {/* Sticky community header — reveals on scroll past hero (z-30).
          CB-49: when overlay is on, drop below the scrim (z 900) so it gets dimmed.
          overlayOn=false → no inline z-index (CSS class controls normal stacking). */}
      <div
        className="chead"
        id="chead"
        data-after-only
        style={overlayOn ? { zIndex: 899 } : undefined}
      >
        <div className="hrt-container lg chead__inner">
          <span className="chead__name">{community.name}</span>
          <a className="btn btn--secondary btn--sm" href="#">Start a GoFundMe</a>
        </div>
      </div>

      <section className="hero" id="hero" ref={heroRef} aria-label="Community hero">
        {/* CB-15: cover image — next/image with graceful placeholder fallback on 404 */}
        <CoverImage src={community.cover_image_url} alt={community.name} />

        {/* C2: warm arrival banner (shared_by_extro persona) */}
        <div className="warmarrival" data-after-only>
          Welcome — you just supported a fundraiser in this community.
        </div>

        {/* Community name + stats + milestone copy */}
        <div className="hero__head">
          <div>
            <h1 className="hero__name">{community.name}</h1>

            {/* C7: SSR stats — zero CLS */}
            <Instrumented attrs={overlayC7} regionLabel="community-stats">
              <div className="stats">
                {raised > 0 && <><strong>{formatUsd(raised)}</strong> raised · </>}
                {fundraiserCount > 0 && <><strong>{fundraiserCount.toLocaleString()}</strong> fundraisers · </>}
                <strong>{followerCount.toLocaleString()}</strong> people following
              </div>
            </Instrumented>

            {/* C1: milestone gamification copy */}
            {milestone && (
              <Instrumented attrs={overlayC1} regionLabel="community-milestone-copy">
                <div className="milestone" data-after-only aria-live="polite">
                  {milestone}
                </div>
              </Instrumented>
            )}
          </div>
          {/* Community badge pill */}
          <span className="pill pill--neutral">COMMUNITY</span>
        </div>

        {/* C1: Follow + C6: Share CTAs */}
        <div className="hero__cta">
          <Instrumented attrs={overlayC1} regionLabel="community-follow-cta">
            <button
              type="button"
              className={following ? 'btn btn--following js-follow' : 'btn btn--primary js-follow'}
              onClick={handleFollow}
              data-overlay-tier="2"
              data-overlay-delta="C1"
              data-overlay-events="Community Followed"
              data-overlay-metric="Follow CTA — first-class + value prop"
              data-overlay-why="Labeled Follow + persistent value-prop microcopy + milestone copy at 5/25/100/500."
              data-overlay-dashboard="repeat-visits"
            >
              {following ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {' '}Following {community.name}
                </>
              ) : (
                `Follow ${community.name}`
              )}
            </button>
          </Instrumented>

          <Instrumented attrs={overlayC6} regionLabel="community-share-cta">
            <button
              type="button"
              className="btn btn--secondary js-share"
              onClick={handleShare}
              data-overlay-tier="2"
              data-overlay-delta="C6"
              data-overlay-events="Share Clicked"
              data-overlay-metric="AI per-channel community share copy"
              data-overlay-why="LLM copy per (community, channel), regenerated every 30d."
              data-overlay-dashboard="share-trends"
            >
              Share
            </button>
          </Instrumented>
        </div>

        {/* C1: value-prop microcopy */}
        <div className="followmicro" data-after-only>
          Get updates when new fundraisers are added or milestones are hit.
        </div>

        {/* C1: post-follow toast (fixed bottom) */}
        <div
          className={toastVisible ? 'toast show' : 'toast'}
          id="toast"
          role="status"
          aria-live="polite"
        >
          You&rsquo;re following {community.name} — we&rsquo;ll email you when something new happens.
        </div>
      </section>
    </>
  );
}
