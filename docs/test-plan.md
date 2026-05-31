# Test Plan — Eval Suite Specification

> **What this is:** the definition of *what must be tested* for the GoFundMe redesign build. It is a **spec, not test code** — the tests themselves are authored later by holistic coder subagents (one per subsystem), then checked by a verifier swarm.
>
> **Regression discipline (binding, from project rules):** for every bug fix and new feature, the test is written **first**, the defect/feature is confirmed by a **failing** run, the fix/implementation is applied, then the test is re-run **green**. Applies to unit, subsystem, and E2E.
>
> **Signature proof:** the assignment is graded on "well instrumented — explain what metrics you'll capture and why." The headline test is therefore: **perform an action → open `/dashboard` → assert the event/value is there** (§1). Everything else supports that claim or the interactability/quality bars around it.

---

## 0. Test pyramid, tooling, layers

| Layer | Tool | Scope |
|---|---|---|
| **Unit** | Vitest (+ RTL for components) | every exported function, reducer, pure-logic module, component contract |
| **Subsystem / integration** | Vitest + supertest + `curl` smoke | route handlers, SSR HTML, SSE stream, PostHog `/query` client (mocked), DB queries (ephemeral test PG), LLM batch, embeddings |
| **E2E** | Playwright (chromium desktop 1440 + mobile 390 / iPhone-13 profile) | user flows, the action→dashboard instrumentation loop, interactability, persona/L3.5, demo gating |
| **Accessibility** | `@axe-core/playwright` | per-page automated a11y + scripted keyboard/focus/reduced-motion |
| **Performance** | Lighthouse CI + `web-vitals` | Core Web Vitals guardrails (LCP/INP/CLS) |
| **Constraint lint** | custom static scan | token conformance (no green CTA on white; no off-system hex), demo-only-vs-ship strip check |

All run in CI as merge gates. Demo flows run with `NEXT_PUBLIC_DEMO_MODE=true`; a dedicated suite runs with it `false` (§4.3).

---

## 1. Signature E2E — action → dashboard → assert (the instrumentation proof)

**Pattern (per event):** overlay OFF → perform the triggering action on the page as a given persona → navigate to `/dashboard` → assert the event surfaces (a ticker row within the SSE interval **and/or** the relevant funnel/trend/card value increments) → assert the ticker row carries the correct `persona` and key property.

Write one test per canonical event (the 22 in `strategy-metrics-research.md §4` / `EventName`). Minimum coverage:

| Event | Action under test | Dashboard assertion |
|---|---|---|
| `Page Viewed` | load `/f/[slug]` | funnel step 1 increments; ticker row |
| `Story Scrolled` | scroll story >50% | ticker row w/ `scroll_depth_pct` |
| `Donate Intent` | click donate CTA | funnel step 2; `cta_location` prop |
| `Amount Selected` | pick preset / custom | ticker w/ `amount_usd`, `selection_type`, `frequency` |
| `Donate Started` | render mock payment form | funnel step 4 |
| `Donate Completed` | complete **mock** checkout | funnel step 5 + Donate-conversion card moves; `frequency`, `tip_amount_usd` |
| `Donate Failed` | force mock error | ticker w/ `error_code` (does NOT advance funnel) |
| `Share Clicked` | share via a channel | Trends (W7) line for that `share_channel`; `share_context`, `share_id` present |
| `Follow Clicked` | click follow | ticker w/ `follow_context`; follow-rate reflects |
| `Post Donate Viewed/Share/Recurring/Follow/Dismissed` (×5) | drive the post-donate screen | each fires + second-conversion / recurring-upgrade derived metrics move |
| `Community Followed`, `Update Read`, `Fundraiser Clicked Through` | community/profile actions | ticker rows + relevant widget |
| `Section Viewed` | scroll a slot/board into view | ticker w/ `section_name` (one assertion per value); **deduped** — fires once per section per session, even across persona-switch re-renders (no metric inflation) |
| `Mark Created` | light a sun (follow/share/give) | ticker w/ `action_type`; board count grows |
| `Mark Customized` | change gradient | ticker w/ `gradient_id` |
| `Mark Grew` | mock donation attributed to a sharer | ticker w/ `trigger`; **assert NO donor identity / NO dollar in payload** |
| `Mark Shared` | share the board/own sun | ticker w/ `share_channel` |

