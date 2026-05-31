# Profile Page — Redesign Deltas

> **Scope contract:** This is a **redesign delta over GFM's current profile page** (`/u/janahan`). Visual identity is inherited from `gfm-design-system.md`. Every delta must (a) tie to a metric in `strategy-metrics-research.md` §2 and (b) be backed by either peer-reviewed/industry research OR GFM's own observable experimentation (`gfm-observed-metrics.md`). Deltas without a metric+evidence pair don't ship.
>
> **Role in the three-page system:** The profile is the connective tissue. It is the surface where the Follow downstream lives — the feed, digest, and "what you missed" framing that `fundraiser-redesign.md` D5 deferred here. Cross-page section at bottom EXTENDS (does not redefine) the contract established in `fundraiser-redesign.md`.

Status legend: **★** = GFM independently experiments on this surface (high confidence). **▲** = research-strong but GFM doesn't appear to test it. **■** = implementation discipline (not a visual delta).

**Revision history:** Updated after verifier-swarm review. **P2 extended**: feed schema now includes the `UPDATED` verb so followed-fundraiser updates have a home (closing the D5 loop gap UX critic flagged); the weekly email digest is **promoted from cross-page prose to a committed sub-spec of P2** (digest infrastructure is no longer aspirational). **P6 reframed**: metric is now Donate Completed rate from experienced-organizer-profile visitors, not Follow Clicked rate — research backs "tenure = quality proxy," not "tenure label changes follow." P6 also relabeled as a trust signal rather than a primary metric mover. **P9 added** (Tier 3 — recurring donation surfacing, GFM-confirmed via three live `recurring_*` experiments — the lever metrics-defensibility flagged as missing).

---

## Layout architecture (the macro call)

The profile is a **single-column mobile** and a **constrained two-column desktop** (hero + content left, suggestions right). We keep GFM's overall composition. **What changes:**

- **Hero** — Avatar, name, follower/following counts, and Follow + Share CTAs remain at top. The bio slot (currently empty for most profiles) is given a fallback state so the hero never looks abandoned. Cause-category pills move from the About tab into the hero, below the name — they answer "what does this person care about?" at a glance.
- **Primary content rail** — tabbed, Activity default. The 3-card carousel above the tabs is retained but enriched with raised/goal state copy.
- **Right rail (desktop only)** — the 20-profile PYMK panel is retained but ranked (see P4).
- **Above-the-fold targets:** Avatar + name + Follow CTA + cause pills + at least one carousel card all visible on 1366×768 without scroll.

The structural justification is the Blackbaud P2P finding: returning fundraisers raise $501 median vs $222 first-timers. The profile is where that repeat-organizer identity lives.

---

## The deltas

### P1. ★ Follow button + value-prop microcopy (first-class)

| | |
|---|---|
| **Current GFM** | Follow button present in the hero but unlabeled with value proposition; no microcopy explains what following does. |
| **Delta** | Add a single line of microcopy under the Follow button: *"Get updates when [Name] organizes or donates."* For logged-in followers, replace with *"Following — you'll hear about new activity."* Button label unchanged; only the supporting line is new. |
| **Metric** | `Follow Clicked` on profile page; follow→D7/D30 return-visit rate (segmented by follow status). |
| **Evidence** | Maher et al. 2012 (PMC3374540): social-tie retention ~2× (12.6 vs 6.7 visits). **GFM-confirmed:** `be_profile_follow_feature`, `be_activity_follow_feature`, `social_graph_platformization_v2_profile_relationships`, `native_profiles_follow_feature` — GFM is platformizing the social graph backend; profile follow is the primary acquisition surface. |
| **Expected impact** | Follow rate lift from the value-prop line. The downstream feed (P2) is the retention multiplier. |

### P2. ★ "What you missed" activity feed for followers — and weekly digest

