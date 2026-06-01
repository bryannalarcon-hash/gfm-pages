# AI Usage Log

How AI tooling was used to build the GoFundMe Profile / Fundraiser / Community redesign, per the
assignment's required deliverables. The project was built **AI-first across three role-separated
phases** — **planner** (Claude + user, plan-only), **designer** (mocks), **coder** (the app) — each
with its own logged session: `claude-planner-conversation.md`, `claude-designer-conversation.md`,
`claude-coder-conversation.md`.

> **Note on completeness:** the **planner phase's usage numbers were lost** — running `/usage`
> against those sessions returned blank cost *and* time (the 2026-05-26→28 sessions aged out of the
> locally-tracked window). They are reconstructed/estimated from session transcripts below; the
> **designer** phase was not auto-logged turn-by-turn (its log is reconstructed); only the **coder**
> phase has exact `/usage` figures.

## Tools used

- **Claude Code (Opus 4.8, 1M context)** — orchestrator across all phases: architecture, task
  decomposition, live verification, commits, and review. Lower tiers (Sonnet/Haiku) intended for
  mechanical + verification work, Opus to orchestrate.
- **Task subagents / verifier swarms** — research swarms (named lenses: coverage, UX/narrative,
  token-conformance) for the metric research and delta-substantiality grading; `system-architect`
  built `architecture.md`; `coder`/`researcher`/`backend-dev` subagents ran the change-board waves.
  *Caveat (from the coder `/usage`): subagents this period ran on **Opus 4.8**, not a cheaper tier —
  ~12% of usage and a chunk of the spend. Running simple subagents on Sonnet/Haiku is the obvious
  next-time lever.*
- **Test + verify stack** — Vitest + Testing-Library + MSW (unit/integration), Playwright (serial;
  `chromium-desktop` + `mobile`) + axe-core (E2E), `tsc`, and embedded **PGlite** (Postgres+pgvector,
  Docker-less) for DB-backed tests.
- **Infra / VCS** — Railway CLI + MCP (prod deploy → `gfm-web-production.up.railway.app`); GitLab push
  to `main` (token parsed from `.env`, never printed/persisted).
- **Custom logging tooling** — `scripts/prompt_logger.py` (UserPromptSubmit + Stop hooks) plus
  `backfill_conversation.py` / `clean_planner_log.py`, producing the three conversation logs this doc
  draws from.
- **Skills used** — `/goal`, `/handoff`, `/compact`, `/model`, `AskUserQuestion`, and
  `compound-engineering` skills (`ce-work`, `ce-plan`, `ce-brainstorm`, `ce-doc-review`), `/impeccable`.

## How it was built — three phases

### Phase 1 — Planner (plan-only) · 2026-05-26 → 05-31 · ~128 prompts (two `/compact` resets)

Operated strictly plan-only ("planning only for the project itself; internal tooling is fine to
touch"). Produced the research base, design system, personalization strategy, the 33-delta scheme,
the event schema, the overlay/dashboard/slide-deck specs, the build contract (`architecture.md`), the
`coder-spec.md`, and the test plan.

Architecture-shaping prompts:
- *"What metrics are we optimizing, how are they tracked, and why those metrics? Back it up with
  research. Maybe use agent swarms to pull citations."* → a citation-backed **metric tree**
  (North Star = meaningful sessions/user/week; share = acquisition, follow = retention) via a
  5-researcher swarm → `strategy-metrics-research.md`.
- *"Before we confirm L3, what does L4 look like?"* → *"Let's do L3.5 — I don't want the screen to be
  wildly different."* → locked **L3.5 personalization** (structure fixed, only named slots adapt,
  every slot has a first-time fallback).
- *"Use a subagent swarm to verify whether the fundraiser changes are substantial enough."* → a
  3-lens verifier swarm graded each delta MARGINAL→SUBSTANTIAL; produced the 6-step delta recipe.
- *"Why PostHog over other tools? Do research and provide a chart."* → an 8-tool × 9-axis comparison
  (PostHog chosen, Statsig named closest competitor) — and seeded the global "Tech stack decisions"
  rule requiring a comparison chart for every stack pick.
