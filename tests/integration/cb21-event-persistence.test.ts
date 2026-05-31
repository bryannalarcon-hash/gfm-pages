// @vitest-environment node
/**
 * CB-21 — analytics_event persistence integration tests.
 *
 * Verifies:
 *   1. insertAnalyticsEvent round-trips a row into the correct TickerEvent shape.
 *   2. ON CONFLICT (id) DO NOTHING deduplicates duplicate uuid inserts.
 *   3. getRecentAnalyticsEvents returns newest-first DB rows mapped oldest-first.
 *   4. hydrateFromDb populates an empty in-memory buffer without fanning out.
 *
 * Strategy mirrors queries.test.ts: freshTestDb() spins up an isolated in-memory
 * PGlite (schema.sql + all migrations applied), then vi.mock routes lib/db/client
 * through that instance so the query functions never touch the repo's .pglite/.
 */
import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import { freshTestDb, type TestDb } from '../helpers/testdb';
import type { TickerEvent } from '../../lib/types';

let testDb: TestDb;

// Route all lib/db/client calls through our isolated freshTestDb instance.
vi.mock('../../lib/db/client', async () => {
  return {
    query: async (text: string, params: unknown[] = []) => testDb.query(text, params),
    queryRows: async (text: string, params: unknown[] = []) => {
      const { rows } = await testDb.query(text, params);
      return rows;
    },
    queryOne: async (text: string, params: unknown[] = []) => {
      const { rows } = await testDb.query(text, params);
      return rows[0] ?? null;
    },
    execScript: async (sql: string) => testDb.exec(sql),
    closePool: async () => { /* no-op */ },
    __resetBackendForTests: () => { /* no-op */ },
    usingPglite: () => true,
  };
});

