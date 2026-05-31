/**
 * CB-34 — the sun "create" button becomes "edit" for followers/participants and
 * reacts LIVE to both the Follow click and persona switches.
 *
 * Desired behaviour (feature-contribution-board.md + CB-34):
 *   - A PARTICIPANT (follows this entity, OR donated/shared to it, OR clicked Follow
 *     this session) sees an "Edit my sun" affordance — enabled, opens the edit modal.
 *   - A NON-PARTICIPANT sees the greyed-until-unlocked "Create"/"Leave your sun" state
 *     (disabled, the existing anonymous behaviour).
 *   - Reacts live to BOTH:
 *       (a) the persona's follow/donation/share signal (persona switch), AND
 *       (b) the runtime `following` flag (a Follow click this session).
 *   - L3.5: the button NEVER unmounts — only its label / enabled state changes.
 *
 * These tests exercise:
 *   1. personaHasParticipated() — the pure participation signal.
 *   2. <SunCreateButton> — the create↔edit affordance derived from isParticipant.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { personaHasParticipated } from '@/lib/personalization/participation';
import { SunCreateButton } from '@/components/marks/SunCreateButton';
import { PERSONAS } from '@/fixtures/personas';
import { SEED_IDS } from '@/db/seed-ids';

const WILDFIRE = SEED_IDS.fundraisers['realtime-alerts-for-wildfire-safety-r5jkk'];
const SARAH_J = SEED_IDS.profiles['sarah-j'];
const WATCH_DUTY = SEED_IDS.communities['watch-duty'];

// ── personaHasParticipated — the pure participation signal ──────────────────────
describe('personaHasParticipated — derives participation from the persona fixture', () => {
  it('anonymous first-timer has NOT participated in the wildfire fundraiser', () => {
    expect(
      personaHasParticipated(PERSONAS.anonymous, { fundraiserId: WILDFIRE }),
    ).toBe(false);
  });

  it('close_friend who follows + donated to the wildfire fundraiser HAS participated', () => {
    expect(
      personaHasParticipated(PERSONAS.close_friend, { fundraiserId: WILDFIRE }),
    ).toBe(true);
  });

  it('returning_lapsed who donated (but does not follow) the fundraiser HAS participated', () => {
    // Priya M. follows the organizer profile, not the fundraiser id, but donated to it.
    expect(
      personaHasParticipated(PERSONAS.returning_lapsed, { fundraiserId: WILDFIRE }),
    ).toBe(true);
  });

  it('shared_by_extro (arrived via a share link) counts as a participant', () => {
    expect(
      personaHasParticipated(PERSONAS.shared_by_extro, { fundraiserId: WILDFIRE }),
    ).toBe(true);
  });

  it('persona who follows the organizer profile counts as a participant on that board', () => {
    expect(
      personaHasParticipated(PERSONAS.returning_lapsed, {
        fundraiserId: WILDFIRE,
        organizerProfileIds: [SARAH_J],
      }),
    ).toBe(true);
  });

  it('extrovert who follows the community HAS participated on that community board', () => {
    expect(
      personaHasParticipated(PERSONAS.extrovert, { communityId: WATCH_DUTY }),
    ).toBe(true);
  });

  it('anonymous has NOT participated on a community board', () => {
    expect(
      personaHasParticipated(PERSONAS.anonymous, { communityId: WATCH_DUTY }),
    ).toBe(false);
  });
});

// ── SunCreateButton — create ↔ edit affordance ──────────────────────────────────
describe('SunCreateButton — create ↔ edit by participation', () => {
  it('participant persona → "Edit my sun", enabled', () => {
    render(<SunCreateButton isParticipant onEdit={vi.fn()} />);
    const btn = screen.getByRole('button');
    expect(btn.textContent).toMatch(/edit my sun/i);
    expect(btn).not.toBeDisabled();
    expect(btn.getAttribute('aria-disabled')).not.toBe('true');
  });

  it('non-participant → locked "Leave your sun" create state, disabled', () => {
    render(<SunCreateButton isParticipant={false} onEdit={vi.fn()} />);
    const btn = screen.getByRole('button');
    expect(btn.textContent).toMatch(/leave your sun|create/i);
    expect(btn.textContent).not.toMatch(/edit my sun/i);
    expect(btn).toBeDisabled();
  });

  it('clicking edit fires onEdit when a participant', () => {
    const onEdit = vi.fn();
    render(<SunCreateButton isParticipant onEdit={onEdit} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('non-participant click does NOT fire onEdit (locked)', () => {
    const onEdit = vi.fn();
    render(<SunCreateButton isParticipant={false} onEdit={onEdit} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('L3.5 — flipping isParticipant create→edit keeps the SAME button node mounted', () => {
    const { rerender, container } = render(
      <SunCreateButton isParticipant={false} onEdit={vi.fn()} />,
    );
    const before = container.querySelector('button');
    expect(before).toBeTruthy();
    expect(before!.textContent).not.toMatch(/edit my sun/i);

    // Simulate a Follow click this session: isParticipant flips true.
    rerender(<SunCreateButton isParticipant onEdit={vi.fn()} />);
    const after = container.querySelector('button');
    // Same node instance (never unmounted), label changed.
    expect(after).toBe(before);
    expect(after!.textContent).toMatch(/edit my sun/i);
    expect(after).not.toBeDisabled();
  });
});
