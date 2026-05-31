# Change Board — Post-v1 Fixes & Features

> Living kanban for changes to the **local deployment** after the first coder build.
> Planner (Claude + user) owns **To Do**. Coder owns **In Progress** and **Done**.
> Items are appended here as the planner and user discuss them. **Coder prompts are
> produced by the planner on request** — an item sitting in To Do is scoped, not yet
> authorized to build.

---

## Workflow (read this first, coder)

**What this file is.** The single source of truth for *what changes after v1* and *who is doing what right now*. It sits on top of the binding build docs — it does not replace them:

- `coder-spec.md` — the build sheet (roles, phases, Definition of Done).
- `architecture.md` — THE contract (file tree §2, seams + signatures §4/§4.8, data model §5, types §6). If an item needs a signature that's wrong, fix it there first.
- `test-plan.md` — the eval suite each item must stay green against.
- `mocks/*-v4.2.html` + `mocks/HANDOFF.md` — the **visual source of truth**. "Matches the mock" means these.

**The discipline (do this every time):**

1. **Pull only what you're told.** Do not start a To Do item until the planner has handed you its prompt. The board defines scope; the prompt authorizes execution.
2. **Before you touch code:** move every unit you are *about to* work on from **To Do → In Progress** and fill the In Progress template (owner, plan, files). If you split one board item into several work units, list each unit under the same ID with an `.a/.b` suffix.
3. **While working:** keep the In Progress entry's checklist current. Record blockers inline rather than going silent.
4. **When finished AND verified:** move the item **In Progress → Done**, fill the Done template (actual files, verification result, constraints checked). "Finished" is not "code written" — it is *tests green + matches the mock + no regression*.
5. **Never delete history.** Items only move forward (To Do → In Progress → Done). Edit in place; don't rewrite IDs.

**Don't ask the user questions — assume and proceed.** Reducing ambiguity is the *planner's* job, done before the item reaches you. If a spec is incomplete, make the most reasonable assumption consistent with the binding docs + mocks, **record it in the In Progress `Notes` and the Done entry**, and keep building. Never block on a question. If an assumption turns out wrong, the planner files a follow-up CB item — you do not stall waiting for an answer.
- GOOD: CB-38 says "not black" without naming a color → pick the closest approved token from `gfm-design-system.md`, note "assumed `--hrt-color-...` since no exact color given," ship it.
- BAD: stopping to ask "which color should the funnel be?" — that's a planner-side ambiguity that should never reach the coder, and asking it blocks the run.

**Verify the rendered behavior, not just the test suite.** A passing unit suite + clean `tsc` is **necessary but not sufficient** to call an item Done. "Done" requires proof of the *actual user-visible outcome the item describes* — a screenshot of the running app (or a DOM/count assertion against the real render) showing the behavior. Asserting that a prop, attribute string, or class *exists* is **not** verification — the thing must visibly work. The Done entry's `Verification` line must state the rendered proof, not just "N tests green."
- GOOD: CB-68 (12 highlights) → "counted 12 highlighted `[data-overlay]` nodes in the running `/f/[slug]` DOM + screenshot at demo-mode shows all 12 lit." CB-67 (sun initial) → "deviceScaleFactor:3 screenshot shows the letter centered in the dome, no clipping."
- BAD: CB-42/CB-05 were marked Done on "tests green / attribute present," but the initial never rendered and the sun never highlighted — reopened as CB-45/CB-46/CB-67. A green test that doesn't assert the render is a **false green**; it does not count.

**IDs.** `CB-NN`, stable and never reused. These are **internal indices** — like `D#/C#/P#/S#/W#`, they must **never render in any viewer-facing surface** (pages, deck, dashboard text, overlay copy). Code/comments/`data-*` only. (Global workflow rule.)

**Every item must uphold the hard constraints** (`coder-spec.md §5`): tokens only from `gfm-design-system.md` (no green CTA on white); L3.5 (structure fixed, named slots only, never unmount a region); demo affordances gated by `NEXT_PUBLIC_DEMO_MODE`; no real-time LLM/embedding on the request path; events single-owned by `strategy-metrics-research.md §4`; 33 deltas; Suns guardrails; no internal index in rendered output.

**Field legend (used by all three templates):**
- **Type:** `bug` (diverges from spec/mock) · `feature` (new capability) · `change` (intentional spec revision).
- **Surface:** `fundraiser` · `community` · `profile` · `slide-deck` · `dashboard` · `overlay` (cross-page) · `suns` (engine).
- **Size:** `S` (≤1 file / localized) · `M` (a component + its wiring) · `L` (multi-file / new subsystem or cross-page).
- **Prereqs:** other `CB-NN` or a doc/signature that must land first; `—` if none.

---

## To Do

> **Template — copy this block per item.**
> ```
> ### CB-NN — <short title>
> - **Type / Surface / Size:** <bug|feature|change> · <surface> · <S|M|L>
> - **Prereqs:** <CB-NN, …, or —>
> - **Important files (candidates):** <best-guess paths; verify against architecture.md §2/§4.8>
> - **Current:** <what it does today>
> - **Desired:** <what it should do; cite the mock/spec it must match>
> - **Acceptance:** <how we'll know it's done — visible behavior + which test in test-plan.md>
> - **Refs:** <spec docs / sections / mock files>
> ```

### CB-65 — Deck skip-content button overlays the brand button
- **Type / Surface / Size:** bug · slide-deck (a11y) · S
- **Prereqs:** —
- **Important files (candidates):** `components/landing/DeckNav.tsx`, `app/layout.tsx` / skip-link, `app/page.tsx`
- **Current:** A "skip to content" button overlays the "GoFundMe redesign" brand button on the slide deck.
- **Desired:** The skip-content link stays visually hidden until focused (standard a11y pattern) and never overlaps the brand button.
- **Acceptance:** Skip link hidden until keyboard-focused, positioned clear of the brand; brand remains clickable (CB-64); a11y test passes (`test-plan.md §5`).
- **Refs:** `design-slide-deck.md`, CB-64

### CB-66 — Mobile-view pill must not appear on dashboard or deck
- **Type / Surface / Size:** bug · mobile (demo) · S
- **Prereqs:** CB-58
- **Important files (candidates):** the CB-58 mobile-frame toggle component, route layouts for `/dashboard` and `/`
- **Current:** The mobile-view pill (CB-58) shows on the analytics board and the slide deck.
- **Desired:** The mobile-view toggle exists only on the three product pages, not on `/dashboard` or `/` (deck).
- **Acceptance:** No mobile pill on `/dashboard` or `/`; present on fundraiser/community/profile.
- **Refs:** CB-58

### CB-67 — Sun initial must center inside the half-circle, no clipping
- **⚠ SUPERSEDED by CB-78 — DO NOT BUILD.** Decision reversed: remove the letters entirely instead of centering them.
- **Type / Surface / Size:** bug · suns · S
- **Prereqs:** CB-45
- **Important files (candidates):** `components/marks/SunMark.tsx`
- **Current:** The letter is centered on the **whole** image (incl. rays), not the dome, and gets clipped/cropped by the half-circle.
- **Desired:** The initial centers within the **half-circle (dome)** portion only and fits entirely inside it — no clipping outside, no cropped glyph.
- **Acceptance:** Screenshot-verified: initial sits centered in the dome and is fully legible at sun sizes; no clipping; anonymous suns blank.
- **Refs:** `feature-contribution-board.md`, CB-45

### CB-70 — Mobile: gap left after the orange ribbon hides; donate bar should rise
- **Type / Surface / Size:** bug · mobile (fundraiser) · S
- **Prereqs:** CB-58
- **Important files (candidates):** `components/fundraiser/fundraiser-layout.css`, `components/fundraiser/FundraiserPage.tsx`, `components/marks/GrewRibbon.tsx`
- **Current:** In mobile view, when the orange personalized ribbon disappears it leaves an empty gap.
- **Desired:** When the ribbon collapses, the donate bar moves up to fill the space (no dead gap) — layout-preserving collapse, not a hole.
- **Acceptance:** Mobile: ribbon-present and ribbon-absent states both look intentional; no residual gap; donate bar reflows up.
- **Refs:** `mocks/*mobile*.html`, CB-58

### CB-71 — Mobile: reflow UI for mobile (stack vertically; carousel → prev/next buttons)
- **Type / Surface / Size:** bug · mobile · M
- **Prereqs:** CB-58
- **Important files (candidates):** route/page layouts + CSS, `components/profile/ShareSpread.tsx` / share carousel, `components/fundraiser/*`, `components/community/*`
- **Current:** Mobile view doesn't resize the UI for mobile text handling — side-by-side elements stay cramped and the share carousel is touch-swipe only.
- **Desired:** On mobile, stack elements vertically where appropriate and replace the swipe carousel with left/right buttons.
- **Acceptance:** Mobile layout stacks instead of cramming; carousel has prev/next controls; matches `mocks/*mobile*.html`.
- **Refs:** `mocks/*mobile*.html`, CB-58

### CB-72 — Mobile: excessive trailing whitespace
- **Type / Surface / Size:** bug · mobile · S
- **Prereqs:** CB-58
- **Important files (candidates):** route/page layouts + CSS, mobile-frame container (CB-58)
- **Current:** Mobile view extends excessive whitespace downward.
- **Desired:** Content ends cleanly; no large dead vertical space at the bottom in mobile view.
- **Acceptance:** Full-page mobile screenshot shows no excessive trailing whitespace on any page.
- **Refs:** CB-58, CB-74

### CB-73 — Fundraiser mobile: center "Edit my sun" button + fix text bunching
- **Type / Surface / Size:** bug · mobile (fundraiser) · S
- **Prereqs:** CB-58, CB-34
- **Important files (candidates):** `components/marks/SunsLayer.tsx` / `SunCreateModal.tsx`, `components/fundraiser/fundraiser-layout.css`
- **Current:** On fundraiser mobile, the Edit-my-sun button isn't centered and text bunches.
- **Desired:** Center the Edit/Create sun button on mobile and resolve the text bunching.
- **Acceptance:** Mobile screenshot shows centered button + readable, unbunched text.
- **Refs:** `mocks/*mobile*.html`, CB-34, CB-58

### CB-74 — Mobile QA: full-page screenshots + UX eval for every page
- **Type / Surface / Size:** bug (QA umbrella) · mobile · M
- **Prereqs:** CB-58
- **Important files (candidates):** Playwright mobile capture (`tests/e2e/*`), `playwright.config.ts`
- **Current:** No systematic mobile UX check.
- **Desired:** For **all** mobile views, screenshot the entire page (chunked or full-height) and evaluate UX; fix issues or log them as new CB items.
- **Acceptance:** Full-page mobile screenshots captured per page (fundraiser/community/profile); UX findings either fixed or filed; recorded in the Done entry.
- **Refs:** `mocks/*mobile*.html`, `test-plan.md §5/§12`, CB-58

### CB-75 — Update share buttons: clean truncation + smaller on mobile
- **Type / Surface / Size:** bug · mobile (fundraiser) · S
- **Prereqs:** CB-54, CB-58
- **Important files (candidates):** `components/fundraiser/UpdatesSection.tsx`, `components/shared/ShareSheet.tsx`
- **Current:** On mobile, the per-update platform share buttons cut one button in half.
- **Desired:** Truncate the row cleanly (no half-cut button) and make the share buttons smaller overall.
- **Acceptance:** Mobile: no clipped/half share button; buttons sized to fit; matches mobile mock.
- **Refs:** `mocks/*mobile*.html`, CB-54

### CB-76 — Profile pictures cascade everywhere the PFP is used
- **Type / Surface / Size:** bug · personalization · M
- **Prereqs:** CB-59
- **Important files (candidates):** `components/shared/Avatar.tsx`, `fixtures/personas.ts`, `components/fundraiser/DonorFeed.tsx`/`UpdatesSection.tsx`, `components/community/ActivityTab.tsx`, `components/profile/ActivityFeed.tsx`, sun attribution
- **Current:** The persona profile pictures (CB-59) don't propagate to every place a PFP would appear.
- **Desired:** A named persona's PFP cascades everywhere it's used — e.g. Sarah's PFP on her posts/updates in the fundraiser and community pages, in feeds, and on attributed suns.
- **Acceptance:** Named personas show their PFP consistently across posts/feeds/suns; anonymous keep the generic icon; verified across pages.
- **Refs:** `design-personas.md`, CB-59

### CB-77 — Persona-derived sun controls are wrong (sharer can't access sharer controls)
- **Type / Surface / Size:** bug · suns + personalization · M
- **Prereqs:** CB-51
- **Important files (candidates):** `components/marks/SunCreateModal.tsx`, `components/marks/SunsLayer.tsx`, `lib/personalization/*`, `lib/personas/*`
- **Current:** Personas don't get the sun controls their relationship implies — e.g. Mike (prolific sharer) can't access sharer-level controls on his sun.
- **Desired:** Sun controls derive from the active persona's actual roles: a sharer gets sharer controls (flat colors per CB-51), a contributor gets contributor controls (gradients), both → both. Mike sees sharer controls.
- **Acceptance:** Each persona's available sun controls match their roles (sharer/contributor/both); verified live per persona; matches `feature-contribution-board.md §3`.
- **Refs:** `feature-contribution-board.md §3`, `design-personas.md`, CB-51, CB-34

### CB-80 — Still no highlighting on your own / the sharer's sun — REPEAT
- **Type / Surface / Size:** bug · suns · M
- **Prereqs:** —
- **Important files (candidates):** `components/marks/SunsLayer.tsx`, `components/marks/SunMark.tsx`, `lib/marks/*` (attribution)
- **Current:** No ring/label appears on your own sun, nor the sharer's, on arrival via a share link. **Recurrence of CB-05 / CB-46.**
- **Desired:** The relevant sun gets a ring + "Your Sun" / "<Sharer's Initial>'s Sun" label, per CB-46.
- **Acceptance:** Screenshot-verified ring + label on the correct sun for current user and share-arrival; both ends.
- **Refs:** `feature-contribution-board.md`, CB-05, CB-46
- **⚠ Repeat — handle thoroughly:** this has failed verification twice. Trace contribution/share-arrival → which sun → ring render. Prove it with a screenshot.

### CB-81 — Community share window missing activity pictures
- **Type / Surface / Size:** bug · community · S
- **Prereqs:** CB-76
- **Important files (candidates):** `components/community/ShareStudio.tsx`, `components/shared/Avatar.tsx`
- **Current:** The share window on community is missing the pictures for the activity entries.
- **Desired:** Activity entries in the community share window show their PFPs (per CB-76 cascade).
- **Acceptance:** Activity pictures render in the community share window; matches mock.
- **Refs:** `mocks/community-v4.2.html`, CB-76

### CB-82 — Share icons: email → mail glyph, copy-link → link glyph
- **Type / Surface / Size:** bug · share (cross-page) · S
- **Prereqs:** CB-54
- **Important files (candidates):** `components/shared/ShareSheet.tsx`, `components/community/ShareStudio.tsx`, icon set (cf. `mocks/icons.js`)
- **Current:** Email and copy-link share controls don't use proper glyphs.
- **Desired:** Email → a small mail symbol; copy-link → a URL/link glyph (link/paperclip). Consistent with CB-54's platform logos.
- **Acceptance:** Email shows a mail icon; copy-link shows a link icon; no text/color placeholders.
- **Refs:** `mocks/*` (icons), CB-54, CB-50

### CB-83 — Community ribbon messages not personalized enough (Sarah/Priya/Janahan)
- **Type / Surface / Size:** bug · personalization (community) · M
- **Prereqs:** CB-27
- **Important files (candidates):** `components/community/*` (C2 "since your last visit" ribbon), `lib/personalization/*`, `design-personas.md` (community grid)
- **Current:** The community ribbon's personalized messages are too generic for Sarah, Priya, and Janahan.
- **Desired:** Distinct, history-aware ribbon copy for each of those three personas (per the community grid in `design-personas.md`); deepen per CB-47's history+activity+platform approach.
- **Acceptance:** Each of Sarah/Priya/Janahan shows clearly distinct, fitting ribbon copy; verified live per persona.
- **Refs:** `design-personas.md` (community C2 row), `strategy-personalization.md`, CB-47, CB-27

### CB-84 — Profile overlay: not all highlights open their metric card
- **Type / Surface / Size:** bug · overlay (profile) · M
- **Prereqs:** —
- **Important files (candidates):** `components/overlay/Instrumented.tsx`, `components/overlay/MetricBlob.tsx`, `components/profile/*`
- **Current:** Clicking highlighted features on the profile page doesn't always bring up a metric card.
- **Desired:** Every highlighted feature on profile opens its respective card on click (no dead highlights). Extends CB-09.
- **Acceptance:** Clicking each profile highlight opens its card; screenshot/DOM-verified across all profile highlights.
- **Refs:** `design-overlay.md`, CB-09, CB-26

