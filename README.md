# GoFundMe — Profile · Fundraiser · Community (reimagined)

A share-first redesign of GoFundMe's three core pages, tied together into one engaging,
return-worthy experience. Built for GoFundMe's "Gold" build assignment.

**🚀 Live deployment:** https://gfm-web-production.up.railway.app
&nbsp;·&nbsp; Fundraiser [`/f/realtime-alerts-for-wildfire-safety-r5jkk`](https://gfm-web-production.up.railway.app/f/realtime-alerts-for-wildfire-safety-r5jkk)
&nbsp;·&nbsp; Community [`/communities/watch-duty`](https://gfm-web-production.up.railway.app/communities/watch-duty)
&nbsp;·&nbsp; Profile [`/u/janahan`](https://gfm-web-production.up.railway.app/u/janahan)
&nbsp;·&nbsp; Dashboard [`/dashboard`](https://gfm-web-production.up.railway.app/dashboard)

**🎬 Demo video:** _link coming — will be added here once recorded._ <!-- DEMO_VIDEO_URL: replace this line with the video link when provided -->

> Demo mode is on (`NEXT_PUBLIC_DEMO_MODE=true`): a metric-overlay toggle, persona switcher, and
> funding slider let you explore the instrumentation and personalization live.

---

## What it is

Five surfaces, one loop:

| Route | Surface | Idea |
|---|---|---|
| `/` | **Slide deck** | A 7-scene portfolio narrative of the redesign + a guided demo entry. |
| `/f/[slug]` | **Fundraiser** | Donate/Share/Follow with a **Suns contribution board** — ambient "suns" in the gutters that read as a crowd; you light your own on a meaningful action. |
| `/communities/[slug]` | **Community** | The retention hub — follow a cause, see activity, find fundraisers; "unite around causes." |
| `/u/[handle]` | **Profile** | Organizer identity + their suns across causes + per-persona share copy. |
| `/dashboard` | **Analytics** | The instrumentation made visible — metric tree, funnels, retention, live event ticker. |

Three signature ideas thread through all of them:

- **Suns contribution board** — ambient social proof (`lib/marks/`, `components/marks/`). Follow places your sun, sharing colors it, giving grows it. No dollar figures on suns — presence, not pressure.
- **Metric overlay** — a demo toggle that dims the page and highlights each instrumented feature with the metric it drives and a deep link to where it shows up on the dashboard (`components/overlay/`). This is how the "explain what you instrument and why" requirement is made tangible.
- **L3.5 personalization** — six demo personas; page **structure is fixed**, only named slots adapt (`usePersona()`, `lib/personalization/`, `fixtures/`). Share copy is static per-(persona × channel) — no LLM on the request path.

## Quick start

```bash
npm install
cp .env.example .env        # defaults are fine for local — embedded DB, demo mode on
npm run dev                 # http://localhost:3000
```

No Docker or external database required: with no real `DATABASE_URL`, the app uses **embedded
PGlite** (Postgres + pgvector, in-process, persisted to `.pglite/`) and auto-seeds via the scripts
below. Set a real `DATABASE_URL` (see `docker-compose.yml`) to use node `pg` instead.

```bash
npm run db:setup            # create schema (PGlite or pg)
npm run db:seed             # seed fundraisers, communities, profiles, board state
npm run db:reset            # setup --reset + seed
```

## Scripts

| Command | What |
|---|---|
| `npm run dev` | Dev server on :3000 |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit + integration (Vitest + Testing-Library + MSW) |
| `npm run test:e2e` | E2E (Playwright: `chromium-desktop` + `mobile`/iPhone-13). Set `PLAYWRIGHT_BASE_URL` to run against a deployed instance. |

## Tech stack & tradeoffs

- **Next.js 14.2 (App Router) · React 18 · TypeScript · Tailwind** (mapped to `--hrt-*` GoFundMe design tokens). Next was PRD-preferred; App Router gives SSR-by-default for fast first paint on the DB-backed pages.
- **Dual database — embedded PGlite *or* node `pg`** (`lib/db/client.ts`). *Tradeoff:* PGlite means the whole app (and its pgvector embeddings) runs with zero infra — clone-and-run, and the demo deploys without a managed DB — at the cost of a single-process writer and ephemeral writes in a container. Real `DATABASE_URL` swaps in `pg` for a persistent multi-writer setup.
- **PostHog** for product analytics (MSW-stubbed in tests); **Nivo** for dashboard charts; **SSE** for the live event ticker; **Anthropic/Voyage** used **offline/batch only** (share copy + embeddings are precomputed fixtures) so there's **no LLM/embedding call on the request path** — keeps page loads fast and costs bounded.
- **Deployment: Railway** (AWS was "preferred but you decide"). The PGlite seed is baked into the image at build, so the dynamic DB-backed routes render in prod with no external DB. See [Deployment](#deployment).

Deeper rationale and the full metric/event schema live in [`docs/`](./docs) (don't duplicate here):
`architecture.md`, `strategy-metrics-research.md` (canonical events/metrics, §4), `design-overlay.md`,
`design-personas.md`, `feature-contribution-board.md` (suns), `test-plan.md`.

## Metrics & instrumentation (what we capture and why)

Per the assignment, the optimization target is **Repeat Visits + Meaningful Actions (Donate / Share / Follow)**. The metric tree (`strategy-metrics-research.md §2/§4`):

- **North Star:** *Meaningful sessions / user / week* — a visit with ≥1 intentional action. A leading indicator of the assignment's "come back + take meaningful action."
- **Output (conversion):** Donation Conversion Rate, the donate funnel.
- **Leading / loop / retention:** Follow rate, Share rate (per channel, with attributed share IDs for a measured k-factor), Repeat Visits (D7).
- **Board/Mark events** (suns): `Mark Created`, board dwell, return-after-mark — the activation→retention test.

Canonical events include `Page Viewed`, `Section Viewed`, `Share Clicked`, `Community Followed`,
`Update Read`, `Fundraiser Clicked Through`. Every instrumented feature is clickable in the metric
overlay, which names its metric and deep-links to the matching dashboard widget — so the
instrumentation is self-documenting in the running app.

## Deployment

Deployed on Railway (Nixpacks). `railway.json` sets the build to seed PGlite then `next build`, and
starts `next start` on `$PORT`; `NEXT_PUBLIC_DEMO_MODE=true` and `USE_PGLITE=true` are service vars.
Because `NEXT_PUBLIC_*` is inlined at build time, those vars must exist before the build.

## Testing

TDD/regression discipline: a failing test first, then the fix. Suites: ~Vitest unit + integration
(PGlite-backed) and Playwright E2E across desktop + 390px mobile + axe. The bar for "done" is the
**rendered** behavior matching the v4.2 design mocks, not just a green suite. See `test-plan.md`.

## Repository layout

```
app/          routes: page.tsx (deck), dashboard/, f/[slug]/, communities/[slug]/, u/[handle]/, api/
components/    landing/ fundraiser/ community/ profile/ marks/ overlay/ dashboard/ shared/ slots/
lib/           marks/ personalization/ personas/ overlay/ db/ analytics/ ticker/ mobileFrame.ts
db/            migrations + seed + setup
fixtures/      personas, share-copy matrices, ripple stats, sessions
docs/          architecture, design specs, strategy, change board, test plan (27 docs)
tests/         unit/ integration/ e2e/
```

## AI usage

This project was built AI-first across three phases (planner → designer → coder). The full account —
tools, architecture-shaping prompts, validation steps, caught hallucinations, and usage numbers — is
in [`AI_USAGE.md`](./AI_USAGE.md).
