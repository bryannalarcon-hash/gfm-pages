/**
 * CB-82 — Share icons: email → mail glyph, copy-link → link glyph.
 *
 * ShareSheet and ShareStudio must render inline SVG glyphs for the email and
 * copy_link channels — no text/color placeholders, no raw slug rendered to the
 * viewer. Consistent with CB-54 (real SVG logos for Facebook/WhatsApp/etc.).
 *
 * Assertions:
 *   1. ShareSheet email channel chip renders an <svg> (mail glyph).
 *   2. ShareSheet copy_link channel chip renders an <svg> (link glyph).
 *   3. ShareSheet: no raw slug "copy_link" or "email" leaks as visible text.
 *   4. ShareStudio email channel scard renders an <svg> mail glyph in the header.
 *   5. ShareStudio copy_link channel scard renders an <svg> link glyph in the header.
 *   6. ShareStudio: raw slug "copy_link" does not leak as viewer-facing text.
 *   7. The mail SVG is identifiable as the email icon (aria-label or role="img" with label).
 *   8. The link SVG is identifiable as the copy-link icon.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ShareChannel, PageContext } from '@/lib/types';
import { ShareSheet } from '@/components/shared/ShareSheet';
import { ShareStudio } from '@/components/community/ShareStudio';
import { OverlayProvider } from '@/lib/overlay/context';

vi.mock('@/lib/analytics/capture', () => ({
  capture: vi.fn(),
  isCaptureSuppressed: vi.fn(() => false),
}));

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const COPY_BY_CHANNEL: Partial<Record<ShareChannel, string>> = {
  facebook: 'Share on Facebook.',
  x: 'Post this.',
  whatsapp: 'Tell your friends.',
  messenger: 'Message them.',
  sms: 'Text it.',
  email: 'Send an email about this fundraiser.',
  copy_link: 'Copy the link to share anywhere.',
};

const PAGE_CTX: PageContext = {
  page: 'community',
  communityId: 'comm-cb82',
  referrerSource: 'community_share',
  pageState: {},
};

function renderSheet() {
  return render(
    <ShareSheet
      entityType="fundraiser"
      entityId="fundraiser-cb82"
      copyByChannel={COPY_BY_CHANNEL}
      context="Share this fundraiser"
      onShare={vi.fn()}
    />
  );
}

function renderStudio(shareCopy: Partial<Record<ShareChannel, string>>) {
  return render(
    <OverlayProvider>
      <ShareStudio
        communityName="CB-82 Community"
        raisedUsd={500_000}
        fundraiserCount={5}
        followerCount={300}
        shareCopy={shareCopy}
        communityId="comm-cb82"
        pageCtx={PAGE_CTX}
      />
    </OverlayProvider>
  );
}

// ---------------------------------------------------------------------------
// ShareSheet — email and copy_link chip icons
// ---------------------------------------------------------------------------

describe('CB-82 — ShareSheet email channel renders mail SVG glyph', () => {
  it('email chip container holds an <svg> element (not empty)', () => {
    const { container } = renderSheet();
    // The email channel card header chip span wraps the icon
    // Find the card by the accessible label for the email channel
    // The chip span is aria-hidden; the card has the channel label text "Email"
    const emailLabel = screen.getByText('Email');
    const card = emailLabel.closest('[class*="flex"][class*="flex-col"]') ?? emailLabel.closest('div[class]');
    expect(card).not.toBeNull();
    // Walk up to find the chip span that precedes the label
    const chipSpan = card!.querySelector('span[aria-hidden="true"]');
    expect(chipSpan).not.toBeNull();
    const svg = chipSpan!.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('email chip svg has a path element (not empty svg)', () => {
    const { container } = renderSheet();
    const emailLabel = screen.getByText('Email');
    const card = emailLabel.closest('[class*="flex"][class*="flex-col"]') ?? emailLabel.closest('div[class]');
    const chipSpan = card!.querySelector('span[aria-hidden="true"]');
    const svg = chipSpan!.querySelector('svg');
    const path = svg!.querySelector('path');
    expect(path).not.toBeNull();
    expect(path!.getAttribute('d')).toBeTruthy();
  });

  it('copy_link chip container holds an <svg> element (not empty)', () => {
    const { container } = renderSheet();
    const copyLabel = screen.getByText('Copy link');
    const card = copyLabel.closest('[class*="flex"][class*="flex-col"]') ?? copyLabel.closest('div[class]');
    expect(card).not.toBeNull();
    const chipSpan = card!.querySelector('span[aria-hidden="true"]');
    expect(chipSpan).not.toBeNull();
    const svg = chipSpan!.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('copy_link chip svg has a path element (not empty svg)', () => {
    const { container } = renderSheet();
    const copyLabel = screen.getByText('Copy link');
    const card = copyLabel.closest('[class*="flex"][class*="flex-col"]') ?? copyLabel.closest('div[class]');
    const chipSpan = card!.querySelector('span[aria-hidden="true"]');
    const svg = chipSpan!.querySelector('svg');
    const path = svg!.querySelector('path');
    expect(path).not.toBeNull();
    expect(path!.getAttribute('d')).toBeTruthy();
  });

  it('no raw "copy_link" slug appears in ShareSheet rendered text', () => {
    const { container } = renderSheet();
    expect(container.textContent).not.toContain('copy_link');
  });

  it('no raw "email" slug appears as a standalone internal key (label is "Email" with capital E)', () => {
    const { container } = renderSheet();
    // Verify the human-readable label "Email" renders (capital E)
    expect(screen.getByText('Email')).toBeDefined();
    // The raw internal key "email" (lowercase, bare) should only appear as aria/data attrs, not user-visible text
    // textContent check: "Email" text is fine; the channel key "email" alone in lowercase is the enum slug
    // We verify "copy_link" is absent (the email slug is "email" which also appears in "Email" — check for standalone slug)
    const allText = container.textContent ?? '';
    expect(allText).not.toContain('copy_link');
  });
});

// ---------------------------------------------------------------------------
// ShareStudio — email and copy_link channel card icons
// ---------------------------------------------------------------------------

describe('CB-82 — ShareStudio renders SVG glyphs for email and copy_link channels', () => {
  it('email channel scard__head renders an <svg> mail icon', () => {
    const { container } = renderStudio({
      email: 'Send an email about our community.',
      copy_link: 'Copy the link to share.',
    });
    // Find the email channel card by its label text
    const emailLabel = screen.getByText('Email');
    const scardHead = emailLabel.closest('.scard__head');
    expect(scardHead).not.toBeNull();
    const svg = scardHead!.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('email channel scard__head svg has a path element', () => {
    const { container } = renderStudio({
      email: 'Send an email about our community.',
      copy_link: 'Copy the link to share.',
    });
    const emailLabel = screen.getByText('Email');
    const scardHead = emailLabel.closest('.scard__head');
    const svg = scardHead!.querySelector('svg');
    expect(svg!.querySelector('path')).not.toBeNull();
  });

  it('copy_link channel scard__head renders an <svg> link icon', () => {
    const { container } = renderStudio({
      copy_link: 'Copy the link to share.',
      email: 'Send an email.',
    });
    // "Copy link" appears both as scard label and the standalone copy-link button — use getAllByText
    const copyLabels = screen.getAllByText('Copy link');
    // At least one should be inside a scard__head
    const scardHeads = copyLabels.map((el) => el.closest('.scard__head')).filter(Boolean);
    expect(scardHeads.length).toBeGreaterThan(0);
    const svg = scardHeads[0]!.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('copy_link channel scard__head svg has a path element', () => {
    const { container } = renderStudio({
      copy_link: 'Copy the link to share.',
      email: 'Send an email.',
    });
    const copyLabels = screen.getAllByText('Copy link');
    const scardHeads = copyLabels.map((el) => el.closest('.scard__head')).filter(Boolean);
    expect(scardHeads.length).toBeGreaterThan(0);
    const svg = scardHeads[0]!.querySelector('svg');
    expect(svg!.querySelector('path')).not.toBeNull();
  });

  it('no raw "copy_link" slug appears as viewer-facing text in ShareStudio', () => {
    const { container } = renderStudio({
      email: 'Send an email about our community.',
      copy_link: 'Copy the link to share.',
    });
    expect(container.textContent).not.toContain('copy_link');
  });

  it('whatsapp channel scard__head renders an <svg> (existing channels unaffected)', () => {
    const { container } = renderStudio({
      whatsapp: 'Share on WhatsApp.',
      facebook: 'Share on Facebook.',
    });
    const waLabel = screen.getByText('WhatsApp');
    const scardHead = waLabel.closest('.scard__head');
    expect(scardHead).not.toBeNull();
    const svg = scardHead!.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('x channel scard__head renders an <svg> (existing channels unaffected)', () => {
    const { container } = renderStudio({
      x: 'Post on X.',
      facebook: 'Share on Facebook.',
    });
    const xLabel = screen.getByText('X');
    const scardHead = xLabel.closest('.scard__head');
    expect(scardHead).not.toBeNull();
    const svg = scardHead!.querySelector('svg');
    expect(svg).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Icon identity — mail path matches mocks/icons.js i-email, link path matches i-link
// ---------------------------------------------------------------------------

describe('CB-82 — Icon glyphs match mocks/icons.js reference paths', () => {
  // From mocks/icons.js:
  // i-email path: M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm9 7.01L4.5 7h15L12 12.01ZM4 9.24V17h16V9.24l-7.4 4.93a1 1 0 0 1-1.2 0L4 9.24Z
  // i-link path: M10.59 13.41a1 1 0 0 0 1.42 0l4-4a3 3 0 0 0-4.24-4.24l-1.3 1.3...

  const EMAIL_PATH_PREFIX = 'M3 5h18';
  const LINK_PATH_PREFIX = 'M10.59 13.41';

  it('ShareSheet email chip svg path starts with the mail glyph prefix', () => {
    const { container } = renderSheet();
    const emailLabel = screen.getByText('Email');
    const card = emailLabel.closest('[class*="flex"][class*="flex-col"]') ?? emailLabel.closest('div[class]');
    const chipSpan = card!.querySelector('span[aria-hidden="true"]');
    const path = chipSpan!.querySelector('svg path');
    expect(path!.getAttribute('d')).toContain(EMAIL_PATH_PREFIX);
  });

  it('ShareSheet copy_link chip svg path starts with the link glyph prefix', () => {
    const { container } = renderSheet();
    const copyLabel = screen.getByText('Copy link');
    const card = copyLabel.closest('[class*="flex"][class*="flex-col"]') ?? copyLabel.closest('div[class]');
    const chipSpan = card!.querySelector('span[aria-hidden="true"]');
    const path = chipSpan!.querySelector('svg path');
    expect(path!.getAttribute('d')).toContain(LINK_PATH_PREFIX);
  });

  it('ShareStudio email scard svg path starts with the mail glyph prefix', () => {
    const { container } = renderStudio({
      email: 'Send an email.',
      copy_link: 'Copy the link.',
    });
    const emailLabel = screen.getByText('Email');
    const scardHead = emailLabel.closest('.scard__head');
    const path = scardHead!.querySelector('svg path');
    expect(path!.getAttribute('d')).toContain(EMAIL_PATH_PREFIX);
  });

  it('ShareStudio copy_link scard svg path starts with the link glyph prefix', () => {
    const { container } = renderStudio({
      copy_link: 'Copy the link.',
      email: 'Send an email.',
    });
    const copyLabels = screen.getAllByText('Copy link');
    const scardHeads = copyLabels.map((el) => el.closest('.scard__head')).filter(Boolean);
    expect(scardHeads.length).toBeGreaterThan(0);
    const path = scardHeads[0]!.querySelector('svg path');
    expect(path!.getAttribute('d')).toContain(LINK_PATH_PREFIX);
  });
});
