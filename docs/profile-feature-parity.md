# Profile Page — Feature Parity Matrix

**Date:** 2026-05-28
**Method:** Every feature in `profile-features.md` was enumerated from three sources: the Full Interaction Table (49 rows), the per-activity interactions sub-table (13 rows, 5 unique vs. the main table), and the Identity/Follow section (**6 items** not duplicated in the main table — completeness-verifier corrected from earlier "5 items"; Block confirmation modal is the previously-undercounted 6th). Math: 49 + 5 + 6 − 3 (footer-link consolidation) = **57**. Each maps to exactly one of four buckets using `profile-redesign.md` (P1–P9), `fundraiser-redesign.md` (cross-page contract), and `strategy-personalization.md` (L3.5 constraints).

---

## Summary

| Bucket | Count | Deltas cited |
|--------|-------|--------------|
| KEEP AS-IS | 40 | — |
| CHANGED BY delta | 12 | P1, P2 (×2), P3 (×3), P4, P5 (×4), P8 |
| OUT OF SCOPE | 4 | Auth/moderation flows, DM hub |
| CUT | 1 | P1 microcopy supersedes tooltip |
| **Total** | **57** | — |

> **Revision (post-verifier):** Two rows re-bucketed KEEP → CHANGED. Row 24 (notification bell) → CHANGED BY P2 (P2 owns notification cadence via the digest; bell setting deprecated if its flag rolls out). Row 31 (About tab) → CHANGED BY P3 (cause pills are *removed* from About tab and relocated to hero per P3 — "move" implies removal, not duplication). Method header corrected from "5 → 6 identity items" per completeness verifier.

---

## Full Matrix

