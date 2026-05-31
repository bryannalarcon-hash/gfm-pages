// L3.5 personalization slots. architecture.md §4.3.
//
// resolveSlot is PURE + SYNCHRONOUS: it reads the current user (PersonaFixture), the page
// context, and page-fetched candidate POOLS, and decides what content each named slot shows.
// Structure is fixed for all personas — only the resolved content adapts. A null `content`
// is the anonymous/first-time state; the slot COMPONENT still renders a layout-preserving
// placeholder (it NEVER unmounts its region — L3.5 rule).
//
// SEAM REFINEMENT (vs architecture §4.3 as originally drafted): SlotContext gains a
// `candidates` bag. resolveSlot cannot query the DB (it's sync/pure), so pages fetch the
// candidate pools server-side (embedding neighbours, trending, graph PYMK, activity rows,
// the latest update summary) and inject them here. This keeps resolveSlot pure + unit-testable
// while letting real data flow in. Documented in architecture.md §4.3.
import type {
  PersonaFixture,
  PageContext,
  SimilarCard,
  ActivityRow,
  PymkCard,
} from '@/lib/types';

export type SlotName =
  | 'returning_banner' // D8 + D13 / C2 / profile P2 header
  | 'smart_presets' // D10
  | 'similar_carousel' // D3/D11 / C5
  | 'what_you_missed' // P2 feed
  | 'pymk_panel' // P4 / C3
  | 'recurring_nudge' // P9
  | 'share_rate'; // D9 share studio framing (sharer vs sharee vs default)

// Page-fetched candidate pools injected into the resolver (see seam note above).
export interface SlotCandidates {
  similarByEmbedding?: SimilarCard[]; // D3/D11 embedding neighbours
  trending?: SimilarCard[]; // cold-start fallback
  followedCategories?: SimilarCard[]; // C5 "from causes you follow"
  pymkByGraph?: PymkCard[]; // P4/C3 graph-ranked
  pymkDefault?: PymkCard[]; // server default ordering
  activity?: ActivityRow[]; // P2 "what you missed" candidate rows (since last visit)
  organizerName?: string; // banner / recurring nudge
  latestUpdateSummary?: string; // D13 1-line summary for the returning banner
  latestUpdateHref?: string;
  newActivityCount?: number; // C2 / P2 delta since last visit
}

export interface SlotContext {
  user: PersonaFixture;
  page: PageContext;
  isOwnerView: boolean; // user.isProfileOwner && this is the user's own profile
  candidates?: SlotCandidates;
}

export type ShareRateMode = 'sharer' | 'sharee' | 'default';

export type SlotData =
  | { name: 'returning_banner'; content: { firstName: string; summaryLine: string; href: string } | null }
  | { name: 'smart_presets'; content: { presets: [number, number, number]; selectedIndex: 0 | 1 | 2 } }
  | { name: 'similar_carousel'; content: { cards: SimilarCard[]; source: 'embedding' | 'trending' | 'followed_categories' } }
  | { name: 'what_you_missed'; content: { newCount: number; rows: ActivityRow[] } | null }
  | { name: 'pymk_panel'; content: { cards: PymkCard[]; ranked: 'graph' | 'default' } }
  | { name: 'recurring_nudge'; content: { organizerName: string; donationCount: number } | null }
  | { name: 'share_rate'; content: { mode: ShareRateMode; referrerName: string | undefined } };

const COHORT_PRESETS: [number, number, number] = [10, 25, 50];

function firstNameOf(user: PersonaFixture): string {
  return user.name ? user.name.split(' ')[0] : '';
}

function niceRound(n: number): number {
  if (n <= 50) return Math.round(n / 5) * 5;
  if (n <= 200) return Math.round(n / 25) * 25;
  return Math.round(n / 50) * 50;
}

// Donations this user has made to the entity currently in view (fundraiser page).
function donationsToThisFundraiser(ctx: SlotContext) {
  const fid = ctx.page.fundraiserId;
  if (!fid) return [] as PersonaFixture['donations'];
  return ctx.user.donations.filter((d) => d.fundraiserId === fid);
}

function followsThisProfile(ctx: SlotContext): boolean {
  const pid = ctx.page.profileId;
  return !!pid && ctx.user.follows.organizerProfileIds.includes(pid);
}

// CB-83: Static per-persona community ribbon copy.
// Keyed by slug; each string is history-aware and distinct. No slug leaks into rendered text.
// Anonymous path is handled by the outer gate (unauthenticated → null).
function communityUpdatesPhrase(newCount: number, sinceLabel: string): string {
  if (newCount <= 0) return "";
  const noun = newCount === 1 ? "update" : "updates";
  return `${newCount} new ${noun} since ${sinceLabel}.`;
}

