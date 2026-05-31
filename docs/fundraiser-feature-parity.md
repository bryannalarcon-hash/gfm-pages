# Fundraiser Page — Feature Parity Matrix

**Date:** 2026-05-28
**Method:** Canonical feature list drawn from the "Full Interaction Table" in `fundraiser-features.md` (66 interactive features). Bucket assignments cross-referenced against `fundraiser-redesign.md` (deltas D1–D13, no D11 — folded into D3) and `fundraiser-redesign.md` "Out of scope" section. Note: D11 is implemented as the "similar fundraisers" carousel inside D3's post-donate screen; it has no standalone surface on the fundraiser page and does not appear as a separate row.

---

## Summary

| Bucket | Count |
|---|---|
| KEEP AS-IS | 45 |
| CHANGED BY | 18 |
| OUT OF SCOPE | 2 |
| CUT | 1 |
| **Total** | **66** |

> **Revision (post-verifier):** Footer brand-social links (FB, YouTube) re-bucketed from OUT OF SCOPE → KEEP AS-IS (now consistent with Twitter/Instagram in the same row group; accuracy verifier flagged the original split as a misuse of the OUT OF SCOPE bucket). Blog-links CUT justification reworded — D3 is not a substitute for the footer audience.

---

## Full Matrix

| Feature | Region | Bucket | Delta or Reason | Notes |
|---|---|---|---|---|
| GoFundMe logo | Header | KEEP AS-IS | — | Global nav; no delta touches header structure |
| Search | Header | KEEP AS-IS | — | Global nav; no delta touches header structure |
| Donate nav menu | Header | KEEP AS-IS | — | Dropdown nav; no delta changes global nav |
| Fundraise nav menu | Header | KEEP AS-IS | — | Dropdown nav; no delta changes global nav |
| About nav menu | Header | KEEP AS-IS | — | Dropdown nav; no delta changes global nav |
| Sign in | Header | OUT OF SCOPE | Auth + account flows | Auth/sign-in flows are explicitly out of scope |
| Start a GoFundMe | Header | KEEP AS-IS | — | Global header CTA; no delta touches it |
| Discover / Browse | Header dropdown | KEEP AS-IS | — | Nav link; no delta touches header dropdowns |
| Crisis relief | Header dropdown | KEEP AS-IS | — | Nav link; no delta touches header dropdowns |
| Social Impact Funds | Header dropdown | KEEP AS-IS | — | Nav link; no delta touches header dropdowns |
| Supporter Space | Header dropdown | KEEP AS-IS | — | Nav link; no delta touches header dropdowns |
| Nonprofits | Header dropdown | KEEP AS-IS | — | Nav link; no delta touches header dropdowns |
| Donate now (hero) | Hero | CHANGED BY D1 | D1 — single-screen form | Donate CTA now opens the D1 single-screen card (amount + tip + payment) instead of the multi-step off-page flow |
| Share (primary) | Hero | CHANGED BY D4 | D4 — strategic share consolidation | Hero share is one of D4's 3 retained surfaces; gains channel-aware buttons and milestone-aware copy per D4 |
| Heart / Follow | Hero | CHANGED BY D5 | D5 — Follow first-class | Heart icon replaced by a labeled "Follow this fundraiser" button with microcopy; follower count surfaced below progress bar |
| Progress bar ($3K goal) | Hero money box | CHANGED BY D2 | D2 — goal-gradient intensification | At ≥80% funded: adds "$X to go" callout, count-up animation on % change, and contextual share copy shift |
| Gallery viewer | Hero media | KEEP AS-IS | — | No delta changes the media gallery/photo viewer |
| Read story / Read more | Story | KEEP AS-IS | — | No delta changes story expand behavior |
| Organizer profile link | Story byline | KEEP AS-IS | — | No delta changes organizer profile linking |
| Watch Duty (charity) | Story byline | KEEP AS-IS | — | No delta changes beneficiary/charity links |
| Donate (story) | Story | CHANGED BY D1 | D1 — single-screen form | Button destination changes to D1 single-screen form instead of multi-step flow |
| Share (story) | Story | CHANGED BY D4 | D4 — strategic share consolidation | D4 consolidates to 3 strategic surfaces (hero, milestone toast, post-update); story share is removed from this position |
| Donate (sticky) | Sticky bar | CHANGED BY D1 | D1 — single-screen form | Sticky CTA triggers the D1 bottom-sheet on mobile / right-rail card on desktop |
| Share (sticky) | Sticky bar | CHANGED BY D4 | D4 — strategic share consolidation | Sticky share is not one of D4's 3 retained surfaces; removed from sticky bar position |
| See all (donations) | Donation panel | CHANGED BY D6 | D6 — donation-list prompt | Donor-list block gains contextual prompt (momentum copy + inline Donate CTA) anchored inside the list; donor count numeral added above |
| See top (donations) | Donation panel | CHANGED BY D6 | D6 — donation-list prompt | Top-donors view is part of the enhanced donation-list block; prompt adapts to sorted view |
| Donate (donation list) | Donation lightbox | CHANGED BY D1 + D6 | D1 + D6 | Donate CTA triggers D1 form (D1); list-level prompt reinforces the CTA contextually (D6) |
| Comment (donation list) | Donation lightbox | KEEP AS-IS | — | No delta changes comment/message functionality |
| Share — Facebook | Share lightbox | CHANGED BY D9 | D9 — AI per-channel share copy | LLM-generated community-appeal copy prefilled for Facebook at fundraiser-create time; button position unchanged |
| Share — X/Twitter | Share lightbox | CHANGED BY D9 | D9 — AI per-channel share copy | LLM-generated punchy-public copy prefilled for X; button position unchanged |
| Share — WhatsApp | Share lightbox | CHANGED BY D9 | D9 — AI per-channel share copy | LLM-generated friend-tone copy prefilled for WhatsApp; button position unchanged |
| Share — Messenger | Share lightbox | CHANGED BY D9 | D9 — AI per-channel share copy | LLM-generated personal copy prefilled for Messenger; button position unchanged |
| Share — SMS/Text | Share lightbox | CHANGED BY D9 | D9 — AI per-channel share copy | LLM-generated copy prefilled for SMS; button position unchanged |
| Share — Email | Share lightbox | CHANGED BY D9 | D9 — AI per-channel share copy | LLM-generated personal-narrative copy prefilled for Email; button position unchanged |
| Share — Copy link | Share lightbox | KEEP AS-IS | — | Clipboard copy; no copy text to generate; D9 doesn't apply |
| Share — Print | Share lightbox | KEEP AS-IS | — | Print dialog; no prefilled share text; D9 doesn't apply |
| Share — Embed | Share lightbox | KEEP AS-IS | — | Embed code widget; not a text-share channel; D9 doesn't apply |
| Share — Nextdoor | Share lightbox | KEEP AS-IS | — | Feature-flagged; no delta explicitly modifies Nextdoor channel |
| Share — AI text | Share lightbox | CHANGED BY D9 | D9 — AI per-channel share copy | GFM's existing AI-text slot is superseded and unified under D9's per-(fundraiser, channel) LLM generation |
| Share — More | Share lightbox | KEEP AS-IS | — | Extended share options passthrough; no delta changes this |
| Add to iCal | Share wizard | KEEP AS-IS | — | Calendar download; no delta changes calendar reminder features |
| Add to Google Calendar | Share wizard | KEEP AS-IS | — | Google Calendar link; no delta changes calendar reminder features |
| Scroll to organizers | Organizer section | KEEP AS-IS | — | In-page anchor; no delta changes organizer section navigation |
| Report fundraiser | Content | KEEP AS-IS | — | Support link; no delta changes report functionality |
| Manage Cookie Preferences | Footer | OUT OF SCOPE | Visual identity / legal | Cookie consent is a legal/compliance surface; out of scope per "Legal" and "Visual identity" items |
| GoFundMe.org | Footer | KEEP AS-IS | — | External link; no delta touches footer external links |
| Facebook (GFM page) | Footer | KEEP AS-IS | — | GFM brand social link; no delta touches footer links |
| YouTube (GFM) | Footer | KEEP AS-IS | — | GFM brand social link; no delta touches footer links |
| Twitter/X (GFM) | Footer | KEEP AS-IS | — | External link; no delta touches footer links |
| Instagram (GFM) | Footer | KEEP AS-IS | — | External link; no delta touches footer links |
| How GoFundMe works | Footer | KEEP AS-IS | — | Info link; no delta touches footer |
| GoFundMe Giving Guarantee | Footer | KEEP AS-IS | — | Info link; no delta touches footer |
| Pricing | Footer | KEEP AS-IS | — | Info link; no delta touches footer |
| Help Center | Footer | KEEP AS-IS | — | Info link; no delta touches footer |
| About GoFundMe | Footer | KEEP AS-IS | — | Info link; no delta touches footer |
| Newsroom | Footer | KEEP AS-IS | — | Info link; no delta touches footer |
| Careers | Footer | KEEP AS-IS | — | Info link; no delta touches footer |
| Partnerships | Footer | KEEP AS-IS | — | Info link; no delta touches footer |
| GoFundMe Pro | Footer | KEEP AS-IS | — | Nonprofit upsell link; no delta touches footer |
| Terms | Footer | KEEP AS-IS | — | Legal link; carried as-is |
| Privacy Notice | Footer | KEEP AS-IS | — | Legal link; carried as-is |
| Legal | Footer | KEEP AS-IS | — | Legal link; carried as-is |
| Accessibility Statement | Footer | KEEP AS-IS | — | Legal link; carried as-is |
| Cookie Policy | Footer | KEEP AS-IS | — | Legal link; carried as-is |
| Your Privacy Choices | Footer | KEEP AS-IS | — | Legal link; carried as-is |
| Blog links (8 articles) | Footer resources | CUT | Layout decision (no direct substitute) | 8 GFM blog cross-links removed from footer resources. No delta retains them; they serve an acquisition / content-marketing audience and add an exit path at no conversion value. (Note: D3 is post-donate and does NOT substitute for this surface — accuracy verifier flagged that earlier framing as over-claiming.) |

