/**
 * CB-71 — ShareStudio carousel must have prev/next arrow buttons + dot indicators.
 *
 * Verifies:
 *   1. Prev button exists with aria-label "Previous"
 *   2. Next button exists with aria-label "Next"
 *   3. Dot indicators are rendered (one per card)
 *   4. Clicking Next advances the active index (dot changes active state)
 *   5. Clicking Prev when at index 0 wraps to last card
 *   6. Clicking Next when at last card wraps to index 0
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShareStudio } from '@/components/community/ShareStudio';
import { OverlayProvider } from '@/lib/overlay/context';
import type { ShareChannel, PageContext } from '@/lib/types';

// ---------------------------------------------------------------------------
// Stubs
// ---------------------------------------------------------------------------

vi.mock('@/lib/analytics/capture', () => ({
  capture: vi.fn(),
  isCaptureSuppressed: vi.fn(() => false),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PAGE_CTX: PageContext = {
  page: 'community',
  communityId: 'comm-test-cb71',
  referrerSource: 'community_share',
  pageState: {},
};

const SHARE_COPY: Partial<Record<ShareChannel, string>> = {
  whatsapp: 'Test community share copy for CB-71 WhatsApp.',
  x: 'Test community share copy for CB-71 X.',
};

function renderStudio() {
  return render(
    <OverlayProvider>
      <ShareStudio
        communityName="Watch Duty"
        raisedUsd={4_200_000}
        fundraiserCount={312}
        followerCount={1247}
        shareCopy={SHARE_COPY}
        communityId="comm-test-cb71"
        pageCtx={PAGE_CTX}
      />
    </OverlayProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CB-71 — ShareStudio carousel prev/next controls', () => {
  it('renders a Previous button with aria-label "Previous"', () => {
    renderStudio();
    const prevBtn = screen.getByRole('button', { name: 'Previous' });
    expect(prevBtn).toBeTruthy();
  });

  it('renders a Next button with aria-label "Next"', () => {
    renderStudio();
    const nextBtn = screen.getByRole('button', { name: 'Next' });
    expect(nextBtn).toBeTruthy();
  });

  it('renders dot indicators — one per card', () => {
    const { container } = renderStudio();
    // dots container holds one dot per card (2 channels = 2 dots)
    const dots = container.querySelectorAll('[data-carousel-dot]');
    expect(dots.length).toBe(2);
  });

  it('clicking Next advances the active dot from 0 to 1', () => {
    const { container } = renderStudio();
    const dots = container.querySelectorAll('[data-carousel-dot]');
    // Initially first dot is active
    expect(dots[0].getAttribute('aria-current')).toBe('true');
    expect(dots[1].getAttribute('aria-current')).not.toBe('true');

    const nextBtn = screen.getByRole('button', { name: 'Next' });
    fireEvent.click(nextBtn);

    // After clicking Next, second dot becomes active
    expect(dots[1].getAttribute('aria-current')).toBe('true');
    expect(dots[0].getAttribute('aria-current')).not.toBe('true');
  });

  it('clicking Next at last card wraps to index 0', () => {
    const { container } = renderStudio();
    const nextBtn = screen.getByRole('button', { name: 'Next' });

    // Advance to last card (index 1 with 2 cards)
    fireEvent.click(nextBtn);
    // Wrap back to index 0
    fireEvent.click(nextBtn);

    const dots = container.querySelectorAll('[data-carousel-dot]');
    expect(dots[0].getAttribute('aria-current')).toBe('true');
  });

  it('clicking Prev at index 0 wraps to last card', () => {
    const { container } = renderStudio();
    const prevBtn = screen.getByRole('button', { name: 'Previous' });
    fireEvent.click(prevBtn);

    // Should wrap to last card (index 1 with 2 cards)
    const dots = container.querySelectorAll('[data-carousel-dot]');
    expect(dots[1].getAttribute('aria-current')).toBe('true');
    expect(dots[0].getAttribute('aria-current')).not.toBe('true');
  });
});
