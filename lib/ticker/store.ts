// In-memory event store for the offline demo event bus. architecture.md §4.4.
//
// pushEvent()   — adds a TickerEvent to the ring buffer and fans out to SSE subscribers.
// recentEvents() — returns the last N events (default 50).
// subscribe()   — registers a callback that fires on every new push; returns an unsubscribe fn.
//
// This module is SERVER-SIDE only (imported by the Route Handler, never by client bundles).
// It is the offline counterpart to PostHog: capture() POSTs to /api/ticker/ingest which
// calls pushEvent(), which the SSE handler fans out to all connected browsers.

import type { TickerEvent } from '@/lib/types';

const RING_SIZE = 200;

// Ring buffer — kept as a plain array treated as a circular queue.
const buffer: TickerEvent[] = [];

// Subscriber set — functions called synchronously on every push.
const subscribers = new Set<(e: TickerEvent) => void>();

export function pushEvent(e: TickerEvent): void {
  if (buffer.length >= RING_SIZE) {
    buffer.shift();
  }
  buffer.push(e);
  for (const fn of subscribers) {
    try {
      fn(e);
    } catch {
      // A misbehaving subscriber must not break other subscribers
    }
  }
}

export function recentEvents(n = 50): TickerEvent[] {
  const count = Math.min(n, buffer.length);
  return buffer.slice(buffer.length - count);
}

// Returns an unsubscribe function.
export function subscribe(fn: (e: TickerEvent) => void): () => void {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}

// ---------------------------------------------------------------------------
// CB-21 — cold-start hydration from Postgres
// ---------------------------------------------------------------------------

// Guard: run at most once per process lifetime. Reset in tests via vi.resetModules().
let hydrated = false;

/**
 * Populate the ring buffer from the DB if it is currently empty and this is
 * the first call in the process lifetime.
 *
 * Design constraints:
 *   - Lazy dynamic import of @/lib/db/queries avoids pulling `server-only` /
 *     `pg` into any client bundle that imports this store.
 *   - Events are pushed directly into `buffer` WITHOUT calling subscriber fns
 *     (no SSE fan-out for historical rows on hydration).
 *   - Deduplication by uuid prevents double-entries if the buffer was partially
 *     populated before hydration ran.
 *   - A DB error is silently swallowed; the offline demo must never break.
 */
export async function hydrateFromDb(): Promise<void> {
  if (hydrated) return;
  hydrated = true;

  if (buffer.length > 0) return; // already populated (e.g. events arrived before cold-start)

  try {
    const { getRecentAnalyticsEvents } = await import('@/lib/db/queries');
    const events = await getRecentAnalyticsEvents(RING_SIZE);

    // Build a uuid set from whatever is already in the buffer.
    const seen = new Set(buffer.map((e) => e.uuid));

    for (const e of events) {
      if (seen.has(e.uuid)) continue; // dedupe
      seen.add(e.uuid);
      if (buffer.length >= RING_SIZE) {
        buffer.shift(); // honour ring-size cap
      }
      buffer.push(e); // direct push — no subscriber fan-out
    }
  } catch {
    // Best-effort — silently ignore DB errors.
  }
}
