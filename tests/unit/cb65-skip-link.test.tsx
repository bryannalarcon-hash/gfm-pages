/**
 * CB-65 → CB-105 — the deck's redundant "Skip to content" link is REMOVED.
 *
 * The deck (/) used to render a focus-reveal "Skip to content" link (→ #scene-1). It was
 * removed (CB-105): Scene 1's always-visible "Skip to demo →" link (Scene1Hook, → #scene-6)
 * already serves the keyboard skip-link role, and the focus-revealed "Skip to content"
 * appeared at the same top-left spot, overlapping it. This test pins the removal so the link
 * can't silently come back. (The surviving "Skip to demo →" lives in Scene1Hook and is
 * mocked out here; its behaviour is covered where Scene1Hook is rendered.)
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

// Stub child scene components so they don't pull in heavy dependencies.
vi.mock('@/components/landing/SceneNav', () => ({ SceneNav: () => <div data-testid="scene-nav" /> }));
vi.mock('@/components/landing/Scene1Hook', () => ({ Scene1Hook: () => <div data-testid="scene-1" /> }));
vi.mock('@/components/landing/Scene2Problem', () => ({ Scene2Problem: () => <div data-testid="scene-2" /> }));
vi.mock('@/components/landing/Scene3GFMIntel', () => ({ Scene3GFMIntel: () => <div data-testid="scene-3" /> }));
vi.mock('@/components/landing/Scene4Deltas', () => ({ Scene4Deltas: () => <div data-testid="scene-4" /> }));
vi.mock('@/components/landing/Scene5DemoFeatures', () => ({ Scene5DemoFeatures: () => <div data-testid="scene-5" /> }));
vi.mock('@/components/landing/Scene6DemoEntry', () => ({ Scene6DemoEntry: () => <div data-testid="scene-6" /> }));
vi.mock('@/components/landing/Scene7Stack', () => ({ Scene7Stack: () => <div data-testid="scene-7" /> }));
vi.mock('@/components/shared/Footer', () => ({ Footer: () => <div data-testid="footer" /> }));

import LandingPage from '@/app/page';

describe('CB-105 — deck "Skip to content" link removed (no overlap with Skip to demo)', () => {
  it('the deck does NOT render a "Skip to content" link to #scene-1', () => {
    const { container } = render(<LandingPage />);
    expect(container.querySelector('a[href="#scene-1"]')).toBeNull();
  });

  it('no element renders the text "Skip to content"', () => {
    const { container } = render(<LandingPage />);
    expect((container.textContent ?? '').toLowerCase()).not.toContain('skip to content');
  });
});
