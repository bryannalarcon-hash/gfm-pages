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
      {/* CB-105: removed the "Skip to content" link — Scene 1's always-visible
          "Skip to demo →" (Scene1Hook, top-left → #scene-6) already serves the keyboard
          skip-link role, and the focus-revealed "Skip to content" appeared at the same
          top-left spot, overlapping it. One skip link now, no overlap. */}

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
