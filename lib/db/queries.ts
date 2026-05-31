// Server-side data-access layer shared by all three page tracks + dashboard.
// architecture.md §2 (lib/db). Read-only query helpers that map DB rows → the typed shapes
// in lib/types (SimilarCard, ActivityRow, PymkCard, …) and assemble the Suns BoardSeed.
// NEVER imports lib/llm/* (no real-time LLM/embedding on the request path) — embeddings are
// read from the precomputed `embedding` columns only.
import 'server-only';
import { query, queryOne, queryRows } from '@/lib/db/client';
import type { SimilarCard, ActivityRow, PymkCard, ShareChannel } from '@/lib/types';
import type { BoardSeed, SunMark, SunAction, SunGradient } from '@/lib/marks/types';

export interface FundraiserRow {
  id: string;
  slug: string;
  organizer_id: string;
  community_id: string | null;
  title: string;
  story: string | null;
  category: string;
  goal_usd: number;
  raised_usd: number;
  donation_count: number;
  follower_count: number;
  hero_image_url: string | null;
  organizer_name: string;
  organizer_handle: string;
  community_slug: string | null;
  community_name: string | null;
}

export async function getFundraiserBySlug(slug: string): Promise<FundraiserRow | null> {
  return queryOne<FundraiserRow>(
    `SELECT f.*, p.display_name AS organizer_name, p.handle AS organizer_handle,
            c.slug AS community_slug, c.name AS community_name
     FROM fundraiser f
     JOIN profile p ON p.id = f.organizer_id
     LEFT JOIN community c ON c.id = f.community_id
     WHERE f.slug = $1`,
    [slug],
  );
}

export interface UpdateRow {
  id: string;
  body: string;
  created_at: string;
  author_name: string;
  summary: string | null;
}

export async function getFundraiserUpdates(fundraiserId: string): Promise<UpdateRow[]> {
  return queryRows<UpdateRow>(
    `SELECT u.id, u.body, u.created_at, p.display_name AS author_name, s.summary
     FROM fundraiser_update u
     JOIN profile p ON p.id = u.author_id
     LEFT JOIN update_summary s ON s.update_id = u.id
     WHERE u.fundraiser_id = $1
     ORDER BY u.created_at DESC`,
    [fundraiserId],
  );
}

// D3/D11 similar fundraisers via precomputed embedding cosine distance (<=>).
export async function getSimilarFundraisers(fundraiserId: string, limit = 6): Promise<SimilarCard[]> {
  const rows = await queryRows<{ id: string; title: string; raised_usd: number; goal_usd: number; hero_image_url: string | null }>(
    `SELECT id, title, raised_usd, goal_usd, hero_image_url
     FROM fundraiser
     WHERE id <> $1 AND embedding IS NOT NULL
     ORDER BY embedding <=> (SELECT embedding FROM fundraiser WHERE id = $1)
     LIMIT $2`,
    [fundraiserId, limit],
  );
  return rows.map(toSimilarCard);
}

// Cold-start fallback: top by raised in the same category.
export async function getTrendingFundraisers(category: string | null, limit = 6, excludeId?: string): Promise<SimilarCard[]> {
  const rows = await queryRows<{ id: string; title: string; raised_usd: number; goal_usd: number; hero_image_url: string | null }>(
    `SELECT id, title, raised_usd, goal_usd, hero_image_url
     FROM fundraiser
     WHERE ($1::text IS NULL OR category = $1) AND ($2::uuid IS NULL OR id <> $2)
     ORDER BY raised_usd DESC
     LIMIT $3`,
    [category, excludeId ?? null, limit],
  );
  return rows.map(toSimilarCard);
}

function toSimilarCard(r: { id: string; title: string; raised_usd: number; goal_usd: number; hero_image_url: string | null }): SimilarCard {
  return {
    id: r.id,
    title: r.title,
    raisedUsd: r.raised_usd,
    goalUsd: r.goal_usd,
    imageUrl: r.hero_image_url ?? `https://picsum.photos/seed/${r.id}/600/400`,
  };
}