| | |
|---|---|
| **Current GFM** | Activity feed shows a flat chronological list of PUBLISHED and DONATED verbs (`fe-ssr-generic-activity-feed` rollout). No personalized grouping. No followed-fundraiser-update surface. |
| **Delta** | **Feed schema extension (closes the D5→P2 gap UX critic flagged):** the feed accepts three verbs — `PUBLISHED` (profile owner publishes a fundraiser), `DONATED` (profile owner donates), and **new: `UPDATED`** (a fundraiser the *viewer* follows posted an update). This means a viewer's profile feed surfaces both the profile-owner's activity AND updates from fundraisers the viewer follows (e.g. *"Real-Time Alerts for Wildfire Safety posted an update — 4 days ago"*). The `UPDATED` items reuse the activity-feed row component with the source fundraiser's title + author. <br><br>**"Since your last visit" header:** For authenticated returners who follow this profile (or any fundraiser whose update appears in the feed), insert a **collapsible "Since your last visit — [N] new"** header at the top of the Activity feed, grouping items that occurred after the viewer's last profile visit. <br><br>**Weekly email digest (promoted from cross-page prose to a committed sub-spec):** Each Sunday a Braze-delivered email bundles all `UPDATED` + `PUBLISHED` items from followed profiles, followed fundraisers, and followed communities since the user's last visit. Subject: *"[N] updates from people you follow on GoFundMe."* Body: rendered activity-feed rows with deep links back to the profile page (which then opens with the "Since your last visit" header expanded). User-adjustable cadence (off / weekly default / monthly). Click-through to profile uses `referrer_source = profile_digest_email`. |
| **Metric** | `Activity Feed Engaged` (scroll past the "since your last visit" grouping); `Activity Item Clicked` per verb; `Digest Email Opened` and `Digest Email Click-Through`; D7/D30 repeat visit rate for followers. |
| **Evidence** | **GFM-confirmed:** `fe-ssr-generic-activity-feed` (live rollout), `be_activity_follow_feature` (backend follow → feed publishing), `be_community_digest` (digest infrastructure already in GFM's flag registry — we extend it to profile follows), 133 Braze references in the SSR bundle confirm the email-trigger pipeline. Maher et al. 2012 is the research anchor for the follow→return mechanism. |
| **Expected impact** | Primary Repeat Visits lever on the profile. Without P2, the Follow CTA on every page is marketing copy; with it, the loop closes. The digest is the pull-back mechanism for users who don't open the app organically. |

### P3. ★ Cause pills in hero + complete-profile nudge *(L2 personalization)*

| | |
|---|---|
| **Current GFM** | Causes (ANIMALS, ENVIRONMENT, ARTS_AND_CULTURE) live in the About tab — invisible at a glance. The `fe-ssr-public-profiles-complete-profile-steps` experiment (treatment variant active on this crawl) gates a "complete your profile" wizard. Bio is null for many profiles. |
| **Delta** | **For profile viewers:** Surface cause-category pills (`--hrt-color-surface-brand-medium` `#ccf88e`, `--hrt-size-radius-full`) in the hero beneath the name. Max 3 pills; falls back to zero (no empty row). <br>**For profile owners (edit state):** The existing complete-profile wizard (gated by `fe-ssr-public-profiles-complete-profile-steps: treatment`) surfaces a slim prompt in the hero: *"Add a bio to help followers know what you stand for."* Owner-only. |
| **Metric** | For viewers: `Follow Clicked` rate from users who saw cause pills vs. those who did not (reframed per verifier — cause pills make identity legible, which plausibly lifts *follow trust* before fundraiser-card click; the original Fundraiser-Card-Clicked claim was an unanchored inference). For owners: `Profile Completion Step Completed`; bio-fill rate. |
| **Evidence** | **GFM-confirmed:** `fe-ssr-public-profiles-complete-profile-steps` is an active treatment experiment. Cause pills are already in the data model (`causes: [ANIMALS, ENVIRONMENT, ARTS_AND_CULTURE]`) — we surface existing data. Identity-legibility-to-follow mechanism aligns with Maher et al. 2012's social-tie framing (the cause is the tie). |
| **Expected impact** | Bio completion (owner side) + follow trust (viewer side). |

### P4. ★ PYMK panel — ranked by social graph proximity

| | |
|---|---|
| **Current GFM** | 20 suggested-follow profiles served in `followSuggestions` with `hasNextPage: true`. Server-determined ordering, no visible personalization. |
| **Delta** | Retain the 20-profile panel. For authenticated viewers, **reorder** suggestions by social-graph second-degree proximity: people followed by accounts the viewer follows appear first. Anonymous viewers see the current server ranking. Same card layout, same per-card Follow button — only ordering changes. |
| **Metric** | `PYMK Follow Clicked` (with `pymk_rank_position`); follow rate by rank position. |
| **Evidence** | **GFM-confirmed:** `social_graph_second_connection_lookup` is a named capability in GFM's flag registry; `fe-ssr-campaign-pymk`, `donations-pymk`, `pymk_production_xplr_fe_team` confirm active PYMK system. We apply an existing backend capability to the profile PYMK panel. |
| **Expected impact** | Follow rate on PYMK panel increases when suggestions are socially proximate. Each new follow edge compounds. |

### P5. ▲ Fundraiser carousel — raised/goal state enrichment

| | |
|---|---|
| **Current GFM** | The 3-card smartlink carousel shows title, progress bar, raised/goal. No urgency copy or state differentiation per card. |
| **Delta** | Add a **single state-aware line** under the progress bar on each carousel card: <br>• ≥100% funded: *"Goal reached — still accepting donations"* (using `--hrt-color-text-positive` `#2d6339`) <br>• ≥80% funded: *"$X to go"* (near-goal urgency) <br>• Default: current label unchanged <br>Max 1 line, body-sm (0.875rem). No layout changes. |
| **Metric** | `Fundraiser Card Clicked` (per card, `card_state`: over_goal / near_goal / default); downstream `Donate Completed` attributed to `referrer_source: profile`. |
| **Evidence** | Cryder, Loewenstein & Seltman 2013 (*JESP*): goal-gradient effect applied at the profile level. Design-system tokens already in spec. |
| **Expected impact** | Click-through uplift from the carousel to near-goal and over-goal fundraiser pages. |

### P6. ▲ Repeat-organizer identity badge *(trust signal, not primary metric mover — reframed per verifier)*

| | |
|---|---|
| **Current GFM** | Joined date (`GFM_JOINED_DATE: 2015-08-09`, visibility: PUBLIC) and fundraiser count are available but not surfaced in the hero. |
| **Delta** | For organizers with 2+ fundraisers, display a **small tenure line** in the hero beneath the cause pills: *"Organizing on GoFundMe since [year] · [N] fundraisers"* — `--hrt-color-text-supporting` `#6f6f6f`, body-xs (0.75rem). Single line. Collapses to empty for new organizers. |
| **Metric** | **Reframed (verifier-corrected):** `Donate Completed` rate from visitors arriving at fundraiser pages via `referrer_source = profile` segmented by `organizer_fundraiser_count` (≥2 vs new). The research supports "experienced organizers raise more," not "tenure label lifts follow rate" — so the metric is *downstream conversion from profile-referred traffic*, treating the badge as a trust signal that compounds with P5's goal-state copy. Not the primary follow lever. |
| **Evidence** | Blackbaud P2P data: returning fundraisers raise $501 median vs $222 first-timers; 5+ year participants average $4,425 — tenure is a real proxy for campaign quality. Surfacing tenure to viewers gives them a quality signal *before* they click through. **Data available:** `GFM_JOINED_DATE` is PUBLIC in `__NEXT_DATA__`; fundraiser count is derivable from `activeEntries[]`. GFM doesn't test tenure display directly — verifier flagged this. We retain it as a trust signal supporting P5, not as an independent metric mover. |
| **Expected impact** | Modest downstream donate-rate lift on fundraisers visited from experienced-organizer profiles. Honest framing — no Follow-rate claim. |

### P7. ■ Performance baseline (profile-specific guardrail)

| | |
|---|---|
| **Current GFM** | Profile page is Next.js SSR (1.6 MB HTML, `__NEXT_DATA__` = 1.57 MB Apollo cache). |
| **Delta** | Profile build commits to **LCP ≤ 2.0s at p75**. Concrete: <br>• SSR hero + follower counts <br>• Defer Apollo cache hydration for activity feed with `startTransition` <br>• Lazy-load the 20-profile PYMK panel <br>• `__NEXT_DATA__` budget cap: ≤400 KB initial payload (strip non-above-fold entries) |
| **Metric** | LCP / INP / CLS at p75; `Page Viewed` → `Fundraiser Card Clicked` drop-off rate (slow-load bounce proxy). |
| **Evidence** | Google/Deloitte *Milliseconds Make Millions* (2020). The 1.57 MB payload is an addressable bottleneck. |
| **Expected impact** | Cheapest funnel improvement. |

### P8. ★ Profile share — per-channel with AI copy *(L3 personalization)*

| | |
|---|---|
| **Current GFM** | "Share profile" button opens a share sheet. Prefilled copy is generic. |
| **Delta** | Extend D9's AI share copy pattern to profile sharing. LLM-generated prefilled text per (profile, channel), cached: WhatsApp = friend-tone with mission hook; X = punchy public bio + link; email = personal narrative; Facebook = community appeal. Same share buttons, same positions. |
| **Metric** | `Profile Share Clicked` (with `share_channel`); downstream new-visitor rate (`referrer_source: profile_share`). |
| **Evidence** | **GFM-confirmed:** `amp24_agentic_share_text_ab`, `amp25_sharehub_v2_ab` (both live). Berger & Milkman 2012 (channel-tone). |
| **Expected impact** | Modest, honest framing — profile sharing is a low-volume but high-trust acquisition channel. Better prefilled copy lowers the friction of making the intro. |

### P9. ★ Recurring-donation surfacing for repeat donors *(NEW — Tier 3, addresses the missing-lever verifier flagged)*

| | |
|---|---|
| **Current GFM** | The profile has no surface that surfaces "you've supported this organizer before — set up a recurring gift?" Recurring donations are tested heavily on the donate-flow surface, not the profile. |
| **Delta** | For authenticated viewers who have donated to fundraisers by this organizer **2+ times in the past 12 months**, surface a slim banner under the carousel: *"You've supported [Name] [N] times — consider a monthly gift?"* with a single CTA *"Set up recurring"* that opens the donate flow with `frequency = monthly` and `referrer_source = profile_recurring_nudge` pre-set. Collapses to zero height for one-time donors, anonymous viewers, or users with no donation history to this organizer. |
| **Metric** | `Recurring Nudge Viewed`, `Recurring Nudge Clicked`, downstream `Donate Completed` with `frequency = monthly`. Cohort: profile-recurring-nudge attribution vs. baseline. |
| **Evidence** | **GFM-confirmed:** `fe-ssr-campaign-recurring-nudge`, `recurring_inline_reminder`, `checkout_recurring_nudge`, and `recurring_donations_upsell` — *four* concurrent live GFM experiments on recurring-donation surfacing. None of them target the *profile* surface; we extend the same mechanism to the relationship-level (organizer-specific repeat donor) surface, which is more behaviorally relevant than the campaign-level nudge. Recurring donors have ~10–20× the LTV of one-time donors (industry benchmark). |
| **Expected impact** | Even a 1–2% conversion shift among repeat donors is high-leverage given the LTV multiplier. Profile is the only surface where the "you've given X times to this person" signal exists; the campaign page can't show that context. |

---

## Cross-page integration EXTENSIONS

This section EXTENDS the contract established in `fundraiser-redesign.md`. It does not redefine existing terms — it adds what the profile page owns.

**The Follow downstream — owned here.**

`fundraiser-redesign.md` D5 deferred the downstream follow experience to the profile. Full spec:

- **Feed location:** The profile Activity tab IS the feed. P2 implements the surface. The feed accepts three verbs — `PUBLISHED`, `DONATED`, **and `UPDATED`** (new — closes the gap where followed-fundraiser updates previously had no home). The `UPDATED` row shows the fundraiser's title + author + a one-line summary, sourced from the fundraiser-page update content (D8 banner uses the same source; D13 may LLM-summarize it).
- **Email digest:** Owned by P2 above (committed sub-spec). Braze-delivered, weekly default, user-adjustable. Bundles `UPDATED` + `PUBLISHED` items from all followed entities (profiles, fundraisers, communities). The digest deep-link sets `referrer_source = profile_digest_email`.
- **"What you missed" framing:** P2's collapsible header on the Activity feed.
- **Follow edge → graph:** Every `Follow Clicked` writes a social-graph edge (`social_graph_platformization_v2_profile_relationships`). That edge feeds PYMK (P4), community membership auto-follow (`be_community_organizer_auto_follow`), and the digest.

**Donating → Profile activity (profile side).**

- `Donate Completed` writes a `DONATED` verb row to the user's Profile activity feed (already present in GFM's feed schema: `DONATED $2 to Real-Time Alerts`). P2's "since your last visit" header groups these entries for followers who watch the user.

