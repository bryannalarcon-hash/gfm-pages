# Fundraiser Page — Mid-Fidelity Wireframe

**What this is:** Component-level wireframe translating the 12 deltas (D1–D10, D12, D13)
into concrete page regions, component specs, copy templates, and interactions using actual
GFM tokens from `gfm-design-system.md`.

**Inherits:** GFM visual identity — GoFundMe Sans, `#232323` primary button, `#4a9d44`
brand green, 8px spacing base, fully-pill buttons (`border-radius: 624.9375rem`).

**Intentionally out:** pixel-precise coords, auth/sign-in flows, payments backend, i18n,
native apps, dark mode.

**L3.5 constraint:** Structure identical for all users; only named content slots adapt
(D8 banner, D9 share copy, D10 presets, D13 summary).

---

## Breakpoints + Grid

| Name    | Viewport   | Columns | Container max-width       |
|---------|-----------|---------|--------------------------|
| Desktop | ≥1024px   | 12-col  | 72rem (1152px)           |
| Tablet  | 768–1023px | 8-col  | 64rem (1024px)           |
| Mobile  | ≤767px    | 4-col   | 100% − `spacing-3` sides |

Desktop: story col (8/12, fluid) + sticky right rail (4/12, max 380px).
Mobile: single column; sticky bottom-sheet CTA replaces rail.

> **Note on 380px:** the right-rail max-width is a layout constraint, **not** a `--hrt-size-spacing-*` token (the design system's spacing scale ends at 240px / `--hrt-size-spacing-30`). 380px is chosen deliberately to keep the donation card comfortably narrower than the fluid main column while remaining wide enough for the preset row + payment form at body-md type. Flagged for the build pass; not a token violation.

---

## Page Layout Overview

```
DESKTOP                               MOBILE
┌─────────────────────────────────┐   ┌──────────────────┐
│ GLOBAL NAV                      │   │ NAV (hamburger)  │
├─────────────────────────────────┤   ├──────────────────┤
│ [D8/D13] RETURNING BANNER       │   │ D8/D13 BANNER    │
├──────────────────┬──────────────┤   ├──────────────────┤
│ HERO             │ DONATION     │   │ HERO             │
│ [D1 D2 D4 D5]    │ CARD (sticky)│   │                  │
│                  │ [D1 D10 D12] │   ├──────────────────┤
├──────────────────┤              │   │ STORY            │
│ STORY            │              │   ├──────────────────┤
├──────────────────┤              │   │ DONOR ACTIVITY   │
│ DONOR ACTIVITY   │              │   ├──────────────────┤
│ [D6]             │              │   │ UPDATES          │
├──────────────────┤              │   ├──────────────────┤
│ UPDATES [D4 D13] │              │   │ FOOTER           │
├──────────────────┴──────────────┤   ├──────────────────┤
│ FOOTER                          │   │ STICKY CTA [D1]  │
└─────────────────────────────────┘   └──────────────────┘
```

---

## Per-Region Detail

### R1. Global Navigation Header

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo]  Search[__]  Donate▾  Fundraise▾  About▾  Sign in   │
│                                    [Start a GoFundMe]       │
└─────────────────────────────────────────────────────────────┘
```

**Components:** Logo SVG `fill="currentColor"`. Nav dropdowns body-sm `#232323`.
"Start a GoFundMe": primary pill (`bg #232323`, `text #fff`, `border-radius: 624.9375rem`,
`min-height: spacing-5` 40px, `padding-x: spacing-3` 24px).

**Behavior / content:** All nav links KEEP AS-IS. Sign-in OUT OF SCOPE.

**Overlay:** No delta. **Mobile:** hamburger icon 24px; logo left-aligned.

---

### R2. Returning-Visitor Banner (D8 + D13)

```
┌─────────────────────────────────────────────────────────────┐
│  Welcome back, [first name]. Sarah posted: [D13 summary] →  │
└─────────────────────────────────────────────────────────────┘
```

**Components:** Full-width slim banner. `bg: #e9fcce` (`--hrt-color-surface-brand-subtle`).
Body-sm (14px), `font-weight: 100`, `color: #274a34`. Arrow link `#4a9d44`.
Height `spacing-5` (40px). `padding-x: spacing-3`. Rendered SSR (zero CLS).

**Content slots (L3.5):**
- D8: `"Welcome back, [first name]. [Organizer] posted: [D13 summary]."` — collapses
  to zero height for anonymous / first-time visitors (no fallback copy).