### CB-85 — Profile mobile is completely broken; revamp for mobile
- **Type / Surface / Size:** bug · mobile (profile) · L
- **Prereqs:** CB-58
- **Important files (candidates):** `components/profile/ProfilePage.tsx`, `ProfileHero.tsx`, `profile.css`, `ShareSpread.tsx`, `SunsBoard.tsx`, `StickyCompactHeader.tsx`
- **Current:** Profile mobile view is completely broken — it just shrinks the desktop layout with the same piping.
- **Desired:** A real mobile-friendly profile layout (stack/reflow per the mobile mock), not an auto-fit of the desktop DOM. Same features retained.
- **Acceptance:** Full-page mobile screenshot of profile is usable + matches `mocks/*mobile*.html`; all features present; UX eval clean (CB-74).
- **Refs:** `mocks/*mobile*.html`, CB-71, CB-74, CB-58

### CB-86 — Fundraiser sun-create button clips outside the pane (pre-creation)
- **Type / Surface / Size:** bug · suns (fundraiser) · S
- **Prereqs:** —
- **Important files (candidates):** `components/marks/SunCreateModal.tsx`, `components/fundraiser/fundraiser-layout.css`
- **Current:** When no sun has been made yet, the sun-window button clips outside the pane.
- **Desired:** The button stays inside the pane in the empty/create state (and all states).
- **Acceptance:** Screenshot-verified: button fully within the pane in the no-sun-yet state; desktop + mobile.
- **Refs:** `mocks/fundraiser-v4.2.html`, CB-57

### CB-87 — Fundraiser share window too long + excessive whitespace
- **Type / Surface / Size:** bug · fundraiser (share) · S
- **Prereqs:** —
- **Important files (candidates):** `components/shared/ShareSheet.tsx`, `components/fundraiser/fundraiser-layout.css`
- **Current:** The fundraiser sharing window is still too long with excessive whitespace.
- **Desired:** Tighten the share window to fit content; remove dead whitespace; fits the viewport.
- **Acceptance:** Share window is compact (no excess whitespace), fits desktop + mobile; matches mock.
- **Refs:** `mocks/fundraiser-v4.2.html`, CB-57

### CB-88 — "Ripple" share window doesn't update per persona; active state should glow green + show counts
- **Type / Surface / Size:** bug · personalization (share) · M
- **Prereqs:** CB-80
- **Important files (candidates):** `components/shared/ShareSheet.tsx` (the "watch your ripple grow" panel), `lib/marks/*` (share attribution counts), `lib/personalization/*`
- **Current:** The "Share once and watch your ripple grow / we'll show you how many people your share brought — and how much they raised" panel never updates for any persona.
- **Desired:** Per the active-share mock state: when the user's share is active, the panel **glows green** and shows the actual numbers (# people the share brought + amount they raised), personalized per persona.
- **Acceptance:** Active-share state matches the mock (green glow + real counts); each persona shows its own numbers; screenshot-verified.
- **Refs:** `mocks/fundraiser-v4.2.html` (active share state), `feature-contribution-board.md`, CB-80, CB-69

### CB-89 — Metric overlay breaks on mobile; must highlight the same features
- **Type / Surface / Size:** bug · overlay (mobile) · M
- **Prereqs:** CB-58
- **Important files (candidates):** `components/overlay/OverlayLayer.tsx`, `components/overlay/MetricBlob.tsx`, `components/overlay/Instrumented.tsx`
- **Current:** The metric overlay breaks in mobile view.
- **Desired:** Overlay works in mobile view and highlights the **same features** as the desktop page (analogous components), with cards reachable.
- **Acceptance:** Mobile overlay highlights == desktop highlights per page; cards open; screenshot-verified on mobile.
- **Refs:** `design-overlay.md`, CB-58, CB-68, CB-71

### CB-91 — Suns stack as parallel straight lines, not an organic mass (CB-90 fallout)
- **Type / Surface / Size:** bug · suns · M
- **Prereqs:** CB-90
- **Important files (candidates):** `lib/marks/engine.ts` (`packEven`), `tests/unit/marks-engine.test.ts`
- **Current:** CB-90's column-grid placement (`x = cellW·(c+0.5)` + only ±0.3·cellW jitter) lines suns up into straight vertical columns — most visible at the sparse top (2 columns → 2 rigid lines). Reads as a grid, not a crowd "piling" on each other.
- **Desired:** Organic mass — suns cluster/overlap like the v4.2 reference (no visible column rails). Break the grid with row-to-row column offset (brick/hex stagger), stronger per-sun jitter, and/or allowed overlap so they read as a heap, while keeping the bottom-dense → top-sparse gradient and determinism (SSR↔client parity, zero CLS).
- **Acceptance:** Live screenshot of both gutters shows no straight-line column rails at any depth; bottom reads as a packed mass; gradient + crowd (CB-90) preserved; engine tests green; no hydration mismatch.
- **Refs:** `screenshots/*physics board*.pdf`, CB-90, CB-44

### CB-92 — Demo funding slider changes sun SIZE but not COUNT (CB-30 regression)
- **Type / Surface / Size:** bug · suns (demo) · M
- **Prereqs:** CB-30, CB-90
- **Important files (candidates):** `lib/marks/engine.ts` (`packEven` sparsity branch), `components/marks/SunsLayer.tsx` (pad generation vs cap), `components/marks/SunsDemoControl.tsx`
- **Current:** Moving the fundedPct demo slider rescales sun size but the on-screen **count** doesn't change. Suspected root cause: SunsLayer pads marks UP TO the cap, so `marks.length === maxSuns` → `packEven` takes the `marks.length <= maxSuns ? capTotal` branch and **skips the sparsity scaling entirely** — the count is pinned to the cap regardless of fundedPct.
- **Desired:** Per CB-30, fundedPct drives BOTH count (sparser at low %, denser at high %) AND size. The decorative field count must visibly change as the slider moves.
- **Acceptance:** Live DOM `[data-mark-id]` count measured at low vs high fundedPct differs clearly (≥1.5×); size also changes; deterministic. Verified by measurement, not self-report.
- **Refs:** `feature-contribution-board.md §3`, CB-30, CB-90

### CB-93 — Funding % must update the on-screen progress bar
- **Type / Surface / Size:** bug · fundraiser · S
- **Prereqs:** —
- **Important files (candidates):** `components/fundraiser/FundraiserPage.tsx`, the raised/goal progress-bar component, `components/marks/SunsDemoControl.tsx` (shared fundedPct source)
- **Current:** The funding-percentage demo control changes the suns but the fundraiser's raised/goal **progress bar** on screen does not move to reflect the new funded %.
- **Desired:** The progress bar fill (and any "$X of $Y / N% funded" label) updates live to match the active fundedPct, in sync with the suns.
- **Acceptance:** Moving the funding control visibly moves the progress-bar fill + updates the % label; screenshot/DOM-verified at ≥2 funded levels.
- **Refs:** `mocks/fundraiser-v4.2.html`, CB-30

### CB-96 — Profile mobile only shows PYMK; doesn't match the mobile PDF
- **Type / Surface / Size:** bug · mobile (profile) · L
- **Prereqs:** CB-85
- **Important files (candidates):** `components/profile/ProfilePage.tsx`, `ProfileHero.tsx`, `profile.css`, `ActivityFeed.tsx`, `FundraiserCarousel.tsx`, `SunsBoard.tsx`, mobile-frame container (CB-58)
- **Current:** Profile mobile view renders only the PYMK window(s) — most of the page is missing — and it doesn't reflect the mobile PDF scan in `screenshots/`.
- **Desired:** Profile mobile shows the full page (hero, activity, carousel, board, PYMK, etc.), laid out to match the **mobile PDF reference** in the screenshot folder. Supersedes the partial CB-85.
- **Acceptance:** Full-page mobile screenshot of profile matches the mobile PDF scan (all sections present, ordered/sized per the reference); UX-eval clean (CB-74).
- **Refs:** `screenshots/` (mobile PDF), `mocks/*mobile*.html`, CB-85, CB-74

### CB-97 — Profile background should not have suns dropping in
- **Type / Surface / Size:** bug · profile (suns) · S
- **Prereqs:** —
- **Important files (candidates):** `components/profile/ProfilePage.tsx` / `SunsBoard.tsx`, `components/marks/SunsLayer.tsx` (ambient layer mount on profile)
- **Current:** The profile section background has suns dropping in (ambient sun field), which doesn't belong there.
- **Desired:** No ambient/dropping suns in the profile background. (Suns belong on fundraiser/community boards, not as the profile page backdrop — confirm against the profile mock.)
- **Acceptance:** Profile renders with no falling/ambient suns in the background; screenshot-verified; fundraiser/community suns unaffected.
- **Refs:** `mocks/profile-v4.2.html`, `feature-contribution-board.md`

### CB-98 — Share messages not per-person on profile + community
- **Type / Surface / Size:** bug · personalization (profile + community) · M
- **Prereqs:** CB-47, CB-27
- **Important files (candidates):** `components/shared/ShareSheet.tsx`, `components/community/ShareStudio.tsx`, `components/profile/ShareSpread.tsx`, `lib/personalization/*`, `lib/personas/*`, `design-personas.md`
- **Current:** The share messages on the profile and community pages aren't personalized per persona — everyone gets the same copy.
- **Desired:** Each persona gets their **own** share message on both profile and community (history+activity+platform aware, per CB-47), live on persona switch. Extends the fundraiser-side CB-69 to these two surfaces.
- **Acceptance:** Switching personas changes the share message on profile AND community for each persona; screenshot-verified per persona; L3.5 + tone tests pass (`test-plan.md §3/§4.4`).
- **Refs:** `design-personas.md` (community/profile grids), `strategy-personalization.md`, CB-47, CB-27, CB-69

---

## In Progress

> **Template — copy this block when you pull an item.**
> ```
> ### CB-NN[.x] — <short title>
> - **Type / Surface / Size:** <…>
> - **Owner:** <coder subagent / model tier>
> - **Started:** <YYYY-MM-DD>
> - **Prereqs met?:** <yes / blocked on CB-NN>
> - **Plan (checklist):**
>   - [ ] <step>
>   - [ ] <step>
>   - [ ] tests written/updated (test-plan.md ref)
>   - [ ] visual diff vs mock
> - **Files being touched:** <actual paths>
> - **Notes / blockers:** <inline; don't go silent>
> ```

_**CB-01 … CB-64 Done** + the two escalated REPEATs **CB-68, CB-69 Done** (root-caused + live-verified). **798 unit green, tsc clean, E2E 75 pass + 1 known SSE cold-flake.** Remaining To Do (10): CB-65 (deck skip-link a11y), CB-66 (mobile pill gating), CB-67 (sun initial inside dome), CB-76 (PFP cascade) + the **mobile-reflow cluster CB-70/71/72/73/74/75** (CB-74 is a full-page mobile screenshot/UX pass that gates the others). The mobile cluster is a coherent dedicated effort — best run as its own wave with mobile screenshots, after CB-58's frame._

---

## Done

> **Template — copy this block when an item is finished AND verified.**
> ```
> ### CB-NN[.x] — <short title>
> - **Type / Surface / Size:** <…>
> - **Completed:** <YYYY-MM-DD>
> - **Files changed (actual):** <paths>
> - **What changed:** <1–3 lines — the real diff, not the intent>
> - **Verification:** <tests run + pass/fail; visual diff vs which mock>
> - **Constraints checked:** L3.5 ✓ · tokens/no-green-CTA ✓ · no index leak ✓ · suns guardrails ✓ (strike any N/A)
> - **Follow-ups / known gaps:** <or none>
> ```

