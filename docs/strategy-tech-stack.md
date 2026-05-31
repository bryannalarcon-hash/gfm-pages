# Tech Stack — Decisions Log

This doc tracks every tech-stack pick for the GoFundMe-pages portfolio demo. Each entry follows the global "Tech stack decisions" workflow rule: comparison done, opinionated pick, closest competitor + deciding tradeoff named, hidden costs flagged. Decisions are appended as they're locked; this is the canonical reference for the writeup.

---

## Locked decisions

### Analytics + feature flags + experimentation + session replay → **PostHog**

**Pick:** PostHog (self-host via Docker, or EU-Frankfurt cloud as the fallback).

**Role replaced:** the analytics layer in GFM's stack (mParticle ingestion + Amplitude readout + Optimizely flag assignment + GrowthBook stats engine + an unspecified replay tool). One tool collapses four GFM vendors for our scale.

**Closest competitor:** **Statsig.** Beats PostHog on experiment statistics rigor (CUPED, sequential testing, Bayesian inference, contextual bandits, SRM checks). Larger free event cap (2M vs 1M).

**Deciding tradeoff:** **self-host + EU data residency + open-source credibility = PostHog wins.** Statsig has no self-host, and EU residency is Enterprise-only — both are explicit requirements here. For a 50-experiment production SaaS team, Statsig would win.

