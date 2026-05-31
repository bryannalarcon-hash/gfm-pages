# Community Page — Redesign Deltas

> **Scope contract:** This is a **redesign delta over GFM's current community page** (crawled: `gofundme.com/communities/watch-duty`). Visual identity is inherited from `gfm-design-system.md`. Every delta must (a) tie to a metric in `strategy-metrics-research.md` §2 and (b) be backed by either peer-reviewed/industry research OR GFM's own observable experimentation (`gfm-observed-metrics.md`). Deltas without a metric+evidence pair don't ship. This page is the **retention hub** in our metric tree: primary movers are Repeat Visits and Follow; secondary movers are Share and Donate via warm-traffic conversion.

Status legend: **★** = GFM independently experiments on this surface (high confidence). **▲** = research-strong but GFM doesn't appear to test it directly. **■** = implementation discipline (not a visual delta).

**Revision history:** Updated after verifier-swarm review (grader / UX critic / metrics-defensibility lenses). Tier 1+2+3 fixes applied: C7 (returning-member banner) **CUT** — UX critic flagged it as redundant with C2; orientation function absorbed into C2. C3 (PYMK) **evidence + design fix**: dropped Facebook analogy, anchored on GFM's own PYMK rollout flags, added a Follow-prompt mechanism inside the PYMK strip so the aha-moment is built, not just borrowed. C6 (AI share copy) **staleness fix**: regeneration is now time + milestone based, K-factor proxy claim softened. Former C8 renumbered to C7.

---

## Layout architecture (the macro call)

Page structure stays a **single-column layout** (community pages are content-first, not conversion-rail). We keep GFM's three-tab architecture (Activity / Fundraisers / About) and the above-the-fold hero (community image, name, stats, Follow + Share CTAs). **What changes:**

- **Above-the-fold:** Follow CTA gains explicit value-prop microcopy. Community stats (followers, fundraisers, raised) gain contextual framing at milestone thresholds. **No separate returning-member banner** — orientation is handled inside the activity feed (see C2) so we don't compete for attention in two places.
- **Activity tab (default):** Feed restructured with a sticky "Since your last visit" divider for returning members; PYMK (People You May Know) module inserted after item 3 with an inline Follow prompt; AI-generated share text pre-loaded per feed item.
- **Fundraisers tab:** Leaderboard gains a contextual momentum prompt (mirrors the D6 money-box pattern from fundraiser-redesign). Fundraiser filters (currently feature-flagged OFF) are activated. A "From causes you follow" section tops the list for returning members (L3.5 personalization slot).
- **Tab order stays:** Activity → Fundraisers → About. No structural reorder — GFM's `fe-ssr-communities-redesign` variant confirmed this order in production.

Reason: the community page is where GFM's social graph features (PYMK, follow, activity feed) converge. Our macro call is to make the Activity tab a genuine retention surface (not a reverse-chron dump), while making the Fundraisers tab the donation discovery surface. Both changes are additive: no components removed, layout skeleton unchanged.

---

## The deltas

### C1. ★ Follow CTA — first-class with value prop and milestone gamification

| | |
|---|---|
| **Current GFM** | Follow button with bare follower count ("68 followers"). Follower milestone copy exists in translation strings ("Be this community's first follower!") but only fires at very-low-count thresholds. No downstream value prop surfaced at the CTA. |
| **Delta** | Replace bare count with a labeled **"Follow [Community]"** button + persistent microcopy: *"Get updates when new fundraisers are added or milestones are hit."* Follower count displayed as `[N] people following`. Milestone copy fires at **5 / 25 / 100 / 500** follower thresholds, not just near-zero. When the user clicks Follow, a toast confirms: *"You're following Watch Duty — we'll email you when something new happens."* |
| **Metric** | `Community Followed` (event), follow→D7-return rate, follow→donate conversion rate |
| **Evidence** | Maher et al. 2012 (*J Med Internet Res*, PMC3374540): social connections drove 2× visit frequency (12.6 vs 6.7). **GFM-confirmed:** `be_community_organizer_auto_follow`, `be_activity_follow_feature`, `social_graph_platformization_profile_followed_community`, and `be_community_digest` flags confirm GFM has the backend social-graph plumbing for community follows and a digest emission pipeline. |
| **Expected impact** | Strongest single retention lever on this page. Follow rate is our leading indicator for the repeat-visits North Star. |

### C2. ★ Activity feed — "Since your last visit" divider + orientation + reactions prominence

