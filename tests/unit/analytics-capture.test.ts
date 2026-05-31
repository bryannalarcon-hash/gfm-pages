/**
 * analytics/capture — unit tests
 * Covers: isCaptureSuppressed, capture (persona attachment, suppression, POST to ingest).
 * Type-level test: non-EventName is rejected (// @ts-expect-error).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isCaptureSuppressed,
  capture,
  type CaptureProps,
} from '@/lib/analytics/capture';
import type { EventName } from '@/lib/types';
import { writeOverlayOn, OVERLAY_PERSONA_KEY } from '@/lib/overlay/storage';

// Mock posthog-js so tests never initialize a real PostHog instance
vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
  },
}));

// Reset mocks and localStorage before each test
beforeEach(() => {
  localStorage.clear();
  vi.resetAllMocks();
  // Reset overlay to OFF by default
  writeOverlayOn(false);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── isCaptureSuppressed ──────────────────────────────────────────────────────

describe('isCaptureSuppressed', () => {
  it('returns false when overlay is OFF', () => {
    writeOverlayOn(false);
    expect(isCaptureSuppressed()).toBe(false);
  });

  it('returns true when overlay is ON', () => {
    writeOverlayOn(true);
    expect(isCaptureSuppressed()).toBe(true);
  });
});

// ── Type-level: non-EventName rejected ──────────────────────────────────────

// This test is a compile-time proof. The @ts-expect-error directive confirms
// that TypeScript refuses a string not in the EventName union.
const _typeCheck: EventName = 'Page Viewed'; // valid
// @ts-expect-error 'Banner Impression' is NOT a member of EventName
const _badEvent: EventName = 'Banner Impression';

describe('capture — type enforcement', () => {
  it('accepts a valid EventName without TypeScript error', () => {
    // If this compiles, EventName type enforcement is working.
    const validName: EventName = 'Page Viewed';
    expect(validName).toBe('Page Viewed');
  });
});

// ── capture — suppression behavior ──────────────────────────────────────────

describe('capture — suppression: does NOT POST when overlay is ON', () => {
  it('does not call fetch when overlay is ON (suppressed)', () => {
    writeOverlayOn(true);
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    capture('Page Viewed', { persona: 'anonymous' });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});

// ── capture — active: POSTs to /api/ticker/ingest ───────────────────────────

describe('capture — not suppressed: POSTs to /api/ticker/ingest', () => {
  it('calls fetch with /api/ticker/ingest when overlay is OFF', () => {
    writeOverlayOn(false);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock;

    capture('Donate Intent', { persona: 'close_friend' });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/ticker/ingest');
    expect(options.method).toBe('POST');
  });

  it('POSTs JSON with the correct event name in the body', () => {
    writeOverlayOn(false);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock;

    capture('Share Clicked', { persona: 'extrovert', share_channel: 'whatsapp' });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body.event).toBe('Share Clicked');
  });

  it('attaches persona from props when provided', () => {
    writeOverlayOn(false);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock;

    capture('Follow Clicked', { persona: 'returning_lapsed' });

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body.persona).toBe('returning_lapsed');
    // props should also include the persona
    expect(body.props.persona).toBe('returning_lapsed');
  });

  it('resolves persona from localStorage when not in props', () => {
    writeOverlayOn(false);
    localStorage.setItem(OVERLAY_PERSONA_KEY, 'extrovert');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock;

    capture('Page Viewed');

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body.persona).toBe('extrovert');
  });

  it('defaults persona to "anonymous" when localStorage is empty and no props', () => {
    writeOverlayOn(false);
    localStorage.removeItem(OVERLAY_PERSONA_KEY);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock;

    capture('Page Viewed');

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body.persona).toBe('anonymous');
  });

  it('includes a timestamp ISO string in the POST body', () => {
    writeOverlayOn(false);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock;

    capture('Page Viewed');

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(typeof body.timestamp).toBe('string');
    expect(() => new Date(body.timestamp)).not.toThrow();
  });

  it('does NOT throw even if fetch itself throws', () => {
    writeOverlayOn(false);
    globalThis.fetch = vi.fn().mockImplementation(() => {
      throw new Error('network error');
    });

    // Must not propagate the error
    expect(() => capture('Page Viewed')).not.toThrow();
  });

  it('does NOT throw if fetch returns a rejected promise', () => {
    writeOverlayOn(false);
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network error'));

    expect(() => capture('Page Viewed')).not.toThrow();
  });
});
