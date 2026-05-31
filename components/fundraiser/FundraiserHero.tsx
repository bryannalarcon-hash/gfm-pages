'use client';
/**
 * FundraiserHero — D1/D2/D4/D5/D7
 * Title, hero image (next/image priority LCP), organizer link, community badge,
 * progress bar with near-goal urgency (D2), Donate CTA (D1), Follow (D5), share row (D4).
 *
 * Constraints:
 * - NO green CTA on white (D5 Follow uses secondary/ghost variant)
 * - Count-up animation on raisedPct change (D2), respects prefers-reduced-motion
 * - SSR'd numbers → zero CLS
 */

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/shared/Button';
import { FollowButton } from '@/components/shared/FollowButton';
import { Avatar } from '@/components/shared/Avatar';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Instrumented } from '@/components/overlay/Instrumented';
import { capture } from '@/lib/analytics/capture';
import type { ShareChannel } from '@/lib/types';
import type { OverlayAttrs } from '@/lib/overlay/types';

export interface FundraiserHeroProps {
  title: string;
  heroImageUrl: string | null;
  organizerName: string;
  organizerHandle: string;
  communityName: string | null;
  communitySlug: string | null;
  raisedUsd: number;
  goalUsd: number;
  donationCount: number;
  followerCount: number;
  /** Open donate card/bottom-sheet */
  onDonate: () => void;
  /** Open share sheet */
  onShare: (channel?: ShareChannel) => void;
}

