# Coder Spec — Implementation Build Sheet

> **Role:** build the **real Next.js application** from the planning specs + the designer's static mocks. This is the implementation phase. The output is a **locally runnable, testable app** (`npm run dev` → all surfaces working), portable to Railway later.
>
> **You are an orchestrator.** Decompose into a swarm of **coder subagents** (one per subsystem) → **verifier subagents** → your review, looping until green. Tiering: you (Opus) assign + review; mechanical work and verification run on `sonnet`/`haiku`. This is a `/goal` run — loop until the Definition of Done (§7) is met, not a fixed 3 rounds.

---

## 1. Binding documents — read in this order

| # | Doc | Role |
|---|---|---|
| 1 | `architecture.md` | **THE contract.** File tree (§2), module seams + ownership (§3), exported signatures (§4 + §4.8 Suns), data model (§5), shared types (§6), build phases (§7), resolved gotchas (§8). Build *behind* these signatures; if one is wrong, fix it there first, then build. |
| 2 | `strategy-tech-stack.md` | Locked stack — do not re-pick. Next.js 14+ App Router · Railway · Postgres+pgvector · PostHog · Claude (batch) · Voyage `voyage-3.5` embeddings · Nivo · SSE · email mockup. |
| 3 | `gfm-design-system.md` | The only token source. No invented hex. **No green CTA on white.** |
| 4 | `strategy-personalization.md` | L3.5 — structure fixed, only named slots adapt. |
| 5 | `design-overlay.md` + `design-personas.md` | Overlay primitive + the 6 demo personas. |
| 6 | `{fundraiser,community,profile}-{wireframe,redesign,feature-parity}.md` | Per-page layout, the 28 page-deltas + rationale, KEEP/CHANGED/CUT. |
| 7 | `feature-contribution-board.md` | The **Suns** cluster S1–S5 (committed; 33 total). |
| 8 | `design-dashboard.md` | `/dashboard` (W1–W9) + the **Demo→event→dashboard loop**. |
| 9 | `strategy-metrics-research.md` §4 | **Single owner** of the 22 event names + properties. Mirror, never redefine. |
| 10 | `test-plan.md` | The eval suite you build to (test-first). |
| — | `mocks/` + `mocks/HANDOFF.md` | **Visual source of truth** (the chosen **v4.2 "Suns"** direction). Port from these — but NOT 1:1 (see §4). |

---

## 2. File structure (where you build)