**Attribution chain (S3) E2E:** persona A shares (mints `share_id`) → arrive via that link as persona B → complete mock donation → assert `Donate Completed` carries `attributed_share_id`/`attributed_sharer_token` → dashboard k-factor / sharer-A sun reflects the 50% rollup.

**Capture-suppression E2E:** with overlay **ON**, perform an instrumented click → assert the metric **blob opens** and **no event reaches** the dashboard (the inspect/use switch, `isCaptureSuppressed()`).

**Per-event property assertions:** the post-donate group is **five separate tests**, each asserting its key props (`Post Donate Follow Clicked` → `follow_target`; `Post Donate Recurring Upgrade Clicked` → `current/proposed_amount_usd`). Community/profile events name their `DashboardAnchor`. `shared_by_extro` propagation: assert `utm_share_source`/`utm_share_user` ride the events fired in that persona's session.

**Determinism (binding — no `sleep`s):** the action→dashboard assertion uses a bounded `waitForEvent(name, {timeout})` helper backed by a **test-mode SSE flush** that short-circuits the ~2 s poll; each E2E isolates its data (transaction rollback or truncate-and-reseed) so mark/funnel/attribution counts never bleed across tests; persona-tagged partitioning keeps parallel shards from contaminating the shared ticker loop.

---

## 2. Interactability E2E (user's minimum list, made exhaustive)

**2.1 Suns — creation**
- Create button is **greyed/disabled until a qualifying action** (follow/share/give); enabling appears only after the action (one test per avenue + the anonymous-still-disabled case — guards the regression the reviewer found in `suncreate.js`).
- Reminder line shown at each locked avenue.
- Creation modal opens; **gradient picker offers only curated key-gradients** (assert **no free hex/RGB input** exists).
- Name consent is **opt-in, non-blocking** (default anonymous; submitting without consent → no `display_name`).
- Congrats ribbon drops on share.

**2.2 Suns — visualization**
- Suns render in both gutters (desktop), fade toward center, never overlap the content column.
- Follow=grey / share=colored / give=larger size mapping holds.
- `funded%` scales size/crowding, **never emptiness** (low % → fewer larger suns, gutter still full; assert board never empty).
- Cold-start "be the first" state on an entity with zero marks.
- Own sun ringed + "Your sun"; share-link arrival highlights the sharer's sun ("X shared this").
- Mobile (≤700px): suns become a faint field behind content (~0.17 opacity), demo panel hidden.
- **No dollar figure** anywhere in the board DOM.

**2.3 Suns — animation**
- Fall/wobble animations present (legend: followed static / shared color-shift+wobble / gave bolder+larger).
- `prefers-reduced-motion: reduce` → **no fall/wobble; static rest state** (suns still placed).

**2.4 Buttons — hover highlight (ALL)**
- Enumerate every interactive button class (`.btn--primary`, `--ghost`, `--on-strong`, follow, share, donate bar, tabs, pill, modal CTAs, carousel controls) → assert a computed-style change on `:hover` (bg/opacity/transform). Catch the `btn--lime` undefined-class regression (must resolve to a styled CTA).

**2.5 Pill metric overlay + blob**
- Pill toggles overlay on/off; persists across navigation (localStorage).
- Menu expands; persona switcher lists 6 personas; switching re-renders slots.
- Overlay ON → tier-colored highlights scan onto `[data-overlay-tier]` regions.
- Click a highlighted element → blob opens showing event(s) / metric / rationale (the element→event→metric→research chain).