**Profile → Fundraiser → Community navigation chain.**

- Profile carousel cards (P5) emit `referrer_source: profile` on `Page Viewed` at the fundraiser. Fundraiser → community badge (from `fundraiser-redesign.md`) links back to the community. The three-page chain is fully instrumented via the canonical `referrer_source` schema (defined in `strategy-metrics-research.md` §4).

**Repeat-organizer loop (highest-leverage profile-specific integration).**

- When a profile owner publishes a new fundraiser, the PUBLISHED event writes to the activity feed, triggers the email digest for followers, and updates the carousel (P5). The loop: Follow → get notified → return → donate/share → activity updates → followers return. This is the Blackbaud P2P compounding mechanism made operational ($501 → $4,425 over 5+ years).
- Event: `Repeat Organizer Campaign Published` — fires when a profile owner with 1+ prior fundraisers publishes a new one. Property: `organizer_fundraiser_count`.

**Recurring-donation cross-page handoff.**

- P9's "Set up recurring" CTA opens the fundraiser donate flow with `frequency = monthly` and `referrer_source = profile_recurring_nudge`. The fundraiser's D12 (inline recurring nudge) recognizes the referrer and skips the redundant nudge (since the user already opted in upstream).

**Metric implications (profile-owned).**

| Metric | Moved by |
|---|---|
| Repeat Visits | P2 (feed gives followers a reason to return); email digest |
| Follow rate | P1 (value-prop microcopy); P4 (ranked PYMK); P3 (identity legibility) |
| Donate (downstream from profile-referred traffic) | P5 (carousel state copy); P6 (tenure trust signal — supports P5); P9 (recurring uptake from repeat donors) |
| Share | P8 (AI profile share copy) |
| Repeat Organizer | P6 (tenure surfaces the pattern); digest loop (Repeat Organizer Campaign Published event) |
| Recurring (NEW) | P9 (organizer-specific repeat-donor surfacing) |

