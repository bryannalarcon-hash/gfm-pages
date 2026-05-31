/**
 * CB-58 — mobile-view toggle on all pages (demo-gated).
 *
 * A NEXT_PUBLIC_DEMO_MODE-gated control wraps the layout's {children} into a
 * centered mobile "phone" frame so any page renders at mobile width (triggering
 * the pages' existing responsive CSS + SunsLayer mobile scatter). The faded
 * background suns must still show inside the frame.
 *
 * Acceptance:
 *  - Toggle button renders ONLY in demo mode; returns null otherwise.
 *  - Children always render (off OR on) — never breaks the page.
 *  - Toggling ON adds a [data-mobile-frame="on"] wrapper that constrains width.
 *  - Toggling OFF returns to full-width (no mobile-frame wrapper).
 *  - The toggle carries data-overlay-ignore so the overlay scan skips it.
 *  - The toggle does not sit bottom-right (overlay pill) or bottom-left (suns slider).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MobileFrameToggle } from '@/components/shared/MobileFrameToggle';

// CB-66: the pill is now route-gated (product pages only). These CB-58 behaviour tests
// exercise the pill, so render under a product route. usePathname() is unmocked-null in
// jsdom otherwise → pill hidden → tests can't find it.
vi.mock('next/navigation', () => ({
  usePathname: () => '/f/test-fundraiser',
}));

const PAGE = <main data-testid="page-content">Fundraiser page</main>;

afterEach(() => {
  cleanup();
});

describe('MobileFrameToggle — demo mode ON', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_DEMO_MODE = 'true';
  });

  it('renders the toggle button in demo mode', () => {
    render(<MobileFrameToggle>{PAGE}</MobileFrameToggle>);
    expect(screen.getByRole('button', { name: /mobile/i })).toBeInTheDocument();
  });

  it('always renders children (default OFF — full width, no frame)', () => {
    const { container } = render(<MobileFrameToggle>{PAGE}</MobileFrameToggle>);
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
    // Off → no mobile frame wrapper present (or it reads "off").
    const frame = container.querySelector('[data-mobile-frame]');
    expect(frame).toBeNull();
  });

  it('toggling ON adds a [data-mobile-frame="on"] wrapper that constrains width', () => {
    const { container } = render(<MobileFrameToggle>{PAGE}</MobileFrameToggle>);
    fireEvent.click(screen.getByRole('button', { name: /mobile/i }));

    const frame = container.querySelector('[data-mobile-frame="on"]') as HTMLElement | null;
    expect(frame).not.toBeNull();
    // The frame constrains width to a phone-ish size (inline style, ~390px).
    const maxW = frame!.style.maxWidth || frame!.style.width;
    expect(maxW).toMatch(/px|rem/);
    // CB-96: the frame's "screen" is now a real <iframe> loading the same route at phone width
    // (so the page gets a true narrow viewport → real mobile breakpoints; the old wrap-children
    // approach squeezed the desktop layout). The page renders INSIDE the iframe document, not in
    // the parent DOM — so assert the iframe screen exists rather than the children inline.
    const screen2 = frame!.querySelector('iframe[data-mobile-frame-screen]') as HTMLIFrameElement | null;
    expect(screen2).not.toBeNull();
  });

  it('toggling OFF again removes the mobile frame (back to full width)', () => {
    const { container } = render(<MobileFrameToggle>{PAGE}</MobileFrameToggle>);
    const btn = screen.getByRole('button', { name: /mobile/i });
    fireEvent.click(btn); // on
    expect(container.querySelector('[data-mobile-frame="on"]')).not.toBeNull();
    fireEvent.click(btn); // off
    expect(container.querySelector('[data-mobile-frame="on"]')).toBeNull();
    // Children still present after toggling off.
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
  });

  it('the toggle reflects pressed state via aria-pressed', () => {
    render(<MobileFrameToggle>{PAGE}</MobileFrameToggle>);
    const btn = screen.getByRole('button', { name: /mobile/i });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('carries data-overlay-ignore so the overlay scan skips it', () => {
    render(<MobileFrameToggle>{PAGE}</MobileFrameToggle>);
    const btn = screen.getByRole('button', { name: /mobile/i });
    expect(btn).toHaveAttribute('data-overlay-ignore');
  });

  it('does not sit at the overlay-pill corner (bottom-right) or suns-slider corner (bottom-left)', () => {
    render(<MobileFrameToggle>{PAGE}</MobileFrameToggle>);
    const btn = screen.getByRole('button', { name: /mobile/i }) as HTMLElement;
    // Must be fixed-positioned chrome that is NOT pinned to both bottom + (left|right).
    expect(btn.style.position).toBe('fixed');
    const atBottom = btn.style.bottom !== '' && btn.style.bottom !== 'auto';
    const atLeft = btn.style.left !== '' && btn.style.left !== 'auto';
    const atRight = btn.style.right !== '' && btn.style.right !== 'auto';
    // Not bottom-left (suns slider) and not bottom-right (overlay pill).
    expect(atBottom && atLeft).toBe(false);
    expect(atBottom && atRight).toBe(false);
  });

  it('does not render a bare internal index (e.g. "CB-58" / "W") in the visible label', () => {
    render(<MobileFrameToggle>{PAGE}</MobileFrameToggle>);
    const btn = screen.getByRole('button', { name: /mobile/i });
    expect(btn.textContent ?? '').not.toMatch(/CB-?\d+/i);
  });
});

describe('MobileFrameToggle — demo mode OFF', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_DEMO_MODE = 'false';
  });
  afterEach(() => {
    process.env.NEXT_PUBLIC_DEMO_MODE = 'true';
  });

  it('does NOT render the toggle button when demo mode is off', () => {
    render(<MobileFrameToggle>{PAGE}</MobileFrameToggle>);
    expect(screen.queryByRole('button', { name: /mobile/i })).toBeNull();
  });

  it('still renders children full-width when demo mode is off', () => {
    const { container } = render(<MobileFrameToggle>{PAGE}</MobileFrameToggle>);
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
    expect(container.querySelector('[data-mobile-frame="on"]')).toBeNull();
  });
});