**2.6 Overlay card → dashboard deep link**
- Click the blob's "where on the dashboard" (`data-overlay-dashboard="…"`) → navigates to `/dashboard`, the **correct widget** receives focus/halo and the page scrolls to it (assert per anchor value: `donate-funnel`, `retention`, `share-trends`, `replays`, etc.).

**2.7 Page transitions — all paths**
- Every nav path: global nav links, and cross-page links fundraiser ↔ community ↔ profile ↔ dashboard ↔ `/` deck. Assert destination loads + no console error.
- **Persona + overlay-on state persist** across every transition.
- Back/forward navigation preserves state.

**2.8 Replay (dashboard W9)**
- Replay list filters (persona / hasError / hasRageClick / containsEvent) narrow the list.
- Selecting a session opens the player; timeline + markers (`error`/`click`/`nav`/`vital`) render; mock playback scrubs.
- Network panel + web-vital markers present (the credibility features).

**2.9 Before/After toggle**
- Toggle swaps to the current-GFM recreation (green CTAs, progress rings, podium) and back; state is demo-only.

---

## 3. Personalization / L3.5 E2E

- Switching persona changes **content of named slots** (returning banner, smart presets, similar carousel, what-you-missed, PYMK, recurring nudge) but **structure is identical** — assert the same region nodes exist for every persona; **no region is unmounted** (the `data-show`→`resolveSlot` rule); measure CLS ≈ 0 on persona switch.
- One test per persona (×6) asserting its expected slot content per `design-personas.md` render tables.
- Anonymous / first-time → slots show layout-preserving placeholders (or the *sanctioned* zero-height collapse for the returning banner / recurring nudge), never a removed-then-reflowed layout.
- Owner-only affordances (P3 bio nudge) appear only for `profile_owner` on their own profile (`isOwnerView`).

---

## 4. Constraint / guardrail tests (automated)

**4.1 Token conformance** — static scan of CSS/markup: every color traces to `gfm-design-system.md`; **no green CTA on white** (computed-style check: any CTA on a white/near-white surface must be `#232323`, not a green token); flag invented hex (allow documented exceptions: channel-brand chips, font fallback).

**4.2 Suns guardrails as tests** — sun shape is the logo mask (not freeform drawing); gradient set ⊆ curated palette; placement is system-controlled (no user coordinate input exists); anonymous default; reactive moderation hides on `visible=false`.

**4.3 Demo gating** — with `NEXT_PUBLIC_DEMO_MODE=false`: persona switcher, overlay pill, before/after toggle, `.marks-panel` sliders, and `data-overlay-*` attributes are **absent**; suns engine + page content remain. (Guards the demo-only-vs-ship split from `mocks/HANDOFF.md`.)

**4.4 Tone-by-cause gating** — the board's skin (metaphor, palette, animation exuberance) and expressive freedom **scale with cause category** (`feature-contribution-board.md §3`): a memorial / medical-tragedy fundraiser renders the restrained variant (or the board is opt-in), a celebratory / project cause gets the full treatment. Tests: per category, assert the rendered skin/freedom tier matches the category; assert the admin/category override path; assert the **congrats ribbon + high-exuberance fall/wobble are suppressed** on a memorial-category entity (independently of `prefers-reduced-motion`).

---

## 5. Accessibility

- `axe-core` returns **zero violations** on `/f/[slug]`, `/communities/[slug]`, `/u/[handle]`, `/dashboard`, `/` (desktop + mobile).
- **Keyboard:** every interactable reachable & operable by keyboard; overlay menu, create modal, and replay player **trap focus** and close on `Esc`.
- **Reduced motion:** `prefers-reduced-motion` disables suns fall/wobble and the congrats ribbon animation.
- **Color not sole meaning:** the board exposes a **text aggregate** (e.g. "1,240 supporters"); tier-coloring is paired with text/label; follow/share/give state is not color-only.
- **Screen reader:** suns layer is `aria-hidden` decorative with the text aggregate as the accessible equivalent.