- D13: 1-line LLM summary generated at update-create time, cached.
  Example: `"the alert system is now live in 3 counties — 4,200 households covered."`

**Behavior:** "→" link smooth-scrolls to Updates. Collapses if no update since last visit.

**Overlay:** Tier 2 (green): D8, D13. **Mobile:** 1-line truncated with ellipsis.

**Before/after:** BEFORE = no banner. AFTER = slim personalized banner (D8 + D13).

---

### R3. Hero Region

```
┌─────────────────────────────────────────────────────────────┐
│  [Hero image 16:9, border-radius 16px]                      │
│                                                             │
│  Campaign Title  (heading-lg, #232323, weight 175)          │
│  [Avatar 32px] Organized by [Name] · Beneficiary [Name]     │
│  [Community badge pill — collapses if no community_id]      │
│                                                             │
│  ████████████████░░░  78%   ←── D2 progress bar            │
│  $23,400 raised of $30,000  ·  1,247 donations              │
│  [D2 ≥80%:] "$6,600 to go"  (body-sm, #232323, weight 175) │
│                                                             │
│  [Donate]      [Follow this fundraiser]                     │
│  [FB] [WA] [X] [MSG] [SMS] [Email] [Link]  ← D4 share row  │
│  [N] followers  (body-xs, #6f6f6f)                         │
└─────────────────────────────────────────────────────────────┘
```

**Components:**
- Hero image: `border-radius: --hrt-size-radius-xl` (16px), SSR priority (D7 LCP ≤2.0s).
- Title: `--hrt-size-font-heading-lg` (24–28px fluid), weight 175, `color: #232323`,
  `letter-spacing: -0.01em`.
- Avatar: 32px circle `border-radius: 624.9375rem`, `bg: #ccf88e`, `color: #274a34`.
- Community badge: pill `bg: #e9fcce`, `color: #274a34`, `border-radius: 624.9375rem`,
  `padding: spacing-half spacing-1`. Hidden (zero height) if no `community_id`.
- **D2 progress bar:** height 8px, fill `linear-gradient(90deg, #acf86c, #4a9d44 93.27%)`,
  track `#2323230d`, `border-radius: 624.9375rem`. At ≥80%: `"$[X] to go"` callout;
  count-up animation on hydration: `0.50s cubic-bezier(0.3,0.01,0,1)`.
- **D1 Donate CTA:** `bg #232323`, `text #fff`, `border-radius: 624.9375rem`,
  `min-height: spacing-6` (48px), `padding-x: spacing-3`. Desktop: focuses rail card.
  Mobile: opens bottom-sheet.
- **D5 Follow button:** secondary pill, `border: 1px solid #b7b7b6`, `bg: transparent`,
  `text: #232323`. Microcopy below: body-xs `#6f6f6f`:
  `"Get an email when [organizer_name] posts an update."` + `"[N] followers"`.
- **D4 hero share row:** 24px filled icons `#6f6f6f`. Tap → ShareSheet modal.
  D9: prefilled text is LLM-generated per channel (cached at fundraiser-create time).

**Behavior:** Follow → optimistic state "Following", fires `Follow Clicked (follow_context: sidebar)`.
Share icons fire `Share Clicked (share_context: hero, share_channel: [ch])`.
D2 count-up disabled if `prefers-reduced-motion`.

**Overlay:** Tier 1 (warm-red): D1, D2. Tier 2 (green): D4, D5. Guardrail: D7 (SSR/LCP).

**Mobile:** Donate + Follow stack vertically (full-width). Share row scrolls horizontally.

**Before/after:** BEFORE = off-page multi-step donate, heart icon (no label), static
progress bar, generic share. AFTER = D1 on-page card, D5 labeled Follow + follower count,
D2 `$X to go` callout + count-up, D4 per-channel share with D9 AI copy.

---

### R4. Story Region

```
┌─────────────────────────────────────────────────────────────┐
│ [Avatar 32px]  [Organizer Name]  ·  [date]                  │
│ Story narrative body-md #232323 line-height 1.5             │
│ [truncated at ~4 lines]   [Read more ▾]                     │
│                                                             │
│ [Donate]  ← secondary inline CTA (D1)                      │
└─────────────────────────────────────────────────────────────┘
```

**Components:** Body-md (16px), `line-height: 1.5`, `#232323`. "Read more": ghost link
body-sm `#4a9d44`. Inline Donate: secondary pill same specs as R3 (triggers D1 form).
Story Share removed per D4 (not one of 3 retained surfaces).

