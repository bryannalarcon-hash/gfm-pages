'use client';
// W5 — Real-time Event Ticker
// Consumes useEventStream({ personaFilter }); each row shows [timestamp][persona dot][event][key prop].
// Clicking a row opens <MetricBlob source={{ kind:'ticker', event }} />.
// This is the signature live widget — events fired on the 3 pages appear here within ~2s.

import { useState } from 'react';
import { useEventStream } from '@/lib/ticker/client';
import { MetricBlob } from '@/components/overlay/MetricBlob';
import type { EventTickerProps, TickerEvent } from './types';
import type { PersonaSlug } from '@/lib/personas/types';
import { PERSONAS } from '@/fixtures/personas';

const PERSONA_LABEL: Record<string, string> = {
  anonymous: 'Anonymous',
  close_friend: 'Close friend',
  extrovert: 'Extrovert',
  shared_by_extro: 'Shared-link visitor',
  returning_lapsed: 'Returning donor',
  profile_owner: 'Profile owner',
};

function getPersonaBg(slug: PersonaSlug): string {
  return PERSONAS[slug]?.avatar.bg ?? '#b7b7b6';
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '—';
  }
}

export function EventTicker({ personaFilter, max = 150 }: EventTickerProps) {
  const { events, connected } = useEventStream({ personaFilter, max });
  const [blobEvent, setBlobEvent] = useState<TickerEvent | null>(null);
  const reversedEvents = [...events].reverse();

  return (
    <div
      id="event-ticker"
      style={{ width: '100%', position: 'relative' }}
      aria-label="Real-time event stream"
    >
      {/* Status bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 10,
          fontSize: 12,
          color: '#6f6f6f',
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: connected ? '#4a9d44' : events.length > 0 ? '#e03131' : '#b7b7b6',
            display: 'inline-block',
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
        <span>
          {connected ? 'Live' : events.length > 0 ? 'Reconnecting…' : 'Idle'}
        </span>
        <span style={{ marginLeft: 'auto' }}>{events.length} events</span>
      </div>

      {/* Event list */}
      <div
        style={{
          maxHeight: 320,
          overflowY: 'auto',
          borderRadius: 8,
          border: '1px solid #e8e8e8',
          background: '#fafafa',
        }}
        role="log"
        aria-live="polite"
        aria-label="Event stream"
      >
        {reversedEvents.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9e9e9e', fontSize: 12 }}>
            No events yet — interact with the pages (overlay off) to see them stream in.
          </div>
        ) : (
          reversedEvents.map((ev) => (
            <button
              key={ev.uuid}
              onClick={() => setBlobEvent(ev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                border: 'none',
                borderBottom: '1px solid #f0f0f0',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f5f5f5'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              aria-label={`${ev.event} by ${PERSONA_LABEL[ev.persona] ?? ev.persona} at ${formatTime(ev.timestamp)}`}
            >
              {/* Timestamp */}
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: 11,
                  color: '#9e9e9e',
                  flexShrink: 0,
                  minWidth: 66,
                }}
              >
                {formatTime(ev.timestamp)}
              </span>

              {/* Persona dot */}
              <span
                aria-hidden="true"
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: getPersonaBg(ev.persona),
                  display: 'inline-block',
                  flexShrink: 0,
                }}
                title={PERSONA_LABEL[ev.persona] ?? ev.persona}
              />

              {/* Event name */}
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 12,
                  color: '#232323',
                  flex: '1 1 auto',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {ev.event}
              </span>

              {/* Key prop */}
              <span
                style={{
                  fontSize: 11,
                  color: '#6f6f6f',
                  flexShrink: 0,
                  maxWidth: 100,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {ev.keyProp.value !== '—' ? `${ev.keyProp.label}: ${ev.keyProp.value}` : ''}
              </span>
            </button>
          ))
        )}
      </div>

      {/* MetricBlob for selected ticker event */}
      {blobEvent && (
        <MetricBlob
          source={{ kind: 'ticker', event: blobEvent }}
          onClose={() => setBlobEvent(null)}
        />
      )}
    </div>
  );
}
