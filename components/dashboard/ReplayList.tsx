'use client';
// W9a — Replay List
// Filterable list of recent sessions. Each row: avatar, persona, duration, events, rage/error badges.
// Filters: persona, presence-of-error, has-rage-click, contains-event.

import type { ReplayListProps, SessionRow } from './types';
import { PERSONAS } from '@/fixtures/personas';
import type { PersonaSlug } from '@/lib/personas/types';

const PERSONA_LABELS: Record<string, string> = {
  anonymous: 'Anonymous',
  close_friend: 'Close friend',
  extrovert: 'Extrovert',
  shared_by_extro: 'Shared-link visitor',
  returning_lapsed: 'Returning donor',
  profile_owner: 'Profile owner',
};

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

export function ReplayList({ sessions, filters, onSelect, selectedId }: ReplayListProps) {
  // Apply filters
  const filtered = sessions.filter((s) => {
    if (filters.persona && s.persona !== filters.persona) return false;
    if (filters.hasError && s.errorCount === 0) return false;
    if (filters.hasRageClick && s.rageClickCount === 0) return false;
    if (filters.containsEvent) {
      // Simple contains-event: check lastEvent as a proxy since we have seeded rows
      if (!s.lastEvent.toLowerCase().includes(filters.containsEvent.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          flex: '1 1 auto',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          borderRadius: 8,
          border: '1px solid #e8e8e8',
          background: '#fafafa',
        }}
        role="listbox"
        aria-label="Session replay list"
      >
        {filtered.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9e9e9e', fontSize: 12 }}>
            No sessions match your filters.
          </div>
        ) : (
          filtered.map((s) => (
            <ReplayRow
              key={s.sessionId}
              session={s}
              selected={s.sessionId === selectedId}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ReplayRow({
  session: s,
  selected,
  onSelect,
}: {
  session: SessionRow;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const bg = PERSONAS[s.persona as PersonaSlug]?.avatar.bg ?? '#b7b7b6';
  const fg = PERSONAS[s.persona as PersonaSlug]?.avatar.fg ?? '#fff';
  const initial = PERSONAS[s.persona as PersonaSlug]?.avatar.initial ?? '?';

  return (
    <button
      onClick={() => onSelect(s.sessionId)}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '12px 14px',
        border: 'none',
        borderBottom: '1px solid #f0f0f0',
        background: selected ? '#fff8e6' : 'transparent',
        cursor: 'pointer',
        borderLeft: selected ? '3px solid #ffd863' : '3px solid transparent',
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => {
        if (!selected) (e.currentTarget as HTMLButtonElement).style.background = '#f5f5f5';
      }}
      onMouseLeave={(e) => {
        if (!selected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
      }}
      role="option"
      aria-selected={selected}
      aria-label={`Session ${s.sessionId}: ${PERSONA_LABELS[s.persona] ?? s.persona}, ${formatDuration(s.durationSec)}`}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Avatar */}
        <div
          aria-hidden="true"
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: bg,
            color: fg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          {initial || '?'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name + duration + events */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: '#232323' }}>
              {PERSONA_LABELS[s.persona] ?? s.persona}
            </span>
            <span style={{ fontSize: 11, color: '#9e9e9e' }}>
              {formatDuration(s.durationSec)} · {s.eventCount} events
            </span>
          </div>

          {/* Badges */}
          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            {s.rageClickCount > 0 && (
              <span
                style={{
                  fontSize: 11,
                  padding: '1px 7px',
                  borderRadius: 20,
                  background: '#fff3e0',
                  color: '#e65100',
                  fontWeight: 700,
                }}
                title={`${s.rageClickCount} rage click(s)`}
              >
                {s.rageClickCount} rage click{s.rageClickCount > 1 ? 's' : ''}
              </span>
            )}
            {s.errorCount > 0 && (
              <span
                style={{
                  fontSize: 11,
                  padding: '1px 7px',
                  borderRadius: 20,
                  background: '#ffebee',
                  color: '#c62828',
                  fontWeight: 700,
                }}
                title={`${s.errorCount} error(s)`}
              >
                {s.errorCount} error{s.errorCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Last event */}
          <div style={{ fontSize: 11, color: '#6f6f6f', marginTop: 3 }}>
            Last: {s.lastEvent}
          </div>
        </div>
      </div>
    </button>
  );
}
