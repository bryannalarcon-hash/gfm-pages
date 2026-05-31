'use client';
// CommunitySunsSection — S2.
// The community is the PRIMARY HOME of the Suns board. Always-present board section
// mounted behind the page content (z-index:-1 position:absolute).
// Zero-CLS: SunsLayer uses fixed gutter constants, never scrollHeight probe.
// Includes SunsLegend + visually-accessible aggregate supporter count.
//
// CB-12: Community gutters override boardSeed.density with COMMUNITY_DENSITY (0.45)
// so the lighter look matches mocks/community-v4.2.html (vs fundraiser at 0.74).

import React, { useMemo } from 'react';
import type { BoardSeed } from '@/lib/marks/types';
import { COMMUNITY_DENSITY } from '@/lib/marks/types';
import type { OverlayAttrs } from '@/lib/overlay/types';
import { SunsLayer } from '@/components/marks/SunsLayer';
import { SunsLegend } from '@/components/marks/SunsLegend';
import { Instrumented } from '@/components/overlay/Instrumented';
import { useSectionViewed } from '@/lib/analytics/section-viewed';

// L3.5: This section NEVER unmounts — it is always present as the community's board.
// The SunsLayer handles cold-start (empty marks) gracefully.

interface CommunitySunsSectionProps {
  boardSeed: BoardSeed;
  supporterCount: number;
  overlay: OverlayAttrs;
}

export function CommunitySunsSection({
  boardSeed,
  supporterCount,
  overlay,
}: CommunitySunsSectionProps) {
  // CB-14: do NOT compute reduced-motion at render time here — matchMedia diverges between
  // SSR (false) and client (true), causing a hydration mismatch that LOCKS IN the animated
  // server HTML (React keeps server DOM on attribute mismatch). Instead pass a STABLE false
  // and let SunsLayer's internal prefers-reduced-motion effect disable animation cleanly
  // after mount (no mismatch → re-render applies). SSR-safe + reduced-motion-safe.
  const reducedMotion = false;

  // CB-12: override density with the lighter community constant so the gutter
  // matches mocks/community-v4.2.html (less overlap/clutter than the fundraiser).
  const communitySeed = useMemo<BoardSeed>(() => ({
    ...boardSeed,
    density: COMMUNITY_DENSITY,
  }), [boardSeed]);

  const sectionRef = useSectionViewed('suns_board');

  return (
    <Instrumented attrs={overlay} regionLabel="suns-board">
      {/* Anchor div for section-viewed IntersectionObserver */}
      <div ref={sectionRef} data-section-name="suns_board" style={{ position: 'absolute', top: 0, left: 0, width: 1, height: 1, pointerEvents: 'none' }} aria-hidden="true" />

      {/* S2: SunsLayer — position:absolute, z:-1, always-present behind page content
          CB-12: passes communitySeed (lower density) to lighten the gutter vs fundraiser
          CB-14: reducedMotion handled inside SunsLayer (prefers-reduced-motion effect) */}
      <SunsLayer
        seed={communitySeed}
        reducedMotion={reducedMotion}
        supporterCount={supporterCount}
      />

      {/* SunsLegend + aggregate count — visually anchored below hero, above tabs */}
      {/* Rendered in-flow so it appears in the page column (not behind content) */}
      <div
        className={[
          'relative z-10',
          'mx-auto w-full max-w-[64rem]',
          'px-[var(--hrt-size-spacing-2)] md:px-[var(--hrt-size-spacing-3)]',
          'pt-0',
        ].join(' ')}
        style={{ pointerEvents: 'none' }}
        aria-hidden="true"
      >
        {/* Legend and count are rendered after the hero by CommunityPage layout.
            This component only mounts the layer; the legend is in CommunitySunsLegendBar. */}
      </div>
    </Instrumented>
  );
}

// Exported separately so CommunityHero can include the legend inline below stats
export interface CommunitySunsLegendBarProps {
  supporterCount: number;
}

export function CommunitySunsLegendBar({ supporterCount }: CommunitySunsLegendBarProps) {
  return (
    <div
      className="flex flex-col gap-[var(--hrt-size-spacing-1)] py-[var(--hrt-size-spacing-2)] border-t border-[var(--hrt-color-border-neutral-extra-subtle)]"
      aria-label="Supporters board"
    >
      <p className="text-body-sm font-bold text-[var(--hrt-color-text-default)] m-0">
        {supporterCount > 0
          ? `${supporterCount.toLocaleString()} supporter${supporterCount !== 1 ? 's' : ''}`
          : 'Be the first to light this community up'}
      </p>
      <SunsLegend layout="row" />
    </div>
  );
}
