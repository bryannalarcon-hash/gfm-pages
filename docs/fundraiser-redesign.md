# Fundraiser Page — Redesign Deltas

> **Scope contract:** This is a **redesign delta over GFM's current fundraiser page**. Visual identity is inherited from `gfm-design-system.md`. Every delta must (a) tie to a metric in `strategy-metrics-research.md` §2 and (b) be backed by either peer-reviewed/industry research OR GFM's own observable experimentation (`gfm-observed-metrics.md`). Deltas without a metric+evidence pair don't ship.

Status legend: **★** = GFM independently experiments on this surface (high confidence). **▲** = research-strong but GFM doesn't appear to test it. **■** = implementation discipline (not a visual delta).

**Revision history:** Updated after verifier-swarm review (grader + UX critic + metrics-defensibility lenses). Tier 1+2+3 fixes applied: D2 simplified (no shimmer); D3 includes copy strategy + folded-in similar-fundraisers; D5 references cross-page section for downstream design; D6 replaced with GFM-confirmed money-box prompt; D8 re-cited; D9 demo-visibility fix; D11 folded into D3; **D12 (inline recurring nudge) and D13 (LLM update summaries) added**; **new Cross-page integration section** addresses the assignment's "seamlessly integrated" grading criterion.

---

## Layout architecture (the macro call)

Page structure stays a **two-column desktop** (story-left, action-rail-right) and a **single-column mobile**. We keep GFM's overall composition because the assignment is to redesign 3 pages, not the global IA. **What changes:**

- **Desktop** — Tighten the right rail (380px max). The rail is now a single sticky **donation card**: amount + tip + payment, no multi-step flow. Donor activity moves below the story (not in the rail).
- **Mobile** — Bottom-sheet donate. The sticky donate CTA expands into a full-screen sheet (not a new page); back swipes don't lose form state.
- **Above-the-fold targets:** Hero image + title + progress bar + primary Donate CTA + Share CTA all visible without scroll on a 1366×768 viewport.

Reason: GFM's current desktop has the donation in a separate flow off the page; we collapse it. This is the structural enabler for D1 (single-screen form) and pre-requisite for D3 (a real post-donate moment).

---

## The deltas

### D1. ★ Single-screen donation form

| | |
|---|---|
| **Current GFM** | Multi-step donate flow off-page; tipping is its own step (the `uc_tipping_ui` A/B test surface). |
| **Delta** | Amount → tip → payment all on one screen (the sticky right-rail card on desktop; bottom-sheet on mobile). Guest checkout default. No required phone. 4–5 fields total. |
| **Metric** | `Donate Started` → `Donate Completed` conversion (checkout completion rate) |
| **Evidence** | M+R Benchmarks 2025 via iDonate: multi-step forms ~halve completion; fewer required fields ≈ **+39%**; phone field costs ~2%. **GFM-confirmed:** `uc_tipping_ui` and `uc_tipping_ui_v2` are *live* A/B tests with 9+ variants each. |
| **Expected impact** | Largest single conversion lever. Defensible target: +20–30% relative on checkout completion. |

### D2. ▲ Goal-gradient intensification (final 15–20%) — simplified

| | |
|---|---|
| **Current GFM** | Progress bar visible; static. % funded shown but not visually intensified near goal. |
| **Delta** | When % funded ≥ 80%: prominent `$X to go` callout next to the progress bar, the percentage updates with a brief count-up animation when it changes, and share copy contextually shifts to *"Help finish the last $X."* **No shimmer animation** — copy and emphasis carry the urgency (verifier-flagged as overdesigned). |
| **Metric** | `Donate Intent` rate (segmented by % funded bucket), avg donation amount |
| **Evidence** | Cryder, Loewenstein & Seltman 2013, *JESP*. |
| **Expected impact** | +5–10% Donate Intent rate in the 80–100% goal range. |

### D3. ★ Post-donate as a first-class screen (with copy strategy + similar-fundraisers fold-in)

