// Shared types for the community page track (C1–C7).
// CommunityRow mirrors lib/db/queries CommunityRow so the client components do not
// import server-only modules.

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

export interface ActivityItem {
  id: string;
  verb: string; // 'donated' | 'started' | 'milestone' | ...
  body: string | null;
  created_at: string;
  actor_name: string;
  reaction_count: number;
  comment_count: number;
}
