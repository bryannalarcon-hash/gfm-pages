// @vitest-environment node
/**
 * §7.6 Embeddings tests.
 *
 * - embedTexts in fixtures mode returns 1024-dim deterministic vectors
 * - same text → same vector (stable across calls)
 * - toPgVector formats correctly
 * - cosine <=> query over seeded fundraiser embeddings returns same-category neighbours first (D3)
 * - embed is NEVER called on the request path (lib/db/queries.ts must not import lib/llm)
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Force fixtures mode so no real Voyage API is called
process.env.EMBED_FIXTURES = 'true';
(process.env as Record<string, string>).NODE_ENV = 'test';
delete process.env.VOYAGE_API_KEY;

import { embedTexts, toPgVector } from '../../lib/llm/embed';

// ---------------------------------------------------------------------------
// Pure unit tests on embedTexts + toPgVector
// ---------------------------------------------------------------------------

describe('embedTexts (fixtures mode)', () => {
  it('returns 1024-dim vectors', async () => {
    const vecs = await embedTexts(['hello world']);
    expect(vecs.length).toBe(1);
    expect(vecs[0].length).toBe(1024);
  });

  it('all values are finite numbers', async () => {
    const vecs = await embedTexts(['test text']);
    for (const v of vecs[0]) {
      expect(isFinite(v)).toBe(true);
    }
  });

  it('same text → same vector (deterministic)', async () => {
    const text = 'wildfire emergency alert system';
    const [v1] = await embedTexts([text]);
    const [v2] = await embedTexts([text]);
    expect(v1).toEqual(v2);
  });

  it('different texts → different vectors', async () => {
    const [v1] = await embedTexts(['education fundraiser']);
    const [v2] = await embedTexts(['animal rescue winter shelter']);
    // At least one coordinate should differ
    const diffs = v1.filter((x, i) => Math.abs(x - v2[i]) > 1e-6);
    expect(diffs.length).toBeGreaterThan(0);
  });

  it('returns empty array for empty input', async () => {
    const vecs = await embedTexts([]);
    expect(vecs).toEqual([]);
  });

  it('batch of 3 texts returns 3 vectors', async () => {
    const texts = ['text a', 'text b', 'text c'];
    const vecs = await embedTexts(texts);
    expect(vecs.length).toBe(3);
    vecs.forEach(v => expect(v.length).toBe(1024));
  });

  it('vectors are L2-normalised (unit norm ≈ 1.0)', async () => {
    const [v] = await embedTexts(['check normalisation']);
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    expect(norm).toBeCloseTo(1.0, 4);
  });
});

// ---------------------------------------------------------------------------
// toPgVector
// ---------------------------------------------------------------------------

describe('toPgVector', () => {
  it('formats a float array as [x,y,...] pgvector literal', () => {
    const result = toPgVector([0.1, 0.2, 0.3]);
    expect(result).toBe('[0.1,0.2,0.3]');
  });

  it('handles 1024-dim vector without truncation', async () => {
    const [v] = await embedTexts(['dimension check']);
    const pgv = toPgVector(v);
    expect(pgv.startsWith('[')).toBe(true);
    expect(pgv.endsWith(']')).toBe(true);
    const parts = pgv.slice(1, -1).split(',');
    expect(parts.length).toBe(1024);
  });

  it('round-trips through toPgVector and back', async () => {
    const [v] = await embedTexts(['round trip']);
    const pgv = toPgVector(v);
    const parsed = pgv.slice(1, -1).split(',').map(Number);
    expect(parsed.length).toBe(v.length);
    parsed.forEach((x, i) => {
      expect(x).toBeCloseTo(v[i], 5);
    });
  });
});

// ---------------------------------------------------------------------------
// §7.6 — embed is NEVER called on the request path
// lib/db/queries.ts must not import lib/llm (any submodule)
// ---------------------------------------------------------------------------

describe('no-real-time-LLM guardrail', () => {
  it('lib/db/queries.ts source does not import lib/llm', () => {
    const queriesSource = readFileSync(join(process.cwd(), 'lib/db/queries.ts'), 'utf8');
    // No import from lib/llm should appear in queries.ts
    expect(queriesSource).not.toMatch(/from\s+['"].*lib\/llm/);
    expect(queriesSource).not.toMatch(/require\s*\(\s*['"].*lib\/llm/);
  });

  it('lib/db/queries.ts does not import lib/llm/embed (no import statement)', () => {
    const queriesSource = readFileSync(join(process.cwd(), 'lib/db/queries.ts'), 'utf8');
    // Must not import from the embed module specifically
    expect(queriesSource).not.toMatch(/from\s+['"].*lib\/llm\/embed/);
    expect(queriesSource).not.toMatch(/require\s*\(\s*['"].*lib\/llm\/embed/);
    // The word "embedding" appears as a SQL column name — that is fine and expected.
  });

  it('lib/db/queries.ts does not import lib/llm/batch (no import statement)', () => {
    const queriesSource = readFileSync(join(process.cwd(), 'lib/db/queries.ts'), 'utf8');
    expect(queriesSource).not.toMatch(/from\s+['"].*lib\/llm\/batch/);
    expect(queriesSource).not.toMatch(/require\s*\(\s*['"].*lib\/llm\/batch/);
  });
});

// ---------------------------------------------------------------------------
// §7.6 — cosine <=> query returns same-category neighbours first (D3)
// Uses in-memory PGlite with category-specific embeddings
// ---------------------------------------------------------------------------

describe('cosine similarity query orders same-category neighbours first (D3)', () => {
  let testDb: Awaited<ReturnType<typeof import('../helpers/testdb').freshTestDb>>;

  beforeAll(async () => {
    const { freshTestDb } = await import('../helpers/testdb');
    testDb = await freshTestDb();

    const { SEED_IDS: ids } = await import('../../db/seed-ids');
    const F = ids.fundraisers;
    const P = ids.profiles;

    // Create category-specific embeddings: each category gets a distinct dimension
    // WF (Emergencies) → dim 0 = 1, others = 0
    // AQ (Emergencies) → dim 0 = 1, others = 0 (nearly identical to WF)
    // BR (Education)   → dim 1 = 1, others = 0
    // CO (Education)   → dim 1 = 1, others = 0
    // DR (Animals)     → dim 2 = 1, others = 0
    // PS (Animals)     → dim 2 = 1, others = 0
    const makeVec = (primaryDim: number) => {
      const v = new Array(1024).fill(0);
      v[primaryDim] = 1.0;
      return '[' + v.map((x: number) => x.toFixed(6)).join(',') + ']';
    };

    const WF = F['realtime-alerts-for-wildfire-safety-r5jkk'];
    const BR = F['rebuild-the-lincoln-hs-band-room'];
    const DR = F['senior-dog-rescue-winter-shelter'];
    const CO = F['first-gen-college-fund-maria'];
    const PS = F['wildfire-evacuation-pet-supplies'];
    const AQ = F['neighborhood-air-quality-sensors'];
    const SJ = P['sarah-j'];
    const LP = P['lena-petrov'];
    const AR = P['aisha-rahman'];
    const JW = P['james-wu'];

    // Insert minimal profiles needed as FKs
    await testDb.query(
      `INSERT INTO profile (id,handle,display_name,joined_year) VALUES
        ($1,'sarah-j','Sarah J.',2016),($2,'lena-petrov','Lena Petrov',2016),
        ($3,'aisha-rahman','Aisha Rahman',2018),($4,'james-wu','James Wu',2020)`,
      [SJ, LP, AR, JW],
    );

    // Insert communities needed as FKs
    const WD = ids.communities['watch-duty'];
    const NC = ids.communities['wildfire-relief-norcal'];
    await testDb.query(
      `INSERT INTO community (id,slug,name,raised_usd,fundraiser_count) VALUES
        ($1,'watch-duty','Watch Duty',1420000,12),
        ($2,'wildfire-relief-norcal','WF NorCal',380000,7)`,
      [WD, NC],
    );

    await testDb.query(
      `INSERT INTO fundraiser (id,slug,organizer_id,community_id,title,story,category,goal_usd,raised_usd,donation_count,embedding) VALUES
        ($1,'realtime-alerts-for-wildfire-safety-r5jkk',$2,$3,'WF Alerts','s','Emergencies',50000,34000,420,$4::vector),
        ($5,'neighborhood-air-quality-sensors',$6,NULL,'Air Quality','s','Emergencies',10000,5200,134,$7::vector),
        ($8,'rebuild-the-lincoln-hs-band-room',$9,NULL,'Band Room','s','Education',20000,17200,310,$10::vector),
        ($11,'first-gen-college-fund-maria',$12,NULL,'College Fund','s','Education',12000,6800,145,$13::vector),
        ($14,'senior-dog-rescue-winter-shelter',$15,NULL,'Dog Rescue','s','Animals',15000,8400,178,$16::vector),
        ($17,'wildfire-evacuation-pet-supplies',$18,$19,'Pet Supplies','s','Animals',8000,3900,112,$20::vector)`,
      [
        WF, SJ, WD, makeVec(0),
        AQ, JW, makeVec(0),
        BR, SJ, makeVec(1),
        CO, AR, makeVec(1),
        DR, LP, makeVec(2),
        PS, LP, WD, makeVec(2),
      ],
    );
  });

  afterAll(async () => {
    await testDb.close();
  });

  it('cosine query ranks Emergencies fundraiser closest to WF', async () => {
    const { SEED_IDS: ids } = await import('../../db/seed-ids');
    const WF = ids.fundraisers['realtime-alerts-for-wildfire-safety-r5jkk'];
    const AQ = ids.fundraisers['neighborhood-air-quality-sensors'];
    const BR = ids.fundraisers['rebuild-the-lincoln-hs-band-room'];

    const { rows } = await testDb.query<{ id: string; title: string }>(
      `SELECT id, title
       FROM fundraiser
       WHERE id <> $1 AND embedding IS NOT NULL
       ORDER BY embedding <=> (SELECT embedding FROM fundraiser WHERE id = $1)
       LIMIT 5`,
      [WF],
    );

    expect(rows.length).toBeGreaterThan(0);

    const aqIdx = rows.findIndex(r => r.id === AQ);
    const brIdx = rows.findIndex(r => r.id === BR);

    // AQ (Emergencies) should be ranked before BR (Education)
    expect(aqIdx).toBeGreaterThanOrEqual(0);
    if (brIdx >= 0) {
      expect(aqIdx).toBeLessThan(brIdx);
    }
  });

  it('cosine query ranks Education fundraisers before Animals for band-room', async () => {
    const { SEED_IDS: ids } = await import('../../db/seed-ids');
    const BR = ids.fundraisers['rebuild-the-lincoln-hs-band-room'];
    const CO = ids.fundraisers['first-gen-college-fund-maria'];
    const DR = ids.fundraisers['senior-dog-rescue-winter-shelter'];

    const { rows } = await testDb.query<{ id: string }>(
      `SELECT id FROM fundraiser
       WHERE id <> $1 AND embedding IS NOT NULL
       ORDER BY embedding <=> (SELECT embedding FROM fundraiser WHERE id = $1)
       LIMIT 5`,
      [BR],
    );

    const coIdx = rows.findIndex(r => r.id === CO);
    const drIdx = rows.findIndex(r => r.id === DR);

    if (coIdx >= 0 && drIdx >= 0) {
      expect(coIdx).toBeLessThan(drIdx);
    } else {
      expect(coIdx).toBeGreaterThanOrEqual(0);
    }
  });
});