---

## Out of scope (deliberately)

- **Visual identity** — inherited from `gfm-design-system.md`.
- **Auth + account flows** — assumed.
- **Messaging / DM hub** — `fe-ssr-user-messaging` flag, separate surface.
- **Giving Fund / Gift Card flows** — not redesigned here.
- **Fitness activity tracking** — out of scope.
- **Edit profile flow internals** — P3 surfaces the wizard entry point but doesn't redesign the edit flow.
- **Mobile native apps** — web only.
- **i18n / multi-currency** — demo is en-US, USD.
- **Organizer "next best action" reactivation** — `manage_nba_habit_loop` flag exists in GFM but reactivating dormant organizers is out of one-week scope; noted as future work.

---

## Decisions (locked)

1. **Overlay tier-coloring:**
   - **Tier 1 (Core conversion, warm-red):** P3, P5, P9
   - **Tier 2 (Loop / retention, green):** P1, P2, P4, P8
   - **Tier 2 (Trust signal supporting P5):** P6
   - **Tier guardrail (neutral; dashboard-only):** P7
2. **Personalization stays L3.5.** P2 "what you missed" = L2. P4 PYMK reranking = L3 (graph proximity). P8 AI profile share copy = L3. P9 recurring nudge = L2 (history-based). All `strategy-personalization.md` constraints (fixed layout, fixed components, named slots, anonymous fallbacks) apply.
3. **Cross-page integration extends, doesn't redefine.** Contract in `fundraiser-redesign.md` stands.
4. **No invented data.** P6 tenure uses `GFM_JOINED_DATE` (already PUBLIC in `__NEXT_DATA__`) and `activeEntries[]` count.
5. **Digest is a committed P2 sub-spec, not aspirational prose.** Owns: Braze delivery, weekly default cadence, the union of UPDATED/PUBLISHED items from all followed entities.

