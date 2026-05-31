/**
 * CB-36 / CB-37 / CB-39 — Demo data gate for RetentionGrid + ExperimentTable
 *
 * CB-36: RetentionGrid must receive zeroed cohorts when demoDataOn=false,
 *        and full RETENTION_COHORTS when demoDataOn=true.
 * CB-37: Toggle button click flips demoDataOn state; RetentionGrid +
 *        ExperimentTable are both re-rendered with gated data.
 * CB-39: ExperimentTable must receive empty rows when demoDataOn=false,
 *        and full EXPERIMENT_ROWS when demoDataOn=true.
 *
 * All tests use the gate functions directly (unit) and via a stubbed dashboard
 * render (integration) to verify end-to-end wiring.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import {
  getSeededRetention,
  getSeededExperiments,
} from '@/components/dashboard/demoSeedGate';
import { RETENTION_COHORTS, EXPERIMENT_ROWS } from '@/components/dashboard/seeds';

// ── Unit tests: gate functions ────────────────────────────────────────────────

describe('getSeededRetention', () => {
  it('returns RETENTION_COHORTS when demoDataOn=true', () => {
    expect(getSeededRetention(true)).toEqual(RETENTION_COHORTS);
  });

  it('returns an array of equal length with all pct=0 and n=0 when demoDataOn=false', () => {
    const result = getSeededRetention(false);
    expect(result).toHaveLength(RETENTION_COHORTS.length);
    for (const row of result) {
      for (const cell of row.cells) {
        expect(cell.pct).toBe(0);
        expect(cell.n).toBe(0);
      }
    }
  });

  it('preserves cohort labels and cell day values when blanked (layout-preserving)', () => {
    const on = getSeededRetention(true);
    const off = getSeededRetention(false);
    expect(off.map((r) => r.cohort)).toEqual(on.map((r) => r.cohort));
    expect(off.map((r) => r.cells.map((c) => c.day))).toEqual(
      on.map((r) => r.cells.map((c) => c.day))
    );
  });

  it('does not mutate RETENTION_COHORTS when called with false', () => {
    getSeededRetention(false);
    // Original seed must be untouched
    expect(RETENTION_COHORTS[0].cells[0].pct).toBe(58);
  });
});

describe('getSeededExperiments', () => {
  it('returns EXPERIMENT_ROWS when demoDataOn=true', () => {
    expect(getSeededExperiments(true)).toEqual(EXPERIMENT_ROWS);
  });

  it('returns an empty array when demoDataOn=false', () => {
    const result = getSeededExperiments(false);
    expect(result).toHaveLength(0);
  });
});

// ── Integration tests: dashboard wiring ───────────────────────────────────────

// Module mocks — same pattern as dashboard-header.test.tsx
vi.mock('@/lib/ticker/client', () => ({
  useEventStream: vi.fn(() => ({ events: [] })),
}));
vi.mock('@/lib/overlay/context', () => ({
  useOverlay: vi.fn(() => ({
    overlayOn: false,
    persona: 'anonymous',
    demoMode: false,
    setOverlayOn: vi.fn(),
    setPersona: vi.fn(),
  })),
}));
vi.mock('@/components/dashboard/MetricTree', () => ({
  MetricTree: () => <div data-testid="metric-tree-stub" />,
}));
vi.mock('@/components/dashboard/StatCard', () => ({
  StatCard: () => <div data-testid="stat-card-stub" />,
}));
vi.mock('@/components/dashboard/FunnelChart', () => ({
  FunnelChart: () => <div data-testid="funnel-chart-stub" />,
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
vi.mock('@/components/dashboard/ReplaySurface', () => ({
  ReplaySurface: () => <div data-testid="replay-surface-stub" />,
}));
vi.mock('@/components/dashboard/MetricsCatalog', () => ({
  MetricsCatalog: () => <div data-testid="metrics-catalog-stub" />,
}));

// RetentionGrid stub: exposes received cohorts count via data-testid attribute
vi.mock('@/components/dashboard/RetentionGrid', () => ({
  RetentionGrid: ({ cohorts }: { cohorts: { cohort: string; cells: { pct: number }[] }[] }) => {
    const hasData = cohorts.some((c) => c.cells.some((cell) => cell.pct > 0));
    return (
      <div
        data-testid="retention-grid-stub"
        data-cohort-count={cohorts.length}
        data-has-data={String(hasData)}
      />
    );
  },
}));

// ExperimentTable stub: exposes received row count via data-testid attribute
vi.mock('@/components/dashboard/ExperimentTable', () => ({
  ExperimentTable: ({ rows }: { rows: unknown[] }) => (
    <div
      data-testid="experiment-table-stub"
      data-row-count={rows.length}
    />
  ),
}));

// isDemoMode must return true so the toggle button renders
vi.mock('@/lib/personas/loader', () => ({
  isDemoMode: vi.fn(() => true),
}));

import DashboardPage from '@/app/dashboard/page';

describe('CB-36 + CB-39 — RetentionGrid + ExperimentTable gating', () => {
  beforeEach(() => {
    // Default localStorage to demo OFF so we test the gated (blank) state
    localStorage.clear();
    localStorage.setItem('dashboardDemoDataOn', 'false');
  });

  it('CB-36: RetentionGrid receives zero-data cohorts when demo data is OFF', () => {
    render(<DashboardPage />);
    const grid = screen.getByTestId('retention-grid-stub');
    // has-data must be false — all cells are zeroed
    expect(grid.getAttribute('data-has-data')).toBe('false');
    // Structure is preserved: same number of cohort rows
    expect(grid.getAttribute('data-cohort-count')).toBe(String(RETENTION_COHORTS.length));
  });

  it('CB-39: ExperimentTable receives 0 rows when demo data is OFF', () => {
    render(<DashboardPage />);
    const table = screen.getByTestId('experiment-table-stub');
    expect(table.getAttribute('data-row-count')).toBe('0');
  });

  it('CB-36: RetentionGrid receives seeded cohorts when demo data is ON', () => {
    localStorage.setItem('dashboardDemoDataOn', 'true');
    render(<DashboardPage />);
    const grid = screen.getByTestId('retention-grid-stub');
    expect(grid.getAttribute('data-has-data')).toBe('true');
    expect(grid.getAttribute('data-cohort-count')).toBe(String(RETENTION_COHORTS.length));
  });

  it('CB-39: ExperimentTable receives seeded rows when demo data is ON', () => {
    localStorage.setItem('dashboardDemoDataOn', 'true');
    render(<DashboardPage />);
    const table = screen.getByTestId('experiment-table-stub');
    expect(table.getAttribute('data-row-count')).toBe(String(EXPERIMENT_ROWS.length));
  });
});

describe('CB-37 — toggle button flips RetentionGrid + ExperimentTable gating', () => {
  beforeEach(() => {
    // Start with demo OFF
    localStorage.clear();
    localStorage.setItem('dashboardDemoDataOn', 'false');
  });

  it('toggle click changes ExperimentTable from 0 rows to seeded rows', () => {
    render(<DashboardPage />);
    const table = screen.getByTestId('experiment-table-stub');
    expect(table.getAttribute('data-row-count')).toBe('0');

    const btn = screen.getByTestId('demo-data-toggle');
    fireEvent.click(btn);

    // After click: demo ON → seeded rows
    expect(table.getAttribute('data-row-count')).toBe(String(EXPERIMENT_ROWS.length));
  });

  it('toggle click changes RetentionGrid from zero-data to seeded data', () => {
    render(<DashboardPage />);
    const grid = screen.getByTestId('retention-grid-stub');
    expect(grid.getAttribute('data-has-data')).toBe('false');

    const btn = screen.getByTestId('demo-data-toggle');
    fireEvent.click(btn);

    expect(grid.getAttribute('data-has-data')).toBe('true');
  });

  it('toggle button reflects ON state after click (aria-pressed)', () => {
    render(<DashboardPage />);
    const btn = screen.getByTestId('demo-data-toggle');
    expect(btn.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(btn);

    expect(btn.getAttribute('aria-pressed')).toBe('true');
  });

  it('second toggle click flips back to OFF', () => {
    render(<DashboardPage />);
    const btn = screen.getByTestId('demo-data-toggle');
    fireEvent.click(btn);
    fireEvent.click(btn);

    const table = screen.getByTestId('experiment-table-stub');
    expect(table.getAttribute('data-row-count')).toBe('0');
    expect(btn.getAttribute('aria-pressed')).toBe('false');
  });
});
