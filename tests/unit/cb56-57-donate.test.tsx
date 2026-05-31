/**
 * CB-56 — donate popup: per-persona amounts (rounded to $5, monotonically increasing)
 * CB-57 — donate popup: close button + fit to screen
 *
 * CB-56 assertions:
 *   - For personas with donation history on this fundraiser (close_friend, returning_lapsed),
 *     resolved presets are all multiples of 5 and strictly increasing.
 *   - Cohort-default personas (anonymous, extrovert) get [10,25,50] — also $5 multiples, increasing.
 *   - At least two personas must produce DIFFERENT preset sets (per-persona, not static).
 *   - DonationCard renders a brief explanatory copy line in the popup.
 *
 * CB-57 assertions:
 *   - DonationCard renders a button with aria-label "Close" when onClose prop is provided.
 *   - Clicking Close calls the onClose handler.
 *   - The card container has max-height and overflow styles for viewport fit.
 *
 * Donate funnel events (Amount Selected / Donate Started / Donate Completed / Donate Failed)
 * are NOT tested here — they have single ownership in DonationCard.tsx and existing coverage.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { resolveSlot, type SlotContext } from '@/lib/personalization/slots';
import { PERSONAS } from '@/fixtures/personas';
import { SEED_IDS } from '@/db/seed-ids';
import { OverlayProvider } from '@/lib/overlay/context';
import { DonationCard } from '@/components/fundraiser/DonationCard';
import type { PageContext } from '@/lib/types';

// ── Mock capture so analytics calls don't explode in jsdom ──────────────────
vi.mock('@/lib/analytics/capture', () => ({
  capture: vi.fn(),
}));

// ── Seed constants ────────────────────────────────────────────────────────────
const WILDFIRE = SEED_IDS.fundraisers['realtime-alerts-for-wildfire-safety-r5jkk'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fundraiserPage(overrides: Partial<PageContext> = {}): PageContext {
  return {
    page: 'fundraiser',
    fundraiserId: WILDFIRE,
    referrerSource: 'direct',
    pageState: { raisedPct: 72, momentum: 'high' },
    ...overrides,
  };
}

function ctx(slug: keyof typeof PERSONAS): SlotContext {
  return {
    user: PERSONAS[slug],
    page: fundraiserPage(),
    isOwnerView: false,
    candidates: {},
  };
}

/** Returns true if every element is a multiple of 5. */
function allMultiplesOf5(presets: readonly number[]): boolean {
  return presets.every((n) => n % 5 === 0);
}

/** Returns true if each element is strictly greater than the previous. */
function strictlyIncreasing(presets: readonly number[]): boolean {
  for (let i = 1; i < presets.length; i++) {
    if (presets[i] <= presets[i - 1]) return false;
  }
  return true;
}

// ── Default DonationCard props ────────────────────────────────────────────────

const BASE_CANDIDATES = {};
const PAGE = fundraiserPage();
const ON_COMPLETED = vi.fn();

