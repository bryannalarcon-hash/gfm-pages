# Architecture — Implementation Contract

> **Doc type:** seam contract (TDD / interface contract). Not a problem statement, not a tech-stack decision (`strategy-tech-stack.md` owns that). This file is the **agreed boundary** between modules: the file tree, every module's ownership, the exported function + type signatures at each seam, and the data model. Once these signatures are agreed, parallel coder agents build *behind* them independently without colliding.

---

## 1. Purpose & how to use this for parallel work

Agree the signatures in §3–§6 first; then each track builds behind its seam in isolation, importing only neighbours' *types* and *signatures* — never their internals. Two things must be frozen **before any page work** (§7): the **overlay primitive** (`lib/overlay/`) and the **data model + shared types** (`db/schema.sql` + `lib/types.ts`). When a signature here is wrong, fix it *here first* and re-broadcast — never let two tracks diverge on a seam.

Locked invariants baked into every signature below (violating any is a defect):
- Visual tokens come **only** from `gfm-design-system.md`. No invented hexes; no green CTA on white (Follow-CTA variant rule lives in `fundraiser-wireframe.md`).
- **L3.5** (`strategy-personalization.md`): structure identical for every user; only named content slots adapt. No per-user layout variants.
- Persona switcher is **demo-only**, gated behind `NEXT_PUBLIC_DEMO_MODE === 'true'`.
- **No real-time LLM on the request path.** All Claude calls are batch-precomputed at content-create time and cached.
- `referrer_source` enum + event names have a **single owner: `strategy-metrics-research.md` §4.** Reference, never redefine.
- 33 deltas: 12 fundraiser (incl. D11-folded-into-D3) + 7 community + 9 profile + **5 cross-page Suns (S1–S5)**. The Suns cluster was folded in 2026-05-29; the prior "28" baseline is superseded by **33**.

---

## 2. Next.js App Router file tree

```
gofundme-pages/
├─ app/
│  ├─ layout.tsx                      # root shell: fonts, OverlayProvider, global nav/footer
│  ├─ page.tsx                        # "/" slide-deck landing (design-slide-deck.md)
│  ├─ f/[slug]/page.tsx               # Fundraiser page (D1–D10,D12,D13) — fundraiser-wireframe.md
│  ├─ communities/[slug]/page.tsx     # Community page (C1–C7) — community-wireframe.md
│  ├─ u/[handle]/page.tsx             # Profile page (P1–P9) — profile-wireframe.md
│  ├─ dashboard/page.tsx              # Custom analytics dashboard — design-dashboard.md
│  └─ api/
│     ├─ ticker/route.ts              # SSE event ticker (Route Handler; design-dashboard.md W5)
│     ├─ query/route.ts               # Server-side PostHog /query proxy (HogQL; hides API key)
│     └─ digest/sample/route.ts       # OPTIONAL Resend "send sample digest" (mockup-first)
│
├─ components/
│  ├─ overlay/
│  │  ├─ OverlayPill.tsx              # floating pill + expanding menu (design-overlay.md)
│  │  ├─ OverlayLayer.tsx             # dim layer + tier-coloured highlight scan
│  │  ├─ MetricBlob.tsx               # popover anchored to a highlight (shared w/ dashboard ticker)
│  │  └─ Instrumented.tsx             # wrapper emitting the data-overlay-* attribute contract
│  ├─ shared/
│  │  ├─ Button.tsx · Card.tsx · ProgressBar.tsx · Avatar.tsx
│  │  ├─ ShareSheet.tsx               # channel grid; reads precomputed D9/C6/P8 share copy
│  │  ├─ FollowButton.tsx             # variant prop: 'primary' | 'ghost' (Follow-CTA variant rule)
│  │  ├─ FundraiserCard.tsx           # default/medium/condensed sizes
│  │  └─ TabBar.tsx · StickyHeader.tsx · GlobalNav.tsx · Footer.tsx
│  ├─ slots/                          # L3.5 personalization slots (one component per named slot)
│  │  ├─ ReturningBanner.tsx          # D8 + D13 · C2 · (profile P2 header)
│  │  ├─ SmartPresets.tsx             # D10
│  │  ├─ SimilarCarousel.tsx          # D3/D11 post-donate carousel · C5 strip
│  │  ├─ WhatYouMissedFeed.tsx        # P2 feed
│  │  ├─ PymkPanel.tsx                # P4 / C3
│  │  └─ RecurringNudge.tsx           # P9 (and D12 skip-coupling via referrer)
│  ├─ fundraiser/                     # page-specific composition (Hero, DonationCard, PostDonate…)
│  ├─ community/                      # ActivityFeed, LeaderboardPrompt, FollowedCausesStrip…
│  ├─ profile/                        # ProfileHero, Carousel, DigestEmailMockup…
│  ├─ dashboard/                      # MetricTree, FunnelChart, RetentionGrid, EventTicker, ReplaySurface…
│  └─ marks/                          # Suns board (S1–S5): SunMark, SunsLayer, SunCreateModal, GrewRibbon, SunsLegend
│
├─ lib/
│  ├─ types.ts                        # cross-module shared types (§6) — OWNED, single source
│  ├─ overlay/
│  │  ├─ context.tsx                  # OverlayProvider + useOverlay() + usePersona()
│  │  └─ storage.ts                   # localStorage keys: overlayOn, overlayPersona
│  ├─ personas/
│  │  ├─ types.ts                     # Persona, PersonaSlug, PersonaFixture
│  │  └─ loader.ts                    # getPersonaFixture(slug) → demo-gated
│  ├─ personalization/
│  │  └─ slots.ts                     # PersonalizationSlot contract + resolveSlot()
│  ├─ marks/
│  │  ├─ engine.ts                    # Suns placement engine (S2): packing, funded%→size, SSR board seeds
│  │  ├─ attribution.ts               # S3 single-touch share→sun growth (share_id chain, 50% inherit)
│  │  └─ types.ts                     # SunMark, SunAction, SunGradient, BoardSeed
│  ├─ analytics/
│  │  └─ capture.ts                   # capture() wrapper over PostHog SDK
│  ├─ posthog/
│  │  └─ query.ts                     # queryPostHog() — server-only /query client
│  ├─ ticker/
│  │  └─ client.ts                    # useEventStream() EventSource hook
│  ├─ llm/
│  │  └─ batch.ts                     # Claude batch precompute (build/create-time only)
│  └─ db/
│     └─ client.ts                    # pg pool + query helpers
│
├─ db/
│  ├─ schema.sql                      # tables + pgvector columns (§5) — OWNED, frozen first
│  ├─ migrations/                     # ordered .sql migrations
│  └─ seed.ts                         # seeds fundraiser/community/profile + persona-relevant rows
│
└─ fixtures/
   └─ personas.ts                     # the 6 demo persona fixtures (design-personas.md)
```