---

## CUT Features — Explicit Justification

| Feature | Justification |
|---|---|
| Blog links (8 articles) | The 8 footer blog links (rent assistance, fundraising sites, etc.) are GFM content-marketing links serving an *acquisition* audience — not a conversion or retention audience for someone already on the fundraiser page. Removing them tightens the footer to legal/nav essentials and eliminates an exit path at the critical donate-conversion point. **No delta substitutes for these links** (D3's similar-fundraiser carousel addresses a different audience — post-donate donors, not blog-content readers); this is a deliberate drop, not a replacement. There is no delta that explicitly calls for keeping them; they fall outside every out-of-scope category, making CUT the correct bucket. |

---

## Gaps / Open Questions

1. **Share (sticky) vs. D4's 3 surfaces.** D4 names hero share, milestone toast, and post-update share as the 3 retained surfaces. The sticky bar donate button is retained (D1 triggers it). Whether a sticky *share* CTA survives as a fourth surface or is fully removed is ambiguous — D4 says "consolidate to 3," implying sticky share is cut, but the sticky bar's primary value is conversion (donate), not share. Classified as CHANGED BY D4 (removed from sticky); wireframer should confirm.

2. **"Donate nav menu" (Header dropdown).** The header "Donate" button is a *navigation* dropdown (Browse fundraisers, Crisis relief, etc.), not a donate CTA. It is distinct from every donate-flow button. No delta touches it. Classified KEEP AS-IS. If the header nav is redesigned as part of a later pass, this needs revisiting.

3. ~~**Footer social links (Facebook, YouTube) classified as OUT OF SCOPE.**~~ **RESOLVED (post-verifier):** all 4 footer brand-social links now classified KEEP AS-IS. OUT OF SCOPE was a misuse — that bucket is for scope-boundary categories (auth, payments backend, etc.), not for "inherits from design system."

4. **Smart Goals / Recurring nudge / Tipping / PYMK / Poster sharing / Post-donate lightbox.** These interactive features appear in the narrative sections of `fundraiser-features.md` but are NOT rows in the Full Interaction Table. Per the task constraint, the Full Interaction Table is canonical. If the wireframer needs these features classified, they should be added to the canonical table first.
