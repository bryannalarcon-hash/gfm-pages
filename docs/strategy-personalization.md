# Personalization Strategy — L3.5

> **Locked decision:** the project ships at **Level 3.5** — L2 (returning-visitor recognition) + selective L3 (AI share copy, embedding-based suggestions, smart amount presets). Hard constraint: **structure is identical for every user; only content slots personalize.**

---

## Rules of the road (the hard constraint)

These are non-negotiable. Every personalization choice in this document is filtered through them:

1. **Layout is fixed.** Same regions in the same positions for every user. A first-time anonymous visitor and a repeat donor see the same page skeleton.
2. **Component identity is fixed.** Donate, Share, Follow CTAs are the same components in the same positions. Personalization never hides, moves, or swaps a core CTA.
3. **Personalization lives inside named *content slots* only.** A slot is a fixed region (e.g. the welcome banner, the share-button prefilled text, the "similar fundraisers" carousel, the amount-preset values). Slots have defaults.
4. **Every slot has a first-time / anonymous fallback.** No empty states because we don't know who you are.
5. **The before/after toggle compares structure (current GFM vs our redesign), not content.** Personalization is a *layer* on top of the redesign, not part of the redesign-vs-GFM diff a viewer toggles between.
6. **No real-time adaptive behavior** (no bandits, no intent detection, no per-user A/B variants).

If a proposed personalization change can't fit in a named slot without bending these rules, it goes to "future work," not the build.

---

## The four-level framework (context)

| Level | What's reactive | What's personalized |
|---|---|---|
| L0 — Static | Nothing | Nothing |
| L1 — Context-aware | Page state changes with page data (goal-gradient at 80%+, milestone toasts) | Nothing per-user |
| **L2 — Returning-visitor** ✓ | + recognizes you're back | Personalization keyed to **your prior actions on this site** |
| **L3 — Selective AI/embeddings** ✓ | + AI share copy, embedding-based suggestions, smart amount presets | Cross-cause recommendations; LLM share text per (fundraiser, channel) |
| L4 — Full ML personalization | Per-user variants, bandits, recommendation models, real-time intent | Out of scope — noted in writeup as the natural next step |

**L3.5 = L2 floor + the three L3 elements above.** Nothing more.

---

## What L3.5 includes — per page

### Fundraiser page (deltas detailed in `fundraiser-redesign.md`)

| Delta | Slot | What personalizes | Fallback (first-time) |
|---|---|---|---|
| **D8** Returning-visitor banner | Slim banner above hero | Copy: *"Welcome back, [first name]. Sarah posted an update."* | Hidden (slot collapses) |
| **D9** AI-generated share copy | Prefilled text in each share button | Different tone per (fundraiser, channel) — WhatsApp = friend-tone, X = punchy, email = personal | Default per-channel copy GFM uses today |
| **D10** Smart amount presets | The 3 preset buttons in the donate card | First-timer: `$10 / $25 / $50`. Repeat donor: `$X (last) / $Y / $Z` where X = their last donation | First-timer presets |
| **D11** Embedding-based "similar fundraisers" | Carousel on the post-donate screen ("You might also support…") | 3 fundraisers ranked by cosine similarity of this campaign's embedding × the user's past-donation embeddings | 3 top-trending fundraisers in the same category |
| **D13** LLM-generated update summaries | The "what's new" line inside the D8 banner | 1-line LLM summary of the most-recent update since user's last visit | Hidden (slot collapses, falls back to D8's generic "[Organizer] posted an update") |

> **Note:** D11 is now implemented as a section *inside* D3's post-donate screen, not as a standalone delta in `fundraiser-redesign.md`. The personalization slot definition above still holds; the surface just lives within D3 now.

### Community page (preview — deltas come when we redesign this page)

- **Returning-member banner** — *"N new fundraisers in [community] since your last visit."* Fallback: hidden.
- **"Similar communities" sidebar** — embedding similarity. Fallback: top 3 trending communities.

### Profile page (preview)

- **"Continue exploring" CTA** — links to the last fundraiser the user donated to (if any). Fallback: hidden.
- **PYMK ("people you may know")** — already exists in GFM. We surface it, ranked by embedding similarity to people the user already follows. Fallback: 20 most-followed organizers.

---