> The `/` deck (`design-slide-deck.md`) and `app/api/digest/sample` (Resend, optional) are not on any seam the page tracks depend on; they are leaf tracks built last.

---

## 3. Module seams & ownership

| Module | Owns | Depended on by | Parallelizable with |
|---|---|---|---|
| `db/schema.sql` + `db/seed.ts` | Tables, FKs, pgvector cols, seed rows + the `SEED_IDS` registry (§6) + session/replay mock rows for the dashboard | every data-reading module | **must land FIRST** (blocking) |
| `lib/types.ts` | Cross-module TS types (§6) | everything | **must land FIRST** (blocking) |
| `lib/overlay/*` + `components/overlay/*` | Overlay state, pill+menu, dim/highlight layer, blob, `data-overlay-*` contract, localStorage keys | all 3 pages, dashboard ticker | **must land FIRST** (blocking) |
| `fixtures/personas.ts` + `lib/personas/*` | `Persona` enum, fixture shape, loader, demo gate | every personalization slot, overlay menu, dashboard persona filter | overlay (shares storage key) |
| `lib/personalization/slots.ts` + `components/slots/*` | `PersonalizationSlot` contract, named slots, prop contracts | the 3 pages | depends on personas + types; slots parallel to *each other* |
| `lib/marks/*` + `components/marks/*` | Suns board (S1–S5): mark primitive, placement engine, share→growth attribution, creation modal, grew-message | all 3 pages (ambient layer) | depends on types + schema + capture; parallel to slots/dashboard |
| `lib/analytics/capture.ts` | `capture()` wrapper; props typing | every interactive element on all pages + dashboard | independent once types land |
| `lib/posthog/query.ts` + `app/api/query` | Server-side HogQL client | dashboard widgets | independent (server-only) |
| `lib/ticker/client.ts` + `app/api/ticker` | SSE handler + `useEventStream()` | dashboard EventTicker, ActiveNow | independent (consumes MetricBlob for row detail) |
| `lib/llm/batch.ts` | Claude precompute → `share_copy` / `update_summary` rows | ShareSheet, ReturningBanner read the *cached output* | independent; runs at create/build time, never request path |
| `components/dashboard/*` | Nivo widgets, replay surface | dashboard page | depends on query + ticker + types |
| `components/fundraiser|community|profile/*` | Per-page composition | the 3 route files | parallel across the 3 pages once slots + shared + overlay land |
| `components/shared/*` | Button/Card/ProgressBar/Avatar/ShareSheet/FollowButton/FundraiserCard/nav/footer | all pages + slots | depends on types only; build early in parallel |

---

## 4. Exported function + type signatures at each seam

### 4.1 Overlay primitive — `lib/overlay/`

```ts
// lib/overlay/storage.ts  — the two demo localStorage keys (single owner)
export const OVERLAY_ON_KEY = 'overlayOn';        // boolean
export const OVERLAY_PERSONA_KEY = 'overlayPersona'; // PersonaSlug

export function readOverlayOn(): boolean;
export function writeOverlayOn(on: boolean): void;
export function readOverlayPersona(): PersonaSlug;   // defaults 'anonymous'
export function writeOverlayPersona(slug: PersonaSlug): void;
```

```ts
// lib/overlay/context.tsx
export interface OverlayState {
  overlayOn: boolean;
  persona: PersonaSlug;          // mirrors localStorage.overlayPersona
  demoMode: boolean;             // NEXT_PUBLIC_DEMO_MODE === 'true'
  setOverlayOn: (on: boolean) => void;
  setPersona: (slug: PersonaSlug) => void; // soft re-render, no full reload
}

export function OverlayProvider(props: { children: React.ReactNode }): JSX.Element;

// Pill/menu read overlay toggle + (demo-only) persona switcher.
export function useOverlay(): OverlayState;

// Personalization slots read "current user" through this. PersonaFixture IS the shared shape
// for BOTH paths: in demo mode it returns the current persona fixture; in prod a thin adapter
// maps the real user record into the SAME PersonaFixture shape (demo-only fields like `slug`/
// `avatar` are synthesized). Slots code against PersonaFixture and never branch on env.
export function usePersona(): PersonaFixture;
```

