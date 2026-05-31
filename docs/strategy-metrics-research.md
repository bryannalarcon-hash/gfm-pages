# Metrics & UX Research — GoFundMe Pages

> Research synthesis backing the metric strategy for the Fundraiser page (extended to Community & Profile). Citations were gathered by a parallel research swarm and verified by fetching the source where possible; unverifiable claims are flagged `[UNVERIFIED]` so the doc doesn't overclaim.

---

## Summary (TL;DR)

**We optimize a behavioral loop, not a page.** The assignment's metrics — *repeat visits* + *meaning actions (donate, share, follow)* — are interdependent: sharing acquires new visitors, following brings them back, donating is the core conversion. Design and instrumentation should serve that loop.

**Five best-evidenced bets** (★ = independently confirmed by GoFundMe's own observable experimentation — see `gfm-observed-metrics.md`):
1. **Make "Follow" first-class** — it's the retention engine. Users with social ties visited ~2× as often (12.6 vs 6.7) in a large study.
2. **★ Place share CTAs at emotional/milestone beats, and instrument per-channel** — high-arousal emotion drives sharing; GoFundMe emits *channel-level* events (e.g. `btn_share_whatsapp`, `btn_share_messenger`) and runs share-funnel experiments (`amp24_agentic_share_text_ab`, `amp25_sharehub_v2_ab`).
3. **★ Treat the post-donate moment as a *second* conversion surface** — GoFundMe runs `donation_upsell` and `fe-ssr-post-donate-redesign-ab` here; our schema (§4) now has its own Post Donate event group.
4. **Treat sub-2.5s LCP as non-negotiable** — universal research-strong lever: a 0.1s improvement moved conversion 8–21% (Google/Deloitte). Not GFM-specific, but it's a graded benchmark and converges with everything else.
5. **Instrument rates, not pageviews** — funnel + cohort-retention analysis on a clean event schema; pageviews are vanity denominators.

**Benchmark to target:** donation-page completion averages ~12% (M+R 2025), but warm "shared-link" traffic should hit **20–35%+**. Internal KPI floor: 20%; below 10% signals a friction problem to fix first.

**Key honesty caveats:**
- "Amazon 100ms = 1% sales" is `[UNVERIFIED]` (originates from a 2006 internal deck) — don't cite externally.
- **Identifiable-victim effect is now de-prioritized** — a 2023 pre-registered replication failed, *and* GFM's own experiment portfolio doesn't appear to test beneficiary-framing variants. Treat as soft storytelling guidance, not a core lever. (Demoted in §3.)

---

## 1. Thesis: optimize the loop

```
Visit → Activate (donate / share / follow) → that action pulls in others / brings you back → repeat
```

Two engines make the loop self-sustaining:

- **Sharing = acquisition engine.** GoFundMe's own data: each share drives ~$100 more toward the goal on average, and campaigns shared 6+ times in the first days are **3× more likely** to raise more. ([GoFundMe, *Social State of Giving*, 2024](https://www.gofundme.com/c/socialgiving))
- **Following = retention engine.** In an 84,828-member study, participants with social connections visited **12.6 vs 6.7 times** (~2×, P<.001) and completed nearly twice as many prompted actions. (Maher et al., *J Med Internet Res*, 2012 — [PMC3374540](https://pmc.ncbi.nlm.nih.gov/articles/PMC3374540/); health-intervention context, but the social-tie→retention effect transfers.)

---

## 2. Metric tree (Fundraiser page)

| Tier | Metric | Why it's here | Anchor |
|---|---|---|---|
| **North Star** | Meaningful sessions / user / week (visit + ≥1 intentional action) | Captures core value; leading indicator | [Amplitude North Star Playbook](https://amplitude.com/books/north-star/about-north-star-framework) |
| **Output** | Donation conversion, share rate, follow rate | The "meaning actions" we're graded on | M+R Benchmarks 2025 |
| **Leading** | Story scroll-depth, donate-intent rate, activation (first action <48h), D1/D7 return rate | Predict outputs; where you intervene | HEART (Google, CHI 2010); AARRR |
| **Guardrail** | LCP / INP / CLS, bounce rate | Latency suppresses everything above | Google/Deloitte; web.dev |

**Frameworks that shaped the tree:**
- **North Star Metric** — single metric bridging customer value, product behavior, and business outcome (Sean Ellis; systematized by [Amplitude](https://amplitude.com/books/north-star/about-north-star-framework)).
- **Google HEART** — Happiness, Engagement, Adoption, Retention, Task-success, via a Goals→Signals→Metrics process. (Rodden, Hutchinson & Fu, Google, *ACM CHI 2010* — [kerryrodden.com/heart](https://kerryrodden.com/heart/))
- **AARRR / Pirate Metrics** — Acquisition, Activation, Retention, Referral, Revenue (Dave McClure, 2007; explainer: [PostHog](https://posthog.com/product-engineers/aarrr-pirate-funnel)).
- **Aha moment / activation** — one early high-value action flattens the retention curve (Facebook's "7 friends in 10 days"; [Mode analysis](https://mode.com/blog/facebook-aha-moment-simpler-than-you-think/)). For us: test whether sharing within 48h predicts retention.
- **Retention curve** — a curve that drops then *flattens* at a non-zero floor is the canonical product-market-fit signal ([Amplitude](https://amplitude.com/explore/analytics/retention-curve)).

---

## How our North Star aligns with what GFM optimizes

Once we observed GoFundMe's actual instrumentation (`gfm-observed-metrics.md`), a natural question arose: if their page tells us what they optimize, do we still need academic UX research? **Yes — the three layers do different jobs:**

| Layer | What it answers | Source | Status |
|---|---|---|---|
| **North Star** | *What outcome are we maximizing?* | The assignment: Repeat Visits + Meaning Actions (Donate / Share / Follow) | Non-negotiable spec |
| **Validation** | *Is the target real or vanity?* | GFM's observed events: heavy on donate, channel-level share, post-donate, follow, PYMK | Confirms the target |
| **Interventions** | *Which UX choices actually move it?* | Academic + industry research (anchoring, goal-gradient, performance, virality, retention) | Still required — events tell us *what* GFM measures, not *what to do* |

**Convergences (research bets GFM independently confirms ★):**
- **Per-channel share telemetry** → matches GFM's `btn_share_whatsapp`, `btn_share_messenger`, `btn_share_sms`, etc.
- **Post-donate as a second conversion** → matches `donation_upsell` + `fe-ssr-post-donate-redesign-ab` (both currently live A/B tests).
- **Donation funnel is the primary conversion path** → 4 of 4 GFM live A/B experiments sit in this funnel (`uc_tipping_ui`, `uc_tipping_ui_v2`, `donation_upsell`, `fe-ssr-post-donate-redesign-ab`).
- **Sharing is a systematic improvement program** → GFM's numbered `amp8` → `amp28` initiative is a multi-year share-funnel optimization track; validates putting real engineering behind share.

**Divergences (research items GFM does NOT appear to test):**
- **Identifiable-victim effect** — no beneficiary-photo/framing experiments in GFM's portfolio. Combined with the failed 2023 replication, we demote this from "core lever" to "soft storytelling guidance."
- **Goal-gradient progress-bar urgency copy** — they display a progress bar but don't appear to A/B the urgency framing. Still worth doing in *our* build per Cryder et al., but lower priority than the GFM-confirmed bets.

**Net effect on the metric tree (§2):** unchanged — the North Star and tier definitions still hold. What changes is the **prioritization** in §3 (research) and §4 (schema): GFM-confirmed levers get the ★ tag and are built first; demoted items become storytelling notes rather than instrumented experiments.

---

## 3. Why these — the conversion/UX research

### Donation conversion levers (each → a UI decision)

Ordered by confidence; ★ = GFM independently experiments in this area.

- **Goal-gradient / progress bar** — giving accelerates as a campaign nears its goal. (Cryder, Loewenstein & Seltman, *J. Experimental Social Psychology*, 2013 — [ResearchGate](https://www.researchgate.net/publication/272079048_Goal_gradient_in_helping_behavior)). → Prominent progress bar; the final 15–20% is the highest-urgency window.
- **Anchoring via suggested amounts** — the donation array shapes gift size, but too-high suppresses giving. ([NextAfter behavioral-economics writeup](https://www.nextafter.com/blog/5-behavioral-economics-theories-to-keep-your-nonprofit-from-getting-left-behind-creative-science/)). → Calibrated presets; default-select a mid/high tier; A/B test.
- **★ Form friction / tipping checkout UI** — fewer required fields ≈ **+39%** conversion; multi-step forms can roughly **halve** completion; requiring phone costs ~2%. ([betterworld.org compiling iDonate/SoapboxEngage](https://betterworld.org/blog/nonprofits/12-ways-to-improve-your-donation-form-conversion-rate-before-your-next-campaigns/)). → ≤4–5 fields, guest checkout, single screen, no required phone. *GFM-confirmed:* `uc_tipping_ui` and `uc_tipping_ui_v2` are the live A/B tests with 9+ variants each — they're optimizing exactly the tip/checkout friction surface.
- **Social proof of recent donors** — a live donor feed lifted conversions ~3.5% in Fundraise Up's test; consistent with Cialdini. **Authenticity is mandatory** — fake/inflated counts destroy trust. ([Fundraise Up experiment — `[UNVERIFIED direct fetch; search-snippet confirmed]`])
- **★ Post-donate as a second conversion surface** — the moment after a successful donation is its own funnel: share, recurring upgrade, follow. → Separate event group in §4. *GFM-confirmed:* `donation_upsell` and `fe-ssr-post-donate-redesign-ab` are both live A/B tests.
- **Identifiable victim effect — DEMOTED** — Small, Loewenstein & Slovic (*OBHDP*, 2007) found a single named, photographed beneficiary out-raises statistical framing. → *Originally:* one beneficiary photo + personal story near donate. *Now downgraded* because (a) Maier et al. 2023 pre-registered replication failed to support the effect (`[UNVERIFIED — 403 on direct fetch]`), and (b) GFM's experiment portfolio doesn't include beneficiary-framing variants — if it were a strong lever, they'd be testing it. Keep it as soft *storytelling guidance* (one named beneficiary is still good narrative practice), but don't instrument an experiment around it.

### Sharing / virality levers

- **High-arousal emotion drives sharing** — awe, anger, anxiety > sadness; positive > negative overall, but *activation level* is the key variable. Sharing also signals identity (social currency). (Berger & Milkman, *J. Marketing Research*, 2012 — [SAGE](https://journals.sagepub.com/doi/10.1509/jmr.10.0353)). → Put share CTAs right after a milestone or emotional update beat; track the trigger source.
- **Viral coefficient (k-factor)** = invites/user × invite-conversion-rate; k>1 is exponential and rare, 0.2–1.0 is a meaningful tailwind. ([GrowSurf glossary](https://growsurf.com/glossary/viral-coefficient/)). → Compute k per campaign; surface "≈3 shares brings 1 donor" to nudge organizers.
- **Peer-to-peer compounding** — returning fundraisers raise a median **$501 vs $222** for first-timers; 5+ year participants average ~$4,425. ([Blackbaud P2P data via Peer-to-Peer Forum](https://www.peertopeerforum.com/fundraising-guides/peer-to-peer-fundraising-data/)). → Invest in profiles/repeat-organizer flows.

### Performance → conversion (graded benchmark *and* a lever)

- **Google/Deloitte, *Milliseconds Make Millions* (2020)** — 30M+ sessions; a **0.1s** load improvement lifted conversion **+8.4% retail / +10.1% travel / +21.6% lead-gen**. ([web.dev case study](https://web.dev/case-studies/milliseconds-make-millions))
- **Bounce probability** rises **+32%** (1s→3s) and **+90%** (1s→5s). ([Google mobile benchmarks](https://business.google.com/ca-en/think/marketing-strategies/mobile-page-speed-new-industry-benchmarks/))
- **Core Web Vitals thresholds** (75th percentile of real users): **LCP ≤2.5s · INP ≤200ms · CLS ≤0.1**. Google's case studies link CWV gains to business outcomes (e.g., Lazada +16.9% mobile CVR, Vodafone +8% sales). ([web.dev/vitals](https://web.dev/articles/vitals), [vitals business impact](https://web.dev/case-studies/vitals-business-impact))
- **`[UNVERIFIED]`** the "Amazon 100ms = 1% sales" figure originates from a 2006 internal deck and is not publicly verifiable — do not cite externally.
- **Next.js implications:** SSR/ISR the hero + raised/goal numbers (kills CLS from async data); `next/image priority` above the fold (LCP); defer the donor-feed hydration with `startTransition` (INP); ship the `web-vitals` package to log real-user sessions; skeleton screens for hero/progress/donor-list (perceived speed + CLS — Mejtoft et al., *ECCE 2018*, [ACM DL](https://dl.acm.org/doi/10.1145/3232078.3232086); specific "20% faster" figure `[UNVERIFIED]`).

### Instrumentation best practices

- **Event taxonomy:** object-action naming, Title-Case events, snake_case properties, past-tense actions; keep specifics in *properties*, not event names (avoids metric sprawl). ([Twilio Segment naming guide](https://www.twilio.com/en-us/resource-center/naming-conventions-for-clean-data))
- **Vanity vs actionable:** pageviews measure volume, not intent, and can't be experimented on directly. Optimize *rates*. (Lean Analytics, Croll & Yoskovitz, 2013 — attribution `[UNVERIFIED — book not fetched]`).
- **Funnel + cohort retention:** funnels show where users drop *within* a journey; cohort retention shows *when* they disengage (Day 7 vs Week 4). ([Amplitude cohort retention](https://amplitude.com/explore/analytics/cohort-retention-analysis))
- **Privacy/tooling:** **PostHog** (funnels + cohorts + session replay, self-host/EU, GDPR-clean) is the strongest fit given donor data; Plausible for traffic-only; GA4 carries EU enforcement risk. ([Plausible](https://plausible.io/privacy-focused-web-analytics), [PostHog vs GA4](https://posthog.com/blog/posthog-vs-ga4))

---

## 4. Event schema (Fundraiser funnel)

Every event carries a base context: `session_id`, `campaign_id`, `referrer_source` (see canonical schema below), `device_type`, `timestamp_utc`.

**Canonical `referrer_source` schema** (single-owner; referenced by all 3 page redesigns to avoid drift):

| Value | Fires when |
|---|---|
| `social` | Inbound from a social platform (FB / X / WhatsApp / etc. — distinguished further by UTM where available) |
| `email` | Inbound from a non-GFM email (newsletter, manual share) |
| `direct` | Direct nav / typed URL / bookmark |
| `search` | Organic search result |
| `profile` | Click from a Profile page (P5 carousel, P9 recurring nudge) |
| `community` | Click from a Community page (generic — e.g. About tab links) |
| `community_leaderboard` | Click from the Community leaderboard surface (C4) |
| `community_share` | Inbound from a community-level share (C6) |
| `fundraiser` | Click from a Fundraiser page (rare — fundraisers usually link out, not in) |
| `profile_share` | Inbound from a profile share (P8) |
| `profile_digest_email` | Click from the weekly digest email owned by P2 |
| `profile_recurring_nudge` | Click from the P9 recurring CTA opening the donate flow |

The single owner of this enum is `strategy-metrics-research.md`; all per-page redesign docs reference it instead of redefining values.

| Event | Trigger | Key properties |
|---|---|---|
| `Page Viewed` | fundraiser page load | `referrer_source` |
| `Story Scrolled` | >50% of story | `scroll_depth_pct`, `time_on_page_sec` |
| `Donate Intent` | donate CTA click | `cta_location` (hero/sticky/bottom) |
| `Amount Selected` | pick/type amount | `amount_usd`, `selection_type` (preset/custom), `frequency` (one_time/monthly) |
| `Donate Started` | payment form rendered | `amount_usd`, `payment_method_type` |
| `Donate Completed` | successful transaction | `amount_usd`, `payment_method_type`, `frequency`, `transaction_id`, `tip_amount_usd`, `tip_preset_label`, `attributed_share_id`, `attributed_sharer_token` (pseudonymous; single-touch — powers S3 sun growth) |
| `Donate Failed` | transaction error | `error_code`, `amount_usd` |
| `Share Clicked` | share button | `share_channel` (facebook / x / whatsapp / messenger / sms / email / copy_link / native_share / embed), `share_context` (hero / sticky / post_milestone / post_donate / update / footer / **studio** / **community**), `share_id` (minted per share — powers S3 single-touch attribution) |
| `Follow Clicked` | follow CTA | `follow_context` (post_donate / sidebar / header) |

> **Tip tracking lives on `Donate Completed`, not its own event** — GFM's `effective_rate_tip_amounts` is a *goal metric* (an analysis aggregation), not a click event. We follow the same pattern: `tip_amount_usd` and `tip_preset_label` are properties of the donation, so we can A/B test tip presets later by grouping `Donate Completed` rows on `tip_preset_label`.
>
> **Per-channel share telemetry is mandatory** (informed by GFM's observed schema in `gfm-observed-metrics.md` — they fire distinct events per channel like `btn_share_whatsapp`). We use **one event + `share_channel` property** instead of one event per channel (leaner schema, same slicing power in Amplitude/PostHog), but `share_channel` must be set at the *click* — never aggregated later. Same for `share_context` so we know *which surface* the share came from.

### Post Donate — the second conversion surface

GFM treats the moment immediately after payment as a *second* conversion: their `donation_upsell` and `fe-ssr-post-donate-redesign-ab` experiments target it, and they emit distinct `post_donate.*` events. We mirror that — the post-donate screen gets its own event group so we can measure share-on-success, recurring upgrades, and follow-after-donate independently from the main page:

| Event | Trigger | Key properties |
|---|---|---|
| `Post Donate Viewed` | post-donate screen renders | `amount_usd`, `frequency`, `first_time_donor` (bool) |
| `Post Donate Share Clicked` | share from post-donate surface | `share_channel`, `time_since_donate_sec` |
| `Post Donate Recurring Upgrade Clicked` | one-time → monthly upgrade CTA | `current_amount_usd`, `proposed_amount_usd` |
| `Post Donate Follow Clicked` | follow organizer/community from post-donate | `follow_target` (organizer / community) |
| `Post Donate Dismissed` | leave screen without secondary action | `time_on_screen_sec` |

**Derived metrics:** engagement rate (`Story Scrolled`/`Page Viewed`), intent rate, checkout completion (`Donate Started`/`Donate Intent`), conversion (`Donate Completed`/`Donate Intent`), payment-failure rate, follow→return-visit rate (7d/30d), and — new from the post-donate group — **second-conversion rate** (`Post Donate Share Clicked` / `Post Donate Viewed`), **recurring-upgrade rate** (`Post Donate Recurring Upgrade Clicked` / `Post Donate Viewed` filtered to one-time donors), **per-channel k-factor** (`Share Clicked` grouped by `share_channel`, ÷ `Donate Completed`).

### Board / Mark events — the Suns contribution board (deltas S1–S5, added 2026-05-29)

The Suns board (`feature-contribution-board.md`) gets its own event group so board engagement is measured **without inflating the donate funnel**. **No donor identity and no dollar figures** ride these events; share attribution is pseudonymous (`sharer_token`).

| Event | Trigger | Key properties |
|---|---|---|
| `Section Viewed` | an instrumented section scrolls into view (replaces per-slot impression events) | `section_name` (`returning_banner` / `activity_feed` / `pymk` / `recurring_nudge` / `suns_board` / …) |
| `Mark Created` | a sun is first placed | `action_type` (follow / share / give), `entity_type`, `persona` |
| `Mark Customized` | gradient/colour changed | `gradient_id`, `stops` (1–3) |
| `Mark Grew` | sun size increased from a *settled* donation | `trigger` (own_gift / referred_gift) — never the donor identity or amount |
| `Mark Shared` | the board / own sun shared as an artifact | `share_channel` |

**Derived:** board dwell + return-after-mark (the activation→retention test for **Repeat Visits**); and a **measured k-factor upgrade** — actual downstream dollars per `sharer_token` via `attributed_share_id`, replacing the aggregate share÷donate ratio above.

> **Single-owner note:** this group supersedes the ad-hoc event names the v4.2 mocks authored (`Banner Impression`, `Activity Feed Viewed`, `PYMK Module Viewed`, `Recurring Nudge Viewed`, `Board Viewed`) — all collapse into `Section Viewed { section_name }`. The coder reconciles mock attributes to these canonical names before wiring `capture()`.

---

## 5. Extension to Community & Profile

- **Community page** — North Star = active members returning weekly. Events: `Community Followed`, `Update Read`, `Fundraiser Clicked Through`, `Fundraiser Filter Applied`, `Start Fundraiser Clicked`. Social proof scales (member count, aggregate raised). This is the retention hub that funnels traffic *into* fundraisers — where "unite around causes" lives.

### Community interaction events (added 2026-05-29, canonical count 22 → 24)

| Event | Trigger | Key properties | Tier |
|---|---|---|---|
| `Fundraiser Filter Applied` | User changes the filter on the community fundraisers tab | `filter_type`, `filter_value` | tier-2 (discovery) |
| `Start Fundraiser Clicked` | User clicks the community "Start a fundraiser" CTA | `cta_location` | tier-2 (acquisition) |

`Fundraiser Filter Applied` — discovery signal: tells us which filter facets drive engagement on the fundraisers tab and which are ignored. `Start Fundraiser Clicked` — acquisition signal: measures how often community browsing converts to organizer intent.
- **Profile page** — the connective tissue. Metrics: follower count, cross-fundraiser click-through, repeat-organizer rate. The P2P data ($501 vs $222) argues a profile that makes people come back to organize again compounds hard.
- **Integration graph:** Profile → follows → Community → aggregates → Fundraiser → rolls up → Profile. That graph turns three pages into a destination.

---

## 6. Source-quality notes

- **Strongest evidence:** Google/Deloitte performance data, Core Web Vitals thresholds, Berger & Milkman virality, the Maher et al. social-tie retention study, GoFundMe's own sharing data, M+R completion benchmarks.
- **Use as heuristic, not law:** Fundraise Up social-proof figure (vendor test, indirect verification), practitioner conversion stats compiled by nonprofit blogs (directional, not peer-reviewed).
- **De-prioritized (was a core lever, now storytelling-only):** identifiable-victim effect — failed 2023 pre-registered replication AND GFM does not test beneficiary-framing variants in its observable experiment portfolio. Keep as narrative guidance, not an experiment target.
- **Do not cite externally:** "Amazon 100ms = 1% sales" `[UNVERIFIED]`.
