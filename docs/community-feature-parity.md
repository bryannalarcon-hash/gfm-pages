# Community Page — Feature Parity Matrix

**Date:** 2026-05-28
**Method:** Cross-reference of `community-features.md` (crawled 2026-05-27, `gofundme.com/communities/watch-duty`) against `community-redesign.md` (C1–C7 deltas), `community-redesign.md` Out of scope section, and `strategy-personalization.md` L3.5 constraints. Every feature from the Full Interaction Table plus narrative-only features in the inventory are classified. No feature appears more than once.

---

## Summary

**Main Feature Parity Matrix (current GFM features):**

| Bucket | Count |
|---|---|
| KEEP AS-IS | 45 |
| CHANGED BY delta | 18 |
| OUT OF SCOPE | 5 |
| CUT | 0 |
| **Subtotal — current features** | **68** |

**Additions (net-new from deltas, no current-page antecedent):** **3** (see Additions sub-table below)

**Grand total surfaced:** **71** (68 current features + 3 additions)

> **Revision (post-verifier):** Three previously-bucketed-as-CHANGED-BY rows moved into a dedicated **Additions** sub-table because they introduce *net-new features that don't exist on the current GFM community page*: PYMK module (C3), "From causes you follow" strip (C5), Leaderboard momentum prompt block (C4). Per the accuracy verifier, CHANGED BY implies a current-feature modification; net-new features belong in Additions. Also: Messenger/SMS share channels re-bucketed from KEEP AS-IS → CHANGED BY C6 (generic LLM-copy applies to all text-prefill channels, only WhatsApp/X/Email/Facebook have explicit tone specs) — aligns with the fundraiser matrix's D9 treatment.

---

## Full Matrix

