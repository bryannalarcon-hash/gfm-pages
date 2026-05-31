# Landing Slide Deck — Design Spec

**Route:** `/`  
**Role:** Portfolio entry point — explains the project, introduces the demo's features, and links out to the four interactive surfaces.  
**Status:** Mid-fi spec (ASCII sketches + token-keyed component anatomy). Not pixel mockups.

---

## 1. Header + Scope

**What this is.** A single-page slide deck that a grader or portfolio viewer lands on first. It sets context, makes the thesis legible in under two minutes, and hands off to the four interactive surfaces. It is not a GFM clone; it is about the redesign of one.

**What it inherits visually.** Same design-system tokens as the three redesigned pages — GoFundMe Sans, `#232323` near-black, `#4a9d44` green, 8px spacing base, fully-pill buttons. The editorial treatment is more spacious (larger type, more vertical air) than a GFM product page, but the palette and typeface are identical. A viewer scrolling between this deck and the demo pages sees no jarring shift.

**Token imports used throughout:**
- Typeface: `--hrt-font-family: "GoFundMe Sans", Trebuchet, Helvetica, Arial, sans-serif`
- Display type: `--hrt-size-font-display-lg` (48–82px fluid), `--hrt-size-font-display-md` (40–64px)
- Body: `--hrt-size-font-body-md` (16px), `--hrt-size-font-body-sm` (14px), `--hrt-size-font-body-xs` (12px)
- Colors: `#232323` text/CTA, `#4a9d44` brand accent, `#ccf88e` light-green pill bg, `#f5f5f5` subtle bg
- Spacing: 8px base unit (`--hrt-size-spacing-1` = 8px)
- Radii: `--hrt-size-radius-full` (pill), `--hrt-size-radius-xxxl` (24px card corners)
- Shadows: `--hrt-shadow-medium` (cards)

**Intentionally out.** Auth, payment flows, i18n, native apps, dark mode, pixel-precise coords.

**No green CTA on white.** Primary CTA buttons on white backgrounds use `#232323` bg + `#fff` text (`--hrt-color-button-primary-surface`). Green (`#4a9d44`) is atmospheric — progress gradients, brand accents, icon fills — not buttons on white.

---

## 2. Page Mechanics

**Full-bleed scenes.** Each scene occupies 100vw × 100dvh (CSS `min-height: 100dvh`). Scenes stack vertically in the DOM; scroll-snap brings them into view.

**Scroll-snap navigation (desktop + tablet).**
```css
scroll-snap-type: y mandatory;   /* on the scroll container */
scroll-snap-align: start;        /* on each scene */
scroll-behavior: smooth;
```
Arrow-key support: `ArrowDown` / `ArrowUp` advance / retreat one scene. `Home` / `End` jump to first / last. A keyboard-accessible skip link at the top of the DOM ("Skip to demo") jumps to Scene 6 with a single Tab + Enter.

**Mobile.** `scroll-snap-type` degrades gracefully — scenes are still full-bleed but free-scroll with momentum on iOS/Android. Scene dot indicators become touch targets that `scrollIntoView()` the target scene.

**Reduced motion.** All entrance animations (fade-up, number count-up) are wrapped in `@media (prefers-reduced-motion: reduce)` — they render static with no motion when the user has opted out.

**Page URL.** `/` — the root. No separate route needed; the deck IS the landing page.

**Overlay pill on the landing.** YES — the overlay pill appears here. A viewer who lands on `/` should discover the overlay feature immediately, not only after navigating to a demo page. The pill shows *"👤 Anonymous · ▾"* in its closed state; opening it reveals the overlay toggle and persona switcher. If the viewer toggles the overlay on while on `/`, the pill pulses but no highlights appear (the landing has no `data-overlay-*` regions). This is correct behavior — it primes the viewer to look for the highlights when they enter the actual pages.

---

## 3. The 7 Scenes

### Scene 1 — The Hook

