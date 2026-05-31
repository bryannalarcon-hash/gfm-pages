'use client';
/**
 * PostDonate — D3 full-screen post-donate surface.
 *
 * Sections: impact block, share row (D4/D9), recurring upgrade (D12), follow (D5),
 * community follow (conditional on community_id), similar carousel (D3/D11, L3.5 slot),
 * Suns moment (SunCreateModal + GrewRibbon).
 *
 * Events fired:
 *   Post Donate Viewed (amount_usd, frequency, first_time_donor)
 *   Post Donate Share Clicked (share_channel, time_since_donate_sec)
 *   Post Donate Recurring Upgrade Clicked (current_amount_usd, proposed_amount_usd)
 *   Post Donate Follow Clicked (follow_target)
 *   Post Donate Dismissed (time_on_screen_sec)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/shared/Button';
import { FollowButton } from '@/components/shared/FollowButton';
import { ShareSheet } from '@/components/shared/ShareSheet';
import { PersonalizedSlot } from '@/components/slots/PersonalizedSlot';
import { SunCreateModal } from '@/components/marks/SunCreateModal';
import { GrewRibbon } from '@/components/marks/GrewRibbon';
import { Instrumented } from '@/components/overlay/Instrumented';
import { capture } from '@/lib/analytics/capture';
import { mintShareId } from '@/lib/marks/attribution';
import type { ShareChannel, PageContext } from '@/lib/types';
import type { SlotCandidates } from '@/lib/personalization/slots';
import type { SunAction, SunGradient } from '@/lib/marks/types';
import type { OverlayAttrs } from '@/lib/overlay/types';

export interface PostDonateProps {
  amountUsd: number;
  frequency: 'one_time' | 'monthly';
  firstTimeDonor: boolean;
  fundraiserTitle: string;
  fundraiserId: string;
  organizerName: string;
  communityName: string | null;
  communityId: string | null;
  heroImageUrl: string | null;
  raisedUsd: number;
  goalUsd: number;
  copyByChannel: Partial<Record<ShareChannel, string>>;
  page: PageContext;
  candidates: SlotCandidates;
  /**
   * CB-04: seed-derived reach count for the viewer's sharer token on this fundraiser.
   * Shown in GrewRibbon after the viewer shares ("your share reached N people").
   * Derived from donation_attribution; 0 for viewers with no attributed donations (e.g. Priya).
   */
  sharerReach: number;
  onClose: () => void;
  /** CB-80: bubble the committed sun up so the page creates the viewer's ringed own-sun. */
  onSunCommit?: (g: SunGradient, consent: boolean) => void;
}