| # | Feature | Region | Bucket | Delta or Reason | Notes |
|---|---|---|---|---|---|
| 1 | GoFundMe logo → `/` | Global header | KEEP AS-IS | — | Unchanged nav element. |
| 2 | Search icon button → `/s` | Global header | KEEP AS-IS | — | Unchanged nav element. |
| 3 | Donate dropdown (Categories, Crisis relief, Social Impact Funds, Supporter Space, Nonprofits sub-links) | Global header | KEEP AS-IS | — | Global nav; no community delta touches it. |
| 4 | Fundraise dropdown (How to start, categories, team, blog, tips, ideas, charity, nonprofit sub-links) | Global header | KEEP AS-IS | — | Global nav; no community delta touches it. |
| 5 | About dropdown (How it works, Guarantee, countries, pricing, help, about us, newsroom, careers, partnerships sub-links) | Global header | KEEP AS-IS | — | Global nav; no community delta touches it. |
| 6 | Sign in link → `/sign-in?redirect=…` | Global header | KEEP AS-IS | — | Auth flow; out-of-scope auth flows are for redesign; link itself is unchanged. |
| 7 | Start a GoFundMe (header CTA) → `/create/fundraiser` | Global header | KEEP AS-IS | — | Global nav CTA; unchanged. |
| 8 | Mobile hamburger menu (opens nav drawer) | Global header (mobile) | KEEP AS-IS | — | "Mobile native apps" out-of-scope item refers to iOS/Android apps, not mobile-web responsive design. The hamburger is a responsive-web global nav element; no community delta modifies it. |
| 9 | Skip to content link (screen-reader affordance) | Global header | KEEP AS-IS | — | Accessibility; no delta modifies it. |
| 10 | Start a GoFundMe (sticky community header) → `/campaign/605/startfundraising` | Sticky community header | KEEP AS-IS | — | C4 quiet-period prompt adds a Start CTA to the leaderboard block, but the sticky header CTA itself is not modified by any delta. |
| 11 | Community hero image (CloudFront CDN, alt text) | Hero section | KEEP AS-IS | — | Visual identity is out of scope; the image component is unchanged. |
| 12 | Community name display | Hero section | KEEP AS-IS | — | Static display; no delta modifies it. |
| 13 | Community type / organizer metadata (`CHALLENGE`, `showCommunityBy`) | Hero section | KEEP AS-IS | — | Config-driven; no delta touches this. |
| 14 | Hero image mask (SQUARE config) | Hero section | OUT OF SCOPE | Visual identity inherited from `gfm-design-system.md`; no color/font/spacing/visual changes. |  |
| 15 | Stats: Total raised | Hero section | CHANGED BY C7 | C7 — SSR the raised/stats data to eliminate CLS from async loads. | Currently async; C7 commits to SSR hero+stats at p75 LCP ≤ 2.0s. |
| 16 | Stats: Total fundraisers count | Hero section | CHANGED BY C7 | C7 — SSR the fundraiser count stat server-side. | Same as #15. |
| 17 | Stats: Total followers count (in stats block) | Hero section | CHANGED BY C7 | C7 — SSR follower stat server-side. | Same as #15. |
| 18 | Follow button (POSTs follow, updates follower count, unfollow) | Hero section | CHANGED BY C1 | C1 — Follow button gains labeled "Follow [Community]" text + persistent value-prop microcopy; milestone copy fires at 5/25/100/500 thresholds (not just near-zero). |  |
| 19 | Follower milestone gamification copy (near-zero thresholds) | Hero section | CHANGED BY C1 | C1 — Milestone thresholds expanded to 5/25/100/500; near-zero-only behavior replaced. |  |
| 20 | Follow confirmation / error states | Hero section | CHANGED BY C1 | C1 — Follow toast added: "You're following Watch Duty — we'll email you when something new happens." Error states kept. |  |
| 21 | Notification settings modal (web + mobile push per follow) | Hero section | KEEP AS-IS | — | C1 does not modify notification preferences modal; it only changes the CTA and post-follow toast. |
| 22 | Followers count button → follower list modal | Hero section | KEEP AS-IS | — | No delta modifies the follower-list modal. Count display is part of C1's `[N] people following` relabel but the modal open action is unchanged. |
| 23 | Share button (opens share sheet modal) | Hero section | CHANGED BY C6 | C6 — AI-generated per-channel community share copy pre-loaded; regeneration cadence time+delta-based. |  |
| 24 | Share: Facebook | Share sheet | CHANGED BY C6 | C6 — community-appeal tone pre-generated for this channel. |  |
| 25 | Share: Twitter/X | Share sheet | CHANGED BY C6 | C6 — punchy-public tone pre-generated. |  |
| 26 | Share: WhatsApp | Share sheet | CHANGED BY C6 | C6 — friend-tone with cause+donor-count hook pre-generated. |  |
| 27 | Share: Messenger | Share sheet | CHANGED BY C6 | C6 — text-prefill channel receives generic LLM-generated copy (no channel-specific tone since not in C6's named four). Aligns with fundraiser-matrix D9 treatment. |  |
| 28 | Share: SMS | Share sheet | CHANGED BY C6 | C6 — text-prefill channel; generic LLM-generated copy. Aligns with fundraiser-matrix D9 treatment. |  |
| 29 | Share: Email | Share sheet | CHANGED BY C6 | C6 — mission-narrative tone pre-generated for email channel. |  |
| 30 | Share: Copy link | Share sheet | KEEP AS-IS | — | No prefill text change applies to a clipboard URL copy. |
| 31 | Share: Embed | Share sheet | KEEP AS-IS | — | Not a text-based share; C6 does not apply. |
| 32 | Share: Nextdoor (feature-flagged) | Share sheet | KEEP AS-IS | — | Feature-flagged channel; C6 does not name Nextdoor as a tone target. |
| 33 | Share: LinkedIn (feature-flagged) | Share sheet | KEEP AS-IS | — | Feature-flagged; C6 four-channel list does not include LinkedIn. |
| 34 | Share: Instagram (mobile, feature-flagged) | Share sheet | KEEP AS-IS | — | Feature-flagged mobile channel; unchanged. |
| 35 | Share: TikTok (mobile, feature-flagged) | Share sheet | KEEP AS-IS | — | Feature-flagged mobile channel; unchanged. |
| 36 | Share: Snapchat (mobile, feature-flagged) | Share sheet | KEEP AS-IS | — | Feature-flagged mobile channel; unchanged. |
| 37 | AI-generated share text infrastructure (feature flags: `gen_ai_share_sheet_option`, `ai_share_precache`, `amp24_agentic_share_text`, `dynamic_share_text`) | Share sheet | CHANGED BY C6 | C6 — activates community-level AI share text using this existing infrastructure. |  |
| 38 | Community description (free-text, rules, About label) | About tab | KEEP AS-IS | — | Content field; no delta modifies the About section display. |
| 39 | Community rules (5 rules listed) | About tab | KEEP AS-IS | — | Static content; no delta modifies rules display. |
| 40 | Organizer tools: "Manage community settings" link (admin only) | Hero/admin | OUT OF SCOPE | Community creation / admin flows are explicitly out of scope. |  |
| 41 | Organizer tools: "Email all community followers" (admin only) | Hero/admin | OUT OF SCOPE | Community creation / admin flows are explicitly out of scope. |  |
| 42 | Organizer tools: "Send web/mobile notification to followers" (admin only) | Hero/admin | OUT OF SCOPE | Community creation / admin flows are explicitly out of scope. |  |
| 43 | Activity tab (tab button, reverse-chron feed) | Tabs | CHANGED BY C2 | C2 — "Since your last visit" sticky divider inserted above first unread item; divider collapses to zero height for first-time visitors. |  |
| 44 | Activity types: POSTED / UserPost feed items | Activity feed | KEEP AS-IS | — | Activity item types are unchanged; C2 adds a divider and promotes reactions but does not change item types. |
| 45 | Reactions: HEART on activity items (JS-gated, `fe-ssr-generic-activity-reactions`) | Activity feed | CHANGED BY C2 | C2 — HEART reactions promoted from secondary to primary affordance, inline with item header. |  |
| 46 | Comments: per-activity comment count + input (JS-gated, `fe-ssr-generic-activity-comments`) | Activity feed | CHANGED BY C2 | C2 — comment count rendered as a tappable badge next to reactions (visual promotion). |  |
| 47 | Load more activities button (cursor-based pagination) | Activity feed | KEEP AS-IS | — | Pagination mechanic unchanged; C2 only adds orientation divider. |
| 48 | Activity feed error state ("We could not load more activities…") | Activity feed | KEEP AS-IS | — | Error handling unchanged. |
| 49 | PYMK module (People You May Know) | Activity feed | **MOVED TO ADDITIONS** | C3 introduces this as a *net-new* surface; PYMK does not exist on the current GFM community page. See Additions sub-table. |  |
| 50 | Fundraisers tab (tab button) | Tabs | KEEP AS-IS | — | Tab itself is unchanged; C5 changes content inside it. |
| 51 | Fundraiser tab: full paginated list of fundraiser cards | Fundraisers tab | KEEP AS-IS | — | Card list skeleton unchanged; C5 adds a personalization strip above it. |
| 52 | "From causes you follow" personalized section (L3.5) | Fundraisers tab | **MOVED TO ADDITIONS** | C5 introduces this as a *net-new* personalized strip; no current-page antecedent. See Additions sub-table. |  |
| 53 | Fundraiser filters: LEGACY_CATEGORY, TIME_PERIOD, CLOSE_TO_GOAL (currently feature-flagged OFF) | Fundraisers tab | CHANGED BY C5 | C5 — existing filter UI activated server-side by removing `fe-ssr-communities-fundraiser-filters` flag gate; no new filter types added. |  |
| 54 | Fundraiser search input (JS-gated, "Search for fundraisers") | Fundraisers tab | KEEP AS-IS | — | C5 only activates existing filters; search is not mentioned as changed in any delta. |
| 55 | Donate button per fundraiser card → donation flow | Fundraisers tab | KEEP AS-IS | — | No delta changes the per-card Donate button. |
| 56 | Fundraiser card link → `/f/{slug}` | Fundraisers tab / Leaderboard | KEEP AS-IS | — | Navigation target unchanged. |
| 57 | Fundraiser card pagination error state | Fundraisers tab | KEEP AS-IS | — | Error handling unchanged. |
| 58 | Leaderboard top-3 fundraiser cards (title, raised, goal, organizer, link) | Leaderboard section | KEEP AS-IS | — | C4 prepends a prompt block above the cards; the cards themselves are unchanged. |
| 59 | Leaderboard momentum prompt block (contextual state: active/near-goal/quiet) | Leaderboard section | **MOVED TO ADDITIONS** | C4 introduces this prompt block as a *net-new* component prepended above existing leaderboard cards; no current-page antecedent. See Additions sub-table. |  |
| 60 | See all fundraisers button (expands or navigates) | Leaderboard section | KEEP AS-IS | — | Button is referenced in C4's active-momentum state as a secondary CTA, but the button itself pre-exists and its behavior does not change. |
| 61 | Start a GoFundMe (community-contextual) → `/campaign/605/startfundraising` | Hero / Leaderboard | KEEP AS-IS | — | Button pre-exists; C4 quiet-period prompt adds a copy+CTA block that links to this same target but does not replace the original button. |
| 62 | Organizer name link → organizer profile | Fundraiser cards | KEEP AS-IS | — | No delta modifies organizer profile links. |
| 63 | About tab (tab button, description + rules) | Tabs | KEEP AS-IS | — | No delta modifies the About tab. |
| 64 | Tab order: Activity → Fundraisers → About | Tabs | KEEP AS-IS | — | Community-redesign Decision 1 locks this order. |
| 65 | Nonprofits tab (`showNonprofitsTab: false`) | Tabs | OUT OF SCOPE | Nonprofits tab is explicitly out of scope in community-redesign.md Out of scope section. |  |
| 66 | Meta / OG tags (og:type, og:title, og:description, og:image, twitter:card, locales) | Head / SEO | KEEP AS-IS | — | SEO metadata; no delta modifies OG tags. |
| 67 | Giving Guarantee copy + link | Footer / About | KEEP AS-IS | — | Trust signal; no delta modifies it. |
| 68 | Footer nav links (all `/c/` and support URLs) | Footer | KEEP AS-IS | — | Global footer; no community delta touches it. |
| 69 | Footer social icons (Facebook, YouTube, Twitter, Instagram) | Footer | KEEP AS-IS | — | Global footer; unchanged. |
| 70 | Manage Cookie Preferences button (consent modal) | Footer | KEEP AS-IS | — | Consent management; no delta modifies it. |
| 71 | Legal links (Terms, Privacy, Legal, Accessibility, Cookie Policy, Your Privacy Choices) | Footer | KEEP AS-IS | — | Legal/compliance; no delta modifies them. |

---

## Additions (net-new from deltas, no current-page antecedent)

These features are introduced by our redesign deltas. They are NOT modifications of existing current-page features and therefore belong outside the main parity matrix.

| Feature | Region | Delta | Notes |
|---|---|---|---|
| PYMK module ("Donors you might know" strip with inline Follow primitive) | Activity feed (after item 3) | C3 | 3–5 avatar+name cards of community donors with mutual social connections; inline Follow button per card; avatar opens side drawer. Net-new on community page (exists on fundraiser pages via GFM's `fe-ssr-campaign-pymk`). |
| "From causes you follow" personalized strip | Fundraisers tab (above filter controls) | C5 | 3-card horizontal strip drawn from fundraisers in categories matching the user's follow graph. L3.5 personalization slot; fallback hidden for anonymous/first-visit. Net-new. |
| Leaderboard momentum prompt block | Leaderboard section (above top-3 cards) | C4 | Contextual prompt with three state variants (active momentum / near-goal leader / quiet period) + CTA. Mirrors fundraiser D6 money-box pattern. Net-new on community page. |

---

## CUT Features

None. The revised community redesign does not intentionally remove any feature that exists on the current GFM community page. The original C7 returning-member banner was a *proposed* delta that was dropped during design review (verifier-swarm revision history in `community-redesign.md`) before it ever appeared on the current GFM page — it was never a current feature, so its removal cannot be a CUT.

---

## Gaps / Open Questions

1. **Followers count relabel (row 22 vs row 18):** C1 specifies the follow CTA label changes to `[N] people following`. It is ambiguous whether the separate "followers count button" (which opens the follower list modal) also gets the new label or retains its current text. Recommend confirming: does C1's label change apply to the modal-trigger button or only to the inline count adjacent to the Follow CTA?

2. **Share: Messenger, SMS, and remaining channels under C6 (rows 27–28):** C6 names four per-channel tones (WhatsApp, X, email, Facebook). Messenger, SMS, Copy link, Embed, Nextdoor, LinkedIn, Instagram, TikTok, Snapchat are classified KEEP AS-IS on the grounds that no explicit tone is specified. Wireframe pass should decide: do these channels receive a generic community-level fallback text (not channel-tuned) or no prefill change at all?

3. **PYMK module (row 49) first-time visitor fallback:** C3 specifies that anonymous/no-graph users see top-3 donors by contribution amount. `strategy-personalization.md` L3.5 rule 4 requires every slot to have a first-time/anonymous fallback. The fallback (top-3 donors) is defined in C3, but the wireframe should confirm whether the strip label ("Donors you might know") is still appropriate for anonymous users who have no social graph — or whether the strip should carry a different label in the fallback case.

4. **"From causes you follow" label accuracy (row 52):** The strip is labeled "From causes you follow" but on a single-community page the user is not necessarily browsing across causes. Confirm whether the label is correct in the single-community context or whether it should read "Fundraisers in categories you follow."

5. **Cross-page referrer label on leaderboard clicks (C4 → D6 contract):** `community-redesign.md` Cross-page section specifies `referrer_source = community_leaderboard` when a user navigates from the leaderboard to a fundraiser page. This is a tracking/contract item, not a visible UI feature, and therefore does not appear in the parity matrix. It should be captured in the metrics integration spec.