```ts
// The data-overlay-* attribute contract every instrumented element MUST carry.
// (design-overlay.md "Data the overlay reads"). Emitted via <Instrumented>.
export interface OverlayAttrs {
  'data-overlay-tier': '1' | '2';                  // tier colouring; guardrail not on-page
  'data-overlay-events': string;                   // comma-list of EventName (lib/types.ts mirror of §4); names MUST match capture() exactly
  'data-overlay-delta': DeltaId;                   // e.g. 'D1' | 'C4' | 'P9'
  'data-overlay-metric': string;                   // graded metric served
  'data-overlay-why': string;                      // short rationale, baked at build time
  'data-overlay-dashboard': DashboardAnchor;       // e.g. 'donate-funnel'
}

// components/overlay/Instrumented.tsx — spreads OverlayAttrs onto its child region.
export function Instrumented(
  props: { attrs: OverlayAttrs; regionLabel: string; children: React.ReactNode }
): JSX.Element;

// MetricBlob — the popover rendering the element→event→metric→research→dashboard chain.
// SHARED CROSS-TRACK SEAM: opened by an overlay highlight (attrs) AND by a dashboard ticker
// row (event). components/overlay/MetricBlob.tsx is the single owner; the dashboard track
// IMPORTS it, never forks it. Pin this signature before either track builds.
export interface MetricBlobProps {
  source:
    | { kind: 'overlay'; attrs: OverlayAttrs; regionLabel: string }
    | { kind: 'ticker'; event: TickerEvent };
  onClose: () => void;
}
export function MetricBlob(props: MetricBlobProps): JSX.Element;
```

> The pill closed-label shows the active persona name; `demoMode === false` hides the persona section entirely (pill becomes a pure overlay toggle). The dim layer scans `[data-overlay-tier]` on activation; while ON, all clicks are intercepted (pill toggles off, highlight opens blob, elsewhere absorbed).

### 4.2 Persona model — `lib/personas/` + `fixtures/personas.ts`

```ts
// lib/personas/types.ts  — the 6 demo personas (design-personas.md)
export type PersonaSlug =
  | 'anonymous'
  | 'close_friend'
  | 'extrovert'
  | 'shared_by_extro'
  | 'returning_lapsed'
  | 'profile_owner';

// The shared "current user" contract for slots + overlay — demo fixture AND prod adapter target.
export interface PersonaFixture {
  slug: PersonaSlug;
  name: string | null;                 // null = anonymous
  authenticated: boolean;
  isProfileOwner: boolean;             // true only for profile_owner on /u/janahan
  referrerSource: ReferrerSource;      // from lib/types.ts (mirrors metrics-research §4)
  follows: {
    fundraiserIds: string[];
    organizerProfileIds: string[];
    communityIds: string[];
    counts: { profiles: number; fundraisers: number; communities: number };
  };
  donations: Array<{
    fundraiserId: string;
    amountUsd: number;
    monthsAgo: number;
  }>;
  lastVisit: { monthsAgo: number; onThisPage: boolean } | null;
  utm?: { share_source?: string; share_user?: string }; // shared_by_extro path
  avatar: { bg: string; fg: string; initial: string };  // tokens only (gfm-design-system.md)
}

export const PERSONAS: Record<PersonaSlug, PersonaFixture>; // fixtures/personas.ts
export const PERSONA_ORDER: PersonaSlug[];                  // menu render order
```

```ts
// lib/personas/loader.ts
// Demo-gated: throws/returns anonymous if NEXT_PUBLIC_DEMO_MODE !== 'true'.
export function getPersonaFixture(slug: PersonaSlug): PersonaFixture;
export function isDemoMode(): boolean;
```

### 4.3 Personalization slots (L3.5) — `lib/personalization/slots.ts`

```ts
// One contract for every named slot. Each slot reads the CURRENT persona/user
// and returns either rendered content or null (the anonymous/first-time fallback).
// Layout never changes — only the resolved content does (L3.5 rule).
export type SlotName =
  | 'returning_banner'   // D8 + D13 / C2 / profile P2 header
  | 'smart_presets'      // D10
  | 'similar_carousel'   // D3/D11 / C5
  | 'what_you_missed'    // P2 feed
  | 'pymk_panel'         // P4 / C3
  | 'recurring_nudge';   // P9

export interface SlotContext {
  user: PersonaFixture;       // from usePersona() — fixture in demo, real record in prod
  page: PageContext;          // lib/types.ts: which page + entity ids + page-state
  isOwnerView: boolean;       // user.isProfileOwner && page is THIS user's own profile — gates owner-only affordances (P3 bio nudge)
}

// Discriminated by SlotName. `content: null` is the anonymous/first-time state — but a null
// slot MUST still render its region as a layout-preserving placeholder (collapsed banner /
// cohort-default presets / trending carousel / empty-state feed). L3.5 RULE: a slot component
// NEVER `return null` / unmounts its region — that would change page structure per persona
// (CLS + layout divergence). Structure is fixed for all personas; only the content inside adapts.
export type SlotData =
  | { name: 'returning_banner'; content: { firstName: string; summaryLine: string; href: string } | null }
  | { name: 'smart_presets'; content: { presets: [number, number, number]; selectedIndex: 0 | 1 | 2 } }
  | { name: 'similar_carousel'; content: { cards: SimilarCard[]; source: 'embedding' | 'trending' | 'followed_categories' } } // 'followed_categories' = C5 "From causes you follow" (follow-graph ∩ cause_tags, not embedding)
  | { name: 'what_you_missed'; content: { newCount: number; rows: ActivityRow[] } | null }
  | { name: 'pymk_panel'; content: { cards: PymkCard[]; ranked: 'graph' | 'default' } }
  | { name: 'recurring_nudge'; content: { organizerName: string; donationCount: number } | null };

export function resolveSlot<N extends SlotName>(
  name: N, ctx: SlotContext
): Extract<SlotData, { name: N }>;
```

```ts
// Prop contract every slot component receives (components/slots/*).
// The component is pure: structure fixed, content from resolved SlotData.
// MUST always render its region (placeholder when data.content === null); never unmount it.
export interface SlotComponentProps<N extends SlotName> {
  data: Extract<SlotData, { name: N }>;
  overlay: OverlayAttrs;        // each slot is an instrumented region
}
// e.g. export function SmartPresets(p: SlotComponentProps<'smart_presets'>): JSX.Element;
```

