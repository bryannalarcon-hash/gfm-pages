import { describe, it, expect } from 'vitest';
import { resolveSlot, type SlotContext, type SlotName } from '@/lib/personalization/slots';
import { PERSONAS } from '@/fixtures/personas';
import { SEED_IDS } from '@/db/seed-ids';
import type { PersonaSlug, PageContext } from '@/lib/types';

const WILDFIRE = SEED_IDS.fundraisers['realtime-alerts-for-wildfire-safety-r5jkk'];
const SARAH_J = SEED_IDS.profiles['sarah-j'];

function fundraiserPage(overrides: Partial<PageContext> = {}): PageContext {
  return {
    page: 'fundraiser',
    fundraiserId: WILDFIRE,
    referrerSource: 'direct',
    pageState: { raisedPct: 68, momentum: 'high' },
    ...overrides,
  };
}

function ctx(slug: PersonaSlug, page = fundraiserPage(), candidates: SlotContext['candidates'] = {}): SlotContext {
  const user = PERSONAS[slug];
  return { user, page, isOwnerView: false, candidates };
}

const ALL_SLOTS: SlotName[] = [
  'returning_banner',
  'smart_presets',
  'similar_carousel',
  'what_you_missed',
  'pymk_panel',
  'recurring_nudge',
];
const ALL_PERSONAS = Object.keys(PERSONAS) as PersonaSlug[];

describe('resolveSlot — total coverage (every slot × every persona resolves cleanly)', () => {
  for (const persona of ALL_PERSONAS) {
    for (const name of ALL_SLOTS) {
      it(`${name} resolves for ${persona} without throwing and returns the right shape`, () => {
        const data = resolveSlot(name, ctx(persona, fundraiserPage({ profileId: SARAH_J })));
        expect(data.name).toBe(name);
        expect(data).toHaveProperty('content'); // content present (may be null) — never undefined
      });
    }
  }
});

describe('returning_banner (D8/D13) — fires only for an authenticated returner here', () => {
  it('anonymous → null (collapsed placeholder)', () => {
    expect(resolveSlot('returning_banner', ctx('anonymous')).content).toBeNull();
  });
  it('extrovert (never been on THIS page) → null', () => {
    expect(resolveSlot('returning_banner', ctx('extrovert')).content).toBeNull();
  });
  it('close_friend (donated here, was here) → greeted by first name', () => {
    const c = resolveSlot('returning_banner', ctx('close_friend', fundraiserPage(), { latestUpdateSummary: 'Alert system now live in 3 counties', organizerName: 'Sarah J.' }));
    expect(c.content).not.toBeNull();
    expect(c.content!.firstName).toBe('Sarah');
    expect(c.content!.summaryLine).toContain('Sarah J.');
  });
  it('returning_lapsed (long gap) → reflective progress copy', () => {
    const page = fundraiserPage({ pageState: { raisedPct: 78 } });
    const c = resolveSlot('returning_banner', ctx('returning_lapsed', page));
    expect(c.content).not.toBeNull();
    expect(c.content!.summaryLine).toMatch(/78%/);
  });
});

describe('smart_presets (D10) — never null; personalizes off prior gift', () => {
  it('anonymous → cohort default 10/25/50, mid selected', () => {
    const c = resolveSlot('smart_presets', ctx('anonymous')).content;
    expect(c.presets).toEqual([10, 25, 50]);
    expect(c.selectedIndex).toBe(1);
  });
  it('close_friend → presets anchored on their last gift to this fundraiser', () => {
    const c = resolveSlot('smart_presets', ctx('close_friend')).content;
    expect(c.presets[0]).toBe(50); // their last donation here
    expect(c.presets[1]).toBeGreaterThan(c.presets[0]);
  });
});

describe('similar_carousel (D3) — never empty; source switches on signal', () => {
  it('anonymous → trending fallback', () => {
    const c = resolveSlot('similar_carousel', ctx('anonymous', fundraiserPage(), { trending: [{ id: 'x', title: 'T', raisedUsd: 1, goalUsd: 2, imageUrl: '' }] })).content;
    expect(c.source).toBe('trending');
    expect(c.cards).toHaveLength(1);
  });
  it('close_friend (has signal) + neighbours → embedding source', () => {
    const c = resolveSlot('similar_carousel', ctx('close_friend', fundraiserPage(), { similarByEmbedding: [{ id: 'y', title: 'Y', raisedUsd: 1, goalUsd: 2, imageUrl: '' }] })).content;
    expect(c.source).toBe('embedding');
  });
});

describe('what_you_missed (P2) — follower-with-new-activity only', () => {
  const profilePage = (): PageContext => ({ page: 'profile', profileId: SARAH_J, referrerSource: 'direct', pageState: {} });
  it('returning_lapsed follows the organizer → populated', () => {
    const c = resolveSlot('what_you_missed', ctx('returning_lapsed', profilePage(), { activity: [{ verb: 'UPDATED', title: 'A', byline: 'b', href: '#', ageDays: 2 }], newActivityCount: 4 })).content;
    expect(c).not.toBeNull();
    expect(c!.newCount).toBe(4);
  });
  it('anonymous → null (empty-state placeholder)', () => {
    expect(resolveSlot('what_you_missed', ctx('anonymous', profilePage())).content).toBeNull();
  });
});

describe('recurring_nudge (P9) — never on owner view', () => {
  it('owner view → null', () => {
    const c: SlotContext = { user: PERSONAS.profile_owner, page: { page: 'profile', profileId: SEED_IDS.profiles.janahan, referrerSource: 'direct', pageState: {} }, isOwnerView: true, candidates: { organizerName: 'Janahan S.' } };
    expect(resolveSlot('recurring_nudge', c).content).toBeNull();
  });
});
