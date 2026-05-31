// CB-88 — per-persona share-ripple stats (demo-deterministic; NO request-path compute, same
// pattern as the CB-47 share-copy matrix). Personas who are active SHARERS show a green,
// personalized "your ripple is growing" state with real counts (people their shares brought in
// + the amount those people raised). Personas omitted here (anonymous, returning-lapsed Priya,
// guest-via-share) see the neutral first-share prompt instead — they haven't shared yet.
import type { PersonaSlug } from '@/lib/personas/types';

export interface RippleStat {
  /** How many people this persona's shares brought to the fundraiser. */
  people: number;
  /** Dollars those brought-in people went on to raise (attribution approximation). */
  raisedUsd: number;
}

export const RIPPLE_STATS: Partial<Record<PersonaSlug, RippleStat>> = {
  extrovert: { people: 23, raisedUsd: 640 }, // Mike T. — shares to everyone
  close_friend: { people: 8, raisedUsd: 215 }, // Sarah K. — shares to close friends
  profile_owner: { people: 14, raisedUsd: 520 }, // Janahan S. — promotes his causes
};
