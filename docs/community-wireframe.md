# Community Page — Mid-Fi Wireframe
**Scope:** `gofundme.com/communities/watch-duty`
**Inputs:** community-redesign.md (C1–C7), community-feature-parity.md (68 + 3 Additions),
gfm-design-system.md, strategy-personalization.md (L3.5), strategy-metrics-research.md
**Note:** `fundraiser-wireframe.md` did not exist at authoring time — cross-page obligations noted in §6.
**Toggles:** Before/after (current GFM vs redesign). Sub-toggle: "returning-member view" exposes C2 divider + C5 strip.

---

## 2. Breakpoints + Grid

Single-column, content-first. No sticky conversion rail.

| Breakpoint | Viewport | Container max-width | Gutter |
|---|---|---|---|
| Mobile | 375–767px | 100% | `--hrt-size-spacing-2` (16px) |
| Tablet | 768–1365px | `48rem` centered | `--hrt-size-spacing-3` (24px) |
| Desktop | 1366px+ | `64rem` centered | `--hrt-size-spacing-3` (24px) |

---

## 3. Page Layout Overview

Tab order locked: Activity (default) → Fundraisers → About (Decision 1).

```
┌──────────────────────────────────────────────────────────────┐
│  GLOBAL HEADER  (logo / search / nav / Sign in / Start)      │
├──────────────────────────────────────────────────────────────┤
│  STICKY COMMUNITY HEADER  (name + Start CTA)                 │
├──────────────────────────────────────────────────────────────┤
│  HERO  (cover image · name · stats [C7 SSR] · Follow [C1] + Share [C6])│
├──────────────────────────────────────────────────────────────┤
│  TAB BAR  [ Activity ● ]  [ Fundraisers ]  [ About ]         │
├──────────────────────────────────────────────────────────────┤
│  ACTIVITY TAB (default)                                      │
│    [C2] "Since your last visit — N new activities" divider   │
│    Feed items 1–3  ·  ♥ inline  ·  💬 tappable badge        │
│    [C3] "Donors you might know" PYMK strip                   │
│    Feed items 4–N  ·  [ Load more ]                          │
├──────────────────────────────────────────────────────────────┤
│  FUNDRAISERS TAB                                             │
│    [C5/L3.5] "From causes you follow" 3-card strip           │
│    Filter controls  [ Category ▾ ][ Time Period ▾ ][ Close … ▾]│
│    [C4] Leaderboard momentum prompt block                    │
│    Top-3 leaderboard cards  ·  [ See all ]                   │
│    Search input  ·  Paginated fundraiser list                │
├──────────────────────────────────────────────────────────────┤
│  ABOUT TAB  (description · rules · organizer)                │
├──────────────────────────────────────────────────────────────┤
│  GLOBAL FOOTER                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Per-Region Detail

### 4.1 Global Header + Sticky Community Header

Global header (rows 1–9): KEEP AS-IS. Logo/nav on `#fff`, `--hrt-shadow-soft`. "Start a GoFundMe" = primary pill, bg `#232323`, text `#fff`, `--hrt-size-radius-full`.

Sticky community header (row 10): appears on scroll past hero. Bg `#f5f5f5`, community name GoFundMe Sans 175wt `--hrt-size-font-heading-sm`, secondary pill Start CTA (border `#b7b7b6`, text `#232323`). No delta badge.

**Mobile:** Hamburger collapses nav (row 8). Community header name truncates 1 line.

---

### 4.2 Hero

```
┌──────────────────────────────────────────────────────────────┐
│  [ Community cover image — 16:9 · --hrt-size-radius-xxxl ]   │
├──────────────────────────────────────────────────────────────┤
│  Watch Duty                                    [CHALLENGE]    │
│  heading-xl · 175wt · #232323                                 │
│                                                              │
│  $4.2M raised · 312 fundraisers · 1,247 people following     │
│  body-md · 100wt · #6f6f6f   ← C7 SSR (zero CLS)            │
│                                                              │
│  "1,247 people are following — be #1,248!"  [C1 milestone]   │
│  body-sm · #4a9d44 · fires at 5 / 25 / 100 / 500 thresholds │
│                                                              │
│  [ Follow Watch Duty ]              [ Share ]                │
│   pill · #232323 bg · #fff           pill · secondary        │
│  "Get updates when new fundraisers                           │
│   are added or milestones are hit."  body-xs · #6f6f6f       │
└──────────────────────────────────────────────────────────────┘
```

