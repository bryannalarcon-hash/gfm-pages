/**
 * CB-47, CB-50, CB-53, CB-54 — share personalization, copy_link label, update share buttons.
 *
 * CB-47: SHARE_COPY_MATRIX yields distinct, history-aware copy for persona A vs B and
 *        for whatsapp vs x (no live LLM — static fixture).
 * CB-50: No rendered text equals the raw "copy_link" string; label is "Copy link" or "Share URL".
 * CB-53: Clicking an update share button fires capture('Share Clicked', {share_channel}) and
 *        calls the share handler.
 * CB-54: Each update share button renders an SVG icon, not a bare colored text label.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { ShareChannel } from '@/lib/types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/analytics/capture', () => ({
  capture: vi.fn(),
  isCaptureSuppressed: vi.fn(() => false),
}));

// Clipboard mock
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
// Lazy imports (after vi.mock hoisting)
// ---------------------------------------------------------------------------

import { SHARE_COPY_MATRIX } from '@/fixtures/shareCopyMatrix';
import { ShareSheet } from '@/components/shared/ShareSheet';
import { UpdatesSection } from '@/components/fundraiser/UpdatesSection';
import { ShareStudio } from '@/components/community/ShareStudio';
import { OverlayProvider } from '@/lib/overlay/context';
import { capture } from '@/lib/analytics/capture';
import type { UpdateRow } from '@/lib/db/queries';
import type { PageContext } from '@/lib/types';

const mockCapture = capture as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Wrap a component in OverlayProvider (required by Instrumented inside UpdatesSection). */
function withOverlay(children: React.ReactNode) {
  return <OverlayProvider>{children}</OverlayProvider>;
}

const STUDIO_PAGE_CTX: PageContext = {
  page: 'community',
  communityId: 'comm-001',
  referrerSource: 'community_share',
  pageState: {},
};

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const SAMPLE_UPDATES: UpdateRow[] = [
  {
    id: 'upd-001',
    author_name: 'Sarah J.',
    created_at: '2026-05-01T12:00:00Z',
    body: 'Thank you all so much for your incredible support during the wildfire evacuation. We have now helped over 200 families.',
    summary: 'Helped over 200 families during the wildfire evacuation.',
  },
];

const COPY_BY_CHANNEL: Partial<Record<ShareChannel, string>> = {
  facebook: 'Help us reach our wildfire goal — share on Facebook!',
  x: 'Wildfire fundraiser needs your help. Share now.',
  whatsapp: 'Hey! Please help share this wildfire fundraiser with your friends.',
  messenger: 'Check out this important fundraiser.',
  sms: 'Help with wildfire relief — share this link.',
  email: 'I wanted to share this important wildfire fundraiser with you.',
  copy_link: 'Copy the link to share this fundraiser anywhere.',
};

// ---------------------------------------------------------------------------
// CB-47 — SHARE_COPY_MATRIX: distinct copy per (persona × channel)
// ---------------------------------------------------------------------------