## Persona-driven demo mode (addendum — demo infrastructure, NOT production behavior)

The portfolio demo includes a **persona switcher** in the overlay-pill menu (see `design-overlay.md`). It lets a portfolio viewer experience the same page as six different users without authenticating as each one — proving the L3.5 personalization layer works without requiring a logged-in account or a real database of user histories.

**How it works:**
- Six hardcoded persona fixtures live in `docs/design-personas.md`. Each carries a tagline + fixture data: name, follows, donation history, last-visit timestamp, referrer source.
- The menu (popover above the pill) lists the personas with the active one ✓-marked. Tapping a persona writes its slug to `localStorage` under `overlayPersona`.
- **The L3.5 personalization logic is unchanged from production.** It reads "current user" data from a single source — in production, that source is the authenticated user's record; in the demo, it's the fixture for the currently-active persona.
- Switching persona triggers a soft client-side re-render (no full page reload). Same page, same overlay annotations, *completely* different content in every personalization slot.

**The hard "no wild differences" constraint (rule 1) still holds.** Layout is identical for every persona; components are identical; only named content slots change. The persona switcher just lets a viewer see slot-level differences side-by-side via the menu rather than through six separate authenticated sessions.

**Does not ship to production.** The persona switcher renders only when the build flag `NEXT_PUBLIC_DEMO_MODE=true` is set. A real authenticated build hides the menu entirely; the pill becomes a pure overlay toggle.

---

## What L3.5 does NOT include (out of scope; future-work writeup material)

- Multi-armed bandits / per-user A/B variants.
- Real-time intent detection (cursor / scroll heuristics).
- Generative copy beyond the four slots above (no LLM-generated hero subtitles, story TL;DRs, post-donate impact paragraphs — those are L4 ideas).
- Model-driven recurring-upgrade targeting (L4).
- Read-aloud / AI-narrated story.
- Real recommendation model (collaborative filtering on a donor graph) — substituted with embeddings.

---

## ROI

**ROI = Return on Investment** — the ratio of benefit (metric lift + portfolio signal) to cost (build days + risk). Higher is better.

**Investment.** ~3 days extra build over the L1 static baseline; ~1.5 days extra over L2-only.

**Return — metric by metric:**

| Graded metric | L3.5 mechanism | Why it moves the metric |
|---|---|---|
| **Repeat Visits** | D8 (returning-visitor banner) + D10 (smart presets that reward continuity) | This is the *only* metric that's nearly uncatchable without personalization — if the app doesn't recognize you, it can't reward you for returning |
| **Share** | D9 (AI per-channel copy) | High-arousal sharing varies by channel (Berger & Milkman 2012); GFM-confirmed via `amp24_agentic_share_text_ab` |
| **Follow** | D11 (embedding-based community suggestions on post-donate) | Routes users into the follow loop at peak emotional moment |
| **Donate** | D10 (smart amount presets) | Anchoring research + relevant presets lift both completion rate and avg gift |

**Return — portfolio signal:**

- Directly matches the assignment subtitle: *"Version 1 — AI-accelerated."*
- Demonstrates ML-adjacent capability (embeddings + LLM API integration) without committing to a months-long ML stack.
- Every personalization decision is defensibly tied to a graded metric + a research/GFM-confirmed signal — exactly the structure of the assignment writeup.

**Risk.** Low. LLM latency mitigated by caching share copy at fundraiser-create time. Embeddings are computed once at build time (no real-time inference). Fallbacks guarantee no empty states.

**Verdict.** L3.5 sits at the steep part of the cost-benefit curve: each of the four deltas costs <1 day and moves at least one graded metric directly. L2 alone leaves Repeat Visits uncatchable; full L4 burns half the week on infrastructure that's hard to demo and breaks the before/after comparison story. L3.5 is the maximum personalization that respects the "no wild differences" constraint.

---

## Cross-link — where this strategy is executed

- Fundraiser page L3.5 deltas (D8–D11): `fundraiser-redesign.md`.
- Community / profile L3.5 elements: defined when those pages are redesigned (sequential after fundraiser).
- Metric coverage: `strategy-metrics-research.md` §2 (every L3.5 delta moves a tier-1 or tier-2 metric).
- Tooling implications (LLM API, embeddings store): decided in the tech-stack pass after wireframes.
