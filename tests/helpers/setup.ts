import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Default demo mode ON for unit/component tests; individual suites override.
process.env.NEXT_PUBLIC_DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE ?? 'true';

afterEach(() => {
  cleanup();
});

// jsdom lacks these; stub so components that probe them don't throw.
if (typeof window !== 'undefined') {
  window.matchMedia =
    window.matchMedia ||
    ((query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList);

  // IntersectionObserver (Section Viewed dedup)
  if (!('IntersectionObserver' in window)) {
    class IO {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      takeRecords = vi.fn(() => []);
      root = null;
      rootMargin = '';
      thresholds = [];
    }
    (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = IO;
    (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = IO;
  }
}