**Verified comparison summary** (full chart in `claude-conversation.md` Prompt #38 reply, sources cited there):

| Tool | Analytics | A/B + flags | Replay | Self-host | Free tier | EU residency | OSS | Read API |
|---|---|---|---|---|---|---|---|---|
| **PostHog** *(picked)* | ✓ | ✓ both | ✓ | ✓ MIT | 1M ev | ✓ Frankfurt | ✓ | ✓ all tiers |
| Statsig (close 2nd) | ✓ | ✓ both | ✓ | ✗ | 2M ev | Enterprise only | partial | ✓ |
| Amplitude | ✓ | trap (1 active exp free) | partial | ✗ | 2M ev | Growth+ only | ✗ | paid tiers |
| Mixpanel | ✓ | paywalled | partial | ✗ | 1M ev | paid only | ✗ | paywalled on free |
| LD + Amplitude | ✓ | ✓ both | partial | ✗ | both | partial | ✗ | both ✓ |
| GrowthBook + Plausible | partial | ✓ both | ✗ | ✓ both | mixed | ✓ | ✓ both | ✓ both |
| Heap | auto-capture | ✗ none | paywalled | ✗ | partial | [?] | ✗ | [?] |
| ~~June~~ | DROPPED — acquired by Amplitude, shutdown Aug 2025 | | | | | | | |

**Hidden costs flagged:**
- PostHog session replay scales at **$0.005/recording** after the 5K/mo free quota. Trivial at our demo scale; ~$25/mo at 10K replays.
- If we later need stronger experiment statistics (sequential testing, SRM, bandits), PostHog's experiments module is the weak link — that's the exit pressure toward GrowthBook (see alternative below).

**Why this matters for the portfolio writeup:**
- Single SDK, single dashboard, single API for the overlay's `data-overlay-dashboard` links — the simplest defensible story.
- `/query` endpoint available on the free tier — directly unblocks the custom dashboard page reading from PostHog's API.
- Self-host = "we own the data," matches the strategy-personalization.md L3.5 privacy framing.

### Alternative considered: **GrowthBook + PostHog** (two-tool stack)

Reason to upgrade later: GrowthBook is the experiment-stats engine GoFundMe actually uses (we confirmed this in `gfm-analytics-stack-public.md`). Using GrowthBook on our side would let us claim "we mirrored GFM's experiment-stats tooling" in the writeup. GrowthBook's stats engine (CUPED, sequential, Bayesian, bandits, SRM) is genuinely more advanced than PostHog's experiments module.

**Cost of the upgrade:** ~3 hours of dual-SDK integration. No session replay in the 2-tool stack (would need PostHog still, which is fine — same as the primary pick).

**When to make the switch:** if the writeup wants the explicit "we matched GFM's actual experiment tooling" beat. Otherwise stay on PostHog-only.

---

### Framework / runtime → **Next.js 14+ (App Router)**

**Pick:** Next.js, App Router (Server Components by default, streaming, route handlers).

**Why React + Next.js together:** React provides the UI primitives (`useState`, `useEffect`, JSX, component model); Next.js provides everything React leaves to you — file-based routing, SSR, ISR, image optimization, route handlers, server components, middleware. Together they cover the full app surface without a separate router, bundler, or SSR setup.

**Risk flag:** App Router (newer) vs Pages Router (older, more stable). App Router has rough edges but is the future-proof choice and matches modern Next docs. Expect occasional Pages-Router-flavored answers in older docs/StackOverflow.

**Comparison skipped:** user-locked. The honest comparison field would be Next.js vs Remix vs SvelteKit vs Astro vs Nuxt; for our specific constraints (D7 sub-2.5s LCP via SSR/ISR, easy `data-overlay-*` attribute injection, large React talent pool for portfolio reading) Next.js is the conventional and defensible pick.

### Deployment platform → **Railway**

**Pick:** Railway — hosts the Next.js app, the Postgres + pgvector database, and the LLM batch worker on one platform.

**Why this matters for our stack:** Railway natively provisions Postgres with pgvector available as an extension — PG, pgvector, the Next.js app, and a small worker (for D9/D13/C6/P8 batch LLM jobs) all live behind one ops surface, one billing relationship, one set of secrets.

**Risk flag:** less Next-specific optimization than Vercel — no automatic ISR edge cache, no Vercel Image Optimization global CDN. At our scale this is invisible. Pricing scales by usage; portfolio scale stays inside free credits. If we later need global edge caching, Cloudflare or Vercel become the migration path — Next.js itself is platform-portable.

**Comparison skipped:** user-locked. Field would be Vercel vs Netlify vs Cloudflare Pages vs Railway vs self-host.

### LLM provider → **Claude (Anthropic API)**

**Pick:** Claude API for all generative content (D9 share copy, D13 update summaries, C6 community share copy, P8 profile share copy).

**Usage pattern:** all calls are batch-precomputed at content-create time and cached (per `strategy-metrics-research.md` §"Implementation options for adaptive changes"). Zero real-time LLM on the request path.

**Risk flag:** rate limits on lower tiers (low — our batch volume is small: ~8 share-copy variants per fundraiser/community, ~1 update summary per fundraiser update). Vendor lock is low because all calls are at create time — swap to OpenAI by changing one API client.

**Comparison skipped:** user-locked. Field would be Claude vs OpenAI vs local Ollama.

### Database → **Postgres (Railway-hosted)**

**Pick:** Postgres, hosted on Railway, with the `pgvector` extension enabled.

**Risk flag:** none. Postgres is the universal default for relational data + extensions + ecosystem maturity.

**Comparison skipped:** user-locked. Field would be Postgres vs MySQL vs SQLite vs Supabase vs Neon vs PlanetScale.

### Embeddings store → **pgvector** (extension on the same Postgres instance)

**Pick:** pgvector — store fundraiser and donor-profile embeddings inside the same Postgres database as the rest of the app data. Cosine similarity via the `<=>` operator.

**Why this matters:** No separate vector DB infrastructure. One connection pool, one ops surface, one backup. For D11 ("similar fundraisers" on post-donate) and P4 (PYMK proximity reranking), we have <1000 fundraisers and a few thousand follow edges — pgvector is wildly overprovisioned at our scale.

**Risk flag:** slower than dedicated vector DBs (Pinecone, Weaviate, Qdrant) at millions-of-vectors scale. Irrelevant for this build; would be an exit pressure only at production scale.

**Comparison skipped:** user-locked. Field would be pgvector vs Pinecone vs Weaviate vs Qdrant vs OpenAI's vector store.

### Embeddings provider (model) → **Voyage AI (`voyage-3.5`)**

**Pick:** Voyage AI generates the vectors that pgvector stores. Model `voyage-3.5` (1024-dim default; Matryoshka-truncatable to 256/512/2048 later). User-selected.

**Role:** embeds fundraiser text (title + story + category) and profile/cause text for D3/D11 ("similar fundraisers" post-donate) and P4/C3 (PYMK proximity). Batch-precomputed at content-create time alongside the Claude calls; written to the `embedding vector(1024)` columns. No real-time embedding on the request path.

**Closest competitor:** **OpenAI `text-embedding-3-large`** (3072-dim, ubiquitous). **Deciding tradeoff:** Voyage's retrieval-tuned models lead MTEB retrieval and are purpose-built for similarity/RAG — exactly the D3/P4 use. OpenAI would only win on already-being-in-stack, but the LLM here is Claude, not OpenAI, so there's no incumbency advantage. Field also includes Cohere `embed-v3` and a local `bge`/`nomic` model (free + self-host, more ops).

**Hidden costs / risk flagged:** paid third-party API, **no self-host** (unlike pgvector the store). Content is sent to Voyage — acceptable (public fundraiser text + our generated copy, no donor PII). Vendor lock is low: create-time only, so swapping = a re-embed batch + a column-width migration. Requires `VOYAGE_API_KEY` (see `.env`).

---

### Error monitoring → **PostHog (collapsed into the analytics pick)**

**Pick:** PostHog's built-in error tracking. No separate vendor.

**Why:** the PostHog SDK is already loaded for events/funnels/replay; turning on error capture is a config flag, not a new dependency. Strictly fewer things in the stack.

**Risk flag:** PostHog's error-tracking product is younger than Sentry's, with thinner source-map handling and fewer integrations (Slack/PagerDuty alerts are basic). For a portfolio demo this is irrelevant — we're not on-call. For production at scale, Sentry remains the best-of-breed exit pressure.

**Comparison skipped:** user-directed collapse. Field would be Sentry vs Highlight vs Bugsnag vs PostHog built-in.

### Email / lifecycle (P2 weekly digest) → **MOCKUP ONLY for the demo; Resend if a sample-send button is needed**

**Pick:** the email is **out of demo scope**. The `profile-wireframe.md` §7 mockup is the visible artifact in the portfolio; the writeup notes that production would use Braze (GFM-equivalent) or Resend.

**Optional:** if a working "Send me a sample digest" button is wanted for the demo video, **Resend** is the lean pick — free tier ~3K emails/mo, single API call, no DNS hassle for the test inbox. ~30 min build cost. Decide during the build phase.

**Risk flag:** none for the mockup-only path. If Resend is added later, vendor lock is minimal — swappable to Loops, Customer.io, or AWS SES with a single API client change.

**Comparison skipped:** out-of-demo-scope, so no full chart. The brief honest field is Braze (industrial GFM-parity, ~$0 → enterprise) vs Resend (lean) vs Loops (lifecycle-DSL) vs Customer.io (rules engine). For a one-week demo the only sensible pick if it's needed at all is Resend.

---

## All planning-layer tech picks are now locked. Pending decisions: **none.**

Auth remains explicitly out of scope per `fundraiser-redesign.md`. Payments stay in Stripe test mode (also out of scope as a "real backend"). Every other layer required to build the three redesigned pages + the overlay + the custom dashboard + the slide-deck landing is now decided.

---

## What the decision tree looks like end-to-end

```
Frontend framework  →  Next.js (App Router) ✓ locked
        │              built on React (useState / useEffect / JSX)
        │              adds: file routing, SSR/ISR, server components,
        │              route handlers, next/image, middleware
        │
        ├── Hosting / deployment  →  Railway ✓ locked
        │       (one platform: Next app + Postgres + LLM worker)
        │
        ├── Analytics / flags / experiments  →  PostHog ✓ locked
        │       │
        │       └── Custom /dashboard page reads PostHog /query API
        │            (design-overlay.md `data-overlay-dashboard` links here)
        │
        ├── DB (seed data + user state)  →  Postgres on Railway ✓ locked
        │
        ├── Embeddings (D3/D11, P4/C3)  →  Voyage voyage-3.5 → pgvector ✓ locked
        │       (Voyage generates the 1024-dim vectors; pgvector stores them on the same PG instance)
        │
        ├── LLM API (D9, D13, C6, P8)  →  Claude (Anthropic) ✓ locked
        │       (batch precompute at content-create time; cached)
        │
        ├── Error monitoring  →  PostHog (collapsed) ✓ locked
        │       (same SDK as analytics; one config flag enables it)
        │
        └── Email (P2 digest)  →  MOCKUP ONLY ✓ locked
                (wireframe §7 is the deliverable; Resend if a
                 "send sample" button is added during the build)
```

**Stack synergy:** Next.js + Railway + Postgres + pgvector + Claude API = one platform (Railway) hosting one app (Next.js), one database (PG with pgvector extension), and one batch worker (LLM calls). PostHog is a separate SaaS but its `/query` API closes the loop with the custom `/dashboard` page that the overlay's `data-overlay-dashboard` attributes link into.

**Demo client-side state** lives in two `localStorage` keys read on every page mount: `overlayOn` (boolean — overlay visibility) and `overlayPersona` (string slug from `design-personas.md` — which of the six demo personas the L3.5 layer renders against). Both persist across page navigation within the demo session. Neither is shipped to production — they're gated behind `NEXT_PUBLIC_DEMO_MODE=true`.

**All planning-layer tech-stack decisions are now locked.** Error monitoring collapsed into PostHog (same SDK). Email is mockup-only for the demo (wireframe §7 is the deliverable), with Resend as the lean pick if a "send sample digest" button is added during the build.
