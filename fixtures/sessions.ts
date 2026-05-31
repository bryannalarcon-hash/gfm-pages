// fixtures/sessions.ts — dashboard replay mock data.
// Statically seeded so the replay surface reads as production-grade without live DOM recording.
import type { SessionRow, SessionDetail } from '@/lib/types';

type Marker = { tsSec: number; type: 'error'|'click'|'nav'|'vital' };
type Net = { url: string; method: string; status: number; durationMs: number };

function row(sessionId: string, persona: SessionRow['persona'], durationSec: number,
  eventCount: number, rageClickCount: number, errorCount: number, lastEvent: string): SessionRow {
  return { sessionId, persona, durationSec, eventCount, rageClickCount, errorCount, lastEvent };
}

function detail(base: SessionRow, markers: Marker[], network: Net[],
  deadClickCount: number, vitals: SessionDetail['vitals']): SessionDetail {
  return { ...base, markers, network, deadClickCount, vitals };
}

const wf = '/f/realtime-alerts-for-wildfire-safety-r5jkk';
const N = (url: string, method: string, status: number, ms: number): Net => ({ url, method, status, durationMs: ms });
const M = (tsSec: number, type: Marker['type']): Marker => ({ tsSec, type });

// One clean wildfire-fundraiser donate journey — close_friend persona, ~90s, no errors.
// Markers map to the five replay frames (landing → scroll → donate panel → payment → confirmation).
export const SESSION_ROWS: SessionRow[] = [
  row('sess-001', 'close_friend', 90, 10, 0, 0, 'Donate Completed'),
];

const r = (id: string) => SESSION_ROWS.find(s => s.sessionId === id)!;

export const SESSION_DETAILS: Record<string, SessionDetail> = {
  'sess-001': detail(r('sess-001'),
    [
      M(0,  'nav'),    // frame: landing
      M(12, 'vital'),  // LCP fires on landing
      M(22, 'click'),  // story scroll begins
      M(45, 'click'),  // donate panel opened, amount selected
      M(55, 'click'),  // amount confirmed
      M(65, 'nav'),    // payment form navigated
      M(75, 'click'),  // card entered
      M(85, 'nav'),    // confirmation page
      M(88, 'click'),  // post-donate share
      M(90, 'nav'),    // session end
    ],
    [
      N(wf, 'GET', 200, 142),
      N('/api/query?widget=funnel', 'GET', 200, 87),
      N('/_next/static/chunks/page.js', 'GET', 200, 55),
      N('/api/ticker', 'GET', 200, 12),
      N('/api/donations', 'POST', 200, 248),
      N('/api/follow', 'POST', 200, 95),
      N('/api/share-copy?entity=fundraiser', 'GET', 200, 61),
      N('/_next/data/build-id/f/wildfire.json', 'GET', 200, 38),
    ],
    0, { lcp: 1820, inp: 145, cls: 0.04 }),
};