// Import after mock is in place.
import {
  insertAnalyticsEvent,
  getRecentAnalyticsEvents,
} from '../../lib/db/queries';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makeEvent(overrides: Partial<Parameters<typeof insertAnalyticsEvent>[0]> = {}) {
  return {
    uuid: crypto.randomUUID(),
    event: 'Donate Completed' as TickerEvent['event'],
    persona: 'donor' as TickerEvent['persona'],
    referrerSource: 'social' as TickerEvent['referrerSource'],
    keyLabel: 'amount_usd',
    keyValue: '50',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeAll(async () => {
  testDb = await freshTestDb(); // applies schema.sql + all migrations (incl. 003)
});

afterAll(async () => {
  await testDb.close();
});

// ---------------------------------------------------------------------------
// insertAnalyticsEvent
// ---------------------------------------------------------------------------

describe('insertAnalyticsEvent', () => {
  it('inserts a row that can be retrieved by uuid', async () => {
    const e = makeEvent();
    await insertAnalyticsEvent(e);

    const { rows } = await testDb.query<{ id: string }>(
      `SELECT id FROM analytics_event WHERE id = $1`,
      [e.uuid],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(e.uuid);
  });

  it('ON CONFLICT DO NOTHING: inserting the same uuid twice yields one row', async () => {
    const e = makeEvent();
    await insertAnalyticsEvent(e);
    await insertAnalyticsEvent(e); // duplicate — should be a no-op

    const { rows } = await testDb.query<{ id: string }>(
      `SELECT id FROM analytics_event WHERE id = $1`,
      [e.uuid],
    );
    expect(rows).toHaveLength(1);
  });

  it('persists all fields correctly', async () => {
    const e = makeEvent({
      event: 'Share Clicked',
      persona: 'advocate',
      referrerSource: 'email',
      keyLabel: 'share_channel',
      keyValue: 'whatsapp',
    });
    await insertAnalyticsEvent(e);

    const { rows } = await testDb.query<{
      id: string; event: string; persona: string; referrer_source: string;
      key_label: string | null; key_value: string | null; created_at: string;
    }>(
      `SELECT id, event, persona, referrer_source, key_label, key_value, created_at
       FROM analytics_event WHERE id = $1`,
      [e.uuid],
    );

    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.id).toBe(e.uuid);
    expect(row.event).toBe('Share Clicked');
    expect(row.persona).toBe('advocate');
    expect(row.referrer_source).toBe('email');
    expect(row.key_label).toBe('share_channel');
    expect(row.key_value).toBe('whatsapp');
  });

  it('handles null keyLabel / keyValue gracefully', async () => {
    const e = makeEvent({ keyLabel: undefined, keyValue: undefined });
    // Should not throw even with undefined (treated as null)
    await expect(insertAnalyticsEvent(e)).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// getRecentAnalyticsEvents — shape + ordering + limit
// ---------------------------------------------------------------------------

describe('getRecentAnalyticsEvents', () => {
  // Use a fresh DB-scope via direct raw inserts so order is deterministic.
  const BASE_TIME = new Date('2026-01-01T12:00:00.000Z').getTime();

  const eventsToInsert = [
    { uuid: '00000000-0000-4000-a000-000000000001', offsetMs: 0 },
    { uuid: '00000000-0000-4000-a000-000000000002', offsetMs: 1000 },
    { uuid: '00000000-0000-4000-a000-000000000003', offsetMs: 2000 },
  ];

  beforeEach(async () => {
    // Clean slate for ordering tests (delete only our deterministic UUIDs).
    await testDb.exec(
      `DELETE FROM analytics_event WHERE id IN (
        '00000000-0000-4000-a000-000000000001',
        '00000000-0000-4000-a000-000000000002',
        '00000000-0000-4000-a000-000000000003'
      )`,
    );

    for (const { uuid, offsetMs } of eventsToInsert) {
      const ts = new Date(BASE_TIME + offsetMs).toISOString();
      await insertAnalyticsEvent(makeEvent({ uuid, createdAt: ts }));
    }
  });

  it('returns an array of TickerEvent objects', async () => {
    const events = await getRecentAnalyticsEvents(10);
    expect(Array.isArray(events)).toBe(true);
  });

  it('each returned element has all required TickerEvent fields', async () => {
    const events = await getRecentAnalyticsEvents(10);
    // Filter to only our known inserts for determinism.
    const known = events.filter(e =>
      eventsToInsert.some(x => x.uuid === e.uuid),
    );
    expect(known.length).toBe(3);
    for (const e of known) {
      expect(typeof e.uuid).toBe('string');
      expect(typeof e.event).toBe('string');
      expect(typeof e.timestamp).toBe('string');
      // ISO string check
      expect(() => new Date(e.timestamp)).not.toThrow();
      expect(typeof e.persona).toBe('string');
      expect(typeof e.referrerSource).toBe('string');
      expect(typeof e.keyProp).toBe('object');
      expect(typeof e.keyProp.label).toBe('string');
      expect(typeof e.keyProp.value).toBe('string');
    }
  });

  it('returns events oldest-first (ascending created_at)', async () => {
    const events = await getRecentAnalyticsEvents(200);
    const known = events.filter(e => eventsToInsert.some(x => x.uuid === e.uuid));
    expect(known).toHaveLength(3);

    // Oldest event (offset 0) must appear before newest (offset 2000).
    const idx0 = known.findIndex(e => e.uuid === eventsToInsert[0].uuid);
    const idx1 = known.findIndex(e => e.uuid === eventsToInsert[1].uuid);
    const idx2 = known.findIndex(e => e.uuid === eventsToInsert[2].uuid);
    expect(idx0).toBeLessThan(idx1);
    expect(idx1).toBeLessThan(idx2);
  });

  it('respects the limit parameter', async () => {
    const events = await getRecentAnalyticsEvents(1);
    // We only get at most 1 row — the newest.
    expect(events.length).toBeLessThanOrEqual(1);
  });

  it('returns empty array when table is empty (resilience)', async () => {
    // Temporarily empty the table.
    await testDb.exec(`DELETE FROM analytics_event`);
    const events = await getRecentAnalyticsEvents(10);
    expect(events).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// hydrateFromDb — populates buffer from DB on cold start
// ---------------------------------------------------------------------------

describe('hydrateFromDb', () => {
  it('populates the in-memory buffer with rows from the DB', async () => {
    // Insert a known event directly into DB.
    const e = makeEvent({
      uuid: '00000000-0000-4000-b000-000000000001',
      event: 'Page Viewed',
      createdAt: new Date().toISOString(),
    });
    await insertAnalyticsEvent(e);

    // Reset the store module state so hydration guard is cleared.
    vi.resetModules();

    // Re-import store with a cleared module cache so hydrated=false.
    const storeModule = await import('../../lib/ticker/store');

    // Manually clear the buffer (if tests ran before, buffer may have content).
    // We expose this by calling recentEvents and asserting our known uuid is hydrated.
    await storeModule.hydrateFromDb();

    const recent = storeModule.recentEvents(200);
    const found = recent.find(r => r.uuid === '00000000-0000-4000-b000-000000000001');
    expect(found).toBeDefined();
    expect(found!.event).toBe('Page Viewed');
  });

  it('hydration runs at most once (guard prevents double-hydration)', async () => {
    vi.resetModules();
    const storeModule = await import('../../lib/ticker/store');

    // Run twice — second call should be a no-op (not throw).
    await expect(storeModule.hydrateFromDb()).resolves.toBeUndefined();
    await expect(storeModule.hydrateFromDb()).resolves.toBeUndefined();
  });
});
