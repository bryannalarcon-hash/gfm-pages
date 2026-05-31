/**
 * CB-10 — Demo Data Toggle tests
 *
 * Acceptance: toggle OFF → seed data replaced with empty baselines; toggle ON →
 * seed data is present. The toggle affordance must only render when
 * NEXT_PUBLIC_DEMO_MODE==="true". Live SSE events (useEventStream) are independent
 * and NOT affected by the toggle.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getSeededFunnel,
  getSeededTrends,
  getSeededActiveNow,
  EMPTY_FUNNEL,
  EMPTY_TRENDS,
  EMPTY_ACTIVE_NOW,
} from '@/components/dashboard/demoSeedGate';
import { FUNNEL_BASELINE, TRENDS_BASELINE, ACTIVE_NOW_SEED } from '@/components/dashboard/seeds';

// ── isDemoMode gate ──────────────────────────────────────────────────────────

describe('getSeededFunnel', () => {
  it('returns FUNNEL_BASELINE when demoDataOn=true', () => {
    const result = getSeededFunnel(true);
    expect(result).toEqual(FUNNEL_BASELINE);
  });

  it('returns EMPTY_FUNNEL when demoDataOn=false', () => {
    const result = getSeededFunnel(false);
    expect(result).toEqual(EMPTY_FUNNEL);
    // All step values must be 0 when toggle is OFF
    for (const step of result) {
      expect(step.value).toBe(0);
    }
  });

  it('EMPTY_FUNNEL has the same step ids and labels as FUNNEL_BASELINE', () => {
    // Shape must match so widgets don't crash when toggle is OFF
    expect(EMPTY_FUNNEL.map((s) => s.id)).toEqual(FUNNEL_BASELINE.map((s) => s.id));
    expect(EMPTY_FUNNEL.map((s) => s.label)).toEqual(FUNNEL_BASELINE.map((s) => s.label));
  });
});

describe('getSeededTrends', () => {
  it('returns TRENDS_BASELINE when demoDataOn=true', () => {
    const result = getSeededTrends(true);
    expect(result).toEqual(TRENDS_BASELINE);
  });

  it('returns EMPTY_TRENDS when demoDataOn=false', () => {
    const result = getSeededTrends(false);
    expect(result).toEqual(EMPTY_TRENDS);
    // Every data point must be 0
    for (const series of result) {
      for (const pt of series.data) {
        expect(pt.y).toBe(0);
      }
    }
  });

  it('EMPTY_TRENDS has same series ids as TRENDS_BASELINE', () => {
    expect(EMPTY_TRENDS.map((s) => s.id)).toEqual(TRENDS_BASELINE.map((s) => s.id));
  });
});

describe('getSeededActiveNow', () => {
  it('returns ACTIVE_NOW_SEED when demoDataOn=true', () => {
    const result = getSeededActiveNow(true);
    expect(result).toEqual(ACTIVE_NOW_SEED);
  });

  it('returns EMPTY_ACTIVE_NOW when demoDataOn=false', () => {
    const result = getSeededActiveNow(false);
    expect(result).toEqual(EMPTY_ACTIVE_NOW);
    expect(result.liveVisitors).toBe(0);
    expect(result.byPersona).toHaveLength(0);
  });
});

// ── Stat cards (NSM / Donation Conversion / Repeat Visits) ────────────────────

import {
  getSeededStatCards,
  STAT_CARDS_BASELINE,
  BLANK_STAT_VALUE,
} from '@/components/dashboard/demoSeedGate';

describe('getSeededStatCards', () => {
  it('returns the seeded card values when demoDataOn=true', () => {
    const result = getSeededStatCards(true);
    expect(result).toEqual(STAT_CARDS_BASELINE);
    // Sanity: the seeded NSM card still shows its real number
    const nsm = result.find((c) => c.anchor === 'nsm');
    expect(nsm?.value).toBe('12.4');
    expect(typeof nsm?.wowDeltaPct).toBe('number');
  });

  it('blanks every card value and drops the wow-delta when demoDataOn=false', () => {
    const result = getSeededStatCards(false);
    expect(result).toHaveLength(STAT_CARDS_BASELINE.length);
    for (const card of result) {
      expect(card.value).toBe(BLANK_STAT_VALUE);
      // No injected delta when OFF
      expect(card.wowDeltaPct).toBeNull();
    }
  });

  it('preserves card labels + anchors when blanked (layout-preserving)', () => {
    const on = getSeededStatCards(true);
    const off = getSeededStatCards(false);
    expect(off.map((c) => c.label)).toEqual(on.map((c) => c.label));
    expect(off.map((c) => c.anchor)).toEqual(on.map((c) => c.anchor));
  });

  it('BLANK_STAT_VALUE is the em-dash placeholder', () => {
    expect(BLANK_STAT_VALUE).toBe('—');
  });
});

// ── Metric tree (structure preserved, values blanked) ─────────────────────────

import { getSeededMetricTree } from '@/components/dashboard/demoSeedGate';
import { METRIC_TREE_ROOT } from '@/components/dashboard/seeds';
import type { MetricNode } from '@/lib/types';

function collectValues(node: MetricNode, acc: string[] = []): string[] {
  acc.push(node.value);
  node.children?.forEach((c) => collectValues(c, acc));
  return acc;
}

function collectIds(node: MetricNode, acc: string[] = []): string[] {
  acc.push(node.id);
  node.children?.forEach((c) => collectIds(c, acc));
  return acc;
}

function collectLabels(node: MetricNode, acc: string[] = []): string[] {
  acc.push(node.label);
  node.children?.forEach((c) => collectLabels(c, acc));
  return acc;
}

describe('getSeededMetricTree', () => {
  it('returns the seeded tree (with real values) when demoDataOn=true', () => {
    const result = getSeededMetricTree(true);
    expect(result).toEqual(METRIC_TREE_ROOT);
    // Root NSM value preserved
    expect(result.value).toBe('12.4');
  });

  it('blanks every node value when demoDataOn=false', () => {
    const result = getSeededMetricTree(false);
    const values = collectValues(result);
    expect(values.length).toBeGreaterThan(0);
    for (const v of values) {
      expect(v).toBe(BLANK_STAT_VALUE);
    }
  });

  it('preserves the tree STRUCTURE (ids + labels) when blanked — layout-preserving', () => {
    const on = getSeededMetricTree(true);
    const off = getSeededMetricTree(false);
    expect(collectIds(off)).toEqual(collectIds(on));
    expect(collectLabels(off)).toEqual(collectLabels(on));
  });

  it('does not mutate the original METRIC_TREE_ROOT seed', () => {
    getSeededMetricTree(false);
    // Original seed values must be untouched
    expect(METRIC_TREE_ROOT.value).toBe('12.4');
  });
});

// ── demoDataOn flag persistence in localStorage ───────────────────────────────

import { readDemoDataOn, writeDemoDataOn, DEMO_DATA_KEY } from '@/components/dashboard/demoSeedGate';

describe('demoDataOn localStorage persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns false when nothing is stored (default OFF)', () => {
    expect(readDemoDataOn()).toBe(false);
  });

  it('writeDemoDataOn(true) makes readDemoDataOn() return true', () => {
    writeDemoDataOn(true);
    expect(readDemoDataOn()).toBe(true);
  });

  it('writeDemoDataOn(false) makes readDemoDataOn() return false', () => {
    writeDemoDataOn(true);
    writeDemoDataOn(false);
    expect(readDemoDataOn()).toBe(false);
  });

  it('DEMO_DATA_KEY is a non-empty string', () => {
    expect(typeof DEMO_DATA_KEY).toBe('string');
    expect(DEMO_DATA_KEY.length).toBeGreaterThan(0);
  });
});
