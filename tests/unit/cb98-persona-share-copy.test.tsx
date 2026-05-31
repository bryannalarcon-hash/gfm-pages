/**
 * CB-98 — Per-persona share copy on profile (ShareSpread) and community (ShareStudio).
 *
 * Assertion contract:
 *   1. PROFILE_SHARE_COPY and COMMUNITY_SHARE_COPY are static synchronous objects (no LLM).
 *   2. At least 3 personas yield DISTINCT non-generic copy for whatsapp and email on the
 *      profile surface, and for whatsapp and x on the community surface.
 *   3. ShareSpread renders persona-specific copy from PROFILE_SHARE_COPY when usePersona
 *      returns close_friend / extrovert / returning_lapsed (all distinct from each other).
 *   4. ShareStudio renders persona-specific copy from COMMUNITY_SHARE_COPY for the same
 *      three personas (all distinct from each other).
 *   5. The profile_owner path continues to use OWNER_WHATSAPP / OWNER_EMAIL (existing CB-16).
 *   6. Raw persona slugs (e.g. "close_friend") are never present in rendered viewer text.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { PersonaFixture } from '@/lib/personas/types';
import type { OverlayAttrs } from '@/lib/overlay/types';
import type { PageContext } from '@/lib/types';
import { OverlayProvider } from '@/lib/overlay/context';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/analytics/capture', () => ({
  capture: vi.fn(),
  isCaptureSuppressed: vi.fn(() => false),
}));

vi.mock('@/lib/overlay/context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/overlay/context')>();
  return {
    ...actual,
    usePersona: vi.fn(),
  };
});

import * as overlayCtx from '@/lib/overlay/context';
const mockUsePersona = overlayCtx.usePersona as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// Lazy imports (after vi.mock hoisting)
// ---------------------------------------------------------------------------

import { PROFILE_SHARE_COPY, COMMUNITY_SHARE_COPY } from '@/fixtures/shareCopyProfileCommunity';
import { ShareSpread } from '@/components/profile/ShareSpread';
import { ShareStudio } from '@/components/community/ShareStudio';

// ---------------------------------------------------------------------------
// Persona fixtures
// ---------------------------------------------------------------------------

const CLOSE_FRIEND: PersonaFixture = {
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
  donations: [{ fundraiserId: 'f-001', amountUsd: 50, monthsAgo: 0 }],
  lastVisit: { monthsAgo: 0, onThisPage: true },
  avatar: { bg: '#ffd863', fg: '#68570d', initial: 'S' },
};

const EXTROVERT: PersonaFixture = {
  slug: 'extrovert',
  name: 'Mike T.',
  authenticated: true,
  isProfileOwner: false,
  referrerSource: 'social',
  follows: {
    fundraiserIds: [],
    organizerProfileIds: [],
    communityIds: [],
    counts: { profiles: 67, fundraisers: 14, communities: 3 },
  },
  donations: [],
  lastVisit: { monthsAgo: 0, onThisPage: false },
  avatar: { bg: '#ccf88e', fg: '#274a34', initial: 'M' },
};

const RETURNING_LAPSED: PersonaFixture = {
  slug: 'returning_lapsed',
  name: 'Priya M.',
  authenticated: true,
  isProfileOwner: false,
  referrerSource: 'profile_digest_email',
  follows: {
    fundraiserIds: [],
    organizerProfileIds: ['p-001'],
    communityIds: [],
    counts: { profiles: 1, fundraisers: 0, communities: 0 },
  },
  donations: [{ fundraiserId: 'f-001', amountUsd: 25, monthsAgo: 14 }],
  lastVisit: { monthsAgo: 10, onThisPage: true },
  avatar: { bg: '#e9fcce', fg: '#274a34', initial: 'P' },
};

const PROFILE_OWNER: PersonaFixture = {
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

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const OVERLAY: OverlayAttrs = {
  'data-overlay-tier': '2',
  'data-overlay-events': 'Share Clicked',
  'data-overlay-delta': 'P8',
  'data-overlay-metric': 'profile-share-studio',
  'data-overlay-why': 'test',
  'data-overlay-dashboard': 'share-trends',
};

const PAGE_CTX: PageContext = {
  page: 'community',
  communityId: 'watch-duty',
  referrerSource: 'community_share',
  pageState: {},
};

function renderSpread(persona: PersonaFixture) {
  mockUsePersona.mockReturnValue(persona);
  return render(
    <OverlayProvider>
      <ShareSpread
        profileDisplayName="Janahan S."
        profileHandle="janahan"
        copyByChannel={{ whatsapp: 'GENERIC_WA', email: 'GENERIC_EMAIL' }}
        overlay={OVERLAY}
      />
    </OverlayProvider>
  );
}

function renderStudio(persona: PersonaFixture) {
  mockUsePersona.mockReturnValue(persona);
  return render(
    <OverlayProvider>
      <ShareStudio
        communityName="Watch Duty"
        raisedUsd={1_420_000}
        fundraiserCount={12}
        followerCount={1240}
        shareCopy={{ whatsapp: 'GENERIC_WA', x: 'GENERIC_X' }}
        communityId="watch-duty"
        pageCtx={PAGE_CTX}
      />
    </OverlayProvider>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// 1. Fixture structure: static, non-LLM, correct shape
// ---------------------------------------------------------------------------

describe('CB-98 — PROFILE_SHARE_COPY and COMMUNITY_SHARE_COPY fixture structure', () => {
  it('PROFILE_SHARE_COPY is a synchronous static object (no LLM)', () => {
    expect(PROFILE_SHARE_COPY instanceof Promise).toBe(false);
    expect(typeof PROFILE_SHARE_COPY).toBe('object');
  });

  it('COMMUNITY_SHARE_COPY is a synchronous static object (no LLM)', () => {
    expect(COMMUNITY_SHARE_COPY instanceof Promise).toBe(false);
    expect(typeof COMMUNITY_SHARE_COPY).toBe('object');
  });

  it('PROFILE_SHARE_COPY has entries for all 6 persona slugs', () => {
    const slugs = ['anonymous', 'close_friend', 'extrovert', 'shared_by_extro', 'returning_lapsed', 'profile_owner'];
    for (const slug of slugs) {
      expect(PROFILE_SHARE_COPY[slug as keyof typeof PROFILE_SHARE_COPY]).toBeDefined();
    }
  });

  it('COMMUNITY_SHARE_COPY has entries for all 6 persona slugs', () => {
    const slugs = ['anonymous', 'close_friend', 'extrovert', 'shared_by_extro', 'returning_lapsed', 'profile_owner'];
    for (const slug of slugs) {
      expect(COMMUNITY_SHARE_COPY[slug as keyof typeof COMMUNITY_SHARE_COPY]).toBeDefined();
    }
  });

  it('PROFILE_SHARE_COPY whatsapp values are non-empty strings', () => {
    const slugs = ['close_friend', 'extrovert', 'returning_lapsed'] as const;
    for (const slug of slugs) {
      const copy = PROFILE_SHARE_COPY[slug]?.whatsapp;
      expect(typeof copy).toBe('string');
      expect((copy ?? '').length).toBeGreaterThan(10);
    }
  });

  it('COMMUNITY_SHARE_COPY whatsapp values are non-empty strings', () => {
    const slugs = ['close_friend', 'extrovert', 'returning_lapsed'] as const;
    for (const slug of slugs) {
      const copy = COMMUNITY_SHARE_COPY[slug]?.whatsapp;
      expect(typeof copy).toBe('string');
      expect((copy ?? '').length).toBeGreaterThan(10);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Per-persona copy is DISTINCT across 3 personas — profile surface
// ---------------------------------------------------------------------------

describe('CB-98 — PROFILE_SHARE_COPY: 3 personas yield distinct whatsapp copy', () => {
  it('close_friend, extrovert, returning_lapsed whatsapp copy are all distinct', () => {
    const cfWa = PROFILE_SHARE_COPY['close_friend']?.whatsapp ?? '';
    const exWa = PROFILE_SHARE_COPY['extrovert']?.whatsapp ?? '';
    const rlWa = PROFILE_SHARE_COPY['returning_lapsed']?.whatsapp ?? '';
    expect(cfWa).not.toBe(exWa);
    expect(cfWa).not.toBe(rlWa);
    expect(exWa).not.toBe(rlWa);
  });

  it('close_friend, extrovert, returning_lapsed email copy are all distinct', () => {
    const cfEm = PROFILE_SHARE_COPY['close_friend']?.email ?? '';
    const exEm = PROFILE_SHARE_COPY['extrovert']?.email ?? '';
    const rlEm = PROFILE_SHARE_COPY['returning_lapsed']?.email ?? '';
    expect(cfEm).not.toBe(exEm);
    expect(cfEm).not.toBe(rlEm);
    expect(exEm).not.toBe(rlEm);
  });

  it('no PROFILE_SHARE_COPY entry contains a raw persona slug as viewer-facing text', () => {
    const slugs = ['anonymous', 'close_friend', 'extrovert', 'shared_by_extro', 'returning_lapsed', 'profile_owner'];
    for (const slug of slugs) {
      const entry = PROFILE_SHARE_COPY[slug as keyof typeof PROFILE_SHARE_COPY] ?? {};
      for (const copy of Object.values(entry)) {
        // Underscore-joined slugs should not appear literally in copy
        for (const s of slugs) {
          expect(copy).not.toContain(s);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Per-persona copy is DISTINCT across 3 personas — community surface
// ---------------------------------------------------------------------------

describe('CB-98 — COMMUNITY_SHARE_COPY: 3 personas yield distinct whatsapp copy', () => {
  it('close_friend, extrovert, returning_lapsed whatsapp copy are all distinct', () => {
    const cfWa = COMMUNITY_SHARE_COPY['close_friend']?.whatsapp ?? '';
    const exWa = COMMUNITY_SHARE_COPY['extrovert']?.whatsapp ?? '';
    const rlWa = COMMUNITY_SHARE_COPY['returning_lapsed']?.whatsapp ?? '';
    expect(cfWa).not.toBe(exWa);
    expect(cfWa).not.toBe(rlWa);
    expect(exWa).not.toBe(rlWa);
  });

  it('close_friend, extrovert, returning_lapsed x copy are all distinct', () => {
    const cfX = COMMUNITY_SHARE_COPY['close_friend']?.x ?? '';
    const exX = COMMUNITY_SHARE_COPY['extrovert']?.x ?? '';
    const rlX = COMMUNITY_SHARE_COPY['returning_lapsed']?.x ?? '';
    expect(cfX).not.toBe(exX);
    expect(cfX).not.toBe(rlX);
    expect(exX).not.toBe(rlX);
  });

  it('no COMMUNITY_SHARE_COPY entry contains a raw persona slug as viewer-facing text', () => {
    const slugs = ['anonymous', 'close_friend', 'extrovert', 'shared_by_extro', 'returning_lapsed', 'profile_owner'];
    for (const slug of slugs) {
      const entry = COMMUNITY_SHARE_COPY[slug as keyof typeof COMMUNITY_SHARE_COPY] ?? {};
      for (const copy of Object.values(entry)) {
        for (const s of slugs) {
          expect(copy).not.toContain(s);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 4. ShareSpread renders persona-specific copy for 3 viewer personas
// ---------------------------------------------------------------------------

describe('CB-98 — ShareSpread renders distinct per-persona copy from PROFILE_SHARE_COPY', () => {
  beforeEach(() => {
    mockUsePersona.mockReset();
  });

  it('close_friend sees PROFILE_SHARE_COPY whatsapp copy (not the generic prop)', () => {
    renderSpread(CLOSE_FRIEND);
    const expected = PROFILE_SHARE_COPY['close_friend']?.whatsapp!;
    expect(screen.getByText(expected)).toBeDefined();
    expect(screen.queryByText('GENERIC_WA')).toBeNull();
  });

  it('extrovert sees PROFILE_SHARE_COPY whatsapp copy (not the generic prop)', () => {
    renderSpread(EXTROVERT);
    const expected = PROFILE_SHARE_COPY['extrovert']?.whatsapp!;
    expect(screen.getByText(expected)).toBeDefined();
    expect(screen.queryByText('GENERIC_WA')).toBeNull();
  });

  it('returning_lapsed sees PROFILE_SHARE_COPY whatsapp copy (not the generic prop)', () => {
    renderSpread(RETURNING_LAPSED);
    const expected = PROFILE_SHARE_COPY['returning_lapsed']?.whatsapp!;
    expect(screen.getByText(expected)).toBeDefined();
    expect(screen.queryByText('GENERIC_WA')).toBeNull();
  });

  it('close_friend and extrovert render DIFFERENT whatsapp copy in ShareSpread', () => {
    const { unmount } = renderSpread(CLOSE_FRIEND);
    const cfText = screen.getByText(PROFILE_SHARE_COPY['close_friend']?.whatsapp!).textContent;
    unmount();

    renderSpread(EXTROVERT);
    const exText = screen.getByText(PROFILE_SHARE_COPY['extrovert']?.whatsapp!).textContent;
    expect(cfText).not.toBe(exText);
  });

  it('extrovert and returning_lapsed render DIFFERENT whatsapp copy in ShareSpread', () => {
    const { unmount } = renderSpread(EXTROVERT);
    const exText = screen.getByText(PROFILE_SHARE_COPY['extrovert']?.whatsapp!).textContent;
    unmount();

    renderSpread(RETURNING_LAPSED);
    const rlText = screen.getByText(PROFILE_SHARE_COPY['returning_lapsed']?.whatsapp!).textContent;
    expect(exText).not.toBe(rlText);
  });

  it('profile_owner still uses first-person OWNER_WHATSAPP (CB-16 preserved)', () => {
    const OWNER_WHATSAPP =
      "I've been organizing fundraisers for causes close to me — would mean a lot if you followed along and shared. 🙏";
    renderSpread(PROFILE_OWNER);
    expect(screen.getByText(OWNER_WHATSAPP)).toBeDefined();
  });

  it('rendered copy contains no raw persona slug text for close_friend', () => {
    const { container } = renderSpread(CLOSE_FRIEND);
    expect(container.textContent).not.toContain('close_friend');
    expect(container.textContent).not.toContain('extrovert');
    expect(container.textContent).not.toContain('returning_lapsed');
  });
});

// ---------------------------------------------------------------------------
// 5. ShareStudio renders persona-specific copy for 3 viewer personas
// ---------------------------------------------------------------------------

describe('CB-98 — ShareStudio renders distinct per-persona copy from COMMUNITY_SHARE_COPY', () => {
  beforeEach(() => {
    mockUsePersona.mockReset();
  });

  it('close_friend sees COMMUNITY_SHARE_COPY whatsapp copy (not the generic prop)', () => {
    renderStudio(CLOSE_FRIEND);
    const expected = COMMUNITY_SHARE_COPY['close_friend']?.whatsapp!;
    expect(screen.getByText(expected)).toBeDefined();
    expect(screen.queryByText('GENERIC_WA')).toBeNull();
  });

  it('extrovert sees COMMUNITY_SHARE_COPY whatsapp copy (not the generic prop)', () => {
    renderStudio(EXTROVERT);
    const expected = COMMUNITY_SHARE_COPY['extrovert']?.whatsapp!;
    expect(screen.getByText(expected)).toBeDefined();
    expect(screen.queryByText('GENERIC_WA')).toBeNull();
  });

  it('returning_lapsed sees COMMUNITY_SHARE_COPY whatsapp copy (not the generic prop)', () => {
    renderStudio(RETURNING_LAPSED);
    const expected = COMMUNITY_SHARE_COPY['returning_lapsed']?.whatsapp!;
    expect(screen.getByText(expected)).toBeDefined();
    expect(screen.queryByText('GENERIC_WA')).toBeNull();
  });

  it('close_friend and extrovert render DIFFERENT whatsapp copy in ShareStudio', () => {
    const { unmount } = renderStudio(CLOSE_FRIEND);
    const cfText = screen.getByText(COMMUNITY_SHARE_COPY['close_friend']?.whatsapp!).textContent;
    unmount();

    renderStudio(EXTROVERT);
    const exText = screen.getByText(COMMUNITY_SHARE_COPY['extrovert']?.whatsapp!).textContent;
    expect(cfText).not.toBe(exText);
  });

  it('extrovert and returning_lapsed render DIFFERENT whatsapp copy in ShareStudio', () => {
    const { unmount } = renderStudio(EXTROVERT);
    const exText = screen.getByText(COMMUNITY_SHARE_COPY['extrovert']?.whatsapp!).textContent;
    unmount();

    renderStudio(RETURNING_LAPSED);
    const rlText = screen.getByText(COMMUNITY_SHARE_COPY['returning_lapsed']?.whatsapp!).textContent;
    expect(exText).not.toBe(rlText);
  });

  it('rendered copy contains no raw persona slug text for extrovert', () => {
    const { container } = renderStudio(EXTROVERT);
    expect(container.textContent).not.toContain('close_friend');
    expect(container.textContent).not.toContain('extrovert');
    expect(container.textContent).not.toContain('returning_lapsed');
  });
});
