// CB-34 — participation signal for the Suns "create→edit" affordance.
//
// A viewer is a PARTICIPANT in a board (fundraiser OR community) when they have an
// existing relationship to it: they follow the entity (or its organizer), they have
// donated to it, or they arrived through a share link for it. Participants already have
// a sun on the board, so the create affordance becomes an EDIT affordance.
//
// This is the persona-derived half of the signal. Callers OR it with the runtime
// `following` flag (a Follow click this session) so the button flips create→edit
// immediately on click, before any persona data changes:
//
//   const isParticipant = following || personaHasParticipated(persona, target);
//
// Pure + framework-free so it is unit-testable and reusable on both pages.
import type { PersonaFixture } from '@/lib/personas/types';

export interface BoardTarget {
  /** The fundraiser this board belongs to (fundraiser page). */
  fundraiserId?: string;
  /** The community this board belongs to (community page). */
  communityId?: string;
  /**
   * Organizer / owner profile ids associated with this board. Following any of them
   * is treated as participation in the board (e.g. following the fundraiser's organizer).
   */
  organizerProfileIds?: string[];
}

/**
 * True when the persona already has a relationship to this board:
 *  - follows the fundraiser / community / its organizer profile, OR
 *  - has donated to the fundraiser, OR
 *  - arrived via a share link (utm share attribution present).
 */
export function personaHasParticipated(persona: PersonaFixture, target: BoardTarget): boolean {
  const { fundraiserId, communityId, organizerProfileIds } = target;
  const { follows, donations, utm, shares } = persona;

  // CB-77: actively shared this board (sharer role — Mike T. shares to everyone).
  if (shares && ((fundraiserId && shares.includes(fundraiserId)) || (communityId && shares.includes(communityId)))) {
    return true;
  }

  // Follows the fundraiser directly.
  if (fundraiserId && follows.fundraiserIds.includes(fundraiserId)) return true;

  // Follows the community directly.
  if (communityId && follows.communityIds.includes(communityId)) return true;

  // Follows the board's organizer/owner profile.
  if (
    organizerProfileIds &&
    organizerProfileIds.some((id) => follows.organizerProfileIds.includes(id))
  ) {
    return true;
  }

  // Has contributed (donated) to the fundraiser.
  if (fundraiserId && donations.some((d) => d.fundraiserId === fundraiserId)) return true;

  // Arrived through a share link for this board (sharer attribution). The utm signal is
  // board-scoped in practice (the share id encodes the entity), so its presence on a
  // fundraiser/community page means the viewer engaged with THIS board's share path.
  if ((fundraiserId || communityId) && utm && (utm.share_source || utm.share_user)) {
    return true;
  }

  return false;
}
