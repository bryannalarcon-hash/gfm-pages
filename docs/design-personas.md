# Demo Personas

> The persona switcher in the overlay pill (see `design-overlay.md`) lets a portfolio viewer experience the same page as different user types — without needing multiple real accounts. Switching personas changes which hardcoded fixture the L3.5 personalization logic reads as "current user." The personalization code is **identical to production**; only the data source differs.

---

## Demo mode vs production

| | Production behavior | Demo behavior |
|---|---|---|
| Who is the "current user"? | The actually-authenticated viewer (cookie / session) | A hardcoded fixture selected from the persona switcher |
| Where does user data come from? | Database, real history, real follow graph | `design-personas.md` fixtures, baked into the build |
| Does L3.5 logic change? | No | No — *only* the data source it reads from |
| Does the overlay tier-coloring change? | No | No — same annotations regardless of persona |
| What "real" user state is preserved? | Everything | Nothing — closing/reopening the demo respawns the selected persona |

**The personalization slots respond to the persona switch in real time.** Same page, same overlay highlights, same event names — different content in every slot. That's the point.

---

## The six personas

Six personas span the L3.5 fallback space + the cross-page `referrer_source` enum + common behavioral archetypes. Together they stress-test every `if (data) … else fallback` branch in the personalization layer.

### 1. **Anonymous first-timer** — slug: `anonymous`

Default persona on first visit. The L3.5 anonymous fallback path for every slot.

| Fixture field | Value |
|---|---|
| Name | *(none)* |
| Authenticated | false |
| Follows | none |
| Donation history | none |
| Last visit | *(no record)* |
| Referrer source | `direct` |
| Avatar in menu | `bg #f5f5f5` (`--hrt-color-surface-neutral-subtle`), `border 1px solid #6f6f6f`, generic person icon |

**Stress-tests:** every fallback path. Banners collapse, smart presets show the cohort defaults, PYMK shows trending-not-personalized cards, feeds are empty.

### 2. **Close friend** — slug: `close_friend`

A high-engagement repeat donor with a personal tie to the organizer. Maximum personalization — every slot fires.

| Fixture field | Value |
|---|---|
| Name | Sarah K. |
| Authenticated | true |
| Follows | This fundraiser ✓ · This organizer's profile ✓ · 4 other fundraisers |
| Donation history | This fundraiser: $50 last week + $25 two months ago. Three other donations across followed fundraisers in the last 6 months. |
| Last visit | 2 days ago, on this fundraiser page (before the latest update was posted) |
| Referrer source | `email` (clicked through from the digest) |
| Avatar in menu | `bg #ffd863` (`--hrt-color-surface-tip-medium`, warm gold/peach), initial "S" in `#68570d` (`--hrt-color-text-tip`) |

**Stress-tests:** the maximal-personalization happy path. D8 banner fires with returner copy + D13 LLM summary of the missed update; D10 presets show `$50 (your last) / $100 / $250`; D3 post-donate impact framing acknowledges 3rd donation; P2 "What you missed" feed populated; P9 recurring nudge surfaces (2+ donations in 12mo to this organizer).

### 3. **Extrovert** — slug: `extrovert`

High social activity, broad follow graph, low-amount but frequent donations, shares often. Tests share-funnel personalization + graph-driven recommendations.

| Fixture field | Value |
|---|---|
| Name | Mike T. |
| Authenticated | true |
| Follows | 67 profiles / 14 fundraisers / 3 communities |
| Donation history | $10–$25 donations across 18 fundraisers in the last 12 months. None to this fundraiser. |
| Last visit | 9 days ago, on a different fundraiser |
| Referrer source | `social` (came from X/Twitter share) |
| Avatar in menu | `bg #ccf88e` (`--hrt-color-surface-brand-medium`), initial "M" in `#274a34` (`--hrt-color-text-brand-strong`) |

**Stress-tests:** D9/C6/P8 AI share copy variants (Extrovert shares to many channels — channel-specific tone matters); P4 PYMK reranking has rich graph signal; D10 presets show the cohort default ($10/$25/$50) because no past donation to THIS fundraiser. D8 banner is hidden (never been here before).

### 4. **Shared by extrovert** — slug: `shared_by_extro`

Anonymous BUT arrived via WhatsApp share link from persona #3. Tests referrer-source pickup and warm-arrival framing for non-logged-in users.

| Fixture field | Value |
|---|---|
| Name | *(none)* |
| Authenticated | false |
| Follows | none |
| Donation history | none |
| Last visit | *(no record)* |
| Referrer source | `social` with `utm_share_source=whatsapp` and `utm_share_user=mike_t` |
| Avatar in menu | `bg #f5f5f5`, `border 1px solid #4a9d44` (`--hrt-color-text-brand`), initial "?" in `#6f6f6f` |

