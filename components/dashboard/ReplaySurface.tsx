'use client';
// W9 — Session Replay Surface wrapper
// ReplayList (left ~1/3) + ReplayPlayer (right ~2/3) when a session is selected.
// Filters: persona, hasError, hasRageClick, containsEvent (text filter on lastEvent).

import { useState } from 'react';
import { ReplayList } from './ReplayList';
import { ReplayPlayer } from './ReplayPlayer';
import type { ReplaySurfaceProps } from './types';
import { SESSION_DETAILS } from '@/fixtures/sessions';
import type { PersonaSlug } from '@/lib/personas/types';

const PERSONAS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All personas' },
  { value: 'anonymous', label: 'Anonymous' },
  { value: 'close_friend', label: 'Close friend' },
  { value: 'extrovert', label: 'Extrovert' },
  { value: 'shared_by_extro', label: 'Shared-link visitor' },
  { value: 'returning_lapsed', label: 'Returning donor' },
  { value: 'profile_owner', label: 'Profile owner' },
];

export function ReplaySurface({ sessions, selectedId: selectedIdProp, onSelect }: ReplaySurfaceProps) {
  const [personaFilter, setPersonaFilter] = useState<PersonaSlug | 'all'>('all');
  const [hasErrorFilter, setHasErrorFilter] = useState(false);
  const [hasRageClickFilter, setHasRageClickFilter] = useState(false);
  const [eventFilter, setEventFilter] = useState('');
  // Manage selection locally so row clicks work regardless of whether the parent
  // re-renders with an updated selectedId. Initialized from the prop on mount.
  const [selectedId, setSelectedId] = useState<string | null>(selectedIdProp);

  function handleSelect(id: string) {
    setSelectedId(id);
    onSelect(id);
  }

  const selectedDetail = selectedId ? SESSION_DETAILS[selectedId] ?? null : null;

  return (
    <div id="replays" style={{ width: '100%' }}>
      {/* Filter bar */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: 14,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
        aria-label="Replay filters"
      >
        {/* Persona filter */}
        <select
          value={personaFilter}
          onChange={(e) => setPersonaFilter(e.target.value as PersonaSlug | 'all')}
          style={{
            fontSize: 12,
            padding: '5px 10px',
            border: '1px solid #e8e8e8',
            borderRadius: 20,
            background: '#f5f5f5',
            cursor: 'pointer',
            color: '#232323',
          }}
          aria-label="Filter by persona"
        >
          {PERSONAS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {/* Error filter */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer', color: hasErrorFilter ? '#c62828' : '#555' }}>
          <input
            type="checkbox"
            checked={hasErrorFilter}
            onChange={(e) => setHasErrorFilter(e.target.checked)}
          />
          Has error
        </label>

        {/* Rage-click filter */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer', color: hasRageClickFilter ? '#e65100' : '#555' }}>
          <input
            type="checkbox"
            checked={hasRageClickFilter}
            onChange={(e) => setHasRageClickFilter(e.target.checked)}
          />
          Rage clicks
        </label>

        {/* Contains event text filter */}
        <input
          type="text"
          placeholder="Contains event…"
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          style={{
            fontSize: 12,
            padding: '5px 12px',
            border: '1px solid #e8e8e8',
            borderRadius: 20,
            background: '#fff',
            color: '#232323',
            width: 160,
            outline: 'none',
          }}
          aria-label="Filter by event name"
        />
      </div>

      {/* Main layout: list + player */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: selectedDetail ? '1fr 2fr' : '1fr',
          gap: 16,
          alignItems: 'start',
          minHeight: 400,
        }}
      >
        {/* List */}
        <div style={{ minHeight: 400 }}>
          <ReplayList
            sessions={sessions}
            filters={{
              persona: personaFilter === 'all' ? undefined : personaFilter,
              hasError: hasErrorFilter || undefined,
              hasRageClick: hasRageClickFilter || undefined,
              containsEvent: eventFilter || undefined,
            }}
            onSelect={handleSelect}
            selectedId={selectedId}
          />
        </div>

        {/* Player — shown when a session is selected */}
        {selectedDetail && (
          <div style={{ minHeight: 400 }}>
            <ReplayPlayer session={selectedDetail} />
          </div>
        )}
      </div>
    </div>
  );
}
