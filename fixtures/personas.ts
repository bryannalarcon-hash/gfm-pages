// The 6 demo persona fixtures (design-personas.md). architecture.md §4.2.
// follows/donations reference REAL SEED_IDS so embedding-ranked carousels + PYMK resolve cleanly.
// These are build-time fixtures (NOT DB rows) read by usePersona() in demo mode.
import type { PersonaSlug, PersonaFixture } from '@/lib/personas/types';
import { SEED_IDS } from '@/db/seed-ids';

const F = SEED_IDS.fundraisers;
const P = SEED_IDS.profiles;
const C = SEED_IDS.communities;

const WILDFIRE = F['realtime-alerts-for-wildfire-safety-r5jkk'];
const ORGANIZER = P['sarah-j']; // organizes the wildfire fundraiser

export const PERSONAS: Record<PersonaSlug, PersonaFixture> = {
  // 1. Anonymous first-timer — every L3.5 fallback path.
  anonymous: {
    slug: 'anonymous',
    name: null,
    authenticated: false,
    isProfileOwner: false,
    referrerSource: 'direct',
    follows: { fundraiserIds: [], organizerProfileIds: [], communityIds: [], counts: { profiles: 0, fundraisers: 0, communities: 0 } },
    donations: [],
    lastVisit: null,
    avatar: { bg: '#f5f5f5', fg: '#6f6f6f', initial: '' },
  },

  // 2. Close friend (Sarah K.) — maximal personalization happy path.
  close_friend: {
    slug: 'close_friend',
    name: 'Sarah K.',
    authenticated: true,
    isProfileOwner: false,
    referrerSource: 'email',
    follows: {
      fundraiserIds: [WILDFIRE, F['senior-dog-rescue-winter-shelter'], F['first-gen-college-fund-maria'], F['wildfire-evacuation-pet-supplies'], F['neighborhood-air-quality-sensors']],
      organizerProfileIds: [ORGANIZER],
      communityIds: [],
      counts: { profiles: 1, fundraisers: 5, communities: 0 },
    },
    donations: [
      { fundraiserId: WILDFIRE, amountUsd: 50, monthsAgo: 0 }, // last week
      { fundraiserId: WILDFIRE, amountUsd: 25, monthsAgo: 2 },
      { fundraiserId: F['senior-dog-rescue-winter-shelter'], amountUsd: 30, monthsAgo: 1 },
      { fundraiserId: F['first-gen-college-fund-maria'], amountUsd: 20, monthsAgo: 3 },
      { fundraiserId: F['wildfire-evacuation-pet-supplies'], amountUsd: 40, monthsAgo: 5 },
    ],
    lastVisit: { monthsAgo: 0, onThisPage: true }, // 2 days ago, on this fundraiser, before the latest update
    avatar: {
      bg: '#ffd863',
      fg: '#68570d',
      initial: 'S',
      pfpUrl: 'https://picsum.photos/seed/persona-close_friend/96/96',
    },
  },

  // 3. Extrovert (Mike T.) — broad follow graph, frequent small gifts, shares often.
  extrovert: {
    slug: 'extrovert',
    name: 'Mike T.',
    authenticated: true,
    isProfileOwner: false,
    referrerSource: 'social',
    follows: {
      fundraiserIds: [F['senior-dog-rescue-winter-shelter'], F['first-gen-college-fund-maria'], F['wildfire-evacuation-pet-supplies'], F['neighborhood-air-quality-sensors']],
      organizerProfileIds: [P['david-okafor'], P['lena-petrov'], P['james-wu'], P['aisha-rahman'], P.janahan],
      communityIds: [C['watch-duty'], C['wildfire-relief-norcal']],
      counts: { profiles: 67, fundraisers: 14, communities: 3 },
    },
    donations: [
      { fundraiserId: F['senior-dog-rescue-winter-shelter'], amountUsd: 15, monthsAgo: 1 },
      { fundraiserId: F['first-gen-college-fund-maria'], amountUsd: 20, monthsAgo: 2 },
      { fundraiserId: F['wildfire-evacuation-pet-supplies'], amountUsd: 10, monthsAgo: 4 },
      { fundraiserId: F['neighborhood-air-quality-sensors'], amountUsd: 25, monthsAgo: 6 },
    ],
    lastVisit: { monthsAgo: 0, onThisPage: false }, // 9 days ago, different fundraiser
    // CB-77: Mike shares to everyone — incl. THIS wildfire fundraiser + his other causes. This
    // gives him the sharer role on the board (flat-colour sun controls per CB-51) even though he
    // hasn't followed or donated to it directly.
    shares: [WILDFIRE, F['senior-dog-rescue-winter-shelter'], F['first-gen-college-fund-maria'], F['wildfire-evacuation-pet-supplies']],
    avatar: {
      bg: '#ccf88e',
      fg: '#274a34',
      initial: 'M',
      pfpUrl: 'https://picsum.photos/seed/persona-extrovert/96/96',
      trophy: true, // top sharer: 67 profiles followed, frequent gifts, social referrer
    },
  },

  // 4. Shared by extrovert — anonymous BUT arrived via Mike T.'s WhatsApp share link.
  shared_by_extro: {
    slug: 'shared_by_extro',
    name: null,
    authenticated: false,
    isProfileOwner: false,
    referrerSource: 'social',
    follows: { fundraiserIds: [], organizerProfileIds: [], communityIds: [], counts: { profiles: 0, fundraisers: 0, communities: 0 } },
    donations: [],
    lastVisit: null,
    utm: { share_source: 'whatsapp', share_user: 'mike_t' },
    avatar: { bg: '#f5f5f5', fg: '#6f6f6f', initial: '?' },
  },

  // 5. Returning lapsed (Priya M.) — donated once long ago; stale-but-real returner.
  returning_lapsed: {
    slug: 'returning_lapsed',
    name: 'Priya M.',
    authenticated: true,
    isProfileOwner: false,
    referrerSource: 'profile_digest_email',
    follows: {
      fundraiserIds: [],
      organizerProfileIds: [ORGANIZER],
      communityIds: [],
      counts: { profiles: 1, fundraisers: 0, communities: 0 },
    },
    donations: [{ fundraiserId: WILDFIRE, amountUsd: 25, monthsAgo: 14 }],
    lastVisit: { monthsAgo: 10, onThisPage: true }, // before the goal crossed 50%
    avatar: {
      bg: '#e9fcce',
      fg: '#274a34',
      initial: 'P',
      pfpUrl: 'https://picsum.photos/seed/persona-returning_lapsed/96/96',
    },
  },

  // 6. Profile owner (Janahan S.) — owner-only affordances on /u/janahan.
  profile_owner: {
    slug: 'profile_owner',
    name: 'Janahan S.',
    authenticated: true,
    isProfileOwner: true,
    referrerSource: 'direct',
    follows: {
      fundraiserIds: [WILDFIRE, F['senior-dog-rescue-winter-shelter'], F['first-gen-college-fund-maria'], F['wildfire-evacuation-pet-supplies'], F['neighborhood-air-quality-sensors']],
      organizerProfileIds: [P['sarah-k'], P['mike-t'], P['david-okafor'], P['lena-petrov']],
      communityIds: [],
      counts: { profiles: 38, fundraisers: 5, communities: 0 },
    },
    donations: [
      { fundraiserId: F['senior-dog-rescue-winter-shelter'], amountUsd: 35, monthsAgo: 1 },
      { fundraiserId: F['first-gen-college-fund-maria'], amountUsd: 50, monthsAgo: 2 },
      { fundraiserId: F['wildfire-evacuation-pet-supplies'], amountUsd: 20, monthsAgo: 3 },
      { fundraiserId: F['neighborhood-air-quality-sensors'], amountUsd: 40, monthsAgo: 4 },
      { fundraiserId: F['senior-dog-rescue-winter-shelter'], amountUsd: 25, monthsAgo: 6 },
      { fundraiserId: F['first-gen-college-fund-maria'], amountUsd: 30, monthsAgo: 9 },
    ],
    lastVisit: { monthsAgo: 0, onThisPage: true }, // yesterday
    avatar: {
      bg: '#232323',
      fg: '#ffffff',
      initial: 'J',
      pfpUrl: 'https://picsum.photos/seed/persona-profile_owner/96/96',
      trophy: true, // profile owner: consistent multi-fundraiser donor, 6 donations
    },
  },
};

export const PERSONA_ORDER: PersonaSlug[] = [
  'anonymous',
  'close_friend',
  'extrovert',
  'shared_by_extro',
  'returning_lapsed',
  'profile_owner',
];

// One-line menu descriptions (design-overlay.md menu anatomy). Kept beside the fixtures,
// out of the typed PersonaFixture contract. Names/labels only — no internal slug rendered.
export const PERSONA_LABELS: Record<PersonaSlug, { name: string; description: string }> = {
  anonymous: { name: 'Anonymous', description: 'First-time visitor' },
  close_friend: { name: 'Sarah K.', description: 'Close friend · repeat donor' },
  extrovert: { name: 'Mike T.', description: 'Shares to everyone' },
  shared_by_extro: { name: 'Guest via share', description: 'Arrived from a friend’s link' },
  returning_lapsed: { name: 'Priya M.', description: 'Returning after a while' },
  profile_owner: { name: 'Janahan S.', description: 'Viewing their own profile' },
};
