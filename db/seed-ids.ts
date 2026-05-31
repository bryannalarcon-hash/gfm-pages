// SEED_IDS — the single shared registry of seeded entity ids (architecture.md §6).
// Node-free leaf module: db/seed.ts re-exports this, and fixtures/personas.ts imports it,
// so persona follows/donations reference REAL seeded rows with zero id drift, while the
// client bundle never pulls in node-only seed code.
//
// Fixed UUIDs (valid v4 shape) so ids are stable across reseeds.
import type { SeedIds } from '@/lib/types';

export const SEED_IDS: SeedIds = {
  fundraisers: {
    // The assignment's example fundraiser — the primary /f/[slug].
    'realtime-alerts-for-wildfire-safety-r5jkk': '00000000-0000-4000-8000-0000000000f1',
    // Near-goal ≥80% entity (exercises the D2 goal-gradient state).
    'rebuild-the-lincoln-hs-band-room': '00000000-0000-4000-8000-0000000000f2',
    // Similar-fundraiser carousel / community members.
    'senior-dog-rescue-winter-shelter': '00000000-0000-4000-8000-0000000000f3',
    'first-gen-college-fund-maria': '00000000-0000-4000-8000-0000000000f4',
    'wildfire-evacuation-pet-supplies': '00000000-0000-4000-8000-0000000000f5',
    'neighborhood-air-quality-sensors': '00000000-0000-4000-8000-0000000000f6',
  },
  profiles: {
    // The assignment's example profile + profile_owner persona (Janahan S.).
    janahan: '00000000-0000-4000-8000-0000000000a1',
    // Organizer of the wildfire fundraiser (D8 banner: "Sarah J. posted…").
    'sarah-j': '00000000-0000-4000-8000-0000000000a2',
    // Persona-backed profiles.
    'sarah-k': '00000000-0000-4000-8000-0000000000a3', // close_friend
    'mike-t': '00000000-0000-4000-8000-0000000000a4', // extrovert
    'priya-m': '00000000-0000-4000-8000-0000000000a5', // returning_lapsed
    // PYMK / donor fill profiles.
    'david-okafor': '00000000-0000-4000-8000-0000000000a6',
    'lena-petrov': '00000000-0000-4000-8000-0000000000a7',
    'james-wu': '00000000-0000-4000-8000-0000000000a8',
    'aisha-rahman': '00000000-0000-4000-8000-0000000000a9',
  },
  communities: {
    // The assignment's example community.
    'watch-duty': '00000000-0000-4000-8000-0000000000c1',
    'wildfire-relief-norcal': '00000000-0000-4000-8000-0000000000c2',
  },
};
