// @vitest-environment node
/**
 * §7.4 LLM Batch worker tests.
 *
 * - precomputeShareCopy (fixtures mode) returns 7 channel variants
 * - precomputeUpdateSummary returns a non-empty summary string
 * - persistShareCopy / persistUpdateSummary UPSERT into the DB correctly
 * - NO app/ or components/ module imports lib/llm/batch (import-graph lint)
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Force fixtures mode — no real API calls
process.env.LLM_FIXTURES = 'true';
(process.env as Record<string, string>).NODE_ENV = 'test';
delete process.env.ANTHROPIC_API_KEY;

// We use freshTestDb for the DB UPSERT tests.
// The freshTestDb is set up lazily so this module-level var is OK.
import { freshTestDb, type TestDb } from '../helpers/testdb';

// Shared testDb for the persist describe block (set in beforeAll below)
let persistDb: TestDb;

// Mock lib/db/client so persistShareCopy/persistUpdateSummary route through our testDb
vi.mock('../../lib/db/client', async () => {
  return {
    query: async (text: string, params: unknown[] = []) => {
      if (!persistDb) throw new Error('persistDb not initialized');
      return persistDb.query(text, params);
    },
    queryRows: async (text: string, params: unknown[] = []) => {
      if (!persistDb) throw new Error('persistDb not initialized');
      const { rows } = await persistDb.query(text, params);
      return rows;
    },
    queryOne: async (text: string, params: unknown[] = []) => {
      if (!persistDb) throw new Error('persistDb not initialized');
      const { rows } = await persistDb.query(text, params);
      return rows[0] ?? null;
    },
    execScript: async (sql: string) => {
      if (!persistDb) throw new Error('persistDb not initialized');
      await persistDb.exec(sql);
    },
    closePool: async () => {},
    __resetBackendForTests: () => {},
    usingPglite: () => true,
  };
});

import {
  precomputeShareCopy,
  precomputeUpdateSummary,
  persistShareCopy,
  persistUpdateSummary,
} from '../../lib/llm/batch';

// ---------------------------------------------------------------------------
// precomputeShareCopy
// ---------------------------------------------------------------------------

describe('precomputeShareCopy (fixtures mode)', () => {
  const CHANNELS = ['facebook', 'x', 'whatsapp', 'messenger', 'sms', 'email', 'copy_link'];

  it('returns exactly 7 channel variants for a fundraiser', async () => {
    const variants = await precomputeShareCopy({
      entityType: 'fundraiser',
      entityId: '00000000-0000-4000-8000-0000000000f1',
      context: 'Real-Time Alerts for Wildfire Safety',
    });
    expect(variants.length).toBe(7);
  });

  it('covers all required channels', async () => {
    const variants = await precomputeShareCopy({
      entityType: 'fundraiser',
      entityId: '00000000-0000-4000-8000-0000000000f1',
      context: 'Real-Time Alerts for Wildfire Safety',
    });
    const returnedChannels = variants.map(v => v.channel).sort();
    expect(returnedChannels).toEqual(CHANNELS.sort());
  });

  it('each variant has a non-empty copy string', async () => {
    const variants = await precomputeShareCopy({
      entityType: 'fundraiser',
      entityId: '00000000-0000-4000-8000-0000000000f1',
      context: 'Real-Time Alerts for Wildfire Safety',
    });
    for (const v of variants) {
      expect(typeof v.copy).toBe('string');
      expect(v.copy.length).toBeGreaterThan(0);
    }
  });

  it('returns 7 variants for community entity type', async () => {
    const variants = await precomputeShareCopy({
      entityType: 'community',
      entityId: '00000000-0000-4000-8000-0000000000c1',
      context: 'Watch Duty community',
    });
    expect(variants.length).toBe(7);
  });

  it('returns 7 variants for profile entity type', async () => {
    const variants = await precomputeShareCopy({
      entityType: 'profile',
      entityId: '00000000-0000-4000-8000-0000000000a1',
      context: 'Janahan S.',
    });
    expect(variants.length).toBe(7);
  });

  it('fixtures are deterministic — same input returns same output', async () => {
    const input = {
      entityType: 'fundraiser' as const,
      entityId: '00000000-0000-4000-8000-0000000000f1',
      context: 'determinism test context',
    };
    const v1 = await precomputeShareCopy(input);
    const v2 = await precomputeShareCopy(input);
    expect(v1).toEqual(v2);
  });
});

// ---------------------------------------------------------------------------
// precomputeUpdateSummary
// ---------------------------------------------------------------------------

describe('precomputeUpdateSummary (fixtures mode)', () => {
  it('returns a non-empty summary', async () => {
    const result = await precomputeUpdateSummary({
      updateId: '00000000-0000-4000-8000-000000001103',
      updateBody: 'Alert system now live in 3 counties. Over 6,200 households are now covered.',
    });
    expect(typeof result.summary).toBe('string');
    expect(result.summary.length).toBeGreaterThan(0);
  });

  it('summary is ≤120 chars', async () => {
    const result = await precomputeUpdateSummary({
      updateId: '00000000-0000-4000-8000-000000001103',
      updateBody: 'A'.repeat(200) + '.',
    });
    expect(result.summary.length).toBeLessThanOrEqual(121);
  });

  it('returns the same updateId that was passed in', async () => {
    const id = '00000000-0000-4000-8000-000000001103';
    const result = await precomputeUpdateSummary({
      updateId: id,
      updateBody: 'Some update body.',
    });
    expect(result.updateId).toBe(id);
  });

  it('fixture summary contains content from the first sentence', async () => {
    const result = await precomputeUpdateSummary({
      updateId: 'test-id',
      updateBody: 'Band room framing is complete. We sourced 12 replacement instruments.',
    });
    expect(result.summary).toContain('Band room framing is complete');
  });
});

// ---------------------------------------------------------------------------
// persistShareCopy + persistUpdateSummary (UPSERT against fresh PGlite)
// ---------------------------------------------------------------------------

describe('persistShareCopy + persistUpdateSummary (DB UPSERT)', () => {
  const UPDATE_ID = '00000000-0000-4000-8000-aaaaaaaaa001';
  const FUNDRAISER_ID = '00000000-0000-4000-8000-bbbbbbbbbb01';
  const PROFILE_ID = '00000000-0000-4000-8000-cccccccccc01';
  const ENTITY_ID = '00000000-0000-4000-8000-dddddddddd01';

  beforeAll(async () => {
    // Initialize the shared testDb — this also initializes it for the mock
    persistDb = await freshTestDb();

    // Seed minimal rows for FK constraints (no embedding columns needed)
    await persistDb.query(
      `INSERT INTO profile (id,handle,display_name,joined_year) VALUES ($1,'test-org','Test Organizer',2020)`,
      [PROFILE_ID],
    );
    await persistDb.query(
      `INSERT INTO fundraiser (id,slug,organizer_id,title,category,goal_usd,raised_usd,donation_count) VALUES
        ($1,'test-fundraiser-upsert',$2,'Test Fundraiser','Emergencies',10000,5000,50)`,
      [FUNDRAISER_ID, PROFILE_ID],
    );
    await persistDb.query(
      `INSERT INTO fundraiser_update (id,fundraiser_id,author_id,body,created_at) VALUES
        ($1,$2,$3,'Test update body',$4)`,
      [UPDATE_ID, FUNDRAISER_ID, PROFILE_ID, new Date().toISOString()],
    );
  });

  afterAll(async () => {
    await persistDb.close();
  });

  it('persistShareCopy inserts 7 rows for a new entity', async () => {
    const variants = await precomputeShareCopy({
      entityType: 'fundraiser',
      entityId: ENTITY_ID,
      context: 'Test context',
    });
    await persistShareCopy('fundraiser', ENTITY_ID, variants);

    const { rows } = await persistDb.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM share_copy WHERE entity_type='fundraiser' AND entity_id=$1`,
      [ENTITY_ID],
    );
    expect(rows[0].n).toBe(7);
  });

  it('persistShareCopy UPSERT does not duplicate rows on second call', async () => {
    const variants = await precomputeShareCopy({
      entityType: 'fundraiser',
      entityId: ENTITY_ID,
      context: 'Test context updated',
    });
    await persistShareCopy('fundraiser', ENTITY_ID, variants);

    const { rows } = await persistDb.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM share_copy WHERE entity_type='fundraiser' AND entity_id=$1`,
      [ENTITY_ID],
    );
    expect(rows[0].n).toBe(7);
  });

  it('persistShareCopy UPSERT updates copy text on conflict', async () => {
    const newCopy = [{ channel: 'facebook' as const, copy: 'UPDATED facebook copy' }];
    await persistShareCopy('fundraiser', ENTITY_ID, newCopy);

    const { rows } = await persistDb.query<{ copy: string }>(
      `SELECT copy FROM share_copy WHERE entity_type='fundraiser' AND entity_id=$1 AND channel='facebook'`,
      [ENTITY_ID],
    );
    expect(rows[0].copy).toBe('UPDATED facebook copy');
  });

  it('persistUpdateSummary inserts a summary row', async () => {
    await persistUpdateSummary(UPDATE_ID, 'Test summary sentence.');

    const { rows } = await persistDb.query<{ summary: string }>(
      `SELECT summary FROM update_summary WHERE update_id=$1`,
      [UPDATE_ID],
    );
    expect(rows.length).toBe(1);
    expect(rows[0].summary).toBe('Test summary sentence.');
  });

  it('persistUpdateSummary UPSERT updates existing row', async () => {
    await persistUpdateSummary(UPDATE_ID, 'Updated summary.');

    const { rows } = await persistDb.query<{ summary: string }>(
      `SELECT summary FROM update_summary WHERE update_id=$1`,
      [UPDATE_ID],
    );
    expect(rows.length).toBe(1);
    expect(rows[0].summary).toBe('Updated summary.');
  });
});

// ---------------------------------------------------------------------------
// §7.4 / §10 — No app/ or components/ module imports lib/llm/batch
// Static import-graph lint
// ---------------------------------------------------------------------------

describe('no-real-time-LLM ban: app/ and components/ must not import lib/llm/batch', () => {
  function getAllTsFiles(dir: string): string[] {
    const files: string[] = [];
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        if (e.name === 'node_modules' || e.name === '.next') continue;
        const fullPath = join(dir, e.name);
        if (e.isDirectory()) {
          files.push(...getAllTsFiles(fullPath));
        } else if (e.name.endsWith('.ts') || e.name.endsWith('.tsx')) {
          files.push(fullPath);
        }
      }
    } catch {
      // directory doesn't exist
    }
    return files;
  }

  it('no file in app/ imports lib/llm/batch', () => {
    const appDir = join(process.cwd(), 'app');
    const files = getAllTsFiles(appDir);
    const violations: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      if (src.match(/from\s+['"].*lib\/llm\/batch/) || src.match(/require\s*\(\s*['"].*lib\/llm\/batch/)) {
        violations.push(f.replace(process.cwd(), ''));
      }
    }
    expect(violations, `These files import lib/llm/batch: ${violations.join(', ')}`).toEqual([]);
  });

  it('no file in components/ imports lib/llm/batch', () => {
    const componentsDir = join(process.cwd(), 'components');
    const files = getAllTsFiles(componentsDir);
    const violations: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      if (src.match(/from\s+['"].*lib\/llm\/batch/) || src.match(/require\s*\(\s*['"].*lib\/llm\/batch/)) {
        violations.push(f.replace(process.cwd(), ''));
      }
    }
    expect(violations, `These files import lib/llm/batch: ${violations.join(', ')}`).toEqual([]);
  });

  it('no file in app/ imports lib/llm/embed', () => {
    const appDir = join(process.cwd(), 'app');
    const files = getAllTsFiles(appDir);
    const violations: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      if (src.match(/from\s+['"].*lib\/llm\/embed/) || src.match(/require\s*\(\s*['"].*lib\/llm\/embed/)) {
        violations.push(f.replace(process.cwd(), ''));
      }
    }
    expect(violations, `These files import lib/llm/embed: ${violations.join(', ')}`).toEqual([]);
  });

  it('no file in components/ imports lib/llm/embed', () => {
    const componentsDir = join(process.cwd(), 'components');
    const files = getAllTsFiles(componentsDir);
    const violations: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      if (src.match(/from\s+['"].*lib\/llm\/embed/) || src.match(/require\s*\(\s*['"].*lib\/llm\/embed/)) {
        violations.push(f.replace(process.cwd(), ''));
      }
    }
    expect(violations, `These files import lib/llm/embed: ${violations.join(', ')}`).toEqual([]);
  });
});