| # | Feature | Region | Bucket | Delta or Reason | Notes |
|---|---------|--------|--------|-----------------|-------|
| 1 | Skip to content | A11y | KEEP AS-IS | — | Accessibility anchor; no delta touches it |
| 2 | GoFundMe logo | Global nav | KEEP AS-IS | — | Global shell; no profile delta |
| 3 | Search bar | Global nav | KEEP AS-IS | — | Global shell; no profile delta |
| 4 | Donate (nav) | Global nav | KEEP AS-IS | — | Global CTA; unchanged |
| 5 | Fundraise (nav) | Global nav | KEEP AS-IS | — | Global CTA; unchanged |
| 6 | About (nav dropdown) | Global nav | KEEP AS-IS | — | Global nav; unchanged |
| 7 | Menu (hamburger) | Global nav | KEEP AS-IS | — | Mobile nav; no delta |
| 8 | Sign in | Global nav | KEEP AS-IS | — | Auth flow assumed; no delta |
| 9 | Start a GoFundMe (nav CTA) | Global nav | KEEP AS-IS | — | Global CTA; unchanged |
| 10 | Profile avatar | Hero | KEEP AS-IS | — | Display element; no delta modifies it |
| 11 | Profile name | Hero | KEEP AS-IS | — | Display element; unchanged |
| 12 | Followers count (link to /followers) | Hero | KEEP AS-IS | — | Count display + link; no layout change |
| 13 | Following count (link to /following) | Hero | KEEP AS-IS | — | Count display + link; no layout change |
| 14 | Follow button | Hero | CHANGED BY P1 | P1 — adds value-prop microcopy beneath button ("Get updates when [Name] organizes or donates."); button label and position unchanged |
| 15 | Share profile button | Hero | CHANGED BY P8 | P8 — AI-generated per-channel prefilled copy (WhatsApp/X/email/Facebook); same button, same position |
| 16 | Profile options menu (button) | Hero | KEEP AS-IS | — | Dropdown trigger; no delta modifies the button itself |
| 17 | Report account | Options menu | OUT OF SCOPE | Moderation flow; "Auth + account flows — assumed" scope exclusion |
| 18 | Block user (menu item) | Options menu | OUT OF SCOPE | Moderation/block flow; "Auth + account flows — assumed" scope exclusion |
| 19 | Unfollow (menu item + confirmation modal) | Options menu | KEEP AS-IS | — | Unfollow guard dialog; no delta removes or changes it |
| 20 | Copy link | Options menu | KEEP AS-IS | — | Clipboard copy; no delta changes this |
| 21 | Message | Options menu | OUT OF SCOPE | "Messaging / DM hub — separate surface" explicitly out of scope |
| 22 | Block confirmation modal | Options menu | OUT OF SCOPE | Part of block flow; same scope exclusion as #18 |
| 23 | Learn more "people inspired" tooltip | Hero | CUT | P1's value-prop microcopy ("Get updates when [Name] organizes or donates.") replaces the tooltip's explanatory purpose; retaining both creates redundant copy in the same hero region |
| 24 | Notification settings bell (flag-gated) | Hero (SSR-gated) | CHANGED BY P2 | P2 — owns notification cadence (weekly digest, user-adjustable cadence). If `shared_notifications_bell` rolls out, P2's digest settings take precedence and the bell setting surface is deprecated to avoid duplicating the notification-preferences UI. Until flag rolls out: bell is hidden (current state); P2's digest cadence is set in account settings. |
| 25 | Edit profile entry point (owner-only) | Hero | CHANGED BY P3 | P3 — owner hero gains a slim bio nudge ("Add a bio to help followers know what you stand for") surfacing the complete-profile wizard; edit-flow internals unchanged |
| 26 | Follow sticky header (scroll UI) | Page | KEEP AS-IS | — | Scroll-follow region; no delta changes it |
| 27 | Desktop hero backdrop | Hero | KEEP AS-IS | — | Background gradient region; visual identity out of scope |
| 28 | Profile gradient | Hero | KEEP AS-IS | — | Decorative gradient region; visual identity out of scope |
| 29 | Cause-category pills (About tab data) | About tab → Hero | CHANGED BY P3 | P3 — pills move from About tab into the hero beneath the name; max 3, zero fallback; data already in model |
| 30 | Activity tab | Tab bar | CHANGED BY P2 | P2 — feed gains UPDATED verb rows + collapsible "Since your last visit — [N] new" header for authenticated returners |
| 31 | About tab | Tab bar | CHANGED BY P3 | P3 — cause pills are *removed* from the About tab content (relocated to hero per row 29). The tab itself (button + remaining content like bio, joined date) remains; only the cause-pills sub-region is removed. Accuracy verifier flag: "move" implies removal, not duplication. |
| 32 | Suggested people to follow (PYMK panel) | Right rail | CHANGED BY P4 | P4 — same 20-profile panel and card layout; ordering reranked by social-graph second-degree proximity for authenticated viewers; anonymous viewers see server default |
| 33 | Carousel — previous slide button | Carousel | KEEP AS-IS | — | Navigation control; no delta |
| 34 | Carousel — next slide button | Carousel | KEEP AS-IS | — | Navigation control; no delta |
| 35 | Carousel — pagination dots | Carousel | KEEP AS-IS | — | Navigation control; no delta |
| 36 | Fundraiser card 1 — Keep Sandy on Ossabaw (102% funded) | Carousel | CHANGED BY P5 | P5 — adds state-aware line under progress bar: "Goal reached — still accepting donations" (positive text color); no layout change |
| 37 | Fundraiser card 2 — Saving Eliza (52% funded) | Carousel | CHANGED BY P5 | P5 — default label state (below 80% threshold); copy unchanged from current GFM at this funding level |
| 38 | Fundraiser card 3 — Andy Ritchie (102% funded) | Carousel | CHANGED BY P5 | P5 — "Goal reached — still accepting donations" state copy; same as #36 |
| 39 | Fundraiser card — Wildfire Safety (activity/featured) | Activity / featured | CHANGED BY P5 | P5 — state-aware enrichment applies to all carousel/featured cards; owned fundraiser cards receive the same treatment |
| 40 | Benefiting Watch Duty link | Fundraiser card | KEEP AS-IS | — | Charity deep-link; no delta modifies it |
| 41 | Like activity (HEART reaction) | Activity card | KEEP AS-IS | — | Reaction toggle; no delta |
| 42 | View likes count | Activity card | KEEP AS-IS | — | Liker list; no delta |
| 43 | Comment on activity | Activity card | KEEP AS-IS | — | Comment composer; no delta |
| 44 | Share activity (per-activity row) | Activity card | KEEP AS-IS | — | Per-activity share; P8 is profile-level only, not per-activity row |
| 45 | Like actions menu | Activity card | KEEP AS-IS | — | Secondary like options; no delta |
| 46 | Share actions menu | Activity card | KEEP AS-IS | — | Share sheet options on activity; no delta |
| 47 | Comments actions menu | Activity card | KEEP AS-IS | — | Comment moderation menu; no delta |
| 48 | Activity options menu | Activity card | KEEP AS-IS | — | Options trigger; no delta |
| 49 | Report activity | Activity options | KEEP AS-IS | — | Report flow; no delta |
| 50 | Hide activity | Activity options | KEEP AS-IS | — | Feed curation; no delta |
| 51 | Delete activity (owner-only) | Activity options | KEEP AS-IS | — | Owner-only removal; no delta removes or replaces it |
| 52 | Report comment | Comment section | KEEP AS-IS | — | Comment moderation; no delta |
| 53 | Delete comment (owner-only) | Comment section | KEEP AS-IS | — | Owner-only removal; no delta |
| 54 | Manage Cookie Preferences | Footer | KEEP AS-IS | — | Cookie consent; no delta |
| 55 | GFM brand social links (Facebook / YouTube / Twitter / Instagram) | Footer | KEEP AS-IS | — | 4 brand footer links; no delta |
| 56 | More resources (expand footer) | Footer | KEEP AS-IS | — | Footer expansion; no delta |
| 57 | Footer policy links (Terms / Privacy / Legal / Accessibility / Cookie / Privacy Choices) | Footer | KEEP AS-IS | — | 6 legal links; no delta |

