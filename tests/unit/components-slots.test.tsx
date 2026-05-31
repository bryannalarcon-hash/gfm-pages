/**
 * Component tests for slots/* and PersonalizedSlot
 * Covers:
 *  - Each slot renders both populated and null/empty states WITHOUT unmounting its region
 *  - SmartPresets always renders
 *  - The never-unmount rule: region node exists even when content===null
 */
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// ── Provider wrapper (Overlay context) ──────────────────────────────────────
// Components using useOverlay need the provider
import { OverlayProvider } from '@/lib/overlay/context';
import type { OverlayAttrs } from '@/lib/overlay/types';
import type { SlotComponentProps } from '@/lib/personalization/slots';

// ── Component imports ────────────────────────────────────────────────────────
import { ReturningBanner } from '@/components/slots/ReturningBanner';
import { SmartPresets } from '@/components/slots/SmartPresets';
import { SimilarCarousel } from '@/components/slots/SimilarCarousel';
import { WhatYouMissedFeed } from '@/components/slots/WhatYouMissedFeed';
import { PymkPanel } from '@/components/slots/PymkPanel';
import { RecurringNudge } from '@/components/slots/RecurringNudge';

const OVERLAY: OverlayAttrs = {
  'data-overlay-tier': '1',
  'data-overlay-events': 'Page Viewed',
  'data-overlay-delta': 'D1',
  'data-overlay-metric': 'test-metric',
  'data-overlay-why': 'test rationale',
  'data-overlay-dashboard': 'donate-funnel',
};

function Wrapper({ children }: { children: React.ReactNode }) {
  return <OverlayProvider>{children}</OverlayProvider>;
}

// ── ReturningBanner ──────────────────────────────────────────────────────────

describe('ReturningBanner — never unmounts region', () => {
  it('renders the slot region when content is null (collapsed placeholder still in DOM)', () => {
    const { container } = render(
      <Wrapper>
        <ReturningBanner
          data={{ name: 'returning_banner', content: null }}
          overlay={OVERLAY}
        />
      </Wrapper>
    );
    // The data-slot attribute should be present regardless of content
    const slot = container.querySelector('[data-slot="returning_banner"]');
    expect(slot).not.toBeNull();
  });

  it('renders the slot region with content when populated', () => {
    const content = { firstName: 'Sarah', summaryLine: 'You have updates.', href: '#updates' };
    render(
      <Wrapper>
        <ReturningBanner
          data={{ name: 'returning_banner', content }}
          overlay={OVERLAY}
        />
      </Wrapper>
    );
    expect(screen.getByText(/Welcome back, Sarah/)).toBeDefined();
    expect(screen.getByText(/You have updates/)).toBeDefined();
  });

  it('null content has height:0 style (sanctioned collapse, not unmount)', () => {
    const { container } = render(
      <Wrapper>
        <ReturningBanner
          data={{ name: 'returning_banner', content: null }}
          overlay={OVERLAY}
        />
      </Wrapper>
    );
    const slot = container.querySelector('[data-slot="returning_banner"]') as HTMLElement;
    expect(slot).not.toBeNull();
    // Sanctioned zero-height collapse
    expect(slot.style.height).toBe('0px');
  });
});

// ── SmartPresets — always renders ───────────────────────────────────────────

describe('SmartPresets — always renders, never null content', () => {
  it('renders three preset amount buttons', () => {
    render(
      <Wrapper>
        <SmartPresets
          data={{ name: 'smart_presets', content: { presets: [10, 25, 50], selectedIndex: 1 } }}
          overlay={OVERLAY}
        />
      </Wrapper>
    );
    expect(screen.getByText('$10')).toBeDefined();
    expect(screen.getByText('$25')).toBeDefined();
    expect(screen.getByText('$50')).toBeDefined();
  });

  it('renders a "Custom amount" button', () => {
    render(
      <Wrapper>
        <SmartPresets
          data={{ name: 'smart_presets', content: { presets: [10, 25, 50], selectedIndex: 1 } }}
          overlay={OVERLAY}
        />
      </Wrapper>
    );
    expect(screen.getByText('Custom amount')).toBeDefined();
  });

  it('renders the slot data-slot attribute', () => {
    const { container } = render(
      <Wrapper>
        <SmartPresets
          data={{ name: 'smart_presets', content: { presets: [10, 25, 50], selectedIndex: 1 } }}
          overlay={OVERLAY}
        />
      </Wrapper>
    );
    const slot = container.querySelector('[data-slot="smart_presets"]');
    expect(slot).not.toBeNull();
  });

  it('pre-selects the button at selectedIndex', () => {
    render(
      <Wrapper>
        <SmartPresets
          data={{ name: 'smart_presets', content: { presets: [15, 40, 100], selectedIndex: 2 } }}
          overlay={OVERLAY}
        />
      </Wrapper>
    );
    // The button at index 2 ($100) should be aria-pressed=true
    const buttons = screen.getAllByRole('button');
    const hundredBtn = buttons.find(b => b.textContent?.includes('100'));
    expect(hundredBtn?.getAttribute('aria-pressed')).toBe('true');
  });
});

