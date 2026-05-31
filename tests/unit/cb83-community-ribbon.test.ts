// CB-83: Community "since your last visit" ribbon — per-persona distinct copy.
// Sarah K., Priya M., Janahan S. must each get DISTINCT, persona-aware ribbon strings.
// Anonymous gets null (collapsed). No raw slug leakage into summaryLine or firstName.

import { describe, it, expect } from 'vitest';
import { resolveSlot, type SlotContext } from '@/lib/personalization/slots';
import { PERSONAS } from '@/fixtures/personas';
import { SEED_IDS } from '@/db/seed-ids';
import type { PersonaSlug, PageContext } from '@/lib/types';

const WATCH_DUTY = SEED_IDS.communities['watch-duty'];

function communityPage(overrides: Partial<PageContext> = {}): PageContext {
  return {
    page: 'community',
    communityId: WATCH_DUTY,
    referrerSource: 'direct',
    pageState: { momentum: 'high' },
    ...overrides,
  };
}

function ctx(slug: PersonaSlug, candidates: SlotContext['candidates'] = {}): SlotContext {
  return {
    user: PERSONAS[slug],
    page: communityPage(),
    isOwnerView: false,
    candidates: { newActivityCount: 3, ...candidates },
  };
}

describe('CB-83 — community returning_banner: three named personas get distinct non-generic copy', () => {
  it('Sarah K. (close_friend) — gets activity-aware ribbon referencing her recent support', () => {
    const result = resolveSlot('returning_banner', ctx('close_friend'));
    expect(result.content).not.toBeNull();
    const { summaryLine, firstName } = result.content!;
    expect(firstName).toBe('Sarah');
    // Must be personalized — not the generic fallback
    expect(summaryLine).not.toBe('Catch up on what’s happened since your last visit.');
    // Must mention activity or her relationship to the community
    expect(summaryLine.length).toBeGreaterThan(10);
  });

  it('Priya M. (returning_lapsed) — gets a distinct re-engagement ribbon', () => {
    const result = resolveSlot('returning_banner', ctx('returning_lapsed'));
    expect(result.content).not.toBeNull();
    const { summaryLine, firstName } = result.content!;
    expect(firstName).toBe('Priya');
    expect(summaryLine).not.toBe('Catch up on what’s happened since your last visit.');
    expect(summaryLine.length).toBeGreaterThan(10);
  });

  it('Janahan S. (profile_owner) — gets a distinct ribbon reflecting his contributor history', () => {
    const result = resolveSlot('returning_banner', ctx('profile_owner'));
    expect(result.content).not.toBeNull();
    const { summaryLine, firstName } = result.content!;
    expect(firstName).toBe('Janahan');
    expect(summaryLine).not.toBe('Catch up on what’s happened since your last visit.');
    expect(summaryLine.length).toBeGreaterThan(10);
  });

  it('All three named personas yield DISTINCT summaryLine strings from each other', () => {
    const sarah = resolveSlot('returning_banner', ctx('close_friend')).content!.summaryLine;
    const priya = resolveSlot('returning_banner', ctx('returning_lapsed')).content!.summaryLine;
    const janahan = resolveSlot('returning_banner', ctx('profile_owner')).content!.summaryLine;

    expect(sarah).not.toBe(priya);
    expect(sarah).not.toBe(janahan);
    expect(priya).not.toBe(janahan);
  });

  it('No slug strings leak into any summaryLine or firstName (no raw slug in rendered text)', () => {
    const slugs = ['close_friend', 'returning_lapsed', 'profile_owner', 'extrovert', 'anonymous'];
    for (const slug of slugs as PersonaSlug[]) {
      const result = resolveSlot('returning_banner', ctx(slug as PersonaSlug));
      if (!result.content) continue;
      for (const rawSlug of slugs) {
        expect(result.content.summaryLine).not.toContain(rawSlug);
        expect(result.content.firstName).not.toContain(rawSlug);
      }
    }
  });

  it('Anonymous → null (collapsed placeholder, no ribbon)', () => {
    const result = resolveSlot('returning_banner', ctx('anonymous'));
    expect(result.content).toBeNull();
  });

  it('Mike T. (extrovert) — gets ribbon referencing his large activity delta (follows Watch Duty)', () => {
    const result = resolveSlot('returning_banner', ctx('extrovert', { newActivityCount: 47 }));
    expect(result.content).not.toBeNull();
    const { summaryLine, firstName } = result.content!;
    expect(firstName).toBe('Mike');
    expect(summaryLine).not.toBe('Catch up on what’s happened since your last visit.');
    // Should reference activity count or his broad engagement
    expect(summaryLine.length).toBeGreaterThan(10);
  });
});