**Components**
- Cover image: `--hrt-size-radius-xxxl` (24px), 16:9 CDN.
- Name: `--hrt-size-font-heading-xl` (28–32px fluid), 175wt, `#232323`.
- Stats: body-md, 100wt, `#6f6f6f`. SSR per C7 (rows 15–17).
- Milestone copy: body-sm, `#4a9d44`, thresholds 5/25/100/500 (C1, rows 18–19).
- Follow CTA: primary pill `--hrt-size-radius-full`, bg `#232323`, text `#fff`. Post-follow toast: "You're following Watch Duty — we'll email you when something new happens." (C1, row 20). Event: `Community Followed`.
- Microcopy: body-xs `#6f6f6f`, always visible below Follow button.
- Share CTA: secondary pill, border `#b7b7b6`, text `#232323`. AI copy pre-filled per channel (C6). Event: `Community Share Clicked` + `share_channel` + `share_context = community_hero`.

**Overlay:** Stats = Tier-guardrail badge (C7). Follow = Tier-2 (C1, green). Share = Tier-2 (C6, green).

**Mobile:** Cover above text. Follow + Share stack full-width.

**Before/after:** BEFORE = bare "Follow" + no microcopy + milestone near-zero only + no AI share prefill. AFTER = C1 labeled button + microcopy + expanded thresholds; C6 AI prefill.

---

### 4.3 Tab Bar

```
[ Activity ● ]    [ Fundraisers ]    [ About ]
──────────────
active: 2px underline #4a9d44 · 175wt
inactive: #6f6f6f · 100wt
body-md · 24px gap · bottom border 1px #efefef
```

Tab order KEEP AS-IS (row 64, Decision 1). URL hash updates on switch. No delta badge on tab bar itself.

**Mobile:** Full labels retained; horizontal scroll if < 320px.

---

### 4.4 Activity Tab Content

```
┌──────────────────────────────────────────────────────────────┐
│ [C2] ── Since your last visit — 14 new activities ─────────  │
│         full-width · #f5f5f5 bg · body-sm 175wt · #6f6f6f   │
│         sticky while new items in viewport                   │
├──────────────────────────────────────────────────────────────┤
│ [new] Sarah K. donated $50 · 2h ago                         │
│       ♥ 12  [inline icon · #4a9d44 reacted]  💬 3 [badge]   │
├──────────────────────────────────────────────────────────────┤
│ [new] James L. started a fundraiser · 5h ago  ♥ 7  💬 1     │
├──────────────────────────────────────────────────────────────┤
│ [new] Community reached $4M · 8h ago  ♥ 142  💬 11          │
├──────────────────────────────────────────────────────────────┤
│ [C3] ┌── Donors you might know ──────────────────────────┐  │
│      │ [32px avatar] Ana  [Follow]  [avatar] Mike [Follow]│  │
│      └────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│ [seen] Priya M. donated $25 · 3d ago  ♥ 4  💬 0            │
│ …                                                            │
│                   [ Load more activities ]                   │
└──────────────────────────────────────────────────────────────┘
```

**Components**
- "Since your last visit" divider (C2): `#f5f5f5` strip, body-sm 175wt, `#6f6f6f`. Height = 0 for first-time visitors (collapses). Sole orientation signal for returning members.
- Activity items: body-md 100wt `#232323`. Timestamp: body-xs `#6f6f6f`.
- HEART reaction (C2): promoted to primary — inline with item header, icon-fill `#4a9d44` when reacted. Count body-sm `#6f6f6f`. Event: `Activity Item Reacted`.
- Comment badge (C2): tappable pill, body-xs `#6f6f6f`, 4px radius. Expands inline thread. Event: `Activity Item Commented`.
- PYMK strip: see §5.1.
- Load more: secondary pill, border `#b7b7b6`.

**Overlay:** Divider + reactions = Tier-2 badge (C2, green). PYMK strip = Tier-2 badge (C3, green).

**Mobile:** Reactions + comment badge stay inline. PYMK strip horizontal-scrolls.

**Before/after:** BEFORE = no divider, reactions secondary (below item). AFTER = divider above unread + reactions primary (C2). Sub-toggle "returning-member view" populates divider count.