- *(#67–73)* the **Suns contribution board** brainstorm (GFM-logo primitive; follow = presence,
  share = color, give = size; single-touch attribution; the honeypot-griefing tradeoff) →
  `feature-contribution-board.md`, expanding 28→33 deltas.
- *"Make the spec sheet for the coder and a prompt I can give to the coder, used with `/goal`."* →
  `coder-spec.md` + the `/goal` kickoff, after an internal-index-leakage audit across the repo.

### Phase 2 — Designer (mocks) · 2026-05-28 → 05-29 · 13 prompts · **RECONSTRUCTED**

> This phase was **not** auto-logged turn-by-turn; its log is reconstructed from a narrative record,
> prompts paraphrased, timestamps approximate. Treat the prompts below as reconstructed.

Built static HTML/CSS hi-fi mockups of the three pages from the `design_handoff_1/` pack, iterating
from a wireframe-faithful v1 through four design directions to the chosen **v4.2 "Suns" ambient-gutter**
direction (desktop + mobile), then wrote the build handoff (`mocks/HANDOFF.md`).

Reconstructed prompts (paraphrased):
- *~"The 'Before' mode just hides additions — make it a faithful recreation of current GoFundMe."~* →
  rebuilt `before.css` as a real current-GFM recreation.
- *~"Give me real design directions / bigger swings."~* → v2 Principled, v3 Field Dispatch,
  v4 Spread-the-Word, v5 Reinvented + a navigator.
- *~"Try the contribution-board idea — every action leaves a logo-shaped mark, guardrails honored."~*
  → built it; v4.1 (contained board) **dropped** in favor of v4.2 (ambient page-background).
- *~"Fill looks wrong — gaps between bands, concentric-arc artifacts; pack like a filling bucket."~* →
  evolved single-pile → bands → gapless skyline → organic packing via staggered CSS fall.