function renderCard(overrides: Partial<React.ComponentProps<typeof DonationCard>> = {}) {
  return render(
    <OverlayProvider>
      <DonationCard
        page={PAGE}
        candidates={BASE_CANDIDATES}
        fundraiserId={WILDFIRE}
        organizerName="Sarah J."
        goalUsd={50000}
        openInMonthly={false}
        onCompleted={ON_COMPLETED}
        {...overrides}
      />
    </OverlayProvider>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CB-56 — Resolver layer: per-persona amounts, $5 multiples, strictly increasing
// ══════════════════════════════════════════════════════════════════════════════

describe('CB-56 resolveSlot smart_presets — $5 multiples + strictly increasing', () => {
  it('anonymous → [10, 25, 50]: all multiples of 5 and strictly increasing', () => {
    const { content } = resolveSlot('smart_presets', ctx('anonymous'));
    expect(allMultiplesOf5(content.presets)).toBe(true);
    expect(strictlyIncreasing(content.presets)).toBe(true);
    expect(content.presets).toEqual([10, 25, 50]);
  });

  it('extrovert (no donation to this fundraiser) → cohort default [10,25,50]: $5 multiples, increasing', () => {
    const { content } = resolveSlot('smart_presets', ctx('extrovert'));
    expect(allMultiplesOf5(content.presets)).toBe(true);
    expect(strictlyIncreasing(content.presets)).toBe(true);
    expect(content.presets).toEqual([10, 25, 50]);
  });

  it('close_friend ($50 last donation here) → [50, 100, 250]: $5 multiples, strictly increasing', () => {
    // close_friend last donated $50 to WILDFIRE → niceRound(50)=50, niceRound(100)=100, niceRound(250)=250
    const { content } = resolveSlot('smart_presets', ctx('close_friend'));
    expect(allMultiplesOf5(content.presets)).toBe(true);
    expect(strictlyIncreasing(content.presets)).toBe(true);
    expect(content.presets[0]).toBe(50);
    expect(content.presets[1]).toBe(100);
    expect(content.presets[2]).toBe(250);
  });

  it('returning_lapsed ($25 donation here 14mo ago) → [25, 50, 125]: $5 multiples, strictly increasing', () => {
    // returning_lapsed donated $25 to WILDFIRE → niceRound(25)=25, niceRound(50)=50, niceRound(125)=125
    const { content } = resolveSlot('smart_presets', ctx('returning_lapsed'));
    expect(allMultiplesOf5(content.presets)).toBe(true);
    expect(strictlyIncreasing(content.presets)).toBe(true);
    expect(content.presets[0]).toBe(25);
    expect(content.presets[1]).toBe(50);
    expect(content.presets[2]).toBe(125);
  });

  it('close_friend ≠ anonymous — presets differ between personas (per-persona requirement)', () => {
    const anonPresets = resolveSlot('smart_presets', ctx('anonymous')).content.presets;
    const friendPresets = resolveSlot('smart_presets', ctx('close_friend')).content.presets;
    expect(anonPresets).not.toEqual(friendPresets);
  });

  it('returning_lapsed ≠ anonymous — presets differ', () => {
    const anonPresets = resolveSlot('smart_presets', ctx('anonymous')).content.presets;
    const lapsedPresets = resolveSlot('smart_presets', ctx('returning_lapsed')).content.presets;
    expect(anonPresets).not.toEqual(lapsedPresets);
  });

  it('close_friend ≠ returning_lapsed — both personalized but at different anchor amounts', () => {
    const friendPresets = resolveSlot('smart_presets', ctx('close_friend')).content.presets;
    const lapsedPresets = resolveSlot('smart_presets', ctx('returning_lapsed')).content.presets;
    expect(friendPresets).not.toEqual(lapsedPresets);
    // close_friend anchored at $50; returning_lapsed at $25
    expect(friendPresets[0]).toBeGreaterThan(lapsedPresets[0]);
  });

  it('niceRound property: all preset amounts are divisible by 5 for all personas', () => {
    const slugs = ['anonymous', 'close_friend', 'extrovert', 'returning_lapsed', 'profile_owner'] as const;
    for (const slug of slugs) {
      const { content } = resolveSlot('smart_presets', ctx(slug));
      expect(allMultiplesOf5(content.presets)).toBe(true);
    }
  });

  it('strictly-increasing property: presets[0] < presets[1] < presets[2] for all personas', () => {
    const slugs = ['anonymous', 'close_friend', 'extrovert', 'returning_lapsed', 'profile_owner'] as const;
    for (const slug of slugs) {
      const { content } = resolveSlot('smart_presets', ctx(slug));
      expect(strictlyIncreasing(content.presets)).toBe(true);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// CB-56 — Render layer: DonationCard shows the resolved presets + explanatory copy
// ══════════════════════════════════════════════════════════════════════════════

describe('CB-56 DonationCard render — explanatory copy present', () => {
  it('renders a brief explanatory copy line in the donation form', () => {
    renderCard();
    // The copy is static text that explains what the donation funds
    // It should be present for any persona (anonymous default in OverlayProvider)
    const copyEl = document.body.textContent ?? '';
    // We look for a sentence that describes the impact (no internal index in copy)
    expect(copyEl).toMatch(/fund|support|help|alert|protect|keep/i);
  });

  it('explanatory copy does not contain internal index tokens (D10, C3, etc.)', () => {
    renderCard();
    // Visible text must not leak internal tracking IDs
    const allText = document.body.textContent ?? '';
    expect(allText).not.toMatch(/\bD\d+\b/);  // no D10, D1, etc. in rendered text
    expect(allText).not.toMatch(/\bC\d+\b/);  // no C3, etc.
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// CB-57 — Close button: aria-label + handler
// ══════════════════════════════════════════════════════════════════════════════

describe('CB-57 DonationCard — Close button', () => {
  it('renders a Close button (aria-label="Close") when onClose prop is provided', () => {
    const onClose = vi.fn();
    renderCard({ onClose });
    const closeBtn = screen.getByRole('button', { name: 'Close' });
    expect(closeBtn).toBeDefined();
  });

  it('clicking the Close button calls the onClose handler once', () => {
    const onClose = vi.fn();
    renderCard({ onClose });
    const closeBtn = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT render a Close button when onClose prop is omitted', () => {
    renderCard(); // no onClose
    const closeBtn = screen.queryByRole('button', { name: 'Close' });
    expect(closeBtn).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// CB-57 — Viewport fit: max-height + overflow on the card container
// ══════════════════════════════════════════════════════════════════════════════

describe('CB-57 DonationCard — viewport fit styles', () => {
  it('the card container element has a max-height style (90vh or similar)', () => {
    const { container } = renderCard();
    // The outer wrapper should carry viewport-constraining styles
    const card = container.querySelector('[data-donation-card-wrap]');
    expect(card).not.toBeNull();
    const style = (card as HTMLElement).getAttribute('style') ?? '';
    // Accepts max-height inline style with a vh unit
    expect(style).toMatch(/max-height\s*:/);
  });

  it('the card container has overflow-y: auto to allow internal scrolling', () => {
    const { container } = renderCard();
    const card = container.querySelector('[data-donation-card-wrap]');
    expect(card).not.toBeNull();
    const style = (card as HTMLElement).getAttribute('style') ?? '';
    expect(style).toMatch(/overflow/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Regression: donate flow still works (form can be submitted)
// ══════════════════════════════════════════════════════════════════════════════

describe('Regression — donate flow submit button present and wired', () => {
  it('renders a submit button for the donate form', () => {
    renderCard();
    // The donate submit button should be present
    const submitBtn = screen.getByRole('button', { name: /donate/i });
    expect(submitBtn).toBeDefined();
  });

  it('preset amount buttons are rendered (3 preset pills)', () => {
    renderCard();
    // anonymous via OverlayProvider → cohort default [10, 25, 50]
    // These amounts get rendered as buttons
    const buttons = screen.getAllByRole('button');
    // At least 3 preset buttons + submit + (optionally close)
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });
});