> **D12 ↔ P9 coupling:** when `page.referrerSource === 'profile_recurring_nudge'`, the fundraiser donation card opens in `frequency: 'monthly'` and the inline D12 nudge block is hidden (resolved SSR; no flash). `recurring_nudge` is profile-only; the fundraiser side reads the referrer, not this slot.

### 4.4 SSE ticker — `app/api/ticker/route.ts` + `lib/ticker/client.ts`

```ts
// lib/types.ts (used by ticker, blob, dashboard)
export interface TickerEvent {
  uuid: string;                 // dedupe key
  event: EventName;             // canonical event name (lib/types.ts mirror of §4) — NEVER redefined here
  timestamp: string;            // ISO
  persona: PersonaSlug;         // demo-mode property
  referrerSource: ReferrerSource;
  keyProp: { label: string; value: string }; // e.g. { label:'share_channel', value:'whatsapp' }
}
```

```ts
// app/api/ticker/route.ts — Route Handler (Node runtime, single server-side poll loop).
// ONE loop polls PostHog /query every 2s server-side regardless of viewer count,
// diffs against prior response, pushes new rows as `data: {...}\n\n`.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export function GET(req: Request): Response; // returns a ReadableStream body

// Required response headers (Railway nginx must not buffer):
//   'Content-Type': 'text/event-stream'
//   'Cache-Control': 'no-cache, no-transform'
//   'Connection': 'keep-alive'
//   'X-Accel-Buffering': 'no'
```

```ts
// lib/ticker/client.ts — browser EventSource hook (auto-reconnects on Railway 15-min cutoff).
export const TICKER_PATH = '/api/ticker';   // single owner; client + handler import this, never a string literal
export function useEventStream(opts?: {
  personaFilter?: PersonaSlug | 'all';
  max?: number;                 // ring-buffer size for the visible tail
}): { events: TickerEvent[]; connected: boolean };
```

### 4.5 Dashboard — Nivo widget props + PostHog `/query` client

```ts
// lib/posthog/query.ts — SERVER ONLY. Wraps HogQL via /query; key never reaches client.
// Date range + persona filter live in URL params; ticker ignores date range.
export interface QueryParams {
  hogql: string;
  dateRange?: { from: string; to: string };
  persona?: PersonaSlug | 'all';
}
export interface QueryResult<Row = Record<string, unknown>> {
  columns: string[];
  rows: Row[];
}
export function queryPostHog<Row = Record<string, unknown>>(
  p: QueryParams
): Promise<QueryResult<Row>>;
```

```ts
// components/dashboard/* — Nivo widget prop contracts (design-dashboard.md W1–W9).
export interface MetricTreeProps {                    // W1 @nivo/tree
  root: MetricNode; onNodeClick: (anchor: DashboardAnchor) => void;
}
export interface FunnelChartProps {                   // W2 @nivo/funnel
  steps: { id: string; label: string; value: number }[];
  persona: PersonaSlug | 'all';
  variant?: { control: number[]; test: number[]; ci?: string };
  onStepClick: (stepId: string) => void;              // opens drop-off drawer
}
export interface RetentionGridProps {                 // W3 @nivo/heatmap
  cohorts: { cohort: string; cells: { day: 1|7|14|30|60; pct: number; n: number }[] }[];
  mode: 'n_day' | 'unbounded';
}
export interface StatCardProps { label: string; value: string; wowDeltaPct: number; anchor: DashboardAnchor } // W4
export interface TrendsProps {                        // W7 @nivo/line
  series: { id: string; data: { x: string; y: number }[] }[]; // default: Share Clicked × share_channel
}
export interface ReplayListProps {                    // W9a
  sessions: SessionRow[];
  filters: { persona?: PersonaSlug; hasError?: boolean; hasRageClick?: boolean; containsEvent?: string };
  onSelect: (sessionId: string) => void;
}
export interface ReplayPlayerProps { session: SessionDetail }   // W9b (mock, seeded)
export interface ReplaySurfaceProps {                 // W9 wrapper (list + player)
  sessions: SessionRow[]; selectedId: string | null; onSelect: (id: string) => void;
}
export interface EventTickerProps {                   // W5 — consumes useEventStream(); each row opens MetricBlob
  personaFilter: PersonaSlug | 'all'; max?: number;
}
export interface ActiveNowProps { stat: ActiveNowStat; anchor: DashboardAnchor }   // W6 live-visitors panel
export interface ExperimentTableProps {               // W8 — running experiments + significance
  rows: ExperimentRow[]; onRowClick: (key: string) => void;
}
```

### 4.6 Claude batch worker — `lib/llm/batch.ts`

```ts
// BATCH-ONLY. Runs at content-create time (fundraiser/community/profile create,
// update post). Writes results to DB (share_copy / update_summary). NEVER called
// on the request path. Pages read the cached rows, not these functions.
// SEAM BOUNDARY: worker/server-action-only — NOT imported by any page or component module.
// Page tracks read share_copy / update_summary rows via lib/db, never call precompute*.
export type ShareChannel =
  | 'facebook' | 'x' | 'whatsapp' | 'messenger' | 'sms' | 'email' | 'copy_link' | 'native_share' | 'embed';

export interface ShareCopyVariant { channel: ShareChannel; copy: string }

// D9 / C6 / P8 — per (entity, channel) share copy, cached on create.
export function precomputeShareCopy(input: {
  entityType: 'fundraiser' | 'community' | 'profile';
  entityId: string;
  context: string;            // title/story/cause summary fed to Claude
}): Promise<ShareCopyVariant[]>;

// D13 — 1-line summary of a fundraiser update, cached on update create.
export function precomputeUpdateSummary(input: {
  updateId: string;
  updateBody: string;
}): Promise<{ updateId: string; summary: string }>;
```

