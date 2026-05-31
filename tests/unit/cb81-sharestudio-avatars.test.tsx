/**
 * CB-81 — ShareStudio activity/invitee entries must render avatars through
 * the shared Avatar component, resolving pfpUrl via getPersonaByName.
 *
 * Verifies:
 *   1. A named persona in TOP_INVITERS ("Mike T.") renders an <img> with the
 *      persona's pfpUrl (not raw initials).
 *   2. An unknown name ("Ana C.", not in fixtures) renders the generic glyph
 *      (PersonGlyph path in Avatar) — no <img>, no broken image.
 *   3. No raw "avatar avatar--sm" span with bare initials text is emitted.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
  communityId: 'comm-test-cb81',
  referrerSource: 'community_share',
  pageState: {},
};

const SHARE_COPY: Partial<Record<ShareChannel, string>> = {
  whatsapp: 'Test community share copy for CB-81.',
};

function renderStudio() {
  return render(
    <OverlayProvider>
      <ShareStudio
        communityName="Watch Duty"
        raisedUsd={1_420_000}
        fundraiserCount={12}
        followerCount={1240}
        shareCopy={SHARE_COPY}
        communityId="comm-test-cb81"
        pageCtx={PAGE_CTX}
      />
    </OverlayProvider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CB-81 — ShareStudio top inviters avatar rendering', () => {
  it('named persona "Mike T." renders an <img> (pfpUrl resolved via getPersonaByName)', () => {
    const { container } = renderStudio();
    // Mike T. is the extrovert persona — has pfpUrl set in fixtures
    const mikeRow = screen.getByText('Mike T.').closest('.sharerrow');
    expect(mikeRow).not.toBeNull();
    const img = mikeRow!.querySelector('img');
    expect(img).not.toBeNull();
    expect(img!.getAttribute('src')).toContain('picsum.photos');
  });

  it('unknown name "Ana C." renders fallback initial — no <img>, no broken image', () => {
    const { container } = renderStudio();
    // Ana C. is NOT in persona fixtures — falls back to initial letter, no pfpUrl
    const anaRow = screen.getByText('Ana C.').closest('.sharerrow');
    expect(anaRow).not.toBeNull();
    // No img should render for an unknown name (no pfpUrl resolved)
    const img = anaRow!.querySelector('img');
    expect(img).toBeNull();
    // Avatar renders using the Avatar component (role=img span), not the old raw span
    const avatarSpan = anaRow!.querySelector('[role="img"]');
    expect(avatarSpan).not.toBeNull();
  });

  it('no raw "avatar avatar--sm" span with bare initials text is rendered', () => {
    const { container } = renderStudio();
    // The old pattern was <span className="avatar avatar--sm">{inv.initials}</span>
    const oldSpans = container.querySelectorAll('span.avatar.avatar--sm');
    expect(oldSpans.length).toBe(0);
  });

  it('named persona "Sarah K." renders an <img> (pfpUrl resolved via getPersonaByName)', () => {
    const { container } = renderStudio();
    // Sarah K. is the close_friend persona — has pfpUrl set in fixtures
    const sarahRow = screen.getByText('Sarah K.').closest('.sharerrow');
    expect(sarahRow).not.toBeNull();
    const img = sarahRow!.querySelector('img');
    expect(img).not.toBeNull();
    expect(img!.getAttribute('src')).toContain('picsum.photos');
  });
});
