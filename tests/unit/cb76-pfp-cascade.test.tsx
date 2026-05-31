/**
 * CB-76 — Profile picture cascade: named persona PFPs appear consistently
 * across every avatar surface (UpdatesSection, DonorFeed, ActivityTab,
 * ActivityFeed). Anonymous users keep the generic glyph.
 *
 * Strategy:
 *  - getPersonaByName() unit tests verify the name→fixture lookup
 *  - Component render tests verify each feed surface passes pfpUrl to Avatar
 *    when the row's name matches a named persona
 *  - Anonymous / unknown names stay glyph (no img)
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { getPersonaByName } from '@/lib/personas/loader';
import { PERSONAS } from '@/fixtures/personas';
import { Avatar } from '@/components/shared/Avatar';
import { DonorFeed } from '@/components/fundraiser/DonorFeed';
import { UpdatesSection } from '@/components/fundraiser/UpdatesSection';
import { ActivityTab } from '@/components/community/ActivityTab';
import { ActivityFeed } from '@/components/profile/ActivityFeed';
import { OverlayProvider } from '@/lib/overlay/context';
import type { DonationRow, UpdateRow } from '@/lib/db/queries';
import type { ActivityItem } from '@/components/community/types';
import type { ActivityRow, PageContext, PymkCard } from '@/lib/types';
import type { OverlayAttrs } from '@/lib/overlay/types';

// Wrap any component that uses Instrumented (which requires OverlayProvider)
function withOverlay(ui: React.ReactElement) {
  return render(<OverlayProvider>{ui}</OverlayProvider>);
}

// ── Shared stubs ──────────────────────────────────────────────────────────────

const OVERLAY: OverlayAttrs = {
  'data-overlay-tier': '2',
  'data-overlay-events': 'Section Viewed',
  'data-overlay-delta': 'D6',
  'data-overlay-metric': 'donate-intent-rate',
  'data-overlay-why': 'test',
  'data-overlay-dashboard': 'donate-funnel',
};

const PAGE_CTX: PageContext = {
  page: 'fundraiser',
  fundraiserId: '00000000-0000-4000-8000-000000001001',
  referrerSource: 'direct',
  pageState: { raisedPct: 78, momentum: 'high' },
};

// ── getPersonaByName unit tests ───────────────────────────────────────────────

describe('getPersonaByName — name→fixture lookup', () => {
  it('returns the close_friend fixture for "Sarah K."', () => {
    const result = getPersonaByName('Sarah K.');
    expect(result).not.toBeNull();
    expect(result?.slug).toBe('close_friend');
    expect(result?.avatar.pfpUrl).toContain('persona-close_friend');
  });

  it('returns the extrovert fixture for "Mike T."', () => {
    const result = getPersonaByName('Mike T.');
    expect(result).not.toBeNull();
    expect(result?.slug).toBe('extrovert');
    expect(result?.avatar.pfpUrl).toContain('persona-extrovert');
  });

  it('returns the returning_lapsed fixture for "Priya M."', () => {
    const result = getPersonaByName('Priya M.');
    expect(result).not.toBeNull();
    expect(result?.slug).toBe('returning_lapsed');
    expect(result?.avatar.pfpUrl).toContain('persona-returning_lapsed');
  });

  it('returns the profile_owner fixture for "Janahan S."', () => {
    const result = getPersonaByName('Janahan S.');
    expect(result).not.toBeNull();
    expect(result?.slug).toBe('profile_owner');
    expect(result?.avatar.pfpUrl).toContain('persona-profile_owner');
  });

  it('is case-insensitive', () => {
    const result = getPersonaByName('sarah k.');
    expect(result?.slug).toBe('close_friend');
  });

  it('trims whitespace', () => {
    const result = getPersonaByName('  Mike T.  ');
    expect(result?.slug).toBe('extrovert');
  });

  it('returns null for unknown name', () => {
    expect(getPersonaByName('Unknown Person')).toBeNull();
  });

  it('returns null for null input', () => {
    expect(getPersonaByName(null)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(getPersonaByName('')).toBeNull();
  });

  it('anonymous personas (no name) are not matched', () => {
    // The anonymous persona has name: null — should never be returned by this lookup
    const result = getPersonaByName('anonymous');
    expect(result).toBeNull();
  });
});

// ── Avatar component PFP rendering (surface-level baseline) ──────────────────

describe('Avatar — PFP renders correctly (baseline)', () => {
  it('renders <img> when pfpUrl is supplied', () => {
    const { container } = render(
      <Avatar
        initial="S"
        bg="#ffd863"
        fg="#68570d"
        pfpUrl="https://picsum.photos/seed/persona-close_friend/96/96"
        label="Sarah K."
      />
    );
    const imgs = container.querySelectorAll('img');
    expect(imgs.length).toBeGreaterThan(0);
    expect((imgs[0] as HTMLImageElement).src).toContain('persona-close_friend');
  });

  it('renders SVG glyph (no <img>) for anonymous with empty initial and no pfpUrl', () => {
    const { container } = render(
      <Avatar initial="" bg="#f5f5f5" fg="#6f6f6f" label="User avatar" />
    );
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('svg')).not.toBeNull();
  });
});

// ── DonorFeed — PFP cascades for named persona donors ────────────────────────

describe('DonorFeed — persona PFP in donor rows', () => {
  const makeDonation = (id: string, donor_name: string | null): DonationRow => ({
    id,
    amount_usd: 50,
    comment: null,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    donor_name,
  });

  it('renders an <img> with Sarah K. pfpUrl when donor_name is "Sarah K."', () => {
    const donations = [makeDonation('d1', 'Sarah K.')];
    const { container } = withOverlay(
      <DonorFeed
        donations={donations}
        donationCount={1}
        momentum="high"
        raisedUsd={10000}
        goalUsd={30000}
        organizerName="Sarah J."
        onDonate={() => {}}
      />
    );
    const imgs = container.querySelectorAll('img');
    expect(imgs.length).toBeGreaterThan(0);
    const srcs = Array.from(imgs).map((img) => (img as HTMLImageElement).src);
    expect(srcs.some((s) => s.includes('persona-close_friend'))).toBe(true);
  });

  it('renders an <img> with Mike T. pfpUrl when donor_name is "Mike T."', () => {
    const donations = [makeDonation('d2', 'Mike T.')];
    const { container } = withOverlay(
      <DonorFeed
        donations={donations}
        donationCount={1}
        momentum="high"
        raisedUsd={10000}
        goalUsd={30000}
        organizerName="Sarah J."
        onDonate={() => {}}
      />
    );
    const imgs = container.querySelectorAll('img');
    expect(imgs.length).toBeGreaterThan(0);
    const srcs = Array.from(imgs).map((img) => (img as HTMLImageElement).src);
    expect(srcs.some((s) => s.includes('persona-extrovert'))).toBe(true);
  });

  it('does NOT render persona <img> for unknown donor name', () => {
    const donations = [makeDonation('d3', 'Jane Doe')];
    const { container } = withOverlay(
      <DonorFeed
        donations={donations}
        donationCount={1}
        momentum="high"
        raisedUsd={10000}
        goalUsd={30000}
        organizerName="Sarah J."
        onDonate={() => {}}
      />
    );
    // No persona img elements — falls back to initial
    const imgs = Array.from(container.querySelectorAll('img'));
    const personaSrcs = imgs.filter((img) => (img as HTMLImageElement).src.includes('persona-'));
    expect(personaSrcs.length).toBe(0);
  });

  it('renders generic glyph (SVG, no persona img) for anonymous donor (null name)', () => {
    const donations = [makeDonation('d4', null)];
    const { container } = withOverlay(
      <DonorFeed
        donations={donations}
        donationCount={1}
        momentum="high"
        raisedUsd={10000}
        goalUsd={30000}
        organizerName="Sarah J."
        onDonate={() => {}}
      />
    );
    const imgs = Array.from(container.querySelectorAll('img'));
    const personaSrcs = imgs.filter((img) => (img as HTMLImageElement).src.includes('persona-'));
    expect(personaSrcs.length).toBe(0);
    // Should render generic glyph SVG for anonymous
    expect(container.querySelector('svg')).not.toBeNull();
  });
});

// ── UpdatesSection — PFP cascades for named persona authors ──────────────────

describe('UpdatesSection — persona PFP in update author avatars', () => {
  const makeUpdate = (id: string, author_name: string): UpdateRow => ({
    id,
    body: 'This is an update body with enough text to display.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    author_name,
    summary: null,
  });

  it('renders <img> with Sarah K. pfpUrl when author_name is "Sarah K."', () => {
    // "Sarah K." is the close_friend persona — verifies name-matching mechanism works
    const updates = [makeUpdate('u1', 'Sarah K.')];
    const { container } = withOverlay(
      <UpdatesSection
        fundraiserId="fund-1"
        updates={updates}
        copyByChannel={{}}
      />
    );
    const imgs = Array.from(container.querySelectorAll('img'));
    const personaSrcs = imgs.filter((img) => (img as HTMLImageElement).src.includes('persona-close_friend'));
    expect(personaSrcs.length).toBeGreaterThan(0);
  });

  it('renders no persona img for author "Sarah J." (not in personas fixture)', () => {
    // Sarah J. is the organizer but not a persona fixture — falls back to initial
    const updates = [makeUpdate('u2', 'Sarah J.')];
    const { container } = withOverlay(
      <UpdatesSection
        fundraiserId="fund-1"
        updates={updates}
        copyByChannel={{}}
      />
    );
    const imgs = Array.from(container.querySelectorAll('img'));
    const personaSrcs = imgs.filter((img) => (img as HTMLImageElement).src.includes('persona-'));
    expect(personaSrcs.length).toBe(0);
  });

  it('renders <img> with Janahan pfpUrl when author_name is "Janahan S."', () => {
    const updates = [makeUpdate('u3', 'Janahan S.')];
    const { container } = withOverlay(
      <UpdatesSection
        fundraiserId="fund-1"
        updates={updates}
        copyByChannel={{}}
      />
    );
    const imgs = Array.from(container.querySelectorAll('img'));
    const personaSrcs = imgs.filter((img) => (img as HTMLImageElement).src.includes('persona-profile_owner'));
    expect(personaSrcs.length).toBeGreaterThan(0);
  });
});

// ── ActivityTab (community) — PFP cascades for named persona actors ───────────

describe('ActivityTab (community) — persona PFP in activity post avatars', () => {
  const makeActivity = (id: string, actor_name: string): ActivityItem => ({
    id,
    verb: 'donated',
    body: 'A supporter donated to the fund.',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    actor_name,
    reaction_count: 0,
    comment_count: 0,
  });

  const C3_OVERLAY: OverlayAttrs = {
    'data-overlay-tier': '2',
    'data-overlay-events': 'Section Viewed',
    'data-overlay-delta': 'C3',
    'data-overlay-metric': 'follow-rate',
    'data-overlay-why': 'test',
    'data-overlay-dashboard': 'retention',
  };

  it('renders <img> with Mike T. pfpUrl when actor_name is "Mike T."', () => {
    const activity = [makeActivity('a1', 'Mike T.')];
    const { container } = withOverlay(
      <ActivityTab
        activity={activity}
        pymkCards={[]}
        feedReady={true}
        pageCtx={{ ...PAGE_CTX, page: 'community', communityId: 'c1' }}
        overlayC2={OVERLAY}
        overlayC3={C3_OVERLAY}
      />
    );
    const imgs = Array.from(container.querySelectorAll('img'));
    const personaSrcs = imgs.filter((img) => (img as HTMLImageElement).src.includes('persona-extrovert'));
    expect(personaSrcs.length).toBeGreaterThan(0);
  });

  it('renders no persona img for unknown actor name in community activity', () => {
    const activity = [makeActivity('a2', 'Jane Doe')];
    const { container } = withOverlay(
      <ActivityTab
        activity={activity}
        pymkCards={[]}
        feedReady={true}
        pageCtx={{ ...PAGE_CTX, page: 'community', communityId: 'c1' }}
        overlayC2={OVERLAY}
        overlayC3={C3_OVERLAY}
      />
    );
    const imgs = Array.from(container.querySelectorAll('img'));
    const personaSrcs = imgs.filter((img) => (img as HTMLImageElement).src.includes('persona-'));
    expect(personaSrcs.length).toBe(0);
  });

  it('renders <img> with Sarah K. pfpUrl when actor_name is "Sarah K."', () => {
    const activity = [makeActivity('a3', 'Sarah K.')];
    const { container } = withOverlay(
      <ActivityTab
        activity={activity}
        pymkCards={[]}
        feedReady={true}
        pageCtx={{ ...PAGE_CTX, page: 'community', communityId: 'c1' }}
        overlayC2={OVERLAY}
        overlayC3={C3_OVERLAY}
      />
    );
    const imgs = Array.from(container.querySelectorAll('img'));
    const personaSrcs = imgs.filter((img) => (img as HTMLImageElement).src.includes('persona-close_friend'));
    expect(personaSrcs.length).toBeGreaterThan(0);
  });
});

// ── ActivityFeed (profile) — PFP cascades for organizer (owner view) ─────────

describe('ActivityFeed (profile) — organizer PFP in activity rows (owner view)', () => {
  const makeActivityRow = (title: string): ActivityRow => ({
    verb: 'UPDATED',
    title,
    byline: 'Update posted',
    href: '/f/test-fundraiser',
    ageDays: 3,
  });

  it('renders <img> with Janahan pfpUrl when organizerName is "Janahan S." (owner view)', () => {
    const activity = [makeActivityRow('Real-Time Alerts for Wildfire Safety')];
    const { container } = withOverlay(
      <ActivityFeed
        activity={activity}
        newActivityCount={1}
        page={PAGE_CTX}
        isOwnerView={true}
        overlay={OVERLAY}
        organizerName="Janahan S."
      />
    );
    const imgs = Array.from(container.querySelectorAll('img'));
    const personaSrcs = imgs.filter((img) => (img as HTMLImageElement).src.includes('persona-profile_owner'));
    expect(personaSrcs.length).toBeGreaterThan(0);
  });

  it('renders no persona img when organizerName does not match any persona (owner view)', () => {
    const activity = [makeActivityRow('Some Fundraiser')];
    const { container } = withOverlay(
      <ActivityFeed
        activity={activity}
        newActivityCount={1}
        page={PAGE_CTX}
        isOwnerView={true}
        overlay={OVERLAY}
        organizerName="Unknown Organizer"
      />
    );
    const imgs = Array.from(container.querySelectorAll('img'));
    const personaSrcs = imgs.filter((img) => (img as HTMLImageElement).src.includes('persona-'));
    expect(personaSrcs.length).toBe(0);
  });

  it('renders no persona img when organizerName is absent (owner view, no name)', () => {
    const activity = [makeActivityRow('Some Fundraiser')];
    const { container } = withOverlay(
      <ActivityFeed
        activity={activity}
        newActivityCount={1}
        page={PAGE_CTX}
        isOwnerView={true}
        overlay={OVERLAY}
      />
    );
    const imgs = Array.from(container.querySelectorAll('img'));
    const personaSrcs = imgs.filter((img) => (img as HTMLImageElement).src.includes('persona-'));
    expect(personaSrcs.length).toBe(0);
  });
});

// ── Cross-persona coverage: all named personas have pfpUrl ───────────────────

describe('All named personas have pfpUrl resolvable via getPersonaByName', () => {
  const namedPersonas = [
    { name: 'Sarah K.', slug: 'close_friend' },
    { name: 'Mike T.', slug: 'extrovert' },
    { name: 'Priya M.', slug: 'returning_lapsed' },
    { name: 'Janahan S.', slug: 'profile_owner' },
  ] as const;

  for (const { name, slug } of namedPersonas) {
    it(`getPersonaByName("${name}") returns ${slug} with pfpUrl`, () => {
      const result = getPersonaByName(name);
      expect(result).not.toBeNull();
      expect(result?.slug).toBe(slug);
      expect(result?.avatar.pfpUrl).toBeTruthy();
      expect(typeof result?.avatar.pfpUrl).toBe('string');
    });
  }

  it('anonymous (null name) returns null — no PFP', () => {
    expect(getPersonaByName(null)).toBeNull();
  });

  it('anonymous guest (shared_by_extro, null name) returns null — no PFP', () => {
    expect(getPersonaByName(PERSONAS.shared_by_extro.name)).toBeNull();
  });
});