### 4.7 PostHog instrumentation — `lib/analytics/capture.ts`

```ts
// Thin typed wrapper over the PostHog SDK. Event NAMES and the referrer_source
// enum are owned by strategy-metrics-research.md §4 — referenced via lib/types.ts,
// NEVER redefined here.
export interface CaptureProps {
  referrer_source?: ReferrerSource;   // from lib/types.ts
  persona?: PersonaSlug;              // demo-mode property
  utm_share_source?: string;          // shared_by_extro k-factor attribution (channel that shared)
  utm_share_user?: string;            // which persona/user shared the link
  [prop: string]: unknown;            // event-specific props per §4 schema
}
export function capture(event: EventName, props?: CaptureProps): void;

// While the overlay is ON, real captures are suppressed for intercepted clicks
// (the blob shows the event instead). This guard lives here, not in callers.
export function isCaptureSuppressed(): boolean;
```

### 4.8 Suns contribution board (S1–S5) — `lib/marks/*` + `components/marks/*`

```ts
// lib/marks/types.ts — the mark + board model (feature-contribution-board.md)
export type SunAction = 'follow' | 'share' | 'give';
export type SunGradient =
  | 'grey'                          // follow-only (uncoloured presence)
  | 'gold' | 'teal' | 'violet' | 'brand'; // curated key-gradients (S1/S4) — NO free hex picker

export interface SunMark {
  id: string;
  ownerToken: string;               // pseudonymous; real name only with consent (S4)
  displayName: string | null;       // non-null ONLY if the owner opted in
  actions: SunAction[];             // which of follow/share/give earned it
  gradient: SunGradient;            // share unlocks colour; follow-only = 'grey'
  sizeScore: number;                // derived sublinear(ownUsd + inheritedUsd) + floor; recomputed on refund
  isOwn?: boolean;                  // viewer's own sun → ringed "Your sun" (S4)
  isSharer?: boolean;               // arrived via this sun's share link → "X shared this" (S3)
}

// lib/marks/engine.ts — S2 ambient board. Placement is SYSTEM-CONTROLLED (users never position).
// Density + sizeContrast are design CONSTANTS; fundedPct is the campaign's REAL progress.
// fundedPct scales sun size/crowding, NEVER emptiness — the gutter is always full (cold-start safe).
export interface BoardSeed {                 // SSR'd so placement causes ZERO CLS (no scrollHeight probe)
  marks: SunMark[];
  fundedPct: number;                         // 0..1 — real raised/goal
  density: number;                           // const 0.74
  sizeContrast: number;                      // const 1
}
export function packSuns(seed: BoardSeed, gutter: { w: number; h: number }): PlacedSun[];
export interface PlacedSun { mark: SunMark; x: number; y: number; r: number }

// lib/marks/attribution.ts — S3 single-touch. mints share_id; rolls 50% of attributed donations up.
export function mintShareId(input: { entityType: 'fundraiser'|'community'|'profile'; entityId: string; sharerToken: string; channel: ShareChannel }): string;
export function recomputeSunSize(ownUsd: number, inheritedUsd: number): number; // sublinear + floor; settled-only

// components/marks/* prop contracts
export interface SunsLayerProps { seed: BoardSeed; reducedMotion: boolean }    // S2 ambient gutter layer
export interface SunCreateModalProps {                                          // S4 — greyed until an action is done
  unlockedBy: SunAction[];          // [] → button DISABLED (greyed-until-unlocked guardrail)
  onCommit: (g: SunGradient, consentName: boolean) => void;
}
export interface GrewRibbonProps { reach: number }   // S5 "your share reached N" — NO donor id, NO dollar
```

> Demo-only: the density/size sliders (`.marks-panel`) ship in the mock but **not** to production — `density`/`sizeContrast` are constants, `fundedPct` is real progress. Below ~700px the engine drops to a faint scatter behind content (mobile rule).

---

## 5. Data model — Postgres (`db/schema.sql`)

pgvector extension enabled (`CREATE EXTENSION vector`). Embedding columns power D3/D11 (similar fundraisers) and P4/C3 (PYMK). `[seed]` = populated by `db/seed.ts`; `[live]` = written at runtime by demo interactions.