---

## New features introduced by deltas (additions — not substitutions of existing rows)

These are net-new to the profile page. They do not consume any of the 57 slots above.

| Feature | Delta | Notes |
|---------|-------|-------|
| Follow value-prop microcopy line | P1 | New text element beneath existing Follow button |
| "Since your last visit — [N] new" collapsible header | P2 | New UI region inside Activity tab for authenticated returners |
| UPDATED verb rows in activity feed | P2 | New activity type surfacing followed-fundraiser updates |
| Weekly email digest (Braze, Sunday default) | P2 | Off-page channel; user-adjustable cadence |
| Complete-profile bio nudge (owner-only) | P3 | Slim prompt in hero; entry point to existing wizard |
| Repeat-organizer tenure line | P6 | "Organizing since [year] · [N] fundraisers"; organizers with 2+ fundraisers only |
| Recurring-donation nudge banner | P9 | Slim banner under carousel; authenticated repeat donors (2+ to this organizer in 12 months) only; collapses to zero otherwise |
| AI-generated per-channel share copy | P8 | Content slot inside existing share sheet; buttons unchanged |

---

## CUT features

| # | Feature | Justification |
|---|---------|---------------|
| 23 | Learn more "people inspired" tooltip | P1's always-visible microcopy ("Get updates when [Name] organizes or donates.") replaces the tooltip's sole explanatory function. The tooltip requires an extra tap to reveal what P1 states inline. Retaining both creates redundant explanatory copy in the same hero region. |

---

## Gaps and open questions

1. **P9 placement vs. P7 payload budget.** P9's recurring nudge requires an authenticated donor-history lookup. P7 caps `__NEXT_DATA__` at 400 KB and defers PYMK. Clarify whether P9's backend call is deferred with the activity feed (`startTransition`) or SSR-gated with a cached flag.

2. ~~**Cause pills duplication.**~~ **RESOLVED (post-verifier):** pills are *removed* from the About tab when relocated to the hero per P3. Row 31 (About tab) now CHANGED BY P3 to reflect the removal.

3. **PYMK anonymous fallback.** P4 specifies "anonymous viewers see the current server ranking." Confirm whether that is the existing `followSuggestions` order (most-followed first) or a separate signal.

4. **Per-activity Share (row #44) vs. P8.** P8 applies AI copy to the profile-level share sheet. Per-activity share buttons (row #44) are classified KEEP AS-IS with generic copy. Confirm this is the intended boundary.

5. ~~**Notification bell flag rollout.**~~ **RESOLVED (post-verifier):** row 24 now CHANGED BY P2; P2 owns notification cadence precedence. If the bell flag rolls out, the bell settings surface is deprecated.

6. **P6 tenure line threshold.** P6 specifies "2+ fundraisers." Janahan has 1 active entry (`activeEntries[]`) but `pinnedEntries[]` is empty. Confirm whether the count comes from `activeEntries[]` length only or from a lifetime fundraiser count (which could exceed `activeEntries[]` if past campaigns are inactive).