**One sentence, the meta-idea.**

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   [progress bar — 1px, top edge, #4a9d44, scene-1/7 fill]       │
│   [scene dots — top-right, 7 dots, dot-1 filled]                │
│   [skip-to-demo — top-right, text link]                         │
│                                                                  │
│                                                                  │
│   ┌──────────────────────────────────────────────┐              │
│   │  GoFundMe Sans display-lg, #232323, center   │              │
│   │                                              │              │
│   │  A GoFundMe redesign that explains itself.   │              │
│   │                                              │              │
│   │  Toggle the overlay — every UI choice is     │              │
│   │  tied to a metric and a research finding.    │              │
│   └──────────────────────────────────────────────┘              │
│                                                                  │
│   [primary CTA: "Enter the demo" → Scene 6 or /f/...]           │
│   [secondary link: "How we got here ↓" → scroll to Scene 2]     │
│                                                                  │
│   [down-caret scroll cue, animate bob, #6f6f6f]                 │
│                                                                  │
│   [overlay pill: "👤 Anonymous · ▾" — fixed bottom-right]       │
└──────────────────────────────────────────────────────────────────┘
```

**Components.**
- Headline: `--hrt-size-font-display-lg` (fluid 48–82px), `font-weight: 175` (bold axis), `#232323`, centered, max-width 640px, `letter-spacing: -0.02em`
- Sub-line: `--hrt-size-font-body-lg` (20–24px), `#6f6f6f`, `font-weight: 100`
- Primary CTA: pill button, `bg #232323`, `color #fff`, `border-radius: --hrt-size-radius-full`, `min-height: --hrt-size-spacing-6` (48px), `padding-x: --hrt-size-spacing-3` (24px)
- Secondary link: body-md, `#4a9d44`, underline on hover
- Scene bg: `#fff`; a faint `#ccf88e` radial glow (20% opacity) centers behind the headline as an atmospheric brand accent

**Animation.** On scene-enter: headline fades up 24px (0.5s ease-out); sub-line follows 0.1s later; CTA appears at 0.6s. Reduced-motion: static, no fade.

**Mobile.** Headline drops to `--hrt-size-font-display-sm` (28–40px). CTA is full-width. Scroll cue stays.

**Source docs.** Assignment brief (the meta-idea of a self-explaining redesign); `design-overlay.md`.

---

### Scene 2 — The Problem

**What the assignment actually asks for.**

```
┌──────────────────────────────────────────────────────────────────┐
│   [progress bar — 2/7 fill]  [dots — dot-2 filled]              │
│                                                                  │
│   EYEBROW (body-xs, #4a9d44, uppercase, tracking 0.08em):        │
│   "The Brief"                                               │
│                                                                  │
│   HEADLINE (display-md, #232323):                                │
│   "GoFundMe wants to be a destination."                          │
│                                                                  │
│   ┌──────────────────────────────────────────────┐              │
│   │ BRIEF CALLOUT CARD  (#f5f5f5 bg, radius-xxxl)│              │
│   │                                              │              │
│   │ Redesign Profile, Fundraiser, and Community  │              │
│   │ pages as a more engaging destination where   │              │
│   │ like-minded people support loved ones and    │              │
│   │ unite around causes.                         │              │
│   │                                              │              │
│   │ Impact metrics: Repeat Visits · Donate ·     │              │
│   │ Share · Follow                               │              │
│   └──────────────────────────────────────────────┘              │
│                                                                  │
│   METRIC TREE MINI (4 output nodes, horizontal):                │
│   [Repeat Visits]  [Donate]  [Share]  [Follow]                  │
│   each: pill, #ccf88e bg, #274a34 text, radius-full             │
│                                                                  │
│   BODY COPY (body-md, #6f6f6f):                                  │
│   "These four are interdependent — sharing acquires visitors,    │
│    following brings them back, donating is the core conversion." │
└──────────────────────────────────────────────────────────────────┘
```

**Components.**
- Brief callout card: `bg #f5f5f5`, `border-radius: --hrt-size-radius-xxxl` (24px), `padding: --hrt-size-spacing-4` (32px), `--hrt-shadow-soft`
- Metric pills: `bg #ccf88e`, `color #274a34`, `border-radius: --hrt-size-radius-full`, `font-size: --hrt-size-font-body-sm`, `padding: 4px 16px` (on-grid; was 4px 12px — token-conformance fix)
- Eyebrow: body-xs, `color #4a9d44`, uppercase, `letter-spacing: 0.08em`

**Content / copy.** Direct quote paraphrase from `assignment_description.md`. Impact metrics listed verbatim.

**Animation.** Scene-enter: card fades up; metric pills stagger in left-to-right (0.1s apart).

**Mobile.** Card at full width. Metric pills wrap.

**Source docs.** `assignment_description.md`, `strategy-metrics-research.md` §2 (loop thesis).

---

### Scene 3 — What We Learned About GFM

**The research-intelligence beat.**

```
┌──────────────────────────────────────────────────────────────────┐
│   [progress bar — 3/7 fill]  [dots — dot-3 filled]              │
│                                                                  │
│   EYEBROW: "Reverse Engineering"                                 │
│                                                                  │
│   HEADLINE (display-sm, #232323):                                │
│   "GFM is already running A/B tests on the exact                 │
│    surfaces we redesigned."                                      │
│                                                                  │
│   SUB-HEAD (body-lg, #6f6f6f):                                   │
│   "We didn't invent the hypotheses — we stress-tested            │
│    them against their live experiment data."                     │
│                                                                  │
│   THREE HERO NUMERALS (display-md, #232323):                     │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│   │   126    │  │  1,111   │  │    4     │                      │
│   │ events   │  │  flags   │  │ live A/Bs│                      │
│   └──────────┘  └──────────┘  └──────────┘                      │
│   (count-up animation on enter; each numeral = display-md)       │
│                                                                  │
│   STACK CALLOUT CARD (same card style as Scene 2):               │
│   "GFM's stack: Optimizely (flags) · GrowthBook (stats)          │
│    Amplitude (readout) · mParticle (CDP) · Braze (email)         │
│    Snowflake (warehouse)"                                        │
│                                                                  │
│   BODY COPY (body-md, #6f6f6f):                                  │
│   "4 of 4 live A/B tests are in the donation funnel.             │
│    amp24 and amp25 are live experiments on AI-generated share    │
│    text. Every delta in this redesign maps to a confirmed bet."  │
└──────────────────────────────────────────────────────────────────┘
```

**Components.**
- Hero numeral: `--hrt-size-font-display-md` (40–64px), `font-weight: 175`, `#232323`; sub-label in `body-xs`, `#6f6f6f`; each numeral + label in a ghost card with `border: 1px solid #efefef`, `border-radius: --hrt-size-radius-xxl` (20px)
- Stack callout: same `#f5f5f5` card; monospace sub-text for event/flag names uses `--hrt-font-family-mono`, body-xs, `#6f6f6f`
- Count-up animation (126, 1111, 4): number ticks up over 0.8s on scene-enter; reduced-motion skips

**Mobile.** Numerals stack 1-column; card at full width.

**Source docs.** `gfm-observed-metrics.md` (126 events, 1,111 flags, 4 A/Bs); `gfm-analytics-stack-public.md` (Snowflake, GrowthBook, Amplitude, mParticle, Braze).

---

### Scene 4 — The Redesign Deltas (28)

**Metric tree visual + what changed + the five ★ bets.**

```
┌──────────────────────────────────────────────────────────────────┐
│   [progress bar — 4/7 fill]  [dots — dot-4 filled]              │
│                                                                  │
│   EYEBROW: "The Redesign"                                        │
│                                                                  │
│   HEADLINE (display-sm, #232323): "33 deltas. One loop."         │
│                                                                  │
│   METRIC TREE MINI (centered, 3-tier):                           │
│   North Star: "Meaningful sessions/user/week"                    │
│     ├─ Donate Conv.   ├─ Share Rate   ├─ Follow Rate             │
│     └─ Repeat Visits                                             │
│   (Tier 1 nodes: #ffd863 bg label; Tier 2: #4a9d44 bg label)    │
│                                                                  │
│   THREE-PAGE SUMMARY ROW (3 cards, horizontal):                  │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│   │Fundraiser│  │Community │  │ Profile  │                      │
│   │ 12 Δ     │  │  7 Δ     │  │  9 Δ    │                      │
│   └──────────┘  └──────────┘  └──────────┘                      │
│                                                                  │
│   FIVE STAR BETS (list, icon ★ in #ffd863):                      │
│   ★ Follow first-class — 2× visit frequency                     │
│   ★ Share at emotional/milestone beats, per-channel             │
│   ★ Post-donate as a second conversion surface                  │
│   ★ Sub-2.5s LCP non-negotiable (+8–21% conversion)             │
│   ★ Instrument rates, not pageviews                             │
│                                                                  │
│   GFM-CONFIRMED DELTAS (body-sm, #232323):                       │
│   "Also GFM-confirmed: the donor-list momentum prompt + the      │
│    inline recurring nudge — the two donate-funnel surfaces GFM    │
│    is actively A/B testing alongside the five above."            │
│                                                                  │
│   DIFFERENTIATOR NOTE (body-sm, #6f6f6f):                        │
│   "Visual identity: inherited from GFM. Differentiation:         │
│    information architecture + instrumentation + personalization." │
└──────────────────────────────────────────────────────────────────┘
```

**Components.**
- Page-summary cards: `bg #fff`, `border: 1px solid #efefef`, `border-radius: --hrt-size-radius-xxl`, `padding: --hrt-size-spacing-3`, `--hrt-shadow-soft`; delta count in `display-sm`, `#232323`; label in body-xs, `#6f6f6f`
- Metric tree: inline SVG or Nivo-lite render; node labels body-xs; tier-1 node labels get `bg #ffd863` (`--hrt-color-surface-tip-medium`), tier-2 get `bg #ccf88e` (`--hrt-color-surface-brand-medium`)
- Star bets list: star icon in `#ffd863`; copy in body-md, `#232323`

**Delta count: 33** (re-baselined from 28 on 2026-05-29 when the Suns cluster was folded in). Fundraiser: D1–D10, D12, D13 = 12 (D11 folded into D3). Community: C1–C7 = 7. Profile: P1–P9 = 9. Cross-page **Suns: S1–S5 = 5** (the contribution board / `mocks/` v4.2). Total = **33 numbered deltas**. The cross-page integration section remains a *structural clause* that binds the three pages, not an independent delta — it has no per-page surface of its own.

**Mobile.** Page-summary cards stack vertically. Star-bets list stays.

**Source docs.** `strategy-metrics-research.md` §2 (metric tree, five ★ bets), `fundraiser-redesign.md`, `community-redesign.md`, `profile-redesign.md`.

---

### Scene 5 — The Demo Features

**What makes this a teaching artifact.**

```
┌──────────────────────────────────────────────────────────────────┐
│   [progress bar — 5/7 fill]  [dots — dot-5 filled]              │
│                                                                  │
│   EYEBROW: "Demo Features"                                       │
│                                                                  │
│   HEADLINE (display-sm, #232323):                                │
│   "Two features that make this a teaching artifact."            │
│                                                                  │
│   FEATURE CARD A (left half on desktop, full-width on mobile):  │
│   ┌────────────────────────────────────────┐                     │
│   │  FEATURE NUMERAL: "1"  (display-md)    │                     │
│   │                                        │                     │
│   │  THE METRIC OVERLAY                    │ ← heading-md        │
│   │                                        │                     │
│   │  An L3.5 personalization layer makes   │                     │
│   │  every UI element annotatable. Toggle  │                     │
│   │  the pill — each instrumented surface  │                     │
│   │  reveals its event, metric, and the    │                     │
│   │  research that backs the choice.       │                     │
│   │                                        │                     │
│   │  Example (overlay ON, a Donate CTA):   │                     │
│   │  ┌────────────────────────────────┐    │                     │
│   │  │ [Donate $50] (tier-1 outline)  │    │                     │
│   │  │   │                            │    │                     │
│   │  │   ▼ tap → blob:                │    │                     │
│   │  │   Event: Donate Completed      │    │                     │
│   │  │   Tier: Core Conversion        │    │                     │
│   │  │   Why: M+R 2025 — fewer fields │    │                     │
│   │  │       lifts completion +39%    │    │                     │
│   │  │   Dashboard: Donate Funnel ↗   │    │                     │
│   │  └────────────────────────────────┘    │                     │
│   │                                        │                     │
│   │  [Tier 1 swatch: #ffd863] Core conv.   │                     │
│   │  [Tier 2 swatch: #4a9d44] Loop/retain  │                     │
│   └────────────────────────────────────────┘                     │
│                                                                  │
│   FEATURE CARD A2 (sub-card under A — persona switcher gets       │
│                    its own billing, not a one-liner):            │
│   ┌────────────────────────────────────────┐                     │
│   │  THE PERSONA SWITCHER                  │ ← heading-md        │
│   │                                        │                     │
│   │  The overlay pill expands into a menu  │                     │
│   │  with 6 personas. Switching the active │                     │
│   │  persona re-renders every L3.5 slot —  │                     │
│   │  banner, smart presets, "what you      │                     │
│   │  missed" feed, PYMK panel, recurring   │                     │
│   │  nudge — without changing layout.      │                     │
│   │                                        │                     │
│   │  Same page. Same overlay annotations.  │                     │
│   │  Completely different content.         │                     │
│   └────────────────────────────────────────┘                     │
│                                                                  │
│   FEATURE CARD B (right half on desktop):                        │
│   ┌────────────────────────────────────────┐                     │
│   │  FEATURE NUMERAL: "2"  (display-md)    │                     │
│   │                                        │                     │
│   │  BEFORE / AFTER TOGGLE                 │ ← heading-md        │
│   │                                        │                     │
│   │  A toggle on each page switches in-    │                     │
│   │  place between the current GFM layout  │                     │
│   │  and our redesign. The diff is visible │                     │
│   │  without navigating away.              │                     │
│   │                                        │                     │
│   │  Sub-toggle on Fundraiser:             │                     │
│   │  "Show personalized share copy" —      │                     │
│   │  generic vs LLM-generated text         │                     │
│   └────────────────────────────────────────┘                     │
│                                                                  │
│   PERSONA AVATAR ROW (6 avatars, horizontal):                    │
│   Anonymous · Close friend · Extrovert · Shared · Lapsed · Owner │
└──────────────────────────────────────────────────────────────────┘
```

**Components.**
- Feature cards: `bg #fff`, `border: 1px solid #efefef`, `border-radius: --hrt-size-radius-xxxl`, `padding: --hrt-size-spacing-4`, `--hrt-shadow-medium`; feature numeral in `--hrt-size-font-display-md`, `#ccf88e` colored
- Tier swatches: 12px circles (inline `border-radius: 50%`) beside tier label
- Persona avatar row: 40px circles, persona-colored backgrounds (resolved DS-anchored values — see Persona Avatar Row component primitive below; all colors trace to `gfm-design-system.md`), first-initial or generic icon, horizontal scroll on mobile
- Feature heading: `--hrt-size-font-heading-md`, `font-weight: 175`, `#232323`

**Mobile.** Cards stack vertically. Avatar row scroll-snaps horizontally.

**Source docs.** `design-overlay.md`, `design-personas.md`, `strategy-personalization.md`, `fundraiser-redesign.md` D9 (share copy sub-toggle).

---

### Scene 6 — The Demo Entry

**Four prominent CTA tiles.**

```
┌──────────────────────────────────────────────────────────────────┐
│   [progress bar — 6/7 fill]  [dots — dot-6 filled]              │
│                                                                  │
│   EYEBROW: "Explore the Demo"                                    │
│                                                                  │
│   HEADLINE (display-sm, #232323):                                │
│   "Pick a surface and look for the overlay pill."               │
│                                                                  │
│   FOUR CTA TILES (2×2 grid on desktop, 1-col on mobile):        │
│   ┌─────────────────────┐  ┌─────────────────────┐              │
│   │  FUNDRAISER         │  │  COMMUNITY          │              │
│   │                     │  │                     │              │
│   │  /f/realtime-alerts │  │  /communities/      │              │
│   │  -for-wildfire-     │  │  watch-duty         │              │
│   │  safety-r5jkk       │  │  Watch for: the     │              │
│   │                     │  │  Follow CTA + value │              │
│   │  Watch for: the     │  │  prop; the "Since   │              │
│   │  single-screen      │  │  last visit" feed   │              │
│   │  donate form + the  │  │  divider; PYMK with │              │
│   │  welcome-back banner│  │  inline Follow      │              │
│   │                     │  │                     │              │
│   │  [button: Enter →]  │  │  [button: Enter →]  │              │
│   └─────────────────────┘  └─────────────────────┘              │
│   ┌─────────────────────┐  ┌─────────────────────┐              │
│   │  PROFILE            │  │  DASHBOARD          │              │
│   │                     │  │                     │              │
│   │  /u/janahan         │  │  /dashboard         │              │
│   │                     │  │                     │              │
│   │  Watch for: the     │  │  Watch for: live    │              │
│   │  Follow microcopy;  │  │  event ticker, the  │              │
│   │  the "what you      │  │  donate funnel,     │              │
│   │  missed" feed + the │  │  cohort retention   │              │
│   │  recurring nudge    │  │  grid, session      │              │
│   │                     │  │  replay surface     │              │
│   │  [button: Enter →]  │  │  [button: Enter →]  │              │
│   └─────────────────────┘  └─────────────────────┘              │
│                                                                  │
│   HINT (body-sm, #6f6f6f, center):                               │
│   "Tip: try switching personas in the overlay pill to see how    │
│    personalization changes each surface."                        │
└──────────────────────────────────────────────────────────────────┘
```

**Components.**
- CTA tiles: `bg #fff`, `border: 1px solid #efefef`, `border-radius: --hrt-size-radius-xxxl`, `padding: --hrt-size-spacing-4`, `--hrt-shadow-medium`, hover state: `border-color #4a9d44`, `--hrt-shadow-strong`
- Tile heading: `--hrt-size-font-heading-lg`, `font-weight: 175`, `#232323`
- Route slug: body-xs, `#4a9d44`, monospace (`--hrt-font-family-mono`)
- "Watch for" copy: body-sm, `#6f6f6f`
- Tile CTA button: pill, `bg #232323`, `color #fff`, full-width within tile, `min-height: --hrt-size-spacing-5` (40px)
- Dashboard tile is visually differentiated: `bg #232323` tile background, `color #fff` copy — dark inversion to signal it is a different kind of surface

**Mobile.** 1-column stack; tiles at full width; button at bottom of each.

**Source docs.** `assignment_description.md` (the three page URLs), `design-dashboard.md`, `design-overlay.md`, `design-personas.md`.

---

### Scene 7 — Stack + What's Next

**Locked tech choices and the honest future-work line.**

```
┌──────────────────────────────────────────────────────────────────┐
│   [progress bar — 7/7 fill]  [dots — dot-7 filled]              │
│                                                                  │
│   EYEBROW: "Under the Hood"                                      │
│                                                                  │
│   HEADLINE (display-sm, #232323): "One platform, five tools."   │
│                                                                  │
│   STACK ROW (5 pills, horizontal, center):                       │
│   [Next.js 14+] [Railway] [PostHog] [Postgres + pgvector]        │
│   [Claude API]                                                   │
│   — each pill: bg #f5f5f5, #232323 text, radius-full, body-sm   │
│                                                                  │
│   ONE-LINE SUMMARY (body-md, #6f6f6f):                           │
│   "Railway hosts the Next.js app, the Postgres + pgvector DB,   │
│    and the LLM batch worker. PostHog is the analytics layer —    │
│    funnels, flags, replay, and the custom /dashboard page.       │
│    Claude API generates share copy + update summaries at create  │
│    time; all LLM calls are cached, none are on the request path."│
│                                                                  │
│   WHAT'S NEXT (body-md, #232323, heading-xs label):              │
│   Heading: "Future work"                                         │
│   • Organizer next-best-action reactivation                      │
│     (GFM's manage_nba_habit_loop flag)                           │
│   • Real session replay via rrweb (dashboard W9 is mocked)       │
│   • GrowthBook upgrade path for experiment statistics            │
│     (mirrors GFM's actual stats engine)                          │
│                                                                  │
│   CLOSING LINE (body-lg, #232323, center, before footer):        │
│   "The overlay is the argument. Every design decision in this    │
│    deck is one tap away from its evidence."                      │
│                                                                  │
│   FOOTER LINKS (body-sm, #4a9d44, horizontal, center):           │
│   Source code · Technical docs · AI usage log · Demo video      │
│                                                                  │
│   PERSISTENT FOOTER (below all 7 scenes, fixed):                 │
│   same four links always visible at bottom of the deck           │
└──────────────────────────────────────────────────────────────────┘
```

**Components.**
- Stack pills: `bg #f5f5f5`, `color #232323`, `border-radius: --hrt-size-radius-full`, body-sm, `padding: 8px 16px` (on-grid; was 6px 16px — token-conformance fix), `border: 1px solid #efefef`
- Future-work list: `--hrt-size-font-body-md`, `color #232323`, bulleted; heading label body-xs uppercase `#6f6f6f`
- Footer links: body-sm, `color #4a9d44`, underline on hover; horizontal with `·` separator; spacing `--hrt-size-spacing-3`

**Mobile.** Stack pills wrap. Future-work list stays.

**Source docs.** `strategy-tech-stack.md` (locked decisions), `design-dashboard.md` (W9 rrweb note), `gfm-analytics-stack-public.md` (GrowthBook), `profile-redesign.md` (NBA reactivation flag).

---

## 4. Cross-Cutting Chrome

These elements are present at all times regardless of scene.

**Scene indicator dots — top-right, fixed.**
Seven dots in a vertical column. Active dot: `bg #232323`, diameter 10px. Inactive: `bg #b7b7b6` (disabled border token), 8px. Each dot is a `<button>` with `aria-label="Go to scene N"` and triggers `scrollIntoView`. `z-index` above scenes, below the overlay pill.

**Skip-to-demo button — top-right, alongside dots.**
Text link: *"Skip to demo →"* — body-xs, `#6f6f6f`, no border. Scrolls to Scene 6. Keyboard-accessible via Tab; appears in focus with `outline: 2px solid #232323`.

**Progress bar — 1px top edge, full-width.**
`bg #4a9d44` (`--hrt-color-surface-brand`); width percentage = (current scene index / 7) × 100. Transitions `width 0.3s ease`.

**Overlay pill.**
YES — present on the landing. See Section 2 rationale. Pill renders in its closed `"👤 Anonymous · ▾"` state. Opening expands the overlay/persona menu. No highlights appear on `/` (no `data-overlay-*` regions), so the overlay toggle has no visual effect on the landing — this is correct and expected behavior. The pill serves as discovery affordance before the viewer reaches the actual pages.

---

## 5. Component Primitives

The deck introduces four components that do not exist in the three redesigned pages.

### Hero Numeral

A large count displayed inside a ghost card. Used in Scene 3.

```
anatomy:
  container: display flex, flex-direction column, align-items center
             border: 1px solid #efefef
             border-radius: --hrt-size-radius-xxl (20px)
             padding: --hrt-size-spacing-3 --hrt-size-spacing-4
             bg: #fff
  numeral:   --hrt-size-font-display-md (40–64px fluid)
             font-weight: 175 (bold)
             color: #232323
             letter-spacing: -0.02em
  sub-label: --hrt-size-font-body-xs (12px)
             color: #6f6f6f
             font-weight: 100
             margin-top: --hrt-size-spacing-half (4px)
behavior:
  count-up animation (0 → target) over 0.8s on scene enter
  prefers-reduced-motion: renders final value immediately
```

### Quote Callout

A styled passage card for the assignment brief or key research quote. Used in Scene 2.

```
anatomy:
  container: bg #f5f5f5
             border-radius: --hrt-size-radius-xxxl (24px)
             padding: --hrt-size-spacing-4 (32px)
             --hrt-shadow-soft
             max-width: 640px
  body-text: --hrt-size-font-body-md (16px), color #232323, line-height 1.5
  attribution (optional): body-xs, #6f6f6f, margin-top spacing-2
```

### Metric Tree Mini-Card

Inline node used in the three-tier metric tree. Used in Scenes 2 and 4.

```
anatomy:
  label pill: border-radius: --hrt-size-radius-full
              padding: 4px 12px
              font-size: --hrt-size-font-body-xs (12px)
              font-weight: 175
  tier-1 (core conversion): bg #ffd863 (--hrt-color-surface-tip-medium)
                             color #68570d (--hrt-color-text-tip)
  tier-2 (loop/retention): bg #ccf88e (--hrt-color-surface-brand-medium)
                            color #274a34 (--hrt-color-text-brand-strong)
  padding: 4px 16px (on the 8px grid — fixed from 4px 12px)
  connector: 1px solid #b7b7b6 (--hrt-color-border-neutral)
```

### Big CTA Tile

The four demo-entry tiles in Scene 6.

```
anatomy:
  container: bg #fff (or #232323 for dashboard tile)
             border: 1px solid #efefef (or none for dark variant)
             border-radius: --hrt-size-radius-xxxl (24px)
             padding: --hrt-size-spacing-4 (32px)
             --hrt-shadow-medium
             hover: border-color #4a9d44, --hrt-shadow-strong, transition 0.15s
  page-name: --hrt-size-font-heading-lg (24–28px), font-weight 175
             color: #232323 (or #fff for dark variant)
  route-slug: --hrt-size-font-body-xs (12px), --hrt-font-family-mono
              color: #4a9d44 (or #ccf88e for dark variant)
  watch-for:  --hrt-size-font-body-sm (14px), color #6f6f6f (or #b7b7b6)
  cta-button: pill, bg #232323 (or bg #fff, color #232323 for dark variant)
              full-width, min-height --hrt-size-spacing-5 (40px)
              position: bottom of the tile (mt: auto in flex column)
```

### Persona Avatar Row

Horizontal row of six persona avatars with names. Used in Scene 5.

```
anatomy:
  row: display flex, gap --hrt-size-spacing-2, overflow-x auto, scroll-snap-type x mandatory
  per-avatar:
    circle: 40px × 40px, border-radius --hrt-size-radius-full
    bg: persona-specific — DS-anchored (matches design-personas.md):
          anonymous       = #f5f5f5 (--hrt-color-surface-neutral-subtle) with #6f6f6f border
          close_friend    = #ffd863 (--hrt-color-surface-tip-medium, warm gold) / initial color #68570d
          extrovert       = #ccf88e (--hrt-color-surface-brand-medium, electric green) / initial #274a34
          shared_by_extro = #f5f5f5 with #4a9d44 border / initial #6f6f6f
          returning_lapsed = #e9fcce (--hrt-color-surface-brand-subtle, faded green) / initial #274a34
          profile_owner   = #232323 (--hrt-color-text-default, near-black) / initial #fff
    label: persona name, body-xs, #6f6f6f, center, margin-top 4px
```

---

## 6. Coverage Check

| Requirement | Where it lives |
|---|---|
| All 33 deltas summarized | Scene 4: breakdown (12 F + 7 C + 9 P + 5 cross-page Suns) |
| Five ★ bets named | Scene 4: star-bets list with verbatim names |
| L3.5 personalization framing | Scene 5: overlay feature card A; persona avatar row |
| Overlay + personas explained | Scene 5: both feature cards in full; Scene 1 overlay-pill note |
| Dashboard introduced | Scene 6: dashboard CTA tile with "what to look for" copy |
| Tech stack listed | Scene 7: stack pill row with all five tools named |
| Cross-page integration story | Scene 4: differentiator note (IA + instrumentation + personalization as shared contract across all 3 pages) |
| Assignment brief quoted | Scene 2: brief callout card |
| GFM analytics extraction (126 events / 1,111 flags / 4 A/Bs) | Scene 3: hero numerals |
| GFM stack benchmarked against | Scene 3: stack callout card |
| No green CTA on white | Enforced throughout: all CTAs on white use `#232323`; `#4a9d44` used for links and atmospheric accent only |
| ≤ 450 lines | This spec: within limit |

**Resolved items (post-verifier):**

1. ✓ **Delta count = 33** (12 fundraiser + 7 community + 9 profile + 5 cross-page Suns; cross-page integration remains a structural clause, not an independent delta). Rendered slides show feature **names**, never raw delta IDs (`D#/C#/P#/S#` are internal tracking only); the overlay blob likewise drops the raw delta badge.
2. ✓ **Scene 6 community URL = `/communities/watch-duty`** (matches assignment + real GFM URL; build routing should serve this path).
3. ✓ **Footer links** — Source code / Technical docs / AI usage log / Demo video. Technical docs added per assignment line 82 requirement. Actual URLs (GitHub, Loom) fill in at build time; placeholder-safe.

**Pre-deploy blocker (NOT a TODO):**

4. **GoFundMe Sans CDN cross-origin policy.** The deck loads `cdn.gofundme.com/fonts/GoFundMeSans-Variable.woff2` from a third-party CDN. **Test in the Railway deployment environment EARLY** — not at launch. If the CDN rejects the request via CORS, the deck falls back to Trebuchet, breaking the visual-identity-continuity-with-GFM claim made in Section 1. Pre-deploy verification required; do not treat as a launch-day finishing item.
