// Live increment helpers — derive per-widget deltas from the streamed TickerEvent array.
// These run client-side and are called each render; they are pure functions (no side effects).
// They overlay LIVE increments on top of the seeded BASELINE so each widget visibly moves
// as demo users interact with the pages (overlay OFF → events emit → ticker streams → here).

import type { TickerEvent } from '@/lib/types';
import type { FunnelStep, TrendSeries } from './seeds';
import { FUNNEL_BASELINE, TRENDS_BASELINE } from './seeds';

// ── Funnel: count streamed events to increment each step ─────────────────────
export function applyFunnelIncrements(
  baseline: FunnelStep[],
  events: TickerEvent[],
): FunnelStep[] {
  const counts: Record<string, number> = {
    'page-viewed': 0,
    'donate-intent': 0,
    'amount-selected': 0,
    'donate-started': 0,
    'donate-completed': 0,
  };

  for (const e of events) {
    if (e.event === 'Page Viewed') counts['page-viewed']++;
    else if (e.event === 'Donate Intent') counts['donate-intent']++;
    else if (e.event === 'Amount Selected') counts['amount-selected']++;
    else if (e.event === 'Donate Started') counts['donate-started']++;
    else if (e.event === 'Donate Completed') counts['donate-completed']++;
  }

  return baseline.map((step) => ({
    ...step,
    value: step.value + (counts[step.id] ?? 0),
  }));
}

// ── Trends: append streamed 'Share Clicked' grouped by share_channel ──────────
// Increments the last data point (today) for the matching channel series.
export function applyTrendsIncrements(
  baseline: TrendSeries[],
  events: TickerEvent[],
): TrendSeries[] {
  // Count live share events by channel
  const channelCounts: Record<string, number> = {};
  for (const e of events) {
    if (e.event === 'Share Clicked' || e.event === 'Post Donate Share Clicked') {
      const channel = e.keyProp.label === 'share_channel' ? e.keyProp.value : 'copy_link';
      channelCounts[channel] = (channelCounts[channel] ?? 0) + 1;
    }
  }

  if (Object.keys(channelCounts).length === 0) return baseline;

  return baseline.map((series) => {
    const increment = channelCounts[series.id] ?? 0;
    if (increment === 0) return series;
    const data = series.data.map((pt, idx) =>
      idx === series.data.length - 1
        ? { ...pt, y: pt.y + increment }
        : pt,
    );
    return { ...series, data };
  });
}

// ── Active Now: count unique recent personas from streamed events ─────────────
import type { ActiveNowStat } from '@/lib/types';
import { ACTIVE_NOW_SEED } from './seeds';

export function applyActiveNowIncrements(
  baseline: ActiveNowStat,
  events: TickerEvent[],
): ActiveNowStat {
  // Consider events in last 2 minutes as "active"
  const cutoff = Date.now() - 2 * 60 * 1000;
  const recentPersonas: Record<string, number> = {};

  for (const e of events) {
    if (new Date(e.timestamp).getTime() > cutoff) {
      recentPersonas[e.persona] = (recentPersonas[e.persona] ?? 0) + 1;
    }
  }

  const liveEntries = Object.entries(recentPersonas);
  if (liveEntries.length === 0) return baseline;

  // Merge into baseline
  const byPersonaMap = new Map(
    baseline.byPersona.map((b) => [b.persona, b.n]),
  );
  for (const [p, n] of liveEntries) {
    byPersonaMap.set(p as ActiveNowStat['byPersona'][number]['persona'], n);
  }

  return {
    liveVisitors: baseline.liveVisitors + liveEntries.length,
    byPersona: Array.from(byPersonaMap.entries()).map(([persona, n]) => ({
      persona: persona as ActiveNowStat['byPersona'][number]['persona'],
      n,
    })),
    topPage: baseline.topPage,
  };
}

// Helper: export raw baseline functions for use in widget defaults
export { FUNNEL_BASELINE, TRENDS_BASELINE, ACTIVE_NOW_SEED };
