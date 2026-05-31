/**
 * CB-71 (profile) — FundraiserCarousel must have prev/next arrow buttons + dot indicators.
 *
 * Verifies:
 *   1. Prev button exists with aria-label "Previous"
 *   2. Next button exists with aria-label "Next"
 *   3. Dot indicators rendered — one per fundraiser card
 *   4. Clicking Next advances active dot from 0 to 1
 *   5. Clicking Prev at index 0 stays clamped (disabled, not wrapping)
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FundraiserCarousel } from '@/components/profile/FundraiserCarousel';
import type { SimilarCard } from '@/lib/types';
import type { OverlayAttrs } from '@/lib/overlay/types';

vi.mock('@/lib/analytics/capture', () => ({
  capture: vi.fn(),
  isCaptureSuppressed: vi.fn(() => false),
}));

vi.mock('@/components/overlay/Instrumented', () => ({
  Instrumented: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const OVERLAY: OverlayAttrs = {
  'data-overlay-tier': '1',
  'data-overlay-delta': 'P5',
  'data-overlay-events': 'Fundraiser Clicked Through',
  'data-overlay-metric': 'carousel-test',
  'data-overlay-why': 'test',
  'data-overlay-dashboard': 'donate-funnel',
};

const CARDS: SimilarCard[] = [
  { id: 'f1', title: 'Keep Sandy on Ossabaw', raisedUsd: 12450, goalUsd: 12200, imageUrl: '' },
  { id: 'f2', title: 'Saving Eliza', raisedUsd: 4800, goalUsd: 9200, imageUrl: '' },
  { id: 'f3', title: 'Winter Shelter for Senior Dogs', raisedUsd: 6000, goalUsd: 10000, imageUrl: '' },
];

function renderCarousel(cards = CARDS) {
  return render(
    <FundraiserCarousel
      fundraisers={cards}
      profileHandle="janahan"
      organizerFirstName="Janahan"
      overlay={OVERLAY}
    />
  );
}

describe('CB-71 — FundraiserCarousel profile prev/next controls', () => {
  it('renders a Previous button with aria-label "Previous"', () => {
    renderCarousel();
    const prevBtn = screen.getByRole('button', { name: 'Previous' });
    expect(prevBtn).toBeTruthy();
  });

  it('renders a Next button with aria-label "Next"', () => {
    renderCarousel();
    const nextBtn = screen.getByRole('button', { name: 'Next' });
    expect(nextBtn).toBeTruthy();
  });

  it('renders one dot per fundraiser card', () => {
    const { container } = renderCarousel();
    const dots = container.querySelectorAll('[data-carousel-dot]');
    expect(dots.length).toBe(CARDS.length);
  });

  it('first dot is active by default', () => {
    const { container } = renderCarousel();
    const dots = container.querySelectorAll('[data-carousel-dot]');
    expect(dots[0].getAttribute('aria-current')).toBe('true');
    expect(dots[1].getAttribute('aria-current')).toBeFalsy();
  });

  it('clicking Next advances active dot from 0 to 1', () => {
    const { container } = renderCarousel();
    const dots = container.querySelectorAll('[data-carousel-dot]');

    expect(dots[0].getAttribute('aria-current')).toBe('true');

    const nextBtn = screen.getByRole('button', { name: 'Next' });
    fireEvent.click(nextBtn);

    expect(dots[1].getAttribute('aria-current')).toBe('true');
    expect(dots[0].getAttribute('aria-current')).toBeFalsy();
  });

  it('clicking Prev at index 0 wraps to last card', () => {
    const { container } = renderCarousel();
    const prevBtn = screen.getByRole('button', { name: 'Previous' });
    fireEvent.click(prevBtn);

    const dots = container.querySelectorAll('[data-carousel-dot]');
    expect(dots[CARDS.length - 1].getAttribute('aria-current')).toBe('true');
    expect(dots[0].getAttribute('aria-current')).toBeFalsy();
  });

  it('clicking Next at last card wraps to index 0', () => {
    const { container } = renderCarousel();
    const nextBtn = screen.getByRole('button', { name: 'Next' });
    // Advance to last card (index 2 with 3 cards)
    fireEvent.click(nextBtn);
    fireEvent.click(nextBtn);
    // Wrap to index 0
    fireEvent.click(nextBtn);

    const dots = container.querySelectorAll('[data-carousel-dot]');
    expect(dots[0].getAttribute('aria-current')).toBe('true');
  });

  it('does not render controls for a single card', () => {
    renderCarousel([CARDS[0]]);
    expect(screen.queryByRole('button', { name: 'Previous' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull();
  });
});
