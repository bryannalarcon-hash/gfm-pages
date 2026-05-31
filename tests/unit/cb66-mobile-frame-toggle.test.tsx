/**
 * CB-66 — MobileFrameToggle pill must only appear on product pages.
 *
 * The mobile-view toggle pill (button[data-mobile-frame-toggle]) must:
 *  - NOT render on '/' (deck)
 *  - NOT render on '/dashboard' (analytics)
 *  - RENDER on '/f/[slug]' (fundraiser product page)
 *  - RENDER on '/communities/[slug]' (community product page)
 *  - RENDER on '/u/[handle]' (profile product page)
 *
 * The frame wrapper (children passthrough) must remain on all routes;
 * only the toggle button (pill) is gated.
 *
 * DEMO_MODE must be 'true' for the toggle to be active — setup.ts sets this globally.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// We use vi.mock at module level and swap usePathname per test via a mutable ref.
let mockPathname = '/';

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

// Force demo mode on for all tests in this file.
beforeEach(() => {
  process.env.NEXT_PUBLIC_DEMO_MODE = 'true';
});

import { MobileFrameToggle } from '@/components/shared/MobileFrameToggle';

function renderToggle(pathname: string, childText = 'page content') {
  mockPathname = pathname;
  return render(
    <MobileFrameToggle>
      <div data-testid="child">{childText}</div>
    </MobileFrameToggle>
  );
}

function getPill(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[data-mobile-frame-toggle]') as HTMLElement | null;
}

describe('CB-66 — MobileFrameToggle pill hidden on non-product routes', () => {
  it('pill is NOT rendered on "/" (deck)', () => {
    const { container } = renderToggle('/');
    expect(getPill(container)).toBeNull();
  });

  it('pill is NOT rendered on "/dashboard"', () => {
    const { container } = renderToggle('/dashboard');
    expect(getPill(container)).toBeNull();
  });

  it('children are still rendered on "/" (frame wrapper passthrough intact)', () => {
    renderToggle('/');
    expect(screen.getByTestId('child')).toBeDefined();
  });

  it('children are still rendered on "/dashboard" (frame wrapper passthrough intact)', () => {
    renderToggle('/dashboard');
    expect(screen.getByTestId('child')).toBeDefined();
  });
});

describe('CB-66 — MobileFrameToggle pill present on product routes', () => {
  it('pill renders on "/f/realtime-alerts-for-wildfire-safety-r5jkk" (fundraiser)', () => {
    const { container } = renderToggle('/f/realtime-alerts-for-wildfire-safety-r5jkk');
    expect(getPill(container)).not.toBeNull();
  });

  it('pill renders on "/communities/watch-duty" (community)', () => {
    const { container } = renderToggle('/communities/watch-duty');
    expect(getPill(container)).not.toBeNull();
  });

  it('pill renders on "/u/janahan" (profile)', () => {
    const { container } = renderToggle('/u/janahan');
    expect(getPill(container)).not.toBeNull();
  });

  it('children are still rendered on a product route', () => {
    renderToggle('/f/some-campaign');
    expect(screen.getByTestId('child')).toBeDefined();
  });
});