---

## Map to the metric tree (sanity check)

| Tier | Metric | Deltas that move it |
|---|---|---|
| North Star | Meaningful sessions / user / week | P2 (feed + digest gives followers a reason to return); P1 (follow rate lifts the denominator); digest delivery |
| Output | Follow rate | P1 (value-prop microcopy), P4 (PYMK proximity), P3 (cause pills → identity legibility) |
| Output | Donation conversion (downstream from profile traffic) | P5 (carousel state copy), P6 (tenure trust → quality signal supporting P5), P9 (recurring nudge for repeat donors) |
| Output | Share rate / K-factor | P8 (AI profile share copy) |
| Output | Repeat Visits | P2 (feed + digest), P1 (follow is prerequisite) |
| Output | Recurring uptake (NEW) | P9 (organizer-specific repeat-donor nudge) |
| Leading | Repeat Organizer Campaign Published | digest loop, P6 (tenure surfaces the pattern) |
| Leading | Profile → Fundraiser click-through | P5 (goal-state carousel), P3 (cause pills reduce irrelevant clicks) |
| Guardrail | LCP / INP / CLS | P7 |

Every metric tier moved by ≥1 delta. The Follow downstream (P1+P2 + digest) is the profile's unique contribution to the North Star — no other page owns this surface.