**Behavior:** "Read more" KEEP AS-IS. Donate fires `Donate Intent (cta_location: story)`.

**Overlay:** Tier 1 (warm-red): D1. **Before/after:** story Share present → removed (D4).

---

### R5. Donation Card — Right Rail (desktop) / Bottom-Sheet (mobile)

```
Desktop rail card (max-width 380px, sticky, top: spacing-3):
┌───────────────────────────────────┐
│ [D10]  [$25]  [$50✓] [$100]       │  ← 3 preset pills; mid selected
│        [Custom amount ________]   │
│                                   │
│ [D12] "Watch Duty needs ongoing   │
│  support. Make this $50/month?"   │
│  ○ One-time   ● Monthly           │
│                                   │
│  GFM tip: [15%▾] = $7.50          │
│                                   │
│  [Card ___________][MM/YY][CVC]   │
│  [Name on card ________________]  │
│  [Email ______________________]   │
│                                   │
│  [─────── Donate $50 ──────────]  │
│  Guest checkout · 🔒 Stripe        │
└───────────────────────────────────┘
```

**Components:**
- Card container: `border-radius: --hrt-size-radius-xxxl` (24px), `bg: #fff`,
  `border: 1px solid #efefef`, `box-shadow: 0px 2px 6px #0000001a`, `padding: spacing-3`.
- **D10 preset pills (L3.5):** secondary pill buttons. Selected state: `bg #232323`,
  `text #fff`, `border-color: #232323`. Middle preset default-selected.
  First-timer: `$10 / $25 / $50`. Repeat donor: `$[last] / $[mid] / $[high]`.
