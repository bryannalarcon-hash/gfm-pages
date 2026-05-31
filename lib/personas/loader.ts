// Persona loader — demo-gated. architecture.md §4.2.
import type { PersonaSlug, PersonaFixture } from '@/lib/personas/types';
import { PERSONAS } from '@/fixtures/personas';

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

// Returns the requested fixture in demo mode; falls back to anonymous when demo is off
// (production would instead read the real authenticated user via a thin adapter to PersonaFixture).
export function getPersonaFixture(slug: PersonaSlug): PersonaFixture {
  if (!isDemoMode()) return PERSONAS.anonymous;
  return PERSONAS[slug] ?? PERSONAS.anonymous;
}

/**
 * Look up a PersonaFixture by its human-readable display name (e.g. "Sarah K.", "Mike T.").
 * Used to resolve PFP/avatar tokens for a named person appearing in feed rows (donor_name,
 * author_name, actor_name) so their profile picture cascades consistently across all surfaces.
 *
 * Returns null when:
 *  - name is null/empty (anonymous entry)
 *  - no persona fixture has a matching name
 *
 * Case-insensitive, trimmed comparison.
 */
export function getPersonaByName(name: string | null | undefined): PersonaFixture | null {
  if (!name) return null;
  const needle = name.trim().toLowerCase();
  for (const fixture of Object.values(PERSONAS)) {
    if (fixture.name && fixture.name.trim().toLowerCase() === needle) {
      return fixture;
    }
  }
  return null;
}
