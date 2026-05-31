// app/communities/[slug]/page.tsx — SERVER component.
// C7: SSR hero + stats zero-CLS; deferred feed hydration client-side.
// Fetches all server-side data; notFound() on missing community; passes PageContext to client shell.
// community.css: mock inline <style> classes (cover, hero__*, stats, chead, tabpanel, strip, etc.)
import './community.css';
import { notFound } from 'next/navigation';
import {
  getCommunityBySlug,
  getCommunityActivity,
  getShareCopy,
  getBoardSeed,
  getSupporterCount,
  getTrendingFundraisers,
  getPymk,
} from '@/lib/db/queries';
import type { PageContext } from '@/lib/types';
import { headers } from 'next/headers';
import { CommunityPage } from '@/components/community/CommunityPage';

interface Props {
  params: { slug: string };
  searchParams?: Record<string, string | string[] | undefined>;
}

export default async function CommunityRoute({ params, searchParams }: Props) {
  const community = await getCommunityBySlug(params.slug);
  if (!community) notFound();

  // Derive fundedPct: if no goal context use 0.6 as sensible default
  const raisedUsd = community.raised_usd ?? 0;
  const fundedPct = raisedUsd > 0 ? Math.min(1, raisedUsd / Math.max(raisedUsd * 1.6, 1)) : 0.6;

  // CB-05: derive sharer token from utm_share_user (arrives via share link).
  // Passed to getBoardSeed so the sharer's sun gets isSharer=true → "X shared this" ring.
  const sp = searchParams ?? {};
  const sharerToken = typeof sp['utm_share_user'] === 'string' ? sp['utm_share_user'] : undefined;

  // Parallel server fetches — C7 SSR
  const [activity, shareCopy, boardSeed, supporterCount, trending] = await Promise.all([
    getCommunityActivity(community.id),
    getShareCopy('community', community.id),
    getBoardSeed('community', community.id, fundedPct, undefined, sharerToken),
    getSupporterCount('community', community.id),
    getTrendingFundraisers(null, 6),
  ]);

  // PYMK: fetch over a representative community member (first activity actor heuristic)
  // For cold-start / anonymous: pass empty array; PymkPanel has graceful placeholder
  let pymkCards: Awaited<ReturnType<typeof getPymk>> = [];
  try {
    // Use a stable seed profile id — in prod this is the authenticated viewer's id
    // For the demo we derive a pseudo-id from the community id to get consistent results
    pymkCards = await getPymk(community.id.slice(0, 36), 5);
  } catch {
    // Graceful degradation: PYMK is non-critical
    pymkCards = [];
  }

  // Determine page state for momentum prompt (C4)
  // Active momentum: >10 donors in last 24h (proxy: activity items with verb=donated within 1d)
  const oneDayAgo = Date.now() - 86400000;
  const recentDonors = activity.filter(
    (a) => a.verb === 'donated' && new Date(a.created_at).getTime() > oneDayAgo,
  );
  const isActiveMomentum = recentDonors.length >= 10;

  // Near-goal leader: check top trending if any are within 10% of goal
  const nearGoalLeader = trending.find(
    (t) => t.goalUsd > 0 && (t.goalUsd - t.raisedUsd) / t.goalUsd <= 0.1,
  ) ?? null;

  const momentum: PageContext['pageState']['momentum'] = isActiveMomentum
    ? 'high'
    : nearGoalLeader
    ? 'near_goal'
    : 'slow';

  // Infer referrer_source from Referer header
  const hdrs = headers();
  const referer = hdrs.get('referer') ?? '';
  const referrerSource: PageContext['referrerSource'] = referer.includes('community_share')
    ? 'community_share'
    : referer.includes('/communities')
    ? 'community'
    : 'direct';

  const pageCtx: PageContext = {
    page: 'community',
    communityId: community.id,
    referrerSource,
    pageState: { momentum },
  };

  return (
    <CommunityPage
      community={community}
      activity={activity}
      shareCopy={shareCopy}
      boardSeed={boardSeed}
      supporterCount={supporterCount}
      trending={trending}
      pymkCards={pymkCards}
      nearGoalLeader={nearGoalLeader}
      recentDonorCount={recentDonors.length}
      pageCtx={pageCtx}
    />
  );
}
