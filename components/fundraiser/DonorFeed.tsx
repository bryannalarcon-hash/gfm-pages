'use client';
/**
 * DonorFeed — D6 donation-list prompt + social proof.
 *
 * Contextual momentum prompt adapts to campaign state (high/slow/near_goal).
 * Shows recent donor rows with name, amount, comment.
 * D7: skeleton on initial mount until data hydrates.
 */

import React, { useState } from 'react';
import { Avatar } from '@/components/shared/Avatar';
import { Button } from '@/components/shared/Button';
import { Instrumented } from '@/components/overlay/Instrumented';
import { capture } from '@/lib/analytics/capture';
import { getPersonaByName } from '@/lib/personas/loader';
import type { DonationRow } from '@/lib/db/queries';
import type { OverlayAttrs } from '@/lib/overlay/types';

export interface DonorFeedProps {
  donations: DonationRow[];
  donationCount: number;
  momentum: 'high' | 'slow' | 'near_goal';
  raisedUsd: number;
  goalUsd: number;
  organizerName: string;
  onDonate: () => void;
}

function formatUsd(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function relativeTime(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function avatarFor(name: string | null): { bg: string; fg: string; initial: string; pfpUrl?: string } {
  if (!name) return { bg: '#b7b7b6', fg: '#fff', initial: '' };
  // CB-76: resolve PFP for named personas so their profile picture cascades to the donor feed.
  const persona = getPersonaByName(name);
  if (persona?.avatar.pfpUrl) {
    return {
      bg: persona.avatar.bg,
      fg: persona.avatar.fg,
      initial: persona.avatar.initial,
      pfpUrl: persona.avatar.pfpUrl,
    };
  }
  const palette = [
    { bg: '#ccf88e', fg: '#274a34' },
    { bg: '#ffd863', fg: '#68570d' },
    { bg: '#a7e3e3', fg: '#1c456b' },
    { bg: '#eccff6', fg: '#642878' },
    { bg: '#e9fcce', fg: '#274a34' },
  ];
  const idx = name.charCodeAt(0) % palette.length;
  return { ...palette[idx], initial: name.charAt(0).toUpperCase() };
}

const D6_OVERLAY: OverlayAttrs = {
  'data-overlay-tier': '1',
  'data-overlay-events': 'Donate Intent',
  'data-overlay-delta': 'D6',
  'data-overlay-metric': 'donate-intent-rate',
  'data-overlay-why': 'Contextual momentum prompt inside donor list converts high-intent browsers',
  'data-overlay-dashboard': 'donate-funnel',
};

function MomentumPrompt({
  momentum,
  raisedUsd,
  goalUsd,
  donationCount,
  organizerName,
  onDonate,
}: {
  momentum: 'high' | 'slow' | 'near_goal';
  raisedUsd: number;
  goalUsd: number;
  donationCount: number;
  organizerName: string;
  onDonate: () => void;
}) {
  const toGo = formatUsd(Math.max(0, goalUsd - raisedUsd));
  const recentCount = Math.max(12, Math.round(donationCount * 0.04));

  const text =
    momentum === 'high'
      ? `${recentCount} people donated in the last hour — keep it going`
      : momentum === 'near_goal'
      ? `${toGo} to go — ${donationCount.toLocaleString()} donors got us here`
      : donationCount === 0
      ? `Be the first to donate today`
      : `Help ${organizerName} reach the goal — ${donationCount.toLocaleString()} donors so far`;

  return (
    <div
      className="rounded-[var(--hrt-size-radius-lg)] p-[var(--hrt-size-spacing-2)] mb-[var(--hrt-size-spacing-2)] flex items-center justify-between gap-[var(--hrt-size-spacing-2)]"
      style={{ background: 'var(--hrt-color-surface-neutral-subtle)' }}
    >
      <p className="text-body-sm text-[var(--hrt-color-text-default)] m-0 flex-1">{text}</p>
      <button
        type="button"
        onClick={() => {
          capture('Donate Intent', { cta_location: 'donor_list' });
          onDonate();
        }}
        className="text-body-sm font-bold text-[var(--hrt-color-text-brand-strong)] bg-transparent border-0 cursor-pointer whitespace-nowrap hover:underline flex-none"
      >
        Donate now →
      </button>
    </div>
  );
}

export function DonorFeed({
  donations,
  donationCount,
  momentum,
  raisedUsd,
  goalUsd,
  organizerName,
  onDonate,
}: DonorFeedProps) {
  const [expanded, setExpanded] = useState(false);
  const VISIBLE_DEFAULT = 5;
  const visibleDonations = expanded ? donations : donations.slice(0, VISIBLE_DEFAULT);

  return (
    <Instrumented attrs={D6_OVERLAY} regionLabel="donor-feed">
      <section aria-label="Donations">
        <div className="flex items-baseline justify-between mb-[var(--hrt-size-spacing-2)]">
          <h2 className="m-0 font-bold text-[var(--hrt-color-text-headings)]" style={{ fontSize: 'var(--hrt-size-font-heading-sm)' }}>
            Donations
          </h2>
          <span className="text-body-sm font-bold text-[var(--hrt-color-text-default)]">
            {donationCount.toLocaleString()} donors
          </span>
        </div>

        {/* D6 Contextual prompt */}
        <MomentumPrompt
          momentum={momentum}
          raisedUsd={raisedUsd}
          goalUsd={goalUsd}
          donationCount={donationCount}
          organizerName={organizerName}
          onDonate={onDonate}
        />

        {/* Donor rows */}
        <ul className="list-none m-0 p-0 flex flex-col gap-[var(--hrt-size-spacing-2)]">
          {visibleDonations.length === 0
            ? Array.from({ length: 3 }).map((_, i) => (
                // D7 Skeleton
                <li key={i} className="flex items-center gap-[var(--hrt-size-spacing-1)]" aria-hidden="true">
                  <div className="w-8 h-8 rounded-full bg-[var(--hrt-color-surface-neutral-subtle)] animate-pulse flex-none" />
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="h-3 rounded bg-[var(--hrt-color-surface-neutral-subtle)] animate-pulse w-32" />
                    <div className="h-3 rounded bg-[var(--hrt-color-surface-neutral-subtle)] animate-pulse w-20" />
                  </div>
                </li>
              ))
            : visibleDonations.map((d) => {
                const av = avatarFor(d.donor_name);
                return (
                  <li
                    key={d.id}
                    className="flex items-start gap-[var(--hrt-size-spacing-1)]"
                  >
                    <Avatar initial={av.initial} bg={av.bg} fg={av.fg} pfpUrl={av.pfpUrl} size="sm" label={d.donor_name ?? 'Anonymous'} />
                    <div className="flex-1 min-w-0">
                      <span className="text-body-sm font-bold text-[var(--hrt-color-text-default)]">
                        {d.donor_name ?? 'Anonymous'}
                      </span>{' '}
                      <span className="text-body-sm text-[var(--hrt-color-text-supporting)]">
                        · {formatUsd(d.amount_usd)} · {relativeTime(d.created_at)}
                      </span>
                      {d.comment && (
                        <p className="m-0 mt-0.5 text-body-sm text-[var(--hrt-color-text-default)] italic line-clamp-2">
                          &ldquo;{d.comment}&rdquo;
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
        </ul>

        {donations.length > VISIBLE_DEFAULT && (
          <div className="flex gap-[var(--hrt-size-spacing-1)] mt-[var(--hrt-size-spacing-2)]">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Show fewer' : `See all ${donationCount.toLocaleString()} donations`}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {/* top donations sort — KEEP AS-IS behavior */}}
            >
              See top donations
            </Button>
          </div>
        )}
      </section>
    </Instrumented>
  );
}