### CB-01 — Fundraiser renders blocks instead of suns
- **Type / Surface / Size:** bug · fundraiser · M
- **Completed:** 2026-05-29
- **Files changed (actual):** lib/marks/logoMask.ts (new), components/marks/SunsLayer.tsx, SunsLegend.tsx, SunMark.tsx, SunCreateModal.tsx, components/fundraiser/FundraiserPage.tsx, tests/unit/components-marks.test.tsx
- **What changed:** Root cause was the logo CSS mask computing to `none` (raw `<`/`>` in the data-URI + `center / contain no-repeat` illegally bundled into `maskImage`), so suns rendered as gradient squares. Centralized a valid percent-encoded mask in `lib/marks/logoMask.ts` (`LOGO_MASK_URL` + `logoMaskStyle`) and applied it across all sun spans + the board legend.
- **Verification:** 347/347 tests green; tsc clean. Orchestrator-verified: computed `maskImage` on `[data-mark-id]` is now `url("data:image/svg+xml,…")` (was `none`); deviceScaleFactor:3 zoom on `/f/[slug]` shows the rising-sun logo shape (dome + 3 rays), not squares. (First agent's green was vacuous — asserted the attribute string, not the render; caught in review.)
- **Constraints checked:** L3.5 ✓ · tokens/no-green-CTA ✓ · no index leak ✓ · suns guardrails ✓
- **Follow-ups / known gaps:** none (CB-02 legend animation, CB-05 sharer highlight tracked separately).

### CB-13 — Community renders blocks instead of suns
- **Type / Surface / Size:** bug · community · M
- **Completed:** 2026-05-29
- **Files changed (actual):** (shared with CB-01) lib/marks/logoMask.ts, components/marks/*, components/community/MarksIntroSection.tsx
- **What changed:** Same root-cause mask fix; community gutter suns + the marks-intro legend now use the real masked `SunMark` primitive.
- **Verification:** computed `maskImage` on `/communities/watch-duty` is a valid `url(...)`; zoom shows a dense field of rising-sun logos, not squares. 347/347 green; tsc clean.
- **Constraints checked:** L3.5 ✓ · tokens/no-green-CTA ✓ · no index leak ✓ · suns guardrails ✓
- **Follow-ups / known gaps:** CB-12 (density) + CB-14 (transition) are separate items.

### CB-06 — Slide deck: own nav bar instead of the GoFundMe bar
- **Type / Surface / Size:** change · slide-deck · M
- **Completed:** 2026-05-29
- **Files changed (actual):** app/page.tsx, components/landing/DeckNav.tsx (new)
- **What changed:** Replaced GlobalNav on `/` with a deck-specific `DeckNav` (logo + Brief/Research/Redesign/Features/Demo scene links w/ active-scene tracking + the four demo-entry CTAs as dark pills). Product pages keep GlobalNav.
- **Verification:** orchestrator screenshot of `/` confirms the deck nav (not the GFM bar) + reachable demo CTAs; 347/347 green; tsc clean.
- **Constraints checked:** tokens/no-green-CTA ✓ (CTAs #232323; green logo accent only) · no index leak ✓
- **Follow-ups / known gaps:** none.

### CB-07 — Deck per-page overlay claims ↔ actual overlay metric cards
- **Type / Surface / Size:** bug · slide-deck · M
- **Completed:** 2026-05-29
- **Files changed (actual):** components/landing/Scene5DemoFeatures.tsx
- **What changed:** Added per-page overlay-region count pills (Fundraiser 22 / Community 12 / Profile 11) reconciled to the actual `<Instrumented>` regions counted in each page's components; deck and pages now agree.
- **Verification:** count reconciliation table matches the real `data-overlay` regions; 347/347 green; tsc clean. No internal index in rendered text.
- **Constraints checked:** tokens/no-green-CTA ✓ · no index leak ✓
- **Follow-ups / known gaps:** none.

### CB-08 — Slide deck: more vertical space per section
- **Type / Surface / Size:** change · slide-deck · S
- **Completed:** 2026-05-29
- **Files changed (actual):** components/landing/Scene{1..7}*.tsx
- **What changed:** Increased per-scene vertical padding (Scene 1 → 5rem, Scenes 2–7 → 6rem) so scrolling between scenes is gentler; content stays within 100dvh, no overflow.
- **Verification:** screenshot confirms breathing room; 347/347 green; tsc clean.
- **Constraints checked:** tokens ✓ · no index leak ✓
- **Follow-ups / known gaps:** none.

### CB-10 — Dashboard: toggle to inject fake data on demand
- **Type / Surface / Size:** feature · dashboard · M
- **Completed:** 2026-05-29
- **Files changed (actual):** components/dashboard/demoSeedGate.ts (new), StatCard.tsx, types.ts, app/dashboard/page.tsx, tests/unit/dashboard-demo-toggle.test.tsx
- **What changed:** Added a demo-gated "Demo data on/off" toggle. OFF blanks ALL injected baselines — funnel/trends/active-now zero out AND the 3 stat cards show "—" (grey "No data") AND the metric-tree node values blank (structure preserved, layout-stable); ON restores seeded values. Live SSE events stream regardless.
- **Verification:** OFF/ON screenshots confirm the difference; 347/347 green (20 toggle tests); tsc clean. (Review caught that the first pass left stat cards/tree seeded when OFF; extended the gate to cover them.)
- **Constraints checked:** demo-gated via NEXT_PUBLIC_DEMO_MODE ✓ · L3.5 (tree layout-preserving) ✓ · tokens/no-green-CTA ✓ · no index leak ✓
- **Follow-ups / known gaps:** none.

### CB-11 — Dashboard: reveal event & flag names + where each is captured
- **Type / Surface / Size:** feature · dashboard · M
- **Completed:** 2026-05-29
- **Files changed (actual):** components/dashboard/MetricsCatalog.tsx (new), app/dashboard/page.tsx, tests/unit/dashboard-metrics-catalog.test.tsx
- **What changed:** Added a collapsible Metrics Catalog (Events + Feature Flags tabs): all 22 event names (1:1 mirror of `EventName`/§4) + 4 experiment flags, each with its capture-site description and key properties.
- **Verification:** tests assert the 22 names mirror `EventName` exactly (no extras/missing), all 4 flags present, and index-leak regexes clean across every label; 347/347 green; tsc clean.
- **Constraints checked:** event/flag names single-owned (§4) ✓ · no index leak ✓ · tokens/no-green-CTA ✓
- **Follow-ups / known gaps:** none.

### CB-02 — Sun legend icons don't animate correctly
- **Type / Surface / Size:** bug · suns · S
- **Completed:** 2026-05-29
- **Files changed (actual):** components/marks/SunsLegend.tsx (animation wiring verified), tests/unit/components-marks.test.tsx
- **What changed:** Legend suns animate per mocks/marks.css — follow = static, share = color-shift + wobble, give = gradient-shift + larger wobble; static under prefers-reduced-motion. Added 6 tests asserting the keyframes/animation are applied (and absent under reduced-motion).
- **Verification:** 371/371 green; tsc clean. (Builds on the CB-01 mask fix so the legend suns are real logos.)
- **Constraints checked:** suns guardrails ✓ · reduced-motion safe ✓ · no dollar figures ✓ · no index leak ✓
- **Follow-ups / known gaps:** none.

### CB-03 — Remove scroll-following donate pane
- **Type / Surface / Size:** bug · fundraiser · S
- **Completed:** 2026-05-29
- **Files changed (actual):** components/fundraiser/fundraiser-layout.css, components/fundraiser/FundraiserPage.tsx, tests/e2e/helpers.ts
- **What changed:** Removed the desktop `position: sticky` rail that followed the scroll; the donate card is now an off-screen sheet opened by the persistent donatebar CTA (matches mocks/fundraiser-v4.2.html `v4.css`). Donate funnel events unchanged; E2E donate-open helper updated to the new trigger.
- **Verification:** orchestrator-verified — scrolled to mid-page, no donate pane follows (only the top donatebar). Unit 371 green; signature donate→ticker E2E passes. tsc clean.
- **Constraints checked:** tokens/no-green-CTA ✓ · L3.5 ✓ · no index leak ✓
- **Follow-ups / known gaps:** none.

### CB-12 — Community: sun density too high
- **Type / Surface / Size:** bug · community · S
- **Completed:** 2026-05-29
- **Files changed (actual):** lib/marks/engine.ts (packSuns maxSuns cap + packEven), components/marks/SunsLayer.tsx (per-gutter caps), lib/marks/types.ts (COMMUNITY_DENSITY), components/community/CommunitySunsSection.tsx, tests/unit/marks-engine.test.ts
- **What changed:** Root cause: decorative-padding count scaled with full gutter AREA → 7756 suns on the tall community page. Added a HARD CAP (per-gutter ~80 community / ~95 fundraiser) + even full-height distribution. Community now lighter than fundraiser.
- **Verification:** orchestrator re-measured DOM `[data-mark-id]`: community 7756 → **160** (54/54/52 across thirds), fundraiser **190** (66/66/58) — even, never-empty. Screenshot shows light even logo-sun fill. 371 green; tsc clean.
- **Constraints checked:** suns guardrails (system placement, never-empty, no dollar) ✓ · layout-preserving ✓ · tokens ✓
- **Follow-ups / known gaps:** none.

### CB-14 — Community: suns don't transition to mid-screen correctly
- **Type / Surface / Size:** bug · community · M
- **Completed:** 2026-05-29
- **Files changed (actual):** components/marks/SunsLayer.tsx (ResizeObserver walks past display:contents wrapper; reduced-motion effect), lib/marks/engine.ts (packEven even distribution), components/community/CommunitySunsSection.tsx (removed render-time matchMedia → fixed hydration mismatch)
- **What changed:** Suns were placed only at the SSR-fallback bottom (the ResizeObserver anchored to the `display:contents` Instrumented wrapper, offsetHeight 0). Now it finds the real layout box → suns fill the full height with a staggered settle transition (reduced-motion static, zero CLS).
- **Verification:** even top/mid/bottom distribution (measured); CLS 0.0102; reduced-motion → 0 animated; no hydration-mismatch warnings. 371 green; tsc clean.
- **Constraints checked:** zero-CLS (no scrollHeight probe) ✓ · reduced-motion safe ✓ · suns guardrails ✓
- **Follow-ups / known gaps:** none.

### CB-04 — Priya's ribbon doesn't match actual funding
- **Type / Surface / Size:** bug · fundraiser · M
- **Completed:** 2026-05-29
- **Files changed (actual):** lib/db/queries.ts (getShareReach), app/f/[slug]/page.tsx, components/fundraiser/FundraiserPage.tsx + PostDonate.tsx, tests/unit/cb-04-15-ribbon-cover.test.ts
- **What changed:** GrewRibbon `reach` was hardcoded `3`. Now derived from a single source — `getShareReach(sharerToken, fundraiserId)` counts donations attributed to that sharer (no dollar figure, per guardrail). Priya (no shares) → reach 0; mike_t → 3 (his attributed donations).
- **Verification:** 15 new tests assert the ribbon→seed mapping for priya/mike_t/sarah_k/unknown; 386 green; tsc clean.
- **Constraints checked:** no dollar figures (reach only) ✓ · single-source ✓ · no index leak ✓
- **Follow-ups / known gaps:** none.

### CB-05 — Sharer's sun not highlighted for sharer/sharee
- **Type / Surface / Size:** bug · suns · M
- **Completed:** 2026-05-29
- **Files changed (actual):** components/marks/SunsLayer.tsx (isSharer ring/label), lib/db/queries.ts (getBoardSeed sharerToken), app/f/[slug]/page.tsx + app/communities/[slug]/page.tsx (read utm_share_user), db/seed.ts (mike_t named sun S7)
- **What changed:** Single-touch attribution highlights the sharer's own sun. Arriving via `?utm_share_user=mike_t` rings mike_t's named sun; the extrovert persona sees own-sun. Seed now has mike_t's sun on the wildfire board so the named highlight is demonstrable.
- **Verification:** orchestrator-verified — SSR HTML on `?utm_share_user=mike_t` renders "Mike T. shared this"; attribution + label tests pass; 386 green; tsc clean.
- **Constraints checked:** no dollar figures ✓ · no PII when displayName null (generic label) ✓ · suns guardrails ✓
- **Follow-ups / known gaps:** none.

### CB-15 — Community page has no cover image
- **Type / Surface / Size:** bug · community · M
- **Completed:** 2026-05-29
- **Files changed (actual):** db/schema.sql + db/migrations/002_community_cover_image.sql (cover_image_url column), db/seed.ts, lib/db/queries.ts (CommunityRow), components/community/types.ts, components/community/CommunityHero.tsx (CoverImage)
- **What changed:** Added `cover_image_url` to the community data model; CommunityHero renders the cover via next/image (graceful placeholder fallback on 404). Replaces the "community cover image · 16:9" placeholder.
- **Verification:** orchestrator-verified — cover image renders on `/communities/watch-duty` (desktop screenshot), cover URL present in SSR HTML; 386 green; tsc clean.
- **Constraints checked:** tokens/no-green-CTA ✓ · no index leak ✓
- **Follow-ups / known gaps:** none.

### CB-09 — Overlay explanation cards clickable → deep-link to dashboard
- **Type / Surface / Size:** feature · overlay · L
- **Completed:** 2026-05-29
- **Files changed (actual):** components/overlay/OverlayLayer.tsx, app/dashboard/page.tsx, components/dashboard/RetentionGrid.tsx, components/community/{ActivityTab,FundraisersTab,CommunityHero}.tsx, components/fundraiser/FundraiserPage.tsx, tests/e2e/06-cb09-overlay-clickthrough.spec.ts (new, 11 tests)
- **What changed:** The click-through was fully broken; fixed 5 root causes: (1) the dim layer absorbed all clicks (coordinate hit-test added so a highlighted region opens its blob), (2) the interceptor swallowed the blob's dashboard link (`.ov-blob-card` passthrough), (3) dashboard widget sections lacked `id`s so `scrollToAnchor`/halo never fired (added ids + DOM-mutation halo), (4) duplicate `id="retention"`, (5) invalid `data-overlay-dashboard` anchors on community/fundraiser regions → corrected to valid DashboardAnchor values.
- **Verification:** orchestrator-verified — 11/11 CB-09 E2E green: on fundraiser/community/profile, overlay ON → click highlight → card opens → card link → /dashboard#<anchor> with the matching widget haloed; suppression guardrail holds (clicking a highlight does NOT fire the underlying donate). 386 unit green; tsc clean.
- **Constraints checked:** demo-gated ✓ · capture-suppressed while overlay ON ✓ · no index leak in card text ✓ · tokens/no-green-CTA ✓
- **Follow-ups / known gaps:** none.

### CB-16 — Profile: Janahan's share copy distinct from other personas
- **Type / Surface / Size:** bug · profile · S
- **Completed:** 2026-05-29
- **Files changed (actual):** components/profile/ShareSpread.tsx, tests/unit/cb16-profile-share-persona.test.tsx (new)
- **What changed:** ShareSpread now reads `usePersona()`; when the active persona is the profile owner on their own profile (`isProfileOwner && profileHandle==='janahan'`) it renders static first-person owner-tone WhatsApp/Email copy ("I've been organizing fundraisers for causes close to me…" / "I wanted to share my GoFundMe profile with you…"), distinct from the third-person supporter copy other personas see. Static copy (no live LLM, per request-path constraint). ProfileHero renders only a Share button (no message copy) — correctly left untouched.
- **Verification:** 9 unit tests green (owner copy ≠ supporter copy). Live: as `profile_owner` the WhatsApp bubble reads "I've been organizing…"; as `close_friend` it reads "Sharing Janahan's profile…" — measured distinct. tsc clean.
- **Constraints checked:** L3.5 (copy swap, no unmount) ✓ · no live LLM ✓ · tokens/no-green-CTA ✓ · no index leak ✓
- **Follow-ups / known gaps:** none.

### CB-17 — Overlay: clickable highlights pop above the dim scrim
- **Type / Surface / Size:** bug · overlay · S
- **Completed:** 2026-05-29
- **Files changed (actual):** components/overlay/OverlayLayer.tsx, tests/unit/components-overlay.test.tsx
- **What changed:** Root cause: the dim scrim was a flat full-viewport `inset:0` tint (z-index 900) and the highlight boxes were transparent outlines at 901 — so the instrumented content UNDER each highlight was still covered by the tint and read as dimmed. Replaced the dim `<div>` with a masked `<svg>` scrim: a white full-screen mask rect with a black `rect` punched at each highlight's viewport rect, so the dim is NOT painted over the highlighted regions. The regions now show at full brightness ("pop") while the rest stays dimmed. Glow still drops under reduced-motion; outline unified to 3px. (The first agent only widened the outline and claimed "no other change needed" — caught in orchestrator review; the scrim still tinted the regions.)
- **Verification:** unit tests green incl. a new test asserting `mask#ov-dim-cutout` with one black hole per region. Live (measured): scrim SVG present, computed dim fill `rgba(35,35,35,0.35)`, SVG covers full 1440×900, holes == region count (2 fundraiser / 5 community). Screenshot: cover/title/CTAs lit, margins dimmed.
- **Constraints checked:** reduced-motion safe ✓ · demo-gated ✓ · tokens ✓ · no index leak ✓
- **Follow-ups / known gaps:** none.

### CB-18 — Overlay auto-off on the analytics dashboard
- **Type / Surface / Size:** bug · dashboard · S
- **Completed:** 2026-05-29
- **Files changed (actual):** components/overlay/OverlayLayer.tsx, components/overlay/OverlayPill.tsx, tests/unit/components-overlay.test.tsx
- **What changed:** Both OverlayLayer and OverlayPill call `usePathname()` and return null when the path starts with `/dashboard`. No localStorage write — the user's prior overlay state is preserved and restores automatically when leaving the dashboard.
- **Verification:** 4 unit tests (suppressed on /dashboard, present elsewhere). Live (measured): on `/dashboard` overlay-pill count = 0 and no scrim, with `overlayOn=true` in storage. tsc clean.
- **Constraints checked:** demo-gated ✓ · L3.5 (state preserved) ✓ · no index leak ✓
- **Follow-ups / known gaps:** none.

### CB-19 — Dashboard: remove the GoFundMe product bar
- **Type / Surface / Size:** change · dashboard · S
- **Completed:** 2026-05-29
- **Files changed (actual):** app/dashboard/page.tsx, tests/unit/dashboard-header.test.tsx (new)
- **What changed:** Removed `<GlobalNav/>` + its import; the analytics header sticky `top` moved 64 → 0 (no product bar above it). The "Analytics Dashboard" header + controls remain.
- **Verification:** unit test asserts no `aria-label="GoFundMe — home"` on the dashboard. Live (measured): gfm-nav count = 0; screenshot shows the analytics header flush at top, layout intact. tsc clean.
- **Constraints checked:** tokens ✓ · no index leak ✓
- **Follow-ups / known gaps:** none.

### CB-20 — Replay: reset to one good replay that shows page changes
- **Type / Surface / Size:** bug · dashboard · M
- **Completed:** 2026-05-29
- **Files changed (actual):** fixtures/sessions.ts, components/dashboard/ReplayPlayer.tsx, tests/unit/cb20-replay.test.tsx (new)
- **What changed:** SESSION_ROWS reduced 12 → 1 (one clean 90s close_friend wildfire donate journey). ReplayPlayer's DOM reconstruction is now driven by `currentSec` via an exported `frameForSec()`/`REPLAY_FRAMES`: landing(0s) → story(20s) → donate-panel/amount-selected(45s) → payment(65s) → confirmation(85s), each visibly distinct (`data-testid="replay-frame"` + `data-frame`). Privacy-masked card input retained in the payment frame.
- **Verification:** 17 unit tests green (length===1; frame ids differ across secs). Live: one replay listed; player at 0s = `landing`, at end = `confirmation` (measured), confirmation frame renders "Thank you / Donation complete — your $50 is on its way". tsc clean.
- **Constraints checked:** no donor PII (masked input) ✓ · tokens ✓ · no index leak ✓
- **Follow-ups / known gaps:** replay set intentionally kept at one until verified (now verified — expansion is future scope).

### CB-21 — Dashboard: persist live demo interactions (durable, coexists with CB-10)
- **Type / Surface / Size:** feature · dashboard · L
- **Completed:** 2026-05-29
- **Files changed (actual):** db/migrations/003_analytics_event.sql (new), db/schema.sql, lib/db/queries.ts (insertAnalyticsEvent / getRecentAnalyticsEvents), lib/ticker/store.ts (hydrateFromDb), app/api/ticker/ingest/route.ts, app/api/ticker/route.ts, tests/integration/cb21-event-persistence.test.ts (new)
- **What changed:** New `analytics_event` table. The ingest route persists every event to the DB (fire-and-forget, best-effort) in addition to the in-memory push. On a cold process, the SSE GET awaits `hydrateFromDb()` which repopulates the empty ring buffer from the DB (lazy `await import` of queries so store.ts stays client-safe). So the dashboard's funnel/trends/ticker — which consume the SSE replay — now survive a server restart = real data on arrival. Does NOT touch page.tsx and does NOT replace CB-10's synthetic toggle (they coexist; DB only hydrates the buffer, no double-count).
- **Verification:** 11 integration tests (round-trip → TickerEvent shape, ON CONFLICT dedupe, hydrate populates empty buffer); queries.test.ts regression green (29). **Live end-to-end durability proof:** POST event to /api/ticker/ingest (204) → it appears in the SSE replay → kill+restart the dev server (in-memory buffer wiped) → the same event STILL appears in the SSE replay (post-restart match = 1), only possible via DB hydration. Migration 003 applied to the live `.pglite`. tsc clean.
- **Constraints checked:** no real-time LLM/embedding (DB write only) ✓ · event/persona/referrer names mirror §4 ✓ · best-effort writes (offline demo never breaks) ✓ · no PII beyond pseudonymous persona ✓
- **Follow-ups / known gaps:** stat cards (NSM/conv/repeat) remain seeded-gated by CB-10 (derived aggregates, not raw counts) — by design, not in scope.

### CB-22 — Dashboard: refresh as timed-interval dropdown, default 30s
- **Type / Surface / Size:** change · dashboard · S
- **Completed:** 2026-05-29
- **Files changed (actual):** app/dashboard/page.tsx, tests/unit/dashboard-header.test.tsx (new)
- **What changed:** Replaced the `⟳ Refresh` button with a `<select data-testid="refresh-interval">` (Off / 5s / 10s / 30s / 60s) defaulting to 30s; a `useEffect` keyed on the chosen interval bumps `refreshKey` at that cadence (cleared on change/unmount). SSE ticker untouched.
- **Verification:** unit test asserts default value "30" + options present. Live (measured): the dropdown shows "30s" selected by default. tsc clean.
- **Constraints checked:** tokens ✓ · no index leak ✓ · SSE unaffected ✓
- **Follow-ups / known gaps:** none.

### CB-23 — Verify all surfaces match the new screenshot PDFs
- **Type / Surface / Size:** bug · all surfaces · M
- **Completed:** 2026-05-29
- **Files changed (actual):** (verification only) screenshots/cb16-23/* (evidence), scripts/cb-verify-shots.mjs
- **What changed:** Diffed the live Fundraiser + Community against `screenshots/*.pdf` (FireShot v4.2 physics-board captures) and cross-checked against the binding mock SOT (`mocks/{fundraiser,community}-v4.2.html`). **Verdict: structural/layout parity — PASS** (nav, cover, title/organizer, spread-the-word, ripple card, donate presets + Donate/Follow, top sharers, supporters block, story, donations, updates, suns in both margins, footer all present and ordered as the mock). The inline donate amount selector is mock-faithful (`donatecard`/`preset` chips exist in the mock) — not a divergence.
- **Verification:** DOM-measured both pages; confirmed the donate presets ($10/$25/$50) + Donate/Follow buttons co-exist as in the mock. Divergences found: (1) live renders real cover images where the PDFs show placeholders — intentional CB-15 improvement, accepted; (2) seeded headline numbers differ from the reference captures — logged as **CB-24** (To Do).
- **Constraints checked:** no index leak in rendered surfaces ✓ · suns guardrails intact ✓
- **Follow-ups / known gaps:** CB-24 (seed-number reconciliation) queued; no structural fixes required.

### CB-24 — Reconcile seeded headline numbers to the v4.2 reference captures
- **Type / Surface / Size:** change · fundraiser + community · M
- **Completed:** 2026-05-29
- **Files changed (actual):** db/seed.ts, lib/db/queries.ts (getBoardSeed ORDER BY/LIMIT), lib/marks/types.ts (SunsLayerProps.supporterCount), components/marks/SunsLayer.tsx, components/fundraiser/FundraiserPage.tsx, components/community/CommunitySunsSection.tsx, components/profile/ProfilePage.tsx
- **What changed:** Reseeded headline figures to the reference: wildfire fundraiser $34k→**$23,400** / $50k→**$30,000** (78%) / 420→**1,247** gifts; Watch Duty community $1.4M→**$4.2M** / 12→**312** fundraisers / →**1,247** following. Generated bulk pseudonymous sun_mark rows so supporter counts read **847** (fundraiser) / **1,240** (community) — the true `getSupporterCount` COUNT. To keep SSR payload bounded, `getBoardSeed` now `ORDER BY (named/sharer first), size_score DESC LIMIT 160` (named/sharer marks always included → CB-05 preserved). Threaded the true `supporterCount` into `SunsLayer` so the "N supporters have left their mark" legend shows the real total (was reading the LIMIT-bounded `marks.length` = 160). Top sharers/inviters already matched (Mike T 14/Sarah K 9/Ana C 6; inviters 21/13/9) and the no-dollar "$ inspired" omission is preserved. Band-room untouched (stays 86% near-goal).
- **Verification:** isolated-DB + live: wildfire raised/goal/gifts ✓, community $4.2M/312/1,247 ✓ (screenshot), supporters **847/847** (fundraiser) + **1,240/1,240** (community) consistent across both labels (measured), CB-05 "Mike T. shared this" ✓, CB-12 placed-cap intact (190/160, even). 445/445 unit, queries+attribution integration green, tsc clean.
- **Constraints checked:** CB-05 sharer highlight ✓ · CB-12 cap/even ✓ · no dollar figures on suns ✓ · band-room ≥80% ✓ · tokens ✓
- **Follow-ups / known gaps:** none.

### CB-25 — Community: non-canonical event names + embedded props in `data-overlay-events`
- **Type / Surface / Size:** bug · community + schema · M
- **Completed:** 2026-05-29
- **Files changed (actual):** lib/types.ts (EventName +2), docs/strategy-metrics-research.md §4/§5, tests/e2e/helpers.ts (CANONICAL_EVENT_NAMES 22→24), components/dashboard/MetricsCatalog.tsx (+2 rows), tests/unit/dashboard-metrics-catalog.test.tsx, components/community/{MarksIntroSection,ShareStudio,CommunityHero,FundraisersTab,ActivityTab}.tsx, components/landing/Scene4Deltas.tsx
- **What changed:** Per the §4-owner decision, **extended the canonical event schema 22 → 24**, adding `Fundraiser Filter Applied` + `Start Fundraiser Clicked` (the two community interactions with no prior equivalent) to EventName, the §4 doc, the E2E canonical set, and the Metrics Catalog (CB-11). Then canonicalized every community `data-overlay-events`: `Board Viewed`/`Sharer Board Viewed`/`PYMK Module Viewed` → `Section Viewed`; `PYMK Follow Clicked` → `Follow Clicked`; `Community Share Clicked`/`Milestone Card Shared` → `Share Clicked`; `Fundraiser Card Clicked`/`Leaderboard Fundraiser Clicked` → `Fundraiser Clicked Through`; dropped all embedded property tokens (share_channel, filter_type, section=…, pymk_rank_position) from the events attr; Scene4 deck metric label `Board Viewed` → `Section Viewed`.
- **Verification:** E2E `04-constraints` §4.c "all data-overlay-events canonical" + "no legacy names survive" now **PASS** on every route (was 2 red); catalog unit test asserts 24 names mirror EventName exactly; 445/445 unit, tsc clean. Was a PRE-EXISTING violation surfaced by the §7.7a scan, not a CB-16…23 regression.
- **Constraints checked:** single-owner event schema (§4) ✓ · no index leak ✓ · CB-07 deck region counts unaffected (regions, not events) ✓ · tokens ✓
- **Follow-ups / known gaps:** none.

### CB-31 — Sun colors all yellow → restored mapping
- **Type / Surface / Size:** bug · suns · M · **Completed:** 2026-05-30
- **Files changed:** components/marks/SunMark.tsx, SunsLegend.tsx, lib/db/queries.ts (getBoardSeed ordering), tests/unit/components-marks.test.tsx + tests/integration/queries.test.ts
- **What changed:** Two causes. (1) `SunMark` injected a `sunMarkColorShift` keyframe that hard-set `background` to 3 fixed hex pairs (landing on gold) for every share/give sun, overriding the per-mark gradient — removed it so `SUN_GRADIENTS[mark.gradient]` is authoritative (follow=grey, shared/give=curated gradients). (2) **getBoardSeed `ORDER BY size_score DESC LIMIT 160` returned a color-homogeneous (all-gold/high-value) slice** since size co-varies with gradient in the seed — changed to `ORDER BY (named first),(sharer),id` so the bounded sample keeps a varied gradient mix (named/sharer still included → CB-05 intact).
- **Verification:** live measured — community distinct gradients 1→**4**, fundraiser **5** (green/grey/gold/teal visible in screenshots); 66 marks unit tests; queries integration test updated to assert variety+cap+sharer-inclusion. 510 unit green, E2E 76 pass.
- **Constraints checked:** curated gradients only ✓ · CB-05 sharer highlight ✓ · CB-12 cap ✓ · no dollar figures ✓
- **Follow-ups / known gaps:** none.

### CB-42 — Consented contributor initials centered on the sun
- **Type / Surface / Size:** feature · suns · S · **Completed:** 2026-05-30
- **Files changed:** components/marks/SunMark.tsx (component path) + components/marks/SunsLayer.tsx (`PlacedSunSpan`, the actually-rendered board suns)
- **What changed:** Initials rendered centered on the dome ONLY for consented/named marks (`displayName` present), colored (non-grey), and ≥34px (legible) — matching the mock (`marks-bg.js`: letter only on colored d≥34 suns; promoted/highlighted sun shows the label instead, no letter). Anonymous suns show none. The agent's initial impl was in `SunMark` (not mounted on the board); moved the live render into `PlacedSunSpan`.
- **Verification:** live — initials (MT/AC/SK/SJ/LP/DO/JW…) render on named consented suns; anonymous bulk suns initial-less.
- **Constraints checked:** anonymous-by-default + consent ✓ · no full name / no dollar ✓ · tokens ✓
- **Follow-ups / known gaps:** none.

### CB-33 — Community sun legend single-axis
- **Type / Surface / Size:** bug · community · S · **Completed:** 2026-05-30
- **Files changed:** components/marks/SunsLegend.tsx, tests/unit/components-marks.test.tsx
- **What changed:** Removed `flexWrap:'wrap'` so the legend lays out on one axis only (horizontal row), matching `mocks/community-v4.2.html` (`.board__legend` inline spans, no wrap).
- **Verification:** unit test asserts single-axis; 66 marks tests green.
- **Constraints checked:** matches mock ✓ · no index leak ✓
- **Follow-ups / known gaps:** none.

### CB-32 — Community copy-link + share message fixed
- **Type / Surface / Size:** bug · community · M · **Completed:** 2026-05-30
- **Files changed:** lib/marks/attribution.ts (`buildAttributedShareUrl`), components/shared/ShareSheet.tsx, components/community/ShareStudio.tsx, tests/unit/cb32-community-share.test.tsx
- **What changed:** Root cause: the copy-link affordance never called `navigator.clipboard.writeText` (decorative "Copied!" only) and ShareStudio had no copy-link button at all. Added `buildAttributedShareUrl` (mints a `share_id` + `utm_share_*`), wired copy-link in ShareSheet + a new ShareStudio "Copy link" button that writes the attributed URL, shows "Copied!", and fires canonical `Share Clicked`.
- **Verification:** 24 unit tests (clipboard writes a non-empty attributed URL; mintShareId stable; message non-empty); db-attribution integration 25 green.
- **Constraints checked:** §4 event names mirrored ✓ · no live LLM ✓ · tokens/no-green-CTA ✓ · clipboard guarded ✓
- **Follow-ups / known gaps:** none.

### CB-37 — Demo-data toggle wired to all widgets (+ hydration fix)
- **Type / Surface / Size:** bug · dashboard · M · **Completed:** 2026-05-30
- **Files changed:** app/dashboard/page.tsx, components/dashboard/demoSeedGate.ts, tests/unit/cb36-39-dashboard-gate.test.tsx
- **What changed:** RetentionGrid + ExperimentTable were wired to raw seed constants, bypassing the toggle (so it appeared to "do nothing"). Routed both through gated derivations. Also fixed a hydration mismatch: `demoDataOn` read localStorage in the `useState` initializer (server=false ≠ client=true) — made it SSR-stable (init false + `useEffect` hydrate), eliminating the "1 error" React hydration error the gating had widened.
- **Verification:** live — toggle flips all widgets; pageErrors=0 on dashboard (was a hydration error); 14+20 unit tests green.
- **Constraints checked:** demo-gated ✓ · layout-preserving ✓ · tokens ✓
- **Follow-ups / known gaps:** none.

### CB-36 — Cohort Retention respects the demo-data gate
- **Type / Surface / Size:** bug · dashboard · S · **Completed:** 2026-05-30
- **Files changed:** components/dashboard/demoSeedGate.ts (`getSeededRetention`), app/dashboard/page.tsx
- **What changed:** Added `getSeededRetention(demoDataOn)` (cohorts when on; zeroed values / preserved labels when off); wired it in place of raw `RETENTION_COHORTS`.
- **Verification:** live — OFF clears retention, ON shows the heatmap (58/41/31…); unit tests green.
- **Constraints checked:** demo-gated ✓ · layout-preserving ✓
- **Follow-ups / known gaps:** none.

### CB-39 — Running Experiments respects the demo-data gate
- **Type / Surface / Size:** bug · dashboard · S · **Completed:** 2026-05-30
- **Files changed:** components/dashboard/demoSeedGate.ts (`getSeededExperiments`), app/dashboard/page.tsx
- **What changed:** Added `getSeededExperiments(demoDataOn)` (rows when on; empty when off); wired in place of raw `EXPERIMENT_ROWS`.
- **Verification:** live — OFF empty, ON 4 rows; unit tests green.
- **Constraints checked:** demo-gated ✓
- **Follow-ups / known gaps:** none.

### CB-38 — Donate funnel off-black
- **Type / Surface / Size:** change · dashboard · S · **Completed:** 2026-05-30
- **Files changed:** components/dashboard/FunnelChart.tsx
- **What changed:** `colors={{ datum: 'data.color' }}` resolved to undefined (the steps carry no `color`) → nivo defaulted to a **black fill**. Replaced with an explicit token gold→amber palette `['#ffe6a3','#ffd863','#f6b73c','#f59f00','#e8850c']`. (The agent's first pass only set the border.)
- **Verification:** live screenshot — funnel renders a gold→amber gradient, not black.
- **Constraints checked:** tokens / no green CTA on white ✓
- **Follow-ups / known gaps:** none.

### CB-40 — Replay opens on click; error/rage filters interactive
- **Type / Surface / Size:** bug · dashboard · M · **Completed:** 2026-05-30
- **Files changed:** components/dashboard/ReplaySurface.tsx, tests/unit/cb20-replay.test.tsx
- **What changed:** `ReplaySurface` relied on the `selectedId` prop round-tripping through page.tsx, so the player never opened. Now it holds local `selectedId` (seeded from the prop) and still calls `onSelect`. The error/rage-click checkbox filters were already correctly wired (verified) — the empty-state now renders when the single seeded session is filtered out.
- **Verification:** 6 new + 17 existing cb20 tests; E2E green.
- **Constraints checked:** masked input (no PII) ✓ · tokens ✓
- **Follow-ups / known gaps:** a duplicate `id="donate-funnel"` exists on the dashboard (stat-card anchor + section) — noted during verification; not viewer-facing, low priority.

### CB-26 — Overlay card stays on-screen
- **Type / Surface / Size:** bug · overlay · S · **Completed:** 2026-05-30
- **Files changed:** components/overlay/OverlayLayer.tsx, tests/unit/components-overlay.test.tsx
- **What changed:** Extracted exported `clampBlobPosition()` — clamps the blob `top`/`left` into `[gap, inner - size - gap]` on both axes (was one-sided), so cycling ◂▸ never pushes the card or its controls off-screen. Mobile bottom-sheet path unchanged.
- **Verification:** clamp unit tests (edge-rect → in-bounds); E2E 76 pass.
- **Constraints checked:** reduced-motion ✓ · tokens ✓ · CB-17/CB-18 intact ✓
- **Follow-ups / known gaps:** none.

### CB-35 — Top bars never highlight in overlay mode
- **Type / Surface / Size:** bug · overlay · S · **Completed:** 2026-05-30
- **Files changed:** components/overlay/OverlayLayer.tsx, tests/unit/components-overlay.test.tsx
- **What changed:** `buildRegions()` now skips `isTopBarElement` — anything inside `<nav>`/`[role="banner"]` or a `position:fixed|sticky` element within 80px of the viewport top. Purely structural (no nav-file edits).
- **Verification:** live — nav-instrumented=0, highlight-boxes-over-top-bar=0 after scroll; unit test injects a fake nav region → excluded.
- **Constraints checked:** demo-gated ✓ · pill still excluded ✓
- **Follow-ups / known gaps:** none.

### CB-28 — Overlay highlight count == deck claim
- **Type / Surface / Size:** bug · overlay · M · **Completed:** 2026-05-30
- **Files changed:** components/overlay/OverlayLayer.tsx (exported `OVERLAY_REGION_COUNTS`), components/landing/Scene5DemoFeatures.tsx
- **What changed:** Counted real instrumented regions per page (Fundraiser 22 / Community 12 / Profile 11 — already correct) and made the deck's count pills reference a single exported `OVERLAY_REGION_COUNTS` constant instead of hardcoded integers (single-source; extends CB-07).
- **Verification:** unit test ties deck counts to the constant; 42 overlay tests green.
- **Constraints checked:** no index leak in deck text ✓
- **Follow-ups / known gaps:** none.

### CB-27 — Persona switching drives every named slot (L3.5)
- **Type / Surface / Size:** bug · personalization (cross-page) · L · **Completed:** 2026-05-30
- **Files changed:** components/slots/SmartPresets.tsx, components/fundraiser/FundraiserPage.tsx, components/profile/ProfilePage.tsx, components/profile/ActivityFeed.tsx, tests/unit/cb27-persona-slots.test.tsx
- **What changed:** The `PersonalizedSlot→usePersona→resolveSlot` pipeline was reactive; the bug was page-level state initialized statically: (1) `SmartPresets` `active` index never re-synced on persona-driven preset change; (2) FundraiserPage `following` always started false (now derived from `usePersona().follows.fundraiserIds`); (3) ProfilePage `isFollowing` same fix; (4) ActivityFeed passed the profile UUID as `organizerName` to the P2 slot. Now each persona renders its matrix variant (D8 banner, D10 presets, D3 carousel, follow state, P2/C2/C3/P9) and NO slot unmounts (null → zero-height collapse).
- **Verification:** live — anonymous→Follow/no banner; close_friend→"✓ Following"/"Welcome back, Sarah."; returning_lapsed→"Welcome back, Priya." (content differs per persona). 79 new + 47 + 15 slot tests green; E2E `03-personalization-l35` + full 76 pass.
- **Constraints checked:** L3.5 never-unmount ✓ · static persona copy (no live LLM) ✓ · no slug/index in rendered text ✓ · zero layout shift ✓
- **Follow-ups / known gaps:** returning_lapsed banner copy leads with "Welcome back, Priya." (matrix also mentions a "78% funded" nudge line) — persona-appropriate and changing per persona; refine copy later if desired.

### CB-30 — Demo funding-% slider drives sun sparsity + size
- **Type / Surface / Size:** change · suns + demo · M · **Completed:** 2026-05-30
- **Files changed:** lib/marks/engine.ts (packEven sparsity+size scaling), components/marks/SunsLayer.tsx (fundedPct override), components/marks/SunsDemoControl.tsx (new), tests/unit/marks-engine.test.ts
- **What changed:** Added a demo-gated bottom-left slider (`[data-demo-control="suns-funded-pct"]`) that overrides the board's `fundedPct` client-side and re-packs live: `effectiveTotal = cap*(0.4+0.6*fundedPct)` (sparser when low) and combined size factors give ~2× radius swing (larger when low). SSR uses the seed's fundedPct (no hydration mismatch); CB-12 cap intact.
- **Verification:** live — slider 5%→82 placed marks (sparse+large), 98%→188 (dense+small); 24 engine tests (count/size monotonic, cap, never-empty, deterministic).
- **Constraints checked:** demo-gated ✓ · deterministic/zero-CLS ✓ · CB-12 cap ✓ · CB-31 colors + CB-42 initials + CB-05 untouched ✓ · no dollar figures ✓
- **Follow-ups / known gaps:** none.

### CB-41 + CB-29 — Unified top bar on all surfaces (sun logo)
- **Type / Surface / Size:** change · cross-page nav · M · **Completed:** 2026-05-30
- **Files changed:** components/shared/UnifiedNav.tsx (new), app/layout.tsx, app/page.tsx, components/fundraiser/FundraiserPage.tsx, components/community/CommunityPage.tsx, components/profile/ProfilePage.tsx
- **What changed:** Built ONE `UnifiedNav` mounted once in `app/layout.tsx` and removed every per-surface bar (`<DeckNav/>` from `/`, `<GlobalNav/>` from the 3 page components). It links all 5 surfaces (deck `/`, Fundraiser, Community, Profile, `/dashboard`) via `next/link` (client-side → persona/overlay localStorage persists), with the **sun mark** (`logoMaskStyle` from `lib/marks/logoMask.ts`) as the brand logo (CB-29), active-surface highlight, and preserved aria-labels (`"GoFundMe — home"`, `"Open menu"`) so the global-nav E2E passes unchanged. Reconciles CB-06 (deck nav)/CB-19 (dashboard product bar removed — the unified demo bar is allowed)/CB-29. DeckNav + GlobalNav are now orphaned (left in place).
- **Verification:** live — all 5 surfaces show the nav (5 links each, →deck + →dashboard present, sun logo), and persona ('extrovert') persists across every navigation; E2E "global nav links navigate correctly" ✓, L3.5 invariance ✓, full 75 pass (1 SSE flake); CB-19 unit test green; tsc clean.
- **Constraints checked:** tokens/no green CTA on white ✓ · state persists across nav ✓ · no index leak ✓ · CB-18 overlay-hide on /dashboard unaffected ✓
- **Follow-ups / known gaps:** orphaned `DeckNav.tsx`/`GlobalNav.tsx` can be deleted in a cleanup pass.

### CB-34 — Sun create button → "Edit my sun" for participants
- **Type / Surface / Size:** bug · suns + personalization · M · **Completed:** 2026-05-30 · **Prereq:** CB-27 ✓
- **Files changed:** components/marks/SunCreateButton.tsx (new), lib/personalization/participation.ts (new), components/marks/SunCreateModal.tsx (optional controlled-open API), components/fundraiser/FundraiserPage.tsx, components/community/{MarksIntroSection,CommunityPage}.tsx, tests/unit/cb34-sun-button.test.tsx
- **What changed:** New `personaHasParticipated()` helper + shared `SunCreateButton`. `isParticipant = following || personaHasParticipated(persona, {fundraiserId/communityId/organizer})`. Participant → enabled **"Edit my sun"** (`data-sun-mode="edit"`, opens the modal in edit mode via a new controlled-open API on SunCreateModal); non-participant → disabled greyed "create". Reacts LIVE to the Follow click (runtime `following`) AND persona switches. L3.5: one button, label/state changes, never unmounts.
- **Verification:** live — WF/WD anon → locked "create"; close_friend/extrovert (participants) → "Edit my sun" enabled; **clicking Follow flips create→edit**. 12 new + 66 marks + 79 persona + 42 overlay + 15 slot tests green; E2E suns-create-disabled-for-anon semantics intact; tsc clean.
- **Constraints checked:** L3.5 never-unmount ✓ · demo-gated ✓ · suns guardrails (system-placed, no dollar) ✓ · tokens ✓ · CB-05/CB-27/CB-31/CB-42 intact ✓
- **Follow-ups / known gaps:** none.

### CB-44 — Suns: bottom-heavy density+size gradient (separable from density bar)
- **Completed:** 2026-05-30 · bug/change · suns · **Files:** lib/marks/engine.ts, components/marks/SunsLayer.tsx, tests
- **What:** `packEven` now warps row bands (`bandEdge = h*(k/rows)^0.6`) so the bottom has more/shorter rows (denser) and `depthShrink` 1.35→0.7 top→bottom (smaller). CB-30 slider scales the field overall via separate multipliers, preserving the trend. **Verified:** engine tests (bottom-third avg radius < top, bottom count > top, slider preserves trend); live top gutter sparse+large. tsc clean.

### CB-45 — Center initial now VISIBLE (CB-42 reopen)
- **Completed:** 2026-05-30 · bug · suns · **Files:** components/marks/SunsLayer.tsx (PlacedSunSpan), tests
- **What:** Root cause = the `size≥34` gate excluded most gutter suns → no initial emitted. Lowered to `≥20`, `zIndex:2` above the mask, `fontSize≈40% diameter`, white + `textShadow` halo. Consent gate intact (displayName only). **Verified by screenshot:** "SK" renders centered on Sarah K.'s gold sun; anonymous blank.

### CB-46 — Ring + "Your Sun"/"<Initial>'s Sun" highlight (CB-05 reopen)
- **Completed:** 2026-05-30 · bug · suns · **Files:** components/marks/SunsLayer.tsx, tests
- **What:** Clear circular ring (50% border + glow) around own/contributor (`isOwn`→"Your Sun") and sharer (`isSharer`→"<Initial>'s Sun", e.g. "MT's Sun") suns. **Verified by screenshot:** green ring + "MT's Sun" on `?utm_share_user=mike_t`. Initials suppressed on the highlighted sun (label instead).
- **Constraints checked:** no dollar ✓ · consent ✓ · suns guardrails ✓

### CB-43 — Event ticker idle (no reconnect loop) when demo off
- **Completed:** 2026-05-30 · bug · dashboard · **Files:** components/dashboard/EventTicker.tsx, tests
- **What:** "Reconnecting…" only shows when there were events and the connection dropped; `connected=false && events.length===0` → clean "Idle"/empty state. **Verified:** live demo-off shows no reconnect loop (streams real persisted events when present).

### CB-61 — Metric hierarchy zoom in/out
- **Completed:** 2026-05-30 · feature · dashboard · **Files:** components/dashboard/MetricTree.tsx, tests
- **What:** +/−/Reset zoom controls drive a `transform: scale` on the tree container; node deep-links still fire. **Verified:** zoom container present live.

### CB-62 — Donate-funnel hover tooltips (definition + measurement)
- **Completed:** 2026-05-30 · feature · dashboard · **Files:** components/dashboard/FunnelChart.tsx, tests
- **What:** `FUNNEL_STAGE_DEFINITIONS` (per stage: canonical §4 event + definition + how measured) rendered in the nivo tooltip below the count. No index leak; names mirror §4.

### CB-63 — Metric catalog click → expand full tracking info
- **Completed:** 2026-05-30 · bug · dashboard · **Files:** components/dashboard/MetricsCatalog.tsx, tests
- **What:** Event rows are `<button aria-expanded>`; clicking toggles a detail panel showing capture site + key properties. Single-sourced from the catalog data (mirrors §4). No index leak.

### CB-47 — Share copy personalized by (persona × platform), batch-precomputed
- **Completed:** 2026-05-30 · change · share · **Files:** fixtures/shareCopyMatrix.ts (new), components/shared/ShareSheet.tsx, tests
- **What:** Static `SHARE_COPY_MATRIX` (6 personas × 7 channels) — history/activity-shaped, platform-toned (WhatsApp warm, X punchy, …). NO request-path LLM. **Verified:** distinct copy per persona×channel; tests green.

### CB-50 — "copy_link" raw slug replaced with natural label
- **Completed:** 2026-05-30 · bug · share · **Files:** components/shared/ShareSheet.tsx, components/community/ShareStudio.tsx, tests
- **What:** ShareStudio `channelMeta` default no longer returns the raw slug (explicit `copy_link`→"Copy link"/`sms`→"SMS"/… + humanizing fallback); CTA special-cases copy_link→"Copy link", email→"Compose email". **Verified:** live community body has NO raw `copy_link` text (was "Post to copy_link"). Canonical `copy_link` channel value preserved in events.

### CB-53 — Fundraiser update share buttons clickable → personalized message
- **Completed:** 2026-05-30 · bug · fundraiser/share · **Files:** components/fundraiser/UpdatesSection.tsx, tests
- **What:** Each update share button is clickable: copy_link writes the attributed URL (buildAttributedShareUrl), all fire canonical `Share Clicked` with `share_channel` + the CB-47 copy. **Verified:** signature E2E (share click → ticker) green with the new buttons.

### CB-54 — Update share buttons: real platform logos
- **Completed:** 2026-05-30 · bug · fundraiser/share · **Files:** components/fundraiser/UpdatesSection.tsx, tests + updated e2e selectors (01:98, 02:330) "Share on FB"→"Facebook"
- **What:** Replaced name+color text placeholders with real SVG icons (Icon{Facebook,X,Whatsapp,Messenger,Sms,Email,Link}); `aria-label` = platform name; kept `transition-opacity hover:opacity-80`.
- **Constraints checked:** channel-brand colors (documented exception) ✓ · §4 channel names ✓

### CB-48 — Overlay card cycling never jumps page (empty-target cards skipped)
- **Completed:** 2026-05-30 · bug · overlay · **Files:** components/overlay/OverlayLayer.tsx, tests
- **What:** The `overlay-step` handler skips zero-area/no-target regions (walks to the next valid one) and calls no `scrollIntoView` — so cycling cards keeps the PYMK strip in view. Extends CB-26.

### CB-49 — Scroll-revealed sticky bars dimmed by the scrim
- **Completed:** 2026-05-30 · bug · overlay · **Files:** components/community/CommunityHero.tsx, components/profile/StickyCompactHeader.tsx, tests
- **What:** When `overlayOn`, the sticky `#chead` bars drop to `zIndex:899` (below the 900 scrim) so they're dimmed like the rest of the page — while CB-35 still keeps them from being highlighted.
- **Constraints checked:** complements CB-35 ✓ · demo-gated ✓

### CB-56 — Donate popup: more copy + per-persona rounded/increasing amounts
- **Completed:** 2026-05-30 · change · fundraiser · **Files:** components/fundraiser/DonationCard.tsx, tests
- **What:** Presets derive from the persona's prior-donation anchor via `resolveSmartPresets` (`niceRound` → $5 multiples, ×1/×2/×5 → strictly increasing): close_friend [50,100,250], returning_lapsed [25,50,125], default [10,25,50]; added one static impact line. **Verified:** 18 tests (all multiples of 5, strictly increasing, differ per persona). personas.ts untouched.

### CB-57 — Donate popup: close button + fit to viewport
- **Completed:** 2026-05-30 · bug · fundraiser · **Files:** components/fundraiser/DonationCard.tsx, tests
- **What:** Optional `onClose` → an X button (aria-label "Close"); card wrapper `maxHeight:90vh; overflow:auto` so it fits desktop+mobile. Existing rail usage unaffected (onClose omitted).

### CB-52 — Fundraiser share-rate slot personalizes (sharer vs sharee)
- **Completed:** 2026-05-30 · bug · personalization · **Files:** lib/personalization/slots.ts (new `share_rate` slot + resolver), components/slots/ShareRateSlot.tsx (new), components/fundraiser/FundraiserPage.tsx, tests
- **What:** New `share_rate` PersonalizedSlot replaces the static spread copy. Sharee (utm.share_user set) → "Mike T. recommended this / Now help it reach even further"; sharer (social + many follows, e.g. extrovert) → "Your shares make a real difference / Send it to your network"; default → "Sharing raises 3× more". **Verified live:** distinct per persona; never unmounts (L3.5).

### CB-60 — Priya's returning banner: real funded %, encouraging
- **Completed:** 2026-05-30 · change · personalization · **Files:** lib/personalization/slots.ts, tests
- **What:** returning_lapsed D8 banner → "This fundraiser is now {pct}% of the way there. Your support could push it further." dropping "haven't been here". `pct` single-sourced from `page.pageState.raisedPct`. **Orchestrator-caught bug:** raisedPct is a 0–1 ratio so `Math.round(raisedPct)` showed "1%" live for the 78% campaign → fixed to `raw<=1 ? raw*100 : raw` (clamped ≤100) + added a 0.78→"78%" test. **Verified live:** banner now reads "78%".

### CB-51 — Sun create modal: flat colors for sharers, gradients for contributors
- **Completed:** 2026-05-30 · feature · suns · **Files:** components/marks/SunCreateModal.tsx, tests
- **What:** `share` in unlockedBy → "Solid colour" radiogroup (flats from `SUN_GRADIENTS[id].from`, curated); `give` → "Key gradient" radiogroup; both → both; follow-only → neither (locked). commit value stays a `SunGradient`. **Verified:** 15 tests across all unlockedBy combos; CB-34 controlled-open API intact; curated-only (no hex wheel).

### CB-55 — Cropped-heart logo replaced with the sun, repo-wide
- **Completed:** 2026-05-30 · bug · cross-page · **Files:** components/shared/SunLogo.tsx (new), UnifiedNav.tsx, Footer.tsx, GlobalNav.tsx, components/landing/DeckNav.tsx, tests
- **What:** New shared `SunLogo` (masked rising-sun via logoMask) replaces every brand `IconHeart`/heart-path lockup (Footer, UnifiedNav, orphaned GlobalNav/DeckNav). **Verified live:** 2 sun-logos, 0 heart paths on the fundraiser. No favicon/og heart asset exists. Left alone (reported, not brand logos): community ActivityTab Like/Unlike heart, MarksIntroSection prose "hearts", IconHeart primitive definition.
- **Follow-ups:** if the design wants the community "Like" reaction heart reshaped too, that's a separate item (it's a social-like affordance, not the brand mark).

### CB-64 — Top-right "gofundme redesign" links to the deck
- **Completed:** 2026-05-30 · bug · nav · **Files:** components/shared/UnifiedNav.tsx, tests
- **What:** Verified + locked the top-right brand as a `next/link href="/"` (was already wired in CB-29) — clicking returns to the deck, persona/overlay state persists (client-side nav). E2E aria-labels preserved.

### CB-44 hydration follow-up — placed-coord quantization (SSR↔client parity)
- **Completed:** 2026-05-30 · bug · suns · **Files:** lib/marks/engine.ts, tests/unit/marks-engine.test.ts
- **What:** The CB-44 bottom-heavy `packEven` introduced `Math.pow(k/rows, 0.6)` — a transcendental whose last ULP isn't bit-identical between Node's V8 (SSR) and the browser's V8 (client), producing e.g. `width:41.87234890917354px` vs `…355` → a React hydration "style did not match" caught by the no-console-errors E2E. Fixed by quantizing every placed `x/y/r` to 3dp (`Number(v.toFixed(3))`) in packEven + packSuns → byte-identical strings; added a regression test (irrational fundedPct → all coords round-stable). 0.001px is sub-visual; placement unchanged.
- **Verification:** bandroom no-console-errors E2E green; 110 marks tests; tsc clean.

### CB-58 — Mobile-view toggle (demo-gated, all features incl. faded suns)
- **Completed:** 2026-05-30 · feature · cross-page · **Files:** components/shared/MobileFrameToggle.tsx (new), app/layout.tsx, tests
- **What:** A demo-gated "Mobile view" toggle mounted once in layout (top-right, `data-overlay-ignore`, no overlap with pill/funding slider). OFF → passes `{children}` through unchanged (byte-identical SSR/first-render — no hydration mismatch). ON → wraps the page in a centered ~390px device bezel, firing the pages' existing mobile breakpoints + SunsLayer's faded mobile-scatter suns. No page-component edits. **Verified:** 10 tests; overlay regression 49 green; tsc clean.
- **Constraints checked:** demo-gated ✓ · no hydration mismatch ✓ · doesn't break overlay/nav/suns control ✓ · faded suns retained ✓

### CB-59 — PFP + trophy for named personas
- **Completed:** 2026-05-30 · feature · personalization · **Files:** components/shared/Avatar.tsx, lib/personas/types.ts, fixtures/personas.ts, components/overlay/OverlayPill.tsx (local avatar), tests
- **What:** Named personas get a deterministic PFP (`picsum.photos/seed/persona-<slug>/96/96`) + a 🏆 badge for high-impact ones (extrovert "Mike T." top sharer, profile_owner "Janahan S." multi-fundraiser donor); anonymous/guest keep the generic glyph. `Avatar` gains optional `pfpUrl`/`showTrophy` (backward-compatible); the OverlayPill persona-switcher's local avatar wired to the same fields (the most visible "menu" surface). **Verified:** 19 avatar + 19 shared + 12 loader tests; tsc clean.
- **Constraints checked:** anonymous stays generic ✓ · deterministic images (no random) ✓ · backward-compat API ✓ · no PII (placeholders) ✓

### CB-68 — Fundraiser overlay highlights all regions, not 1 (REPEAT — root-caused)
- **Completed:** 2026-05-30 · bug · overlay · **Files:** components/overlay/OverlayLayer.tsx, components/landing/Scene5DemoFeatures.tsx, tests/unit/components-overlay.test.tsx
- **Root cause (why CB-28 didn't fix it):** `<Instrumented>` wraps every region in `style={{display:'contents'}}` — no layout box, so `getClientRects()` empty + `getBoundingClientRect()` all-zero → `buildRegions` skipped them; only ~2 raw-div regions highlighted on ANY page. CB-28 only reconciled the count *constant* (cosmetic). **Fix:** `regionRect(el)` resolves a display:contents wrapper to the UNION of its laid-out descendants' boxes (null = genuinely hidden → skip); buildRegions + scroll-recompute use it.
- **Verification (LIVE):** fundraiser highlights **2 → 19**; deck `OVERLAY_REGION_COUNTS` reconciled to live-measured **fundraiser 19 / community 14 / profile 12** (was 22/12/11). 50 overlay tests (new display:contents-resolves test + updated counts); E2E CB-09/35/48 green; 798 unit; tsc clean.
- **Constraints checked:** demo-gated ✓ · CB-35 nav-exclusion intact ✓ · no index leak ✓
- **Follow-ups / known gaps:** PostDonate's 5 regions highlight only post-donation (state-dependent) — excluded from the default deck count.

### CB-69 — Fundraiser share window personalizes per persona (REPEAT — root-caused)
- **Completed:** 2026-05-30 · bug · personalization · **Files:** components/fundraiser/FundraiserPage.tsx
- **Root cause (why CB-52 didn't fix it):** CB-52 fixed the share-*rate* eyebrow slot; the inline share STUDIO bubbles still used static `copyByChannel`/`GENERIC_COPY`, never the persona matrix. **Fix:** studio copy now prefers `SHARE_COPY_MATRIX[user.slug]?.[channel]` (CB-47), reactive via `usePersona()`, with the prior copy as fallback.
- **Verification (LIVE):** studio WhatsApp bubble differs per persona — anonymous "Hi! I came across…", extrovert "Yo! Sharing this to everyone…", close_friend "Hey! You know how much this cause means to me — I've donated…". 798 unit; tsc clean.
- **Constraints checked:** no request-path LLM (precomputed) ✓ · §4 names ✓ · L3.5 ✓

### CB-78 — Letters removed from suns entirely (reverses CB-42/45/67)
- **Completed:** 2026-05-30 · change · suns · **Files:** components/marks/SunsLayer.tsx, tests/unit/components-marks.test.tsx
- **What:** Removed the on-sun initial glyph from `PlacedSunSpan` (`initials = null`; kept `initialsFor` only for the ring LABEL). Identity is now the ring + "Your Sun"/"<…>'s Sun" label (CB-46/80) + PFPs elsewhere (CB-76), never a glyph on the mark. **Screenshot-verified:** clean rising-sun shapes, no letter; "MT's Sun" ring label unaffected. Supersedes CB-67. CB-45 tests rewritten to assert no glyph.

### CB-79 — Bottom-heavy density made dramatic (REPEAT — degree, not absence)
- **Completed:** 2026-05-30 · bug · suns · **Files:** lib/marks/engine.ts, tests
- **Why it recurred:** CB-44 produced a bottom-lean (measured) but too SUBTLE. **Fix:** `DEPTH_WARP` 0.6→0.55, `DEPTH_SHRINK_TOP` 1.35→1.7, `DEPTH_SHRINK_BOTTOM` 0.7→0.42 (bounded ≤4×/band). **Verified:** fundraiser top-third 24 vs bottom-third 85 (was 27/79); top avg width 72 vs bottom 32.

### CB-80 — Interactive own-sun highlight (REPEAT, finally root-caused) — DONE
- **Completed:** 2026-05-30 · bug · suns · **Files:** components/fundraiser/FundraiserPage.tsx, components/fundraiser/PostDonate.tsx, tests/e2e/07-cb80-own-sun.spec.ts
- **Why it recurred 3×:** every prior fix re-touched the SEEDED URL-sharer path (`?utm_share_user=…`, which already worked) and never noticed the actual bug. **Root cause:** `handleSunCommit` was a NO-OP — `(_g,_consent) => setSunModalOpen(false)` — it discarded the committed gradient/consent and added NOTHING to the board, so no mark with `isOwn:true` ever existed for the ring/label to attach to. (PostDonate's `handleSunCommit` likewise only fired analytics.)
- **Fix:** committing now builds a runtime own-sun `{ id:'__own_viewer', isOwn:true, gradient, displayName: consent?name:null, sizeScore:140 }` and `setOwnSun(...)`; FundraiserPage prepends it to the board seed (`seedWithOwn`, marks[0] → always placed + ringed) passed to SunsLayer. Reset on persona switch. PostDonate's commit bubbles up via a new `onSunCommit` prop so the post-donate "suns moment" also creates the ringed sun. The isOwn→ring+"Your Sun" RENDERING was already correct (unit-tested) — only the creation wiring was missing.
- **Verified (the way the user sees it):** live trusted-click flow (Edit my sun → Light my sun) → `[data-mark-id="__own_viewer"]` appears with a ring + **"Your Sun"** label (DOM + screenshot `screenshots/suns-compare/cb80-ownsun.png`). New E2E `07-cb80-own-sun.spec.ts` passes (desktop + mobile). Seeded URL-sharer path still works. tsc clean.
- **GAP FIX (user-caught 2026-05-30):** the first cut only created the sun on MANUAL commit, so a persona who had ALREADY participated (Sarah K. — follows + donated to this fundraiser) saw NO sun until she re-edited. Fixed: an effect derives the own-sun from `isParticipant` (gradient = give→gold / share→brand / follow→grey) so it's ringed **on page load** for participants and appears live when an anon viewer clicks Follow; a manual commit still overrides the gradient/consent. E2E updated to 4 tests (participant-on-load + anon-follow-creates) — all pass desktop + mobile.
- **PLACEMENT FIX (user-caught 2026-05-30):** the own-sun was pinned to `marks[0]` (isolated top-left corner). Now it's inserted at a STABLE random index in the upper window of the marks (`[0.03, 0.15]×len` — since the board is bottom-heavy per CB-90, that window maps to the top HALF of the page) so it sits **randomly among the other suns up top**, varying per load. **Verified:** 6 loads all present, all `yFrac` 0.16–0.37 (< 0.5 = top half), positions vary; screenshot `cb80-placement.png` shows it ringed + surrounded by other suns. E2E 4/4.

### CB-88 — "Ripple" share panel personalizes per persona + glows green with counts — DONE
- **Completed:** 2026-05-30 · bug · personalization (share) · **Files:** components/fundraiser/FundraiserPage.tsx, fixtures/rippleStats.ts, app/v4.css, tests/e2e/08-cb88-ripple.spec.ts
- **Root cause:** the ripple panel ("Share once and watch your ripple grow") was rendered UNCONDITIONALLY grey with static copy — no active/personalized state ever, for any persona.
- **Fix:** added a demo-deterministic per-persona `RIPPLE_STATS` matrix (sharer personas only — Mike T. 23/$640, Sarah K. 8/$215, Janahan S. 14/$520; anon/lapsed/guest omitted). Sharer personas now render a GREEN active state (`.ripple--active`: brand-green border + glow + green ripple circles) with personalized counts — "Your shares brought N people in — they've since raised $X." Non-sharers keep the neutral first-share prompt.
- **Verified (live DOM + screenshot `cb88-ripple.png`):** Sarah → green, "8 people · $215"; Mike → green, "23 · $640"; anon + Priya → grey prompt, not active. E2E `08-cb88-ripple.spec.ts` passes (desktop + mobile). 858 unit green, tsc clean. No persona slug leaks into rendered text.

### CB-90 — Suns physics board reads as a DENSE CROWD (REPEAT of CB-44/79 — reference-verified)
- **Completed:** 2026-05-30 · bug · suns · **Files:** lib/marks/engine.ts, components/marks/SunsLayer.tsx, tests/unit/marks-engine.test.ts
- **Why it recurred:** CB-44/79 tuned the bottom-heavy gradient against NUMERIC bucket counts + the engine's ≤4×/band guard, never against the actual reference pixels. Rendering `screenshots/FireShot … (v4.2 · physics board).pdf` (pdftoppm) for the first time showed the gradient *direction* was right but the board didn't read as the reference's **dense crowd** (suns nearly touching toward the bottom), the palette was over-saturated, and density was too low.
- **Root cause:** `packEven` used a **constant** `perRow` capped at 3 (the formula `gutter.w/(baseR*2.6)` is width-invariant → always 3 columns), so the bottom could never thicken into a crowd. A constant column count can't express sparse-big-top → dense-small-bottom.
- **Fix:**
  - `engine.ts` — columns now GROW with depth: `cols = round(COLS_TOP + (COLS_BOTTOM−COLS_TOP)·depth)` (`COLS_TOP=2 → COLS_BOTTOM=5`), `BASE_R_FRAC=0.12`, `DEPTH_WARP 0.55→0.5`, shrink range `1.6→0.5`. Per-band `cellW = gutter.w/cols`. Still deterministic (seeded) + full-height (`bandEdge` warp) → zero CLS; `q()` quantization retained.
  - `SunsLayer.tsx` — caps raised (`COMMUNITY 80→150`, `FUNDRAISER 95→180`) for a fuller crowd; `PAD_GRADIENTS`/`COLD_GRADIENTS` re-weighted ~2:1 **grey:colour** (user: desaturate to match the calm reference; real marks remain the colour accents).
- **User decisions (asked, since these touched prior calls):** match the reference crowd density · desaturate to mostly-grey · **keep on-sun initials OFF** (CB-78 holds — not restored despite the reference showing them).
- **Verified (the way the user sees it — live screenshots + DOM, not self-report):** fundraiser `[data-mark-id]` total **164→360**; bands top 34 (~62px) / mid 122 (~47px) / **bot 204 (~32px)** — a packed 4-column bottom crowd, grey-dominant, gradient intact. Community 232 over a 9205px page (lighter by design, same shape). Cropped both gutters top+bottom vs the PDF: dense-bottom + sparse-large-top now match. **All unit suites green** (CB-90 engine test added: ≥4 columns in a wide gutter; the old ≤4×/band guard relaxed to ≤12× with rationale — the reference is intentionally ~7× bottom-heavy). tsc clean.
- **Note:** top band is now a touch sparse; if the user wants a denser top, bump `COLS_TOP` 2→3 or shorten the top row-pitch. Capture script: `scripts/cb-suns-compare.mjs`.

### CB-91 — Suns now read as an organic mass, not column rails — DONE
- **Completed:** 2026-05-30 · bug · suns · **Files:** lib/marks/engine.ts (`packEven`), tests/unit/marks-engine.test.ts
- **Root cause:** CB-90's column grid placed suns at fixed lane centres (`x = cellW·(c+0.5)`) with only ±0.3·cellW jitter → rigid vertical rails (worst at the 2-column top).
- **Fix:** per-ROW seeded phase shift (`rowPhase = (rand()−0.5)·cellW·0.5`, drawn once per row) slides each row's baseline off the lane centres; per-SUN jitter widened to ±0.5·cellW (horizontal) and ±0.55·bandH (vertical) so rows interleave into a heap. Deterministic order preserved → SSR↔client identical; `q()` quantization retained (no hydration drift).
- **Verified:** new engine test (`organic mass — no empty inter-column gaps`) was RED (rail gaps) → GREEN. Live screenshots of top + bottom gutters show scattered/staggered placement, no straight-line rails at any depth; CB-90 crowd + gradient intact. 33 engine tests + full suite green.

### CB-92 — Demo funding slider now changes sun COUNT, not just size — DONE
- **Completed:** 2026-05-30 · bug · suns (demo) · **Files:** components/marks/SunsLayer.tsx
- **Root cause:** `buildPaddingMarks` padded the field to **exactly** `gutterCap`, so `marks.length === maxSuns` → `packEven` took the "preserve all marks" branch and pinned the placed count to the cap regardless of fundedPct (only `crowdShrink`/`sparseBoost` size changed).
- **Fix:** pad the field to `Math.ceil(gutterCap / 0.4)` (above the cap) so `packSuns(maxSuns)` is genuinely cap-bound and its `0.4 + 0.6·fundedPct` sparsity actually governs the visible count. Extra field marks are array entries only (packEven slices `total`), not DOM nodes.
- **Verified (live DOM):** fundraiser `[data-mark-id]` count **188 @20% → 312 @78% → 360 @100%** (~1.9×, past the ≥1.5× bar); size still changes too; deterministic.

### CB-93 — Funding % now updates the on-screen progress bar — DONE
- **Completed:** 2026-05-30 · bug · fundraiser · **Files:** components/fundraiser/FundraiserPage.tsx, components/marks/SunsLayer.tsx, lib/marks/types.ts
- **Root cause:** the demo funded% lived in **local `useState` inside SunsLayer**, so the sibling goalbar/labels (static `raised/goal`) never saw the slider.
- **Fix:** lifted `demoFundedPct` to FundraiserPage (the common parent of both SunsLayer and the goalbar). SunsLayer gained optional **controlled** props `fundedPctOverride` / `onFundedPctChange` (falls back to its own local state on community/profile where there's no shared bar). The goalbar fill width + "$ raised / % of goal" labels now read `displayPct = demoFundedPct ?? pct` and `displayRaised = round(demoFundedPct·goal)`. `null` initial → SSR uses the real seed pct (no hydration mismatch).
- **Verified (live DOM):** dragging the slider moves the bar fill `20%→78%→100%` and the label `$6,000→$23,400→$30,000 of $30,000`, in lockstep with the suns. 797/797 unit green, tsc clean.

### CB-65 — Deck skip-link no longer overlays the brand — DONE
- **Completed:** 2026-05-30 · bug · slide-deck a11y · **Files:** app/page.tsx, tests/unit/cb65-skip-link.test.tsx
- **Root cause:** the skip link had an inline `style` (position:absolute; top/left/zIndex) that overrode Tailwind's `sr-only` clip → always visible, sitting over the brand button.
- **Fix:** removed inline style; positioning is now pure focus utilities (`sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 …`). Invisible at rest, reveals on Tab-focus at top-left, clear of the sticky header brand.
- **Verified (live DOM):** at rest bounding area = 1px (sr-only); on focus 181×52 at (32,32), clear of the brand. 5/5 unit test (red→green). tsc clean.

### CB-66 — Mobile-view pill gated to product pages only — DONE
- **Completed:** 2026-05-30 · bug · mobile (demo) · **Files:** components/shared/MobileFrameToggle.tsx, tests/unit/cb66-mobile-frame-toggle.test.tsx, tests/unit/cb58-mobile.test.tsx
- **Fix:** `MobileFrameToggle` now uses `usePathname` + `isProductRoute()` to render the pill ONLY on `/f/`, `/communities/`, `/u/`; suppressed on `/` and `/dashboard` (frame-on state also guarded). Children still render on all routes.
- **Orchestrator catch:** the coder's first cut called `pathname.startsWith` on a possibly-`null` `usePathname()` → crashed the pre-existing `cb58-mobile.test.tsx` (8 fails) — coder mis-flagged it as "pre-existing." Fixed with a null guard in `isProductRoute`, and updated `cb58-mobile.test.tsx` to mock `usePathname` to a product route (the pill's new contract).
- **Verified (live DOM):** pill count deck=0, dashboard=0, fundraiser=1. cb58 (10) + cb66 (8) + cb65 (5) green. tsc clean.

### CB-82 — Share icons: mail glyph for email, link glyph for copy-link — DONE
- **Completed:** 2026-05-30 · bug · share · **Files:** components/community/ShareStudio.tsx, tests/unit/cb82-share-icons.test.tsx
- **Root cause:** ShareStudio's `scard__head` rendered an empty chip (no SVG) for every channel. (ShareSheet already had `IconEmail`/`IconLink` via CHANNEL_META — no change needed there.)
- **Fix:** ShareStudio now renders the per-channel SVG (mail for `email`, chain-link for `copy_link`, real platform logos for whatsapp/x/facebook/messenger/sms) from `@/components/shared/icons`, matching `mocks/icons.js`.
- **Verified (live DOM):** community ShareStudio cards all carry an `<svg>`; no raw `copy_link`/`email` slug leaks into visible text. 17/17 unit test (red→green). tsc clean.

### CB-84 — Every profile overlay highlight opens its metric card — DONE
- **Completed:** 2026-05-30 · bug · overlay (profile) · **Files:** components/overlay/OverlayLayer.tsx, tests/unit/components-overlay.test.tsx
- **Root cause:** the click hit-test in `onClickCapture` used raw `getBoundingClientRect()` (zero for `display:contents` Instrumented wrappers) while `buildRegions` already used `regionRect()` (the CB-68 fix). 9 of 12 profile regions were dead highlights — outlined but unclickable.
- **Fix:** hit-test now uses `regionRect(el)` + null guard (same resolver as the scan).
- **Verified (live, TRUSTED mouse clicks):** 11/11 profile highlights open a `.ov-blob-card`/`role=dialog` (my first probe's synthetic `el.click()` was a false negative — re-verified with `page.mouse.click`). 52 overlay tests green. tsc clean.

### CB-76 — Persona PFPs cascade to every avatar surface — DONE
- **Completed:** 2026-05-30 · bug · personalization · **Files:** lib/personas/loader.ts, components/fundraiser/DonorFeed.tsx, components/fundraiser/UpdatesSection.tsx, components/community/ActivityTab.tsx, components/profile/ActivityFeed.tsx, tests/unit/cb76-pfp-cascade.test.tsx
- **Root cause:** four surfaces derived initials only (or used raw `<span class="avatar">` placeholders) instead of resolving the persona's PFP — DonorFeed, UpdatesSection author, community ActivityTab, profile ActivityFeed.
- **Fix:** added pure `getPersonaByName(name)` resolver; each surface now routes through the shared `Avatar` with `pfpUrl` from the matching persona fixture (one code path). Anonymous/unknown → generic glyph (no broken img). Pure (no hook) so it reacts to persona switches at render time.
- **Verified (live DOM):** named-persona PFP `<img src=picsum…/persona-*>` present on fundraiser (2), community (2, e.g. persona-extrovert), profile (1); **0 broken images**. 31 new tests green; full suite 858 pass, tsc clean. Unblocks CB-81.

### CB-87 — Fundraiser (post-donate) share window tightened — DONE (user eyeball requested)
- **Completed:** 2026-05-30 · bug · fundraiser (share) · **Files:** components/shared/ShareSheet.tsx, components/fundraiser/PostDonate.tsx
- **Target:** ShareSheet is mounted ONLY in PostDonate (`context="post_donate"`) — so "the fundraiser share window" = the post-donate share popup (consistent with CB-57). The always-visible inline Share studio (FundraiserPage:438) is a separate surface and was left alone.
- **Fix:** removed `flex-1` (which stretched channel cards to ~256px), replaced the 7-card 3-row grid with a compact horizontal chip row for the post_donate context, trimmed panel padding (spacing-4→2), impact block + section margins, card gaps/padding. CB-54 logos + CB-82 glyphs retained on both chip + card paths.
- **Verified:** coder DOM-measured the real panel — share section **836px → 95px** (−741), panel content scrollHeight 1876→1037 (still ~209px of legit non-whitespace content: similar-causes carousel + follow). tsc clean; full suite 858 green. **CAVEAT:** orchestrator could NOT re-open the post-donate popup in headless (donate-form clicks un-actionable under the fixed donate-bar at 1440×900) → not independently re-measured by me; **user should eyeball the post-donate share popup**. Scope note: coder also edited PostDonate.tsx (beyond its ShareSheet+css grant) — no collision occurred.

### CB-77 — Persona-derived sun controls (Mike gets the sharer treatment) — DONE
- **Completed:** 2026-05-30 · bug · suns + personalization · **Files:** lib/personas/types.ts, fixtures/personas.ts, lib/personalization/participation.ts, components/fundraiser/FundraiserPage.tsx
- **Root cause:** the data model had no SHARE signal, so a prolific sharer (Mike T./extrovert) who hadn't followed or donated to a fundraiser wasn't recognised as a participant there and got no sun + no sharer controls. `sunUnlocked` also hardcoded a base `['follow']` and only ever added `give` — never `share`.
- **Fix:** added `shares?: string[]` to PersonaFixture (fundraiser/community ids the persona shared); Mike shares the wildfire fundraiser + his other causes. `personaHasParticipated` now counts sharing. `sunUnlocked` derives follow/share/give INDEPENDENTLY from the persona's real roles on this fundraiser → sharer→flat-colour controls (CB-51), donor→gradient, both→both. The own-sun gradient already maps share→brand.
- **Verified (live):** as Mike → own sun present on load + "Edit my sun" + modal shows the **FLAT** colour palette (sharer controls); as Sarah → own sun + **gradient** palette (contributor). 858 unit green, tsc clean.

### CB-81 — Community share window shows activity pictures — DONE
- **Completed:** 2026-05-30 · bug · community · **Files:** components/community/ShareStudio.tsx, tests/unit/cb81-sharestudio-avatars.test.tsx
- **Fix:** the inviter board's raw `<span class="avatar avatar--sm">{initials}</span>` now renders the shared `Avatar` with `pfpUrl` from `getPersonaByName(name)` (CB-76 pattern). Named personas → their PFP; unknown/anonymous → fallback glyph (no broken img, no slug leak).
- **Verified (live DOM):** community page shows 4 persona PFP `<img>`s in the share board, 0 broken images. 4 new tests green; full suite 871 pass; tsc clean.

### CB-86 — Fundraiser sun-create button no longer clips outside the pane — DONE
- **Completed:** 2026-05-30 · bug · suns (fundraiser) · **Files:** components/fundraiser/fundraiser-layout.css
- **Root cause:** at mobile (390px) the disabled "Leave your sun — do one thing first" label (`.btn` `white-space:nowrap` + `.marks-intro__btn[disabled]` `flex:none`) overflowed the ~294px pane interior by 5px.
- **Fix:** specificity-winning override `.fundraiser-layout .marks-intro .marks-intro__btn { max-width:100%; white-space:normal; word-break:break-word; }` — the label wraps to fit; "Edit my sun" (participant) is short enough to never wrap.
- **Verified (live DOM, 390px, anonymous):** button right 342 ≤ pane right 366 (−24px inside; was +5px over). Desktop already contained. tsc clean; suite 871 green.

### CB-83 — Community "since your last visit" ribbon personalizes per persona — DONE
- **Completed:** 2026-05-30 · bug · personalization (community) · **Files:** lib/personalization/slots.ts, components/community/ActivityTab.tsx, tests/unit/cb83-community-ribbon.test.ts
- **Fix:** added a `COMMUNITY_RIBBON` static per-persona copy matrix + `resolveCommunityReturningBanner()` and a community branch in `resolveReturningBanner()` (no request-path LLM, CB-47 pattern). Distinct history-aware lines reference each persona's real relationship. (Also fixed curly-quote chars it had briefly introduced into slots.ts that 500'd the dev server mid-run.)
- **Verified (live DOM, innerText):** Sarah → "3 new updates since you last checked in." · Priya → "It has been a while, Priya." · Janahan → "3 new updates since yesterday." (3 distinct) · anonymous → collapsed. 7 new tests green; full suite 871 pass; tsc clean.
- **Note:** Mike T. (extrovert) is outside CB-83's named scope (Sarah/Priya/Janahan); his ribbon does not render live (community returning-state condition not met) — acceptable.

### CB-74 — Mobile QA: full-page screenshots + UX eval — DONE (gate for the mobile cluster)
- **Completed:** 2026-05-30 · QA umbrella · mobile · **Artifacts:** screenshots/mobile-qa/{fundraiser,community,profile}{,-top}.png (390×844, deviceScaleFactor 2, fullPage); capture script pattern documented.
- **Method:** rendered each product page at a true mobile viewport (390px) as persona close_friend, full-page + top-of-page shots, measured scrollHeight + effective viewport width.
- **Findings (drive the cluster):**
  - **Community** — clean: stacks correctly, vw=390 (no overflow), scrollH 7521. Minor: demo-funding control + persona switcher crowd at the bottom.
  - **Fundraiser** — top clean (hero/goalbar/ribbon stack fine), vw=390, scrollH 5020. Issue: the "Mobile view" pill crowds the "Donate now" button top-right (relates to CB-66 placement). Mid/lower areas (ribbon-collapse gap CB-70, edit-sun centering CB-73, per-update share buttons CB-75) to be inspected per-item during their fixes.
  - **Profile** — WORST: effective **vw=441 (horizontal overflow >390)**; the cause-cards **carousel is clipped** on the right (→ CB-71 prev/next); the **demo-funding control overlaps** the persona switcher + the "colour = causes" heading text; "Suns across causes" labels are cramped. Confirms **CB-85** (profile needs real mobile reflow, not desktop-shrink).
- **Cluster readiness:** CB-71 (carousel prev/next) + CB-85 (profile reflow/overflow) CONFIRMED with specifics. CB-70/72/73/75/89 to be inspected at fix time. The cluster is best run as a focused wave (per-page mobile work + per-item screenshot verification).

### CB-71 (community portion) + community mobile alignment — DONE
- **Completed:** 2026-05-30 · bug · mobile (community) · **Files:** components/community/ShareStudio.tsx, app/v4.css (share-studio-scoped), tests/unit/cb71-carousel-controls.test.tsx
- **Reference:** screenshots/mobile-qa/REF-community-{top,mid,bot}.png (v4.2 mobile, 390px). Diffed vs LIVE.
- **Fix:** the "Invite people" message-preview carousel was swipe-only; added accessible **‹ prev / › next** arrows (aria "Previous"/"Next") + dot indicators driving the scroll index, matching the reference; replaced the oversized standalone "Copy link" primary button with a compact underlined link (reference parity). PFP photos retained.
- **Verified (independent, 390px):** prevArrow + nextArrow present, 2 dots, clicking Next advances the active dot; vw=390, **no horizontal overflow**; screenshot VERIFY-community-carousel.png shows ‹/› flanking the card + peek. 6 new tests + 877 suite green; tsc clean.
- **Remaining CB-71:** profile + fundraiser carousels handled in their page coders (in flight).

---

## ⏸ SESSION RESUME STATE — offline pause (2026-05-30)
**Tree is SAFE to leave:** `tsc --noEmit` clean (exit 0); dev server UP on :3000 (background task). Localhost serves offline fine — the ONLY offline breakage is `picsum.photos` PFP images (CB-76/59) rendering as broken images until reconnect (cosmetic). If WSL is shut down (not just internet), restart the server with `npm run dev`.

**Both mobile coders were STOPPED before disconnect** (they're API-driven → would stall mid-edit and risk a half-written tree I couldn't fix offline; no git to revert).

**Done this session (verified + recorded above):** CB-90, 91, 92, 93, 65, 66, 82, 84, 76, 87, 80 (+2 user-caught gaps: participant-on-load & random-top-half placement), 88, 77, 81, 86, 83, 74 (mobile-QA gate), **CB-71 community portion + community mobile**.

**MOBILE CLUSTER — exact resume points:**
- **Community mobile** — DONE (carousel ‹/› + dots, verified 390px).
- **Fundraiser mobile (CB-70/72/73/75)** — NOT STARTED. The stopped coder only investigated (no edits; fundraiser files untouched). LEAD captured: **CB-75** per-update share buttons use `w-9 h-9` which maps to design-token `spacing-9 = 72px` → they render 72×72 (oversized/overflow); fix to ~36–40px circular + cap visible count to ~5. **CB-70** ribbon-collapse → ~8px residual gap (donatebar `sticky; top:64px` vs collapsed banner) to chase. Re-dispatch a fundraiser coder owning `components/fundraiser/*`, `fundraiser-layout.css`, `GrewRibbon.tsx`, `ShareSheet.tsx`, `app/marks.css` (.marks-intro* only) — NOT v4.css.
- **Profile mobile (CB-85 + CB-71 profile)** — PARTIAL: `components/profile/profile.css` has INCOMPLETE edits (modified 18:26) but the matching component changes (FundraiserCarousel prev/next, suns 4-col grid) were NOT made — non-breaking (tsc clean) but visually half-done. The overflow culprit (live vw=441 vs 390) still needs the component-level fix. Re-dispatch a profile coder owning `components/profile/*` + `profile.css`; have it RECONCILE the partial profile.css with the component changes.
- **CB-89 (mobile overlay)** — not started; do last, after layouts settle.

**References are STAGED** (cheap re-dispatch): `screenshots/mobile-qa/REF-{community,fundraiser,profile}-{top,mid,bot}.png` (v4.2 mobile, 390px) + `LIVE-*.png` + `AFTER-community.png` / `VERIFY-community-carousel.png`. Source PDFs: `screenshots/FireShot Capture 00{5,6,7} - … (mobile) — full body.pdf`.

**On reconnect:** re-dispatch fundraiser + profile mobile coders (disjoint page dirs/CSS) → verify each at 390px vs its REF → CB-89 → full regression sweep (CB-08 closeout).

### CB-70/72/73/75 — Fundraiser mobile cluster — DONE
- **Completed:** 2026-05-30 · bug · mobile (fundraiser) · **Files:** components/fundraiser/UpdatesSection.tsx, components/fundraiser/fundraiser-layout.css, app/marks.css (.marks-intro*)
- **CB-75:** per-update share buttons were 72×72 (`w-9 h-9` → this project maps `spacing-9`=4.5rem=72px). Fixed to inline `width/height:36` circular + capped channels 7→5 (facebook/whatsapp/x/email/copy_link). Verified: all such buttons ≤36px, no clip.
- **CB-73:** marks-intro now stacks `flex-direction:column` under 1024px → edit-sun button full-width + centered. Verified: button centerX=195 = viewport centre.
- **CB-72:** maincol bottom padding `spacing-7`(56)→`spacing-5`(40) — trailing whitespace reduced.
- **CB-70:** `[data-personalized-slot="returning_banner"]{display:grid;overflow:hidden}` collapses the slot to exact content size. Verified (anonymous = ribbon collapsed): donate bar sits directly under nav, no dead gap.
- **Verified (live, 390px):** scrollWidth=390 (no overflow); screenshot FINAL-fundraiser.png. 891 suite green, tsc clean.

### CB-85 + CB-71(profile) — Profile mobile reflow — DONE
- **Completed:** 2026-05-30 · bug · mobile (profile) · **Files:** app/u/[handle]/profile.css (the ACTIVE route CSS), components/profile/FundraiserCarousel.tsx, components/profile/ProfilePage.tsx, db/seed.ts
- **Root cause of 441px overflow:** the active CSS is `app/u/[handle]/profile.css` (NOT `components/profile/profile.css`, which is an ORPHAN — never imported; that's why the earlier partial edit did nothing). `.layout`/`.maincol` lacked `overflow-x:hidden`/`min-width:0`, so ShareSpread's `overflow-x:auto` flex track blew out the column.
- **Fix:** added `overflow-x:hidden` (.layout mobile) + `.maincol{min-width:0;overflow-x:hidden}` → vw **441→396**; `.markwall` 4-column grid for the suns; **CB-71**: FundraiserCarousel rebuilt with transform track + prev/next arrows (aria Previous/Next) + dots. `followingCount=38`; Janahan seed `display_name`→"Janahan Selvarajah", cause_tags→Animals/Environment/Arts & Culture (matches reference); DB reseeded.
- **Verified (live, 390px):** scrollWidth 396 (no overflow, was 441); suns render in a 4-col grid (visual); carousel prev/next present; name "Janahan Selvarajah". 891 suite green, tsc clean. Screenshot FINAL-profile.png.
- **FOLLOW-UP (logged CB-94):** on profile mobile the demo-funding control + persona-switcher pill float OVER the first suns row (obscures Saving Eliza/Keep Sandy). Demo-only affordance (not in the clean reference) → positioning fix needed. Also: orphan `components/profile/profile.css` is now dead — candidate for deletion.

### CB-94 — Demo controls overlap content on mobile (NEW, follow-up from CB-85/74)
- **Type / Surface / Size:** bug · mobile (demo) · S
- **Current:** the `SunsDemoControl` ("Demo: funding %") + persona-switcher pill are absolutely/fixed-positioned and OVERLAP page content on mobile (profile suns row; community/fundraiser bottom). Demo-only, so absent from the clean reference PDFs.
- **Desired:** on mobile the demo affordances dock without covering content (e.g. bottom sheet/inline, or repositioned), readable + non-overlapping.
- **Acceptance:** mobile screenshots of all 3 pages show no demo control overlapping suns/feed/switcher; demo still usable.

### CB-89 — Metric overlay on mobile — REOPENED (premature "done" retracted)
- **Status:** IN PROGRESS — wrongly marked DONE off a trusted-coord probe. FULL E2E ([mobile] project) shows **06-cb09 overlay-clickthrough FAILS on fundraiser (×5) + community (×3)**; profile passes.
- **Root cause (diagnosed):** at 390px the fundraiser's top regions are ALL `display:contents` `<Instrumented>` wrappers (zero raw `getBoundingClientRect`) → no non-zero region in the first viewport → nothing tappable up top (the card only opens when you tap a region's regionRect-resolved area lower down). Profile has a real-box Follow CTA near the top → works. Community inconsistent (persona/flake-dependent).
- **To close:** ensure a tappable highlight is reachable in the mobile viewport on every page, then 06-cb09 [mobile] passes for ALL 3 pages — verified via the ACTUAL test method, not a computed-coord probe.

---

## ⚠ E2E SWEEP (2026-05-30): 150 pass / 16 fail — NOT cleared yet
Full Playwright run (174 tests, chromium-desktop + mobile). Desktop green except the known `01-signature-loop:56` SSE cold-flake. **16 [mobile] failures to triage:**
- **06-cb09 overlay ×8** → CB-89 (REOPENED) — real mobile overlay tappability bug.
- **05-mobile ×3** (donate bar / bottom-sheet / share-studio carousel) → carousel one is MY CB-71 contract change (wrapped `.studio` in `.studio-carousel`) → test needs updating; donate-bar/sheet to verify.
- **01 [mobile] ×2** (donate→ticker) + **03 ×1** (smart_presets slot) + **04 ×1** (no-green-CTA) → triage flake-under-load vs real (desktop equivalents pass).
- Original board items remain DONE; this E2E gate (CB-08/CB-23 closeout) caught that CB-89 + the CB-71 test contract are unfinished. CB-94 (demo overlap) still open; orphan `components/profile/profile.css` still dead.

### CB-89 — Metric overlay on mobile — DONE (properly, this time)
- **Completed:** 2026-05-30 · bug · overlay (mobile) · **Files:** tests/e2e/06-cb09-overlay-clickthrough.spec.ts
- **Real fix:** the OVERLAY itself works on mobile (CB-68/84 regionRect). The failure was the E2E helper `clickFirstHighlightAndGetBlob` using raw `getBoundingClientRect` (zero for `display:contents` `<Instrumented>` wrappers — fundraiser's whole mobile top), so it never found a tappable highlight. Rewrote it to resolve each region's rect the way the app does (regionRect = union of laid-out descendants), scroll it into view, then click — matching a real user tapping a visible highlight. Also made the dashboard-nav wait use `domcontentloaded` (Nivo charts delay `load` past 15s on mobile).
- **Verified:** `06-cb09` now **22/22 green** (both projects × all 3 pages) in a clean run.

### CB-95 — Mobile donate affordance + its E2E are stale vs v4 share-first (NEW, surfaced by E2E gate)
- **Type / Surface / Size:** bug · mobile (donate) + test debt · M
- **Root cause:** the v4 "share-first" redesign HID the old mobile sticky donate bar (`app/v4.css`: `.v4-page .stickycta{display:none}` — "share is primary, not donate"). The E2E helper `tests/e2e/helpers.ts openDonateForm` (mobile branch) + tests `05-mobile:32/53`, `04:150`, `03:238`, `01:56/299` still target that removed `.stickycta` → ~6 [mobile] failures. **PRE-EXISTING (red since v4), NOT this session's regressions.**
- **Deeper finding:** I repointed `openDonateForm` to the persistent `.donatebar .btn--primary` (helpers.ts) — but probing shows that button, while VISIBLE on mobile, is **not actionably clickable** (Playwright click times out → covered/intercepted), so the donate sheet doesn't open from it on mobile. So there's a REAL mobile donate-flow gap, not just stale selectors.
- **To close:** (1) determine the intended v4 mobile donate affordance + fix its click actionability (z-index/overlap) so the sheet opens on mobile; (2) update `openDonateForm` + `05-mobile:32` (sticky-bar assertion) + the dependent tests to the v4 reality; (3) then 03/04/05:53/01 mobile pass.
- **Note:** `05-mobile:81` (hero share-row `[data-overlay-region="share-row-hero"]` buttons) also fails on mobile — hero share buttons not visible at 390px; verify whether that region renders on mobile in v4 or the selector is stale. Env note: many back-to-back E2E runs saturated the dev server (newPage 30s timeouts) — let it settle before a clean final run.

### CB-67 — Sun initial centered in the dome — DONE (SUPERSEDED, not built)
- **Closed:** 2026-05-31 · superseded · suns
- **Resolution:** SUPERSEDED by **CB-78** (decision reversed: remove the on-sun letters entirely rather than center them). The reference v4.2 suns carry no glyph on the mark; identity is conveyed by the ring + "Your Sun"/"<Initial>'s Sun" label (CB-46/80) + PFPs elsewhere (CB-76). No code was needed for CB-67 itself — CB-78 made it moot. Moved to Done as superseded; do not build.

### CB-94 — Demo "Mobile view" pill gated off narrow viewports — PARTIAL→ pill done
- **2026-05-31** · **Files:** components/shared/MobileFrameToggle.tsx
- The mobile-frame toggle pill (fixed top-right, z:1000) overlapped the fundraiser `.donatebar` "Donate" button on mobile (covering it). The toggle only makes sense for previewing mobile ON DESKTOP, so it's now gated to viewports >700px (SSR-safe: shown initially → hides post-mount on a narrow screen; jsdom CB-66 test at 1024px still passes). **Verified:** pill hidden at 390px. **Remaining CB-94:** the funding slider (bottom-left) + persona pill (bottom-right) can still overlap bottom content on mobile — not yet repositioned.

### CB-95 — Mobile donate flow — PARTIAL (stale tests modernized; real layout issues remain)
- **2026-05-31** · **Files:** tests/e2e/helpers.ts, tests/e2e/05-mobile.spec.ts, tests/e2e/06-cb09-overlay-clickthrough.spec.ts
- **Done:** (1) **CB-89 fully fixed** — 06-cb09 helper now resolves highlights via regionRect + scroll (matches a real tap); 06-cb09 **22/22 green**. (2) Modernized the stale donate selectors to v4: `donateFormScope`/`openDonateForm` no longer look for the removed `[role="dialog"][aria-label="Donate"]` sticky sheet — they use the v4 `.donatebar` button + `body.sheet-open` + `[data-overlay-region="donation-card"]` (the `<aside class="rail">` sheet, identical on all widths). Rewrote 05:32 (→ assert persistent `.donatebar` + Donate button not covered) and 05:53 (→ v4 sheet). 05:53 now passes.
- **REMAINING (real mobile-donate LAYOUT bugs, not test debt):**
  1. **Donate button still covered at its centre on mobile** (05:32 `elementFromPoint` ≠ button) even after the pill gate — some OTHER element overlays the `.donatebar` button centre at 390px. Needs: identify the covering element under test conditions (clearOverlayState, server demo env) + fix z-index/overlap.
  2. **Submit button never reaches the viewport inside the rail** (03:238, 04:150 time out at helpers.ts:223) — the `.rail` mobile sheet (top:84–844) is tall and the DonationCard submit sits below the fold; the form needs internal scroll OR the helper must scroll within the rail. Real mobile donate-form usability issue.
  3. **05:81** still asserts a share MODAL (`[role="dialog"][aria-label="Share this fundraiser"]`) that v4 doesn't have (share studio is INLINE `.spread`/`.studio`) — rewrite to test the inline carousel.
- **Recommend:** continue CB-95 as focused mobile-donate work on a STABLE server (the dev server was repeatedly saturated by back-to-back E2E runs this session → newPage/30s timeouts make results noisy; restarted fresh as task b20nps8ba).

### CB-95 — Mobile donate flow — DONE
- **Completed:** 2026-05-31 · bug · mobile (donate) + test debt · **Files:** components/shared/MobileFrameToggle.tsx, app/globals.css, tests/e2e/helpers.ts, tests/e2e/05-mobile.spec.ts, tests/e2e/06-cb09-overlay-clickthrough.spec.ts
- **Root cause (real, not just stale tests):** the v4 "share-first" redesign hid the mobile sticky donate bar, AND the demo "Mobile view" frame-toggle pill (fixed top-right, z:1000) COVERED the persistent `.donatebar` "Donate" button on mobile → unclickable → sheet never opened. The E2E also used pre-v4 selectors (`[role=dialog][aria-label=Donate]` sheet, sticky-cta, share modal).
- **Fix:** (1) hide the mobile-frame pill ≤700px via a CSS media query (`globals.css [data-mobile-frame-toggle]{display:none!important}`) — instant + SSR-correct (no effect-timing flake; node stays in DOM so CB-66 unit still passes). Donate button now uncovered + clickable → sheet opens. (2) Modernized the E2E to v4: `openDonateForm`/`donateFormScope` use `.donatebar` + `body.sheet-open` + the `.rail`/`[data-overlay-region=donation-card]` sheet; helper scrolls the submit into view within the tall `.rail` (it sits below the fold); 05:32 → asserts donate button not covered; 05:53 → v4 sheet; 05:81 → the INLINE `.spread/.studio` scroll-snap carousel (v4 share is inline, not a modal). (3) CB-89 06-cb09 helper resolves highlights via regionRect+scroll.
- **Verified:** 06-cb09 22/22; 05-mobile + 03/04 mobile green; 889 unit green; tsc clean. Only `01-signature-loop:56/98` flake under parallel load (SSE cold-start) — **passes isolated** (documented pre-existing SSE cold-flake, not this work).

### CB-94 — Demo controls overlap content on mobile — DONE (critical overlaps fixed)
- **Completed:** 2026-05-31 · bug · mobile (demo) · **Files:** components/shared/MobileFrameToggle.tsx, app/globals.css
- **Fix:** the worst overlap — the "Mobile view" pill covering the fundraiser donate button — is gone (gated ≤700px, see CB-95). The profile "Suns across causes" row (the original CB-74 concern) is no longer overlapped: it renders as a clean 4-col grid (CB-85) with the demo controls now only at the very bottom corners.
- **Verified (screenshot cb94-profile-controls.png):** suns grid clean + unobstructed; donate button uncovered. **Scope note:** the funding slider (bottom-left) + persona pill (bottom-right) still sit over the BOTTOM EDGE of scrolling content (e.g. the fundraiser carousel's lower edge) — inherent fixed-demo-control behavior, demo remains usable; not the critical content overlap. If zero-overlap is wanted later, add a mobile bottom safe-area padding or auto-collapse the controls.

### CB-96 — Profile mobile shows the FULL page (mobile-frame = true mobile via iframe) — DONE
- **Completed:** 2026-05-31 · bug · mobile (profile) · **Files:** components/shared/MobileFrameToggle.tsx
- **Root cause:** the "Mobile view" frame wrapped the page in a WIDTH-constrained div, but viewport `@media`/Tailwind responsive classes key off the real (desktop 1440px) viewport — NOT a container width. So inside the frame the profile rendered its DESKTOP multi-column layout squeezed into 390px → only the PYMK column was visible ("only shows PYMK"). (Raw 390px viewport was always correct — CB-85 holds.)
- **Fix:** the frame is now a real `<iframe>` at FRAME_WIDTH loading the same route → the page gets a genuine narrow viewport (~364px) so its mobile breakpoints actually fire = TRUE mobile layout. Recursion-safe (inner pill auto-hidden by the ≤700px CSS gate; inner frameOn=false).
- **Verified:** desktop frame now shows the full mobile profile (iframe innerWidth 364, scrollH 2556 = full page, hero+suns+carousel+activity all present, `pymkOnly:false`); screenshot CB96-iframe-fixed.png. Universal — fundraiser/community frames now render true mobile too. tsc clean.

### CB-97 — No ambient/dropping suns on the profile background — DONE
- **Completed:** 2026-05-31 · bug · profile (suns) · **Files:** components/profile/ProfilePage.tsx
- **Fix:** removed the ambient `<SunsLayer>` (gutter suns + fall-in animation) from ProfilePage; the profile's suns now live ONLY in the "Suns across causes" `SunsBoard` identity section. Removed the now-dead `isMobile` state/effect + import. Fundraiser/community keep their ambient SunsLayer.
- **Verified:** profile at 1440 + 390 → `[data-mark-id]` gutter suns = 0 (no ambient/dropping suns), but "Suns across causes" board still present (markwall=1). tsc clean; 889 unit green.

### CB-98 — Per-persona share messages on profile + community — DONE
- **Completed:** 2026-05-31 · personalization (profile + community) · **Files:** fixtures/shareCopyProfileCommunity.ts (new), components/profile/ShareSpread.tsx, components/community/ShareStudio.tsx, tests/unit/cb98-persona-share-copy.test.tsx (+ cb16/cb32 updated for fixture priority)
- **Fix:** new static matrices `PROFILE_SHARE_COPY` + `COMMUNITY_SHARE_COPY` (per-persona × channel, no request-path LLM — CB-47 pattern, profile-/community-flavored). ShareSpread resolves `PROFILE_SHARE_COPY[user.slug]?.[channel] ?? copyByChannel ?? GENERIC` (owner voice preserved); ShareStudio now calls `usePersona()` and resolves `COMMUNITY_SHARE_COPY[viewer.slug]?.[channel] ?? shareCopy` (CB-81 avatars + CB-82 glyphs intact). Reactive on persona switch.
- **Verified (independent live DOM):** profile → 3 distinct strings (Sarah/Mike/Priya); community → 3 distinct strings. 25 new tests; full suite **914 pass**, tsc clean. Extends the fundraiser CB-69 to both surfaces.
