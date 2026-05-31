/**
 * Component tests for components/shared/{FollowButton,ShareSheet,Button}
 * Covers:
 *  - FollowButton 'primary' variant is NOT green-on-white (uses #232323 token)
 *  - ShareSheet renders the cached copy from copyByChannel and falls back gracefully
 *  - Button basic rendering
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { FollowButton } from '@/components/shared/FollowButton';
import { ShareSheet } from '@/components/shared/ShareSheet';
import { Button } from '@/components/shared/Button';
import type { ShareChannel } from '@/lib/types';

// ── FollowButton — primary variant guardrail ─────────────────────────────────

describe('FollowButton — primary variant token check (NOT green on white)', () => {
  it('primary variant has the dark #232323 token class, not a green token', () => {
    render(
      <FollowButton
        variant="primary"
        following={false}
        label="Follow Sarah J."
        onToggle={vi.fn()}
      />
    );
    const btn = screen.getByRole('button');
    const className = btn.className;
    // The primary button uses var(--hrt-color-button-primary-surface) which is #232323
    // We assert the CSS variable reference is present (not a green token like #ccf88e or 'lime')
    expect(className).toContain('bg-[var(--hrt-color-button-primary-surface)]');
    expect(className).not.toContain('lime');
    expect(className).not.toContain('ccf88e');
    expect(className).not.toContain('green');
  });

  it('primary variant has the primary text token, not a green text class', () => {
    render(
      <FollowButton
        variant="primary"
        following={false}
        label="Follow"
        onToggle={vi.fn()}
      />
    );
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('text-[var(--hrt-color-button-primary-text)]');
    expect(btn.className).not.toContain('lime');
  });

  it('primary variant is not aria-pressed when not following', () => {
    render(
      <FollowButton
        variant="primary"
        following={false}
        label="Follow"
        onToggle={vi.fn()}
      />
    );
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('aria-pressed')).toBe('false');
  });

  it('shows "Following" with a checkmark when following=true', () => {
    render(
      <FollowButton
        variant="primary"
        following={true}
        label="Follow"
        onToggle={vi.fn()}
      />
    );
    expect(screen.getByText('Following')).toBeDefined();
  });

  it('following state uses the muted surface (NOT primary dark), regardless of variant', () => {
    render(
      <FollowButton
        variant="primary"
        following={true}
        label="Follow"
        onToggle={vi.fn()}
      />
    );
    const btn = screen.getByRole('button');
    // Following state should use neutral subtle surface, NOT the primary dark surface
    expect(btn.className).toContain('bg-[var(--hrt-color-surface-neutral-subtle)]');
    expect(btn.className).not.toContain('hrt-color-button-primary-surface)]');
  });

  it('disabled state adds cursor-not-allowed class', () => {
    render(
      <FollowButton
        variant="primary"
        following={false}
        label="Follow"
        onToggle={vi.fn()}
        disabled={true}
      />
    );
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('cursor-not-allowed');
    expect(btn).toHaveAttribute('disabled');
  });

  it('ghost variant uses transparent background, not primary dark', () => {
    render(
      <FollowButton
        variant="ghost"
        following={false}
        label="Follow"
        onToggle={vi.fn()}
      />
    );
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-transparent');
    expect(btn.className).not.toContain('hrt-color-button-primary-surface)]');
  });
});

// ── ShareSheet — renders copyByChannel, falls back gracefully ────────────────

describe('ShareSheet — renders copy from copyByChannel', () => {
  const defaultOnShare = vi.fn();

  it('renders a channel card for each visible channel', () => {
    render(
      <ShareSheet
        entityType="fundraiser"
        entityId="fundraiser-001"
        copyByChannel={{}}
        context="Share this fundraiser"
        onShare={defaultOnShare}
      />
    );
    // All 7 visible channels should appear
    const visibleChannels = ['Facebook', 'X', 'WhatsApp', 'Messenger', 'SMS', 'Email', 'Copy link'];
    for (const label of visibleChannels) {
      expect(screen.getByText(label)).toBeDefined();
    }
  });

  it('uses the provided copy from copyByChannel for a channel', () => {
    const customCopy: Partial<Record<ShareChannel, string>> = {
      facebook: 'Help us reach our wildfire goal — share on Facebook!',
    };
    render(
      <ShareSheet
        entityType="fundraiser"
        entityId="fundraiser-001"
        copyByChannel={customCopy}
        context="Share this"
        onShare={defaultOnShare}
      />
    );
    expect(screen.getByText('Help us reach our wildfire goal — share on Facebook!')).toBeDefined();
  });

  it('falls back to generic copy when a channel is missing from copyByChannel', () => {
    render(
      <ShareSheet
        entityType="fundraiser"
        entityId="fundraiser-001"
        copyByChannel={{}} // all channels missing → all use generic fallback
        context="Share this"
        onShare={defaultOnShare}
      />
    );
    // Fallback copy for whatsapp
    expect(screen.getByText(/Hi! I thought you might want to support this fundraiser/)).toBeDefined();
  });

  it('renders all channels gracefully when copyByChannel is empty', () => {
    const { container } = render(
      <ShareSheet
        entityType="fundraiser"
        entityId="fundraiser-001"
        copyByChannel={{}}
        context="Share this"
        onShare={defaultOnShare}
      />
    );
    // 7 visible channels → 7 channel cards (each has a "Share on X" button or similar)
    const cards = container.querySelectorAll('[role="listitem"]');
    expect(cards.length).toBe(7);
  });

  it('renders channel-specific CTA buttons', () => {
    render(
      <ShareSheet
        entityType="fundraiser"
        entityId="fundraiser-001"
        copyByChannel={{}}
        context="Share this"
        onShare={defaultOnShare}
      />
    );
    // "Share on Facebook" etc.
    expect(screen.getByRole('button', { name: /share on facebook/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /share on whatsapp/i })).toBeDefined();
  });

  it('CTA button background is NOT a green token (uses primary surface token)', () => {
    const { container } = render(
      <ShareSheet
        entityType="fundraiser"
        entityId="fundraiser-001"
        copyByChannel={{}}
        context="Share this"
        onShare={defaultOnShare}
      />
    );
    // Each channel card CTA uses bg-[var(--hrt-color-button-primary-surface)]
    // NOT a green CTA on white
    const ctaButtons = container.querySelectorAll('[type="button"]');
    for (const btn of ctaButtons) {
      const cls = btn.className;
      // Should not contain lime/green direct tokens
      expect(cls).not.toContain('ccf88e');
      expect(cls).not.toContain('lime-');
    }
  });
});

// ── Button — basic rendering and variant data-attribute ──────────────────────

describe('Button — rendering', () => {
  it('renders children', () => {
    render(<Button>Donate</Button>);
    expect(screen.getByText('Donate')).toBeDefined();
  });

  it('has data-variant attribute set to the variant prop', () => {
    render(<Button variant="primary">Click</Button>);
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('data-variant')).toBe('primary');
  });

  it('secondary variant has data-variant="secondary"', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('data-variant')).toBe('secondary');
  });

  it('disabled button has disabled attribute', () => {
    render(<Button disabled>Disabled</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('disabled');
  });

  it('block prop adds w-full class', () => {
    render(<Button block>Block</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('w-full');
  });

  it('primary variant className contains primary-surface token, not green/lime', () => {
    render(<Button variant="primary">Primary</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-[var(--hrt-color-button-primary-surface)]');
    expect(btn.className).not.toContain('lime');
    expect(btn.className).not.toContain('ccf88e');
  });
});
