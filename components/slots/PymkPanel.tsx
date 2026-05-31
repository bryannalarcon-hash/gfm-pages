'use client';
/**
 * PymkPanel — slot 'pymk_panel' (P4 / C3).
 *
 * Matches mock structure: .pymkrow rows with avatar--sm + .pymkrow__body + Follow btn.
 * People/causes you may know. Shows Avatar + name + optional proximityLabel.
 * Ranked 'graph' or 'default' — the raw ranking slug is NEVER shown to the viewer.
 * Always renders (default ordering when no graph signal) — NEVER unmounts.
 *
 * L3.5 rule: structure identical across personas; no internal index labels in UI.
 */

import React, { useState, useCallback } from 'react';
import { Instrumented } from '@/components/overlay/Instrumented';
import { capture } from '@/lib/analytics/capture';
import type { SlotComponentProps } from '@/lib/personalization/slots';
import type { PymkCard } from '@/lib/types';

interface PymkRowProps {
  card: PymkCard;
}

function PymkRow({ card }: PymkRowProps) {
  const [following, setFollowing] = useState(false);

  const handleFollow = useCallback(() => {
    setFollowing((v) => !v);
    capture('Follow Clicked', { follow_context: 'pymk', pymk_rank_position: card.rankPosition });
  }, [card.rankPosition]);

  return (
    <div className="pymkrow">
      <span
        className="avatar avatar--sm"
        role="img"
        aria-label={card.name}
        style={{ backgroundColor: card.avatar.bg, color: card.avatar.fg }}
      >
        {card.avatar.initial}
      </span>
      <div className="pymkrow__body">
        <div className="pymkrow__name">{card.name}</div>
        {card.proximityLabel && (
          <div className="pymkrow__prox">{card.proximityLabel}</div>
        )}
      </div>
      <button
        type="button"
        className={following ? 'btn btn--following btn--sm' : 'btn btn--secondary btn--sm'}
        onClick={handleFollow}
      >
        {following ? 'Following' : 'Follow'}
      </button>
    </div>
  );
}

export function PymkPanel({ data, overlay }: SlotComponentProps<'pymk_panel'>) {
  const { content } = data;
  const { cards } = content;

  return (
    <Instrumented attrs={overlay} regionLabel="pymk-panel">
      <section
        data-slot="pymk_panel"
        data-section-name="People You May Know"
        aria-label="People you may know"
      >
        {cards.length === 0 ? (
          <div className="muted" style={{ textAlign: 'center', padding: 'var(--hrt-size-spacing-2)' }}>
            No suggestions yet
          </div>
        ) : (
          <>
            {cards.map((card) => (
              <PymkRow key={card.id} card={card} />
            ))}
            <div style={{ marginTop: 'var(--hrt-size-spacing-2)' }}>
              <button type="button" className="btn btn--secondary btn--sm btn--block">
                See more
              </button>
            </div>
          </>
        )}
      </section>
    </Instrumented>
  );
}