- *~"Small suns read denser than big airy ones; give me demo sliders; funded% must never make the page
  look empty."~* → flipped the size mapping; added the demo-only Density / Size-contrast / Funded%
  controls (which don't ship to prod).
- *~"Go with v4.2 desktop + mobile; lock defaults; write the build handoff."~*

### Phase 3 — Coder (the app) · 2026-05-29 → 05-31 · 69 prompts (three `/compact` resets)

Opus orchestrator built the locally-runnable Next.js 14 app to the `coder-spec.md` Definition of Done,
then ran a long **change-board** iteration phase (CB-01 … CB-108), decomposing each item into Sonnet
coder subagents → verifier subagents → review, test-first, "Done = tests green + matches the v4.2 mock
+ no regression."

Architecture-shaping prompts:
- *(`/goal` kickoff)* *"Build the redesign as a LOCALLY RUNNABLE, TESTABLE Next.js app following
  `docs/coder-spec.md` exactly. Work as an orchestrator: coder subagents → verifier subagents → your
  review, looping until green. Test-first (write the test, see it fail, implement, see it green). No
  vacuous green."* → set the whole orchestration + TDD + DoD frame.
- *"I extracted the zip, opened them in Firefox, and they look entirely different. How are you 'seeing'
  the sites?"* → forced the verification reckoning (the agent renders headless-Chromium PNGs, never the
  user's real browser); exposed the suns z-index/sparse-seed bug.
- *"Realign the app toward the mock. It should act exactly like the mock-up."* → pivoted the fundraiser
  from donate-first to share-first.
- *(change-board brief)* *"Your work queue is the change board. The 'Workflow' section is BINDING.
  Done means tests green + matches the v4.2 mock + no regression — not 'code written.'"* → the kanban
  discipline that caught most hallucinations.
- *"The demo data button isn't working for me. Make a Playwright test toggling it with temp
  screenshots."* → a user-driven, test-first regression on a repeat bug (became CB-107).

## Validation steps for AI-generated code

- **Test-first, red→green, no vacuous green.** The `/goal` brief mandated: "write the test, see it
  fail, implement, see it green… the verifier swarm must confirm each test fails before the fix." The
  suite grew 299 → 386 → **795 unit + ~75 Playwright E2E**, `tsc` clean throughout.
- **Verify the way the user sees it, not the agent's self-report.** The decisive lesson (prompt #6).
  Routes were confirmed serving 200 via real requests; the suns over-count was caught by *measuring*
  DOM nodes (7756 → capped 160/190), not by the agent's "looks lighter" verdict; the demo-data and
  overlay fixes were confirmed by trusted `page.mouse` clicks + screenshots on the exact user path
  (persona, `#anchor` scroll, mobile-frame).
- **The change board as a gate.** Items moved To Do → In Progress → Done only with tests green + a
  visual-diff verdict against the `mocks/` v4.2 / reference PDFs + no regression.
- **End-to-end + prod parity.** The instrumentation loop was verified live (UI action → event →
  dashboard ticker); the final build was a real `next build` (strict lint) deployed to Railway and
  smoke-tested against the live URL — not just the dev server.

### Hallucinations / bad output caught

- **Vacuous test + suns-rendered-as-blocks (CB-01/13):** the first suns agent's test asserted an
  attribute string, not the render; `maskImage` computed to `none`. Surfaced only by the user's "how
  are you 'seeing' the sites?" — fixed via a shared `logoMask.ts`.
- **7756-sun overshoot (CB-12):** a density constant changed only the row gap while the pad count
  scaled with the whole gutter; the agent reported "looks lighter" while reality was 7756 DOM nodes.
  Capped + `packEven`.
- **Overlay click-through never wired (CB-09):** the dim layer absorbed clicks and the blob link was
  swallowed — reported green, fully broken.
- **The "REPEAT" class:** items marked Done returned as repeats — CB-28 only fixed a cosmetic count
  constant (real fix was the `display:contents`/`regionRect` work, CB-68); CB-69's inline studio used
  static copy, not the persona matrix. This pattern is the single strongest argument for the
  verify-like-the-user rule.
- **Funnel-still-black (CB-38):** the agent fixed the border, not the fill (color binding resolved to
  `undefined` → black).
- **Viewer-facing index/format leaks (CB-50/60):** a raw `copy_link` event slug rendered to the
  viewer; `Math.round` on a 0–1 ratio showed "1%" for 78% funded.
- **Planner-log over-deletion:** the first `clean_planner_log` run dropped 84/86 prompts (wrong session
  id treated as pollution); reverted from `.bak`.
- **`FundraiserCarousel` hooks-after-return:** `next build`'s strict lint caught hooks called after an
  early return — a latent React crash that dev / Vitest / `tsc` all missed.
- **This document's own correction:** an earlier draft claimed subagents ran on Sonnet; the `/usage`
  breakdown showed **100% Opus 4.8**, so the claim was corrected here.
- **Unverifiable stat dropped:** the planner flagged the "Amazon 100ms = 1% sales" figure as
  unverifiable and removed it, and flagged the identifiable-victim effect's failed 2023 replication.

## Reflection

**Where AI helped most.** Front-loaded, citation-backed research and the delta/event-schema
scaffolding (planner); rapid generation of multiple design directions and the Suns concept (designer);
and high-throughput change-board burn-down — the coder phase closed dozens of items in a single
session via parallel coder→verifier swarms. The three-phase, role-separated structure kept each phase
focused and produced a clean paper trail.

**Where it produced bad output.** Headless-screenshot / DOM-probe verification repeatedly reported
features "working" that the user's real browser showed broken (the REPEAT pattern), and agents
reported "green" on vacuous or cosmetic-only fixes. Anything depending on an unverified assumption was
wrong until checked against the real, rendered system.

**What I'd do differently.** (a) **Verify the way the user sees it** — reproduce the exact path + live
screenshot + root-cause before marking anything Done; this rule was learned mid-project and should
have been the default from prompt #1. (b) **Run simple subagents on a cheaper tier** — the `/usage`
data showed 100% Opus while subagents were ~12% of usage and 84% of usage came from subagent-heavy
sessions. (c) **`/compact` mid-task** — 87% of usage was at >150k context, where even cached tokens
are expensive. (d) **Don't lose the meter** — capture `/usage` per phase before sessions age out
(the planner numbers below were lost precisely because this wasn't done).

---

## Usage Numbers

Exact figures survive only for the **coder** phase (`/usage`, this machine). The **planner** phase's
`/usage` returned **blank cost and time** (sessions aged out); the **designer** phase had no
turn-by-turn logging. The planner is therefore **estimated from session transcripts** below.

### Coder phase — measured (`/usage`)

| Metric | Value |
|---|---|
| API duration | 13m 41s |
| Wall-clock duration | 4h 16m 22s |
| Model | Claude Opus 4.8 (1M) — sole model in the cost breakdown |
| Input / Output tokens | 22.3k / 49.4k |
| Cache read / write | 25.5M / 1.0M |
| Total tokens | ~26.6M (~96% cache reads) |
| **Total cost** | **$20.46** |
| Code changes | +289 / −8 lines |

13m API vs 4h16m wall + ~96% cache reads ⇒ the spend was overwhelmingly orchestration/verification
and cheap context re-reads, not fresh generation.

### Planner phase — **LOST / estimated**

`/usage` returned blank (cost + time). No exact figures exist. Best-effort extrapolation from the
session transcripts (`~/.claude/projects/.../*.jsonl`, which carry per-turn token usage):

- The planner was the **largest phase by prompts** (~128, vs designer 13 and coder 69) and spanned the
  **most calendar days** (2026-05-26 → 05-31, with two `/compact` resets) — heavy research + spec
  authoring (the metric tree, 33-delta scheme, event schema, `architecture.md`, `coder-spec.md`, test
  plan, all of `docs/`).
- Transcript activity for the captured planner/designer era (05-27 → 05-28; the 05-26 kickoff aged
  out and isn't in the transcripts): **684 turns, ~243M cache-read + ~2.5M output tokens** — i.e. a
  per-day volume on the order of a coder day.
- **Estimate:** the planner phase's spend was **at least comparable to, and plausibly greater than,
  the coder phase (~$20)** given more prompts over more days — call it **~$20–40 [ESTIMATED]**. A
  precise figure is not recoverable: the planner's own `/usage` was empty, and token→cost cannot be
  reliably back-derived (the coder's measured $20.46 does not reconcile with list token rates, so
  scaling by raw tokens would be misleading).

### Designer phase — not metered

No turn-by-turn logging or `/usage` capture. ~13 reconstructed prompts over ~1 day (05-28 → 05-29).
Cost not recoverable; on prompt volume, a small fraction of either other phase.

### Transcript token volume by day (basis for the planner estimate)

Summed from this project's session transcripts (includes subagent turns):

| Day | Turns | Input | Output | Cache read | Cache write |
|---|---:|---:|---:|---:|---:|
| 2026-05-27 | 183 | 60.4k | 450.2k | 22.7M | 1.6M |
| 2026-05-28 | 501 | 25.4k | 2.10M | 220.8M | 7.9M |
| 2026-05-29 | 1345 | 345.0k | 2.19M | 551.1M | 7.4M |
| 2026-05-30 | 1743 | 302.3k | 2.75M | 705.7M | 14.8M |
| 2026-05-31 | 1152 | 170.4k | 1.48M | 598.2M | 10.3M |
| 2026-06-01 | 39 | 2.0k | 61.6k | 11.6M | 0.3M |
| **Total** | **4963** | **905.5k** | **9.03M** | **2.11B** | **42.3M** |

(These raw transcript sums are far larger than the coder `/usage` figure because they span all
sessions and include every subagent turn; they are an activity proxy, not a billed-cost figure.)

**Raw coder `/usage` output:**

```
Total cost:            $20.46
Total duration (API):  13m 41s
Total duration (wall): 4h 16m 22s
Total code changes:    289 lines added, 8 lines removed
Usage by model:
     claude-opus-4-8:  22.3k input, 49.4k output, 25.5m cache read, 1.0m cache write ($20.46)
```
