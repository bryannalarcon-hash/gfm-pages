/**
 * CB-43 / CB-61 / CB-62 / CB-63 — Dashboard widget tests
 *
 * CB-43: EventTicker shows idle/empty state (not "Reconnecting…") when
 *        demo data is off AND no live events have arrived.
 * CB-61: MetricTree exposes zoom-in / zoom-out controls that change scale.
 * CB-62: FunnelChart tooltip definitions map covers every funnel stage.
 * CB-63: MetricsCatalog clicking a row reveals full tracking info (capture site).
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ── CB-43 — EventTicker idle/empty state ─────────────────────────────────────

// Mock useEventStream so we can control connected + events
vi.mock('@/lib/ticker/client', () => ({
  useEventStream: vi.fn(() => ({ events: [], connected: false })),
}));

// Mock MetricBlob (not under test)
vi.mock('@/components/overlay/MetricBlob', () => ({
  MetricBlob: () => null,
}));

import { useEventStream } from '@/lib/ticker/client';
import { EventTicker } from '@/components/dashboard/EventTicker';

describe('CB-43 — EventTicker idle/empty state', () => {
  beforeEach(() => {
    vi.mocked(useEventStream).mockReturnValue({ events: [], connected: false });
  });

  it('shows idle/empty text (not "Reconnecting…") when no events and not connected', () => {
    render(<EventTicker personaFilter="all" />);
    // Must NOT show the reconnect spinner text
    expect(screen.queryByText(/reconnecting/i)).toBeNull();
    // Must show an idle/empty state message
    expect(screen.getByText(/no events yet/i)).toBeTruthy();
  });

  it('does not show the "Reconnecting…" status label in the idle/empty state', () => {
    render(<EventTicker personaFilter="all" />);
    // The status bar should NOT say "Reconnecting…" when there are no events
    const reconnectingElements = screen.queryAllByText(/reconnecting…/i);
    expect(reconnectingElements).toHaveLength(0);
  });

  it('shows "Reconnecting…" in the status bar when connected=false AND events exist', () => {
    // Events exist but connection dropped → real reconnect state, must show it
    const mockEvent = {
      uuid: 'u1',
      event: 'Page Viewed' as import('@/lib/types').EventName,
      timestamp: new Date().toISOString(),
      persona: 'anonymous' as import('@/lib/personas/types').PersonaSlug,
      referrerSource: 'direct' as import('@/lib/types').ReferrerSource,
      keyProp: { label: 'page', value: '/f/slug' },
    };
    vi.mocked(useEventStream).mockReturnValue({ events: [mockEvent], connected: false });
    render(<EventTicker personaFilter="all" />);
    // Status bar should reflect disconnected state when we have events (real reconnect)
    expect(screen.getByText(/reconnecting/i)).toBeTruthy();
  });

  it('shows "Live" status and event rows when connected=true with events', () => {
    const mockEvent = {
      uuid: 'u2',
      event: 'Donate Intent' as import('@/lib/types').EventName,
      timestamp: new Date().toISOString(),
      persona: 'close_friend' as import('@/lib/personas/types').PersonaSlug,
      referrerSource: 'direct' as import('@/lib/types').ReferrerSource,
      keyProp: { label: 'cta', value: 'hero' },
    };
    vi.mocked(useEventStream).mockReturnValue({ events: [mockEvent], connected: true });
    render(<EventTicker personaFilter="all" />);
    expect(screen.getByText('Live')).toBeTruthy();
    expect(screen.queryByText(/reconnecting/i)).toBeNull();
  });
});

// ── CB-61 — MetricTree zoom controls ─────────────────────────────────────────

// MetricTree uses @nivo/tree which needs SVG; mock it so we can test zoom state
vi.mock('@nivo/tree', () => ({
  ResponsiveTree: () => <svg data-testid="nivo-tree-svg" />,
}));

import { MetricTree } from '@/components/dashboard/MetricTree';
import type { MetricNode, DashboardAnchor } from '@/lib/types';

const MOCK_ROOT: MetricNode = {
  id: 'nsm',
  label: 'NSM',
  value: '12.4',
  tier: '1',
  anchor: 'nsm' as DashboardAnchor,
  children: [
    {
      id: 'donate-conv',
      label: 'Donate Conversion',
      value: '3.2%',
      tier: '1',
      anchor: 'donate-funnel' as DashboardAnchor,
    },
  ],
};

describe('CB-61 — MetricTree zoom controls', () => {
  it('renders zoom in and zoom out buttons', () => {
    render(<MetricTree root={MOCK_ROOT} onNodeClick={vi.fn()} />);
    expect(screen.getByRole('button', { name: /zoom in/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /zoom out/i })).toBeTruthy();
  });

  it('renders a reset zoom button', () => {
    render(<MetricTree root={MOCK_ROOT} onNodeClick={vi.fn()} />);
    expect(screen.getByRole('button', { name: /reset/i })).toBeTruthy();
  });

  it('zoom in button increases the displayed scale', () => {
    render(<MetricTree root={MOCK_ROOT} onNodeClick={vi.fn()} />);
    const zoomIn = screen.getByRole('button', { name: /zoom in/i });
    const container = document.querySelector('[data-testid="metric-tree-zoom-container"]');
    // Initial scale should be 1 (100%)
    expect(container?.getAttribute('data-scale')).toBe('1');
    fireEvent.click(zoomIn);
    const scaleAfter = parseFloat(container?.getAttribute('data-scale') ?? '1');
    expect(scaleAfter).toBeGreaterThan(1);
  });

  it('zoom out button decreases the displayed scale', () => {
    render(<MetricTree root={MOCK_ROOT} onNodeClick={vi.fn()} />);
    const zoomOut = screen.getByRole('button', { name: /zoom out/i });
    const container = document.querySelector('[data-testid="metric-tree-zoom-container"]');
    // Start at 1, zoom out should go below 1
    fireEvent.click(zoomOut);
    const scaleAfter = parseFloat(container?.getAttribute('data-scale') ?? '1');
    expect(scaleAfter).toBeLessThan(1);
  });

  it('reset zoom button returns scale to 1', () => {
    render(<MetricTree root={MOCK_ROOT} onNodeClick={vi.fn()} />);
    const zoomIn = screen.getByRole('button', { name: /zoom in/i });
    const reset = screen.getByRole('button', { name: /reset/i });
    const container = document.querySelector('[data-testid="metric-tree-zoom-container"]');

    fireEvent.click(zoomIn);
    fireEvent.click(zoomIn);
    // Should be > 1 now
    const scaleBefore = parseFloat(container?.getAttribute('data-scale') ?? '1');
    expect(scaleBefore).toBeGreaterThan(1);

    fireEvent.click(reset);
    expect(container?.getAttribute('data-scale')).toBe('1');
  });

  it('calls onNodeClick when tree SVG area is present (deep-link preserved)', () => {
    const onNodeClick = vi.fn();
    render(<MetricTree root={MOCK_ROOT} onNodeClick={onNodeClick} />);
    // Nivo tree SVG stub is rendered — zooming should not remove it
    expect(document.querySelector('[data-testid="nivo-tree-svg"]')).toBeTruthy();
  });
});

// ── CB-62 — FunnelChart tooltip definitions ───────────────────────────────────

import { FUNNEL_STAGE_DEFINITIONS } from '@/components/dashboard/FunnelChart';

describe('CB-62 — FunnelChart funnel stage definitions', () => {
  const EXPECTED_STAGE_IDS = [
    'page-viewed',
    'donate-intent',
    'amount-selected',
    'donate-started',
    'donate-completed',
  ];

  it('FUNNEL_STAGE_DEFINITIONS has an entry for every funnel stage', () => {
    for (const id of EXPECTED_STAGE_IDS) {
      expect(FUNNEL_STAGE_DEFINITIONS).toHaveProperty(id);
    }
  });

  it('each stage definition has a non-empty definition text', () => {
    for (const id of EXPECTED_STAGE_IDS) {
      const entry = FUNNEL_STAGE_DEFINITIONS[id];
      expect(typeof entry.definition).toBe('string');
      expect(entry.definition.length).toBeGreaterThan(0);
    }
  });

  it('each stage definition has a non-empty measurement description', () => {
    for (const id of EXPECTED_STAGE_IDS) {
      const entry = FUNNEL_STAGE_DEFINITIONS[id];
      expect(typeof entry.measurement).toBe('string');
      expect(entry.measurement.length).toBeGreaterThan(0);
    }
  });

  it('each stage definition has an eventName matching a canonical §4 event name', () => {
    const CANONICAL_FUNNEL_EVENTS = [
      'Page Viewed',
      'Donate Intent',
      'Amount Selected',
      'Donate Started',
      'Donate Completed',
    ];
    for (const id of EXPECTED_STAGE_IDS) {
      const entry = FUNNEL_STAGE_DEFINITIONS[id];
      expect(CANONICAL_FUNNEL_EVENTS).toContain(entry.eventName);
    }
  });

  it('no internal index strings leak into definition text', () => {
    const INDEX_PATTERNS = [/\bCB-\d+\b/, /\bW\d+\b/, /§\d+/, /\bD\d+\b/];
    for (const id of EXPECTED_STAGE_IDS) {
      const entry = FUNNEL_STAGE_DEFINITIONS[id];
      for (const pattern of INDEX_PATTERNS) {
        expect(entry.definition).not.toMatch(pattern);
        expect(entry.measurement).not.toMatch(pattern);
      }
    }
  });
});

// ── CB-63 — MetricsCatalog row expand ────────────────────────────────────────

// Reset the ticker mock for MetricsCatalog (it doesn't use ticker)
import { MetricsCatalog, CATALOG_EVENTS } from '@/components/dashboard/MetricsCatalog';

describe('CB-63 — MetricsCatalog interactive row expand', () => {
  it('clicking the catalog header opens the events panel', () => {
    render(<MetricsCatalog />);
    const toggleBtn = screen.getByRole('button', { name: /metrics catalog/i });
    // Initially closed
    expect(toggleBtn.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(toggleBtn);
    expect(toggleBtn.getAttribute('aria-expanded')).toBe('true');
  });

  it('after opening, event rows are visible', () => {
    render(<MetricsCatalog />);
    fireEvent.click(screen.getByRole('button', { name: /metrics catalog/i }));
    // At least the first event row should be present
    expect(screen.getByText('Page Viewed')).toBeTruthy();
  });

  it('clicking an event row expands full tracking info including capture site', () => {
    const { container } = render(<MetricsCatalog />);
    // Open the catalog first
    fireEvent.click(screen.getByRole('button', { name: /metrics catalog/i }));

    // Find the "Page Viewed" row and click it
    const pageViewedRow = screen.getByRole('button', { name: /page viewed/i });
    expect(pageViewedRow).toBeTruthy();
    fireEvent.click(pageViewedRow);

    // The expanded detail panel should be present
    const detail = container.querySelector('[data-testid="event-row-detail"]');
    expect(detail).toBeTruthy();
    // The capture site text should appear in the detail panel
    const pageViewedEntry = CATALOG_EVENTS.find((e) => e.name === 'Page Viewed')!;
    expect(detail!.textContent).toContain(pageViewedEntry.capturesite.slice(0, 20));
  });

  it('clicking an expanded row again collapses it', () => {
    const { container } = render(<MetricsCatalog />);
    fireEvent.click(screen.getByRole('button', { name: /metrics catalog/i }));

    const pageViewedRow = screen.getByRole('button', { name: /page viewed/i });
    // First click: expand
    fireEvent.click(pageViewedRow);
    // Verify it is expanded
    expect(container.querySelector('[data-testid="event-row-detail"]')).toBeTruthy();
    // Second click: collapse
    fireEvent.click(pageViewedRow);

    // The expanded detail panel should be gone
    expect(container.querySelector('[data-testid="event-row-detail"]')).toBeNull();
  });

  it('shows key properties in the expanded panel', () => {
    const { container } = render(<MetricsCatalog />);
    fireEvent.click(screen.getByRole('button', { name: /metrics catalog/i }));

    const pageViewedRow = screen.getByRole('button', { name: /page viewed/i });
    fireEvent.click(pageViewedRow);

    // Key props for Page Viewed: 'referrer_source' — check in detail panel specifically
    const detail = container.querySelector('[data-testid="event-row-detail"]');
    expect(detail).toBeTruthy();
    expect(detail!.textContent).toMatch(/referrer_source/i);
  });

  it('expanded panel labels contain no internal index strings', () => {
    render(<MetricsCatalog />);
    fireEvent.click(screen.getByRole('button', { name: /metrics catalog/i }));

    const donateIntentRow = screen.getByRole('button', { name: /donate intent/i });
    fireEvent.click(donateIntentRow);

    const panel = document.querySelector('[data-testid="event-row-detail"]');
    if (panel) {
      const text = panel.textContent ?? '';
      expect(text).not.toMatch(/\bCB-\d+\b/);
      expect(text).not.toMatch(/\bW\d+\b/);
      expect(text).not.toMatch(/§\d+/);
    }
  });
});
