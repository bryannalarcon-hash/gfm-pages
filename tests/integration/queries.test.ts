// @vitest-environment node
/**
 * queries.ts contract tests (§7.5 / §7.7).
 *
 * Verifies getFundraiserBySlug, getSimilarFundraisers, getShareCopy,
 * getBoardSeed, getCommunityBySlug, getProfileByHandle, getPymk — each
 * returns the expected shape against the seeded in-memory DB.
 *
 * Strategy: use freshTestDb() (which uses PGlite.create with vector extension
 * correctly loaded), then route lib/db/client's query/queryOne/queryRows
 * through the freshTestDb wrapper via vi.mock.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { SEED_IDS } from '../../db/seed-ids';
import { freshTestDb, type TestDb } from '../helpers/testdb';

let testDb: TestDb;

// We mock lib/db/client to proxy all calls through our freshTestDb instance.
// This must happen before importing lib/db/queries.
vi.mock('../../lib/db/client', async () => {
  // Return proxy functions that delegate to testDb once it's ready.
  return {
    query: async (text: string, params: unknown[] = []) => {
      return testDb.query(text, params);
    },
    queryRows: async (text: string, params: unknown[] = []) => {
      const { rows } = await testDb.query(text, params);
      return rows;
    },
    queryOne: async (text: string, params: unknown[] = []) => {
      const { rows } = await testDb.query(text, params);
      return rows[0] ?? null;
    },
    execScript: async (sql: string) => {
      await testDb.exec(sql);
    },
    closePool: async () => {
      // No-op; testDb.close() is called in afterAll
    },
    __resetBackendForTests: () => {
      // No-op
    },
    usingPglite: () => true,
  };
});

// Now import the query functions - they will use the mocked lib/db/client
import {
  getFundraiserBySlug,
  getSimilarFundraisers,
  getShareCopy,
  getBoardSeed,
  getCommunityBySlug,
  getProfileByHandle,
  getPymk,
} from '../../lib/db/queries';

const F = SEED_IDS.fundraisers;
const P = SEED_IDS.profiles;
const C = SEED_IDS.communities;
const WF = F['realtime-alerts-for-wildfire-safety-r5jkk'];
const BR = F['rebuild-the-lincoln-hs-band-room'];
const DR = F['senior-dog-rescue-winter-shelter'];
const CO = F['first-gen-college-fund-maria'];
const PS = F['wildfire-evacuation-pet-supplies'];
const AQ = F['neighborhood-air-quality-sensors'];
const JN = P.janahan;
const SJ = P['sarah-j'];
const SK = P['sarah-k'];
const MT = P['mike-t'];
const PM = P['priya-m'];
const DO = P['david-okafor'];
const LP = P['lena-petrov'];
const JW = P['james-wu'];
const AR = P['aisha-rahman'];
const WD = C['watch-duty'];
const NC = C['wildfire-relief-norcal'];

const da = (n: number) => new Date(Date.now() - n * 86400_000).toISOString();

// Profile embedding: each profile gets a category-based vector with distinct dims
function profileEmb(causes: string[]): string {
  const cats = ['Community', 'Education', 'Animals', 'Emergencies'];
  const v = new Array(1024).fill(0);
  causes.forEach(c => {
    const idx = cats.indexOf(c);
    if (idx >= 0) v[idx] += 1;
  });
  const norm = Math.sqrt(v.reduce((s: number, x: number) => s + x * x, 0)) || 1;
  return '[' + v.map((x: number) => (x / norm).toFixed(6)).join(',') + ']';
}

// Category embedding for fundraisers: same category = nearly identical vectors
function categoryEmb(category: string): string {
  const cats = ['Emergencies', 'Education', 'Animals'];
  const idx = cats.indexOf(category);
  const v = new Array(1024).fill(0);
  v[idx < 0 ? 0 : idx] = 1.0;
  return '[' + v.map((x: number) => x.toFixed(6)).join(',') + ']';
}

async function seedDb(db: TestDb) {
  const ins = (sql: string, p: unknown[]) => db.query(sql, p);
  const sz = (o: number, i: number) => Math.round(40 + 30 * Math.log(1 + o + i));

  await ins(
    `INSERT INTO community (id,slug,name,description,raised_usd,fundraiser_count,follower_count) VALUES
      ($1,'watch-duty','Watch Duty','desc',1420000,12,1240),
      ($2,'wildfire-relief-norcal','Wildfire Relief NorCal','desc2',380000,7,520)`,
    [WD, NC],
  );

  await ins(
    `INSERT INTO profile (id,handle,display_name,bio,joined_year,cause_tags,follower_count,embedding) VALUES
      ($1,'janahan','Janahan S.',NULL,2015,ARRAY['Community','Education','Animals'],142,$2::vector),
      ($3,'sarah-j','Sarah J.','bio',2016,ARRAY['Emergencies','Community'],380,$4::vector)`,
    [JN, profileEmb(['Community', 'Education', 'Animals']), SJ, profileEmb(['Emergencies', 'Community'])],
  );

  await ins(
    `INSERT INTO profile (id,handle,display_name,bio,joined_year,cause_tags,follower_count,embedding) VALUES
      ($1,'sarah-k','Sarah K.','bio',2018,ARRAY['Animals','Emergencies'],95,$2::vector),
      ($3,'mike-t','Mike T.','bio',2014,ARRAY['Community','Education','Animals'],830,$4::vector),
      ($5,'priya-m','Priya M.','bio',2019,ARRAY['Education'],48,$6::vector),
      ($7,'david-okafor','David Okafor','bio',2017,ARRAY['Education','Community'],211,$8::vector),
      ($9,'lena-petrov','Lena Petrov','bio',2016,ARRAY['Animals'],175,$10::vector),
      ($11,'james-wu','James Wu','bio',2020,ARRAY['Community','Emergencies'],63,$12::vector),
      ($13,'aisha-rahman','Aisha Rahman','bio',2018,ARRAY['Education'],299,$14::vector)`,
    [
      SK, profileEmb(['Animals', 'Emergencies']),
      MT, profileEmb(['Community', 'Education', 'Animals']),
      PM, profileEmb(['Education']),
      DO, profileEmb(['Education', 'Community']),
      LP, profileEmb(['Animals']),
      JW, profileEmb(['Community', 'Emergencies']),
      AR, profileEmb(['Education']),
    ],
  );

  const story = 'Wildfires move fast.';
  await ins(
    `INSERT INTO fundraiser (id,slug,organizer_id,community_id,title,story,category,goal_usd,raised_usd,donation_count,follower_count,hero_image_url,embedding) VALUES
      ($1,'realtime-alerts-for-wildfire-safety-r5jkk',$2,$3,'Real-Time Alerts for Wildfire Safety',$4,'Emergencies',50000,34000,420,912,'https://picsum.photos/seed/wildfire/1200/630',$5::vector),
      ($6,'rebuild-the-lincoln-hs-band-room',$7,NULL,'Rebuild the Lincoln High School Band Room','story','Education',20000,17200,310,440,'https://picsum.photos/seed/bandroom/1200/630',$8::vector),
      ($9,'senior-dog-rescue-winter-shelter',$10,NULL,'Winter Shelter for Senior Dogs','story','Animals',15000,8400,178,310,'https://picsum.photos/seed/dogs/1200/630',$11::vector),
      ($12,'first-gen-college-fund-maria',$13,NULL,'First-Gen College Fund for Maria','story','Education',12000,6800,145,280,'https://picsum.photos/seed/college/1200/630',$14::vector),
      ($15,'wildfire-evacuation-pet-supplies',$16,$17,'Wildfire Evacuation Pet Supply Kits','story','Animals',8000,3900,112,195,'https://picsum.photos/seed/pets/1200/630',$18::vector),
      ($19,'neighborhood-air-quality-sensors',$20,NULL,'Open-Source Air Quality Sensors','story','Emergencies',10000,5200,134,221,'https://picsum.photos/seed/airsensor/1200/630',$21::vector)`,
    [
      WF, SJ, WD, story, categoryEmb('Emergencies'),
      BR, SJ, categoryEmb('Education'),
      DR, LP, categoryEmb('Animals'),
      CO, AR, categoryEmb('Education'),
      PS, LP, WD, categoryEmb('Animals'),
      AQ, JW, categoryEmb('Emergencies'),
    ],
  );

  // fundraiser_update (needed for FK constraints in other tests)
  const U3 = '00000000-0000-4000-8000-000000001103';
  await ins(
    `INSERT INTO fundraiser_update (id,fundraiser_id,author_id,body,created_at) VALUES
      ($1,$2,$3,'Alert system live in 3 counties',$4)`,
    [U3, WF, SJ, da(3)],
  );

  // share_copy (7 × 3 entities)
  await ins(
    `INSERT INTO share_copy (entity_type,entity_id,channel,copy) VALUES
      ('fundraiser',$1,'facebook','fb copy'),('fundraiser',$1,'x','x copy'),
      ('fundraiser',$1,'whatsapp','wa copy'),('fundraiser',$1,'messenger','msn copy'),
      ('fundraiser',$1,'sms','sms copy'),('fundraiser',$1,'email','email copy'),
      ('fundraiser',$1,'copy_link','link copy'),
      ('community',$2,'facebook','cfb'),('community',$2,'x','cx'),
      ('community',$2,'whatsapp','cwa'),('community',$2,'messenger','cmsn'),
      ('community',$2,'sms','csms'),('community',$2,'email','cemail'),
      ('community',$2,'copy_link','clink'),
      ('profile',$3,'facebook','pfb'),('profile',$3,'x','px'),
      ('profile',$3,'whatsapp','pwa'),('profile',$3,'messenger','pmsn'),
      ('profile',$3,'sms','psms'),('profile',$3,'email','pemail'),
      ('profile',$3,'copy_link','plink')`,
    [WF, WD, JN],
  );

  // community_activity
  const A1 = '00000000-0000-4000-8000-000000004001';
  await ins(
    `INSERT INTO community_activity (id,community_id,actor_id,verb,body,created_at,reaction_count,comment_count) VALUES
      ($1,$2,$3,'milestone','milestone 1',$4,14,3)`,
    [A1, WD, SJ, da(2)],
  );

  // sun_marks for wildfire board (band-room stays ZERO for cold-start test)
  const S1 = '00000000-0000-4000-8000-000000005001';
  const S7 = '00000000-0000-4000-8000-000000005007';
  await ins(
    `INSERT INTO sun_mark (id,entity_type,entity_id,owner_token,display_name,action_mask,gradient_id,own_amount_usd,inherited_usd,size_score,visible,created_at) VALUES
      ($1,'fundraiser',$2,'priya_m',NULL,'follow','grey',0,0,$3,true,$4),
      ($5,'fundraiser',$6,'mike_t',NULL,'follow,share','teal',0,92,$7,true,$8)`,
    [S1, WF, sz(0, 0), da(400), S7, WF, sz(0, 92), da(18)],
  );
}

beforeAll(async () => {
  testDb = await freshTestDb();
  await seedDb(testDb);
});

afterAll(async () => {
  await testDb.close();
});

// ---------------------------------------------------------------------------
// getFundraiserBySlug
// ---------------------------------------------------------------------------

describe('getFundraiserBySlug', () => {
  it('returns a FundraiserRow with all required fields for known slug', async () => {
    const row = await getFundraiserBySlug('realtime-alerts-for-wildfire-safety-r5jkk');
    expect(row).not.toBeNull();
    expect(row!.slug).toBe('realtime-alerts-for-wildfire-safety-r5jkk');
    expect(row!.id).toBe(WF);
    expect(row!.title).toContain('Wildfire');
    expect(row!.organizer_name).toBe('Sarah J.');
    expect(row!.organizer_handle).toBe('sarah-j');
    expect(row!.community_slug).toBe('watch-duty');
    expect(row!.community_name).toBe('Watch Duty');
    expect(typeof row!.goal_usd).toBe('number');
    expect(typeof row!.raised_usd).toBe('number');
  });

  it('returns null for unknown slug', async () => {
    const row = await getFundraiserBySlug('no-such-fundraiser');
    expect(row).toBeNull();
  });

  it('band-room has community_slug null (no community)', async () => {
    const row = await getFundraiserBySlug('rebuild-the-lincoln-hs-band-room');
    expect(row).not.toBeNull();
    expect(row!.community_slug).toBeNull();
    expect(row!.community_name).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getSimilarFundraisers — embedding order (D3)
// ---------------------------------------------------------------------------

describe('getSimilarFundraisers (embedding cosine)', () => {
  it('returns SimilarCard array excluding the queried fundraiser', async () => {
    const results = await getSimilarFundraisers(WF, 5);
    expect(Array.isArray(results)).toBe(true);
    expect(results.every(r => r.id !== WF)).toBe(true);
  });

  it('returns objects with required SimilarCard shape', async () => {
    const results = await getSimilarFundraisers(WF, 3);
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(typeof r.title).toBe('string');
      expect(typeof r.raisedUsd).toBe('number');
      expect(typeof r.goalUsd).toBe('number');
      expect(typeof r.imageUrl).toBe('string');
    }
  });

  it('same-category fundraisers rank first for Emergencies (D3)', async () => {
    const results = await getSimilarFundraisers(WF, 5);
    const aqIdx = results.findIndex(r => r.id === AQ);
    const brIdx = results.findIndex(r => r.id === BR); // Education

    if (aqIdx >= 0 && brIdx >= 0) {
      expect(aqIdx).toBeLessThan(brIdx);
    } else {
      expect(aqIdx, 'AQ (Emergencies) should appear in similar fundraisers for WF').toBeGreaterThanOrEqual(0);
    }
  });
});

// ---------------------------------------------------------------------------
// getShareCopy
// ---------------------------------------------------------------------------

describe('getShareCopy', () => {
  it('returns all 7 channels for a fundraiser', async () => {
    const copy = await getShareCopy('fundraiser', WF);
    const channels = Object.keys(copy);
    expect(channels).toContain('facebook');
    expect(channels).toContain('x');
    expect(channels).toContain('whatsapp');
    expect(channels).toContain('messenger');
    expect(channels).toContain('sms');
    expect(channels).toContain('email');
    expect(channels).toContain('copy_link');
    expect(channels.length).toBe(7);
  });

  it('returns correct copy text per channel', async () => {
    const copy = await getShareCopy('fundraiser', WF);
    expect(copy['facebook']).toBe('fb copy');
    expect(copy['copy_link']).toBe('link copy');
  });

  it('returns all 7 channels for a community', async () => {
    const copy = await getShareCopy('community', WD);
    expect(Object.keys(copy).length).toBe(7);
  });

  it('returns all 7 channels for a profile', async () => {
    const copy = await getShareCopy('profile', JN);
    expect(Object.keys(copy).length).toBe(7);
  });

  it('returns empty object for unknown entity', async () => {
    const copy = await getShareCopy('fundraiser', '00000000-0000-4000-8000-ffffffffffff');
    expect(Object.keys(copy).length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getBoardSeed
// ---------------------------------------------------------------------------

describe('getBoardSeed', () => {
  it('returns a valid BoardSeed shape for wildfire fundraiser', async () => {
    const seed = await getBoardSeed('fundraiser', WF, 34000 / 50000);
    expect(Array.isArray(seed.marks)).toBe(true);
    expect(typeof seed.fundedPct).toBe('number');
    expect(seed.fundedPct).toBeCloseTo(0.68, 2);
    expect(seed.marks.length).toBeGreaterThan(0);
  });

  it('every mark has required SunMark fields', async () => {
    const seed = await getBoardSeed('fundraiser', WF, 0.68);
    for (const m of seed.marks) {
      expect(typeof m.id).toBe('string');
      expect(typeof m.ownerToken).toBe('string');
      expect(Array.isArray(m.actions)).toBe(true);
      expect(typeof m.gradient).toBe('string');
      expect(typeof m.sizeScore).toBe('number');
    }
  });

  it('isOwn flag is true for viewer token matching owner_token', async () => {
    const seed = await getBoardSeed('fundraiser', WF, 0.68, 'mike_t');
    const ownMark = seed.marks.find(m => m.ownerToken === 'mike_t');
    expect(ownMark).toBeDefined();
    expect(ownMark!.isOwn).toBe(true);
  });

  it('isOwn is false for viewer token not matching any mark', async () => {
    const seed = await getBoardSeed('fundraiser', WF, 0.68, 'unknown_token');
    for (const m of seed.marks) {
      expect(m.isOwn).toBe(false);
    }
  });

  it('band-room board has ZERO marks (cold-start)', async () => {
    const seed = await getBoardSeed('fundraiser', BR, 0.86);
    expect(seed.marks.length).toBe(0);
  });

  it('fundedPct is clamped to [0, 1]', async () => {
    const over = await getBoardSeed('fundraiser', WF, 1.5);
    expect(over.fundedPct).toBe(1);
    const under = await getBoardSeed('fundraiser', WF, -0.5);
    expect(under.fundedPct).toBe(0);
  });

  it('caps the payload and surfaces named/sharer marks first, with a varied (not size-clustered) sample', async () => {
    // CB-24/CB-31: payload bounded to ≤160; named (displayName) marks sort first so they
    // are always present; ordering is by id (varied gradient mix), NOT size_score DESC
    // (that clustered the high-value gold bucket → an all-gold board).
    const seed = await getBoardSeed('fundraiser', WF, 0.68);
    expect(seed.marks.length).toBeGreaterThan(0);
    expect(seed.marks.length).toBeLessThanOrEqual(160);
    // All displayName (named/consented) marks come before any anonymous mark.
    const firstAnon = seed.marks.findIndex((m) => !m.displayName);
    if (firstAnon !== -1) {
      expect(seed.marks.slice(firstAnon).every((m) => !m.displayName)).toBe(true);
    }
    // Variety: the returned sample is NOT a single gradient bucket (the CB-31 regression).
    const gradients = new Set(seed.marks.map((m) => m.gradient));
    expect(gradients.size).toBeGreaterThan(1);
  });

  it('includes the sharer mark in the bounded payload when a sharerToken is given', async () => {
    const seed = await getBoardSeed('fundraiser', WF, 0.68, undefined, 'mike_t');
    expect(seed.marks.some((m) => m.isSharer)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getCommunityBySlug
// ---------------------------------------------------------------------------

describe('getCommunityBySlug', () => {
  it('returns a CommunityRow for watch-duty', async () => {
    const row = await getCommunityBySlug('watch-duty');
    expect(row).not.toBeNull();
    expect(row!.id).toBe(WD);
    expect(row!.slug).toBe('watch-duty');
    expect(row!.name).toBe('Watch Duty');
    expect(typeof row!.follower_count).toBe('number');
  });

  it('returns null for unknown community slug', async () => {
    const row = await getCommunityBySlug('no-such-community');
    expect(row).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getProfileByHandle
// ---------------------------------------------------------------------------

describe('getProfileByHandle', () => {
  it('returns a ProfileRow for janahan', async () => {
    const row = await getProfileByHandle('janahan');
    expect(row).not.toBeNull();
    expect(row!.id).toBe(JN);
    expect(row!.handle).toBe('janahan');
    expect(row!.display_name).toBe('Janahan S.');
    expect(row!.follower_count).toBe(142);
  });

  it('janahan bio is null (§7.5 spec)', async () => {
    const row = await getProfileByHandle('janahan');
    expect(row!.bio).toBeNull();
  });

  it('returns null for unknown handle', async () => {
    const row = await getProfileByHandle('no-such-handle');
    expect(row).toBeNull();
  });

  it('sarah-j has non-null bio', async () => {
    const row = await getProfileByHandle('sarah-j');
    expect(row).not.toBeNull();
    expect(row!.bio).not.toBeNull();
    expect(row!.bio!.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// getPymk — people-you-may-know via embedding cosine
// ---------------------------------------------------------------------------

describe('getPymk', () => {
  it('returns an array of PymkCard objects', async () => {
    const results = await getPymk(JN, 5);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });

  it('excludes the queried profile from results', async () => {
    const results = await getPymk(JN, 8);
    expect(results.every(r => r.id !== JN)).toBe(true);
  });

  it('each PymkCard has required shape', async () => {
    const results = await getPymk(JN, 3);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(typeof r.name).toBe('string');
      expect(typeof r.rankPosition).toBe('number');
      expect(typeof r.avatar).toBe('object');
      expect(typeof r.avatar.bg).toBe('string');
      expect(typeof r.avatar.fg).toBe('string');
      expect(typeof r.avatar.initial).toBe('string');
    }
  });

  it('rank positions are sequential starting from 1', async () => {
    const results = await getPymk(JN, 4);
    results.forEach((r, i) => {
      expect(r.rankPosition).toBe(i + 1);
    });
  });

  it('similar-cause profiles rank near the top for janahan (Community/Education/Animals)', async () => {
    // Janahan: Community/Education/Animals. Mike-T also has all three.
    // Sarah-J: Emergencies/Community — different mix.
    const results = await getPymk(JN, 9);
    const mikeIdx = results.findIndex(r => r.id === MT);
    const sarahJIdx = results.findIndex(r => r.id === SJ);
    if (mikeIdx >= 0 && sarahJIdx >= 0) {
      expect(mikeIdx).toBeLessThan(sarahJIdx);
    }
  });
});
