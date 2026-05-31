/**
 * Landing page — 7-scene slide deck portfolio narrative.
 * Route: /
 *
 * Server component; client interactivity lives in scene + SceneNav components.
 * Scenes are full-bleed (min-height: 100dvh) and scroll-snap on desktop.
 * The OverlayPill is rendered globally by RootLayout — no duplication here.
 */

import React from 'react';
import { Footer } from '@/components/shared/Footer';
import { SceneNav } from '@/components/landing/SceneNav';
import { Scene1Hook } from '@/components/landing/Scene1Hook';
import { Scene2Problem } from '@/components/landing/Scene2Problem';
import { Scene3GFMIntel } from '@/components/landing/Scene3GFMIntel';
import { Scene4Deltas } from '@/components/landing/Scene4Deltas';
import { Scene5DemoFeatures } from '@/components/landing/Scene5DemoFeatures';
import { Scene6DemoEntry } from '@/components/landing/Scene6DemoEntry';
import { Scene7Stack } from '@/components/landing/Scene7Stack';

export default function LandingPage() {
  return (
    <>
      {/* Skip-to-main for screen readers.
          sr-only hides visually at rest; focus:not-sr-only reveals on keyboard focus.
          NO inline position/top/left/zIndex — those override sr-only clip and would
          place the link over the DeckNav brand button (CB-65). Tailwind handles all
          positioning via the focus-reveal utility classes below. */}
      <a
        href="#scene-1"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-[#232323] focus:text-white focus:rounded-full focus:px-5 focus:py-2 focus:text-sm focus:font-bold focus:no-underline"
      >
        Skip to content
      </a>

      {/* Cross-surface top bar is mounted once in app/layout.tsx (UnifiedNav). */}

      {/* Fixed scene dot navigator + progress bar (client) — deck scene jumps */}
      <SceneNav />

      {/* Scroll container with snap behavior */}
      <main
        id="main-content"
        style={{
          scrollSnapType: 'y mandatory',
          overflowY: 'scroll',
          height: 'calc(100dvh - 56px)', /* subtract UnifiedNav (layout) height */
          scrollBehavior: 'smooth',
        }}
      >
        <Scene1Hook />
        <Scene2Problem />
        <Scene3GFMIntel />
        <Scene4Deltas />
        <Scene5DemoFeatures />
        <Scene6DemoEntry />
        <Scene7Stack />

        {/* Site footer — below the deck */}
        <Footer />
      </main>
    </>
  );
}
