// PostHog instrumentation wrapper. architecture.md §4.7.
//
// Event NAMES and referrer_source enum are owned by strategy-metrics-research.md §4.
// Referenced via lib/types.ts — NEVER redefined here.
//
// capture() = (1) if suppressed → return; (2) POST to /api/ticker/ingest so the local
// demo ticker/dashboard works offline without PostHog; (3) if PostHog configured, also
// posthog.capture(). The offline ingest path is ALWAYS attempted (step 2) regardless
// of whether a PostHog key is present.

import type { EventName, ReferrerSource } from '@/lib/types';
import type { PersonaSlug } from '@/lib/personas/types';
import { readOverlayOn, OVERLAY_PERSONA_KEY } from '@/lib/overlay/storage';

export interface CaptureProps {
  referrer_source?: ReferrerSource;
  persona?: PersonaSlug;
  utm_share_source?: string;
  utm_share_user?: string;
  [prop: string]: unknown;
}

// While the overlay is ON, real captures are suppressed for intercepted clicks
// (the blob shows the event instead). This guard lives here, not in callers.
export function isCaptureSuppressed(): boolean {
  return readOverlayOn();
}

// Lazily resolve the active persona from localStorage if not supplied in props.
function resolvePersona(propsPersona?: PersonaSlug): PersonaSlug {
  if (propsPersona) return propsPersona;
  if (typeof window === 'undefined') return 'anonymous';
  const stored = window.localStorage.getItem(OVERLAY_PERSONA_KEY);
  return (stored as PersonaSlug) || 'anonymous';
}

// Fire-and-forget POST to the local ingest endpoint.
// Never throws — the offline demo loop must be resilient.
function postToIngest(event: EventName, props: CaptureProps, persona: PersonaSlug): void {
  if (typeof window === 'undefined') return;
  try {
    fetch('/api/ticker/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, props, persona, timestamp: new Date().toISOString() }),
    }).catch(() => {
      // Silently ignore — ingest is best-effort for the demo
    });
  } catch {
    // fetch itself throwing (e.g. in a test environment) must not surface
  }
}

let posthogInitialized = false;

// Lazy-init posthog-js in the browser, only when a key is configured.
async function getPostHog(): Promise<import('posthog-js').PostHog | null> {
  if (typeof window === 'undefined') return null;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;

  if (!posthogInitialized) {
    const { default: posthog } = await import('posthog-js');
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';
    posthog.init(key, {
      api_host: host,
      capture_pageview: false, // pages fire 'Page Viewed' explicitly
      persistence: 'localStorage+cookie',
    });
    posthogInitialized = true;
    return posthog;
  }

  const { default: posthog } = await import('posthog-js');
  return posthog;
}

export function capture(event: EventName, props?: CaptureProps): void {
  // Step 1 — inspect/use switch: overlay ON means clicks are intercepted for the blob,
  // not real usage captures.
  if (isCaptureSuppressed()) {
    console.debug('[capture] suppressed (overlay ON):', event, props);
    return;
  }

  const persona = resolvePersona(props?.persona);
  const enriched: CaptureProps = { ...props, persona };

  // Step 2 — always POST to local ingest so the demo ticker works offline.
  postToIngest(event, enriched, persona);

  // Step 3 — also send to PostHog when configured.
  void getPostHog().then((posthog) => {
    if (!posthog) return;
    posthog.capture(event, enriched);
  });
}