---

### 4.5 Fundraisers Tab Content

```
┌──────────────────────────────────────────────────────────────┐
│ [C5/L3.5] From causes you follow       (returning only)      │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  → horizontal      │
│ │card 20px │  │card 20px │  │card 20px │  scroll            │
│ │[Donate]  │  │[Donate]  │  │[Donate]  │                    │
│ └──────────┘  └──────────┘  └──────────┘                    │
├──────────────────────────────────────────────────────────────┤
│ [ Category ▾ ]  [ Time Period ▾ ]  [ Close to Goal ▾ ]       │
│ (C5 — filters SSR, flag gate removed)                        │
├──────────────────────────────────────────────────────────────┤
│ [C4] "312 people donated to Watch Duty in the last 24 hours" │
│ body-md 175wt · #232323 · bg #fafafa · radius 24px           │
│ [ See all fundraisers → ]  secondary pill                    │
├──────────────────────────────────────────────────────────────┤
│ TOP FUNDRAISERS                                              │
│ ┌────────────────────────────────────┐                       │
│ │ condensed card (16px r · 88px img) │ [progress] [Donate]  │
│ └────────────────────────────────────┘  ×3                   │
│ [ See all fundraisers ]                                      │
├──────────────────────────────────────────────────────────────┤
│ Search input  ·  Paginated fundraiser cards (20px r)         │
└──────────────────────────────────────────────────────────────┘
```

**Components**
- "From causes you follow" strip: see §5.2 for full detail. Hidden for anonymous/first-visit (L3.5 rule 4).
- Filter pills (C5, row 53): secondary pill style, `--hrt-size-radius-full`, border `#b7b7b6`, text `#232323`.
- Leaderboard momentum prompt (C4): see §5.3 for full detail.
- Leaderboard cards: `.hrt-fundraiser-card--size-condensed` (16px outer = `--hrt-size-radius-xl`, 88px image, `--hrt-shadow-soft`). Donate: primary pill `#232323` bg, `#fff` text. *(Token-conformance verifier corrected: drafter originally cited 12px / `--hrt-size-radius-lg` — DS documents this card variant as 16px / `--hrt-size-radius-xl`.)*
- Progress bar: `--hrt-gradient-progress-linear`, 8px, pill track.
- Paginated list: `.hrt-fundraiser-card--size-default`, `--hrt-size-radius-xxl` (20px).
- Fundraiser card links: `referrer_source = community_leaderboard` on navigate (C4 → D6 contract).

**Overlay:** "From causes" strip = Tier-1 (C5, warm-red). Filters = Tier-1 (C5). Prompt block = Tier-1 (C4, warm-red).

**Mobile:** Filter controls horizontal-scroll. Personalized strip horizontal-scroll (1.5 cards visible at 375px).

**Before/after:** BEFORE = no personalized strip, filters OFF, no prompt. AFTER = C5 strip + active filters + C4 prompt.

---

### 4.6 About Tab + Footer

**About** (rows 38–39, 62, 67 — all KEEP AS-IS): community description (body-md 100wt `#232323`), rules (body-sm `#6f6f6f`), organizer link (`#4a9d44`), Giving Guarantee. Heading at `--hrt-size-font-heading-md` (20–24px) 175wt.

**Footer** (rows 68–71 — KEEP AS-IS): nav links, social icons, legal links, Cookie Preferences. No delta.

---

## 5. Net-New Additions

### 5.1 PYMK Strip — "Donors you might know" (C3 · Tier-2 · green)

**Position:** Activity tab, after 3rd feed item.

```
┌──────────────────────────────────────────────────────────────┐
│  Donors you might know                        [ × dismiss ]  │
│  body-sm 175wt · #232323                                     │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐   → scroll     │
│  │ [32px ○]  │  │ [32px ○]  │  │ [32px ○]  │               │
│  │ #ccf88e   │  │ #ccf88e   │  │ #ccf88e   │               │
│  │ Ana C.    │  │ Mike T.   │  │ Sarah J.  │               │
│  │ body-xs   │  │ body-xs   │  │ body-xs   │               │
│  │ [Follow]  │  │ [Follow]  │  │ [Follow]  │               │
│  │ sm pill   │  │ sm pill   │  │ sm pill   │               │
│  └───────────┘  └───────────┘  └───────────┘               │
│  bg #f5f5f5 · radius --hrt-size-radius-xxxl (24px)           │
└──────────────────────────────────────────────────────────────┘
```

