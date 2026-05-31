/**
 * CB-16 — ShareSpread must render owner-voice (first-person) copy when the current
 * persona is the profile owner, and third-person supporter copy for all other personas.
 *
 * These tests go RED before the implementation and GREEN after.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OverlayProvider } from '@/lib/overlay/context';
import type { PersonaFixture } from '@/lib/personas/types';
import type { OverlayAttrs } from '@/lib/overlay/types';

// ── Static copy constants (must match what ShareSpread exports/uses) ──────────
// These are the owner-tone strings we expect after implementation.
const OWNER_WHATSAPP =
  "I've been organizing fundraisers for causes close to me — would mean a lot if you followed along and shared. 🙏";
const OWNER_EMAIL =
  "I wanted to share my GoFundMe profile with you — it's where I keep all the causes I'm organizing for. Would love your support…";

// CB-98: PROFILE_SHARE_COPY is now the primary copy source for non-owner personas.
// Supporter (close_friend) sees PROFILE_SHARE_COPY['close_friend'] copy, not the
// AI_WHATSAPP/AI_EMAIL prop strings, because the fixture takes priority.

import { PROFILE_SHARE_COPY } from '@/fixtures/shareCopyProfileCommunity';

// ── Fixture stubs ─────────────────────────────────────────────────────────────
const PROFILE_OWNER_FIXTURE: PersonaFixture = {
  slug: 'profile_owner',
  name: 'Janahan S.',
  authenticated: true,
  isProfileOwner: true,
  referrerSource: 'direct',
  follows: {
    fundraiserIds: [],
    organizerProfileIds: [],
    communityIds: [],
    counts: { profiles: 38, fundraisers: 5, communities: 0 },
  },
  donations: [],
  lastVisit: { monthsAgo: 0, onThisPage: true },
  avatar: { bg: '#232323', fg: '#ffffff', initial: 'J' },
};

const SUPPORTER_FIXTURE: PersonaFixture = {
  slug: 'close_friend',
  name: 'Sarah K.',
  authenticated: true,
  isProfileOwner: false,
  referrerSource: 'email',
  follows: {
    fundraiserIds: [],
    organizerProfileIds: [],
    communityIds: [],
    counts: { profiles: 1, fundraisers: 5, communities: 0 },
  },
  donations: [],
  lastVisit: { monthsAgo: 0, onThisPage: true },
  avatar: { bg: '#ffd863', fg: '#68570d', initial: 'S' },
};

// ── Module mock — swap usePersona return value per test ───────────────────────
// We mock the whole @/lib/overlay/context module, keeping real OverlayProvider
// (used by Instrumented inside ShareSpread) but controlling usePersona output.
vi.mock('@/lib/overlay/context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/overlay/context')>();
  return {
    ...actual,
    // usePersona is replaced; tests call mockUsePersona.mockReturnValue(fixture)
    usePersona: vi.fn(),
  };
});

// Grab the mock handle AFTER vi.mock is hoisted
import * as overlayCtx from '@/lib/overlay/context';
const mockUsePersona = overlayCtx.usePersona as ReturnType<typeof vi.fn>;

// ── ShareSpread import (after mock is established) ────────────────────────────
import { ShareSpread } from '@/components/profile/ShareSpread';

// ── Test helpers ──────────────────────────────────────────────────────────────
const OVERLAY: OverlayAttrs = {
  'data-overlay-tier': '2',
  'data-overlay-events': 'Share Clicked',
  'data-overlay-delta': 'D1',
  'data-overlay-metric': 'share-studio',
  'data-overlay-why': 'test',
  'data-overlay-dashboard': 'share-trends',
};

const AI_WHATSAPP = 'AI-generated third-person WhatsApp copy for Janahan S.';
const AI_EMAIL = 'AI-generated third-person email copy for Janahan S.';

function renderShareSpread(persona: PersonaFixture) {
  mockUsePersona.mockReturnValue(persona);
  return render(
    <OverlayProvider>
      <ShareSpread
        profileDisplayName="Janahan S."
        profileHandle="janahan"
        copyByChannel={{ whatsapp: AI_WHATSAPP, email: AI_EMAIL }}
        overlay={OVERLAY}
      />
    </OverlayProvider>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CB-16 — ShareSpread persona-aware copy', () => {
  beforeEach(() => {
    mockUsePersona.mockReset();
  });

  it('owner sees first-person WhatsApp copy (OWNER_WHATSAPP), not AI copy', () => {
    renderShareSpread(PROFILE_OWNER_FIXTURE);
    expect(screen.getByText(OWNER_WHATSAPP)).toBeDefined();
    expect(screen.queryByText(AI_WHATSAPP)).toBeNull();
  });

  it('owner sees first-person email copy (OWNER_EMAIL), not AI copy', () => {
    renderShareSpread(PROFILE_OWNER_FIXTURE);
    expect(screen.getByText(OWNER_EMAIL)).toBeDefined();
    expect(screen.queryByText(AI_EMAIL)).toBeNull();
  });

  it('supporter sees per-persona (close_friend) WhatsApp copy, not owner copy', () => {
    // CB-98: PROFILE_SHARE_COPY['close_friend'] takes priority over the prop copy.
    const expectedWa = PROFILE_SHARE_COPY['close_friend']?.whatsapp!;
    renderShareSpread(SUPPORTER_FIXTURE);
    expect(screen.getByText(expectedWa)).toBeDefined();
    expect(screen.queryByText(OWNER_WHATSAPP)).toBeNull();
  });

  it('supporter sees per-persona (close_friend) email copy, not owner copy', () => {
    // CB-98: PROFILE_SHARE_COPY['close_friend'] takes priority over the prop copy.
    // Use a partial match because \n\n in the fixture becomes normalized whitespace in the DOM.
    const expectedEmailStart = "I've been following Janahan's fundraisers closely";
    renderShareSpread(SUPPORTER_FIXTURE);
    expect(screen.getByText((content) => content.includes(expectedEmailStart))).toBeDefined();
    expect(screen.queryByText(OWNER_EMAIL)).toBeNull();
  });

  it('owner copy is meaningfully different from supporter copy (WhatsApp)', () => {
    // Render owner
    const { unmount } = renderShareSpread(PROFILE_OWNER_FIXTURE);
    const ownerWaEl = screen.getByText(OWNER_WHATSAPP);
    unmount();

    // Render supporter — now shows PROFILE_SHARE_COPY['close_friend'] whatsapp
    const expectedWa = PROFILE_SHARE_COPY['close_friend']?.whatsapp!;
    renderShareSpread(SUPPORTER_FIXTURE);
    const supporterWaEl = screen.getByText(expectedWa);

    expect(ownerWaEl.textContent).not.toBe(supporterWaEl.textContent);
  });

  it('owner copy is meaningfully different from supporter copy (Email)', () => {
    const { unmount } = renderShareSpread(PROFILE_OWNER_FIXTURE);
    const ownerEmailEl = screen.getByText(OWNER_EMAIL);
    unmount();

    // Render supporter — now shows PROFILE_SHARE_COPY['close_friend'] email (partial match for multi-line)
    const expectedEmailStart = "I've been following Janahan's fundraisers closely";
    renderShareSpread(SUPPORTER_FIXTURE);
    const supporterEmailEl = screen.getByText((content) => content.includes(expectedEmailStart));

    expect(ownerEmailEl.textContent).not.toBe(supporterEmailEl.textContent);
  });

  it('component still mounts without unmounting when owner (L3.5 no-unmount rule)', () => {
    const { container } = renderShareSpread(PROFILE_OWNER_FIXTURE);
    const section = container.querySelector('section.spread');
    expect(section).not.toBeNull();
  });

  it('component still mounts without unmounting when supporter (L3.5 no-unmount rule)', () => {
    const { container } = renderShareSpread(SUPPORTER_FIXTURE);
    const section = container.querySelector('section.spread');
    expect(section).not.toBeNull();
  });

  it('btn--primary class is present on both CTA buttons for owner (not green)', () => {
    const { container } = renderShareSpread(PROFILE_OWNER_FIXTURE);
    const primaryBtns = container.querySelectorAll('.btn--primary');
    expect(primaryBtns.length).toBeGreaterThanOrEqual(2);
  });
});
