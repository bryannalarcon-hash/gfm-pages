/**
 * Dashboard header tests
 *
 * CB-19: GlobalNav must NOT appear on /dashboard (internal analytics surface).
 * CB-22: Refresh control is a timed-interval select, defaulting to 30s.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// ── Module mocks ──────────────────────────────────────────────────────────────

// Mock useEventStream so it never tries to open a real SSE connection in jsdom.
vi.mock('@/lib/ticker/client', () => ({
  useEventStream: vi.fn(() => ({ events: [] })),
}));

// Mock useOverlay so DashboardPage doesn't need an OverlayProvider in the tree.
vi.mock('@/lib/overlay/context', () => ({
  useOverlay: vi.fn(() => ({
    overlayOn: false,
    persona: 'anonymous',
    demoMode: false,
    setOverlayOn: vi.fn(),
    setPersona: vi.fn(),
  })),
}));

// Stub heavy dashboard sub-components so jsdom doesn't have to render SVG/canvas.
vi.mock('@/components/dashboard/MetricTree', () => ({
  MetricTree: () => <div data-testid="metric-tree-stub" />,
}));
vi.mock('@/components/dashboard/StatCard', () => ({
  StatCard: () => <div data-testid="stat-card-stub" />,
}));
vi.mock('@/components/dashboard/FunnelChart', () => ({
  FunnelChart: () => <div data-testid="funnel-chart-stub" />,
}));
vi.mock('@/components/dashboard/RetentionGrid', () => ({
  RetentionGrid: () => <div data-testid="retention-grid-stub" />,
}));
vi.mock('@/components/dashboard/EventTicker', () => ({
  EventTicker: () => <div data-testid="event-ticker-stub" />,
}));
vi.mock('@/components/dashboard/ActiveNow', () => ({
  ActiveNow: () => <div data-testid="active-now-stub" />,
}));
vi.mock('@/components/dashboard/Trends', () => ({
  Trends: () => <div data-testid="trends-stub" />,
}));
vi.mock('@/components/dashboard/ExperimentTable', () => ({
  ExperimentTable: () => <div data-testid="experiment-table-stub" />,
}));
vi.mock('@/components/dashboard/ReplaySurface', () => ({
  ReplaySurface: () => <div data-testid="replay-surface-stub" />,
}));
vi.mock('@/components/dashboard/MetricsCatalog', () => ({
  MetricsCatalog: () => <div data-testid="metrics-catalog-stub" />,
}));

// Import DashboardPage AFTER mocks are in place.
import DashboardPage from '@/app/dashboard/page';

// ── CB-19: GlobalNav must not be rendered ────────────────────────────────────

describe('CB-19 — no GlobalNav on /dashboard', () => {
  beforeEach(() => {
    render(<DashboardPage />);
  });

  it('does not render a link/element with aria-label "GoFundMe — home"', () => {
    // GlobalNav renders a <Link aria-label="GoFundMe — home">; this must be absent.
    const logoLink = screen.queryByRole('link', { name: 'GoFundMe — home' });
    expect(logoLink).toBeNull();
  });

  it('does not render site navigation (GlobalNav outer nav element)', () => {
    // GlobalNav is the only nav with aria-label "Site navigation".
    const siteNav = screen.queryByRole('navigation', { name: 'Site navigation' });
    expect(siteNav).toBeNull();
  });

  it('still renders the "Analytics Dashboard" heading', () => {
    expect(screen.getByRole('heading', { name: 'Analytics Dashboard' })).toBeDefined();
  });
});

// ── CB-22: Auto-refresh interval select ─────────────────────────────────────

describe('CB-22 — auto-refresh interval dropdown', () => {
  beforeEach(() => {
    render(<DashboardPage />);
  });

  it('renders a select with data-testid="refresh-interval"', () => {
    expect(screen.getByTestId('refresh-interval')).toBeDefined();
  });

  it('the select is a <select> element', () => {
    const el = screen.getByTestId('refresh-interval');
    expect(el.tagName.toLowerCase()).toBe('select');
  });

  it('has aria-label "Auto-refresh interval"', () => {
    const el = screen.getByRole('combobox', { name: 'Auto-refresh interval' });
    expect(el).toBeDefined();
  });

  it('defaults to value "30" (30-second interval)', () => {
    const select = screen.getByTestId('refresh-interval') as HTMLSelectElement;
    expect(select.value).toBe('30');
  });

  it('has an option for Off (value "0")', () => {
    const select = screen.getByTestId('refresh-interval') as HTMLSelectElement;
    const offOption = Array.from(select.options).find((o) => o.value === '0');
    expect(offOption).toBeDefined();
    expect(offOption!.text).toMatch(/off/i);
  });

  it('has options for 5s, 10s, 30s, 60s', () => {
    const select = screen.getByTestId('refresh-interval') as HTMLSelectElement;
    const values = Array.from(select.options).map((o) => o.value);
    expect(values).toContain('5');
    expect(values).toContain('10');
    expect(values).toContain('30');
    expect(values).toContain('60');
  });

  it('does not render the old "Refresh" button', () => {
    // The old button had aria-label "Refresh dashboard" — must be gone.
    const oldBtn = screen.queryByRole('button', { name: /refresh dashboard/i });
    expect(oldBtn).toBeNull();
  });
});
