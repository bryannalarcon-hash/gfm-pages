// Persona model — the 6 demo personas (design-personas.md). architecture.md §4.2.
// PersonaFixture is the shared "current user" contract for slots + overlay:
// in demo mode it returns the current persona fixture; in prod a thin adapter maps the
// real user record into the SAME shape. Slots code against PersonaFixture, never branch on env.
import type { ReferrerSource } from '@/lib/types';

export type PersonaSlug =
  | 'anonymous'
  | 'close_friend'
  | 'extrovert'
  | 'shared_by_extro'
  | 'returning_lapsed'
  | 'profile_owner';

export interface PersonaFixture {
  slug: PersonaSlug;
  name: string | null; // null = anonymous
  authenticated: boolean;
  isProfileOwner: boolean; // true only for profile_owner on /u/janahan
  referrerSource: ReferrerSource;
  follows: {
    fundraiserIds: string[];
    organizerProfileIds: string[];
    communityIds: string[];
    counts: { profiles: number; fundraisers: number; communities: number };
  };
  donations: Array<{
    fundraiserId: string;
    amountUsd: number;
    monthsAgo: number;
  }>;
  lastVisit: { monthsAgo: number; onThisPage: boolean } | null;
  utm?: { share_source?: string; share_user?: string }; // shared_by_extro path
  /** CB-77: fundraiser/community ids this persona has actively SHARED. Drives the sharer role
   *  for the Suns affordance (flat-colour controls per CB-51) + participation. A prolific
   *  sharer (Mike T.) shares many; donors who don't share leave this empty. */
  shares?: string[];
  avatar: {
    bg: string;
    fg: string;
    initial: string;
    /** Deterministic placeholder PFP URL. Present only for named (non-anonymous) personas. */
    pfpUrl?: string;
    /** When true, Avatar renders a small trophy badge overlay for high-impact personas. */
    trophy?: boolean;
  }; // tokens only (gfm-design-system.md)
}
