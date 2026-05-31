// Browser EventSource hook for the SSE event ticker. architecture.md §4.4.
'use client';

import { useEffect, useRef, useState } from 'react';
import type { TickerEvent, EventName, ReferrerSource } from '@/lib/types';
import type { PersonaSlug } from '@/lib/personas/types';

// Single owner of the SSE path — both this module and the Route Handler import this constant.
export const TICKER_PATH = '/api/ticker';

const DEFAULT_MAX = 50;

// Structural guard: a valid TickerEvent must have all required fields.
function isValidTickerEvent(v: unknown): v is TickerEvent {
  if (!v || typeof v !== 'object') return false;
  const e = v as Record<string, unknown>;
  return (
    typeof e.uuid === 'string' &&
    typeof e.event === 'string' &&
    typeof e.timestamp === 'string' &&
    typeof e.persona === 'string' &&
    typeof e.referrerSource === 'string' &&
    typeof e.keyProp === 'object' &&
    e.keyProp !== null &&
    typeof (e.keyProp as Record<string, unknown>).label === 'string' &&
    typeof (e.keyProp as Record<string, unknown>).value === 'string'
  );
}

export function useEventStream(opts?: {
  personaFilter?: PersonaSlug | 'all';
  max?: number;
}): { events: TickerEvent[]; connected: boolean } {
  const max = opts?.max ?? DEFAULT_MAX;
  const personaFilter = opts?.personaFilter ?? 'all';

  const [events, setEvents] = useState<TickerEvent[]>([]);
  const [connected, setConnected] = useState(false);

  // Keep refs so the effect closure always reads the latest values without re-mounting.
  const maxRef = useRef(max);
  const filterRef = useRef(personaFilter);
  maxRef.current = max;
  filterRef.current = personaFilter;

  useEffect(() => {
    let es: EventSource | null = null;
    let dead = false;

    function connect() {
      if (dead) return;
      es = new EventSource(TICKER_PATH);

      es.onopen = () => {
        if (!dead) setConnected(true);
      };

      es.onmessage = (evt) => {
        if (dead) return;
        let parsed: unknown;
        try {
          parsed = JSON.parse(evt.data as string);
        } catch {
          // Malformed frame — drop silently
          return;
        }

        if (!isValidTickerEvent(parsed)) {
          // Missing required fields — drop gracefully
          return;
        }

        const tickerEvent = parsed as TickerEvent;

        // Apply persona filter
        if (filterRef.current !== 'all' && tickerEvent.persona !== filterRef.current) {
          return;
        }

        setEvents((prev) => {
          // Deduplicate by uuid
          if (prev.some((e) => e.uuid === tickerEvent.uuid)) return prev;
          const next = [...prev, tickerEvent];
          // Ring-buffer to max
          return next.length > maxRef.current
            ? next.slice(next.length - maxRef.current)
            : next;
        });
      };

      es.onerror = () => {
        if (dead) return;
        setConnected(false);
        // EventSource will automatically attempt to reconnect; we just track state.
      };
    }

    connect();

    return () => {
      dead = true;
      if (es) {
        es.close();
        es = null;
      }
    };
  }, []); // mount once; reconnect is automatic via EventSource

  return { events, connected };
}
