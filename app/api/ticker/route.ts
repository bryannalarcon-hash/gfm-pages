// SSE event ticker Route Handler. architecture.md §4.4.
//
// ONE shared poll loop (module-level, started once regardless of viewer count)
// checks for new events every 2s and pushes them to all connected browser EventSource clients.
//
// Sources of events (in order of precedence):
//   1. Local in-memory store (lib/ticker/store.ts) — populated by /api/ticker/ingest
//      from every capture() call in the demo. This is the offline bus (no PostHog required).
//   2. PostHog /query polling — if POSTHOG_PERSONAL_API_KEY is set the loop also queries
//      PostHog and merges results, deduplicating by uuid.
//
// On connect: replay the last ~20 buffered events so the ticker isn't empty.
// TEST MODE: if request header `x-test-flush: 1` is present, drain the store immediately
//            without waiting for the poll loop. This lets E2E tests assert without sleeps.

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { recentEvents, subscribe, hydrateFromDb } from '@/lib/ticker/store';
import type { TickerEvent } from '@/lib/types';
import { TICKER_PATH } from '@/lib/ticker/client';

// Keep TICKER_PATH import honest: it's the canonical path constant.
void TICKER_PATH;

// ──────────────────────────────────────────────────────────────────────────────
// Subscriber management: a Set of push functions, one per connected client.
// ──────────────────────────────────────────────────────────────────────────────

type PushFn = (event: TickerEvent) => void;
const pushFns = new Set<PushFn>();

// The store calls every registered subscriber on pushEvent(); we fan out here.
let storeSub: (() => void) | null = null;
function ensureStoreSub() {
  if (storeSub) return;
  storeSub = subscribe((e) => {
    broadcast(e);
  });
}