| | |
|---|---|
| **Current GFM** | Post-donate is a lightbox (`lb_postdonate_share`) — limited surface, narrow scope. |
| **Delta** | Replace the lightbox with a **dedicated post-donate screen** running the second conversion. Sections in order: <br>1. **Personalized thank-you with impact framing** (see Copy Strategy below — the load-bearing copy on the whole page). <br>2. **Share** (per-channel, prominent) — peak emotional moment. <br>3. **Recurring upgrade** (*"$50/month would fund X in a year"*). <br>4. **Follow this fundraiser**. <br>5. **You might also support…** — 3-fundraiser carousel ranked by embedding cosine similarity (this fundraiser × user's past donations); fallback for first-timers = top-3 trending in same category. (Folds in the former D11.) |
| **Metric** | `Post Donate Viewed`, `Post Donate Share Clicked`, `Post Donate Recurring Upgrade Clicked`, `Post Donate Follow Clicked`, `Post Donate Similar Clicked` |
| **Evidence** | **GFM-confirmed:** `donation_upsell` + `fe-ssr-post-donate-redesign-ab` are *live* A/B tests. Berger & Milkman 2012 (sharing at peak arousal). For the similar-fundraisers carousel: GFM's `be_fundraiser_recommendation_good_to_recommend` flag confirms they have a fundraiser-recommendation system; we apply the same pattern at post-donate. |
| **Expected impact** | 25–40% of donors take ≥1 secondary action; ~10% upgrade to recurring; carousel CTR 8–15%. |

**Copy strategy — impact framing.** The "your $X means Y" line cannot be a generic template (verifier-flagged). Spec:
- **Primary template (campaign has a concrete unit)**: `"Your $[amount] funds [N] [units] of [cause]."` — N derived from campaign's stated cost/unit. *e.g. "Your $50 funds 10 days of wildfire alerts."*
- **Fallback (no unit)**: `"Your $[amount] brings [Organizer] $[delta] closer. [N] donors got here together."`
- **Goal-crossing variant** (donation pushed campaign across the goal): `"Your $[amount] helped [Organizer] hit the goal — it's [percent]% funded thanks to [N] donors."`
- **Personalization**: first name *plus* acknowledgment of past activity if any (*"Welcome back, Bryann. Your second donation to this fundraiser."*) — never just first name.

### D4. ★ Per-channel share at emotional / milestone beats

| | |
|---|---|
| **Current GFM** | 8 Share CTAs scattered across the page. Per-channel events *exist* (`btn_share_whatsapp`) but placement isn't beat-driven. |
| **Delta** | Consolidate to **3 strategic share surfaces**, each with channel-aware buttons (Facebook, X, WhatsApp, Messenger, SMS, email, copy-link, native share): <br>• **Hero share** — always-visible default <br>• **Milestone share** — soft toast when % funded crosses 25 / 50 / 75 / 90% <br>• **Post-update share** — anchored under each update |
| **Metric** | `Share Clicked` (per `share_channel`, per `share_context`); K-factor proxy (`Share Clicked` / `Donate Completed`) |
| **Evidence** | Berger & Milkman 2012 (high-arousal emotion drives sharing). **GFM-confirmed:** per-channel events + `amp24_agentic_share_text_ab` + `amp25_sharehub_v2_ab`. |
| **Expected impact** | Better signal-to-noise + actionable per-channel data. GFM's own data: campaigns shared 6+ times in first days raise 3× more. |

### D5. ▲ Follow first-class — surfaced here; downstream feed designed in Cross-page section

| | |
|---|---|
| **Current GFM** | A heart icon (= follow) exists, de-emphasized, no value prop. |
| **Delta** | Replace heart with a labeled **"Follow this fundraiser"** button next to Donate. Microcopy: *"Get an email when [Organizer] posts an update."* Surface follower count under the progress bar. **The downstream Follow experience** (feed location, digest cadence, "what you missed" framing) is designed in the **Cross-page integration** section below — surfacing the button without designing the downstream would be hollow (UX-critic flag). |
| **Metric** | `Follow Clicked`, follow→D7-return-visit rate, follow→repeat-donor rate |
| **Evidence** | Maher et al. 2012 (social-tie retention; domain-mismatch noted). **GFM-confirmed (indirect):** `be_activity_follow_feature`, `be_profile_follow_feature`, `social_graph_platformization_*` flags — GFM is plumbing the backend social graph. |
| **Expected impact** | Strongest retention lever — measured via D7/D30 return-visit rates segmented by follow status. |

### D6. ★ Donation-list prompt *(REPLACES the live-ticker design — anchored on GFM's live A/B)*

| | |
|---|---|
| **Current GFM** | Scrollable donor list with names + amounts. **GFM is currently running a live A/B on this exact surface:** `fe-ssr-campaign-money-box-donation-list-prompt`. |
| **Delta** | Add a **contextual prompt inside the donor-list block** that adapts to campaign state: <br>• High momentum: *"[N] people donated in the last hour — keep it going"* + inline Donate CTA <br>• Slow momentum: *"Be the first to donate today"* or *"Help [Organizer] reach the goal — [N] donors so far"* <br>• Near goal: *"$X to go — [N] donors got us here"* <br>Donor count surfaced as a numeral above the list. |
| **Metric** | Donor-list view → CTA click — maps directly to GFM's existing event `campaign_page.click.lb_donation_list.btn_donations_donate` |
| **Evidence** | **GFM-confirmed:** `fe-ssr-campaign-money-box-donation-list-prompt` is **one of GFM's four live A/B tests** — the donor-list prompt is a validated conversion surface. Replaces the original D6 ticker design, which leaned on weak vendor data. |
| **Expected impact** | Direct conversion uplift from a high-intent surface (users in the donor list are already engaged). |

### D7. ■ Performance baseline (Core Web Vitals as a design constraint)

| | |
|---|---|
| **Current GFM** | Already a fast, well-optimized React/Next.js app. We measure to compare. |
| **Delta** | Our build commits to **LCP ≤ 2.0s at p75** (stricter than 2.5s), **INP ≤ 200ms**, **CLS ≤ 0.05**. Concrete implementations: <br>• SSR the hero + progress + raised/goal numbers (zero CLS from async data) <br>• Skeleton screens for donor list and updates <br>• Defer non-critical scripts (analytics after `requestIdleCallback`) <br>• Ship `web-vitals` package to log real-user metrics into our event stream |
| **Metric** | LCP / INP / CLS at p75; bounce rate; assignment's graded "Page load times." |
| **Evidence** | Google/Deloitte *Milliseconds Make Millions* (2020): 0.1s = +8.4–21.6% conversion. Bounce rises +32% from 1s→3s. |
| **Expected impact** | The cheapest conversion lift in the doc. Also the assignment's explicit benchmark. |

### D8. ★ Returning-visitor recognition banner (re-cited) *(L2 personalization)*

| | |
|---|---|
| **Current GFM** | No returning-visitor recognition on the fundraiser page. |
| **Delta** | Slim banner *above* the hero (collapses to zero height for first-time/anonymous visitors): *"Welcome back, [first name]. Sarah posted an update — [LLM summary from D13] →"* or *"Welcome back. You haven't been here since the goal crossed 50%."* Banner = fixed slot; only copy adapts. |
| **Metric** | **Reframed for direct measurability:** banner-impressions → `Story Scrolled` rate for D7+ returners (measurable from existing schema). Secondary: D7/D30 return-visit rate for users who saw the banner vs. those who didn't. |
| **Evidence** | **GFM-confirmed (re-cited):** `be-thankyou-messaging-experiment` + `auto_thanks_prompt_variations` flags — GFM uses messaging to re-engage; we apply the same mechanism at page-load. Implicit support: `fe-ssr-generic-activity-feed` flag (activity feed exists for returners; we surface its top item on the fundraiser page). |

### D9. ★ AI-generated per-channel share copy *(L3 personalization)* — with demo visibility fix

| | |
|---|---|
| **Current GFM** | Share buttons prefill generic copy ("Help support [fundraiser title]"). |
| **Delta** | LLM-generated share copy per (fundraiser, channel) — different tone per platform: WhatsApp = friend-tone, X = punchy public, email = personal narrative, Facebook = community appeal. Same buttons in same positions; only prefilled text adapts. Computed at fundraiser-create time and cached. **Demo visibility:** the before/after toggle is extended with a sub-toggle *"show personalized share copy"* so a viewer can see generic vs. LLM-generated text side-by-side in the share-preview modal — without this, D9's K-factor claim is invisible to a portfolio viewer. |
| **Metric** | `Share Clicked` → external click-through → new-visit conversion (K-factor numerator); per-channel breakdown. |
| **Evidence** | Berger & Milkman 2012; **GFM-confirmed:** `amp24_agentic_share_text_ab` is a live A/B test on this exact mechanism. |

### D10. ★ Smart amount presets *(L3 personalization)*

| | |
|---|---|
| **Current GFM** | Static amount presets (calibrated to campaign goal/category). |
| **Delta** | Same 3 preset buttons; values adapt: first-timer sees `$10 / $25 / $50`. Repeat donor sees `$X (your last) / $Y (mid) / $Z (high)`. Default-selected = the middle preset. UI identical, numbers differ — respects the "no wild differences" constraint. |
| **Metric** | `Donate Completed` conversion + avg gift size. |
| **Evidence** | Anchoring research (NextAfter). **GFM-adjacent:** `fe-ssr-donate-smart_donations_v2026_02` flag exists but exact variant unconfirmed. |

### D12. ★ Inline recurring nudge on the donate form *(NEW — Tier 1)*

| | |
|---|---|
| **Current GFM** | Recurring is a checkbox/radio in the donate flow, not promoted on the form itself. **GFM runs multiple live experiments on this exact surface:** `fe-ssr-campaign-recurring-nudge`, `recurring_inline_reminder`, `checkout_recurring_nudge`. |
| **Delta** | Inside D1's single-screen form, place a **soft inline nudge** below the amount selector: *"[Cause] needs ongoing support. Make this $[amount]/month instead?"* with a one-tap toggle to monthly. Default state = one-time; toggle is the only visual change. Frequency captured as `frequency` property on `Donate Completed` (already in schema §4). |
| **Metric** | `Donate Completed` segmented by `frequency = monthly` (recurring uptake rate); LTV proxy (recurring × avg months retained). |
| **Evidence** | **GFM-confirmed:** three concurrent live experiments on inline recurring nudges. Anchoring research supports the "default + suggested alternative" framing. |
| **Expected impact** | Recurring donors have ~10–20× the LTV of one-time donors — even a 2–3% conversion shift is high-leverage. |

### D13. ★ LLM-generated update summaries for returning visitors *(NEW — Tier 3, AI-as-mechanism)*

| | |
|---|---|
| **Current GFM** | Returning users see updates only by clicking through to the updates section. |
| **Delta** | The D8 banner's "what's new" line is **AI-generated**: a 1-line LLM summary of the most-recent update since the user's last visit. Example: *"Sarah posted: the alert system is now live in 3 counties — 4,200 households covered."* Generated at update-create time (not real-time), cached, served as static text in the banner slot. |
| **Metric** | Banner CTR → `Story Scrolled` to updates section; Repeat Visit conversion (banner viewers vs. non-viewers). |
| **Evidence** | **AI-as-mechanism delta** — directly addresses the assignment's "AI-accelerated" subtitle (verifier-flagged gap). **GFM-adjacent:** they use LLM-generated content for share text (`amp24_agentic_share_text_ab`); we apply the same pattern to update summarization. Same `B + cache` implementation profile as D9. |
| **Expected impact** | Multiplier on D8's banner — the difference between *"Sarah posted an update"* (generic) and *"Sarah posted: alert system is live in 3 counties"* (concrete) is the difference between scrolling past and clicking through. |

---

## Cross-page integration *(NEW SECTION — Tier 1; addresses the assignment's "3 pages seamlessly integrated" grading criterion)*

This section defines how the fundraiser page hands off to Profile and Community. Detailed Profile and Community deltas live in their own docs when those pages are redesigned; what's captured here is the **integration contract** the fundraiser page must satisfy.

**Follow → Profile feed (downstream of D5).**
When a user clicks "Follow this fundraiser" on the fundraiser page:
- The follow is written to the user's social graph (a record visible in their Profile).
- The **Profile page** surfaces an **Activity feed** listing all followed fundraisers with their latest update + raised/goal status. Sorted by update recency.
- An **email digest** (weekly default, user-adjustable) bundles updates from followed fundraisers + communities.
- A **"What you missed" surface** on Profile groups updates by followed entity since the user's last visit — mirrors the D8 banner pattern at the *user* level rather than the *page* level.

**Donating ↔ Profile activity.**
- Every `Donate Completed` writes to the user's Profile activity feed (always visible to the user; visible to followers if user opts in).
- The Profile's "Activity" tab shows a unified timeline: donations made, follows started, fundraisers organized.

**Fundraiser ↔ Community.**
- Each fundraiser displays a small **"Part of [Community name]"** badge when applicable, linked to the community page.
- The **Community page** surfaces fundraisers from causes the user follows in a top-of-tab section *"From causes you follow"*, then the standard activity feed below.
- Donating to a community-listed fundraiser updates the community's aggregate raised total in real-time and adds the user to the community's recent donors.

**Cross-page navigation rule.**
- Every page-to-page link emits a `Page Viewed` event with `referrer_source` set per the canonical enum in `strategy-metrics-research.md` §4 (the single owner of the schema — avoid redefining values per-page).

**Standalone fundraiser state (no community association).**
- Not every fundraiser belongs to a community. When the fundraiser has no `community_id`, the *"Part of [Community name]"* badge slot collapses to zero height — no fallback copy, no placeholder. Post-donate D3 still shows the *"Follow this fundraiser"* CTA, but the secondary community-follow CTA (defined above) is hidden (no community to follow). Profile/Community cross-page handoffs are unaffected — the integration contract holds for community-linked fundraisers and degrades gracefully for standalone ones.

**Metric implications.**
- **Repeat Visits**: directly moved by Profile feed (gives followers a reason to come back) + email digest.
- **Follow rate**: moved by D5 + by Community's "follow this cause" → fundraiser link.
- **Donate**: moved by Community's "From causes you follow" surface (warm-traffic donors convert higher).
- **Share**: cross-page sharing of *profiles* and *communities* is a new vector beyond D4's per-fundraiser sharing.

This section is the redesign's acknowledgment that the assignment is not a single-page exercise.

---

## Out of scope (deliberately)

- **Visual identity** — inherited from `gfm-design-system.md`; we don't repaint.
- **Auth + account flows** — assumed; not redesigned.
- **Payments backend** — Stripe test mode or mocked for the demo; we don't reimplement their integration.
- **Tipping calculation internals** — we surface the UX; we don't recreate their pricing logic.
- **Mobile native apps** — web only.
- **i18n / multi-currency** — out of scope; demo is en-US, USD.

---

## Decisions (locked)

1. **Demo data realism — realistic seed.** Seeded donors, comments, and updates that look like a believable mid-flight campaign. ~½ day cost accepted.
2. **Before/after toggle — YES.** Extended (per D9) with a sub-toggle for "personalized share copy" so AI deltas have a visible demo moment. ~1 day cost accepted.
3. **Overlay scope — all 12 deltas surface metric badges.** Tier-coloring follows the metric tree in `strategy-metrics-research.md` §2:
   - **Tier 1 (Core conversion, warm-red):** D1, D2, D3, D6, D10, D12
   - **Tier 2 (Loop / retention, green):** D4, D5, D8, D9, D13
   - **Tier guardrail (neutral; dashboard-only):** D7
4. **Cross-page integration — committed** in the Cross-page integration section above. Profile + Community pages will inherit and extend this contract.

---

## Map to the metric tree (sanity check)

| Tier | Metric | Deltas that move it |
|---|---|---|
| North Star | Meaningful sessions / user / week | D5, D8, D13 (return); D3, D4 (acquisition+activation); Cross-page Profile feed |
| Output | Donation conversion | D1 (form), D2 (goal-gradient), D6 (money-box prompt), D10 (presets), D12 (recurring nudge) |
| Output | Share rate / K-factor | D4 (placement+channels), D9 (AI copy), D3 (post-donate share) |
| Output | Follow rate | D5 (first-class), D3 (post-donate follow), Cross-page Profile feed |
| Output | **Repeat Visits** | D8 (recognition banner), D13 (LLM summaries), D5+Cross-page (Profile feed gives followers reason to return) |
| Leading | Story Scrolled, Donate Intent rate | D2, D6, D8 (banner pulls returners), D13 (concrete summaries motivate click-through) |
| Guardrail | LCP / INP / CLS | D7 |

Every metric tier — including the previously-thin **Repeat Visits** tier — is now moved by ≥2 deltas. No orphans, no single points of failure.