---

## 6. Performance (CWV guardrails — D7 / C7 / P7)

- Per page: **LCP ≤ 2.5 s · INP ≤ 200 ms · CLS ≤ 0.1** (target ≤ 0.05), measured via Lighthouse CI on a throttled profile + `web-vitals` real-user logging.
- **Suns layer causes zero CLS:** rendered from SSR'd `BoardSeed` (not post-hydration `scrollHeight`); assert no layout shift on hydration.
- Hero image + raised/goal numbers are SSR'd (no async-data CLS); donor-feed hydration deferred (INP).
- SSE ticker does not block main thread; one server poll loop regardless of viewers.

---

## 7. Subsystem / integration

**7.1 Route smoke (the "navigation with curls")** — `curl` each route, assert **HTTP 200 + expected SSR content** in the HTML: `/`, `/f/[slug]`, `/communities/[slug]`, `/u/[handle]`, `/dashboard`, `/api/ticker`, `/api/query`, `/api/digest/sample` (if built). Assert SSR'd raised/goal numerals present in the fundraiser HTML (CLS guard) and that `data-overlay-*` are absent in a non-demo build.

**7.2 SSE ticker** — connects; streams `data:` frames; one server-side poll loop; correct headers (`Connection: keep-alive`, `Content-Type: text/event-stream`, `X-Accel-Buffering: no`, `Cache-Control: no-cache`); `EventSource` auto-reconnects after a forced drop; `TICKER_PATH` constant used by both client and handler.

**7.3 PostHog `/query` client** — server-only; the project key is **never** in client bundle; `QueryParams → HogQL` shape; persona/date params applied; errors handled.

**7.4 LLM batch worker** — `precomputeShareCopy` / `precomputeUpdateSummary` write `share_copy` / `update_summary`; **assert no request-path import** of `lib/llm/batch.ts` from any page/component (the no-real-time-LLM guarantee); results are cached/read from DB.

**7.5 DB + attribution** — schema migrations apply cleanly; seed loads; `SEED_IDS` resolve to real rows; **refund/chargeback recomputes** `sun_mark.size_score` (own + inherited); single-touch attribution rollup credits exactly 50% to the last-touch sharer; reaction per-user rows seed; the denormalized `community_activity.reaction_count` stays consistent with the `reaction` table on insert/delete; **concurrency** — two simultaneous `Mark Created` for the same `(entity_id, owner_token)` resolve deterministically (upsert/reject, not duplicate); **self-referral** (share to self → donate via own link) has a defined, asserted outcome (not merely "accepted"); attribution edge cases — donation with no attribution row → inherited 0; chargeback walks `donation_attribution` and shrinks the sharer's `inherited_usd`.

**7.6 Embeddings (Voyage)** — batch client embeds at create-time only; `vector(1024)` columns; cosine `<=>` similarity query returns ranked rows for D3/P4/C3; never called on the request path.

**7.7 Contract / seam tests** — (a) **static scan asserting every `data-overlay-events` value in the built DOM is a member of the `EventName` union** — catches the mock's legacy names (`Banner Impression`, `Activity Feed Viewed`, `PYMK Module Viewed`, `Recurring Nudge Viewed`, `Board Viewed`) surviving into the build (the §4-drift the architecture closed); (b) **SSE `TickerEvent` schema contract** — parsed frames match the interface exactly (`uuid`/`event`/`timestamp`/`persona`/`referrerSource`/`keyProp`); feed a bad frame (missing `persona`, non-`EventName` `event`, extra fields) → assert graceful handling; (c) **`/query` response-shape contract** — handle `{rows:null}`, `results`-vs-`rows`, 429, 5xx; (d) **`TICKER_PATH` ↔ mount point** — assert the constant matches the actual route file; (e) **mock-vs-build fidelity** — structural/visual snapshot comparing each ported page to its `mocks/*-v4.2.html` source (catches "carousel missing", "suns wrong z-index").