**Components:** Container bg `#f5f5f5`, 24px radius, 16px padding. Avatar 32px circle `--hrt-size-radius-full`, bg `#ccf88e`, initials text `#274a34` 175wt. Name body-xs `#6f6f6f`. Follow button: small pill (32px min-height), bg `#232323`, text `#fff`; post-follow → secondary style. Dismiss × icon-small `#6f6f6f`.

**State variants**
| State | Content |
|---|---|
| Logged-in, has graph | 3–5 mutual-connection donor cards |
| Anonymous / no graph | Top-3 donors by amount (L3.5 rule 4 fallback). Label may change to "Top donors" — open question (§7 gap 2). |
| Post-follow | Card Follow → "Following" (secondary pill), no navigation |
| Avatar click | Opens donor profile side drawer with Follow CTA |
| Dismissed | Strip collapses 0.25s ease; preference stored in session |

**Events:** `PYMK Module Viewed`, `PYMK Follow Clicked` (property `pymk_rank_position`), `PYMK Card Clicked`.

**Mobile:** 3 cards at 80px min-width; horizontal scroll.

**Before/after:** BEFORE = no PYMK strip. AFTER = strip after item 3.

---

### 5.2 "From Causes You Follow" Strip (C5 · Tier-1 · warm-red)

**Position:** Fundraisers tab, above filter controls.

```
┌──────────────────────────────────────────────────────────────┐
│  From causes you follow              (hidden if anonymous)   │
│  body-sm 175wt · #232323                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  →    │
│  │ [3:2 image]  │  │ [3:2 image]  │  │ [3:2 image]  │       │
│  │ r=16px img   │  │ r=16px img   │  │ r=16px img   │       │
│  │ Title        │  │ Title        │  │ Title        │       │
│  │ $X raised    │  │ $X raised    │  │ $X raised    │       │
│  │ [goal bar]   │  │ [goal bar]   │  │ [goal bar]   │       │
│  │ [Donate]     │  │ [Donate]     │  │ [Donate]     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│  card outer r: --hrt-size-radius-xxl (20px)                  │
└──────────────────────────────────────────────────────────────┘
```

**Components:** Cards `.hrt-fundraiser-card--size-default`, outer 20px (`--hrt-size-radius-xxl`), image 16px (`--hrt-size-radius-xl`). Progress bar `--hrt-gradient-progress-linear`, 8px, pill. Donate: primary pill `#232323` bg `#fff` text.

**Content:** 3 cards from categories matching the user's follow graph. Label "From causes you follow" — open question whether to read "Fundraisers in categories you follow" in single-community context (§7 gap 3).

**State variants:** Returning member → 3 matched cards. Anonymous or first-visit → slot collapses (hidden). Empty match → slot collapses.

**Events:** `Fundraiser Card Clicked` (property `section = followed_causes`), `Donate Started`.

**Mobile:** 1.5 cards visible at 375px to signal scroll affordance.

**Before/after:** BEFORE = does not exist. AFTER = strip at top of Fundraisers tab for returning members.

---

### 5.3 Leaderboard Momentum Prompt Block (C4 · Tier-1 · warm-red)

**Position:** Fundraisers tab, above top-3 leaderboard cards.

```
┌──────────────────────────────────────────────────────────────┐
│  [ACTIVE MOMENTUM]                                           │
│  "312 people donated to Watch Duty in the last 24 hours"     │
│  body-md 175wt · #232323                                     │
│  [ See all fundraisers → ]  secondary pill · border #b7b7b6  │
│                                                              │
│  [NEAR-GOAL LEADER — alt state]                              │
│  "Rapid Response Fund is $820 from its goal — 94 donors."    │
│                                                              │
│  [QUIET PERIOD — alt state]                                  │
│  "84 fundraisers are raising for Watch Duty — add yours."    │
│  [ Start a GoFundMe ]  primary pill · #232323 bg · #fff text │
│                                                              │
│  bg #fafafa · radius 24px · padding --hrt-size-spacing-3     │
└──────────────────────────────────────────────────────────────┘
```