- Custom input: `border-radius: --hrt-size-radius-md` (8px), `border: 1px solid #b7b7b6`.
- **D12 recurring nudge:** `bg: #f5f5f5`, `border-radius: --hrt-size-radius-lg` (12px),
  `padding: spacing-1 spacing-2`. Body-sm `#232323`. Radio-style toggle:
  `[One-time | Monthly]`, default One-time. On Monthly: preset labels add `/month`.
  **P9 skip rule (cross-page):** if the page is loaded with `referrer_source = profile_recurring_nudge` (the user clicked Profile P9's "Set up recurring" CTA), the D12 inline-nudge block is hidden — the user already opted in upstream and the form opens in `frequency: monthly` mode with the corresponding preset selected. Skip is determined SSR from the referrer URL parameter; no flash of the nudge before hiding.
- Tip selector: dropdown, body-sm. No phone field. Guest checkout default (D1, ≤5 fields).
- **Primary Donate CTA:** full-width pill, `bg #232323`, `text #fff`, body-md weight 175,
  `min-height: spacing-6` (48px). Label updates live: `"Donate $[amount]"` /
  `"Donate $[amount]/month"`.
- Skeleton (D7): 3 pill placeholders + 3 input placeholders, `bg: #f5f5f5`, pill radius.

**Events:** `Amount Selected` on preset/blur (with `selection_type`, `frequency`).
D12 toggle fires `Amount Selected (frequency: monthly)`. Submit → `Donate Started` →
`Donate Completed`/`Donate Failed`. On success → Post-Donate Screen.

**Mobile bottom-sheet (D1):** Sticky bar fixed bottom, height `spacing-7` (56px),
`bg #fff`, `box-shadow: 0px -2px 6px #0000001a`, `border-top: 1px solid #efefef`.
Tap expands full-screen sheet: `border-radius: spacing-3 spacing-3 0 0` (24px top corners),
drag handle (40px × 4px, `bg #b7b7b6`). Back-swipe does NOT clear form state.

**Overlay:** Tier 1 (warm-red): D1, D10, D12. Guardrail: D7 (skeleton).

**Before/after:** BEFORE = off-page multi-step, static presets, no recurring nudge.
AFTER = single-screen card (D1), smart presets (D10), inline recurring nudge (D12).

---

### R6. Donor Activity (D6)

```
┌─────────────────────────────────────────────────────────────┐
│  Donations  (heading-sm, weight 175)   1,247 donors         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ D6 Contextual prompt (bg #f5f5f5, radius 12px)        │  │
│  │ "47 people donated in the last hour — keep it going"  │  │
│  │                              [Donate now →]           │  │
│  └───────────────────────────────────────────────────────┘  │
│  [avatar] Jane D. · $50 · "Go Watch Duty!"                  │
│  [avatar] Anonymous · $25                                   │
│  [avatar] Mark S. · $100 · "Amazing work."                  │
│  [See all donations ▾]  [See top donations ▾]              │
└─────────────────────────────────────────────────────────────┘
```

**D6 prompt states (resolved SSR):**
- High momentum: `"[N] people donated in the last hour — keep it going"`
- Slow momentum: `"Be the first to donate today"` / `"Help [Organizer] reach the goal"`
- Near goal (≥80%): `"$[X] to go — [N] donors got us here"`

**Components:** Donor count: heading-sm weight 175 `#232323`. Prompt block: body-sm `#232323`,
`bg: #f5f5f5`, `border-radius: --hrt-size-radius-lg` (12px), `padding: spacing-2`.
Inline Donate: text link `#4a9d44` body-sm weight 175. Donor rows: avatar 32px, body-sm.
"See all/top": secondary pill buttons. Skeleton: 3 row stubs `bg: #f5f5f5` (D7).

**Overlay:** Tier 1 (warm-red): D6. Guardrail: D7 (skeleton).

**Before/after:** BEFORE = donor list only, no prompt, no count. AFTER = D6 prompt + count.

---

### R7. Updates (D4, D13 echo)

```
┌─────────────────────────────────────────────────────────────┐
│  Updates  (heading-sm, weight 175)                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ [Avatar 32px] Sarah J.  ·  May 26                   │    │
│  │ "The alert system is now live in 3 counties…"       │    │
│  │ [Read full update ▾]                                │    │
│  │ [FB] [WA] [X] [MSG] [SMS] [Email] [Link] ← D4      │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**Components:** Update card: `border-radius: --hrt-size-radius-xxxl` (24px), `bg #fff`,
`border: 1px solid #efefef`, `padding: spacing-3`. Body-md `#232323` `line-height: 1.5`.
Truncated at 3 lines; "Read full update" ghost link `#4a9d44`.
**D4 post-update share row:** same 24px icon row. Fires `Share Clicked (share_context: update)`.
D9 AI copy applies to channel prefill. D13: update body is source for D8 banner — no
additional UI here; the summary slot lives entirely in R2.

**Overlay:** Tier 2 (green): D4, D13. **Mobile:** share row scrolls horizontally.

**Before/after:** BEFORE = no per-channel share under updates. AFTER = D4 share row.

---

### R8. Footer + Sticky Mobile CTA Bar

**Footer:** KEEP AS-IS. 4-column grid. Brand socials (FB, YouTube, Twitter, Instagram),
product links, about links, legal links. Blog links (8 articles): CUT.
Body-xs `#6f6f6f`. Logo `bg: #4a9d44`.

**Sticky CTA Bar (mobile, D1):** Fixed bottom, `height: spacing-7` (56px), `bg: #fff`,
`box-shadow: 0px -2px 6px #0000001a`, `border-top: 1px solid #efefef`.
Full-width minus `spacing-2` per side primary pill: `"Donate"`. Share removed per D4.

**Overlay:** Tier 1 (warm-red): D1 on sticky bar.

---

## D3 Post-Donate Screen (new surface)

Triggers immediately on `Donate Completed`. Replaces `lb_postdonate_share` lightbox.

```
┌──────────────────────────────────────────────────────────┐
│  [X close]                                               │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ [Thumbnail 80px radius-xl]                         │  │
│  │ "Your $50 funds 10 days of wildfire alerts."       │  │
│  │ "Welcome back, Bryann. Your 2nd donation."         │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  SHARE THIS FUNDRAISER                                   │
│  [FB] [WA] [X] [MSG] [SMS] [Email] [Link]               │
│  [Show personalized copy ▾]  ← D9 demo sub-toggle       │
│                                                          │
│  MAKE IT MONTHLY                                         │
│  "Watch Duty needs ongoing support. $50/month?"         │
│  [Upgrade to $50/month]     [No thanks]                 │
│                                                          │
│  FOLLOW THIS FUNDRAISER                                  │
│  [Follow [Campaign]]                                     │
│  "Get an email when Sarah posts an update."             │
│                                                          │
│  [if community_id present:]                              │
│  ─────────                                               │
│  STAY CONNECTED TO THE CAUSE                             │
│  [Also follow Watch Duty (Community)]                    │
│  "Get updates from related fundraisers too."            │
│  (hidden if no community_id; collapses to zero height)  │
│                                                          │
│  YOU MIGHT ALSO SUPPORT                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ [Card 1] │  │ [Card 2] │  │ [Card 3] │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│  ← embedding-ranked (D3/D11); fallback: top-3 category │
└──────────────────────────────────────────────────────────┘
```

**Components:**
- Full-screen overlay `position: fixed`, bg `#fff`, `border-radius: --hrt-size-radius-xxxl`
  (24px) top corners on tablet+. Max-width 560px centered.
- **Impact block:** `bg: #e9fcce`, `border-radius: --hrt-size-radius-xxl` (20px),
  `padding: spacing-3`. Thumbnail 80px, `border-radius: --hrt-size-radius-xl` (16px).
  Primary line: heading-md (20–24px fluid), weight 175, `#232323`. Secondary: body-sm `#6f6f6f`.
- **Share row:** 24px icons. Fires `Post Donate Share Clicked`. D9 sub-toggle: body-xs
  text link `#4a9d44` opens side-by-side generic vs AI copy preview (demo visibility fix).
- **Recurring upgrade (D3 + D12):** heading-sm. Upgrade: primary pill `bg #232323`.
  "No thanks": text link body-sm `#6f6f6f`. Fires `Post Donate Recurring Upgrade Clicked`.
- **Follow (D5):** secondary pill. Fires `Post Donate Follow Clicked`.
- **Community-follow CTA (cross-page contract; conditional on `community_id`):** secondary pill labeled `"Also follow [Community]"`, placed in its own sub-section under `STAY CONNECTED TO THE CAUSE`. Hidden (zero height) if the fundraiser has no `community_id`. On click → writes a community follow edge AND closes the post-donate screen with a confirmation toast. Fires `Post Donate Community Follow Clicked` with `community_id` property. Receive-side: when a user arrives on the community page via this CTA, `Page Viewed` fires with `referrer_source = post_donate_community_follow`; the community hero shows a warm-arrival sub-head: *"Welcome — you just supported [Fundraiser] in this community."*
- **Carousel (D3/D11):** 3 × fundraiser card default size: `border-radius: --hrt-size-radius-xxl`
  (20px), `border: 1px solid #efefef`. Horizontal scroll mobile. Fires `Post Donate Similar Clicked`.

**Copy strategy:**
- Primary: `"Your $[amount] funds [N] [units] of [cause]."`
- Fallback: `"Your $[amount] brings [Organizer] $[delta] closer. [N] donors got here together."`
- Goal-crossing: `"Your $[amount] helped [Organizer] hit the goal — [pct]% funded, [N] donors."`
- Returning: prepend `"Welcome back, [first name]. Your [Nth] donation."`

**Overlay:** Tier 1 (warm-red): D3 (screen), D12 (recurring block).
Tier 2 (green): D4 (share row), D5 (follow), D3/D11 (carousel).

**Mobile:** Full-screen sheet. All sections stack. Carousel horizontal scroll. CTAs full-width.

---

## Component Primitive Specs

### Buttons

| Variant | BG | Text | Border |
|---------|----|------|--------|
| Primary (on white) | `#232323` | `#fff` | transparent |
| Primary (on strong/green) | `#ccf88e` | `#274a34` | transparent |
| Secondary / Ghost | transparent | `#232323` | `1px solid #b7b7b6` |

All: `border-radius: 624.9375rem`. `padding-x: spacing-3` (24px).
Large `min-height: spacing-6` (48px). Medium `min-height: spacing-5` (40px).
Body-md (16px), `font-weight: 175`. Primary hover: `bg #585858`.

**Follow CTA Variant Rule (cross-page).** Follow uses *Secondary / Ghost* on the **fundraiser** page (where Donate is the page's primary action — a primary Follow would compete with Donate visually). Follow uses *Primary (on white)* on the **community** and **profile** pages (where Follow IS the page's primary action — no Donate primary competing on the hero). This is a deliberate weight-matching pattern, not an inconsistency. Microcopy beneath the button is required on all three pages; copy is per-page contextual ("Get an email when [organizer] posts an update" / "...when new fundraisers are added or milestones are hit" / "...when [Name] organizes or donates").

### Cards

| Size | Outer radius | Border | Shadow |
|------|-------------|--------|--------|
| Default (fundraiser) | 20px (`--hrt-size-radius-xxl`) | transparent → `#efefef` hover | none |
| Medium (updates, post-donate) | 24px (`--hrt-size-radius-xxxl`) | `1px solid #efefef` | `0px 2px 6px #0000001a` |
| Condensed (donor row) | 16px (`--hrt-size-radius-xl`) | none | none |

Card `bg: #fff`. Content `padding: spacing-2` (16px).

### Progress Bar
8px height. Track `#2323230d`. Fill `linear-gradient(90deg, #acf86c, #4a9d44 93.27%)`.
`border-radius: 624.9375rem`. D2 count-up: `0.50s cubic-bezier(0.3,0.01,0,1)`.

### ShareSheet
`border-radius: --hrt-size-radius-xxxl` (24px) top corners. `bg #fff`.
`box-shadow: 0px 6px 14px #0000001a`. Icon grid 4-per-row, 24px icons, body-xs labels.
Channels: Facebook, X, WhatsApp, Messenger, SMS, Email, Copy link, Print, Embed,
Nextdoor, More. D9 sub-toggle in header row.

### StickyCTABar (mobile)
`position: fixed; bottom: 0`. Height `spacing-7` (56px). `bg #fff`.
`border-top: 1px solid #efefef`. `box-shadow: 0px -2px 6px #0000001a`.
Full-width primary pill inside `spacing-2` gutters.

### Toast (D2 milestone)
`position: fixed; bottom: spacing-3; left: 50%; transform: translateX(-50%)`.
`bg #232323`, `color #fff`, `border-radius: 624.9375rem`, `padding: spacing-1 spacing-2`.
Body-sm weight 175. Auto-dismiss 4s. Fires at 25/50/75/90% funded thresholds.
Copy: `"[Campaign] just crossed [N]% funded — share to help finish."` + Share CTA.

### Tier Badges (overlay)
- Tier 1 core conversion: `bg: #ffd863`, `color: #68570d`, pill, body-xs weight 175.
- Tier 2 loop/retention: `bg: #ccf88e`, `color: #274a34`, pill, body-xs weight 175.
- Guardrail: `bg: #e9e9e9`, `color: #6f6f6f`, pill, body-xs weight 175.

> **Global overlay pill + persona-switcher menu** anatomy lives in `design-overlay.md`. Six demo personas + per-slot render expectations in `design-personas.md` (e.g. D8 banner / D10 smart presets / D3 carousel all swap content when the persona changes; this page's layout does not).

### Modal / Skeleton
Modal backdrop: `rgba(35,35,35,0.6)`. Panel: `border-radius: --hrt-size-radius-xxxl` (24px),
`box-shadow: 0px 6px 14px #0000001a`, `padding: spacing-4` (32px), max-width 560px.

Skeleton: `bg: #f5f5f5`, opacity pulse 0.5→1→0.5 over 1.5s. Applied to donor list rows,
update cards, similar-fundraiser cards, preset buttons on initial mount (D7).

---

## Coverage Check

**All 12 deltas realized:** D1 → R5 + R3/R4/R8 CTAs. D2 → R3 progress bar. D3 → Post-Donate
Screen. D4 → R3 hero + R7 updates + ShareSheet; story/sticky share removed. D5 → R3 + D3
post-donate. D6 → R6 donor activity. D7 → R3 SSR/LCP + R5/R6 skeletons (guardrail).
D8 → R2 banner. D9 → ShareSheet all surfaces + D3 demo sub-toggle. D10 → R5 donation card.
D12 → R5 + D3 recurring block. D13 → R2 banner slot (update summary source).

**All 18 CHANGED BY features placed:** Donate (hero/story/sticky/list) → D1.
Progress bar → D2. Post-donate lightbox → D3 screen. Share (hero) → D4; Share
(story/sticky) → D4 REMOVED. See all/top donations → D6. Share (FB/X/WA/MSG/SMS/Email/AI-text)
→ D9. Follow → D5. Presets → D10. Recurring nudge → D12.

**All 45 KEEP AS-IS features placed:** Header nav → R1. Gallery/story/organizer links → R3/R4.
Donor list comments → R6. Share (copy-link/print/embed/Nextdoor/more) → ShareSheet.
Calendar links, organizer scroll, report → story/organizer section. All 18 footer links → R8.

**OUT OF SCOPE:** Sign-in (R1), Cookie Preferences (R8) — scope boundary per design doc.

**CUT:** Blog links (8 articles) absent from footer. Justified in `fundraiser-feature-parity.md`.
