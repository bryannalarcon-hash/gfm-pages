'use client';
/**
 * ActivityFeed — the activity tab content.
 *
 * DOM matches mock:
 *   - "Since your last visit" .missed header (returning_lapsed persona via slot)
 *   - .arow rows: avatar--sm + .arow__body (.verb / .arow__title / .arow__meta) + .arow__cta
 *
 * For non-owners: delegates to PersonalizedSlot 'what_you_missed' (P2).
 * For owners: renders owner activity rows directly.
 *
 * The P2 slot is NEVER unmounted (L3.5 rule).
 *
 * CB-76: The organizer's avatar uses the shared Avatar component with PFP resolution
 * so that named personas (e.g. Janahan S.) show their profile picture in activity rows.
 */

import React, { useCallback } from 'react';
import { PersonalizedSlot } from '@/components/slots/PersonalizedSlot';
import { Instrumented } from '@/components/overlay/Instrumented';
import { Avatar } from '@/components/shared/Avatar';
import { capture } from '@/lib/analytics/capture';
import { getPersonaByName } from '@/lib/personas/loader';
import type { ActivityRow, PageContext } from '@/lib/types';
import type { OverlayAttrs } from '@/lib/overlay/types';

export interface ActivityFeedProps {
  activity: ActivityRow[];
  newActivityCount: number;
  page: PageContext;
  isOwnerView: boolean;
  overlay: OverlayAttrs;
  /** Display name of the profile organizer — used in the P2 slot candidates and avatar. */
  organizerName?: string;
}

function ageLabel(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return '1 week ago';
  if (weeks < 5) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return '1 month ago';
  return `${months} months ago`;
}

const VERB_LABEL: Record<ActivityRow['verb'], string> = {
  UPDATED: 'Updated',
  PUBLISHED: 'Published',
  DONATED: 'Donated',
};

// Initials from title (first letter of first word)
function titleInitial(title: string): string {
  return (title.trim().charAt(0) ?? '?').toUpperCase();
}

interface ActivityRowItemProps {
  row: ActivityRow;
  /** Display name of the organizer — used to resolve PFP for their avatar (CB-76). */
  organizerName?: string;
}

function ActivityRowItem({ row, organizerName }: ActivityRowItemProps) {
  const handleClick = useCallback(() => {
    capture('Fundraiser Clicked Through', {
      activity_verb: row.verb,
      referrer_source: 'profile',
    });
  }, [row.verb]);

  // CB-76: resolve organizer PFP by name so named personas show their profile picture.
  const organizerPersona = getPersonaByName(organizerName ?? null);

  return (
    <div className="arow">
      <Avatar
        initial={organizerPersona ? organizerPersona.avatar.initial : titleInitial(row.title)}
        bg={organizerPersona?.avatar.bg}
        fg={organizerPersona?.avatar.fg}
        pfpUrl={organizerPersona?.avatar.pfpUrl}
        size="sm"
        label={organizerName ?? row.title}
      />
      <div className="arow__body">
        <div className="verb">{VERB_LABEL[row.verb]}</div>
        <div className="arow__title">{row.title}</div>
        <div className="arow__meta">{row.byline} · {ageLabel(row.ageDays)}</div>
      </div>
      <a
        className="arow__cta"
        href={row.href}
        onClick={handleClick}
      >
        View →
      </a>
    </div>
  );
}

export function ActivityFeed({
  activity,
  newActivityCount,
  page,
  isOwnerView,
  overlay,
  organizerName,
}: ActivityFeedProps) {
  // Owner sees their own feed
  if (isOwnerView) {
    return (
      <Instrumented attrs={overlay} regionLabel="activity-feed-owner">
        <div data-section-name="Activity Feed">
          {activity.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>No activity yet.</p>
          ) : (
            activity.map((row, i) => (
              <ActivityRowItem key={`${row.verb}-${row.href}-${i}`} row={row} organizerName={organizerName} />
            ))
          )}
        </div>
      </Instrumented>
    );
  }

  // Non-owner: use the P2 PersonalizedSlot (never unmounts)
  return (
    <PersonalizedSlot
      name="what_you_missed"
      page={page}
      candidates={{
        activity,
        newActivityCount,
        // organizerName is the display name (e.g. "Janahan S."), not the profileId UUID.
        organizerName: organizerName ?? '',
      }}
      overlay={overlay}
      sectionName="activity_feed"
    />
  );
}