const COMMUNITY_RIBBON: Partial<Record<string, (firstName: string, newCount: number) => string>> = {
  // Sarah K. — recent donor to the cause, closely tied, just visited fundraiser page 2 days ago.
  close_friend: (_firstName, newCount) => {
    const updates = newCount > 0
      ? communityUpdatesPhrase(newCount, "you last checked in")
      : "New activity from people you know.";
    return `${updates} Your recent support is showing up here.`;
  },
  // Mike T. — follows Watch Duty, broad engagement, last visited 9 days ago — large activity delta.
  extrovert: (_firstName, newCount) =>
    newCount > 5
      ? `${newCount} new posts while you were away — the community has been busy.`
      : "Catch up on new activity from people you follow here.",
  // Priya M. — donated once 14 months ago, no community history; warm re-engagement.
  returning_lapsed: (firstName) =>
    `It has been a while, ${firstName}. A lot has happened since your early contribution — here is what the community has been up to.`,
  // Janahan S. — active contributor across multiple fundraisers, visited yesterday.
  profile_owner: (firstName, newCount) => {
    const updates = newCount > 0
      ? communityUpdatesPhrase(newCount, "yesterday")
      : "All caught up.";
    return `${updates} Thanks for staying involved, ${firstName}.`;
  },
};

// Community page: "Since your last visit" ribbon (C2 / CB-83).
// Fires for any authenticated user with a name on the community page.
// Copy is drawn from the static COMMUNITY_RIBBON matrix; falls back to a sensible default
// that is still distinct from the generic fundraiser fallback.
function resolveCommunityReturningBanner(ctx: SlotContext): Extract<SlotData, { name: "returning_banner" }> {
  const { user, candidates } = ctx;
  const firstName = firstNameOf(user);
  if (!user.authenticated || !firstName) {
    return { name: "returning_banner", content: null };
  }
  const newCount = candidates?.newActivityCount ?? 0;
  const copyFn = COMMUNITY_RIBBON[user.slug];
  const summaryLine = copyFn
    ? copyFn(firstName, newCount)
    : newCount > 0
      ? `${newCount} new update${newCount === 1 ? "" : "s"} since your last visit.`
      : "Catch up on the latest from this community.";
  return {
    name: "returning_banner",
    content: { firstName, summaryLine, href: "#activity" },
  };
}

function resolveReturningBanner(ctx: SlotContext): Extract<SlotData, { name: "returning_banner" }> {
  const { user, page, candidates } = ctx;

  // CB-83: community page gets its own distinct per-persona copy path.
  if (page.page === "community") {
    return resolveCommunityReturningBanner(ctx);
  }

  const firstName = firstNameOf(user);
  // Banner fires for an authenticated returner who has been on THIS page before (or donated here).
  const priorHere = donationsToThisFundraiser(ctx).length > 0;
  const beenHere = !!user.lastVisit?.onThisPage;
  const lapsedLong = (user.lastVisit?.monthsAgo ?? 0) >= 6;

  if (!user.authenticated || !firstName || !(priorHere || beenHere)) {
    return { name: "returning_banner", content: null }; // collapsed placeholder (sanctioned)
  }

  let summaryLine: string;
  if (lapsedLong && typeof page.pageState.raisedPct === "number") {
    // raisedPct is a 0–1 ratio (e.g. 0.78); render as a whole percent. Guard a value
    // already expressed 0–100 so we never show "1%" for a 78%-funded campaign (CB-60).
    const raw = page.pageState.raisedPct;
    const pct = Math.min(100, Math.round(raw <= 1 ? raw * 100 : raw));
    summaryLine = `This fundraiser is now ${pct}% of the way there. Your support could push it further.`;
  } else if (candidates?.latestUpdateSummary) {
    const who = candidates.organizerName ? `${candidates.organizerName} posted: ` : "";
    summaryLine = `${who}${candidates.latestUpdateSummary}`;
  } else {
    summaryLine = "Catch up on what's happened since your last visit.";
  }

  return {
    name: "returning_banner",
    content: { firstName, summaryLine, href: candidates?.latestUpdateHref ?? "#updates" },
  };
}

function resolveSmartPresets(ctx: SlotContext): Extract<SlotData, { name: 'smart_presets' }> {
  const here = donationsToThisFundraiser(ctx);
  if (here.length > 0) {
    // Personalized around the user's proven level on this fundraiser (D10).
    const last = here.sort((a, b) => a.monthsAgo - b.monthsAgo)[0].amountUsd;
    const presets: [number, number, number] = [niceRound(last), niceRound(last * 2), niceRound(last * 5)];
    return { name: 'smart_presets', content: { presets, selectedIndex: 1 } };
  }
  // Cohort default; default-select a mid tier (anchoring research).
  return { name: 'smart_presets', content: { presets: COHORT_PRESETS, selectedIndex: 1 } };
}