**7.8 Error / empty / loading states (per widget + per page)** — PostHog `/query` 5xx/timeout → each widget renders an error / last-known-good state, not a crash; empty funnel (all-zero, no divide-by-zero); SSE mid-session disconnect → "reconnecting" state then auto-recover; missing `share_copy` row → `ShareSheet` fallback copy; hero image 404 → placeholder; `packSuns` returns zero → board still shows a valid state; hydration window shows no flash-of-wrong-content (distinct from CLS).

---

## 8. Unit tests (every function / subsystem)

Minimum, by module (each exported function gets happy-path + edge + failure cases):

- **`lib/overlay`** — `read/writeOverlayOn`, `read/writeOverlayPersona` (+ the constant key values); `useOverlay` state transitions; `usePersona()` returns the fixture in demo mode and the adapter shape in prod (both = `PersonaFixture`); `isCaptureSuppressed()` true iff overlay on + intercepted.
- **`lib/personas`** — `getPersonaFixture` (demo-gated: returns anonymous / throws when `DEMO_MODE` off); `PERSONA_ORDER`.
- **`lib/personalization`** — `resolveSlot<N>` for **every** `SlotName` × every persona; null-content → placeholder contract (never unmount).
- **`lib/marks`** — `packSuns` (deterministic placement given density/contrast/funded; gutter-fill invariants; mobile scatter branch); `recomputeSunSize` (sublinear + floor; monotonic; refund shrinks); `mintShareId` (uniqueness, pseudonymity); attribution rollup (single-touch 50%, ignores multi-hop).
- **`lib/analytics`** — `capture` (rejects non-`EventName` at type level; attaches `persona`; suppression honored); UTM share props; **`Section Viewed` dedup** (IntersectionObserver fires once per `section_name` per session, survives persona re-render — guards against engagement-tier inflation).
- **`lib/posthog`** — `queryPostHog` param mapping; result typing.
- **`lib/ticker`** — `useEventStream` parse, ring-buffer `max`, persona filter, reconnect.
- **`lib/llm`** — `precompute*` shapes; caching; batch-only.
- **`lib/db`** — query helpers; pooling.
- **Components** — each slot renders both populated and fallback states without unmounting; `SunMark` action/gradient/size mapping; `SunsLayer` reduced-motion branch; `SunCreateModal` disabled-until-unlocked; `GrewRibbon` (assert **no donor identity / no dollar** in props) + `SunsLegend`; `MetricBlob` renders from both `overlay` and `ticker` sources; `OverlayPill`/`OverlayLayer`/`Instrumented` (the `data-overlay-*` attribute-spread contract); each dashboard widget — `MetricTree`, `FunnelChart`, `RetentionGrid`, **`StatCard` (W4)**, `EventTicker`, `ActiveNow`, `Trends`, `ExperimentTable`, `ReplayList/Player` — renders from its props contract; shared `FollowButton` (variant rule — guardrail), `ShareSheet` (reads precomputed `share_copy`), `FundraiserCard` (3 sizes), `GlobalNav`/`Footer`/`TabBar`/`StickyHeader`; page-composition `DonationCard`/`PostDonate`/`ActivityFeed`/`LeaderboardPrompt`/`ProfileHero`/`Carousel`/`DigestEmailMockup`.

---

## 9. Test data / fixtures

- Seeded **baseline** so funnels/retention/ticker aren't empty on first load.
- At least one **near-goal entity (≥80% funded)** to exercise the missing **D2** goal-gradient state.
- The 6 persona fixtures (`fixtures/personas.ts`) with `follows`/`donations` referencing real `SEED_IDS`.
- Mock **sessions** for the replay surface (with markers, network, vitals, dead-clicks).
- Pre-built **share→donation attribution chains** so the S3 rollup and k-factor have data.

---

## 10. CI gates, ownership, regression loop

