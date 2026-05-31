// POST /api/ticker/ingest — receives capture() events from the browser and
// maps them into TickerEvent objects that get pushed into the in-memory store,
// which fans out to all connected SSE clients. This closes the offline demo loop:
//
//   User interaction → capture() → POST /api/ticker/ingest → pushEvent() → SSE → ticker UI
//
// CB-21: events are also persisted to analytics_event (best-effort, fire-and-forget)
// so /dashboard sees live data after a cold process restart.
//
// No PostHog key is required for this path to work.
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { pushEvent } from '@/lib/ticker/store';
import { insertAnalyticsEvent } from '@/lib/db/queries';
import type { TickerEvent, EventName, ReferrerSource } from '@/lib/types';
import type { PersonaSlug } from '@/lib/personas/types';

interface IngestBody {
  event: string;
  props?: Record<string, unknown>;
  persona?: string;
  timestamp?: string;
}

// Mirrors lib/analytics/capture.ts's pickKeyProp logic for the server side.
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
    case 'Donate Completed':
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
      if (props.referrer_source) {
        return { label: 'referrer_source', value: String(props.referrer_source) };
      }
      return { label: 'event', value: event };
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: IngestBody;
  try {
    body = (await req.json()) as IngestBody;
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const { event, props = {}, persona, timestamp } = body;

  if (typeof event !== 'string' || !event) {
    return new NextResponse(null, { status: 400 });
  }

  const tickerEvent: TickerEvent = {
    uuid: crypto.randomUUID(),
    event: event as EventName,
    timestamp: typeof timestamp === 'string' ? timestamp : new Date().toISOString(),
    persona: (typeof persona === 'string' ? persona : 'anonymous') as PersonaSlug,
    referrerSource: (
      typeof props.referrer_source === 'string'
        ? props.referrer_source
        : 'direct'
    ) as ReferrerSource,
    keyProp: pickKeyProp(event, props),
  };

  pushEvent(tickerEvent);

  // CB-21: persist to DB — best-effort, fire-and-forget.
  // Must NOT delay the 204 response or throw on DB failure.
  void insertAnalyticsEvent({
    uuid: tickerEvent.uuid,
    event: tickerEvent.event,
    persona: tickerEvent.persona,
    referrerSource: tickerEvent.referrerSource,
    keyLabel: tickerEvent.keyProp.label,
    keyValue: tickerEvent.keyProp.value,
    createdAt: tickerEvent.timestamp,
  }).catch(() => {});

  return new NextResponse(null, { status: 204 });
}