export interface DonationRow {
  id: string;
  amount_usd: number;
  comment: string | null;
  created_at: string;
  donor_name: string | null;
}

export async function getRecentDonations(fundraiserId: string, limit = 12): Promise<DonationRow[]> {
  return queryRows<DonationRow>(
    `SELECT d.id, d.amount_usd, d.comment, d.created_at, p.display_name AS donor_name
     FROM donation d
     LEFT JOIN profile p ON p.id = d.donor_id
     WHERE d.fundraiser_id = $1
     ORDER BY d.created_at DESC
     LIMIT $2`,
    [fundraiserId, limit],
  );
}

// D9/C6/P8 — precomputed share copy per channel (cached rows; never a live LLM call).
export async function getShareCopy(
  entityType: 'fundraiser' | 'community' | 'profile',
  entityId: string,
): Promise<Partial<Record<ShareChannel, string>>> {
  const rows = await queryRows<{ channel: string; copy: string }>(
    `SELECT channel, copy FROM share_copy WHERE entity_type = $1 AND entity_id = $2`,
    [entityType, entityId],
  );
  const out: Partial<Record<ShareChannel, string>> = {};
  for (const r of rows) out[r.channel as ShareChannel] = r.copy;
  return out;
}

// Suns board seed (S2) — assembled SSR'd so placement is zero-CLS.
export async function getBoardSeed(
  entityType: 'fundraiser' | 'community' | 'profile',
  entityId: string,
  fundedPct: number,
  viewerToken?: string,
  /** CB-05: ownerToken of the sharer whose link brought the viewer here (utm_share_user).
   *  The matching sun gets isSharer=true → renders "X shared this" highlight ring. */
  sharerToken?: string,
): Promise<BoardSeed> {
  const rows = await queryRows<{
    id: string;
    owner_token: string;
    display_name: string | null;
    action_mask: string;
    gradient_id: string | null;
    size_score: number | null;
  }>(
    // CB-24: sort named/sharer marks first so the 160-mark payload always includes them;
    // getSupporterCount stays unbounded (true count), only this seed payload is capped.
    `SELECT id, owner_token, display_name, action_mask, gradient_id, size_score
     FROM sun_mark
     WHERE entity_type = $1 AND entity_id = $2 AND visible = true
     -- named/sharer marks first (CB-05 highlight always in payload); then ORDER BY id
     -- (uuid → effectively random) so the 160-mark sample keeps a VARIED gradient mix
     -- (size_score DESC clustered the gold/high-value bucket → all-gold board, CB-31).
     ORDER BY (display_name IS NOT NULL) DESC,
              (owner_token = $3) DESC NULLS LAST,
              id
     LIMIT 160`,
    [entityType, entityId, sharerToken ?? ''],
  );
  const marks: SunMark[] = rows.map((r) => ({
    id: r.id,
    ownerToken: r.owner_token,
    displayName: r.display_name,
    actions: (r.action_mask.split(/[,|]/).filter(Boolean) as SunAction[]) || [],
    gradient: (r.gradient_id as SunGradient) ?? 'grey',
    sizeScore: r.size_score ?? 40,
    isOwn: viewerToken ? r.owner_token === viewerToken : false,
    // CB-05: mark the sharer's sun so SunsLayer renders "X shared this" ring
    isSharer: sharerToken ? r.owner_token === sharerToken : false,
  }));
  return { marks, fundedPct: clamp01(fundedPct), density: 0.74, sizeContrast: 1 };
}