- **CI environment (declare per layer):** PostHog is **stubbed at the HTTP layer (MSW)** for unit/component/most E2E; one optional suite may run against a Docker-composed PostHog. **Voyage and Claude are never called live in CI** — fixture responses only. Postgres is an **ephemeral container per run**; each test isolates via transaction rollback or truncate-and-reseed (no cross-test contamination of mark/funnel/attribution counts).
- **Coverage:** ≥ 80% lines on `lib/*`, **100% on attribution + capture-suppression + slot-resolution** (correctness-critical); reporter **excludes** fixtures, generated migrations, and Nivo pass-through wrappers so the number isn't distorted.
- **Fails-first enforcement (mechanical, not aspirational):** the verifier swarm runs each new test against the **pre-fix** tree and records the red→green transition; a mutation-style gate rejects vacuous-green tests.
- **No-real-time-LLM ban:** a module-graph lint (ESLint `no-restricted-imports` or a Vitest import-graph traversal) fails if any `app/`/`components/` module imports `lib/llm/batch.ts`.
- **Authoring model:** tests written by **holistic coder subagents** — one per subsystem (overlay, marks, slots, dashboard, instrumentation, pages) — then a **verifier swarm** checks coverage + fails-first.
- New bug → failing regression test first → fix → green (binding rule).

---

## 11. Security & privacy

- **Secret boundary:** a CI step (bundle scan / `grep` over `.next/static`) asserts **no** `*_API_KEY` / `*_SECRET` / `DATABASE_URL` (PostHog server key, `VOYAGE_API_KEY`, `ANTHROPIC_API_KEY`) appears in any client chunk; and that `NEXT_PUBLIC_DEMO_MODE` is the **only** `NEXT_PUBLIC_*` var (no secret ever gets that prefix).
- **XSS / injection:** crafted input in the consented `display_name` **and** in Claude-generated `share_copy` / `update_summary` (LLM output persisted then rendered) is escaped/sanitized before DOM render — test `<script>` / `<img onerror>` payloads on `ShareSheet`, the board mark name, and the digest mockup.
- **Pre-moderation gate:** an admin custom default symbol is **not visible until explicitly approved** (default `visible=false`/pending; going live requires an explicit approval action, never auto-live); a reported mark hides on `visible=false`. Also test the **"mark grew" config toggle** suppresses the message when off, and that a **mark edit re-enters moderation**.
- **No committed secrets:** `git grep` CI lint for real keys/tokens in tracked files and `.env.example`.

---

## 12. Internationalization & RTL

- **RTL layout:** with `dir="rtl"`, the three pages + `/dashboard` mirror correctly — suns gutters swap sides, nav / cards / carousels / share studio mirror, the overlay pill repositions — with no text clipping or content overlap.
- **Locale formatting:** goal/raised numerals, percentages, and relative timestamps render via locale-aware formatting. (The suns board shows no currency, so it carries no currency-format dependency — assert that holds.)
- **String externalization:** UI copy is not hard-coded in a translation-blocking way; a **pseudo-locale (long-string) pass** shows no truncation/overflow in buttons, cards, ribbons, or the metric blob.
- **a11y under RTL:** the axe + keyboard suite (§5) re-runs with `dir="rtl"` to catch direction-specific focus-order and landmark issues.

---

## Cross-links
- `strategy-metrics-research.md` §4 — the 22 canonical events (single owner) the §1 suite asserts
- `architecture.md` — seams/signatures under unit test; §4.7 capture suppression; §4.8 suns; §8.9 suns CLS rule
- `design-dashboard.md` — the dashboard widgets + the **Demo → event → dashboard loop** §1 depends on
- `feature-contribution-board.md` — suns guardrails the §2/§4 tests enforce
- `design-personas.md` — per-persona slot expectations for §3
- `mocks/HANDOFF.md` — the demo-only-vs-ship split §4.3 enforces; the as-built mocks under test