**Stress-tests:** the **anonymous-but-warm** path. D8 banner collapses (no identity to greet), but D6 donor-list prompt + a small "Mike T. recommended this" sub-head fires (cross-page contract: referrer attribution). Share-copy default → still generic since no `Follow` history. This persona is critical for proving the K-factor loop closes.

### 5. **Returning lapsed** — slug: `returning_lapsed`

Donated once a long time ago, hasn't visited in months. Tests the stale-but-real returner signal.

| Fixture field | Value |
|---|---|
| Name | Priya M. |
| Authenticated | true |
| Follows | This organizer's profile (followed 14mo ago) |
| Donation history | $25 to this fundraiser 14 months ago. No activity since. |
| Last visit | 10 months ago, on this fundraiser, before the goal hit 50% |
| Referrer source | `profile_digest_email` (digest re-engagement) |
| Avatar in menu | `bg #e9fcce` (`--hrt-color-surface-brand-subtle`, faded green to suggest a lapsed/quieter state — no DS rose/pink token exists), initial "P" in `#274a34` |

**Stress-tests:** the *long-tail return* path. D8 banner fires with **encouraging** copy that references the live funded %: *"Welcome back, Priya — your early support helped get this to [funded%]. Let's carry it the rest of the way."* (no "haven't been here a while" framing — CB-60). D13 may also surface the latest update summary. D10 presets show $25 (her stale-but-real last) as the middle preset. P2 feed fully populated with what she missed.

### 6. **Profile owner** — slug: `profile_owner`

Janahan viewing his own profile. Tests owner-only affordances.

| Fixture field | Value |
|---|---|
| Name | Janahan S. |
| Authenticated | true |
| Is the profile owner | true (only relevant on `/u/janahan`) |
| Follows | 38 profiles, 5 fundraisers |
| Donation history | 6 donations across followed fundraisers |
| Last visit | yesterday |
| Referrer source | `direct` |
| Avatar in menu | `bg #232323` (`--hrt-color-text-default`, near-black), initial "J" in `#fff` |

**Stress-tests:** P3 bio nudge surfaces (owner-only). All other surfaces should render normally for an authenticated user. On fundraiser/community pages, behaves as a normal logged-in user.

---

## Per-persona render expectations (what changes when you flip)

The grid below shows what each user-varying slot displays for each persona. Slots not listed don't vary by persona (e.g. D2 goal-gradient, D6 donor-list momentum prompt, P5 carousel state copy — those are page-state-driven, not user-driven).

### On the Fundraiser page

| Slot | Anonymous | Close friend | Extrovert | Shared by extro | Returning lapsed | Profile owner |
|---|---|---|---|---|---|---|
| **D8 banner** (top of page) | *hidden* | *"Welcome back, Sarah. Sarah J. posted: alert system live in 3 counties → "* | *hidden* | *hidden* (but sub-head "Mike T. recommended this") | *"Welcome back, Priya — your early support helped get this to [funded%]. Let's carry it the rest of the way → "* (use the live funded %, single-sourced; encouraging, no "haven't been here" framing — CB-60) | as Extrovert (not a personal tie) |
| **D10 smart presets** | `$10 / $25 / $50` | `$50 / $100 / $250` (middle = last donation) | `$10 / $25 / $50` (no history to this fundraiser) | `$10 / $25 / $50` | `$25 / $50 / $100` (middle = 14mo-old last) | `$10 / $25 / $50` |
| **D3 post-donate impact line** | "Your $X funds N days of alerts." | "Welcome back, Sarah. Your 3rd donation to this fundraiser." | "Your $X funds N days of alerts." | "Your $X funds N days of alerts." + share nudge to thank Mike T. | "Welcome back, Priya. Your 2nd donation — thanks for coming back." | (would not realistically donate to own thing; same as Anonymous template) |
| **D3 similar-fundraisers carousel** | top-3 trending in the same category (cold-start fallback) | embedding-ranked from Sarah's past donations | embedding-ranked from Mike's broad donation history | trending fallback (no history) | embedding-ranked from Priya's 1 prior donation (limited signal) | trending fallback |
| **D5 Follow button state** | "Follow this fundraiser" (ghost) | "Following ✓" (filled muted) | "Follow this fundraiser" | "Follow this fundraiser" | "Following ✓" | "Follow this fundraiser" |
| **D9 AI share copy** | per-channel cached defaults | same (computed per fundraiser, not per user) | same | same | same | same |
| **Sun button** (create ↔ edit) | locked **Create** (greyed) | **Edit my sun** (follows + donated here) | locked **Create** (no tie to this fundraiser) | locked **Create** (arrived via share, not yet acted) | **Edit my sun** (prior donor + follows organizer) | locked **Create** |