```sql
profile (                                                    -- [seed]
  id            uuid PRIMARY KEY,
  handle        text UNIQUE NOT NULL,        -- e.g. 'janahan'
  display_name  text NOT NULL,
  bio           text,
  joined_year   int,
  cause_tags    text[],                      -- P3 cause pills (max 3 rendered)
  follower_count int DEFAULT 0,
  embedding     vector(1024)                 -- P4 PYMK proximity; Voyage voyage-3.5 (1024-dim) — see §8.3
)

fundraiser (                                                 -- [seed]
  id            uuid PRIMARY KEY,
  slug          text UNIQUE NOT NULL,
  organizer_id  uuid REFERENCES profile(id),
  community_id  uuid REFERENCES community(id),   -- nullable; gates D3 community-follow CTA
  title         text NOT NULL,
  story         text,
  category      text NOT NULL,               -- cold-start trending fallback
  goal_usd      int NOT NULL,
  raised_usd    int NOT NULL,                -- SSR'd (zero CLS); drives D2/D6 states
  donation_count int NOT NULL,
  follower_count int DEFAULT 0,
  embedding     vector(1024)                 -- D3/D11 similarity (<=> cosine); Voyage voyage-3.5 (1024-dim) — §8.3
)

donation (                                                   -- [seed] + [live]
  id            uuid PRIMARY KEY,
  fundraiser_id uuid REFERENCES fundraiser(id),
  donor_id      uuid REFERENCES profile(id),  -- nullable (anonymous/guest)
  amount_usd    int NOT NULL,
  frequency     text NOT NULL,               -- 'one_time' | 'monthly'
  tip_amount_usd int,
  comment       text,
  created_at    timestamptz NOT NULL
)

fundraiser_update (                                          -- [seed]
  id            uuid PRIMARY KEY,
  fundraiser_id uuid REFERENCES fundraiser(id),
  author_id     uuid REFERENCES profile(id),
  body          text NOT NULL,
  created_at    timestamptz NOT NULL
)

update_summary (                                             -- [seed] (batch-precomputed, cached)
  update_id     uuid PRIMARY KEY REFERENCES fundraiser_update(id),
  summary       text NOT NULL                -- D13 1-line; written by precomputeUpdateSummary
)

share_copy (                                                 -- [seed] (batch-precomputed, cached)
  entity_type   text NOT NULL,               -- 'fundraiser' | 'community' | 'profile'
  entity_id     uuid NOT NULL,
  channel       text NOT NULL,               -- ShareChannel
  copy          text NOT NULL,               -- D9/C6/P8; written by precomputeShareCopy
  PRIMARY KEY (entity_type, entity_id, channel)
)

community (                                                  -- [seed]
  id            uuid PRIMARY KEY,
  slug          text UNIQUE NOT NULL,
  name          text NOT NULL,
  description   text,
  raised_usd    bigint,
  fundraiser_count int,
  follower_count int DEFAULT 0
)

community_membership (                                       -- [seed] + [live]
  community_id  uuid REFERENCES community(id),
  member_id     uuid REFERENCES profile(id),
  role          text DEFAULT 'follower',     -- 'follower' | 'organizer'
  joined_at     timestamptz NOT NULL,
  PRIMARY KEY (community_id, member_id)
)

community_activity (                                         -- [seed]
  id            uuid PRIMARY KEY,
  community_id  uuid REFERENCES community(id),
  actor_id      uuid REFERENCES profile(id),
  verb          text NOT NULL,               -- 'donated' | 'started' | 'milestone'
  created_at    timestamptz NOT NULL,
  reaction_count int DEFAULT 0,
  comment_count  int DEFAULT 0
)

follow (                                                     -- [seed] + [live]  (the follow graph)
  follower_id   uuid REFERENCES profile(id),
  target_type   text NOT NULL,               -- 'fundraiser' | 'profile' | 'community'
  target_id     uuid NOT NULL,
  created_at    timestamptz NOT NULL,
  PRIMARY KEY (follower_id, target_type, target_id)
)

comment (                                                    -- [seed] + [live]
  id            uuid PRIMARY KEY,
  target_type   text NOT NULL,               -- 'activity' | 'update' | 'donation'
  target_id     uuid NOT NULL,
  author_id     uuid REFERENCES profile(id),
  body          text NOT NULL,
  created_at    timestamptz NOT NULL
)

reaction (                                                   -- [seed] + [live]  (C2 HEART reactions)
  target_type   text NOT NULL,               -- 'activity' | 'update'
  target_id     uuid NOT NULL,
  member_id     uuid REFERENCES profile(id), -- per-user → a persona's OWN reactions can be seeded/rendered
  kind          text DEFAULT 'heart',
  created_at    timestamptz NOT NULL,
  PRIMARY KEY (target_type, target_id, member_id)
)
-- community_activity.reaction_count stays as the denormalized aggregate count for display.

share_event (                                                -- [seed] + [live]  (S3 attribution source)
  share_id      uuid PRIMARY KEY,            -- minted at Share Clicked; rides the share link
  sharer_token  text NOT NULL,               -- pseudonymous; real identity only with consent
  entity_type   text NOT NULL,               -- 'fundraiser' | 'community' | 'profile'
  entity_id     uuid NOT NULL,
  channel       text NOT NULL,               -- ShareChannel
  created_at    timestamptz NOT NULL
)

donation_attribution (                                       -- [seed] + [live]  (S3 single-touch)
  donation_id   uuid PRIMARY KEY REFERENCES donation(id),
  share_id      uuid REFERENCES share_event(share_id),  -- last-touch share that drove this donation
  sharer_token  text                          -- denormalized for the 50%-inherit rollup
)

sun_mark (                                                   -- [live] — DERIVED + recomputable from settled actions
  id            uuid PRIMARY KEY,
  entity_type   text NOT NULL,               -- board scope: 'fundraiser' | 'community' | 'profile'
  entity_id     uuid NOT NULL,
  owner_token   text NOT NULL,               -- pseudonymous; display_name non-null only with consent (S4)
  display_name  text,
  action_mask   text NOT NULL,               -- which of follow/share/give earned it
  gradient_id   text,                        -- curated key-gradient ('grey' = follow-only)
  own_amount_usd    int DEFAULT 0,           -- settled donations by this owner
  inherited_usd     int DEFAULT 0,           -- 50% of donations attributed to this owner's shares (S3)
  size_score    real,                        -- derived: sublinear(own + inherited) + floor
  visible       boolean DEFAULT true,        -- reactive moderation (report → hide)
  created_at    timestamptz NOT NULL
)
-- size is RECOGNITION, recomputable: a refund/chargeback shrinks own_amount_usd/inherited_usd → size_score. No dollar figures are ever rendered.
```

> **Persona fixtures do NOT live in the DB.** They are build-time fixtures (`fixtures/personas.ts`) read by `usePersona()` in demo mode. The DB holds the *entities* personas point at (the `fundraiserIds` / `organizerProfileIds` / `communityIds` in a fixture must be real seeded ids so embedding-ranked carousels and PYMK resolve cleanly). Session/replay metadata for the dashboard (`SessionRow`, `SessionDetail`, rage-click/error counts) is **seeded mock data**, not a live-recorded table.