function resolveSimilarCarousel(ctx: SlotContext): Extract<SlotData, { name: 'similar_carousel' }> {
  const { user, page, candidates } = ctx;
  // C5 "from causes you follow" branch on the community page when the user follows causes.
  if (page.page === 'community' && user.follows.counts.communities > 0 && candidates?.followedCategories?.length) {
    return { name: 'similar_carousel', content: { cards: candidates.followedCategories, source: 'followed_categories' } };
  }
  // Embedding-ranked when the user has donation signal and neighbours exist (D3/D11).
  const hasSignal = user.donations.length > 0;
  if (hasSignal && candidates?.similarByEmbedding?.length) {
    return { name: 'similar_carousel', content: { cards: candidates.similarByEmbedding, source: 'embedding' } };
  }
  // Cold-start trending fallback — never empty/unmounted.
  return { name: 'similar_carousel', content: { cards: candidates?.trending ?? [], source: 'trending' } };
}

function resolveWhatYouMissed(ctx: SlotContext): Extract<SlotData, { name: 'what_you_missed' }> {
  const { candidates } = ctx;
  // P2 feed: only for a follower with new activity since their last visit.
  if (followsThisProfile(ctx) && ctx.user.lastVisit && candidates?.activity?.length) {
    return {
      name: 'what_you_missed',
      content: { newCount: candidates.newActivityCount ?? candidates.activity.length, rows: candidates.activity },
    };
  }
  return { name: 'what_you_missed', content: null }; // empty-state placeholder (does not unmount)
}

function resolvePymkPanel(ctx: SlotContext): Extract<SlotData, { name: 'pymk_panel' }> {
  const { user, candidates } = ctx;
  const hasGraph = user.follows.counts.profiles > 0;
  if (hasGraph && candidates?.pymkByGraph?.length) {
    return { name: 'pymk_panel', content: { cards: candidates.pymkByGraph, ranked: 'graph' } };
  }
  return { name: 'pymk_panel', content: { cards: candidates?.pymkDefault ?? [], ranked: 'default' } };
}

function resolveShareRate(ctx: SlotContext): Extract<SlotData, { name: 'share_rate' }> {
  const { user } = ctx;
  // A sharee: arrived via a share link — utm.share_user is set (highest specificity).
  if (user.utm?.share_user) {
    // Humanize the sharer handle (e.g. "mike_t" -> "Mike T.")
    const handle = user.utm.share_user;
    const referrerName = handle
      .split('_')
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
    return { name: 'share_rate', content: { mode: 'sharee', referrerName } };
  }
  // A sharer: authenticated user who arrived from a social referrer (came to share, not via share).
  // Requires referrerSource 'social' AND broad follow graph (>= 10 profiles) as proxy for
  // high social activity. This targets the extrovert persona specifically.
  if (
    user.authenticated &&
    user.referrerSource === 'social' &&
    user.follows.counts.profiles >= 10
  ) {
    return { name: 'share_rate', content: { mode: 'sharer', referrerName: undefined } };
  }
  return { name: 'share_rate', content: { mode: 'default', referrerName: undefined } };
}

function resolveRecurringNudge(ctx: SlotContext): Extract<SlotData, { name: 'recurring_nudge' }> {
  const { user, isOwnerView, candidates } = ctx;
  // P9 is profile-only; never on the owner's own profile.
  if (isOwnerView) return { name: 'recurring_nudge', content: null };
  // Threshold: 2+ donations within the last 12 months to this organizer's fundraisers.
  // (The page passes the organizer's fundraiser ids via candidates / page; here we use the
  // user's donations within 12mo as the signal and require an organizerName to render.)
  const recent = user.donations.filter((d) => d.monthsAgo <= 12);
  if (recent.length >= 2 && candidates?.organizerName) {
    return { name: 'recurring_nudge', content: { organizerName: candidates.organizerName, donationCount: recent.length } };
  }
  return { name: 'recurring_nudge', content: null };
}

const RESOLVERS = {
  returning_banner: resolveReturningBanner,
  smart_presets: resolveSmartPresets,
  similar_carousel: resolveSimilarCarousel,
  what_you_missed: resolveWhatYouMissed,
  pymk_panel: resolvePymkPanel,
  recurring_nudge: resolveRecurringNudge,
  share_rate: resolveShareRate,
} as const;

export function resolveSlot<N extends SlotName>(name: N, ctx: SlotContext): Extract<SlotData, { name: N }> {
  const fn = RESOLVERS[name] as (c: SlotContext) => Extract<SlotData, { name: N }>;
  return fn(ctx);
}

// Prop contract every slot component receives (components/slots/*).
// The component is pure: structure fixed, content from resolved SlotData. It MUST always
// render its region (placeholder when content === null); it NEVER unmounts.
import type { OverlayAttrs } from '@/lib/overlay/types';
export interface SlotComponentProps<N extends SlotName> {
  data: Extract<SlotData, { name: N }>;
  overlay: OverlayAttrs;
}
