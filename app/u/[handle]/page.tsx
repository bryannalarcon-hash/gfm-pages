/**
 * /u/[handle] — Profile page (SERVER component).
 *
 * Fetches all data SSR'd: profile, fundraisers, PYMK, activity, share copy,
 * board seed, supporter count. Assembles PageContext and passes to
 * the ProfilePage client component.
 *
 * notFound() if the handle doesn't resolve to a profile row.
 * fundedPct approximated as 0.5 for the board seed (per contract).
 */

// Profile-specific CSS (section-level layout + component CSS from mock's inline <style>).
// Imported from the app route directory so Next.js correctly bundles it into page.css.
import './profile.css';

import { notFound } from 'next/navigation';
import {
  getProfileByHandle,
  getProfileFundraisers,
  getPymk,
  getProfileActivity,
  getShareCopy,
  getBoardSeed,
  getSupporterCount,
} from '@/lib/db/queries';
import type { PageContext, ReferrerSource } from '@/lib/types';
import { ProfilePage } from '@/components/profile/ProfilePage';

interface ProfilePageParams {
  params: { handle: string };
  searchParams?: { referrer_source?: string };
}

export default async function ProfileRoute({
  params,
  searchParams,
}: ProfilePageParams) {
  const { handle } = params;
  const sp = searchParams;

  // Resolve profile
  const profile = await getProfileByHandle(handle);
  if (!profile) notFound();

  // Parallel data fetches
  const [
    fundraisers,
    pymkAll,
    activity,
    copyByChannel,
    boardSeed,
    supporterCount,
  ] = await Promise.all([
    getProfileFundraisers(profile.id),
    getPymk(profile.id, 20),
    getProfileActivity(profile.id),
    getShareCopy('profile', profile.id),
    getBoardSeed('profile', profile.id, 0.5),
    getSupporterCount('profile', profile.id),
  ]);

  // PYMK: pass both graph-ranked (same list from getPymk which already does
  // embedding-based proximity) and default fallback.
  // The PersonalizedSlot resolver picks graph vs. default based on persona.
  const pymkByGraph = pymkAll;
  const pymkDefault = pymkAll.slice().reverse(); // trivial default ordering inversion

  // Build PageContext
  const referrerSource: ReferrerSource =
    (sp?.referrer_source as ReferrerSource) ?? 'direct';

  const page: PageContext = {
    page: 'profile',
    profileId: profile.id,
    referrerSource,
    pageState: {},
  };

  return (
    <ProfilePage
      profile={profile}
      fundraisers={fundraisers}
      pymkByGraph={pymkByGraph}
      pymkDefault={pymkDefault}
      activity={activity}
      copyByChannel={copyByChannel}
      boardSeed={boardSeed}
      supporterCount={supporterCount}
      page={page}
    />
  );
}