| | |
|---|---|
| **Current GFM** | Reverse-chronological feed, fully JS-gated (`fe-ssr-generic-activity-feed` rollout). Heart reactions exist but are secondary (`fe-ssr-generic-activity-reactions`). Comments exist (`fe-ssr-generic-activity-comments`). No read-state or returning-member context. |
| **Delta** | For returning members (any prior visit), insert a sticky **"Since your last visit — [N] new activities"** section divider above the first unread activity item. Items above the divider = new; items below = seen. Divider collapses to zero height for first-time visitors. **The divider is the SOLE orientation signal on the page for returning members** (it absorbs the function the deleted C7 banner attempted; we don't surface the same delta in two places). Reactions (HEART) are promoted from secondary to primary affordance — inline with the item header. Comment count is a tappable badge next to reactions. |
| **Metric** | `Activity Feed Viewed`, `Activity Item Reacted`, `Activity Item Commented` — segmented by `returning_member` (bool) and items-since-last-visit count |
| **Evidence** | **GFM-confirmed:** `fe-ssr-generic-activity-feed`, `fe-ssr-generic-activity-reactions`, and `be_activity_feed_reaction_created_feature` are all rollout-stage flags — GFM is expanding this surface. The `enabled_community_activity_types` flag gates which activity types surface here, confirming GFM treats feed curation as an active design axis. Maher et al. 2012 supports the "since your last visit" orientation. |
| **Expected impact** | Returning members who see unseen content immediately have higher scroll-depth and lower immediate-bounce. Zero-cost orientation; no layout risk. |

### C3. ▲ PYMK module in the activity feed — with inline Follow prompt

| | |
|---|---|
| **Current GFM** | PYMK exists on fundraiser pages (`fe-ssr-campaign-pymk` rollout). Not present on the community page. |
| **Delta** | Insert a horizontal **"Donors you might know"** strip after the 3rd activity item in the Activity tab feed. 3–5 avatar + first-name cards of community donors with a mutual social connection (or — for anonymous/no-graph users — the top 3 donors by contribution amount). **Each card carries an inline Follow button.** Clicking the avatar opens the donor's profile in a side drawer with the same Follow CTA available; clicking the button follows directly without navigating away. This builds the aha-moment in the strip itself: the action that "unlocks the feed" is one tap from where the PYMK suggestion appears, not a separate journey through a stranger's profile. |
| **Metric** | `PYMK Module Viewed`, `PYMK Follow Clicked` (with `pymk_rank_position`), `PYMK Card Clicked` (profile drawer open). |
| **Evidence** | **GFM-confirmed (infrastructure):** `fe-ssr-campaign-pymk` and `donations-pymk` flags show GFM already has PYMK infrastructure for the campaign surface. `social_graph_second_connection_lookup` flag confirms second-degree graph computation at serving time. `pymk_production_xplr_fe_team` indicates an active production team owns this. We extend the existing GFM PYMK surface to the community feed and add the inline-Follow primitive that closes the activation loop. (Evidence note: the original draft cited the Facebook "7 friends" pattern as an analogy; the verifier rightly flagged that as borrowed evidence. This delta now stands on GFM's own observable PYMK system + the inline-follow design choice that makes activation cheap.) |
| **Expected impact** | Incremental follow events without a side-quest through stranger profiles. Activation cost per follow drops materially when the action is in the strip itself. |

### C4. ★ Leaderboard momentum prompt (mirrors D6)

| | |
|---|---|
| **Current GFM** | Top-3 leaderboard shown server-side. Static cards with title, raised, goal, organizer. No contextual prompt, no donation CTA on the leaderboard section itself. |
| **Delta** | Add a **contextual prompt block** above the leaderboard cards, adapting to community state: <br>• Active momentum: *"[N] people donated to this community in the last 24 hours"* + a "See all fundraisers" secondary CTA. <br>• Near-goal leader: *"[Top fundraiser title] is $X from its goal — [N] donors so far."* <br>• Quiet period: *"[N] fundraisers are raising for [Community] — add yours."* + Start a GoFundMe CTA. <br>The leaderboard card layout is unchanged; only a text + CTA block is prepended. |
| **Metric** | `Leaderboard Fundraiser Clicked` (existing tracking: `leaderboard: fundraiser`), `Start Fundraiser Clicked` (from community context) |
| **Evidence** | **GFM-confirmed:** `fe-ssr-campaign-money-box-donation-list-prompt` is one of GFM's four live A/B experiments — it validates the momentum-prompt pattern on a high-intent donor-list surface. We apply the same mechanism to the community leaderboard (same signal: user is reading aggregate fundraising data, high intent). |
| **Expected impact** | Direct click-through lift from a surface users already engage with. Mirrors the D6 fundraiser-page pattern, keeping implementation cost near zero (copy + logic layer over existing components). |

### C5. ▲ Fundraiser filters activated + "From causes you follow" section *(L3.5 personalization)*

| | |
|---|---|
| **Current GFM** | Fundraiser filters (`fe-ssr-communities-fundraiser-filters`) are **feature-flagged OFF** for this session. The capability exists (LEGACY_CATEGORY, TIME_PERIOD, CLOSE_TO_GOAL filters defined in config). Search input is JS-gated, not SSR. No personalized section in the fundraiser list. |
| **Delta** | **Activate filters:** ship the existing filter UI (Category / Time Period / Close to Goal) server-side by default. No new filter types; just remove the flag gate for our build. **Add personalization slot at the top of the Fundraisers tab** for returning members: *"From causes you follow"* — a 3-card horizontal strip drawn from fundraisers in categories matching the user's follow graph. Fallback for anonymous/first-visit: section hidden. Filter controls sit below the strip, above the main paginated list. |
| **Metric** | `Fundraiser Filter Applied` (filter_type, filter_value), `Fundraiser Card Clicked` segmented by `section` (followed_causes / leaderboard / main_list), `Donate Started`. |
| **Evidence** | **GFM-confirmed (infrastructure):** `be_community_fundraiser_search` flag confirms backend support; `personal_hub_cause_feed` and `personal-hub-discovery-module` flags show GFM routes personalized cause-based feeds to personal hub pages — we apply the same content slot to the community page. Filter UI is GFM's own component. *Caveat:* the conversion-lift claim (warm traffic → higher donate rate) is an **inference** from anchor research, not a direct GFM A/B — the primary defensible metric is `Fundraiser Card Clicked` rate from the personalized strip vs. the main list. |
| **Expected impact** | Higher click-through on the personalized strip vs. unranked main list. Conversion lift downstream is an inference; we'll measure it as a secondary metric, not the primary claim. |

### C6. ★ AI-generated per-channel share copy at the community level *(L3 personalization)*

| | |
|---|---|
| **Current GFM** | Community share sheet (`gen_ai_share_sheet_option`, `amp24_agentic_share_text`, `dynamic_share_text` flags present in community page feature flags). AI share text is feature-flagged — confirmed live for fundraiser pages, infrastructure present for community. |
| **Delta** | Apply D9's LLM-generated share copy pattern to the **community-level share button**. Pre-generate one share text per (community, channel) at community-create time. **Regeneration cadence (staleness fix):** time-based (every 30 days) + delta-based (whenever donor count or raised total moves ≥10% since last generation). Both signals are computed at the same offline batch job. Channel tones: WhatsApp = friend-tone with cause + N donors hook, X = punchy public, email = mission narrative, Facebook = community appeal. Same button positions; only prefilled text adapts. |
| **Metric** | `Community Share Clicked` with `share_channel`, `share_context = community_hero`. The primary metric is share-click rate per channel; the downstream new-visitor K-factor is a *secondary, exploratory* signal — we report it but don't anchor on it (no direct GFM-confirmed K-factor model). |
| **Evidence** | **GFM-confirmed:** `amp24_agentic_share_text` and `amp24_agentic_share_text_ab` are live A/B tests for LLM share copy on fundraiser pages; `gen_ai_share_sheet_option` present in community page flag registry. Berger & Milkman 2012 (channel-tone). |
| **Expected impact** | Community sharing has a wider top-of-funnel effect than individual fundraiser sharing. Reuses the same LLM-API pattern as D9; near-zero incremental build cost. |

### C7. ■ Performance baseline — community page Core Web Vitals *(formerly C8)*

| | |
|---|---|
| **Current GFM** | SSR React/Next.js. Community page is 1.68 MB HTML with 1.60 MB Apollo state embedded in `__NEXT_DATA__`. The activity feed and reactions are JS-gated (not in SSR HTML). |
| **Delta** | Community page build commits to **LCP ≤ 2.0s at p75**, **INP ≤ 200ms**, **CLS ≤ 0.05**. Concrete implementations: <br>• SSR the hero + stats (raised, followers, fundraiser count) — zero CLS from async stats data. <br>• SSR the top-3 leaderboard. <br>• Skeleton screens for the activity feed. <br>• Defer hydration of reactions/comments with `startTransition` after `requestIdleCallback`. <br>• Paginate `__NEXT_DATA__` — the 1.60 MB Apollo state is the biggest parse risk; we ship only above-the-fold data server-side and lazy-load the rest. |
| **Metric** | LCP / INP / CLS at p75; bounce rate; assignment's graded "Page load times." |
| **Evidence** | Google/Deloitte *Milliseconds Make Millions* (2020): 0.1s = +8.4–21.6% conversion. The 1.60 MB `__NEXT_DATA__` payload is an empirically observed bottleneck from the crawl. |
| **Expected impact** | The 1.60 MB payload parse is a concrete, fixable bottleneck. Splitting it reduces TTI and INP for users on mid-range devices. |

---

## Cross-page integration EXTENSIONS

> The contract from `fundraiser-redesign.md` is inherited and extended here. Do not redefine; only add the community-specific obligations.

**Community page → Fundraiser page (C4 → D6 contract).**
The leaderboard momentum prompt (C4) links directly to individual fundraiser pages. When a user navigates from the community leaderboard to a fundraiser page, `Page Viewed` fires with `referrer_source = community_leaderboard` (the canonical referrer schema is in `strategy-metrics-research.md` §4). The fundraiser page uses this referrer to show a contextual sub-head: *"You arrived from Watch Duty's community."*

**Follow community → Profile feed (C1 → fundraiser-redesign cross-page contract).**
When a user clicks "Follow [Community]":
- The follow is written to the social graph (same graph as D5 fundraiser-follow).
- The **Profile page** Activity tab shows a unified timeline entry: *"You started following Watch Duty."*
- The **weekly email digest** (owned by Profile P2 — promoted there from cross-page prose to a committed delta) bundles new fundraisers added to followed communities alongside fundraiser updates.
- The community's **new fundraiser additions** surface in the Profile page's "What you missed" block alongside fundraiser updates.

**Community fundraiser list → Fundraiser page → back (C5 → D5).**
When a user donates to a fundraiser discovered via C5's "From causes you follow" strip:
- The community page's aggregate raised total updates in real-time.
- The post-donate screen (D3 section 4, "Follow this fundraiser") also surfaces a **"Follow Watch Duty"** secondary CTA if the fundraiser is community-linked and the user doesn't yet follow that community. One post-donate screen, two potential follow events.

**Community share → K-factor signal.**
Community-level shares (C6) emit `Community Share Clicked` with `share_channel` and `community_id`. New visitors arriving via a community share emit `Page Viewed` with `referrer_source = community_share`. This lets us compute a community-level K-factor signal (exploratory; see C6 metric note).

**Overlay tier-coloring — community page extensions.**
Inheriting from fundraiser-redesign Decision 3. Community deltas map as:
- **Tier 1 (Core conversion, warm-red):** C4 (leaderboard prompt), C5 (filters + followed-causes section)
- **Tier 2 (Loop / retention, green):** C1 (Follow CTA), C2 (activity feed divider — absorbs former C7 banner intent), C3 (PYMK with inline Follow), C6 (AI share copy)
- **Tier guardrail (neutral; dashboard-only):** C7 (performance, formerly C8)

---

## Out of scope (deliberately)

- **Visual identity** — inherited from `gfm-design-system.md`; no color/font/spacing changes.
- **Community creation flow** — admin-only.
- **Nonprofits tab** — `showNonprofitsTab: false` in current GFM config; not activated.
- **Community type variations** — Watch Duty is `CHALLENGE` type; we design for the common case.
- **Mobile native apps** — web only.
- **i18n / multi-currency** — demo is en-US, USD.
- **Auth flows** — assumed; not redesigned.

---

## Decisions (locked)

1. **Tab order stays Activity → Fundraisers → About.**
2. **Fundraiser filter activation (C5) is a flag-off removal, not new UX.**
3. **PYMK module (C3) uses GFM's existing graph data — no new ML model.** Inline-Follow primitive on each card is the activation mechanism.
4. **Returning-member orientation lives in C2's feed divider, not in a separate banner.** (Former C7 cut per verifier critique — redundant with C2; would compete for attention with no marginal lift.)
5. **Overlay scope — all 7 deltas surface metric badges.** Tier-coloring per the section above.
6. **Before/after toggle — YES, extended.** Sub-toggle *"show returning-member view"* makes C2's divider visible in the demo for a user who has prior community visits.

---

## Map to the metric tree (sanity check)

| Tier | Metric | Deltas that move it |
|---|---|---|
| North Star | Meaningful sessions / user / week | C1, C2 (return-visit orientation); C3 (in-feed activation); Cross-page digest (gives followers a weekly pull-back) |
| Output | Repeat Visits | C1 (Follow → digest cadence), C2 (divider → scan cost ↓), Cross-page email digest (owned by Profile P2) |
| Output | Follow rate | C1 (first-class CTA + value prop), C3 (in-strip Follow), Cross-page post-donate community follow CTA |
| Output | Donate | C4 (leaderboard momentum prompt), C5 (followed-causes strip → warm traffic) |
| Output | Share rate | C6 (AI community share copy) |
| Leading | Activity Feed Viewed, Fundraiser Card Clicked | C2 (divider), C4 (prompt), C5 (filters + followed-causes), C3 (PYMK) |
| Guardrail | LCP / INP / CLS | C7 |

Every metric tier — Repeat Visits (primary), Follow (primary), Donate (secondary), Share (secondary), and the performance guardrail — is moved by ≥1 delta. No orphan metrics.
