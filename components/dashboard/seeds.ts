// Seeded baseline data for all dashboard widgets.
// These values are shown when PostHog is absent (offline mode).
// Live SSE increments are overlaid on top of these by the client helpers.

import type { MetricNode, ExperimentRow, ActiveNowStat } from '@/lib/types';

// ── W1: Metric Tree ──────────────────────────────────────────────────────────
// Tier colors: tier1 = #ffd863 gold, tier2 = #4a9d44 green, guardrail = grey
// Built from strategy-metrics-research §2.
export const METRIC_TREE_ROOT: MetricNode = {
  id: 'nsm',
  label: 'Meaningful Sessions / User / Week',
  value: '12.4',
  tier: '1',
  anchor: 'nsm',
  children: [
    {
      id: 'donate-conv',
      label: 'Donation Conversion',
      value: '28%',
      tier: '1',
      anchor: 'donate-funnel',
      children: [
        {
          id: 'intent-rate',
          label: 'Donate Intent Rate',
          value: '41%',
          tier: '2',
          anchor: 'donate-funnel',
        },
        {
          id: 'checkout-completion',
          label: 'Checkout Completion',
          value: '68%',
          tier: '2',
          anchor: 'donate-funnel',
        },
      ],
    },
    {
      id: 'share-rate',
      label: 'Share Rate',
      value: '14%',
      tier: '1',
      anchor: 'share-trends',
      children: [
        {
          id: 'story-scroll',
          label: 'Story Scroll Depth',
          value: '62%',
          tier: '2',
          anchor: 'share-trends',
        },
        {
          id: 'post-donate-share',
          label: 'Post-Donate Share Rate',
          value: '22%',
          tier: '2',
          anchor: 'share-trends',
        },
      ],
    },
    {
      id: 'follow-rate',
      label: 'Follow Rate',
      value: '9%',
      tier: '1',
      anchor: 'retention',
      children: [
        {
          id: 'activation',
          label: 'Activation within 48h',
          value: '31%',
          tier: '2',
          anchor: 'retention',
        },
      ],
    },
    {
      id: 'repeat-visits',
      label: 'Repeat Visits (D7)',
      value: '41%',
      tier: '1',
      anchor: 'repeat-visits',
      children: [
        {
          id: 'd1-return',
          label: 'Day-1 Return Rate',
          value: '58%',
          tier: '2',
          anchor: 'retention',
        },
        {
          id: 'lcp',
          label: 'Largest Contentful Paint',
          value: '1.9s',
          tier: 'guardrail',
          anchor: 'metric-tree',
        },
        {
          id: 'inp',
          label: 'Interaction to Next Paint',
          value: '165ms',
          tier: 'guardrail',
          anchor: 'metric-tree',
        },
        {
          id: 'bounce-rate',
          label: 'Bounce Rate',
          value: '34%',
          tier: 'guardrail',
          anchor: 'metric-tree',
        },
      ],
    },
  ],
};

// ── W2: Funnel Chart baseline step counts ────────────────────────────────────
export type FunnelStep = { id: string; label: string; value: number };

export const FUNNEL_BASELINE: FunnelStep[] = [
  { id: 'page-viewed', label: 'Page Viewed', value: 4820 },
  { id: 'donate-intent', label: 'Donate Intent', value: 1977 },
  { id: 'amount-selected', label: 'Amount Selected', value: 1644 },
  { id: 'donate-started', label: 'Donate Started', value: 1122 },
  { id: 'donate-completed', label: 'Donate Completed', value: 765 },
];

// ── W3: Retention Grid baseline ──────────────────────────────────────────────
export type CohortRow = {
  cohort: string;
  cells: { day: 1 | 7 | 14 | 30 | 60; pct: number; n: number }[];
};

