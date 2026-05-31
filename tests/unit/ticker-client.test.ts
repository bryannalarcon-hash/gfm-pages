/**
 * ticker/client — unit tests
 * Covers: useEventStream parse of data: frames → TickerEvent, ring-buffer max,
 * personaFilter, malformed frame dropped without throwing.
 * Uses a controllable fake EventSource (jsdom lacks it).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEventStream, TICKER_PATH } from '@/lib/ticker/client';
import type { TickerEvent, EventName, ReferrerSource } from '@/lib/types';
import type { PersonaSlug } from '@/lib/personas/types';

// ── Fake EventSource ─────────────────────────────────────────────────────────

type ESEventName = 'open' | 'message' | 'error';
type ESListener = ((evt: Event | MessageEvent) => void);

interface FakeESInstance {
  onopen: (() => void) | null;
  onmessage: ((e: MessageEvent) => void) | null;
  onerror: (() => void) | null;
  close: ReturnType<typeof vi.fn>;
  // Helpers for tests to drive events
  fireOpen: () => void;
  fireMessage: (data: string) => void;
  fireError: () => void;
}

// We keep a reference to the latest instance so tests can drive it
let latestES: FakeESInstance | null = null;

class FakeEventSource {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;

  onopen: (() => void) | null = null;
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  close = vi.fn();
  url: string;

  constructor(url: string) {
    this.url = url;
    latestES = {
      onopen: null,
      onmessage: null,
      onerror: null,
      close: this.close,
      fireOpen: () => {
        this.onopen?.();
      },
      fireMessage: (data: string) => {
        this.onmessage?.({ data } as MessageEvent);
      },
      fireError: () => {
        this.onerror?.();
      },
    };

    // Wire up so assignments to instance props update the facade
    Object.defineProperties(latestES, {
      onopen: {
        get: () => this.onopen,
        set: (v) => { this.onopen = v; },
      },
      onmessage: {
        get: () => this.onmessage,
        set: (v) => { this.onmessage = v; },
      },
      onerror: {
        get: () => this.onerror,
        set: (v) => { this.onerror = v; },
      },
    });
  }
}

// Install fake before each test
beforeEach(() => {
  latestES = null;
  // @ts-expect-error overriding global
  globalThis.EventSource = FakeEventSource;
});

afterEach(() => {
  vi.restoreAllMocks();
  latestES = null;
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeTickerEvent(overrides: Partial<TickerEvent> = {}): TickerEvent {
  return {
    uuid: 'uuid-001',
    event: 'Page Viewed' as EventName,
    timestamp: new Date().toISOString(),
    persona: 'anonymous' as PersonaSlug,
    referrerSource: 'direct' as ReferrerSource,
    keyProp: { label: 'page', value: '/f/slug' },
    ...overrides,
  };
}

// ── TICKER_PATH constant ─────────────────────────────────────────────────────

describe('TICKER_PATH', () => {
  it('is the string "/api/ticker"', () => {
    expect(TICKER_PATH).toBe('/api/ticker');
  });
});

// ── useEventStream — parse a valid data: frame ──────────────────────────────

describe('useEventStream — parsing valid frames', () => {
  it('appends a valid TickerEvent when a message arrives', () => {
    const { result } = renderHook(() => useEventStream());

    act(() => {
      latestES!.fireOpen();
    });
    expect(result.current.connected).toBe(true);

    const evt = makeTickerEvent({ uuid: 'abc-123' });
    act(() => {
      latestES!.fireMessage(JSON.stringify(evt));
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].uuid).toBe('abc-123');
    expect(result.current.events[0].event).toBe('Page Viewed');
  });

  it('sets connected=true on open and connected=false on error', () => {
    const { result } = renderHook(() => useEventStream());
    act(() => { latestES!.fireOpen(); });
    expect(result.current.connected).toBe(true);
    act(() => { latestES!.fireError(); });
    expect(result.current.connected).toBe(false);
  });
});

// ── Ring-buffer respects max ─────────────────────────────────────────────────

describe('useEventStream — ring-buffer max', () => {
  it('retains only the last `max` events when the buffer is exceeded', () => {
    const max = 3;
    const { result } = renderHook(() => useEventStream({ max }));

    act(() => { latestES!.fireOpen(); });

    // Send 5 events
    for (let i = 1; i <= 5; i++) {
      act(() => {
        latestES!.fireMessage(JSON.stringify(makeTickerEvent({ uuid: `uuid-${i}` })));
      });
    }

    expect(result.current.events).toHaveLength(max);
    // The last 3 events (3, 4, 5) should be retained
    expect(result.current.events.map((e) => e.uuid)).toEqual(['uuid-3', 'uuid-4', 'uuid-5']);
  });

  it('uses default max=50 when max is not specified', () => {
    const { result } = renderHook(() => useEventStream());

    act(() => { latestES!.fireOpen(); });

    for (let i = 1; i <= 50; i++) {
      act(() => {
        latestES!.fireMessage(JSON.stringify(makeTickerEvent({ uuid: `u-${i}` })));
      });
    }

    expect(result.current.events).toHaveLength(50);
  });
});

// ── personaFilter ────────────────────────────────────────────────────────────

describe('useEventStream — personaFilter', () => {
  it('passes all events when filter is "all" (default)', () => {
    const { result } = renderHook(() => useEventStream({ personaFilter: 'all' }));
    act(() => { latestES!.fireOpen(); });

    act(() => {
      latestES!.fireMessage(JSON.stringify(makeTickerEvent({ uuid: 'u1', persona: 'anonymous' })));
      latestES!.fireMessage(JSON.stringify(makeTickerEvent({ uuid: 'u2', persona: 'extrovert' })));
    });

    expect(result.current.events).toHaveLength(2);
  });

  it('filters to only the specified persona', () => {
    const { result } = renderHook(() => useEventStream({ personaFilter: 'close_friend' }));
    act(() => { latestES!.fireOpen(); });

    act(() => {
      latestES!.fireMessage(JSON.stringify(makeTickerEvent({ uuid: 'u1', persona: 'close_friend' })));
      latestES!.fireMessage(JSON.stringify(makeTickerEvent({ uuid: 'u2', persona: 'extrovert' })));
      latestES!.fireMessage(JSON.stringify(makeTickerEvent({ uuid: 'u3', persona: 'close_friend' })));
    });

    expect(result.current.events).toHaveLength(2);
    for (const e of result.current.events) {
      expect(e.persona).toBe('close_friend');
    }
  });

  it('deduplicated by uuid — same uuid is not added twice', () => {
    const { result } = renderHook(() => useEventStream());
    act(() => { latestES!.fireOpen(); });

    const evt = makeTickerEvent({ uuid: 'dup-uuid' });
    act(() => {
      latestES!.fireMessage(JSON.stringify(evt));
      latestES!.fireMessage(JSON.stringify(evt)); // duplicate
    });

    expect(result.current.events).toHaveLength(1);
  });
});

// ── Malformed frame dropped silently ─────────────────────────────────────────

describe('useEventStream — malformed frame handling', () => {
  it('drops a frame that is not valid JSON without throwing', () => {
    const { result } = renderHook(() => useEventStream());
    act(() => { latestES!.fireOpen(); });

    // Should not throw, should not add to events
    expect(() => {
      act(() => {
        latestES!.fireMessage('not valid json {{{');
      });
    }).not.toThrow();

    expect(result.current.events).toHaveLength(0);
  });

  it('drops a frame missing required TickerEvent fields without throwing', () => {
    const { result } = renderHook(() => useEventStream());
    act(() => { latestES!.fireOpen(); });

    const partial = { uuid: 'x', event: 'Page Viewed' }; // missing persona, timestamp, etc.
    expect(() => {
      act(() => {
        latestES!.fireMessage(JSON.stringify(partial));
      });
    }).not.toThrow();

    expect(result.current.events).toHaveLength(0);
  });

  it('drops a frame where keyProp is missing label or value', () => {
    const { result } = renderHook(() => useEventStream());
    act(() => { latestES!.fireOpen(); });

    const badKeyProp = {
      uuid: 'y',
      event: 'Page Viewed',
      timestamp: new Date().toISOString(),
      persona: 'anonymous',
      referrerSource: 'direct',
      keyProp: { label: 'page' }, // missing 'value'
    };
    expect(() => {
      act(() => {
        latestES!.fireMessage(JSON.stringify(badKeyProp));
      });
    }).not.toThrow();

    expect(result.current.events).toHaveLength(0);
  });

  it('drops a frame where keyProp is null', () => {
    const { result } = renderHook(() => useEventStream());
    act(() => { latestES!.fireOpen(); });

    const nullKeyProp = {
      uuid: 'z',
      event: 'Page Viewed',
      timestamp: new Date().toISOString(),
      persona: 'anonymous',
      referrerSource: 'direct',
      keyProp: null,
    };
    expect(() => {
      act(() => {
        latestES!.fireMessage(JSON.stringify(nullKeyProp));
      });
    }).not.toThrow();

    expect(result.current.events).toHaveLength(0);
  });
});