function formatUsd(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function buildImpactLine(amountUsd: number, organizerName: string, raisedUsd: number, goalUsd: number): string {
  const pct = goalUsd > 0 ? Math.round((raisedUsd / goalUsd) * 100) : 0;
  if (raisedUsd >= goalUsd) {
    return `Your ${formatUsd(amountUsd)} helped ${organizerName} hit the goal — ${pct}% funded.`;
  }
  const toGo = formatUsd(Math.max(0, goalUsd - raisedUsd));
  return `Your ${formatUsd(amountUsd)} brings ${organizerName} ${toGo} closer.`;
}

const D3_OVERLAY: OverlayAttrs = {
  'data-overlay-tier': '1',
  'data-overlay-events': 'Post Donate Viewed,Post Donate Share Clicked,Post Donate Dismissed',
  'data-overlay-delta': 'D3',
  'data-overlay-metric': 'second-conversion-rate',
  'data-overlay-why': 'Post-donate moment is the peak emotional window for secondary actions',
  'data-overlay-dashboard': 'donate-funnel',
};

const D12_POST_OVERLAY: OverlayAttrs = {
  'data-overlay-tier': '1',
  'data-overlay-events': 'Post Donate Recurring Upgrade Clicked',
  'data-overlay-delta': 'D12',
  'data-overlay-metric': 'recurring-uptake-rate',
  'data-overlay-why': 'Monthly upgrade at peak emotional moment captures highest LTV shift',
  'data-overlay-dashboard': 'donate-funnel',
};

const D5_POST_OVERLAY: OverlayAttrs = {
  'data-overlay-tier': '2',
  'data-overlay-events': 'Post Donate Follow Clicked',
  'data-overlay-delta': 'D5',
  'data-overlay-metric': 'follow-rate',
  'data-overlay-why': 'Follow at post-donate drives return visits via activity feed',
  'data-overlay-dashboard': 'retention',
};

const D4_POST_OVERLAY: OverlayAttrs = {
  'data-overlay-tier': '2',
  'data-overlay-events': 'Post Donate Share Clicked',
  'data-overlay-delta': 'D4',
  'data-overlay-metric': 'share-rate',
  'data-overlay-why': 'Per-channel share at highest-arousal moment maximizes k-factor',
  'data-overlay-dashboard': 'share-trends',
};

const SIMILAR_OVERLAY: OverlayAttrs = {
  'data-overlay-tier': '2',
  'data-overlay-events': 'Fundraiser Clicked Through',
  'data-overlay-delta': 'D3',
  'data-overlay-metric': 'post-donate-carousel-ctr',
  'data-overlay-why': 'Embedding-ranked similar fundraisers extend giving to related causes',
  'data-overlay-dashboard': 'retention',
};

export function PostDonate({
  amountUsd,
  frequency,
  firstTimeDonor,
  fundraiserTitle,
  fundraiserId,
  organizerName,
  communityName,
  communityId,
  heroImageUrl,
  raisedUsd,
  goalUsd,
  copyByChannel,
  page,
  candidates,
  sharerReach,
  onClose,
  onSunCommit,
}: PostDonateProps) {
  const openedAtRef = useRef(Date.now());
  const [following, setFollowing] = useState(false);
  const [upgradedToMonthly, setUpgradedToMonthly] = useState(false);
  const [ribbonShow, setRibbonShow] = useState(false);
  const [sunUnlocked, setSunUnlocked] = useState<SunAction[]>(['give']);

  // Fire Post Donate Viewed on mount
  useEffect(() => {
    capture('Post Donate Viewed', { amount_usd: amountUsd, frequency, first_time_donor: firstTimeDonor });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = useCallback(() => {
    const timeOnScreen = Math.round((Date.now() - openedAtRef.current) / 1000);
    capture('Post Donate Dismissed', { time_on_screen_sec: timeOnScreen });
    onClose();
  }, [onClose]);

  const handleShare = useCallback(
    (channel: ShareChannel) => {
      const timeSince = Math.round((Date.now() - openedAtRef.current) / 1000);
      const shareId = mintShareId({ entityType: 'fundraiser', entityId: fundraiserId, sharerToken: 'viewer', channel });
      capture('Post Donate Share Clicked', { share_channel: channel, time_since_donate_sec: timeSince });
      capture('Share Clicked', { share_channel: channel, share_context: 'post_donate', share_id: shareId });
      // Mark share action as unlocked for Suns
      setSunUnlocked((prev) => prev.includes('share') ? prev : [...prev, 'share']);
      setRibbonShow(true);
      setTimeout(() => setRibbonShow(false), 4000);
    },
    [fundraiserId],
  );

  const handleRecurringUpgrade = useCallback(() => {
    capture('Post Donate Recurring Upgrade Clicked', {
      current_amount_usd: amountUsd,
      proposed_amount_usd: amountUsd,
    });
    setUpgradedToMonthly(true);
  }, [amountUsd]);

  const handleFollow = useCallback(() => {
    setFollowing(true);
    capture('Post Donate Follow Clicked', { follow_target: 'organizer' });
    setSunUnlocked((prev) => prev.includes('follow') ? prev : [...prev, 'follow']);
  }, []);

  const handleCommunityFollow = useCallback(() => {
    capture('Post Donate Follow Clicked', { follow_target: 'community' });
    handleClose();
  }, [handleClose]);

  const handleSunCommit = useCallback((g: SunGradient, consent: boolean) => {
    capture('Mark Created', { action_type: 'give', entity_type: 'fundraiser' });
    // CB-80: hand the committed sun up to the page so it creates the viewer's ringed
    // own-sun on the board (PostDonate itself doesn't own the suns board).
    onSunCommit?.(g, consent);
  }, [onSunCommit]);

  const impactLine = buildImpactLine(amountUsd, organizerName, raisedUsd, goalUsd);
  const returningLine = !firstTimeDonor ? `Your donation to this fundraiser.` : null;

  return (
    <>
      {/* CB-04: reach is seed-derived (donation_attribution count for viewer's sharer token).
           For Priya (priya_m) this is 0; for mike_t this is 3 (DA1+DA2+DA3 attributed). */}
      <GrewRibbon reach={sharerReach} show={ribbonShow} />

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[900]"
        style={{ background: 'rgba(35,35,35,0.6)' }}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Thank you for donating"
        className="fixed inset-0 z-[910] flex items-end sm:items-center justify-center pointer-events-none"
      >
        <Instrumented attrs={D3_OVERLAY} regionLabel="post-donate-screen">
          <div
            className="pointer-events-auto w-full max-w-[560px] max-h-[92vh] overflow-y-auto bg-white rounded-xxxl sm:rounded-xxxl"
            style={{
              borderRadius: '24px 24px 0 0',
              boxShadow: '0px 6px 14px #0000001a',
              padding: 'var(--hrt-size-spacing-2)',
            }}
          >
            {/* Close */}
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="float-right text-[var(--hrt-color-text-supporting)] text-2xl leading-none bg-transparent border-0 cursor-pointer p-1"
            >
              ×
            </button>

            {/* Impact block */}
            <div
              className="rounded-[var(--hrt-size-radius-xxl)] p-[var(--hrt-size-spacing-2)] mb-[var(--hrt-size-spacing-2)] flex gap-[var(--hrt-size-spacing-2)] items-start"
              style={{ background: 'var(--hrt-color-surface-brand-subtle)' }}
            >
              {heroImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={heroImageUrl}
                  alt={fundraiserTitle}
                  width={64}
                  height={64}
                  className="rounded-[var(--hrt-size-radius-xl)] object-cover flex-none"
                  style={{ width: 64, height: 64 }}
                />
              )}
              <div>
                <p
                  className="m-0 font-bold text-[var(--hrt-color-text-headings)] leading-tight"
                  style={{ fontSize: 'var(--hrt-size-font-body-md)' }}
                >
                  {impactLine}
                </p>
                {returningLine && (
                  <p className="m-0 mt-1 text-body-sm text-[var(--hrt-color-text-supporting)]">
                    {returningLine}
                  </p>
                )}
              </div>
            </div>

            {/* Share section — D4/D9 */}
            <section aria-label="Share this fundraiser" className="mb-[var(--hrt-size-spacing-2)]">
              <h2 className="text-body-sm font-bold text-[var(--hrt-color-text-supporting)] uppercase tracking-wide mb-[var(--hrt-size-spacing-1)] m-0">
                Share this fundraiser
              </h2>
              <Instrumented attrs={D4_POST_OVERLAY} regionLabel="post-donate-share">
                <ShareSheet
                  entityType="fundraiser"
                  entityId={fundraiserId}
                  copyByChannel={copyByChannel}
                  context="post_donate"
                  onShare={handleShare}
                />
              </Instrumented>
            </section>

            {/* Recurring upgrade — D12 (only if one-time donor) */}
            {frequency === 'one_time' && !upgradedToMonthly && (
              <section
                aria-label="Make it monthly"
                className="mb-[var(--hrt-size-spacing-2)]"
              >
                <Instrumented attrs={D12_POST_OVERLAY} regionLabel="post-donate-recurring">
                  <h2 className="text-body-sm font-bold text-[var(--hrt-color-text-supporting)] uppercase tracking-wide mb-[var(--hrt-size-spacing-1)] m-0">
                    Make it monthly
                  </h2>
                  <p className="text-body-md text-[var(--hrt-color-text-default)] m-0 mb-[var(--hrt-size-spacing-1)]">
                    {organizerName} needs ongoing support. {formatUsd(amountUsd)}/month?
                  </p>
                  <div className="flex gap-[var(--hrt-size-spacing-1)]">
                    <Button variant="primary" size="md" onClick={handleRecurringUpgrade} className="flex-1">
                      Upgrade to {formatUsd(amountUsd)}/month
                    </Button>
                    <Button variant="ghost" size="md" onClick={() => setUpgradedToMonthly(true)} className="flex-none">
                      No thanks
                    </Button>
                  </div>
                </Instrumented>
              </section>
            )}
            {upgradedToMonthly && frequency === 'one_time' && (
              <p className="text-body-sm text-[var(--hrt-color-text-brand-strong)] font-bold mb-[var(--hrt-size-spacing-2)]">
                Monthly giving activated.
              </p>
            )}

            {/* Follow section — D5 */}
            <section aria-label="Follow this fundraiser" className="mb-[var(--hrt-size-spacing-2)]">
              <Instrumented attrs={D5_POST_OVERLAY} regionLabel="post-donate-follow">
                <h2 className="text-body-sm font-bold text-[var(--hrt-color-text-supporting)] uppercase tracking-wide mb-[var(--hrt-size-spacing-1)] m-0">
                  Follow this fundraiser
                </h2>
                <FollowButton
                  variant="ghost"
                  following={following}
                  label={`Follow ${fundraiserTitle}`}
                  onToggle={handleFollow}
                  className="w-full"
                />
                <p className="text-body-xs text-[var(--hrt-color-text-supporting)] mt-1 m-0">
                  Get an email when {organizerName} posts an update.
                </p>
              </Instrumented>
            </section>

            {/* Community follow — zero height if no community_id */}
            {communityId && communityName ? (
              <section aria-label="Stay connected to the cause" className="mb-[var(--hrt-size-spacing-2)]">
                <hr className="border-[var(--hrt-color-border-neutral-extra-subtle)] mb-[var(--hrt-size-spacing-2)]" />
                <h2 className="text-body-sm font-bold text-[var(--hrt-color-text-supporting)] uppercase tracking-wide mb-[var(--hrt-size-spacing-1)] m-0">
                  Stay connected to the cause
                </h2>
                <Button variant="secondary" size="md" block onClick={handleCommunityFollow}>
                  Also follow {communityName}
                </Button>
                <p className="text-body-xs text-[var(--hrt-color-text-supporting)] mt-1 m-0">
                  Get updates from related fundraisers too.
                </p>
              </section>
            ) : (
              <span style={{ height: 0, display: 'block', overflow: 'hidden' }} aria-hidden="true" />
            )}

            {/* Similar fundraisers carousel — D3/D11, L3.5 slot */}
            <section aria-label="You might also support" className="mb-[var(--hrt-size-spacing-2)]">
              <Instrumented attrs={SIMILAR_OVERLAY} regionLabel="post-donate-similar">
                <h2 className="text-body-sm font-bold text-[var(--hrt-color-text-supporting)] uppercase tracking-wide mb-[var(--hrt-size-spacing-1)] m-0">
                  You might also support
                </h2>
                <PersonalizedSlot
                  name="similar_carousel"
                  page={page}
                  candidates={candidates}
                  overlay={SIMILAR_OVERLAY}
                  sectionName="similar_carousel_post_donate"
                />
              </Instrumented>
            </section>

            {/* Suns moment — greyed-until-unlocked */}
            <section aria-label="Leave your mark" className="mt-[var(--hrt-size-spacing-2)]">
              <SunCreateModal unlockedBy={sunUnlocked} onCommit={handleSunCommit} />
            </section>
          </div>
        </Instrumented>
      </div>
    </>
  );
}
