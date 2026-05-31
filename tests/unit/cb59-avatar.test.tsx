/**
 * CB-59 — Avatar: named personas get PFP + trophy; anonymous stays generic glyph.
 *
 * Covers:
 *  - Named persona with pfpUrl renders an <img> element (not a text initial or glyph)
 *  - Anonymous persona (no name, no pfpUrl) renders the generic person glyph (no <img>)
 *  - A persona with trophy:true renders the trophy badge
 *  - A persona with trophy:false / absent does NOT render the trophy badge
 *  - Backward-compat: rendering Avatar with just slug+initial props still works (no crash)
 *  - PFP image has deterministic src derived from the persona's pfpUrl
 *  - Anonymous initial='' continues to render the SVG glyph, not a text node
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar } from '@/components/shared/Avatar';
import { PERSONAS } from '@/fixtures/personas';

// ── PFP rendering ─────────────────────────────────────────────────────────────

describe('Avatar — PFP for named personas', () => {
  it('renders an <img> when pfpUrl is present on the avatar prop', () => {
    const sarahAvatar = PERSONAS.close_friend.avatar;
    // After CB-59 implementation, pfpUrl should be set on close_friend
    expect(sarahAvatar.pfpUrl).toBeTruthy();

    render(
      <Avatar
        initial={sarahAvatar.initial}
        bg={sarahAvatar.bg}
        fg={sarahAvatar.fg}
        pfpUrl={sarahAvatar.pfpUrl}
        label="Sarah K."
      />
    );

    const img = screen.getByRole('img', { name: /sarah k/i });
    // The <img> inside the wrapper should have the pfpUrl as its src
    const imgEl = img.querySelector('img') ?? (img.tagName === 'IMG' ? img : null);
    expect(imgEl).not.toBeNull();
    expect((imgEl as HTMLImageElement).src).toContain('picsum.photos/seed/persona-close_friend');
  });

  it('renders an <img> for extrovert Mike T. with his pfpUrl', () => {
    const mikeAvatar = PERSONAS.extrovert.avatar;
    expect(mikeAvatar.pfpUrl).toBeTruthy();

    render(
      <Avatar
        initial={mikeAvatar.initial}
        bg={mikeAvatar.bg}
        fg={mikeAvatar.fg}
        pfpUrl={mikeAvatar.pfpUrl}
        label="Mike T."
      />
    );

    const wrapper = screen.getByRole('img', { name: /mike t/i });
    const imgEl = wrapper.querySelector('img') ?? (wrapper.tagName === 'IMG' ? wrapper : null);
    expect(imgEl).not.toBeNull();
    expect((imgEl as HTMLImageElement).src).toContain('picsum.photos/seed/persona-extrovert');
  });

  it('renders an <img> for returning_lapsed Priya M.', () => {
    const priyaAvatar = PERSONAS.returning_lapsed.avatar;
    expect(priyaAvatar.pfpUrl).toBeTruthy();

    const { container } = render(
      <Avatar
        initial={priyaAvatar.initial}
        bg={priyaAvatar.bg}
        fg={priyaAvatar.fg}
        pfpUrl={priyaAvatar.pfpUrl}
        label="Priya M."
      />
    );

    const imgTags = container.querySelectorAll('img');
    expect(imgTags.length).toBeGreaterThan(0);
  });

  it('renders an <img> for profile_owner Janahan S.', () => {
    const janahanAvatar = PERSONAS.profile_owner.avatar;
    expect(janahanAvatar.pfpUrl).toBeTruthy();

    const { container } = render(
      <Avatar
        initial={janahanAvatar.initial}
        bg={janahanAvatar.bg}
        fg={janahanAvatar.fg}
        pfpUrl={janahanAvatar.pfpUrl}
        label="Janahan S."
      />
    );

    const imgTags = container.querySelectorAll('img');
    expect(imgTags.length).toBeGreaterThan(0);
  });

  it('renders the initial letter (no img) when pfpUrl is absent', () => {
    const { container } = render(
      <Avatar initial="S" bg="#ffd863" fg="#68570d" label="S" />
    );

    const imgTags = container.querySelectorAll('img');
    expect(imgTags.length).toBe(0);
    expect(screen.getByText('S')).toBeDefined();
  });
});

// ── Anonymous — no PFP, stays generic glyph ──────────────────────────────────

describe('Avatar — anonymous stays generic glyph', () => {
  it('renders the SVG glyph (no <img>) for anonymous with empty initial and no pfpUrl', () => {
    const anonAvatar = PERSONAS.anonymous.avatar;
    expect(anonAvatar.pfpUrl).toBeFalsy();

    const { container } = render(
      <Avatar
        initial={anonAvatar.initial}  // ''
        bg={anonAvatar.bg}
        fg={anonAvatar.fg}
        label="User avatar"
      />
    );

    // Must have SVG glyph
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    // Must NOT have an <img>
    const imgTags = container.querySelectorAll('img');
    expect(imgTags.length).toBe(0);
  });

  it('shared_by_extro (anonymous guest) also has no pfpUrl', () => {
    const guestAvatar = PERSONAS.shared_by_extro.avatar;
    expect(guestAvatar.pfpUrl).toBeFalsy();
  });

  it('renders glyph even when pfpUrl is explicitly undefined', () => {
    const { container } = render(
      <Avatar initial="" bg="#f5f5f5" fg="#6f6f6f" pfpUrl={undefined} label="User avatar" />
    );

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    const imgTags = container.querySelectorAll('img');
    expect(imgTags.length).toBe(0);
  });
});

// ── Trophy badge ──────────────────────────────────────────────────────────────

describe('Avatar — trophy badge', () => {
  it('renders a trophy badge when showTrophy=true', () => {
    const { container } = render(
      <Avatar initial="M" bg="#ccf88e" fg="#274a34" showTrophy label="Mike T." />
    );

    const badge = container.querySelector('[data-testid="avatar-trophy"]');
    expect(badge).not.toBeNull();
  });

  it('renders trophy badge content (trophy emoji or text)', () => {
    const { container } = render(
      <Avatar initial="M" bg="#ccf88e" fg="#274a34" showTrophy label="Mike T." />
    );

    const badge = container.querySelector('[data-testid="avatar-trophy"]');
    expect(badge?.textContent).toBeTruthy();
  });

  it('does NOT render trophy badge when showTrophy is absent (default)', () => {
    const { container } = render(
      <Avatar initial="M" bg="#ccf88e" fg="#274a34" label="Mike T." />
    );

    const badge = container.querySelector('[data-testid="avatar-trophy"]');
    expect(badge).toBeNull();
  });

  it('does NOT render trophy badge when showTrophy=false', () => {
    const { container } = render(
      <Avatar initial="M" bg="#ccf88e" fg="#274a34" showTrophy={false} label="Mike T." />
    );

    const badge = container.querySelector('[data-testid="avatar-trophy"]');
    expect(badge).toBeNull();
  });

  it('extrovert fixture has trophy:true in its avatar', () => {
    expect(PERSONAS.extrovert.avatar.trophy).toBe(true);
  });

  it('anonymous fixture does NOT have trophy', () => {
    expect(PERSONAS.anonymous.avatar.trophy).toBeFalsy();
  });
});

// ── Backward compatibility ────────────────────────────────────────────────────

describe('Avatar — backward compatibility', () => {
  it('renders with just initial (old API) — no crash', () => {
    const { container } = render(<Avatar initial="J" />);
    expect(screen.getByText('J')).toBeDefined();
    // No img, no trophy
    expect(container.querySelectorAll('img').length).toBe(0);
    expect(container.querySelector('[data-testid="avatar-trophy"]')).toBeNull();
  });

  it('renders with size prop — still works', () => {
    const { container } = render(<Avatar initial="P" size="lg" />);
    expect(screen.getByText('P')).toBeDefined();
  });

  it('renders with bg and fg props — still works', () => {
    render(<Avatar initial="S" bg="#ffd863" fg="#68570d" label="Sarah" />);
    expect(screen.getByRole('img', { name: /sarah/i })).toBeDefined();
  });

  it('renders with all old props and no new ones — no crash', () => {
    render(
      <Avatar
        initial="J"
        bg="#232323"
        fg="#ffffff"
        size="xl"
        label="Janahan S."
      />
    );
    expect(screen.getByRole('img', { name: /janahan/i })).toBeDefined();
  });

  it('all 6 persona avatar shapes are valid (pfpUrl optional, trophy optional)', () => {
    // Ensures fixture shape matches the updated type
    for (const slug of Object.keys(PERSONAS) as Array<keyof typeof PERSONAS>) {
      const avatar = PERSONAS[slug].avatar;
      expect(typeof avatar.bg).toBe('string');
      expect(typeof avatar.fg).toBe('string');
      expect(typeof avatar.initial).toBe('string');
      // pfpUrl and trophy may be undefined on anonymous/shared_by_extro
      if (avatar.pfpUrl !== undefined) {
        expect(typeof avatar.pfpUrl).toBe('string');
        expect(avatar.pfpUrl).toContain('picsum.photos/seed/persona-');
      }
      if (avatar.trophy !== undefined) {
        expect(typeof avatar.trophy).toBe('boolean');
      }
    }
  });
});
