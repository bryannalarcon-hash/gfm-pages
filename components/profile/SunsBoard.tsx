'use client';
/**
 * SunsBoard — "Suns across causes" markwall section inside the profile content column.
 *
 * Matches mock section class="carousel" containing .markwall with .markwall__item rows.
 * Each item: a .mark (sized/coloured per action) + .markwall__cap label.
 *
 * Size = how much (never a dollar figure). Colour = cause shared. Grey = followed only.
 *
 * Guardrails:
 *  - NO dollar figures
 *  - Size tiers only: xs/sm/md/lg/xl
 *  - Gradient from engine, no free hex
 *  - Uses existing CSS mark classes from app/marks.css
 */

import React from 'react';
import type { BoardSeed, SunMark, SunGradient } from '@/lib/marks/types';

export interface SunsBoardProps {
  seed: BoardSeed;
  /** Name shown in the heading (e.g. the profile's first name) */
  organizerFirstName: string;
}

// Map gradient IDs → CSS modifier classes (matches marks.css curated palette)
const GRADIENT_CLASS: Record<SunGradient, string> = {
  gold:   'mark--gold',
  teal:   'mark--teal',
  violet: 'mark--violet',
  brand:  'mark--lime',   // brand gradient → lime class in marks.css
  grey:   '',             // grey = no modifier, follow-only default
};

// Size tiers: sizeScore ranges → CSS modifier class
// sizeScore ≤ 30 → xs, ≤ 45 → sm, ≤ 65 → md, ≤ 85 → lg, > 85 → xl
function sizeClass(sizeScore: number): string {
  if (sizeScore <= 30) return 'mark--xs';
  if (sizeScore <= 45) return 'mark--sm';
  if (sizeScore <= 65) return 'mark--md';
  if (sizeScore <= 85) return 'mark--lg';
  return 'mark--xl';
}

// Label for a mark (display name or "following" if follow-only grey)
function capLabel(mark: SunMark): string {
  if (mark.displayName) return mark.displayName;
  if (mark.gradient === 'grey') return 'following';
  return 'mark';
}

// Decorative padding marks to fill the wall when real data is sparse
// These supplement real marks so the board never looks empty (guardrail: never empty)
const PAD_MARKS: Array<{ gradient: string; sz: string; label: string }> = [
  { gradient: 'mark--gold',   sz: 'mark--xl',  label: 'Watch Duty' },
  { gradient: 'mark--forest', sz: 'mark--lg',  label: 'Saving Eliza' },
  { gradient: 'mark--lime',   sz: 'mark--lg',  label: 'Keep Sandy' },
  { gradient: 'mark--teal',   sz: 'mark--md',  label: 'Andy Ritchie' },
  { gradient: 'mark--violet', sz: 'mark--md',  label: 'Reef Project' },
  { gradient: 'mark--lime',   sz: 'mark--sm',  label: 'Food Bank' },
  { gradient: 'mark--gold',   sz: 'mark--sm',  label: 'Library' },
  { gradient: '',             sz: 'mark--sm',  label: 'following' },
  { gradient: 'mark--teal',   sz: 'mark--md',  label: 'Clean Air' },
  { gradient: '',             sz: 'mark--xs',  label: 'following' },
];

export function SunsBoard({ seed, organizerFirstName }: SunsBoardProps) {
  const { marks } = seed;

  // Show at most 12 marks, pad with decorative marks to always show at least 8
  const realMarks = marks.slice(0, 10);
  const padNeeded = Math.max(0, 8 - realMarks.length);
  const padMarks = PAD_MARKS.slice(0, padNeeded);

  return (
    <section className="carousel" data-screen-label="Marks collection">
      <h2 className="section-h" style={{ marginBottom: 'var(--hrt-size-spacing-1)' }}>
        Suns across causes
      </h2>
      <p
        className="muted"
        style={{ fontSize: 'var(--hrt-size-font-body-sm)', margin: '0 0 var(--hrt-size-spacing-3)' }}
      >
        Every cause {organizerFirstName} has shown up for lights a sun here — a contribution
        identity that grows over time.
      </p>

      <div
        className="markwall"
        data-overlay-tier="2"
        data-overlay-delta="v4.1"
        data-overlay-events="Section Viewed"
        data-overlay-metric="Repeat Visits — contribution identity"
        data-overlay-why="The profile is your wall of marks across every cause — a personal collection that grows as you act, giving you a reason to return and watch it fill."
      >
        {/* Real marks from DB */}
        {realMarks.map((mark) => {
          const gradClass = GRADIENT_CLASS[mark.gradient] ?? '';
          const sz = sizeClass(mark.sizeScore);
          return (
            <div key={mark.id} className="markwall__item">
              <span className={['mark', sz, gradClass].filter(Boolean).join(' ')} aria-hidden="true" />
              <span className="markwall__cap">{capLabel(mark)}</span>
            </div>
          );
        })}
        {/* Decorative padding marks (no dollar figures; just names/labels) */}
        {padMarks.map((pad, i) => (
          <div key={`pad-${i}`} className="markwall__item">
            <span className={['mark', pad.sz, pad.gradient].filter(Boolean).join(' ')} aria-hidden="true" />
            <span className="markwall__cap">{pad.label}</span>
          </div>
        ))}
      </div>

      <p
        className="muted"
        style={{ fontSize: 'var(--hrt-size-font-body-xs)', marginTop: 'var(--hrt-size-spacing-2)' }}
      >
        Size = how much they gave (never a dollar figure)&nbsp;&middot;&nbsp;colour = causes they
        shared&nbsp;&middot;&nbsp;grey = followed
      </p>
    </section>
  );
}
