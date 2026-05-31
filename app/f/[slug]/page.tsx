/**
 * /f/[slug] — Fundraiser page route. SERVER component.
 *
 * SSR responsibility:
 * - Fetches all data (fundraiser row, updates, donations, similar/trending, share copy, board seed)
 * - Resolves referrerSource from ?ref param (maps to ReferrerSource enum)
 * - Builds PageContext + SlotCandidates (persona-independent pools)
 * - Passes everything to the client FundraiserPage composition component
 *
 * D12 ↔ P9 monthly coupling:
 * - If ?ref=profile_recurring_nudge → PageContext.referrerSource = 'profile_recurring_nudge'
 * - FundraiserPage reads referrerSource from page prop → passes openInMonthly=true to DonationCard
 * - DonationCard opens in monthly frequency with D12 nudge hidden
 * - All resolved SSR, no client-side flash
 *
 * Zero CLS:
 * - Hero image via next/image priority (D7)
 * - raised/goal numbers SSR'd into FundraiserHero and ProgressBar
 * - BoardSeed SSR'd (SunsLayer)
 */

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getFundraiserBySlug,
  getFundraiserUpdates,
  getRecentDonations,
  getSimilarFundraisers,
  getTrendingFundraisers,
  getShareCopy,
  getBoardSeed,
  getSupporterCount,
  getShareReach,
} from '@/lib/db/queries';
import type { PageContext, ReferrerSource } from '@/lib/types';
import type { SlotCandidates } from '@/lib/personalization/slots';
import { FundraiserPage } from '@/components/fundraiser/FundraiserPage';

// Canonical map from ?ref query param values → ReferrerSource enum values
const REF_TO_SOURCE: Record<string, ReferrerSource> = {
  social:                   'social',
  email:                    'email',
  direct:                   'direct',
  search:                   'search',
  profile:                  'profile',
  community:                'community',
  community_leaderboard:    'community_leaderboard',
  community_share:          'community_share',
  fundraiser:               'fundraiser',
  profile_share:            'profile_share',
  profile_digest_email:     'profile_digest_email',
  profile_recurring_nudge:  'profile_recurring_nudge',
};

function mapReferrer(ref: string | string[] | undefined): ReferrerSource {
  if (!ref) return 'direct';
  const val = Array.isArray(ref) ? ref[0] : ref;
  return REF_TO_SOURCE[val] ?? 'direct';
}

function deriveMomentum(
  raisedUsd: number,
  goalUsd: number,
  donationCount: number,
): 'high' | 'slow' | 'near_goal' {
  const pct = goalUsd > 0 ? raisedUsd / goalUsd : 0;
  if (pct >= 0.8) return 'near_goal';
  if (donationCount > 50) return 'high';
  return 'slow';
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const fundraiser = await getFundraiserBySlug(slug);
  if (!fundraiser) return { title: 'Not found' };
  return {
    title: `${fundraiser.title} | GoFundMe`,
    description: fundraiser.story?.slice(0, 160) ?? `Support ${fundraiser.organizer_name} on GoFundMe.`,
    openGraph: {
      title: fundraiser.title,
      images: fundraiser.hero_image_url ? [fundraiser.hero_image_url] : [],
    },
  };
}

export default async function FundraiserSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const fundraiser = await getFundraiserBySlug(slug);
  if (!fundraiser) notFound();

  const referrerSource = mapReferrer(sp['ref']);
  const raisedPct = fundraiser.goal_usd > 0 ? fundraiser.raised_usd / fundraiser.goal_usd : 0;
  const momentum = deriveMomentum(fundraiser.raised_usd, fundraiser.goal_usd, fundraiser.donation_count);

  // CB-05: derive sharer token from utm_share_user (arrives via share link).
  // Passed to getBoardSeed so the sharer's sun gets isSharer=true → "X shared this" ring.
  const sharerToken = typeof sp['utm_share_user'] === 'string' ? sp['utm_share_user'] : undefined;

  // Fetch all data in parallel
  // CB-04: sharerReach = donations attributed to the viewer's sharer token on this fundraiser.
  // 'viewer' is the placeholder token for the current (non-personalized SSR) viewer.
  // Persona-specific reach is resolved client-side via the persona's sharer_token.
  const [updates, donations, similarByEmbedding, trending, copyByChannel, boardSeed, supporterCount, sharerReach] =
    await Promise.all([
      getFundraiserUpdates(fundraiser.id),
      getRecentDonations(fundraiser.id, 12),
      getSimilarFundraisers(fundraiser.id, 6),
      getTrendingFundraisers(fundraiser.category, 6, fundraiser.id),
      getShareCopy('fundraiser', fundraiser.id),
      getBoardSeed('fundraiser', fundraiser.id, raisedPct, undefined, sharerToken),
      getSupporterCount('fundraiser', fundraiser.id),
      // CB-04: viewer's share reach derived from seed attribution table.
      // For the Priya persona (token 'priya_m') this resolves to 0 (no attributed donations in seed).
      getShareReach(sharerToken ?? 'viewer', fundraiser.id),
    ]);

  // Build PageContext (persona-independent, SSR'd)
  const page: PageContext = {
    page: 'fundraiser',
    fundraiserId: fundraiser.id,
    referrerSource,
    pageState: {
      raisedPct,
      momentum,
    },
  };

  // Build SlotCandidates (persona-independent; resolveSlot selects per persona client-side)
  const latestUpdate = updates[0] ?? null;
  const candidates: SlotCandidates = {
    similarByEmbedding,
    trending,
    organizerName: fundraiser.organizer_name,
    latestUpdateSummary: latestUpdate?.summary ?? undefined,
    latestUpdateHref: latestUpdate ? `#updates` : undefined,
  };

  return (
    <FundraiserPage
      fundraiser={fundraiser}
      updates={updates}
      donations={donations}
      boardSeed={boardSeed}
      copyByChannel={copyByChannel}
      page={page}
      candidates={candidates}
      supporterCount={supporterCount}
      sharerReach={sharerReach}
    />
  );
}