// ── SimilarCarousel — never unmounts ────────────────────────────────────────

describe('SimilarCarousel — region always present', () => {
  it('renders the slot region with cards', async () => {
    // Dynamic import to check actual component
    const { SimilarCarousel: SCarousel } = await import('@/components/slots/SimilarCarousel');
    const cards = [
      { id: 'c1', title: 'Test Fundraiser', raisedUsd: 1000, goalUsd: 5000, imageUrl: '' },
    ];
    const { container } = render(
      <Wrapper>
        <SCarousel
          data={{ name: 'similar_carousel', content: { cards, source: 'trending' } }}
          overlay={OVERLAY}
        />
      </Wrapper>
    );
    const slot = container.querySelector('[data-slot="similar_carousel"]');
    expect(slot).not.toBeNull();
  });

  it('renders the slot region even with empty cards array', async () => {
    const { SimilarCarousel: SCarousel } = await import('@/components/slots/SimilarCarousel');
    const { container } = render(
      <Wrapper>
        <SCarousel
          data={{ name: 'similar_carousel', content: { cards: [], source: 'trending' } }}
          overlay={OVERLAY}
        />
      </Wrapper>
    );
    const slot = container.querySelector('[data-slot="similar_carousel"]');
    expect(slot).not.toBeNull();
  });
});

// ── WhatYouMissedFeed — region always present ─────────────────────────────

describe('WhatYouMissedFeed — never unmounts region', () => {
  it('renders the slot region when content is null', async () => {
    const { WhatYouMissedFeed: WFeed } = await import('@/components/slots/WhatYouMissedFeed');
    const { container } = render(
      <Wrapper>
        <WFeed
          data={{ name: 'what_you_missed', content: null }}
          overlay={OVERLAY}
        />
      </Wrapper>
    );
    const slot = container.querySelector('[data-slot="what_you_missed"]');
    expect(slot).not.toBeNull();
  });

  it('renders the slot region with activity rows when populated', async () => {
    const { WhatYouMissedFeed: WFeed } = await import('@/components/slots/WhatYouMissedFeed');
    const rows = [
      { verb: 'UPDATED' as const, title: 'Wildfire update', byline: 'Sarah J.', href: '#update', ageDays: 2 },
    ];
    const { container } = render(
      <Wrapper>
        <WFeed
          data={{ name: 'what_you_missed', content: { newCount: 1, rows } }}
          overlay={OVERLAY}
        />
      </Wrapper>
    );
    const slot = container.querySelector('[data-slot="what_you_missed"]');
    expect(slot).not.toBeNull();
  });
});

// ── PymkPanel — region always present ───────────────────────────────────────

describe('PymkPanel — never unmounts region', () => {
  it('renders the slot region with empty cards', async () => {
    const { PymkPanel: Panel } = await import('@/components/slots/PymkPanel');
    const { container } = render(
      <Wrapper>
        <Panel
          data={{ name: 'pymk_panel', content: { cards: [], ranked: 'default' } }}
          overlay={OVERLAY}
        />
      </Wrapper>
    );
    const slot = container.querySelector('[data-slot="pymk_panel"]');
    expect(slot).not.toBeNull();
  });

  it('renders cards when provided', async () => {
    const { PymkPanel: Panel } = await import('@/components/slots/PymkPanel');
    const cards = [
      { id: 'p1', name: 'Alex T.', avatar: { bg: '#fff', fg: '#000', initial: 'A' }, rankPosition: 1 },
    ];
    render(
      <Wrapper>
        <Panel
          data={{ name: 'pymk_panel', content: { cards, ranked: 'graph' } }}
          overlay={OVERLAY}
        />
      </Wrapper>
    );
    expect(screen.getByText('Alex T.')).toBeDefined();
  });
});

// ── RecurringNudge — region always present ───────────────────────────────────

describe('RecurringNudge — never unmounts region', () => {
  it('renders the slot region when content is null', async () => {
    const { RecurringNudge: Nudge } = await import('@/components/slots/RecurringNudge');
    const { container } = render(
      <Wrapper>
        <Nudge
          data={{ name: 'recurring_nudge', content: null }}
          overlay={OVERLAY}
        />
      </Wrapper>
    );
    const slot = container.querySelector('[data-slot="recurring_nudge"]');
    expect(slot).not.toBeNull();
  });

  it('renders the organizer name when content is populated', async () => {
    const { RecurringNudge: Nudge } = await import('@/components/slots/RecurringNudge');
    render(
      <Wrapper>
        <Nudge
          data={{ name: 'recurring_nudge', content: { organizerName: 'Sarah J.', donationCount: 3 } }}
          overlay={OVERLAY}
        />
      </Wrapper>
    );
    expect(screen.getByText(/Sarah J\./)).toBeDefined();
  });
});
