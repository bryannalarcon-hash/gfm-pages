/**
 * CB-55 / CB-64 — sun logo everywhere + "gofundme redesign" brand links to the deck.
 *
 * CB-55: no cropped-heart GoFundMe mark renders; every brand logo spot shows the masked
 *   rising-sun primitive (asserted via a [data-sun-logo] marker carrying logoMaskStyle's
 *   mask-image). Covers Footer, and the (orphaned but owned) GlobalNav / DeckNav.
 * CB-64: the top-right "gofundme redesign" brand in UnifiedNav is a link to "/" (next/link
 *   → client nav so persona/overlay localStorage state persists), keeping the E2E
 *   aria-label "GoFundMe — home".
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UnifiedNav } from '@/components/shared/UnifiedNav';
import { Footer } from '@/components/shared/Footer';
import { GlobalNav } from '@/components/shared/GlobalNav';
import { DeckNav } from '@/components/landing/DeckNav';
import { LOGO_MASK_URL } from '@/lib/marks/logoMask';

// next/navigation usePathname is used by UnifiedNav/DeckNav — vitest jsdom + the app router
// shim in tests/helpers/setup.ts handle this; if not, these renders surface the gap.

function assertSunLogo(container: HTMLElement, label: string) {
  const sun = container.querySelector('[data-sun-logo]') as HTMLElement | null;
  expect(sun, `${label}: expected a [data-sun-logo] element`).not.toBeNull();
  // The sun primitive is masked via logoMask — assert the mask-image is wired (not a heart svg).
  const style = sun!.getAttribute('style') || '';
  expect(style, `${label}: sun should carry the logo mask-image`).toMatch(/mask-image/i);
}

// ── CB-64 — brand is a link to "/" ──────────────────────────────────────────

describe('CB-64 — UnifiedNav "gofundme redesign" brand links to the deck', () => {
  it('renders the brand/home as an anchor with href="/" (next/link, client nav)', () => {
    render(<UnifiedNav />);
    const home = screen.getByRole('link', { name: 'GoFundMe — home' });
    expect(home.tagName).toBe('A');
    expect(home.getAttribute('href')).toBe('/');
  });

  it('the brand link contains the "gofundme redesign" wordmark', () => {
    render(<UnifiedNav />);
    const home = screen.getByRole('link', { name: 'GoFundMe — home' });
    expect(home.textContent?.toLowerCase()).toContain('gofundme redesign');
  });
});

// ── CB-55 — sun logo everywhere, no heart ────────────────────────────────────

describe('CB-55 — sun logo replaces the cropped-heart mark', () => {
  it('UnifiedNav brand uses the sun mask logo, not a heart', () => {
    const { container } = render(<UnifiedNav />);
    assertSunLogo(container, 'UnifiedNav');
    // No leftover heart svg path.
    expect(container.innerHTML).not.toContain('M12 21s-7.5');
  });

  it('Footer brand uses the sun mask logo, not a heart', () => {
    const { container } = render(<Footer />);
    assertSunLogo(container, 'Footer');
    expect(container.innerHTML).not.toContain('M12 21s-7.5');
  });

  it('GlobalNav brand uses the sun mask logo, not a heart', () => {
    const { container } = render(<GlobalNav />);
    assertSunLogo(container, 'GlobalNav');
    expect(container.innerHTML).not.toContain('M12 21s-7.5');
  });

  it('DeckNav brand uses the sun mask logo, not a heart', () => {
    const { container } = render(<DeckNav />);
    assertSunLogo(container, 'DeckNav');
    // DeckNav's old heart was an inline <path d="M5 1.5C5 1.5 1.5 4.5 ...">
    expect(container.innerHTML).not.toContain('M5 1.5C5 1.5');
  });

  it('the logo mask URL is the rising-sun primitive (sanity)', () => {
    // sun primitive has the half-disc path; ensure logoMask is sun-shaped, not heart.
    expect(LOGO_MASK_URL).toContain('14.4');
  });
});