function broadcast(e: TickerEvent) {
  for (const fn of pushFns) {
    try {
      fn(e);
    } catch {
      // Dead client — will unregister on the next iteration
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Optional PostHog polling loop (no-op when key is absent).
// ──────────────────────────────────────────────────────────────────────────────

// Tracks which event uuids we have already pushed so we don't re-broadcast.
const seenUuids = new Set<string>();

let pollLoopStarted = false;

function startPollLoop() {
  if (pollLoopStarted) return;
  pollLoopStarted = true;

  // Pre-seed seenUuids from the current buffer so replays don't also get polled again.
  for (const e of recentEvents(200)) {
    seenUuids.add(e.uuid);
  }

  // PostHog polling — only active if a key is present.
  const POSTHOG_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
  if (!POSTHOG_KEY) return; // offline mode — store subscriptions are the sole source

  const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID;
  const POSTHOG_HOST =
    process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

  if (!POSTHOG_PROJECT_ID) return;

  const hogql = `
    SELECT uuid, event, timestamp, properties.$persona AS persona,
           properties.referrer_source AS referrerSource,
           properties
    FROM events
    WHERE timestamp > now() - INTERVAL 5 MINUTE
    ORDER BY timestamp DESC
    LIMIT 100
  `.trim();

  async function poll() {
    try {
      const res = await fetch(
        `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${POSTHOG_KEY}`,
          },
          body: JSON.stringify({ query: { kind: 'HogQLQuery', query: hogql } }),
        },
      );
      if (!res.ok) return;
      const body = (await res.json()) as Record<string, unknown>;
      const rows = (body.rows ?? body.results ?? []) as unknown[][];
      const columns = (body.columns as string[]) ?? [];

      for (const row of rows) {
        const obj: Record<string, unknown> = {};
        columns.forEach((col, i) => {
          obj[col] = row[i];
        });
        const uuid = typeof obj.uuid === 'string' ? obj.uuid : null;
        if (!uuid || seenUuids.has(uuid)) continue;
        seenUuids.add(uuid);

        const props =
          typeof obj.properties === 'string'
            ? (JSON.parse(obj.properties) as Record<string, unknown>)
            : (obj.properties as Record<string, unknown>) ?? {};

        const tickerEvent = buildFromPostHog(uuid, obj, props);
        if (tickerEvent) broadcast(tickerEvent);
      }
    } catch {
      // Poll failure is silently swallowed — the demo continues via the local store
    }
  }

  // Run first poll immediately then every 2 s.
  void poll();
  const id = setInterval(() => void poll(), 2000);

  // In tests the loop is replaced by direct pushEvent() calls; the interval
  // is intentionally not cleared to keep the single-loop invariant across HMR.
  void id;
}

function buildFromPostHog(
  uuid: string,
  obj: Record<string, unknown>,
  props: Record<string, unknown>,
): TickerEvent | null {
  const event = typeof obj.event === 'string' ? obj.event : null;
  if (!event) return null;

  const timestamp =
    typeof obj.timestamp === 'string' ? obj.timestamp : new Date().toISOString();
  const persona =
    typeof obj.persona === 'string' ? obj.persona : 'anonymous';
  const referrerSource =
    typeof obj.referrerSource === 'string' ? obj.referrerSource : 'direct';

  const keyProp = pickKeyProp(event, props);

  return {
    uuid,
    event: event as TickerEvent['event'],
    timestamp,
    persona: persona as TickerEvent['persona'],
    referrerSource: referrerSource as TickerEvent['referrerSource'],
    keyProp,
  };
}

// Pick the most informative single property for the ticker row display.
function pickKeyProp(
  event: string,
  props: Record<string, unknown>,
): { label: string; value: string } {
  switch (event) {
    case 'Share Clicked':
    case 'Mark Shared':
    case 'Post Donate Share Clicked':
      return {
        label: 'share_channel',
        value: String(props.share_channel ?? '—'),
      };
    case 'Amount Selected':
      return {
        label: 'amount_usd',
        value: String(props.amount_usd ?? '—'),
      };
    case 'Donate Completed':
      return {
        label: 'amount_usd',
        value: String(props.amount_usd ?? '—'),
      };
    case 'Donate Started':
    case 'Donate Failed':
      return {
        label: 'amount_usd',
        value: String(props.amount_usd ?? '—'),
      };
    case 'Section Viewed':
      return {
        label: 'section_name',
        value: String(props.section_name ?? '—'),
      };
    case 'Mark Created':
      return {
        label: 'action_type',
        value: String(props.action_type ?? '—'),
      };
    case 'Mark Grew':
      return {
        label: 'trigger',
        value: String(props.trigger ?? '—'),
      };
    case 'Mark Customized':
      return {
        label: 'gradient_id',
        value: String(props.gradient_id ?? '—'),
      };
    case 'Story Scrolled':
      return {
        label: 'scroll_depth_pct',
        value: String(props.scroll_depth_pct ?? '—'),
      };
    case 'Donate Intent':
      return {
        label: 'cta_location',
        value: String(props.cta_location ?? '—'),
      };
    case 'Post Donate Follow Clicked':
      return {
        label: 'follow_target',
        value: String(props.follow_target ?? '—'),
      };
    default:
      // For events without a dominant property, surface referrer_source or the event itself.
      if (props.referrer_source) {
        return { label: 'referrer_source', value: String(props.referrer_source) };
      }
      return { label: 'event', value: event };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Route Handler
// ──────────────────────────────────────────────────────────────────────────────

export async function GET(req: Request): Promise<Response> {
  // CB-21: hydrate the ring buffer from the DB before replaying so a cold process
  // serves accumulated demo interactions immediately on first SSE connect.
  await hydrateFromDb();

  // Start the store subscription and the optional PostHog poll loop exactly once.
  ensureStoreSub();
  startPollLoop();

  const testFlush = req.headers.get('x-test-flush') === '1';

  const stream = new ReadableStream({
    start(controller) {
      function send(e: TickerEvent) {
        try {
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify(e)}\n\n`),
          );
        } catch {
          // Enqueue after close — ignore
        }
      }

      // Replay the full recent buffer on connect so the ticker isn't empty AND a
      // just-ingested event is reliably present even when many events arrived between
      // ingest and connect (parallel demo interactions / E2E shards sharing this loop).
      const replay = recentEvents(200);
      for (const e of replay) {
        send(e);
      }

      if (testFlush) {
        // TEST MODE: immediately close after flushing current buffer.
        try { controller.close(); } catch { /* already closed */ }
        return;
      }

      // Register for live updates.
      const push: PushFn = (e) => send(e);
      pushFns.add(push);

      // Keep-alive comment every 25 s to prevent Railway / nginx timeout.
      const keepAliveId = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': keep-alive\n\n'));
        } catch {
          clearInterval(keepAliveId);
        }
      }, 25_000);

      // Cleanup when the client disconnects.
      req.signal.addEventListener('abort', () => {
        clearInterval(keepAliveId);
        pushFns.delete(push);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
