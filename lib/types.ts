// Cross-module shared types. architecture.md §6.
//
// EventName + ReferrerSource are MIRRORS of strategy-metrics-research.md §4–§5.
// Single owner is that doc. Listed here only so TS can type-check + so the overlay
// element→event→metric chain can't drift on a misspelling. If §4/§5 change, this follows — never leads.
import type { PersonaSlug, PersonaFixture } from '@/lib/personas/types';

export type EventName =
  // Fundraiser funnel (§4)
  | 'Page Viewed'
  | 'Story Scrolled'
  | 'Donate Intent'
  | 'Amount Selected'
  | 'Donate Started'
  | 'Donate Completed'
  | 'Donate Failed'
  | 'Share Clicked'
  | 'Follow Clicked'
  // Post-donate group (§4)
  | 'Post Donate Viewed'
  | 'Post Donate Share Clicked'
  | 'Post Donate Recurring Upgrade Clicked'
  | 'Post Donate Follow Clicked'
  | 'Post Donate Dismissed'
  // Community + Profile (§5)
  | 'Community Followed'
  | 'Update Read'
  | 'Fundraiser Clicked Through'
  // Engagement + Suns board (§4 "Board / Mark" group, added 2026-05-29)
  | 'Section Viewed'
  | 'Mark Created'
  | 'Mark Customized'
  | 'Mark Grew'
  | 'Mark Shared'
  // Community interactions (§4, added 2026-05-29)
  | 'Fundraiser Filter Applied'
  | 'Start Fundraiser Clicked';

export type ReferrerSource =
  | 'social'
  | 'email'
  | 'direct'
  | 'search'
  | 'profile'
  | 'community'
  | 'community_leaderboard'
  | 'community_share'
  | 'fundraiser'
  | 'profile_share'
  | 'profile_digest_email'
  | 'profile_recurring_nudge';
// NOTE: the D3 post-donate → community-follow flow has NO dedicated referrer_source value.
// §4 owns exactly the 12 values above. That flow is captured via the `follow_target`
// property ('organizer' | 'community') on the `Post Donate Follow Clicked` event; the landing
// keeps referrer_source 'fundraiser'. If §4 ever adds a value, mirror it here — never lead.

// Share channels — shared vocabulary (capture share_channel, ShareSheet, marks attribution,
// llm batch). Hoisted here from lib/llm/batch.ts (§4.6) so request-path modules can use it
// WITHOUT importing the batch worker (which the no-real-time-LLM ESLint rule forbids).
export type ShareChannel =
  | 'facebook'
  | 'x'
  | 'whatsapp'
  | 'messenger'
  | 'sms'
  | 'email'
  | 'copy_link'
  | 'native_share'
  | 'embed';

export type DeltaId =
  | 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6' | 'D7' | 'D8' | 'D9' | 'D10' | 'D12' | 'D13' // D11 folded into D3
  | 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'C7'
  | 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6' | 'P7' | 'P8' | 'P9'
  | 'S1' | 'S2' | 'S3' | 'S4' | 'S5'; // cross-page Suns cluster (folded 2026-05-29) → 33 total

export type DashboardAnchor =
  | 'metric-tree'
  | 'donate-funnel'
  | 'retention'
  | 'nsm'
  | 'repeat-visits'
  | 'share-trends'
  | 'experiments'
  | 'replays';

export type TierLevel = '1' | '2'; // guardrail surfaced dashboard-only

export interface PageContext {
  page: 'fundraiser' | 'community' | 'profile';
  fundraiserId?: string;
  communityId?: string;
  profileId?: string;
  referrerSource: ReferrerSource;
  pageState: { raisedPct?: number; momentum?: 'high' | 'slow' | 'near_goal' };
}

export interface SimilarCard {
  id: string;
  title: string;
  raisedUsd: number;
  goalUsd: number;
  imageUrl: string;
}

export interface ActivityRow {
  verb: 'UPDATED' | 'PUBLISHED' | 'DONATED';
  title: string;
  byline: string;
  href: string;
  ageDays: number;
}

export interface PymkCard {
  id: string;
  name: string;
  avatar: { bg: string; fg: string; initial: string };
  rankPosition: number;
  proximityLabel?: string;
}

export interface MetricNode {
  id: string;
  label: string;
  value: string;
  tier: TierLevel | 'guardrail';
  anchor: DashboardAnchor;
  children?: MetricNode[];
}

export interface SessionRow {
  sessionId: string;
  persona: PersonaSlug;
  durationSec: number;
  eventCount: number;
  rageClickCount: number;
  errorCount: number;
  lastEvent: string;
}

export interface SessionDetail extends SessionRow {
  markers: { tsSec: number; type: 'error' | 'click' | 'nav' | 'vital' }[];
  network: { url: string; method: string; status: number; durationMs: number }[];
  deadClickCount: number;
  vitals: { inp?: number; cls?: number; lcp?: number };
}

export interface ExperimentRow {
  key: string;
  variant: string;
  exposures: number;
  conversionPct: number;
  control: number;
  uplift: number;
  significant: boolean;
} // W8

export interface ActiveNowStat {
  liveVisitors: number;
  byPersona: { persona: PersonaSlug; n: number }[];
  topPage: string;
} // W6

// TickerEvent — used by ticker, blob, dashboard. architecture.md §4.4.
export interface TickerEvent {
  uuid: string; // dedupe key
  event: EventName;
  timestamp: string; // ISO
  persona: PersonaSlug; // demo-mode property
  referrerSource: ReferrerSource;
  keyProp: { label: string; value: string };
}

// SEED_IDS: the single shared registry of seeded entity ids. db/seed.ts OWNS the values;
// the type lives here so fixtures/personas.ts references REAL seeded rows (no id drift).
export interface SeedIds {
  fundraisers: Record<string, string>; // slug → uuid
  profiles: Record<string, string>; // handle → uuid
  communities: Record<string, string>; // slug → uuid
}

// PersonaSlug / PersonaFixture re-exported from lib/personas/types.ts for convenience.
export type { PersonaSlug, PersonaFixture };
