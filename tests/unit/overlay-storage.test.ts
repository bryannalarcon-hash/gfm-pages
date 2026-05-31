/**
 * overlay/storage — unit tests
 * Covers: readOverlayOn, writeOverlayOn, readOverlayPersona, writeOverlayPersona,
 * constant key values, and SSR-safe (no window) defaults.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  OVERLAY_ON_KEY,
  OVERLAY_PERSONA_KEY,
  readOverlayOn,
  writeOverlayOn,
  readOverlayPersona,
  writeOverlayPersona,
} from '@/lib/overlay/storage';

// Helpers to remove all localStorage state before each test
beforeEach(() => {
  localStorage.clear();
});

// ── Constant key values ──────────────────────────────────────────────────────

describe('OVERLAY_ON_KEY and OVERLAY_PERSONA_KEY constants', () => {
  it('OVERLAY_ON_KEY is the literal string "overlayOn"', () => {
    expect(OVERLAY_ON_KEY).toBe('overlayOn');
  });

  it('OVERLAY_PERSONA_KEY is the literal string "overlayPersona"', () => {
    expect(OVERLAY_PERSONA_KEY).toBe('overlayPersona');
  });
});

// ── readOverlayOn ────────────────────────────────────────────────────────────

describe('readOverlayOn', () => {
  it('returns false when nothing is stored (default)', () => {
    expect(readOverlayOn()).toBe(false);
  });

  it('returns true after writeOverlayOn(true)', () => {
    writeOverlayOn(true);
    expect(readOverlayOn()).toBe(true);
  });

  it('returns false after writeOverlayOn(false)', () => {
    writeOverlayOn(false);
    expect(readOverlayOn()).toBe(false);
  });

  it('returns false if the stored value is a non-"true" string (e.g. "1")', () => {
    localStorage.setItem(OVERLAY_ON_KEY, '1');
    expect(readOverlayOn()).toBe(false);
  });

  it('SSR-safe: returns false when window is undefined', () => {
    const win = globalThis.window;
    // Temporarily remove window
    // @ts-expect-error intentional
    delete globalThis.window;
    const result = readOverlayOn();
    // Restore
    globalThis.window = win;
    expect(result).toBe(false);
  });
});

// ── writeOverlayOn ───────────────────────────────────────────────────────────

describe('writeOverlayOn', () => {
  it('stores "true" for true', () => {
    writeOverlayOn(true);
    expect(localStorage.getItem(OVERLAY_ON_KEY)).toBe('true');
  });

  it('stores "false" for false', () => {
    writeOverlayOn(false);
    expect(localStorage.getItem(OVERLAY_ON_KEY)).toBe('false');
  });

  it('SSR-safe: does NOT throw when window is undefined', () => {
    const win = globalThis.window;
    // @ts-expect-error intentional
    delete globalThis.window;
    expect(() => writeOverlayOn(true)).not.toThrow();
    globalThis.window = win;
  });
});

// ── readOverlayPersona ───────────────────────────────────────────────────────

describe('readOverlayPersona', () => {
  it('returns "anonymous" when nothing is stored (default)', () => {
    expect(readOverlayPersona()).toBe('anonymous');
  });

  it('returns the stored slug after writeOverlayPersona', () => {
    writeOverlayPersona('close_friend');
    expect(readOverlayPersona()).toBe('close_friend');
  });

  it('returns "anonymous" when the key is empty string', () => {
    localStorage.setItem(OVERLAY_PERSONA_KEY, '');
    expect(readOverlayPersona()).toBe('anonymous');
  });

  it('SSR-safe: returns "anonymous" when window is undefined', () => {
    const win = globalThis.window;
    // @ts-expect-error intentional
    delete globalThis.window;
    const result = readOverlayPersona();
    globalThis.window = win;
    expect(result).toBe('anonymous');
  });

  it('reflects all valid PersonaSlug values round-trip', () => {
    const slugs = ['anonymous', 'close_friend', 'extrovert', 'shared_by_extro', 'returning_lapsed', 'profile_owner'] as const;
    for (const s of slugs) {
      writeOverlayPersona(s);
      expect(readOverlayPersona()).toBe(s);
    }
  });
});

// ── writeOverlayPersona ──────────────────────────────────────────────────────

describe('writeOverlayPersona', () => {
  it('stores the slug string in localStorage', () => {
    writeOverlayPersona('extrovert');
    expect(localStorage.getItem(OVERLAY_PERSONA_KEY)).toBe('extrovert');
  });

  it('SSR-safe: does NOT throw when window is undefined', () => {
    const win = globalThis.window;
    // @ts-expect-error intentional
    delete globalThis.window;
    expect(() => writeOverlayPersona('anonymous')).not.toThrow();
    globalThis.window = win;
  });
});