Scaffold the Next.js app **at the repo root**, exactly per `architecture.md §2` (`app/`, `components/`, `lib/`, `db/`, `fixtures/`, plus `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `.env` already present). Keep the planning artifacts as **read-only reference** — do not edit them except `architecture.md`/§4-owner docs when a signature is genuinely wrong (and say so).

```
gofundme-pages/                 # repo root = the Next.js app root
├─ app/  components/  lib/  db/  fixtures/   ← BUILD HERE (architecture.md §2)
├─ tests/                        ← unit + integration + e2e (test-plan.md)
├─ docker-compose.yml            ← local Postgres+pgvector (+ optional PostHog)
├─ docs/                         ← read-only specs (this sheet, architecture, …)
├─ mocks/                        ← read-only visual SOT (v4.2) — port, don't import
├─ scripts/                      ← prompt logger (leave alone)
└─ handoff/  *-conversation.md   ← gitignored, ignore
```

Tokens from `mocks/tokens.css` → your Tailwind config / CSS variables (they already transcribe `gfm-design-system.md`). Keep `mocks/` around for visual diffing (test-plan §7.7e); the shipped app does not import mock files.

---

## 3. Build order (architecture.md §7 — respect the phases)

- **Phase 0 (blocking):** `lib/types.ts` → `db/schema.sql` + `db/seed.ts` (incl. `SEED_IDS`, a **near-goal ≥80% entity** for D2, session/replay mock rows, share→donation attribution chains) → overlay primitive (`lib/overlay/*` + `components/overlay/*`).
  - **Test the GoFundMe Sans CDN cross-origin policy EARLY** (pre-deploy blocker); fall back to the metric-compatible stack from `mocks/tokens.css` if it fails.
- **Phase 1 (parallel):** `components/shared/*`, `lib/personas/*` + `fixtures/personas.ts`, `lib/analytics/capture.ts`, `lib/llm/batch.ts` (offline), `lib/posthog/query.ts` + `app/api/query`, `lib/ticker/*` + `app/api/ticker`.
- **Phase 2 (parallel):** `lib/personalization/slots.ts` + the 6 slot components; **`lib/marks/*` + `components/marks/*`** (Suns S1–S5).
- **Phase 3 (3 independent tracks):** fundraiser / community / profile pages, each mounting the ambient `SunsLayer`.
- **Phase 4 (leaf):** `/dashboard`, the `/` slide-deck landing, optional Resend sample-digest.

---

## 4. Port rules — the mocks are NOT a 1:1 port

The reviewer pass found these; they are **refactors**, not translations:

1. **Demo-only vs ship** (`mocks/HANDOFF.md`): STRIP for production — `overlay.*`, `before.css`, the `.marks-panel` sliders, the persona switcher, all `data-overlay-*`, and the `data-show` per-persona display-toggling. KEEP — the suns engine (`marks-bg.js`→`lib/marks/engine.ts`, `suncreate.js`), `marks.css`, `v4.css`, `shared.css`, `tokens.css`, `icons.js`. Gate all demo affordances behind `NEXT_PUBLIC_DEMO_MODE`.
2. **`data-show` → SSR `resolveSlot()`** (`architecture.md §4.3`): the mock's `display:none` per-persona **unmounts** regions — L3.5-illegal. Re-express each as a slot that **always renders** (layout-preserving placeholder; the D8 banner / P9 nudge zero-height collapse is the *only* sanctioned variant). Audit every `data-show` site.
3. **Event-name reconciliation:** every `data-overlay-events` value must map to the §4 canon. The mock's invented names (`Banner Impression`, `Activity Feed Viewed`, `PYMK Module Viewed`, `Recurring Nudge Viewed`, `Board Viewed`) all collapse to **`Section Viewed { section_name }`**. Wire `capture()` to canonical `EventName` only.
4. **Suns CLS refactor:** render from an **SSR'd `BoardSeed`** into a reserved/contained layer — NOT the mock's post-hydration `scrollHeight` probe (it fights the zero-CLS guardrail). Reconcile the mock's `<html>`-background / transparent-`body` trick with the root `layout.tsx`.
5. **Known mock bugs to fix:** `btn--lime` is undefined → use `btn--on-strong`; `suncreate.js` force-enables the create button → restore **greyed-until-unlocked**; build the missing **D2 ≥80% near-goal** state.
6. **Already-applied leakage fixes (keep them):** the overlay blob no longer renders the raw delta ID; the slide deck shows feature names, not `D#/C#/P#/S#`. **No internal index renders in viewer-facing text** (see the global workflow rule).

---

## 5. Hard constraints (a violation is a defect)

1. Tokens only from `gfm-design-system.md`; **no green CTA on white**.
2. **L3.5** — structure identical for all personas; only named slots adapt; never unmount a region.
3. Persona switcher + overlay + before/after are **demo-only**, gated by `NEXT_PUBLIC_DEMO_MODE`.
4. **No real-time LLM or embedding on the request path** — Claude + Voyage are batch-precomputed at create time and cached; `lib/llm/batch.ts` is never imported by a page/component.
5. `referrer_source` + event names: **single owner = `strategy-metrics-research.md §4`**. Mirror in `lib/types.ts`, never redefine.
6. **33 deltas** (12 F + 7 C + 9 P + 5 Suns). Don't renumber; D11 stays folded into D3.
7. **Suns guardrails** (`feature-contribution-board.md §3`): logo primitive, curated key-gradients (no hex wheel), system-controlled placement, no dollar figures, anonymous-by-default + consent, cold-start never empty, `prefers-reduced-motion` safe, pseudonymous attribution, recompute on refund.
8. **No internal index in rendered output** — `D#/C#/P#/S#`, `W#`, `§`-refs, persona slugs live only in code/comments/`data-*`, never in viewer text.

---

## 6. The instrumentation loop (the graded "well-instrumented" claim)

Wire it end-to-end (`design-dashboard.md` "Demo→event→dashboard"): every interactable calls `capture(event, { persona, … })`; mock interactions still emit (a mock donate fires a persona-tagged `Donate Completed`); the SSE ticker (W5) shows it within ~2 s; the per-widget persona filter reflects `persona`; overlay-ON suppresses capture (`isCaptureSuppressed()`), overlay-OFF emits. The signature E2E (`test-plan.md §1`) asserts action → `/dashboard` → value present.

---

## 7. Definition of Done (local-first — the deliverable)

A teammate clones, sets `.env`, and runs:

```bash
docker compose up -d            # Postgres + pgvector (+ optional PostHog)
npm install
npm run db:setup && npm run db:seed   # schema + migrations + seed (incl. near-goal entity, personas, attribution chains)
npm run dev                     # → http://localhost:3000
```

…and gets, with `NEXT_PUBLIC_DEMO_MODE=true`:
**All FIVE surfaces are fully built — not stubs, not just 200s.**
1. All routes serving (200 + correct SSR): `/`, `/f/[slug]`, `/communities/[slug]`, `/u/[handle]`, `/dashboard`.
2. **The three pages** match the **v4.2** mocks (desktop + mobile), tokens-clean, no green CTA on white, every page-delta present.
3. **The `/` slide-deck landing** renders the full 7-scene narrative per `design-slide-deck.md` (Hook → Problem → GFM intel → 33 deltas → Demo features → Demo entry → Stack/Close), shows feature **names** never IDs, and its four demo-entry CTAs link into the three pages + `/dashboard`; persona + overlay state persist across entry.
4. **The `/dashboard`** renders **all nine widgets** (W1 metric tree → W9 replay) from seeded + live data: the metric tree deep-links (and receives the overlay's `data-overlay-dashboard` links with halo/scroll), funnel + retention + trends + NSM/output cards populate, the **SSE ticker streams live**, the experiments table + active-now render, and the replay surface opens (mocked); per-persona filter works on every widget.
5. Overlay pill → menu → persona switch re-renders slots (structure stable, CLS≈0); blob shows event/metric/why (no raw delta ID); blob → correct dashboard widget.
6. Suns: ambient gutter fill, system-placed, follow/share/give mapping, own-sun + sharer highlight, cold-start state, reduced-motion static; greyed-until-unlocked create modal with curated gradients; no dollar figures.
7. **Instrumentation loop live:** perform donate/share/follow/mark with overlay off → the event appears on the dashboard ticker and the relevant widget moves.
8. `npm test` green — unit + integration + Playwright per `test-plan.md`; in CI, PostHog is MSW-stubbed and Voyage/Claude are fixtures (no live calls). Test-first discipline; verifier swarm confirms red→green.
9. PostHog/dashboard works locally either against the EU-cloud project (`.env` keys) or the MSW stub for offline dev.

**Then** (not part of local DoD, note for follow-up): Railway deploy (web + PG + batch worker) using the `use-railway` skill.

---

## Cross-links
`architecture.md` · `test-plan.md` · `strategy-metrics-research.md` §4 · `design-dashboard.md` · `feature-contribution-board.md` · `gfm-design-system.md` · `mocks/HANDOFF.md`
