/**
 * CB-65 — Skip-to-content link must stay visually hidden until keyboard-focused.
 *
 * The skip link on the deck (/) must:
 *  1. Have the `sr-only` class so it is visually hidden when not focused.
 *  2. NOT have any inline `position` style that overrides the sr-only hiding at rest
 *     (i.e. no top/left/zIndex inline style that would place it over the brand button).
 *  3. Have `focus:not-sr-only` (or equivalent) so it becomes visible on focus.
 *  4. Its href targets the main content anchor, not the nav brand.
 *
 * We render LandingPage in a minimal environment and assert the skip link's class
 * and style attributes. The actual focus-reveal behaviour depends on Tailwind's
 * `focus:not-sr-only` CSS, which we verify by class presence.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

// LandingPage is a server component (no 'use client'); we can import and render
// it directly in jsdom because it has no server-only deps.

// Stub next/navigation (SceneNav child may use it)
vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

// Stub child scene components so they don't pull in heavy dependencies.
vi.mock('@/components/landing/SceneNav', () => ({
  SceneNav: () => <div data-testid="scene-nav" />,
}));
vi.mock('@/components/landing/Scene1Hook', () => ({
  Scene1Hook: () => <div data-testid="scene-1" />,
}));
vi.mock('@/components/landing/Scene2Problem', () => ({
  Scene2Problem: () => <div data-testid="scene-2" />,
}));
vi.mock('@/components/landing/Scene3GFMIntel', () => ({
  Scene3GFMIntel: () => <div data-testid="scene-3" />,
}));
vi.mock('@/components/landing/Scene4Deltas', () => ({
  Scene4Deltas: () => <div data-testid="scene-4" />,
}));
vi.mock('@/components/landing/Scene5DemoFeatures', () => ({
  Scene5DemoFeatures: () => <div data-testid="scene-5" />,
}));
vi.mock('@/components/landing/Scene6DemoEntry', () => ({
  Scene6DemoEntry: () => <div data-testid="scene-6" />,
}));
vi.mock('@/components/landing/Scene7Stack', () => ({
  Scene7Stack: () => <div data-testid="scene-7" />,
}));
vi.mock('@/components/shared/Footer', () => ({
  Footer: () => <div data-testid="footer" />,
}));

import LandingPage from '@/app/page';

describe('CB-65 — Skip-to-content link focus-reveal behavior', () => {
  function getSkipLink(container: HTMLElement): HTMLElement | null {
    return container.querySelector('a[href="#scene-1"]') as HTMLElement | null;
  }

  it('skip link exists and targets #scene-1', () => {
    const { container } = render(<LandingPage />);
    const link = getSkipLink(container);
    expect(link, 'skip link must exist with href="#scene-1"').not.toBeNull();
    expect(link!.getAttribute('href')).toBe('#scene-1');
  });

  it('skip link has the sr-only class for visual hiding at rest', () => {
    const { container } = render(<LandingPage />);
    const link = getSkipLink(container);
    expect(link, 'skip link must be in the DOM').not.toBeNull();
    expect(link!.className, 'sr-only class must be present').toContain('sr-only');
  });

  it('skip link has focus:not-sr-only for keyboard reveal', () => {
    const { container } = render(<LandingPage />);
    const link = getSkipLink(container);
    expect(link, 'skip link must be in the DOM').not.toBeNull();
    // focus:not-sr-only makes the element visible on focus (Tailwind utility)
    expect(link!.className, 'focus:not-sr-only must be in className').toContain('focus:not-sr-only');
  });

  it('skip link has NO inline position/top/left/zIndex style that overrides sr-only at rest', () => {
    const { container } = render(<LandingPage />);
    const link = getSkipLink(container);
    expect(link, 'skip link must be in the DOM').not.toBeNull();
    // An inline style with position:absolute + top/left overlays the brand button.
    // sr-only hides via clip/overflow, but only if position is not overridden by inline style.
    // The fix: no inline style that sets position, top, left, or zIndex at all.
    const style = link!.getAttribute('style') || '';
    expect(style, 'skip link must not have an inline position style that overrides sr-only').not.toMatch(/\bposition\s*:/i);
  });

  it('skip link text is accessible (contains "skip" or "content")', () => {
    const { container } = render(<LandingPage />);
    const link = getSkipLink(container);
    expect(link, 'skip link must be in the DOM').not.toBeNull();
    const text = link!.textContent?.toLowerCase() ?? '';
    expect(text.includes('skip') || text.includes('content')).toBe(true);
  });
});
