/**
 * analytics/section-viewed — unit tests
 * Covers: useSectionViewed dedup logic.
 *
 * Strategy: The jsdom IntersectionObserver stub (from setup.ts) is a class with vi.fn() methods
 * but does NOT actually fire callbacks. We drive the dedup Set logic by:
 * 1. Rendering a test component that calls useSectionViewed.
 * 2. Manually extracting and calling the observer callback through the constructor override.
 *
 * The test intercepts IntersectionObserver construction to capture the callback,
 * then calls it with a synthetic intersecting entry to simulate the observer firing.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { __resetSectionViewed, useSectionViewed } from '@/lib/analytics/section-viewed';
import { writeOverlayOn } from '@/lib/overlay/storage';

// ── Setup ────────────────────────────────────────────────────────────────────

// We'll mock fetch to capture capture() calls (which POST to /api/ticker/ingest)
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  __resetSectionViewed();
  writeOverlayOn(false);
  localStorage.clear();
  fetchMock = vi.fn().mockResolvedValue({ ok: true });
  globalThis.fetch = fetchMock;
});

afterEach(() => {
  vi.restoreAllMocks();
  __resetSectionViewed();
});

// ── Helper: controllable IntersectionObserver ────────────────────────────────

type IOCallback = (entries: IntersectionObserverEntry[]) => void;

function makeControllableIO(): {
  triggerIntersect: () => void;
  observeSpy: ReturnType<typeof vi.fn>;
} {
  let savedCallback: IOCallback | null = null;
  let savedEl: Element | null = null;
  const observeSpy = vi.fn((el: Element) => {
    savedEl = el;
  });

  class ControllableIO {
    constructor(cb: IOCallback) {
      savedCallback = cb;
    }
    observe = observeSpy;
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn(() => []);
    root = null;
    rootMargin = '';
    thresholds = [];
  }

  (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = ControllableIO;

  return {
    triggerIntersect: () => {
      if (savedCallback && savedEl) {
        savedCallback([
          { isIntersecting: true, target: savedEl } as IntersectionObserverEntry,
        ]);
      }
    },
    observeSpy,
  };
}

// ── Tests: dedup — fires once per section_name per session ─────────────────

describe('useSectionViewed dedup', () => {
  it('fires capture exactly once when the element becomes visible', () => {
    const { triggerIntersect } = makeControllableIO();
    const el = document.createElement('div');
    document.body.appendChild(el);

    const { result } = renderHook(() => useSectionViewed('hero'));
    // Attach the ref callback to the element
    act(() => {
      result.current(el);
    });
    // Trigger first intersection
    act(() => {
      triggerIntersect();
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const body = JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(body.event).toBe('Section Viewed');
    expect(body.props.section_name).toBe('hero');

    document.body.removeChild(el);
  });

  it('does NOT fire a second time for the same section_name after triggering again', () => {
    const { triggerIntersect } = makeControllableIO();
    const el = document.createElement('div');
    document.body.appendChild(el);

    const { result } = renderHook(() => useSectionViewed('donate-section'));
    act(() => { result.current(el); });

    // First trigger
    act(() => { triggerIntersect(); });
    // Second trigger (should be deduped)
    act(() => { triggerIntersect(); });

    // Only one fetch call despite two intersection events
    expect(fetchMock).toHaveBeenCalledOnce();

    document.body.removeChild(el);
  });

  it('fires once per distinct section_name (different sections are independent)', () => {
    const { triggerIntersect: triggerA } = makeControllableIO();
    const elA = document.createElement('div');
    document.body.appendChild(elA);
    const { result: resultA } = renderHook(() => useSectionViewed('section-a'));
    act(() => { resultA.current(elA); });
    act(() => { triggerA(); });

    // Reset the IO for the second section
    const { triggerIntersect: triggerB } = makeControllableIO();
    const elB = document.createElement('div');
    document.body.appendChild(elB);
    const { result: resultB } = renderHook(() => useSectionViewed('section-b'));
    act(() => { resultB.current(elB); });
    act(() => { triggerB(); });

    // Two different section names → two fetch calls
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const bodyA = JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string);
    const bodyB = JSON.parse((fetchMock.mock.calls[1] as [string, RequestInit])[1].body as string);
    expect(bodyA.props.section_name).toBe('section-a');
    expect(bodyB.props.section_name).toBe('section-b');

    document.body.removeChild(elA);
    document.body.removeChild(elB);
  });

  it('survives re-render with same sectionName — dedup persists across re-renders', () => {
    const { triggerIntersect } = makeControllableIO();
    const el = document.createElement('div');
    document.body.appendChild(el);

    const { result, rerender } = renderHook(() => useSectionViewed('sticky-section'));
    act(() => { result.current(el); });
    act(() => { triggerIntersect(); });

    // Re-render (simulates persona-switch re-render)
    rerender();
    act(() => { result.current(el); });
    act(() => { triggerIntersect(); });

    // Still only one event fired
    expect(fetchMock).toHaveBeenCalledOnce();

    document.body.removeChild(el);
  });

  it('respects __resetSectionViewed — after reset the same name fires again', () => {
    const { triggerIntersect: triggerFirst } = makeControllableIO();
    const el = document.createElement('div');
    document.body.appendChild(el);

    const { result } = renderHook(() => useSectionViewed('resettable'));
    act(() => { result.current(el); });
    act(() => { triggerFirst(); });

    expect(fetchMock).toHaveBeenCalledOnce();

    // Reset dedup set (test isolation utility)
    __resetSectionViewed();
    fetchMock.mockClear();

    // Re-attach a new hook after reset
    const { triggerIntersect: triggerSecond } = makeControllableIO();
    const { result: result2 } = renderHook(() => useSectionViewed('resettable'));
    act(() => { result2.current(el); });
    act(() => { triggerSecond(); });

    // After reset, it fires again
    expect(fetchMock).toHaveBeenCalledOnce();

    document.body.removeChild(el);
  });

  it('does NOT observe a null element (graceful no-op)', () => {
    const { result } = renderHook(() => useSectionViewed('null-section'));
    // Passing null should not throw
    expect(() => {
      act(() => { result.current(null); });
    }).not.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does NOT fire when section is already in dedup set before observer attaches', () => {
    const { triggerIntersect } = makeControllableIO();
    const el = document.createElement('div');
    document.body.appendChild(el);

    // First hook instance fires once
    const { result: r1 } = renderHook(() => useSectionViewed('pre-seen'));
    act(() => { r1.current(el); });
    act(() => { triggerIntersect(); });
    expect(fetchMock).toHaveBeenCalledOnce();
    fetchMock.mockClear();

    // Second hook for the same section_name — should not fire again
    const { triggerIntersect: trigger2 } = makeControllableIO();
    const { result: r2 } = renderHook(() => useSectionViewed('pre-seen'));
    act(() => { r2.current(el); });
    act(() => { trigger2(); });
    expect(fetchMock).not.toHaveBeenCalled();

    document.body.removeChild(el);
  });
});