---

## 6. Shared types — `lib/types.ts`

```ts
// EventName + referrer_source: BOTH are MIRRORS of strategy-metrics-research.md §4–§5.
// Single owner is that doc. Listed here only so TS can type-check + so the overlay
// element→event→metric chain can't drift on a misspelling; if §4/§5 change, this follows — never leads.
export type EventName =
  // Fundraiser funnel (§4)
  | 'Page Viewed' | 'Story Scrolled' | 'Donate Intent' | 'Amount Selected'
  | 'Donate Started' | 'Donate Completed' | 'Donate Failed'
  | 'Share Clicked' | 'Follow Clicked'
  // Post-donate group (§4)
  | 'Post Donate Viewed' | 'Post Donate Share Clicked'
  | 'Post Donate Recurring Upgrade Clicked' | 'Post Donate Follow Clicked'
  | 'Post Donate Dismissed'
  // Community + Profile (§5)
  | 'Community Followed' | 'Update Read' | 'Fundraiser Clicked Through'
  // Engagement + Suns board (§4 "Board / Mark" group, added 2026-05-29)
  | 'Section Viewed' | 'Mark Created' | 'Mark Customized' | 'Mark Grew' | 'Mark Shared';

export type ReferrerSource =
  | 'social' | 'email' | 'direct' | 'search'
  | 'profile' | 'community' | 'community_leaderboard' | 'community_share'
  | 'fundraiser' | 'profile_share' | 'profile_digest_email'
  | 'profile_recurring_nudge';
// NOTE: the D3 post-donate → community-follow flow has NO dedicated referrer_source value.
// §4 owns exactly the 12 values above. That flow is captured via the `follow_target`
// property ('organizer' | 'community') on the `Post Donate Follow Clicked` event; the landing
// keeps referrer_source 'fundraiser'. If §4 ever adds a value, mirror it here — never lead.

export type DeltaId =
  | 'D1'|'D2'|'D3'|'D4'|'D5'|'D6'|'D7'|'D8'|'D9'|'D10'|'D12'|'D13' // D11 folded into D3
  | 'C1'|'C2'|'C3'|'C4'|'C5'|'C6'|'C7'
  | 'P1'|'P2'|'P3'|'P4'|'P5'|'P6'|'P7'|'P8'|'P9'
  | 'S1'|'S2'|'S3'|'S4'|'S5';   // cross-page Suns cluster (folded 2026-05-29) → 33 total

export type DashboardAnchor =
  | 'metric-tree' | 'donate-funnel' | 'retention' | 'nsm'
  | 'repeat-visits' | 'share-trends' | 'experiments' | 'replays';

export type TierLevel = '1' | '2';            // guardrail surfaced dashboard-only

export interface PageContext {
  page: 'fundraiser' | 'community' | 'profile';
  fundraiserId?: string; communityId?: string; profileId?: string;
  referrerSource: ReferrerSource;
  pageState: { raisedPct?: number; momentum?: 'high' | 'slow' | 'near_goal' };
}

export interface SimilarCard { id: string; title: string; raisedUsd: number; goalUsd: number; imageUrl: string }
export interface ActivityRow { verb: 'UPDATED'|'PUBLISHED'|'DONATED'; title: string; byline: string; href: string; ageDays: number }
export interface PymkCard { id: string; name: string; avatar: { bg: string; fg: string; initial: string }; rankPosition: number; proximityLabel?: string }
export interface MetricNode { id: string; label: string; value: string; tier: TierLevel | 'guardrail'; anchor: DashboardAnchor; children?: MetricNode[] }
export interface SessionRow { sessionId: string; persona: PersonaSlug; durationSec: number; eventCount: number; rageClickCount: number; errorCount: number; lastEvent: string }
export interface SessionDetail extends SessionRow { markers: { tsSec: number; type: 'error'|'click'|'nav'|'vital' }[]; network: { url: string; method: string; status: number; durationMs: number }[]; deadClickCount: number; vitals: { inp?: number; cls?: number; lcp?: number } }
export interface ExperimentRow { key: string; variant: string; exposures: number; conversionPct: number; control: number; uplift: number; significant: boolean }  // W8
export interface ActiveNowStat { liveVisitors: number; byPersona: { persona: PersonaSlug; n: number }[]; topPage: string }  // W6
// SEED_IDS: the single shared registry of seeded entity ids. db/seed.ts OWNS it; fixtures/personas.ts
// imports it so persona follows/donations reference REAL seeded rows (no id drift across the two tracks).
export const SEED_IDS: {
  fundraisers: Record<string, string>;   // slug → uuid
  profiles: Record<string, string>;      // handle → uuid
  communities: Record<string, string>;   // slug → uuid
};
// PersonaSlug / PersonaFixture re-exported from lib/personas/types.ts for convenience.
```

---

## 7. Parallel build plan

**Phase 0 — blocking foundations (agree + land before anything else):**
1. `lib/types.ts` (§6) — every other file imports from it.
2. `db/schema.sql` + `db/seed.ts` (§5) — entities personas point at must exist. Seed MUST export the `SEED_IDS` registry (§6, so `fixtures/personas.ts` references real ids) and the session/replay mock rows (`SessionRow`/`SessionDetail`) the dashboard reads.
3. `lib/overlay/*` + `components/overlay/*` (§4.1) — the signature surface every instrumented region wears. The `data-overlay-*` contract and the two localStorage keys must be frozen here so page tracks can attach attributes without coordination.

> These three are the hard prerequisites: the overlay primitive and the data model + types. Freeze their signatures first; everything downstream is then independent.