**State logic (L1 — page-state reactive, not per-user; server-side state selection)**
| State | Trigger | CTA |
|---|---|---|
| Active momentum | Donor count last 24h > threshold | "See all fundraisers" secondary pill |
| Near-goal leader | Top fundraiser within 10% of goal | None (copy is the hook) |
| Quiet period | Neither condition met | "Start a GoFundMe" primary pill → `/campaign/605/startfundraising` |

**Events:** `Leaderboard Fundraiser Clicked` (property `leaderboard: fundraiser`), `Start Fundraiser Clicked`.

**Mobile:** Full-width block; CTA pill full-width.

**Before/after:** BEFORE = no prompt block. AFTER = contextual prompt above leaderboard cards. Mirrors D6 fundraiser pattern.

---

## 6. Cross-Page Consistency

`fundraiser-wireframe.md` does not exist at time of authoring. The following components must align when it is created.

| Component | Community page spec | Alignment obligation |
|---|---|---|
| Donate CTA on cards | White surface: pill `#232323` bg `#fff`. Green hero (on-strong): `#ccf88e` bg `#274a34` text. | Same token variants per surface context (`--hrt-color-button-primary-surface` / `--default-on-strong`). |
| Follow CTA | **Primary pill** `#232323` (Follow IS the page's primary action on community); microcopy body-xs `#6f6f6f`; post-follow toast. | Fundraiser uses *Secondary / Ghost* variant of the same pill (deliberate: Donate is fundraiser's primary; Follow must yield to Donate visually). Token anatomy + toast pattern identical across pages; only variant weight differs by page context. See `fundraiser-wireframe.md` "Follow CTA Variant Rule" for the canonical cross-page spec. |
| Share sheet | Secondary pill opens modal; AI-prefilled C6/D9 per channel; WhatsApp / X / email / Facebook (channel-specific) + Messenger / SMS (generic LLM). | Sheet modal structure and channel order must match across pages. |
| Fundraiser card | Default 20px outer / 16px image. Condensed **16px outer** / 88px image. | Same card primitives for related-fundraiser surfaces on fundraiser page. |
| Global header / footer | KEEP AS-IS (rows 1–9, 68–71). | No per-page variation. |
| **Overlay pill + persona menu** | Inherited globally — anatomy in `design-overlay.md`. | Six demo personas + per-slot render expectations in `design-personas.md`. C2 divider, C3 PYMK strip, C5 followed-causes strip all swap content per active persona; layout doesn't change. |

---

## 7. Coverage Check

### All 7 deltas realized

| Delta | Where realized |
|---|---|
| C1 — Follow CTA + value prop + milestone gamification | §4.2 hero |
| C2 — Activity feed divider + reactions/comments promoted | §4.4 activity tab |
| C3 — PYMK strip with inline Follow prompt | §5.1 |
| C4 — Leaderboard momentum prompt block | §5.3 |
| C5 — Filters activated + "From causes" personalization strip | §4.5 + §5.2 |
| C6 — AI-generated community share copy | §4.2 hero |
| C7 — SSR hero + stats, CWV commitments | §4.2 hero |

No unrealized deltas.

### KEEP AS-IS features — layout homes confirmed

| Region | Rows |
|---|---|
| Global header | 1–9 |
| Sticky community header | 10 |
| Hero (image, name, community type, notification modal, follower modal) | 11–13, 21–22 |
| Share sheet channels (Copy link, Embed, Nextdoor, LinkedIn, Instagram, TikTok, Snapchat) | 30–36 |
| Activity feed (item types, pagination, error state) | 44, 47–48 |
| Fundraisers tab (card list, search, donate button, card links, error) | 50–51, 54–57 |
| Leaderboard (cards, see-all, Start CTA, organizer links) | 58, 60–62 |
| About tab, tab order | 38–39, 63–64 |
| Footer (Giving Guarantee, nav, social, legal, cookies) | 67–71 |

OUT OF SCOPE rows (14, 40–42, 65) excluded by design.

### Open questions carried forward (from community-feature-parity.md §Gaps)

1. Does C1's "[N] people following" label apply to the follower-count modal-trigger button (row 22) or only the Follow CTA?
2. Should the PYMK strip label read "Top donors" in the anonymous/no-graph fallback rather than "Donors you might know"?
3. Should "From causes you follow" read "Fundraisers in categories you follow" in the single-community context?