function formatUsd(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

const SHARE_CHANNELS: Array<{ channel: ShareChannel; label: string; color: string }> = [
  { channel: 'facebook',  label: 'FB',    color: '#1877F2' },
  { channel: 'whatsapp',  label: 'WA',    color: '#25D366' },
  { channel: 'x',         label: 'X',     color: '#000'    },
  { channel: 'messenger', label: 'MSG',   color: '#0084FF' },
  { channel: 'sms',       label: 'SMS',   color: '#34C759' },
  { channel: 'email',     label: 'Email', color: '#6f6f6f' },
  { channel: 'copy_link', label: 'Link',  color: '#b7b7b6' },
];

// Overlay attrs for each Instrumented region
const D1_HERO_OVERLAY: OverlayAttrs = {
  'data-overlay-tier': '1',
  'data-overlay-events': 'Donate Intent',
  'data-overlay-delta': 'D1',
  'data-overlay-metric': 'checkout-completion-rate',
  'data-overlay-why': 'Single-screen form replaces multi-step off-page donate flow',
  'data-overlay-dashboard': 'donate-funnel',
};

const D2_OVERLAY: OverlayAttrs = {
  'data-overlay-tier': '1',
  'data-overlay-events': 'Donate Intent',
  'data-overlay-delta': 'D2',
  'data-overlay-metric': 'donate-intent-rate',
  'data-overlay-why': 'Near-goal urgency callout accelerates giving in the final stretch',
  'data-overlay-dashboard': 'donate-funnel',
};

const D4_OVERLAY: OverlayAttrs = {
  'data-overlay-tier': '2',
  'data-overlay-events': 'Share Clicked',
  'data-overlay-delta': 'D4',
  'data-overlay-metric': 'share-rate',
  'data-overlay-why': 'Per-channel share placed at emotional peak to maximize k-factor',
  'data-overlay-dashboard': 'share-trends',
};

const D5_OVERLAY: OverlayAttrs = {
  'data-overlay-tier': '2',
  'data-overlay-events': 'Follow Clicked',
  'data-overlay-delta': 'D5',
  'data-overlay-metric': 'follow-rate',
  'data-overlay-why': 'Labeled Follow with value prop drives repeat visits',
  'data-overlay-dashboard': 'retention',
};

export function FundraiserHero({
  title,
  heroImageUrl,
  organizerName,
  organizerHandle,
  communityName,
  communitySlug,
  raisedUsd,
  goalUsd,
  donationCount,
  followerCount,
  onDonate,
  onShare,
}: FundraiserHeroProps) {
  const [following, setFollowing] = useState(false);

  const pct = goalUsd > 0 ? raisedUsd / goalUsd : 0;
  const nearGoal = pct >= 0.8;
  const toGoUsd = Math.max(0, goalUsd - raisedUsd);

  const handleDonateClick = useCallback(() => {
    capture('Donate Intent', { cta_location: 'hero' });
    onDonate();
  }, [onDonate]);

  const handleFollow = useCallback(() => {
    setFollowing((prev) => !prev);
    capture('Follow Clicked', { follow_context: 'sidebar' });
  }, []);

  const handleShareChannel = useCallback(
    (channel: ShareChannel) => {
      capture('Share Clicked', { share_channel: channel, share_context: 'hero' });
      onShare(channel);
    },
    [onShare],
  );

  return (
    <section aria-label="Fundraiser overview">
      {/* Hero image — next/image priority for LCP (D7) */}
      <div
        className="relative w-full overflow-hidden"
        style={{ borderRadius: 'var(--hrt-size-radius-xl)', aspectRatio: '16/9' }}
      >
        {heroImageUrl ? (
          <Image
            src={heroImageUrl}
            alt={title}
            fill
            priority
            sizes="(min-width: 1024px) 680px, 100vw"
            className="object-cover"
            style={{ borderRadius: 'var(--hrt-size-radius-xl)' }}
          />
        ) : (
          <div
            className="w-full h-full bg-[var(--hrt-color-surface-neutral-subtle)]"
            aria-hidden="true"
          />
        )}
      </div>

      <div className="mt-[var(--hrt-size-spacing-2)] flex flex-col gap-[var(--hrt-size-spacing-2)]">
        {/* Title */}
        <h1
          className="m-0 text-[var(--hrt-size-font-heading-lg)] font-bold text-[var(--hrt-color-text-headings)] leading-tight"
          style={{ letterSpacing: '-0.01em' }}
        >
          {title}
        </h1>

        {/* Organizer row */}
        <div className="flex items-center gap-[var(--hrt-size-spacing-1)] flex-wrap">
          <Avatar initial={organizerName.charAt(0).toUpperCase()} size="sm" label={organizerName} />
          <span className="text-body-sm text-[var(--hrt-color-text-supporting)]">
            Organized by{' '}
            <a
              href={`/u/${organizerHandle}`}
              className="text-[var(--hrt-color-text-default)] font-bold hover:underline"
            >
              {organizerName}
            </a>
          </span>

          {/* Community badge — zero height if no community (L3.5 collapse pattern) */}
          {communityName && communitySlug ? (
            <a
              href={`/c/${communitySlug}`}
              className="inline-flex items-center px-[var(--hrt-size-spacing-1)] text-body-xs font-bold rounded-full no-underline"
              style={{
                background: 'var(--hrt-color-surface-brand-subtle)',
                color: 'var(--hrt-color-text-brand-strong)',
              }}
            >
              {communityName}
            </a>
          ) : (
            <span style={{ height: 0, overflow: 'hidden', display: 'block' }} aria-hidden="true" />
          )}
        </div>

        {/* D2 Progress bar with near-goal urgency */}
        <Instrumented attrs={D2_OVERLAY} regionLabel="goal-progress">
          <ProgressBar raisedUsd={raisedUsd} goalUsd={goalUsd} showLabels />
          {nearGoal && (
            <p
              className="mt-[var(--hrt-size-spacing-1)] text-body-sm font-bold text-[var(--hrt-color-text-default)]"
              aria-live="polite"
            >
              {formatUsd(toGoUsd)} to go
            </p>
          )}
          <p className="mt-1 text-body-xs text-[var(--hrt-color-text-supporting)]">
            {donationCount.toLocaleString()} donations
          </p>
        </Instrumented>

        {/* D1 Donate + D5 Follow */}
        <div className="flex flex-wrap gap-[var(--hrt-size-spacing-1)] mt-[var(--hrt-size-spacing-1)]">
          <Instrumented attrs={D1_HERO_OVERLAY} regionLabel="donate-hero-cta">
            <Button variant="primary" size="lg" onClick={handleDonateClick} className="flex-1 min-w-[140px]">
              Donate
            </Button>
          </Instrumented>

          <Instrumented attrs={D5_OVERLAY} regionLabel="follow-hero-cta">
            {/* secondary/ghost — NOT primary on white (Follow CTA Variant Rule) */}
            <FollowButton
              variant="ghost"
              following={following}
              label="Follow this fundraiser"
              onToggle={handleFollow}
              className="flex-1 min-w-[140px]"
            />
          </Instrumented>
        </div>

        {/* Follow microcopy + follower count */}
        <p className="text-body-xs text-[var(--hrt-color-text-supporting)] -mt-1">
          Get an email when {organizerName} posts an update.{' '}
          <span className="font-bold">{followerCount.toLocaleString()} followers</span>
        </p>

        {/* D4 Share row — hero surface */}
        <Instrumented attrs={D4_OVERLAY} regionLabel="share-row-hero">
          <div
            className="flex gap-[var(--hrt-size-spacing-1)] overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
            role="list"
            aria-label="Share this fundraiser"
          >
            {SHARE_CHANNELS.map(({ channel, label, color }) => (
              <button
                key={channel}
                role="listitem"
                type="button"
                onClick={() => handleShareChannel(channel)}
                aria-label={`Share on ${label}`}
                className="flex-none inline-flex items-center justify-center w-10 h-10 rounded-full text-white text-body-xs font-bold transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hrt-color-border-brand)]"
                style={{ backgroundColor: color }}
              >
                <span aria-hidden="true" className="text-[10px]">{label}</span>
              </button>
            ))}
          </div>
        </Instrumented>
      </div>
    </section>
  );
}
