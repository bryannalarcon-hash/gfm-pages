'use client';
// Wraps an instrumented region and spreads the data-overlay-* attribute contract onto it.
// architecture.md §4.1. The attributes are DEMO-ONLY: in a non-demo build they are absent
// (test-plan §4.3 / §7.1), so production DOM carries no portfolio annotations.
//
// This component does NOT intercept clicks itself — OverlayLayer scans [data-overlay-tier]
// on activation and wires the highlight + blob + click interception globally.
import { useOverlay } from '@/lib/overlay/context';
import type { InstrumentedProps } from '@/lib/overlay/types';

export function Instrumented({ attrs, regionLabel, children }: InstrumentedProps): JSX.Element {
  const { demoMode } = useOverlay();
  if (!demoMode) {
    // Ship build: render the region with no annotation attributes.
    return <>{children}</>;
  }
  return (
    <div data-overlay-region={regionLabel} {...attrs} style={{ display: 'contents' }}>
      {children}
    </div>
  );
}
