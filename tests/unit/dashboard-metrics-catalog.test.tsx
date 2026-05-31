/**
 * CB-11 — Metrics Catalog tests
 *
 * Acceptance:
 * 1. The catalog renders all canonical event names from §4 (mirrored in lib/types.ts EventName).
 * 2. Each entry shows a human-readable capture site (where the event fires).
 * 3. Flag names from the experiments table are present.
 * 4. No internal index strings (CB-/W#/§/D#/persona slugs) appear in rendered labels.
 * 5. Event names MATCH the EventName union from lib/types.ts exactly.
 */
import { describe, it, expect } from 'vitest';
import {
  CATALOG_EVENTS,
  CATALOG_FLAGS,
  type CatalogEvent,
  type CatalogFlag,
} from '@/components/dashboard/MetricsCatalog';
import type { EventName } from '@/lib/types';

// ── Canonical event list from §4 (single truth: lib/types.ts) ────────────────

const CANONICAL_EVENTS: EventName[] = [
  'Page Viewed',
  'Story Scrolled',
  'Donate Intent',
  'Amount Selected',
  'Donate Started',
  'Donate Completed',
  'Donate Failed',
  'Share Clicked',
  'Follow Clicked',
  'Post Donate Viewed',
  'Post Donate Share Clicked',
  'Post Donate Recurring Upgrade Clicked',
  'Post Donate Follow Clicked',
  'Post Donate Dismissed',
  'Community Followed',
  'Update Read',
  'Fundraiser Clicked Through',
  'Section Viewed',
  'Mark Created',
  'Mark Customized',
  'Mark Grew',
  'Mark Shared',
  'Fundraiser Filter Applied',
  'Start Fundraiser Clicked',
];

describe('CATALOG_EVENTS — completeness', () => {
  it('contains every canonical EventName from lib/types.ts §4', () => {
    const catalogNames = CATALOG_EVENTS.map((e) => e.name);
    for (const canonical of CANONICAL_EVENTS) {
      expect(catalogNames).toContain(canonical);
    }
  });

  it('has no event names not in the canonical list', () => {
    for (const entry of CATALOG_EVENTS) {
      expect(CANONICAL_EVENTS).toContain(entry.name as EventName);
    }
  });
});

describe('CATALOG_EVENTS — each entry has required fields', () => {
  it('each entry has a non-empty name string', () => {
    for (const entry of CATALOG_EVENTS) {
      expect(typeof entry.name).toBe('string');
      expect(entry.name.length).toBeGreaterThan(0);
    }
  });

  it('each entry has a non-empty capturesite string', () => {
    for (const entry of CATALOG_EVENTS) {
      expect(typeof entry.capturesite).toBe('string');
      expect(entry.capturesite.length).toBeGreaterThan(0);
    }
  });

  it('each entry has a non-empty keyProps string or array', () => {
    for (const entry of CATALOG_EVENTS) {
      // keyProps can be a string or array of strings
      const kp = entry.keyProps;
      if (typeof kp === 'string') {
        expect(kp.length).toBeGreaterThan(0);
      } else {
        expect(Array.isArray(kp)).toBe(true);
        expect((kp as string[]).length).toBeGreaterThan(0);
      }
    }
  });
});

describe('CATALOG_EVENTS — no internal index leakage in rendered labels', () => {
  const INDEX_PATTERNS = [
    /\bCB-\d+\b/,      // change-board IDs
    /\bW\d+\b/,         // widget IDs
    /§\d+/,             // section refs
    /\bD\d+\b/,         // delta IDs
    /\bS\d+\b/,         // Suns IDs
    /\bC\d+\b/,         // Community IDs
    /\bP\d+\b/,         // Profile IDs
    // persona slugs that should not appear as raw values in rendered labels
    /\bclose_friend\b/,
    /\bshared_by_extro\b/,
    /\breturning_lapsed\b/,
    /\bprofile_owner\b/,
  ];

  it('capturesite descriptions contain no internal index strings', () => {
    for (const entry of CATALOG_EVENTS) {
      for (const pattern of INDEX_PATTERNS) {
        expect(entry.capturesite).not.toMatch(pattern);
      }
    }
  });

  it('event names contain no internal index strings', () => {
    for (const entry of CATALOG_EVENTS) {
      for (const pattern of INDEX_PATTERNS) {
        expect(entry.name).not.toMatch(pattern);
      }
    }
  });
});

// ── CATALOG_FLAGS ─────────────────────────────────────────────────────────────

describe('CATALOG_FLAGS — flag name coverage', () => {
  it('contains at least the experiment flags from EXPERIMENT_ROWS', () => {
    // These are the keys from seeds.ts EXPERIMENT_ROWS
    const expectedFlags = [
      'uc_tipping_ui',
      'post_donate_share_prompt',
      'share_channel_reorder',
      'progress_bar_urgency_copy',
    ];
    const catalogFlagKeys = CATALOG_FLAGS.map((f) => f.flagKey);
    for (const flag of expectedFlags) {
      expect(catalogFlagKeys).toContain(flag);
    }
  });

  it('each flag entry has a non-empty flagKey and description', () => {
    for (const flag of CATALOG_FLAGS) {
      expect(typeof flag.flagKey).toBe('string');
      expect(flag.flagKey.length).toBeGreaterThan(0);
      expect(typeof flag.description).toBe('string');
      expect(flag.description.length).toBeGreaterThan(0);
    }
  });

  it('each flag entry has a non-empty capturesite', () => {
    for (const flag of CATALOG_FLAGS) {
      expect(typeof flag.capturesite).toBe('string');
      expect(flag.capturesite.length).toBeGreaterThan(0);
    }
  });

  it('flag descriptions contain no internal index strings', () => {
    const INDEX_PATTERNS = [
      /\bCB-\d+\b/,
      /\bW\d+\b/,
      /§\d+/,
      /\bD\d+\b/,
      /\bS\d+\b/,
    ];
    for (const flag of CATALOG_FLAGS) {
      for (const pattern of INDEX_PATTERNS) {
        expect(flag.description).not.toMatch(pattern);
      }
    }
  });
});

// ── Type checks ───────────────────────────────────────────────────────────────

describe('type shape', () => {
  it('CatalogEvent has name, capturesite, keyProps', () => {
    const entry: CatalogEvent = CATALOG_EVENTS[0];
    expect('name' in entry).toBe(true);
    expect('capturesite' in entry).toBe(true);
    expect('keyProps' in entry).toBe(true);
  });

  it('CatalogFlag has flagKey, description, capturesite', () => {
    const flag: CatalogFlag = CATALOG_FLAGS[0];
    expect('flagKey' in flag).toBe(true);
    expect('description' in flag).toBe(true);
    expect('capturesite' in flag).toBe(true);
  });
});