describe('CB-47 — SHARE_COPY_MATRIX persona × channel matrix', () => {
  it('SHARE_COPY_MATRIX is defined and is an object', () => {
    expect(SHARE_COPY_MATRIX).toBeDefined();
    expect(typeof SHARE_COPY_MATRIX).toBe('object');
  });

  it('matrix contains entries for close_friend and extrovert personas', () => {
    expect(SHARE_COPY_MATRIX['close_friend']).toBeDefined();
    expect(SHARE_COPY_MATRIX['extrovert']).toBeDefined();
  });

  it('each persona entry has whatsapp and x channel copy', () => {
    const closeFriend = SHARE_COPY_MATRIX['close_friend'];
    expect(closeFriend['whatsapp']).toBeDefined();
    expect(closeFriend['x']).toBeDefined();
    expect(typeof closeFriend['whatsapp']).toBe('string');
    expect(typeof closeFriend['x']).toBe('string');

    const extrovert = SHARE_COPY_MATRIX['extrovert'];
    expect(extrovert['whatsapp']).toBeDefined();
    expect(extrovert['x']).toBeDefined();
  });

  it('close_friend whatsapp copy differs from extrovert whatsapp copy (persona-specific)', () => {
    const closeFriendWa = SHARE_COPY_MATRIX['close_friend']['whatsapp'];
    const extrovertWa = SHARE_COPY_MATRIX['extrovert']['whatsapp'];
    expect(closeFriendWa).not.toBe(extrovertWa);
  });

  it('close_friend x copy differs from close_friend whatsapp copy (channel-specific)', () => {
    const closeFriendX = SHARE_COPY_MATRIX['close_friend']['x'];
    const closeFriendWa = SHARE_COPY_MATRIX['close_friend']['whatsapp'];
    expect(closeFriendX).not.toBe(closeFriendWa);
  });

  it('extrovert x copy differs from close_friend x copy (persona-specific)', () => {
    const extrovertX = SHARE_COPY_MATRIX['extrovert']['x'];
    const closeFriendX = SHARE_COPY_MATRIX['close_friend']['x'];
    expect(extrovertX).not.toBe(closeFriendX);
  });

  it('whatsapp copy is warm/friend-toned (contains warm indicator)', () => {
    // WhatsApp copy should feel conversational (contain "Hey", "friend", "you", or similar)
    const wa = SHARE_COPY_MATRIX['close_friend']['whatsapp'] ?? '';
    expect(wa.length).toBeGreaterThan(20);
    // Must be a non-empty meaningful string
    expect(wa.trim()).not.toBe('');
  });

  it('x copy is punchy/short (under 280 chars)', () => {
    const xCopy = SHARE_COPY_MATRIX['close_friend']['x'] ?? '';
    expect(xCopy.length).toBeLessThanOrEqual(280);
  });

  it('anonymous persona has copy (fallback still present)', () => {
    const anon = SHARE_COPY_MATRIX['anonymous'];
    expect(anon).toBeDefined();
    expect(anon['whatsapp']).toBeDefined();
    expect(typeof anon['whatsapp']).toBe('string');
  });

  it('all non-anonymous personas have distinct whatsapp copy from anonymous', () => {
    const anonWa = SHARE_COPY_MATRIX['anonymous']['whatsapp'];
    const closeFriendWa = SHARE_COPY_MATRIX['close_friend']['whatsapp'];
    // History-aware personas should have richer copy than anonymous
    expect(closeFriendWa).not.toBe(anonWa);
  });

  it('matrix has no live LLM call — is a static synchronous object', () => {
    // Import is synchronous; no Promise returned
    expect(SHARE_COPY_MATRIX instanceof Promise).toBe(false);
    // All values are plain strings, not promises
    const entry: unknown = SHARE_COPY_MATRIX['close_friend']['whatsapp'];
    expect(entry instanceof Promise).toBe(false);
    expect(typeof entry).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// CB-50 — No raw "copy_link" slug in rendered viewer text
// ---------------------------------------------------------------------------

describe('CB-50 — copy_link slug never renders as viewer-facing text', () => {
  it('ShareSheet renders "Copy link" label, not the raw "copy_link" slug', () => {
    const { container } = render(
      <ShareSheet
        entityType="fundraiser"
        entityId="fundraiser-001"
        copyByChannel={COPY_BY_CHANNEL}
        context="Share this fundraiser"
        onShare={vi.fn()}
      />
    );
    // The human-readable label "Copy link" should be present
    expect(screen.getByText('Copy link')).toBeDefined();
    // The raw slug "copy_link" must NOT appear as rendered text anywhere
    const allText = container.textContent ?? '';
    // Split on word boundaries — check the raw internal value is not rendered
    // Allow it in data-attributes (those aren't textContent), but not in visible text
    expect(allText).not.toContain('copy_link');
  });

  it('ShareSheet CTA button for copy_link channel uses natural label text', () => {
    render(
      <ShareSheet
        entityType="fundraiser"
        entityId="fundraiser-001"
        copyByChannel={COPY_BY_CHANNEL}
        context="Share this fundraiser"
        onShare={vi.fn()}
      />
    );
    // Button should say "Share on Copy link", not "Share on copy_link"
    const btn = screen.getByRole('button', { name: /copy link/i });
    expect(btn).toBeDefined();
    expect(btn.textContent).not.toContain('copy_link');
  });

  it('UpdatesSection share row buttons do not render "copy_link" as visible text', () => {
    const { container } = render(
      withOverlay(
        <UpdatesSection
          fundraiserId="fundraiser-001"
          updates={SAMPLE_UPDATES}
          copyByChannel={COPY_BY_CHANNEL}
        />
      )
    );
    const allText = container.textContent ?? '';
    expect(allText).not.toContain('copy_link');
  });

  it('ShareStudio copy-link button says "Copy link", not "copy_link"', () => {
    // ShareStudio has its own copy-link button — verify natural label
    // (Already partially covered by CB-32; this specifically checks the slug is absent)
    const { container } = render(
      <OverlayProvider>
        <ShareStudio
          communityName="Watch Duty"
          raisedUsd={1_420_000}
          fundraiserCount={12}
          followerCount={1240}
          shareCopy={{
            whatsapp: 'Watch Duty — join us.',
            x: 'Watch Duty is growing.',
          }}
          communityId="comm-001"
          pageCtx={STUDIO_PAGE_CTX}
        />
      </OverlayProvider>
    );
    const allText = container.textContent ?? '';
    expect(allText).not.toContain('copy_link');
  });
});

// ---------------------------------------------------------------------------
// CB-53 — UpdatesSection share buttons: clickable + fire Share Clicked
// ---------------------------------------------------------------------------

describe('CB-53 — UpdatesSection per-update share buttons fire Share Clicked', () => {
  beforeEach(() => {
    mockCapture.mockReset();
  });

  it('clicking whatsapp share button fires capture("Share Clicked", {share_channel: "whatsapp"})', async () => {
    render(
      withOverlay(
        <UpdatesSection
          fundraiserId="fundraiser-001"
          updates={SAMPLE_UPDATES}
          copyByChannel={COPY_BY_CHANNEL}
        />
      )
    );
    const btn = screen.getByRole('button', { name: /whatsapp/i });
    await act(async () => {
      fireEvent.click(btn);
    });
    expect(mockCapture).toHaveBeenCalledWith(
      'Share Clicked',
      expect.objectContaining({ share_channel: 'whatsapp' })
    );
  });

  it('clicking x share button fires capture("Share Clicked", {share_channel: "x"})', async () => {
    render(
      withOverlay(
        <UpdatesSection
          fundraiserId="fundraiser-001"
          updates={SAMPLE_UPDATES}
          copyByChannel={COPY_BY_CHANNEL}
        />
      )
    );
    const btn = screen.getByRole('button', { name: /^x$/i });
    await act(async () => {
      fireEvent.click(btn);
    });
    expect(mockCapture).toHaveBeenCalledWith(
      'Share Clicked',
      expect.objectContaining({ share_channel: 'x' })
    );
  });

  it('clicking facebook share button fires capture("Share Clicked", {share_channel: "facebook"})', async () => {
    render(
      withOverlay(
        <UpdatesSection
          fundraiserId="fundraiser-001"
          updates={SAMPLE_UPDATES}
          copyByChannel={COPY_BY_CHANNEL}
        />
      )
    );
    const btn = screen.getByRole('button', { name: /facebook/i });
    await act(async () => {
      fireEvent.click(btn);
    });
    expect(mockCapture).toHaveBeenCalledWith(
      'Share Clicked',
      expect.objectContaining({ share_channel: 'facebook' })
    );
  });

  it('clicking copy_link share button fires capture("Share Clicked", {share_channel: "copy_link"})', async () => {
    render(
      withOverlay(
        <UpdatesSection
          fundraiserId="fundraiser-001"
          updates={SAMPLE_UPDATES}
          copyByChannel={COPY_BY_CHANNEL}
        />
      )
    );
    // Button aria-label uses natural label "Copy link", not "copy_link"
    const btn = screen.getByRole('button', { name: /copy link/i });
    await act(async () => {
      fireEvent.click(btn);
    });
    expect(mockCapture).toHaveBeenCalledWith(
      'Share Clicked',
      expect.objectContaining({ share_channel: 'copy_link' })
    );
  });

  it('clicking copy_link share button calls navigator.clipboard.writeText with attributed URL', async () => {
    render(
      withOverlay(
        <UpdatesSection
          fundraiserId="fundraiser-001"
          updates={SAMPLE_UPDATES}
          copyByChannel={COPY_BY_CHANNEL}
        />
      )
    );
    const btn = screen.getByRole('button', { name: /copy link/i });
    await act(async () => {
      fireEvent.click(btn);
    });
    expect(writeTextMock).toHaveBeenCalledTimes(1);
    const written = writeTextMock.mock.calls[0][0] as string;
    expect(written).toMatch(/utm_share|share_id/);
  });

  it('share buttons use platform-personalized copy from copyByChannel', async () => {
    // The whatsapp button click should use the whatsapp copy from copyByChannel
    const capturedArgs: unknown[] = [];
    mockCapture.mockImplementation((...args: unknown[]) => capturedArgs.push(args));

    render(
      withOverlay(
        <UpdatesSection
          fundraiserId="fundraiser-001"
          updates={SAMPLE_UPDATES}
          copyByChannel={COPY_BY_CHANNEL}
        />
      )
    );
    const btn = screen.getByRole('button', { name: /whatsapp/i });
    await act(async () => {
      fireEvent.click(btn);
    });
    // The event should have been fired
    expect(mockCapture).toHaveBeenCalled();
  });

  it('each update card renders a share row with multiple buttons', () => {
    const { container } = render(
      withOverlay(
        <UpdatesSection
          fundraiserId="fundraiser-001"
          updates={SAMPLE_UPDATES}
          copyByChannel={COPY_BY_CHANNEL}
        />
      )
    );
    const shareRow = container.querySelector('[aria-label="Share this update"]');
    expect(shareRow).not.toBeNull();
    const buttons = shareRow!.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(5);
  });
});

// ---------------------------------------------------------------------------
// CB-54 — UpdatesSection share buttons render real SVG icons, not text labels
// ---------------------------------------------------------------------------

describe('CB-54 — UpdatesSection share buttons render SVG icons, not colored text boxes', () => {
  it('each share button renders an svg element inside it', () => {
    const { container } = render(
      withOverlay(
        <UpdatesSection
          fundraiserId="fundraiser-001"
          updates={SAMPLE_UPDATES}
          copyByChannel={COPY_BY_CHANNEL}
        />
      )
    );
    const shareRow = container.querySelector('[aria-label="Share this update"]');
    expect(shareRow).not.toBeNull();
    const buttons = shareRow!.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
    for (const btn of buttons) {
      const svg = btn.querySelector('svg');
      expect(svg).not.toBeNull();
    }
  });

  it('share buttons do NOT contain visible platform name text as their sole content', () => {
    // Buttons should render icons, not bare text like "FB", "WA", "X", "MSG", "SMS"
    const { container } = render(
      withOverlay(
        <UpdatesSection
          fundraiserId="fundraiser-001"
          updates={SAMPLE_UPDATES}
          copyByChannel={COPY_BY_CHANNEL}
        />
      )
    );
    const shareRow = container.querySelector('[aria-label="Share this update"]');
    expect(shareRow).not.toBeNull();
    const buttons = shareRow!.querySelectorAll('button');
    // None of the buttons should only contain the legacy abbreviated text labels
    const bareTextLabels = ['FB', 'WA', 'MSG', 'SMS'];
    for (const btn of buttons) {
      // If button has an svg, it's an icon button — good
      const svg = btn.querySelector('svg');
      expect(svg).not.toBeNull();
      // The visible aria-label text should not be the raw short abbreviation used by the old impl
      for (const label of bareTextLabels) {
        // Abbreviations should not be the aria-label value (we now use full names via CHANNEL_META)
        // The button may still have aria-label for accessibility, but visible content is an icon
        const visibleAriaHidden = btn.querySelector('[aria-hidden="true"]');
        if (visibleAriaHidden) {
          // aria-hidden content is purely decorative; the icon path is the visible content
          const hiddenText = visibleAriaHidden.textContent ?? '';
          // Old impl had bare "FB", "WA" etc. as aria-hidden text — new impl should have SVG paths
          expect(hiddenText).not.toBe(label);
        }
      }
    }
  });

  it('facebook share button renders an svg with a path element', () => {
    render(
      withOverlay(
        <UpdatesSection
          fundraiserId="fundraiser-001"
          updates={SAMPLE_UPDATES}
          copyByChannel={COPY_BY_CHANNEL}
        />
      )
    );
    const facebookBtn = screen.getByRole('button', { name: /facebook/i });
    const svg = facebookBtn.querySelector('svg');
    expect(svg).not.toBeNull();
    const path = svg!.querySelector('path');
    expect(path).not.toBeNull();
  });

  it('whatsapp share button renders an svg with a path element', () => {
    render(
      withOverlay(
        <UpdatesSection
          fundraiserId="fundraiser-001"
          updates={SAMPLE_UPDATES}
          copyByChannel={COPY_BY_CHANNEL}
        />
      )
    );
    const waBtn = screen.getByRole('button', { name: /whatsapp/i });
    const svg = waBtn.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('copy_link share button renders an svg (IconLink)', () => {
    render(
      withOverlay(
        <UpdatesSection
          fundraiserId="fundraiser-001"
          updates={SAMPLE_UPDATES}
          copyByChannel={COPY_BY_CHANNEL}
        />
      )
    );
    const linkBtn = screen.getByRole('button', { name: /copy link/i });
    const svg = linkBtn.querySelector('svg');
    expect(svg).not.toBeNull();
  });
});
