# Profile Page — Mid-Fidelity Wireframe
**Page:** `gofundme.com/u/janahan`
**Scope:** Redesign deltas P1–P9 over GFM's current profile. Visual identity from `gfm-design-system.md`. Layout is L3.5: structure fixed, content slots adapt, every slot has an anonymous/first-time fallback.

---

## 2. Breakpoints and Grid

| Context | Layout | Max-width | Gutter |
|---|---|---|---|
| Desktop (≥1024px) | Two-column: main rail (left) + right rail (right) | 72rem (1152px) via `.hrt-container.xl` class — note: there is no `--hrt-container-xl` CSS custom property in the design system; the 72rem max-width is applied via the class | `--hrt-size-spacing-3` 1.5rem |
| Tablet (768–1023px) | Single-column; right rail collapses below fold | 100% | `--hrt-size-spacing-2` 1rem |
| Mobile (<768px) | Single-column | 100% | `--hrt-size-spacing-2` 1rem |

**Desktop column split:** main rail ~66% (`~720px`), right rail ~30% (`~336px`), gap `--hrt-size-spacing-3`.
**Above-the-fold target (1366×768):** Avatar + name + Follow CTA + cause pills + ≥1 carousel card all visible without scroll.

---

## 3. Page Layout Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  GLOBAL NAV  [GFM logo] [Search] [Donate] [Fundraise] [Sign in] │
└─────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────┬──────────┐
│  HERO (gradient backdrop, full-width)                │         │
│  [Avatar 96px] Janahan Selvarajah                    │  RIGHT  │
│  142 followers · 38 following                        │  RAIL   │
│  [Follow] [Share]                                    │         │
│  "Get updates when Janahan organizes or donates."    │  PYMK   │
│  [ANIMALS] [ENVIRONMENT] [ARTS_AND_CULTURE]          │  PANEL  │
│  Organizing since 2015 · 3 fundraisers               │  (20    │
│  [bio nudge: owner-only]                             │  cards) │
├──────────────────────────────────────────────────────┤         │
│  STICKY HEADER (on scroll) [Avatar-sm] Janahan [Follow]│        │
├──────────────────────────────────────────────────────┤         │
│  CAROUSEL  [< prev]  [Card1] [Card2] [Card3]  [next >]│        │
├──────────────────────────────────────────────────────┤         │
│  P9 RECURRING NUDGE (conditional)                    │         │
│  "You've supported Janahan 3 times — monthly gift?"  │         │
├──────────────────────────────────────────────────────┤         │
│  TAB BAR  [Activity ●] [About]                       │         │
├──────────────────────────────────────────────────────┤         │
│  ACTIVITY TAB (default)                              │         │
│  ┌ Since your last visit — 4 new  [collapse ▲] ────┐ │         │
│  │  UPDATED · PUBLISHED · DONATED rows             │ │         │
│  └──────────────────────────────────────────────── ┘ │         │
│  [older activity rows …]                             │         │
├──────────────────────────────────────────────────────┤         │
│  FOOTER                                              │         │
└──────────────────────────────────────────────────────┴─────────┘
```

---

## 4. Per-Region Detail

### 4.1 Global Navigation

Global shell. KEEP AS-IS per parity rows 2–9. Mobile: hamburger drawer.

---

### 4.2 Hero

```
┌─────────────────────────────────────── hero backdrop gradient ──┐
│                                                                  │
│  ┌──────┐  Janahan Selvarajah                                    │
│  │ 96px │  142 followers · 38 following                         │
│  │avatar│                                                        │
│  └──────┘  [  Follow  ]  [Share profile]                        │
│            "Get updates when Janahan organizes or donates."      │
│                                                                  │
│            [ANIMALS]  [ENVIRONMENT]  [ARTS_AND_CULTURE]          │
│            Organizing on GoFundMe since 2015 · 3 fundraisers     │
│                                                                  │
│            [owner-only: "Add a bio to help followers know        │
│             what you stand for."  Complete profile →]            │
└──────────────────────────────────────────────────────────────── ┘
```

**Components + tokens:**
- Avatar: 96px circle, `border-radius: --hrt-size-radius-full`, bg `--hrt-color-surface-brand-medium` (#ccf88e) with initials in `--hrt-color-text-brand-strong` (#274a34), `--hrt-font-weight-bold` (175)
- Name: `--hrt-size-font-heading-lg` (1.5–1.75rem fluid), `--hrt-color-text-headings` (#232323)
- Counts: `--hrt-size-font-body-sm` (0.875rem), `--hrt-color-text-supporting` (#6f6f6f), tappable links
- Follow button (primary, on white): bg `--hrt-color-button-primary-surface` (#232323), text `#fff`, `border-radius: --hrt-size-radius-full`, min-height `--hrt-size-spacing-6` (48px) [P1 — Tier 2 green badge]
- Share button (secondary): border `--hrt-color-button-secondary-border` (#b7b7b6), text #232323 [P8 — Tier 2]
- Microcopy (P1): `--hrt-size-font-body-xs` (0.75rem), `--hrt-color-text-supporting` (#6f6f6f), directly below Follow button
- Cause pills (P3): bg `--hrt-color-surface-brand-medium` (#ccf88e), `border-radius: --hrt-size-radius-full`, text `--hrt-color-text-brand-strong` (#274a34), `--hrt-size-font-body-xs` (0.75rem), padding `--hrt-size-spacing-1` × `--hrt-size-spacing-2` [P3 — Tier 1 warm-red badge]
- Tenure line (P6): `--hrt-size-font-body-xs` (0.75rem), `--hrt-color-text-supporting` (#6f6f6f) [P6 — Tier 2 trust signal badge]
- Bio nudge (P3 owner-only): `--hrt-size-font-body-sm` (0.875rem), `--hrt-color-text-informative` (#185b93), slim inline prompt

**Content / copy:**
- Follow microcopy: "Get updates when [Name] organizes or donates." (anonymous/first-time: shown always)
- Follow microcopy (follower state): "Following — you'll hear about new activity."
- Cause pills: max 3; zero fallback (row collapses, no empty row)
- Tenure line: "Organizing on GoFundMe since [year] · [N] fundraisers" — only shown for 2+ fundraisers
- Bio nudge: "Add a bio to help followers know what you stand for." — owner-only, links to existing wizard

**Behavior:**
- Follow button toggles to "Following" state; microcopy swaps to follower variant
- Share button opens share sheet with per-channel AI copy (P8); WhatsApp/X/email/Facebook
- Cause pills: read-only for viewers; owner can edit via complete-profile wizard
- Bio nudge collapses to zero for non-owners and owners who already have a bio
- CUT: "Learn more people inspired" tooltip (parity row 23) — replaced by P1 microcopy

**Overlay annotations:** [P1 Tier-2], [P3 Tier-1], [P6 Tier-2 trust], [P8 Tier-2]
**Mobile variant:** Stack vertical. Avatar centered. Follow + Share stacked full-width. Pills wrap. Tenure below pills. Bio nudge below tenure.
**Before/After toggle:** Before = Follow button with no microcopy, no cause pills in hero, no tenure line. After = microcopy line + cause pills + tenure line added.

---

### 4.3 Sticky Scroll Header

```
┌─────────────────────────────────────────────────────────────────┐
│  [32px avatar]  Janahan Selvarajah          [Follow] [Share]    │
└─────────────────────────────────────────────────────────────────┘
```

32px avatar, name body-md, compact Follow + Share buttons; bg `--hrt-color-surface-raised` (#fff), `--hrt-shadow-soft`. Appears on scroll past hero. KEEP AS-IS (parity row 26). Mobile: full-width.

---

### 4.4 Fundraiser Carousel

```
┌────────────────────────────────────────────────────────────────┐
│ [<]  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐ │
│      │  [img 3:2]     │  │  [img 3:2]     │  │  [img 3:2]  │ │
│      │ Keep Sandy on  │  │ Saving Eliza   │  │ Andy Ritchie│ │
│      │ Ossabaw        │  │                │  │             │ │
│      │ ████████████── │  │ ██████─────── │  │ ████████████│ │
│      │ 102% · $12,450 │  │ 52% · $5,200  │  │ 102% · $8.1k│ │
│      │ Goal reached — │  │ $4,800 to go  │  │ Goal reached│ │
│      │ still accepting│  │               │  │ still accept│ │
│      └────────────────┘  └────────────────┘  └─────────────┘  [>]
│                           ○ ● ○                                 │
└────────────────────────────────────────────────────────────────┘
```

**Components + tokens:**
- Card outer: `--hrt-size-radius-xxl` (1.25rem), bg `--hrt-color-surface-raised` (#fff), border `1px solid --hrt-color-border-neutral-extra-subtle` (#efefef)
- Image: aspect-ratio 3/2, `--hrt-size-radius-xl` (1rem)
- Progress bar: height `--hrt-size-spacing-1` (8px), fill `--hrt-gradient-progress-linear`, track `#2323230d`
- State-aware line (P5 — Tier 1): `--hrt-size-font-body-sm` (0.875rem), one line below progress bar
  - ≥100% funded: "Goal reached — still accepting donations" — `--hrt-color-text-positive` (#2d6339)
  - ≥80% funded: "$X to go" — `--hrt-color-text-default` (#232323)
  - Default: existing label — unchanged

**Behavior:** Arrows + dots KEEP AS-IS (parity rows 33–35). Card click fires `referrer_source: profile`. Donate CTA: `--hrt-color-button-primary-surface` (#232323) on white.

**Overlay annotations:** [P5 Tier-1]
**Mobile variant:** Single card visible; swipe gesture; arrows hidden; dots remain.
**Before/After:** Before = no state-aware line. After = state line appears under progress bar.

---

### 4.5 P9 Recurring-Nudge Banner

_(See dedicated section 6 for full anatomy and conditional logic.)_

### 4.6 Tab Bar

```
┌───────────────────────────────────────────┐
│  [Activity ●────────]  [About]            │
└───────────────────────────────────────────┘
```

**Components:** Two tabs. Active indicator `--hrt-color-border-brand` (#4a9d44) bottom border 2px. Labels `--hrt-size-font-body-md` (1rem), `--hrt-font-weight-bold` (175).
**Behavior:** Activity is default selection. Tab switch does not reload; content panels toggle visibility.
**Mobile variant:** Full-width tab bar; each tab 50%.

---

### 4.7 Activity Tab Content

_(Full ASCII and UPDATED verb row anatomy in section 5.)_

**Components + tokens:**
- "Since your last visit" header: `--hrt-color-surface-neutral-subtle` (#f5f5f5) bg, `--hrt-size-font-body-sm` (0.875rem), `--hrt-font-weight-bold` (175), chevron for collapse toggle
- Activity row: `--hrt-color-surface-raised` (#fff), `--hrt-size-radius-lg` (0.75rem), `--hrt-shadow-soft`
- Verb label: `--hrt-size-font-body-xs` (0.75rem), uppercase, `--hrt-color-text-supporting` (#6f6f6f)
- Reaction row (heart/comment/share): KEEP AS-IS (parity rows 41–48)

**Content slots (L3.5):**
- "Since your last visit" header: authenticated returner + follow relationship → shows count. Fallback: hidden
- UPDATED rows: viewer follows a fundraiser with new update → row renders. Fallback: hidden
- PUBLISHED/DONATED rows: always shown for all viewers

**Overlay annotations:** [P2 Tier-2]
**Mobile variant:** Same single column; header sticky within scroll.

---

### 4.8 About Tab Content

```
┌──────────────────────────────────────────────────────────────┐
│  Bio                                                         │
│  "Passionate about animal welfare and the environment."      │
│                                                              │
│  Joined GoFundMe  August 2015                                │
│                                                              │
│  [Cause pills REMOVED — now in hero per P3]                  │
└──────────────────────────────────────────────────────────────┘
```

**Components + tokens:**
- Bio text: `--hrt-size-font-body-md` (1rem), `--hrt-color-text-default` (#232323)
- Joined date: `--hrt-size-font-body-sm` (0.875rem), `--hrt-color-text-supporting` (#6f6f6f)
- Cause pills: REMOVED from this tab (relocated to hero per P3 — parity row 31). Do not duplicate.

**Behavior:** Static content. Owner sees edit affordance linking to existing edit flow.
**Overlay annotations:** [P3 Tier-1 — cause pills removed here]
**Mobile variant:** Same single column.
**Before/After:** Before = cause pills listed here. After = pills absent from About tab (in hero instead).

---

### 4.9 Right-Rail PYMK Panel (Desktop only)

```
┌────────────────────────────────┐
│  People you may know           │
│  ┌────────────────────────────┐│
│  │ [32px] Sarah M.   [Follow] ││
│  │ 2nd connection             ││
│  ├────────────────────────────┤│
│  │ [32px] Tom K.     [Follow] ││
│  │ 2nd connection             ││
│  ├────────────────────────────┤│
│  │ … up to 20 profiles        ││
│  └────────────────────────────┘│
│  [See more]                    │
└────────────────────────────────┘
```

**Components + tokens:**
- Panel header: `--hrt-size-font-heading-xs` (0.875–1rem), `--hrt-font-weight-bold` (175)
- Card: `--hrt-color-surface-raised` (#fff), `--hrt-size-radius-lg` (0.75rem), border `--hrt-color-border-neutral-extra-subtle` (#efefef)
- Avatar: 32px, `--hrt-size-radius-full`
- Follow button (per card): secondary variant, border `#b7b7b6`, text #232323, `--hrt-size-radius-full`
- Proximity label "2nd connection": `--hrt-size-font-body-xs` (0.75rem), `--hrt-color-text-supporting` (#6f6f6f)

**Content / copy:**
- Authenticated: cards reordered by second-degree social-graph proximity; proximity label visible
- Anonymous: server-default ordering; proximity label hidden

**Behavior:** Lazy-loaded per P7. 20 profiles. Follow fires `PYMK Follow Clicked` with `pymk_rank_position`. [P4 Tier-2]
**Mobile variant:** Panel hidden; right rail collapses in single-column layout.

---

### 4.10 Footer

**Behavior:** KEEP AS-IS per parity rows 54–57. Cookie preferences, brand social links, legal links, expand-footer.

---

## 5. P2 "What You Missed" Feed Surface

```
┌── Since your last visit — 4 new ──────────────── [▲ collapse] ─┐
│                                                                  │
│ ┌── UPDATED ────────────────────────────────────────────────┐   │
│ │ [32px fundraiser avatar]                                  │   │
│ │ Real-Time Alerts for Wildfire Safety posted an update     │   │
│ │ by Watch Duty · 4 days ago                                │   │
│ │                                                    [View →]│   │
│ └────────────────────────────────────────────────────────── ┘   │
│                                                                  │
│ ┌── PUBLISHED ──────────────────────────────────────────────┐   │
│ │ [32px organizer avatar]                                   │   │
│ │ Janahan started "Save the Park at Ossabaw Island"         │   │
│ │ 6 days ago                                         [View →]│   │
│ └────────────────────────────────────────────────────────── ┘   │
│                                                                  │
│ ┌── UPDATED ────────────────────────────────────────────────┐   │
│ │ [32px fundraiser avatar]                                  │   │
│ │ Andy Ritchie's Recovery Fund posted an update             │   │
│ │ by Jane R. · 7 days ago                           [View →]│   │
│ └────────────────────────────────────────────────────────── ┘   │
│                                                                  │
└────────────────────────────────────────────────────────────── ──┘
```

**Collapsible header:** bg `--hrt-color-surface-neutral-subtle` (#f5f5f5), border-bottom `--hrt-color-border-neutral` (#b7b7b6), chevron toggles. Anonymous/first-visit: collapses to zero height.

**UPDATED verb row anatomy (closing D5 loop gap):**
| Element | Token / value |
|---|---|
| Verb label "UPDATED" | `--hrt-size-font-body-xs` (0.75rem), uppercase, `--hrt-color-text-supporting` (#6f6f6f) |
| Source fundraiser title | `--hrt-size-font-body-sm` (0.875rem), `--hrt-font-weight-bold` (175), `--hrt-color-text-default` (#232323) |
| Author byline | `--hrt-size-font-body-xs`, `--hrt-color-text-supporting` |
| Relative timestamp | `--hrt-size-font-body-xs`, `--hrt-color-text-supporting` |
| View CTA | Text link, `--hrt-color-text-brand` (#4a9d44) |
| Row bg | `--hrt-color-surface-raised` (#fff), `--hrt-size-radius-lg` (0.75rem), `--hrt-shadow-soft` |

**Source logic:** UPDATED rows appear when the viewer follows a fundraiser with an update since their last visit. Source: fundraiser update content (same as D8 banner). PUBLISHED/DONATED rows from the profile owner also group here if new since last visit.

**Events:** `Activity Feed Engaged` (collapse/expand), `Activity Item Clicked` (verb: UPDATED / PUBLISHED / DONATED).

---

## 6. P9 Recurring-Donation Nudge Banner

```
┌─────────────────────────────────────────────────────────────────┐
│  You've supported Janahan 3 times — consider a monthly gift?    │
│                                      [Set up recurring  →]      │
└─────────────────────────────────────────────────────────────────┘
```

**Anatomy:**
| Element | Token / value |
|---|---|
| Banner bg | `--hrt-color-surface-tip-subtle` (#fff3d0) |
| Banner border | 1px solid `--hrt-color-surface-tip-medium` (#ffd863) |
| Border-radius | `--hrt-size-radius-lg` (0.75rem) |
| Padding | `--hrt-size-spacing-2` (1rem) × `--hrt-size-spacing-3` (1.5rem) |
| Copy text | `--hrt-size-font-body-sm` (0.875rem), `--hrt-color-text-tip` (#68570d) |
| CTA | Primary button, bg `--hrt-color-button-primary-surface` (#232323), text #fff, `--hrt-size-radius-full` |

**Placement:** Below the carousel, above the tab bar.

**Conditional display:** SHOW for authenticated viewer with 2+ donations to this organizer in past 12 months. HIDE (zero height): anonymous, 0–1 donations, or viewer already has active recurring gift to this organizer.

**CTA behavior:** Opens donate flow with `frequency = monthly`, `referrer_source = profile_recurring_nudge`. Fundraiser D12 nudge skips its prompt when it detects this referrer.
**Events:** `Recurring Nudge Viewed`, `Recurring Nudge Clicked`, `Donate Completed` (`frequency = monthly`). [P9 Tier-1]
**Mobile variant:** Full-width; CTA stacks below copy; same colors.

---

## 7. Weekly Digest Email Mockup

```
Subject: "4 updates from people you follow on GoFundMe"
Preview: "Real-Time Alerts posted an update · Janahan started a new fundraiser"

┌─────────────────────────────────────────────────────────────────┐
│  [GFM logo — green #4a9d44]                                     │
│  ─────────────────────────────────────────────────────────────  │
│  Here's what happened since your last visit.                    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ UPDATED                                                 │   │
│  │ Real-Time Alerts for Wildfire Safety                    │   │
│  │ posted an update  · 4 days ago                          │   │
│  │                            [Read update  →]             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ PUBLISHED                                               │   │
│  │ Janahan started "Save the Park at Ossabaw Island"       │   │
│  │ 6 days ago                                              │   │
│  │                            [View fundraiser →]          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ DONATED                                                 │   │
│  │ Sarah M. donated to "Keep Sandy on Ossabaw"             │   │
│  │ 7 days ago                                              │   │
│  │                            [View fundraiser →]          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  [Manage email preferences]   [Unsubscribe]                    │
│  GoFundMe · 855 Jefferson Ave, Redwood City, CA 94063          │
└─────────────────────────────────────────────────────────────────┘
```

**Spec:** Braze, Sunday 9 AM local (default); user-adjustable to monthly or off. Cadence in account settings (parity row 24 — `shared_notifications_bell` flag deprecated if it rolls out). Content: union of UPDATED + PUBLISHED + DONATED from all followed profiles, fundraisers, and communities since last visit. Deep link: `referrer_source = profile_digest_email`; "Since your last visit" opens expanded. Events: `Digest Email Opened`, `Digest Email Click-Through`.

---

## 8. Cross-Page Consistency Note

No fundraiser-wireframe.md or community-wireframe.md existed at time of writing. These patterns are established here for downstream adoption:

| Component | Profile definition | Cross-page note |
|---|---|---|
| Donate CTA on carousel cards | `--hrt-color-button-primary-surface` (#232323) on white | Same as fundraiser page primary CTA on white — "no green button on white" rule |
| Follow CTA | **Primary pill** `#232323` (Follow IS the page's primary action on profile — no Donate primary competes) | Fundraiser uses *Secondary / Ghost* variant of the same pill (Donate is fundraiser's primary; Follow yields visually). Community matches profile (Primary). See `fundraiser-wireframe.md` "Follow CTA Variant Rule" for the canonical cross-page spec. |
| Share sheet | Secondary button → share sheet with per-channel AI copy (P8); `share_channel` property required on `Share Clicked` event | Fundraiser D9 uses same pattern |
| Activity row component | `--hrt-color-surface-raised` (#fff), `--hrt-size-radius-lg`, `--hrt-shadow-soft` | Reusable across community digest surface |
| PYMK card | 32px avatar, secondary Follow pill, `--hrt-color-border-neutral-extra-subtle` border | Community page can reuse same card component |
| Fundraiser card | `--hrt-size-radius-xxl` (1.25rem) outer, `--hrt-size-radius-xl` (1rem) image | Must match fundraiser page cards exactly |
| `referrer_source` enum | See `strategy-metrics-research.md` §4 — single owner | All pages reference, never redefine |
| **Overlay pill + persona menu** | Inherited globally — anatomy in `design-overlay.md`. | Six demo personas + per-slot render expectations in `design-personas.md`. P1 microcopy, P2 "What you missed" feed, P4 PYMK reranking, P9 recurring nudge all swap content per active persona. |

---

## 9. Coverage Check

### Deltas realized

| Delta | Feature | Region | Status |
|---|---|---|---|
| P1 | Follow value-prop microcopy | Hero § 4.2 | Realized |
| P2 | "Since your last visit" header + UPDATED verb rows | Activity tab §§ 4.7, 5 | Realized |
| P2 | Weekly email digest | § 7 | Realized |
| P3 | Cause pills relocated to hero | Hero § 4.2 | Realized |
| P3 | Cause pills removed from About tab | About tab § 4.8 | Realized |
| P3 | Bio nudge (owner-only) | Hero § 4.2 | Realized |
| P4 | PYMK panel reranked by graph proximity | Right rail § 4.9 | Realized |
| P5 | Carousel card state-aware line | Carousel § 4.4 | Realized |
| P6 | Tenure line in hero | Hero § 4.2 | Realized |
| P7 | Performance guardrail | Annotated: PYMK lazy-load § 4.9; feed deferred § 4.7 | Realized (dashboard-only; no visual delta) |
| P8 | AI share copy per channel | Hero § 4.2 (Share button) | Realized |
| P9 | Recurring-nudge banner | § 4.5 / § 6 | Realized |

### KEEP AS-IS features — layout homes

All 40 KEEP AS-IS rows have homes: global nav (rows 2–9), hero display elements (10–13, 16, 19–20, 26–28), carousel controls (33–35), activity card interactions (41–53), footer (54–57). CUT row 23 (tooltip) absent as specified. OUT OF SCOPE rows 17, 18, 21, 22 (auth/moderation/DM) excluded per scope contract.

### No unrealized deltas.