export async function getSupporterCount(
  entityType: 'fundraiser' | 'community' | 'profile',
  entityId: string,
): Promise<number> {
  const r = await queryOne<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM sun_mark WHERE entity_type = $1 AND entity_id = $2 AND visible = true`,
    [entityType, entityId],
  );
  return r?.n ?? 0;
}

// ---- Community ----
export interface CommunityRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  raised_usd: number | null;
  fundraiser_count: number | null;
  follower_count: number;
  /** CB-15: hero cover image URL (16:9). Null → placeholder fallback rendered client-side. */
  cover_image_url: string | null;
}

export async function getCommunityBySlug(slug: string): Promise<CommunityRow | null> {
  return queryOne<CommunityRow>(`SELECT * FROM community WHERE slug = $1`, [slug]);
}

/**
 * CB-04: Returns the count of donations attributed to a given sharer's token
 * on a specific entity. This is the seed-derived "reach" shown in GrewRibbon.
 * Reach = number of donations that came in through the sharer's link (single-touch attribution).
 */
export async function getShareReach(
  sharerToken: string,
  entityId: string,
): Promise<number> {
  const r = await queryOne<{ n: number }>(
    `SELECT COUNT(*)::int AS n
     FROM donation_attribution da
     JOIN donation d ON d.id = da.donation_id
     WHERE da.sharer_token = $1 AND d.fundraiser_id = $2`,
    [sharerToken, entityId],
  );
  return r?.n ?? 0;
}

export async function getCommunityActivity(communityId: string, limit = 20): Promise<
  Array<{ id: string; verb: string; body: string | null; created_at: string; actor_name: string; reaction_count: number; comment_count: number }>
> {
  return queryRows(
    `SELECT a.id, a.verb, a.body, a.created_at, p.display_name AS actor_name, a.reaction_count, a.comment_count
     FROM community_activity a JOIN profile p ON p.id = a.actor_id
     WHERE a.community_id = $1 ORDER BY a.created_at DESC LIMIT $2`,
    [communityId, limit],
  );
}

// ---- Profile ----
export interface ProfileRow {
  id: string;
  handle: string;
  display_name: string;
  bio: string | null;
  joined_year: number | null;
  cause_tags: string[] | null;
  follower_count: number;
}

export async function getProfileByHandle(handle: string): Promise<ProfileRow | null> {
  return queryOne<ProfileRow>(`SELECT * FROM profile WHERE handle = $1`, [handle]);
}

export async function getProfileFundraisers(profileId: string): Promise<SimilarCard[]> {
  const rows = await queryRows<{ id: string; title: string; raised_usd: number; goal_usd: number; hero_image_url: string | null }>(
    `SELECT id, title, raised_usd, goal_usd, hero_image_url FROM fundraiser WHERE organizer_id = $1 ORDER BY raised_usd DESC`,
    [profileId],
  );
  return rows.map(toSimilarCard);
}

// P4/C3 PYMK — graph-proximate profiles via embedding cosine, excluding already-followed.
export async function getPymk(profileId: string, limit = 6): Promise<PymkCard[]> {
  const rows = await queryRows<{ id: string; display_name: string; cause_tags: string[] | null }>(
    `SELECT id, display_name, cause_tags
     FROM profile
     WHERE id <> $1 AND embedding IS NOT NULL
     ORDER BY embedding <=> (SELECT embedding FROM profile WHERE id = $1)
     LIMIT $2`,
    [profileId, limit],
  );
  return rows.map((r, i) => ({
    id: r.id,
    name: r.display_name,
    avatar: avatarFor(r.display_name),
    rankPosition: i + 1,
    proximityLabel: r.cause_tags?.[0] ? `Cares about ${r.cause_tags[0]}` : undefined,
  }));
}

// Activity rows for the P2 "what you missed" feed (recent updates/published by a profile).
export async function getProfileActivity(profileId: string, sinceMonths = 12): Promise<ActivityRow[]> {
  const rows = await queryRows<{ title: string; created_at: string; verb: string; fundraiser_slug: string }>(
    `SELECT f.title, u.created_at, 'UPDATED' AS verb, f.slug AS fundraiser_slug
     FROM fundraiser_update u JOIN fundraiser f ON f.id = u.fundraiser_id
     WHERE u.author_id = $1
     ORDER BY u.created_at DESC LIMIT 8`,
    [profileId],
  );
  const now = Date.now();
  return rows.map((r) => ({
    verb: (r.verb as ActivityRow['verb']) ?? 'UPDATED',
    title: r.title,
    byline: 'Update posted',
    href: `/f/${r.fundraiser_slug}`,
    ageDays: Math.max(0, Math.round((now - new Date(r.created_at).getTime()) / 86400000)),
  }));
}

function avatarFor(name: string): { bg: string; fg: string; initial: string } {
  const palette = [
    { bg: '#ccf88e', fg: '#274a34' },
    { bg: '#ffd863', fg: '#68570d' },
    { bg: '#a7e3e3', fg: '#1c456b' },
    { bg: '#eccff6', fg: '#642878' },
    { bg: '#e9fcce', fg: '#274a34' },
  ];
  const initial = name.trim().charAt(0).toUpperCase();
  const idx = initial.charCodeAt(0) % palette.length;
  return { ...palette[idx], initial };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

// ---------------------------------------------------------------------------
// CB-21 — analytics_event persistence (live demo interaction durability)
// ---------------------------------------------------------------------------

export interface AnalyticsEventInput {
  uuid: string;
  event: string;
  persona: string;
  referrerSource: string;
  keyLabel?: string;
  keyValue?: string;
  createdAt: string;
}

/**
 * Persist a single TickerEvent to analytics_event.
 * ON CONFLICT (id) DO NOTHING provides idempotent deduplication by uuid.
 * Wrapped in try/catch: a DB failure must never break the offline demo.
 */
export async function insertAnalyticsEvent(e: AnalyticsEventInput): Promise<void> {
  try {
    await query(
      `INSERT INTO analytics_event (id, event, persona, referrer_source, key_label, key_value, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [
        e.uuid,
        e.event,
        e.persona,
        e.referrerSource,
        e.keyLabel ?? null,
        e.keyValue ?? null,
        e.createdAt,
      ],
    );
  } catch {
    // Best-effort write — swallow DB errors so the demo never breaks.
  }
}

