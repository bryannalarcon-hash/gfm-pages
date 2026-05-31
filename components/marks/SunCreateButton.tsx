'use client';

/**
 * SunCreateButton — the single authoring affordance for a viewer's sun on a board
 * (community + fundraiser marks-intro strip).
 *
 * CB-34: the button DERIVES from the current viewer's relationship to THIS board:
 *  - PARTICIPANT (`isParticipant` true — follows this entity, donated/shared to it, OR
 *    clicked Follow this session) → "Edit my sun": enabled, opens the edit/create modal
 *    in edit mode (their sun already exists). Suns are system-placed; this modal is the
 *    ONLY authoring affordance.
 *  - NON-PARTICIPANT → the greyed-until-unlocked "Leave your sun" create state: disabled,
 *    same behaviour anonymous visitors have always seen.
 *
 * The caller computes `isParticipant = following || personaHasParticipated(persona, target)`
 * so the button reacts LIVE to BOTH a Follow click (runtime `following`) AND persona
 * switches (the persona's follow/donation/share signal).
 *
 * L3.5: this is ONE button that never unmounts — only its LABEL + enabled state change
 * when `isParticipant` flips. We never conditionally render two different buttons.
 *
 * Guardrails: no dollar figures, no internal index in rendered text, demo-gated affordance
 * stays demo-gated by virtue of the persona signal flowing from usePersona().
 */

import React from 'react';

export interface SunCreateButtonProps {
  /**
   * Whether the current viewer is a participant on this board (already has a sun).
   * Computed by the page as `following || personaHasParticipated(persona, target)`.
   */
  isParticipant: boolean;
  /** Opens the edit/create modal in edit mode. Only invoked for participants. */
  onEdit: () => void;
  /** Extra class names (the pages pass the marks-intro button class). */
  className?: string;
}

const CREATE_LABEL = 'Leave your sun — do one thing first';
const EDIT_LABEL = 'Edit my sun';

export function SunCreateButton({ isParticipant, onEdit, className }: SunCreateButtonProps) {
  // Participant → enabled edit affordance; non-participant → greyed locked create.
  const label = isParticipant ? EDIT_LABEL : CREATE_LABEL;
  const ariaLabel = isParticipant
    ? 'Edit my sun'
    : 'Leave your sun — follow, share, or give first';

  return (
    <button
      type="button"
      className={['btn', 'btn--primary', 'marks-intro__btn', className ?? '']
        .filter(Boolean)
        .join(' ')}
      data-variant="primary"
      // L3.5: same node always present; only state changes.
      disabled={!isParticipant}
      aria-disabled={!isParticipant}
      aria-label={ariaLabel}
      data-sun-mode={isParticipant ? 'edit' : 'create'}
      onClick={isParticipant ? onEdit : undefined}
    >
      {label}
    </button>
  );
}
