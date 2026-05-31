// CB-10: Demo seed gate — controls whether seeded/baseline demo data is injected
// into dashboard widgets. Gated behind NEXT_PUBLIC_DEMO_MODE.
//
// OFF (demoDataOn=false): widgets receive zero/empty baselines so the page is
// clearly blank until the user toggles it on or real SSE events arrive.
// ON (demoDataOn=true): FUNNEL_BASELINE / TRENDS_BASELINE / ACTIVE_NOW_SEED are
// passed through to the widgets exactly as before.
//
// The live SSE event stream (useEventStream) is NOT affected by this toggle —
// real events from page interactions continue flowing regardless of toggle state.

import type { ActiveNowStat, MetricNode, DashboardAnchor, ExperimentRow } from '@/lib/types';
import {
  FUNNEL_BASELINE,
  TRENDS_BASELINE,
  ACTIVE_NOW_SEED,
  METRIC_TREE_ROOT,
  RETENTION_COHORTS,
  EXPERIMENT_ROWS,
  type FunnelStep,
  type TrendSeries,
  type CohortRow,
} from './seeds';

// Placeholder shown for any seeded numeric value when the demo data toggle is OFF.
export const BLANK_STAT_VALUE = '—';

// ── Persistence key ──────────────────────────────────────────────────────────
export const DEMO_DATA_KEY = 'dashboardDemoDataOn';

export function readDemoDataOn(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(DEMO_DATA_KEY) === 'true';
}

export function writeDemoDataOn(on: boolean): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DEMO_DATA_KEY, on ? 'true' : 'false');
}

// ── Empty baselines (all zeros, same shape as seeds) ─────────────────────────
export const EMPTY_FUNNEL: FunnelStep[] = FUNNEL_BASELINE.map((step) => ({
  ...step,
  value: 0,
}));

export const EMPTY_TRENDS: TrendSeries[] = TRENDS_BASELINE.map((series) => ({
  ...series,
  data: series.data.map((pt) => ({ ...pt, y: 0 })),
}));

export const EMPTY_ACTIVE_NOW: ActiveNowStat = {
  liveVisitors: 0,
  byPersona: [],
  topPage: '',
};

// ── Gate functions — called by dashboard/page.tsx ─────────────────────────────
export function getSeededFunnel(demoDataOn: boolean): FunnelStep[] {
  return demoDataOn ? FUNNEL_BASELINE : EMPTY_FUNNEL;
}

export function getSeededTrends(demoDataOn: boolean): TrendSeries[] {
  return demoDataOn ? TRENDS_BASELINE : EMPTY_TRENDS;
}

export function getSeededActiveNow(demoDataOn: boolean): ActiveNowStat {
  return demoDataOn ? ACTIVE_NOW_SEED : EMPTY_ACTIVE_NOW;
}

// ── W4: Stat cards (NSM / Donation Conversion / Repeat Visits) ───────────────
// The seeded card data lives here so the toggle can blank it. `wowDeltaPct` is
// nullable: a number when seeded, null when blanked (no injected delta pill).
export interface StatCardSeed {
  label: string;
  value: string;
  wowDeltaPct: number | null;
  anchor: DashboardAnchor;
}

export const STAT_CARDS_BASELINE: StatCardSeed[] = [
  {
    label: 'Meaningful Sessions / User / Week',
    value: '12.4',
    wowDeltaPct: 6.2,
    anchor: 'nsm',
  },
  {
    label: 'Donation Conversion Rate',
    value: '28%',
    wowDeltaPct: 3.1,
    anchor: 'donate-funnel',
  },
  {
    label: 'Repeat Visits (Day 7)',
    value: '41%',
    wowDeltaPct: 9.4,
    anchor: 'repeat-visits',
  },
];

// OFF → blank value + dropped delta; labels/anchors preserved (layout-preserving).
export const BLANK_STAT_CARDS: StatCardSeed[] = STAT_CARDS_BASELINE.map((card) => ({
  ...card,
  value: BLANK_STAT_VALUE,
  wowDeltaPct: null,
}));

export function getSeededStatCards(demoDataOn: boolean): StatCardSeed[] {
  return demoDataOn ? STAT_CARDS_BASELINE : BLANK_STAT_CARDS;
}

// ── W1: Metric tree (structure preserved, seeded values blanked when OFF) ────
// Recursively clones the tree, replacing every node `value` with the placeholder.
// Does NOT mutate the original METRIC_TREE_ROOT seed.
function blankTreeValues(node: MetricNode): MetricNode {
  return {
    ...node,
    value: BLANK_STAT_VALUE,
    children: node.children?.map(blankTreeValues),
  };
}

export const BLANK_METRIC_TREE: MetricNode = blankTreeValues(METRIC_TREE_ROOT);

export function getSeededMetricTree(demoDataOn: boolean): MetricNode {
  return demoDataOn ? METRIC_TREE_ROOT : BLANK_METRIC_TREE;
}

// ── W3: Cohort Retention Grid ─────────────────────────────────────────────────
// OFF → cohort labels/day columns preserved, all pct/n values zeroed.
// ON  → returns RETENTION_COHORTS unchanged.
export const EMPTY_RETENTION: CohortRow[] = RETENTION_COHORTS.map((row) => ({
  ...row,
  cells: row.cells.map((cell) => ({ ...cell, pct: 0, n: 0 })),
}));

export function getSeededRetention(demoDataOn: boolean): CohortRow[] {
  return demoDataOn ? RETENTION_COHORTS : EMPTY_RETENTION;
}

// ── W8: Running Experiments ───────────────────────────────────────────────────
// OFF → empty array (no experiments shown — no seeded rows to leak when demo off).
// ON  → returns EXPERIMENT_ROWS unchanged.
export function getSeededExperiments(demoDataOn: boolean): ExperimentRow[] {
  return demoDataOn ? EXPERIMENT_ROWS : [];
}
