/**
 * CB-32 — community board copy-link + share message broken.
 *
 * Verifies:
 *   1. ShareStudio renders non-empty per-channel message text.
 *   2. ShareSheet copy_link ChannelCard calls navigator.clipboard.writeText with a
 *      non-empty attributed URL (containing utm_share or share_id param).
 *   3. Clicking copy_link fires 'Share Clicked' via onShare, then the card shows "Copied!".
 *   4. mintShareId produces a stable non-empty shr_… token.
 *   5. buildAttributedShareUrl produces a URL carrying the share token param.
 *   6. clipboard.writeText is guarded (no throw when navigator.clipboard is absent).
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { mintShareId, buildAttributedShareUrl } from '@/lib/marks/attribution';
import { ShareSheet } from '@/components/shared/ShareSheet';
import { ShareStudio } from '@/components/community/ShareStudio';
import { OverlayProvider } from '@/lib/overlay/context';
import type { ShareChannel, PageContext } from '@/lib/types';
import type { MintShareInput } from '@/lib/marks/types';
import { COMMUNITY_SHARE_COPY } from '@/fixtures/shareCopyProfileCommunity';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PAGE_CTX: PageContext = {
  page: 'community',
  communityId: 'comm-test-001',
  referrerSource: 'community_share',
  pageState: {},
};

const SHARE_COPY: Partial<Record<ShareChannel, string>> = {
  whatsapp: 'Watch Duty helps your neighborhood stay safe during wildfires. Join 1,240 followers.',
  x: '$1.4M raised, 12 fundraisers — one mission. Follow Watch Duty.',
  copy_link: 'Copy the Watch Duty community link to share anywhere.',
};

const MINT_INPUT: MintShareInput = {
  entityType: 'community',
  entityId: 'comm-test-001',
  sharerToken: 'viewer',
  channel: 'copy_link',
};

// ---------------------------------------------------------------------------
// Clipboard mock
// ---------------------------------------------------------------------------

let writeTextMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  writeTextMock = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: writeTextMock },
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// capture mock — prevents PostHog / fetch noise in tests
// ---------------------------------------------------------------------------

vi.mock('@/lib/analytics/capture', () => ({
  capture: vi.fn(),
  isCaptureSuppressed: vi.fn(() => false),
}));

// ---------------------------------------------------------------------------
// 1. mintShareId — stable non-empty shr_ token
// ---------------------------------------------------------------------------

describe('mintShareId', () => {
  it('returns a non-empty string', () => {
    const id = mintShareId(MINT_INPUT);
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('starts with the shr_ prefix', () => {
    const id = mintShareId(MINT_INPUT);
    expect(id.startsWith('shr_')).toBe(true);
  });

  it('produces different ids on consecutive calls (uuid randomness)', () => {
    const a = mintShareId(MINT_INPUT);
    const b = mintShareId(MINT_INPUT);
    // UUIDs should be unique; extremely unlikely to collide
    expect(a).not.toBe(b);
  });
});

// ---------------------------------------------------------------------------
// 2. buildAttributedShareUrl — URL carries share token param
// ---------------------------------------------------------------------------

describe('buildAttributedShareUrl', () => {
  it('returns a non-empty string', () => {
    const url = buildAttributedShareUrl({
      basePath: '/communities/watch-duty',
      shareId: 'shr_abc123',
      channel: 'copy_link',
    });
    expect(typeof url).toBe('string');
    expect(url.length).toBeGreaterThan(0);
  });

  it('URL contains utm_share or share_id param (canonical shape)', () => {
    const url = buildAttributedShareUrl({
      basePath: '/communities/watch-duty',
      shareId: 'shr_abc123',
      channel: 'copy_link',
    });
    expect(url).toMatch(/utm_share|share_id|sid=/);
  });

  it('URL includes the shareId value', () => {
    const shareId = 'shr_testtoken99';
    const url = buildAttributedShareUrl({
      basePath: '/communities/watch-duty',
      shareId,
      channel: 'copy_link',
    });
    expect(url).toContain('shr_testtoken99');
  });

  it('URL includes basePath', () => {
    const url = buildAttributedShareUrl({
      basePath: '/communities/watch-duty',
      shareId: 'shr_x',
      channel: 'copy_link',
    });
    expect(url).toContain('/communities/watch-duty');
  });

  it('includes utm_share_source from the channel', () => {
    const url = buildAttributedShareUrl({
      basePath: '/communities/watch-duty',
      shareId: 'shr_x',
      channel: 'copy_link',
    });
    expect(url).toContain('utm_share_source=copy_link');
  });
});

// ---------------------------------------------------------------------------
// 3. ShareSheet — copy_link card writes attributed URL to clipboard
// ---------------------------------------------------------------------------

describe('ShareSheet — copy_link card', () => {
  function renderSheet(overrideCopy?: Partial<Record<ShareChannel, string>>) {
    const onShare = vi.fn();
    const result = render(
      <ShareSheet
        entityType="community"
        entityId="comm-test-001"
        copyByChannel={overrideCopy ?? SHARE_COPY}
        context="Share Watch Duty"
        onShare={onShare}
      />
    );
    return { onShare, ...result };
  }

  it('renders the Copy link card with non-empty copy text', () => {
    renderSheet();
    // The copy preview bubble text (from SHARE_COPY.copy_link or fallback)
    const copyText =
      SHARE_COPY.copy_link ?? 'Copy the link to share this fundraiser anywhere.';
    expect(screen.getByText(copyText)).toBeDefined();
  });

  it('clicking copy_link button calls navigator.clipboard.writeText', async () => {
    renderSheet();
    const btn = screen.getByRole('button', { name: /share on copy link/i });
    await act(async () => {
      fireEvent.click(btn);
    });
    expect(writeTextMock).toHaveBeenCalledTimes(1);
  });

  it('clipboard.writeText is called with a non-empty string', async () => {
    renderSheet();
    const btn = screen.getByRole('button', { name: /share on copy link/i });
    await act(async () => {
      fireEvent.click(btn);
    });
    const written = writeTextMock.mock.calls[0][0] as string;
    expect(typeof written).toBe('string');
    expect(written.length).toBeGreaterThan(0);
  });

  it('clipboard.writeText receives URL containing share token param', async () => {
    renderSheet();
    const btn = screen.getByRole('button', { name: /share on copy link/i });
    await act(async () => {
      fireEvent.click(btn);
    });
    const written = writeTextMock.mock.calls[0][0] as string;
    expect(written).toMatch(/utm_share|share_id|sid=/);
  });

  it('clicking copy_link fires onShare with channel=copy_link', async () => {
    const { onShare } = renderSheet();
    const btn = screen.getByRole('button', { name: /share on copy link/i });
    await act(async () => {
      fireEvent.click(btn);
    });
    expect(onShare).toHaveBeenCalledWith('copy_link', expect.any(String));
  });

  it('button shows "Copied!" after click', async () => {
    renderSheet();
    const btn = screen.getByRole('button', { name: /share on copy link/i });
    await act(async () => {
      fireEvent.click(btn);
    });
    expect(screen.getByText('Copied!')).toBeDefined();
  });

  it('falls back gracefully when navigator.clipboard is absent (no throw)', async () => {
    // Remove clipboard from navigator
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
      writable: true,
    });
    renderSheet();
    const btn = screen.getByRole('button', { name: /share on copy link/i });
    // Must not throw
    await act(async () => {
      expect(() => fireEvent.click(btn)).not.toThrow();
    });
  });

  it('falls back gracefully when copyByChannel is empty (uses generic fallback copy)', () => {
    renderSheet({});
    // Generic fallback for copy_link
    expect(screen.getByText('Copy the link to share this fundraiser anywhere.')).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 4. ShareStudio — per-channel message text renders non-empty
// ---------------------------------------------------------------------------

describe('ShareStudio — share message text renders non-empty', () => {
  function renderStudio(overrideCopy?: Partial<Record<ShareChannel, string>>) {
    return render(
      <OverlayProvider>
        <ShareStudio
          communityName="Watch Duty"
          raisedUsd={1_420_000}
          fundraiserCount={12}
          followerCount={1240}
          shareCopy={overrideCopy ?? SHARE_COPY}
          communityId="comm-test-001"
          pageCtx={PAGE_CTX}
        />
      </OverlayProvider>
    );
  }

  it('renders the whatsapp share copy text as non-empty', () => {
    // CB-98: anonymous persona copy from COMMUNITY_SHARE_COPY takes priority over the prop.
    renderStudio();
    const expected = COMMUNITY_SHARE_COPY['anonymous']?.whatsapp!;
    const el = screen.getByText(expected);
    expect(el.textContent).toBeTruthy();
    expect(el.textContent!.length).toBeGreaterThan(0);
  });

  it('renders the x share copy text as non-empty', () => {
    // CB-98: anonymous persona copy from COMMUNITY_SHARE_COPY takes priority over the prop.
    renderStudio();
    const expected = COMMUNITY_SHARE_COPY['anonymous']?.x!;
    const el = screen.getByText(expected);
    expect(el.textContent).toBeTruthy();
    expect(el.textContent!.length).toBeGreaterThan(0);
  });

  it('renders persona copy when shareCopy prop is empty — text is non-empty', () => {
    // CB-98: even when shareCopy prop is empty, persona copy from COMMUNITY_SHARE_COPY renders.
    renderStudio({});
    // anonymous persona has whatsapp copy in COMMUNITY_SHARE_COPY
    const expected = COMMUNITY_SHARE_COPY['anonymous']?.whatsapp!;
    const bubble = screen.getByText(expected);
    expect(bubble.textContent!.length).toBeGreaterThan(0);
  });

  it('renders "Bigger together" heading', () => {
    renderStudio();
    expect(screen.getByText('Bigger together')).toBeDefined();
  });

  it('renders "Invite people to Watch Duty" heading', () => {
    renderStudio();
    expect(screen.getByText('Invite people to Watch Duty')).toBeDefined();
  });

  it('no share message text is blank/undefined (all rendered bubbles have text)', () => {
    const { container } = renderStudio();
    const bubbles = container.querySelectorAll('.bubble');
    expect(bubbles.length).toBeGreaterThan(0);
    bubbles.forEach((b) => {
      expect(b.textContent).toBeTruthy();
      expect((b.textContent ?? '').trim().length).toBeGreaterThan(0);
    });
  });

  it('copy-link button in ShareStudio calls navigator.clipboard.writeText', async () => {
    renderStudio();
    const copyBtn = screen.getByRole('button', { name: /copy link/i });
    await act(async () => {
      fireEvent.click(copyBtn);
    });
    expect(writeTextMock).toHaveBeenCalledTimes(1);
    const written = writeTextMock.mock.calls[0][0] as string;
    expect(written).toMatch(/utm_share|share_id|sid=/);
  });

  it('ShareStudio copy-link shows "Copied!" after click', async () => {
    renderStudio();
    const copyBtn = screen.getByRole('button', { name: /copy link/i });
    await act(async () => {
      fireEvent.click(copyBtn);
    });
    expect(screen.getByText('Copied!')).toBeDefined();
  });
});
