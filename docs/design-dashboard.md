# Dashboard Design — High-Level

> The `/dashboard` page is the portfolio's "log display" surface. It's the **destination** of the overlay-blob's "where on the dashboard" link (see `design-overlay.md`) and the place where a portfolio viewer sees the metric tree alive — events streaming in, funnels filling, retention curves resolving, session replays accessible. The page reads from **PostHog's `/query` API** via a Next.js Route Handler; charts are **Nivo**; the live ticker is **SSE**. Per-persona filter on every widget (linked to the overlay menu's persona switcher).

---

## What it is

A single Next.js App-Router page (`app/dashboard/page.tsx`) that renders a hand-built analytics dashboard against PostHog as the data source. It's not embedded PostHog UI — it's our own page, so the visual identity matches the rest of the demo (GFM design tokens, our overlay tier-coloring, our event-name vocabulary). The PostHog UI is for engineers; this page is for portfolio viewers.

**Three personas of viewer it has to serve simultaneously:**
1. **A grader** opening it to verify "well instrumented, explain what metrics you'll capture and why" — sees the metric tree wired to live events.
2. **A demo viewer** who clicked an overlay blob from a fundraiser page — lands on the specific widget the blob linked to.
3. **The engineer reading the code** — sees the data model match what a real analytics product looks like (events table, sessions table, replay metadata).

---

## Demo → event → dashboard (the data loop)

In a portfolio demo there is **no production traffic** — interacting with the three pages (plus a seeded baseline so funnels/retention aren't empty) is the dashboard's *only* live data source. The loop, end to end:

1. **Every instrumented interactable calls `capture(event, props)`** (`lib/analytics/capture.ts`) with the canonical event name (`strategy-metrics-research.md` §4) and a `persona` property (the active demo persona).
2. **Mock interactions still emit.** The demo donate is not a real Stripe charge, but a successful mock checkout still fires a (persona-tagged) `Donate Completed`, so the funnel and ticker animate. Same for share / follow / mark actions.
3. **PostHog ingests; the dashboard reads back.** Static widgets read via the `/query` Route Handler; the **ticker (W5)** is the live view — an event fired on a page appears in the ticker within ~2 s (the SSE poll interval).
4. **Overlay ON vs OFF is the inspect/use switch** (`isCaptureSuppressed()`, `architecture.md` §4.7): with the overlay **ON**, clicks are intercepted to show the metric blob and are **not** captured (you're *inspecting*); with the overlay **OFF**, normal use **emits** events that reach the dashboard. So the "click → ticker" demo runs in overlay-off mode.
5. **Persona filter closes the loop:** because every event carries `persona`, the dashboard's per-widget persona filter (and the ticker's persona dots) reflect exactly which demo persona produced each event.

> This is the relationship the E2E suite asserts: perform an action on a page → go to `/dashboard` → confirm the event/value is present (see `test-plan.md`).

---

## Page layout overview

```
┌──────────────────────────────────────────────────────────────────────┐
│  GLOBAL NAV (same as the 3 pages)                                    │
├──────────────────────────────────────────────────────────────────────┤
│  PAGE HEADER                                                         │
│  Dashboard · [Date range ▾]  [Persona: Close friend ▾]  [⟳ Refresh]  │
├──────────────────────────────────────────────────────────────────────┤
│  ROW 1 — METRIC TREE (full-width, sets the page's thesis)            │
│  3-tier hierarchy from metrics-research §2 rendered as a radial      │
│  or tidy tree. Each node is a metric; clicking opens its widget.     │
├──────────────────────────────────────────────────────────────────────┤
│  ROW 2 — North Star + Output rates (3 cards)                         │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐      │
│  │ NSM              │ │ Donate conv.     │ │ Repeat Visits    │      │
│  │ 12.4 sessions/wk │ │ 28%              │ │ 41% (D7)         │      │
│  │ +6% wow          │ │ +3% wow          │ │ +9% wow          │      │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘      │
├──────────────────────────────────────────────────────────────────────┤
│  ROW 3 — DONATE FUNNEL (left, 2/3) · COHORT RETENTION GRID (right)   │
│  Page Viewed → Donate Intent → Amount → Started → Completed          │
│  Drop-off % per step, drill-to-users on each step.                   │
│  Heatmap: D0 cohorts × D1/D7/D14/D30 retention %.                    │
├──────────────────────────────────────────────────────────────────────┤
│  ROW 4 — REAL-TIME EVENT TICKER (left, 2/3) · ACTIVE NOW (right)     │
│  Streaming list of events from PostHog via SSE.                      │
│  Active-now: live count + map of session origins.                    │
├──────────────────────────────────────────────────────────────────────┤
│  ROW 5 — TRENDS + EXPERIMENTS                                        │
│  Line chart of Share Clicked by `share_channel` over time.           │
│  Sub-section: live A/B variants (uc_tipping_ui-like) with stats.     │
├──────────────────────────────────────────────────────────────────────┤
│  ROW 6 — SESSION REPLAY SURFACE                                      │
│  Filterable replay list on left; player on right when one opens.     │
├──────────────────────────────────────────────────────────────────────┤
│  FOOTER (legend explaining the tier-coloring + privacy note)         │
└──────────────────────────────────────────────────────────────────────┘
```

Mobile: single column, all rows stack vertically. Cohort grid → horizontal scroll. Replay player → full-screen modal.

---

## Per-widget detail

### W1. Metric tree (the page's thesis)

The 3-tier metric hierarchy from `strategy-metrics-research.md` §2 rendered as a **tidy-tree** (Nivo `@nivo/tree`). Nodes: North Star at the root → Outputs (Donate / Share / Follow / Repeat Visits) → Leading indicators → Guardrails. Each node carries:
- Metric name + current value
- Tier color (warm-red Tier 1 / green Tier 2 / gray guardrail) — same coloring as overlay highlights
- Click → scrolls/jumps to that metric's dedicated widget below

This is where the overlay-blob's `data-overlay-dashboard="donate-funnel"` link lands: it deep-links to a node, the node animates a halo, and the page scrolls to the relevant widget.

### W2. Funnel chart (Page → Intent → Amount → Started → Completed)

Nivo `@nivo/funnel`. Five steps, conversion % per step, absolute counts under each bar, drop-off % above each gap. **Per-persona filter** at the top changes which segment's funnel renders. **A/B variant overlay** (when an experiment is active): a sub-toggle shows control vs. test bars side-by-side with a small confidence-interval badge.

Clicking a step opens a **drop-off user list** in a right-side drawer — usernames + last-event timestamps + a "Watch replay" link per user.

### W3. Cohort retention grid

Nivo `@nivo/heatmap`. Rows = D0 cohorts (weekly buckets); columns = D1 / D7 / D14 / D30 / D60. Cell color encodes retention % (darker = better). Hovering shows raw counts + %; clicking opens the cohort's user list. Two modes selectable: **N-day** (returned exactly on that day) and **unbounded** (returned on or after).

### W4. North Star + Output cards (Row 2)

Three big-number cards: NSM (meaningful sessions/user/week), Donate conversion, Repeat Visits (D7). Each shows the value + week-over-week delta arrow. Clicking a card scrolls to the funnel/retention/etc. widget tied to it.

### W5. Real-time event ticker (Row 4 left)

**The signature live widget.** A vertically-scrolling list of recent events streaming in from the demo. Each row:

```
[timestamp]  [persona-color dot]  [event_name]  [key prop]
```

E.g.: `12:14:32  ●green  Share Clicked  whatsapp · post_donate`

**How it stays real-time:** an SSE Route Handler at `app/api/events/stream/route.ts` polls PostHog's `/query` API every 2s server-side (one loop regardless of viewer count — critical for PostHog rate limits), diffs against the previous response, pushes new events to subscribed browsers as `data: {...}\n\n` SSE messages. Browser `EventSource` auto-reconnects on Railway's 15-min connection cutoff.

Headers on the Route Handler: `Connection: keep-alive`, `Content-Type: text/event-stream`, `X-Accel-Buffering: no` (so Railway's nginx proxy doesn't buffer).

Each row is **clickable → opens the event detail blob** (same blob component the overlay uses on the 3 pages; that's why the overlay → dashboard loop closes cleanly).

### W6. Active-now panel (Row 4 right)

Live count of currently-active sessions. A small map (or skipped if too heavy) showing dots for active session origin cities. Refreshes from the same SSE stream.

### W7. Trends panel (Row 5)

Nivo `@nivo/line`. Default chart: `Share Clicked` grouped by `share_channel`, last 7 days. Selector lets the viewer swap in any other event + group-by combo. Date-range picker affects this widget and the funnel above.

### W8. Experiments sub-section

A small table: live experiments (the `uc_tipping_ui`-like ones we documented in `gfm-observed-metrics.md` are GFM's; ours would mirror the pattern), each with variant assignment counts + the primary goal-metric delta + a significance badge (p-value or CI).

### W9. Session replay surface (Row 6)

**This is what makes the dashboard read as production-grade.** Two parts:

#### W9a. Replay list (left, ~1/3 width)
A filterable list of recent sessions. Each row:

```
┌────────────────────────────────────────────────┐
│ [avatar] Sarah K. · 4m 32s · 18 events         │
│ 🔥 2 rage clicks  ⚠ 1 error  · D7 returner    │
│ Last event: Donate Completed · 12:14           │
└────────────────────────────────────────────────┘
```

Filters: date range, persona, presence-of-error, has-rage-click, contains-event (e.g. show me sessions with `Donate Completed`).

#### W9b. Replay player (right, ~2/3 width when one is selected)

**Mock for the demo** — we don't need real DOM-recording infrastructure to make this look production-grade. The five features that earn it credibility (per the production-dashboard research): all five are statically renderable from seed data.

1. **Scrubber timeline with typed event markers.** Red dot for errors, blue dot for clicks, green dot for nav, orange dot for web-vital violations. Markers at *correct relative timestamps*, not evenly spaced.
2. **Rage-click indicator badge** on the replay list row (icon + count). Sourced from a mock `rage_click_count` field in the seeded session metadata.
3. **Breadcrumb / activity panel** on the right of the player — chronological list of typed events synced to the current scrubber position. Click a breadcrumb → scrubber jumps to that timestamp.
4. **Network tab** under the player — table of 8–12 mock network requests with URL / method / status / duration. 1–2 should be red (4xx/5xx) to show error correlation. Color-coded by status code.
5. **Privacy-masked element** visible in the DOM reconstruction — a single form field rendered as a grey striped rectangle labeled "Masked input." This single visual signals to any engineer reviewing the demo that the replay is production-safe (the #1 "this is real" signal per the research).

Playback controls: play/pause, 0.5x/1x/2x/4x speed, skip-inactivity toggle. Web-vital markers (LCP/INP/CLS) appear as colored dots on the scrubber where they happened.

---

## Cross-cutting chrome

**Date range picker** (page header) — presets last 7d / 14d / 30d / 90d + custom; affects funnel, retention, trends. Real-time ticker ignores it (always shows the live tail).

**Persona filter** (page header) — dropdown of the six personas from `design-personas.md`. Default: "All personas." Selecting one narrows every widget to events emitted by that persona's fixture. **Synced with the overlay-pill persona switcher** — they read/write the same `localStorage` key (`overlayPersona`). Switching persona in the overlay menu updates the dashboard automatically and vice versa.

**Refresh button** — forces a manual SSE reconnect + re-queries the static widgets (funnel, retention, trends).

---

## Data model the page assumes (matches PostHog's real schema)

Aligned with production analytics dashboards so a builder can swap mock data for real PostHog data with no schema rewrite.

**Event row** (the page's primary fact table):
```
{
  uuid: "...",                  // dedupe key
  event: "Donate Completed",    // our canonical event name (metrics-research §4)
  timestamp: "2026-05-28T...",
  distinct_id: "anon_xyz",      // pre-identification
  person_id: "person_uuid",     // post-identification
  session_id: "session_uuid",   // links to session + replay
  properties: {
    persona: "close_friend",    // our demo-mode addition
    referrer_source: "email",
    amount_usd: 50,
    payment_method_type: "card",
    frequency: "monthly",
    tip_amount_usd: 5,
    tip_preset_label: "15%",
    $current_url, $browser, $os, $viewport_width,
    $geoip_country_code, $vitals_lcp,
    utm_source, utm_medium, utm_campaign
  }
}
```

**Sessions table** (for the replay list filter + active-now panel):
```
{
  session_id, distinct_id, persona,
  start_timestamp, end_timestamp, duration_sec,
  pageview_count, entry_url, exit_url,
  entry_referring_domain, channel_type,
  is_bounce,
  $vitals_lcp, $vitals_inp, $vitals_cls,
  rage_click_count, dead_click_count,
  console_error_count, network_failed_request_count
}
```

**Cohort definition** (used by the retention grid):
```
{ name, conditions: [{ event, operator, value, within_days }] }
```

**Experiment assignment** (used by the A/B sub-section):
```
{ flag_key, variant, person_id, timestamp }
```

---

## Tech stack (recap, all locked in `strategy-tech-stack.md`)

- **Framework:** Next.js 14+ App Router page at `app/dashboard/page.tsx`.
- **Charts:** Nivo (`@nivo/funnel`, `@nivo/heatmap`, `@nivo/line`, `@nivo/tree`). SVG variants for the static charts (SSR-friendly, no `'use client'` boundary needed). Closest competitor was ECharts (better canvas perf + cleaner real-time `setOption` API) — Nivo wins for SSR.
- **Real-time:** SSE Route Handler at `app/api/events/stream/route.ts`. Single server-side loop polls PostHog's `/query` every 2s and fans out to browser `EventSource` clients. Closest competitor was WebSocket — SSE wins because the ticker is one-way only and `EventSource` reconnection is automatic.
- **Data source:** PostHog `/query` API (HogQL). Free tier covers our demo volume.
- **Persistence:** none page-specific (date range + filter selections live in URL query params so a viewer can share a deep-link).

---

## What it deliberately DOESN'T do

- **No live editing of dashboards.** The widgets are fixed; this isn't PostHog's "build your own dashboard" UI.
- **No real session-replay recording infrastructure.** The replay player is a mock against seeded session data. Adding `rrweb` for actual DOM recording is a future-work note in the writeup.
- **No alerting / anomaly detection / Slack integration.** Mentioned as a "premium feature" in the production research; outside one-week scope.
- **No multi-team / access-control layer.** Single-user view.
- **No A/B significance computation.** The significance badges are pre-calculated from seed data for the demo; production would compute via GrowthBook (our 2-tool alternative path).

---

## How "production-grade" reads on this page

To a viewer who knows what real analytics dashboards look like, these are the five details that signal *this is built like a real product* (per the production-dashboard research):

1. **Typed event markers on the replay scrubber** at *correct relative timestamps*, not evenly spaced.
2. **Rage-click badge** on the replay list row.
3. **Breadcrumb panel** syncing to scrubber playback position.
4. **Network tab** under the replay with status-code-color-coded request waterfall.
5. **A visibly-masked input** in the DOM reconstruction (the "Private by Default" tell).

If those five are in place, the page passes the engineer-review sniff test even though the underlying replay capture is mocked.

---

## Cross-links

- Overlay → dashboard widget mapping: `design-overlay.md` defines the `data-overlay-dashboard` attribute. The dashboard reads it from the URL fragment (e.g. `/dashboard#donate-funnel`) and scrolls/halos the matching widget.
- Persona filter ↔ overlay menu: both read/write `localStorage.overlayPersona`. See `design-personas.md` for the persona set and per-slot render expectations.
- Event schema lives in `strategy-metrics-research.md` §4 (single owner) + the canonical `referrer_source` enum.
- Tier coloring + metric definitions: `strategy-metrics-research.md` §2.
