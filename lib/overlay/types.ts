// The data-overlay-* attribute contract every instrumented element MUST carry.
// architecture.md §4.1 / design-overlay.md "Data the overlay reads".
import type { DeltaId, DashboardAnchor, TierLevel, TickerEvent } from '@/lib/types';

export interface OverlayAttrs {
  'data-overlay-tier': TierLevel; // '1' | '2' — tier colouring; guardrail not on-page
  'data-overlay-events': string; // comma-list of EventName; names MUST match capture() exactly
  'data-overlay-delta': DeltaId; // e.g. 'D1' | 'C4' | 'P9'
  'data-overlay-metric': string; // graded metric served
  'data-overlay-why': string; // short rationale, baked at build time
  'data-overlay-dashboard': DashboardAnchor; // e.g. 'donate-funnel'
}

export interface InstrumentedProps {
  attrs: OverlayAttrs;
  regionLabel: string;
  children: React.ReactNode;
}

export interface MetricBlobProps {
  source:
    | { kind: 'overlay'; attrs: OverlayAttrs; regionLabel: string }
    | { kind: 'ticker'; event: TickerEvent };
  onClose: () => void;
}