**Phase 1 — shared primitives + cross-cutting seams (parallel, depend only on Phase 0):**
- `components/shared/*` (Button, Card, ProgressBar, Avatar, ShareSheet, FollowButton, FundraiserCard, nav/footer).
- `lib/personas/*` + `fixtures/personas.ts` (§4.2).
- `lib/analytics/capture.ts` (§4.7).
- `lib/llm/batch.ts` (§4.6) — runs offline; output rows seeded so pages never wait on it.
- `lib/posthog/query.ts` + `app/api/query` (§4.5) and `lib/ticker/*` + `app/api/ticker` (§4.4).

**Phase 2 — personalization slots + Suns engine (parallel; depend on Phase 0 + personas):**
- `lib/personalization/slots.ts` contract first, then the 6 slot components in `components/slots/*`.
- `lib/marks/*` (engine + attribution + types, §4.8) and `components/marks/*` (S1–S5). Build placement from **SSR'd `BoardSeed`** (NOT the mock's post-hydration `scrollHeight` probe) to honor the zero-CLS guardrail; the 3 page tracks then mount the ambient `SunsLayer`.

**Phase 3 — page composition (3 fully independent tracks once Phase 1–2 land):**
- Fundraiser track (`f/[slug]`, `components/fundraiser/*`) — D1–D10, D12, D13.
- Community track (`communities/[slug]`, `components/community/*`) — C1–C7.
- Profile track (`u/[handle]`, `components/profile/*`) — P1–P9 + digest mockup.

**Phase 4 — leaf tracks (depend on their data seams, isolated otherwise):**
- Dashboard (`app/dashboard`, `components/dashboard/*`) — consumes query + ticker + MetricBlob.
- `/` slide-deck landing.
- Optional `app/api/digest/sample` (Resend) — only if a live "send sample" button is wanted.

**Dependency order summary:** `types + schema + overlay` → `shared + personas + analytics + ticker/query + llm-batch` → `slots` → `3 pages (parallel)` + `dashboard` + `deck`.

---

## 8. Source-doc ambiguities & judgment calls

Status after the verifier-swarm round (coverage + parallel-usability + constraint-conformance). **RESOLVED** items are pinned in the signatures above; **OPEN** items need a decision before the relevant track starts.

1. **RESOLVED — `referrer_source` single owner.** Dropped the non-canonical `'post_donate_community_follow'` value (it was never in §4's 12-value table). The D3 post-donate → community-follow flow is captured via the `follow_target` property on the `Post Donate Follow Clicked` event; `referrer_source` stays `'fundraiser'`. `lib/types.ts` now mirrors §4 faithfully, follows-never-leads.
2. **RESOLVED — event-name drift.** Added the `EventName` mirror type (§6) and retyped `TickerEvent.event`, `capture()`, and the `data-overlay-events` contract to it, so the overlay element→event→metric chain can't break on a misspelling. Same mirror discipline as `ReferrerSource`.
3. **RESOLVED — embeddings provider = Voyage AI.** Picked `voyage-3.5` (1024-dim default; Matryoshka-truncatable to 256/512/2048 if storage matters later). `embedding` columns are now `vector(1024)`; add an HNSW index (`USING hnsw (embedding vector_cosine_ops)`) in a migration once rows are seeded. Embeddings are batch-precomputed at content-create time alongside the Claude calls — no real-time embedding on the request path. Requires `VOYAGE_API_KEY` (see `.env`). Risk: Voyage is a paid third-party API (no self-host like pgvector the store) and content is sent to Voyage — acceptable here (public fundraiser text + generated copy, no donor PII).
4. **RESOLVED — D11 fold.** `DeltaId` omits `D11`; it lives inside D3's post-donate screen via the `similar_carousel` slot. Confirmed against `fundraiser-wireframe.md` coverage check. No standalone D11.
5. **RESOLVED — fixture ↔ seed id coupling.** Pinned the `SEED_IDS` registry (§6) owned by `db/seed.ts` and imported by `fixtures/personas.ts`, so persona `follows`/`donations` reference real seeded rows at compile time (no UUID drift across the two tracks). Made a Phase-0 deliverable (§7).
6. **RESOLVED — session/replay boundary.** Modeled as seeded TS mock data (`SessionRow`/`SessionDetail`, now incl. `vitals`/`deadClickCount` for W9), not a live DOM-recording table, per `design-dashboard.md`. Seeding these rows is a Phase-0 deliverable.
7. **RESOLVED — `profile_owner` gating.** Added `isOwnerView: boolean` to `SlotContext` so owner-only affordances (P3 bio nudge) are gated by a contract input, not tribal knowledge.
8. **OPEN (cross-doc consistency) — ticker route name.** This contract pins the SSE handler at `app/api/ticker/route.ts` (and a `TICKER_PATH` constant so client + handler never type a literal). `design-dashboard.md` W5 still names the old `app/api/events/stream/route.ts`. **Update `design-dashboard.md` W5 to `/api/ticker`** so the two docs don't drift.
9. **RESOLVED — Suns surface folded into the scheme (2026-05-29).** Per user decision the v4.2 "Suns" board is committed as the cross-page delta cluster **S1–S5**, re-baselining the count **28 → 33**. Seams: `lib/marks/*` + `components/marks/*` (§2, §3, §4.8); data model `share_event` + `donation_attribution` + `sun_mark` (§5); a "Board / Mark" event group in `strategy-metrics-research.md` §4 mirrored into `EventName` (§6). **CLS guardrail:** render from SSR'd `BoardSeed` into a reserved/contained layer — NOT the mock's post-hydration `scrollHeight` measurement (which fights the board's own zero-CLS rule). The mock's `<html>`-background + transparent-`body` trick must be reconciled with root `layout.tsx` background ownership.