> **Derived rule (CB-34) — applies to fundraiser + community.** The Sun button reflects the current user's relationship to *this* board: any **follower / contributor / sharer** of this board → **Edit my sun**; a non-participant → greyed **Create** (unlocked once they act). It updates **live** — clicking Follow, or switching to a participant persona, flips Create → Edit without a reload.

### On the Community page

| Slot | Anonymous | Close friend | Extrovert | Shared by extro | Returning lapsed | Profile owner |
|---|---|---|---|---|---|---|
| **C1 Follow CTA state** | "Follow Watch Duty" (filled black) | "Follow Watch Duty" — Sarah doesn't follow this community in her fixture; she could | "Following Watch Duty ✓" (filled muted) | "Follow Watch Duty" | "Follow Watch Duty" | "Follow Watch Duty" |
| **C2 "Since your last visit" divider** | *hidden* | *"Since your last visit — 3 new activities"* | *"Since your last visit — 47 new activities"* (large delta because long gap relative to volume) | *hidden* | *hidden* (Priya doesn't follow community) | *hidden* |
| **C3 PYMK strip** | top-3 community donors by amount (fallback) | mutual-connection donors from Sarah's graph | strong graph-driven results (Mike has many connections) | top-3 donors fallback | thin graph (Priya follows 1 entity); falls back to top-3 donors | reranked by graph proximity |
| **C5 "From causes you follow"** | *hidden* | populated (Sarah's followed causes overlap) | populated and full | *hidden* | *hidden* (no causes followed) | populated |
| **C6 AI community share copy** | per-channel cached default | same | same | same | same | same |
| **Sun button** (create ↔ edit) | locked **Create** | locked **Create** (doesn't follow yet) | **Edit my sun** (follows Watch Duty) | locked **Create** | locked **Create** (doesn't follow community) | locked **Create** |

### On the Profile page

| Slot | Anonymous | Close friend | Extrovert | Shared by extro | Returning lapsed | Profile owner |
|---|---|---|---|---|---|---|
| **P1 Follow microcopy state** | "Get updates when Janahan organizes or donates." | as Anonymous (Sarah doesn't follow Janahan in her fixture) | as Anonymous | as Anonymous | "Following — you'll hear about new activity." (Priya follows Janahan) | "This is your profile" (owner state, no Follow CTA) |
| **P2 "What you missed" feed** | *hidden* | *hidden* (Sarah doesn't follow Janahan) | *hidden* | *hidden* | *"Since your last visit — 4 new"* expanded with UPDATED/PUBLISHED rows from Janahan's activity | owner sees own activity feed without "what you missed" framing |
| **P3 bio nudge (owner-only)** | *hidden* | *hidden* | *hidden* | *hidden* | *hidden* | **visible** — "Add a bio to help followers know what you stand for." |
| **P4 PYMK panel** | server default ordering | reranked by Sarah's graph | strongly reranked by Mike's deep graph | server default | thin graph rerank | strongly reranked by Janahan's graph |
| **P5 carousel state line** | page-state-driven (same for all personas) | same | same | same | same | same |
| **P6 tenure badge** | "Organizing since 2015 · 3 fundraisers" — same for all viewers | same | same | same | same | same (owner sees own tenure as social proof) |
| **P8 AI profile share copy** | per-channel cached default | same | same | same | same | same |
| **P9 recurring nudge** | *hidden* (anonymous) | *hidden* (Sarah hasn't donated to Janahan's fundraisers) | *hidden* | *hidden* | *hidden* (1 donation 14mo ago doesn't meet the 2+/12mo threshold) | *hidden* (own profile) |

---

## How to add a new persona (for future iteration)

1. Add a fixture entry to `/data/personas.ts` (the build-time file the demo reads).
2. Add a row to the menu definition (see `design-overlay.md` Menu anatomy).
3. Add columns to the three render-expectation tables above so a viewer knows what the persona should reveal.
4. Run the demo and tap the new persona to confirm every personalization slot resolves cleanly (no `undefined`, no console errors).

---

## What this isn't

- **Not a real auth system.** No login, no password, no session security. The persona switcher writes a string to localStorage and the L3.5 layer reads from a hardcoded fixture table.
- **Not user-editable.** Viewers can't make their own persona. The six are fixed and documented here as the canonical set.
- **Not a production feature.** The menu and fixture system ship in the demo build only; production would read from the real user record.
- **Not a substitute for real data.** Each persona's fixture is a *plausible* user, not a real one. We're not putting actual user PII in this doc.
