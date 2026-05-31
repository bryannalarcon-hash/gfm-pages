'use client';
/**
 * ProfileHero — P1 + P3 + P6 + P8 hero region.
 *
 * Matches mock section class="hero" exactly:
 *   hero__row: avatar (xxxl) + div[flex:1] containing name, counts, cta, microcopy,
 *              causes, tenure, bionudge.
 *
 * P1: Follow button with value-prop microcopy (Tier 2).
 * P3: Cause pills relocated to hero + owner-only bio nudge (Tier 1).
 * P6: Tenure badge "Organizing since {year} · N fundraisers" (Tier 2, trust signal).
 * P8: Share profile button (Tier 2).
 *
 * isOwnerView: computed by parent ProfilePage client-side.
 * Owner state: "This is your profile" pill + Edit profile btn — no Follow CTA.
 * Following state: btn--following.
 * Default: btn--primary Follow {firstName}.
 *
 * NO green CTA on white. Follow button is primary (#232323).
 */

import React, { useCallback, useState } from 'react';
import { Instrumented } from '@/components/overlay/Instrumented';
import { capture } from '@/lib/analytics/capture';
import type { ProfileRow } from '@/lib/db/queries';
import type { ShareChannel } from '@/lib/types';
import type { OverlayAttrs } from '@/lib/overlay/types';

export interface ProfileHeroProps {
  profile: ProfileRow;
  fundraiserCount: number;
  isFollowing: boolean;
  isOwnerView: boolean;
  copyByChannel: Partial<Record<ShareChannel, string>>;
  onFollowToggle: () => void;
  overlayP1: OverlayAttrs;
  overlayP3: OverlayAttrs;
  overlayP6: OverlayAttrs;
  overlayP8: OverlayAttrs;
  /** Estimated following count for display (profile DB doesn't track outgoing follows yet) */
  followingCount?: number;
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (parts[0]?.[0] ?? '').toUpperCase();
}

export function ProfileHero({
  profile,
  fundraiserCount,
  isFollowing,
  isOwnerView,
  onFollowToggle,
  overlayP1,
  overlayP3,
  overlayP6,
  overlayP8,
  followingCount = 0,
}: ProfileHeroProps) {
  const [showShareSheet, setShowShareSheet] = useState(false);
  const firstName = profile.display_name.split(' ')[0];

  const handleFollowClick = useCallback(() => {
    if (isOwnerView) return;
    capture('Follow Clicked', { follow_context: 'hero' });
    onFollowToggle();
  }, [isOwnerView, onFollowToggle]);

  const handleShareClick = useCallback(() => {
    capture('Share Clicked', { share_context: 'hero', share_channel: 'native_share' as ShareChannel });
    setShowShareSheet((v) => !v);
  }, []);

  // P6: only shown for organizers with 2+ fundraisers
  const showTenure = fundraiserCount >= 2 && typeof profile.joined_year === 'number';

  // P3: cause pills (max 3)
  const causePills = (profile.cause_tags ?? []).slice(0, 3);

  const initials = initialsFor(profile.display_name);

  return (
    <section className="hero" data-screen-label="Hero">
      <div className="hero__row">
        {/* Avatar — xxxl, using mock's avatar CSS class */}
        <span className="avatar avatar--xxxl" aria-label={profile.display_name}>
          {initials}
        </span>

        <div style={{ flex: 1 }}>
          {/* Name */}
          <h1 className="hero__name">{profile.display_name}</h1>

          {/* Follower + following counts */}
          <div className="counts">
            <strong>{profile.follower_count.toLocaleString()}</strong> followers
            {followingCount > 0 && (
              <> · <strong>{followingCount.toLocaleString()}</strong> following</>
            )}
          </div>

          {/* P1 + P8 CTAs */}
          <Instrumented attrs={overlayP1} regionLabel="hero-follow-p1">
            <div className="hero__cta">
              {!isOwnerView ? (
                <>
                  {/* P1 Follow button */}
                  {!isFollowing ? (
                    <button
                      type="button"
                      className="btn btn--primary js-follow"
                      data-variant="primary"
                      data-overlay-tier={overlayP1['data-overlay-tier']}
                      data-overlay-delta={overlayP1['data-overlay-delta']}
                      data-overlay-events={overlayP1['data-overlay-events']}
                      data-overlay-metric={overlayP1['data-overlay-metric']}
                      data-overlay-why={overlayP1['data-overlay-why']}
                      data-overlay-dashboard={overlayP1['data-overlay-dashboard']}
                      onClick={handleFollowClick}
                    >
                      Follow {firstName}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn--following js-follow"
                      data-variant="following"
                      onClick={handleFollowClick}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {' '}Following
                    </button>
                  )}

                  {/* P8 Share button */}
                  <Instrumented attrs={overlayP8} regionLabel="hero-share-p8">
                    <button
                      type="button"
                      className="btn btn--secondary js-share"
                      onClick={handleShareClick}
                      aria-expanded={showShareSheet}
                      aria-label="Share profile"
                    >
                      Share profile
                    </button>
                  </Instrumented>
                </>
              ) : (
                <>
                  <span className="pill pill--neutral">This is your profile</span>
                  <button type="button" className="btn btn--secondary btn--sm">
                    Edit profile
                  </button>
                </>
              )}
            </div>
          </Instrumented>

          {/* P1 microcopy */}
          {!isOwnerView && (
            <div className="followmicro">
              {isFollowing
                ? "Following — you'll hear about new activity."
                : `Get updates when ${firstName} organizes or donates.`}
            </div>
          )}

          {/* P3 — Cause pills in hero (max 3) */}
          {causePills.length > 0 && (
            <Instrumented attrs={overlayP3} regionLabel="hero-cause-pills-p3">
              <div className="causes">
                {causePills.map((cause) => (
                  <span key={cause} className="pill pill--cause">
                    {cause.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </Instrumented>
          )}

          {/* P6 — Tenure badge */}
          {showTenure && (
            <Instrumented attrs={overlayP6} regionLabel="hero-tenure-p6">
              <div className="tenure">
                Organizing on GoFundMe since {profile.joined_year}&nbsp;&middot;&nbsp;
                {fundraiserCount} fundraiser{fundraiserCount !== 1 ? 's' : ''}
              </div>
            </Instrumented>
          )}

          {/* P3 — Owner-only bio nudge */}
          {isOwnerView && (
            <Instrumented attrs={overlayP3} regionLabel="hero-bio-nudge-p3">
              <div className="bionudge">
                <span>Add a bio to help followers know what you stand for.</span>
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={() => window.location.assign(`/u/${profile.handle}/edit#bio`)}
                >
                  Complete profile →
                </button>
              </div>
            </Instrumented>
          )}
        </div>
      </div>
    </section>
  );
}