export const RETENTION_COHORTS: CohortRow[] = [
  {
    cohort: 'Week of Apr 28',
    cells: [
      { day: 1, pct: 58, n: 412 },
      { day: 7, pct: 41, n: 291 },
      { day: 14, pct: 31, n: 220 },
      { day: 30, pct: 22, n: 156 },
      { day: 60, pct: 14, n: 99 },
    ],
  },
  {
    cohort: 'Week of May 5',
    cells: [
      { day: 1, pct: 61, n: 378 },
      { day: 7, pct: 44, n: 265 },
      { day: 14, pct: 33, n: 198 },
      { day: 30, pct: 24, n: 144 },
      { day: 60, pct: 0, n: 0 },
    ],
  },
  {
    cohort: 'Week of May 12',
    cells: [
      { day: 1, pct: 55, n: 501 },
      { day: 7, pct: 38, n: 311 },
      { day: 14, pct: 29, n: 237 },
      { day: 30, pct: 0, n: 0 },
      { day: 60, pct: 0, n: 0 },
    ],
  },
  {
    cohort: 'Week of May 19',
    cells: [
      { day: 1, pct: 63, n: 447 },
      { day: 7, pct: 45, n: 320 },
      { day: 14, pct: 0, n: 0 },
      { day: 30, pct: 0, n: 0 },
      { day: 60, pct: 0, n: 0 },
    ],
  },
  {
    cohort: 'Week of May 26',
    cells: [
      { day: 1, pct: 60, n: 389 },
      { day: 7, pct: 0, n: 0 },
      { day: 14, pct: 0, n: 0 },
      { day: 30, pct: 0, n: 0 },
      { day: 60, pct: 0, n: 0 },
    ],
  },
];

// ── W7: Trends baseline (Share Clicked × share_channel, last 7d) ─────────────
export type TrendPoint = { x: string; y: number };
export type TrendSeries = { id: string; data: TrendPoint[] };

const DAYS = ['May 23', 'May 24', 'May 25', 'May 26', 'May 27', 'May 28', 'May 29'];

export const TRENDS_BASELINE: TrendSeries[] = [
  { id: 'whatsapp', data: DAYS.map((x, i) => ({ x, y: [12, 18, 14, 22, 17, 25, 19][i] })) },
  { id: 'facebook', data: DAYS.map((x, i) => ({ x, y: [8, 11, 9, 14, 10, 16, 13][i] })) },
  { id: 'copy_link', data: DAYS.map((x, i) => ({ x, y: [5, 7, 6, 9, 7, 11, 8][i] })) },
  { id: 'x', data: DAYS.map((x, i) => ({ x, y: [3, 4, 3, 5, 4, 6, 5][i] })) },
  { id: 'sms', data: DAYS.map((x, i) => ({ x, y: [2, 3, 2, 4, 3, 4, 3][i] })) },
];

// ── W8: Experiments ───────────────────────────────────────────────────────────
export const EXPERIMENT_ROWS: ExperimentRow[] = [
  {
    key: 'uc_tipping_ui',
    variant: 'test',
    exposures: 2840,
    conversionPct: 31.4,
    control: 27.2,
    uplift: 15.4,
    significant: true,
  },
  {
    key: 'post_donate_share_prompt',
    variant: 'test',
    exposures: 1920,
    conversionPct: 24.1,
    control: 21.8,
    uplift: 10.6,
    significant: true,
  },
  {
    key: 'share_channel_reorder',
    variant: 'test',
    exposures: 3110,
    conversionPct: 16.2,
    control: 15.8,
    uplift: 2.5,
    significant: false,
  },
  {
    key: 'progress_bar_urgency_copy',
    variant: 'test',
    exposures: 1580,
    conversionPct: 29.8,
    control: 27.6,
    uplift: 8.0,
    significant: false,
  },
];

// ── W6: Active Now baseline ───────────────────────────────────────────────────
export const ACTIVE_NOW_SEED: ActiveNowStat = {
  liveVisitors: 7,
  byPersona: [
    { persona: 'close_friend', n: 2 },
    { persona: 'extrovert', n: 1 },
    { persona: 'anonymous', n: 3 },
    { persona: 'returning_lapsed', n: 1 },
  ],
  topPage: '/f/realtime-alerts-for-wildfire-safety-r5jkk',
};
