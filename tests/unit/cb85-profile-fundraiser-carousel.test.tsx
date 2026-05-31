/**
 * CB-85 — Profile FundraiserCarousel must have prev/next arrow buttons + dot indicators.
 *
 * Verifies:
 *   1. Prev button exists with aria-label "Previous"
 *   2. Next button exists with aria-label "Next"
 *   3. Clicking Next advances the active index (dot changes active state)
 *   4. Clicking Prev at index 0 wraps to last card
 *   5. Clicking Next at last card wraps to index 0
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FundraiserCarousel } from '@/components/profile/FundraiserCarousel';
import { OverlayProvider } from '@/lib/overlay/context';
import type { SimilarCard } from '@/lib/types';
import type { OverlayAttrs } from '@/lib/overlay/types';

vi.mock('@/lib/analytics/capture', () => ({
  capture: vi.fn(),
  isCaptureSuppressed: vi.fn(() => false),
}));

const FUNDRAISERS: SimilarCard[] = [
  { id: 'f1', title: 'Keep Sandy on Ossabaw', raisedUsd: 12450, goalUsd: 12200, imageUrl: '' },
  { id: 'f2', title: 'Saving Eliza', raisedUsd: 4800, goalUsd: 9200, imageUrl: '' },
  { id: 'f3', title: 'Watch Duty Relief', raisedUsd: 2200, goalUsd: 5000, imageUrl: '' },
];

const OVERLAY: OverlayAttrs = {
  'data-overlay-tier': '1',
  'data-overlay-events': 'Fundraiser Clicked Through',
  'data-overlay-delta': 'P5',
  'data-overlay-metric': 'Carousel',
  'data-overlay-why': 'test',
  'data-overlay-dashboard': 'donate-funnel',
};

function renderCarousel() {
  return render(
    <OverlayProvider>
      <FundraiserCarousel
        fundraisers={FUNDRAISERS}
        profileHandle="janahan"
        organizerFirstName="Janahan"
        overlay={OVERLAY}
      />
    </OverlayProvider>,
  );
}

describe('CB-85 — FundraiserCarousel prev/next controls', () => {
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

  it('renders dot indicators — one per fundraiser', () => {
    const { container } = renderCarousel();
    const dots = container.querySelectorAll('[data-carousel-dot]');
    expect(dots.length).toBe(FUNDRAISERS.length);
  });

  it('clicking Next advances the active dot from 0 to 1', () => {
    const { container } = renderCarousel();
    const dots = container.querySelectorAll('[data-carousel-dot]');
    expect(dots[0].getAttribute('aria-current')).toBe('true');
    expect(dots[1].getAttribute('aria-current')).not.toBe('true');

    const nextBtn = screen.getByRole('button', { name: 'Next' });
    fireEvent.click(nextBtn);

    expect(dots[1].getAttribute('aria-current')).toBe('true');
    expect(dots[0].getAttribute('aria-current')).not.toBe('true');
  });

  it('clicking Next at last card wraps to index 0', () => {
    const { container } = renderCarousel();
    const nextBtn = screen.getByRole('button', { name: 'Next' });
    // Advance through all cards
    fireEvent.click(nextBtn); // → 1
    fireEvent.click(nextBtn); // → 2
    fireEvent.click(nextBtn); // → 0 (wrap)

    const dots = container.querySelectorAll('[data-carousel-dot]');
    expect(dots[0].getAttribute('aria-current')).toBe('true');
  });

  it('clicking Prev at index 0 wraps to last card', () => {
    const { container } = renderCarousel();
    const prevBtn = screen.getByRole('button', { name: 'Previous' });
    fireEvent.click(prevBtn);

    const dots = container.querySelectorAll('[data-carousel-dot]');
    expect(dots[FUNDRAISERS.length - 1].getAttribute('aria-current')).toBe('true');
    expect(dots[0].getAttribute('aria-current')).not.toBe('true');
  });
});
