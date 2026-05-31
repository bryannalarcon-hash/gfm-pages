#!/usr/bin/env tsx
// Offline batch precompute worker.
// Run:  npx tsx scripts/precompute.ts
//
// For each seeded fundraiser, community, and profile:
//   1. Generate + persist share_copy variants (D9 / C6 / P8).
//   2. Generate + persist update_summary rows (D13).
//   3. Refresh embeddings on fundraiser + profile rows.
//
// Safe with no API keys — all LLM + embed calls fall back to deterministic
// fixtures so this can run on CI or local dev without credentials.
//
// scripts/ is exempt from the no-LLM import rule (architecture.md §4.6 note).

import {
  precomputeShareCopy,
  precomputeUpdateSummary,
  persistShareCopy,
  persistUpdateSummary,
} from '../lib/llm/batch';
import { embedTexts, toPgVector } from '../lib/llm/embed';
import { queryRows, query, closePool } from '../lib/db/client';

// ---------------------------------------------------------------------------
// DB row shapes
// ---------------------------------------------------------------------------

interface FundraiserRow {
  id: string;
  title: string;
  story: string | null;
  category: string;
}

interface CommunityRow {
  id: string;
  name: string;
  description: string | null;
}

interface ProfileRow {
  id: string;
  handle: string;
  display_name: string;
  bio: string | null;
}

interface UpdateRow {
  id: string;
  body: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeContext(parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(' — ');
}

function log(msg: string): void {
  // eslint-disable-next-line no-console
  console.log(`[precompute] ${msg}`);
}

// ---------------------------------------------------------------------------
// Share copy
// ---------------------------------------------------------------------------

async function processFundraiserShareCopy(
  fundraisers: FundraiserRow[],
): Promise<void> {
  log(`Processing share copy for ${fundraisers.length} fundraiser(s)...`);
  for (const f of fundraisers) {
    const context = makeContext([f.title, f.story?.slice(0, 200), f.category]);
    const variants = await precomputeShareCopy({
      entityType: 'fundraiser',
      entityId: f.id,
      context,
    });
    await persistShareCopy('fundraiser', f.id, variants);
    log(`  fundraiser ${f.id} (${f.title}): ${variants.length} channels written`);
  }
}

async function processCommunityShareCopy(
  communities: CommunityRow[],
): Promise<void> {
  log(`Processing share copy for ${communities.length} community(ies)...`);
  for (const c of communities) {
    const context = makeContext([c.name, c.description?.slice(0, 200)]);
    const variants = await precomputeShareCopy({
      entityType: 'community',
      entityId: c.id,
      context,
    });
    await persistShareCopy('community', c.id, variants);
    log(`  community ${c.id} (${c.name}): ${variants.length} channels written`);
  }
}

async function processProfileShareCopy(profiles: ProfileRow[]): Promise<void> {
  log(`Processing share copy for ${profiles.length} profile(s)...`);
  for (const p of profiles) {
    const context = makeContext([p.display_name, p.bio?.slice(0, 200)]);
    const variants = await precomputeShareCopy({
      entityType: 'profile',
      entityId: p.id,
      context,
    });
    await persistShareCopy('profile', p.id, variants);
    log(`  profile ${p.id} (${p.handle}): ${variants.length} channels written`);
  }
}

// ---------------------------------------------------------------------------
// Update summaries
// ---------------------------------------------------------------------------

async function processUpdateSummaries(updates: UpdateRow[]): Promise<void> {
  log(`Processing summaries for ${updates.length} update(s)...`);
  for (const u of updates) {
    const result = await precomputeUpdateSummary({
      updateId: u.id,
      updateBody: u.body,
    });
    await persistUpdateSummary(result.updateId, result.summary);
    log(`  update ${u.id}: summary written (${result.summary.length} chars)`);
  }
}

// ---------------------------------------------------------------------------
// Embeddings
// ---------------------------------------------------------------------------

async function processFundraiserEmbeddings(
  fundraisers: FundraiserRow[],
): Promise<void> {
  if (fundraisers.length === 0) return;
  log(`Refreshing embeddings for ${fundraisers.length} fundraiser(s)...`);

  const texts = fundraisers.map((f) =>
    makeContext([f.title, f.story?.slice(0, 500), f.category]),
  );
  const vectors = await embedTexts(texts);

  for (let i = 0; i < fundraisers.length; i++) {
    const f = fundraisers[i];
    const pgVec = toPgVector(vectors[i]);
    await query(
      `UPDATE fundraiser SET embedding = $1::vector WHERE id = $2`,
      [pgVec, f.id],
    );
    log(`  fundraiser ${f.id}: embedding updated (dim=${vectors[i].length})`);
  }
}

async function processProfileEmbeddings(profiles: ProfileRow[]): Promise<void> {
  if (profiles.length === 0) return;
  log(`Refreshing embeddings for ${profiles.length} profile(s)...`);

  const texts = profiles.map((p) =>
    makeContext([p.display_name, p.bio?.slice(0, 500)]),
  );
  const vectors = await embedTexts(texts);

  for (let i = 0; i < profiles.length; i++) {
    const p = profiles[i];
    const pgVec = toPgVector(vectors[i]);
    await query(
      `UPDATE profile SET embedding = $1::vector WHERE id = $2`,
      [pgVec, p.id],
    );
    log(`  profile ${p.id} (${p.handle}): embedding updated (dim=${vectors[i].length})`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  log('Starting offline batch precompute...');
  log(
    `LLM mode: ${process.env.LLM_FIXTURES === 'true' || !process.env.ANTHROPIC_API_KEY ? 'FIXTURES' : 'LIVE'}`,
  );
  log(
    `Embed mode: ${process.env.EMBED_FIXTURES === 'true' || !process.env.VOYAGE_API_KEY ? 'FIXTURES' : 'LIVE'}`,
  );

  // Load entities from DB.
  const fundraisers = await queryRows<FundraiserRow>(
    `SELECT id, title, story, category FROM fundraiser`,
  );
  const communities = await queryRows<CommunityRow>(
    `SELECT id, name, description FROM community`,
  );
  const profiles = await queryRows<ProfileRow>(
    `SELECT id, handle, display_name, bio FROM profile`,
  );
  const updates = await queryRows<UpdateRow>(
    `SELECT id, body FROM fundraiser_update`,
  );

  log(
    `Loaded: ${fundraisers.length} fundraiser(s), ${communities.length} community(ies), ` +
      `${profiles.length} profile(s), ${updates.length} update(s).`,
  );

  // Share copy
  await processFundraiserShareCopy(fundraisers);
  await processCommunityShareCopy(communities);
  await processProfileShareCopy(profiles);

  // Update summaries
  await processUpdateSummaries(updates);

  // Embeddings
  await processFundraiserEmbeddings(fundraisers);
  await processProfileEmbeddings(profiles);

  log('Batch precompute complete.');
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[precompute] Fatal error:', err);
    process.exitCode = 1;
  })
  .finally(() => closePool());