/**
 * Fetch the newest `limit` analytics_event rows, returned oldest-first so the
 * caller can push them into a ring buffer in chronological order.
 * Maps DB columns back to the TickerEvent shape used by lib/ticker/store.ts.
 * Wrapped in try/catch: on DB error returns [] so the offline demo never breaks.
 */
export async function getRecentAnalyticsEvents(limit = 200): Promise<import('@/lib/types').TickerEvent[]> {
  try {
    // SELECT newest `limit` DESC, then reverse so result is oldest-first.
    const rows = await queryRows<{
      id: string;
      event: string;
      persona: string;
      referrer_source: string;
      key_label: string | null;
      key_value: string | null;
      created_at: string;
    }>(
      `SELECT id, event, persona, referrer_source, key_label, key_value, created_at
       FROM (
         SELECT id, event, persona, referrer_source, key_label, key_value, created_at
         FROM analytics_event
         ORDER BY created_at DESC
         LIMIT $1
       ) sub
       ORDER BY created_at ASC`,
      [limit],
    );

    return rows.map((r) => ({
      uuid: r.id,
      event: r.event as import('@/lib/types').TickerEvent['event'],
      timestamp: typeof r.created_at === 'string'
        ? r.created_at
        : String(r.created_at),
      persona: r.persona as import('@/lib/types').TickerEvent['persona'],
      referrerSource: r.referrer_source as import('@/lib/types').TickerEvent['referrerSource'],
      keyProp: {
        label: r.key_label ?? 'event',
        value: r.key_value ?? r.event,
      },
    }));
  } catch {
    // Best-effort read — return empty so the demo continues without DB.
    return [];
  }
}
