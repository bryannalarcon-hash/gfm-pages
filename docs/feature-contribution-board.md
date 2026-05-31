# Feature — Contribution Board ("Marks")

> A collective board where every meaningful action (follow / share / donate) leaves a **mark**, and the marks aggregate into one living scene. If "GoFundMe" is the ask — *go fund me* — the board is the crowd's visible **reply**: *we showed up.*
>
> **Status:** **COMMITTED 2026-05-29** as the cross-page delta cluster **S1–S5**, folded into the scheme (count re-baselined **28 → 33**). Seams, data model, and the "Board / Mark" event group are pinned in `architecture.md` (§2, §3, §4.8, §5, §6, §8) and `strategy-metrics-research.md` §4. Targets **Repeat Visits + Share** (the loop the page deltas serve least boldly). Chosen visual realization: the designer's **v4.2 "Suns"** (`mocks/`).
>
> **Purpose of this doc:** brief the designer to try **a couple of placement concepts** and **a couple of mark-creation-window concepts**. §3 is what they must honor; **§4 is their actual sandbox.** Brainstorm captured 2026-05-28.

---

## 1. The idea in one paragraph

Contributors earn a mark on a shared board. The mark's **base shape is the GoFundMe logo** (a fixed, non-weaponizable primitive). What you *do* determines what your mark becomes: **following** places it, **sharing** unlocks color, **donating** gives it size — and a sharer's mark also grows from the giving their share *inspired*. The board fills over the life of the campaign into a collective scene that's emotional to watch grow and gives people a reason to come back. It lives strongest on the Community page, appears as a slice on the Fundraiser page (esp. the post-donate moment), and aggregates into a personal collection on the Profile.

---

## 2. The action ladder (what each action earns)

| Action | Earns | Notes |
|---|---|---|
| **Follow** | **Presence** — default logo mark, uncolored, minimum size | The entry-level mark; everyone who follows is on the board |
| **Share** | **Color** — unlocks gradient customization (see §3) | Plus: your mark grows by **50% of the donations your share directly inspired** (single-touch) |
| **Donate** | **Size** — your mark scales with your contribution (sublinear + floor, see §3) | The richest tier; combine with a share to also recolor |

Size is **recognition, not a conserved pie** — the same dollar can add to both the donor's mark and the inspiring sharer's mark. The board area isn't a fixed budget.

---

## 3. What's DECIDED — honor these (the guardrails)

These came out of the brainstorm and are settled. The designer works **within** them.

**Mark primitive & vocabulary**
- Base mark = **the GoFundMe logo**. It is a fixed shape — not a drawing surface — which is what makes the board un-weaponizable.
- The **page admin may set a custom default symbol** (e.g. a fish for a reef community), which **undergoes human review** before going live. This is the *only* pre-moderated input — one review per page, not per mark.

**Color**
- Sharing unlocks **"key gradients"**: a small set of curated gradient presets, scaling to **up to 3 stops** as contribution deepens.
- **Curated palette only — NOT a free RGB / hex wheel.** Color is an expression vector (a recognizable logo + arbitrary colors can encode flags/symbols); the curated palette closes that surface while keeping the customization feel.

**Size**
- Scales with contribution, **sublinear, with a floor** — a $5 first-timer gets a real, dignified, visible mark; a large donor never eats the screen.
- **Sharer inheritance = single-touch:** a sharer's mark grows by **50% of donations directly attributed to their share.** No multi-hop / viral-tree credit.
- **Show size, never dollar figures** publicly — don't turn giving into a priced leaderboard on an emotional page.

**Placement**
- **System-controlled, not user-positioned.** Users contribute a mark; the system decides where it goes (auto-pack / fill). This is non-negotiable: free user placement = r/place-style coordinated macro-image griefing.
- (Owner's leaning for the designer to try first: **treat the background as a bucket and marks as droplets** filling it — see §4A.)

**Creation entry**
- Mark creation is a **separate button, greyed out** until the qualifying action is performed, with **a one-line reminder at each avenue** telling you how to unlock it. Placeholder copy:
  - Follow → "Follow this fundraiser to place your mark."
  - Share → "Share to unlock color for your mark."
  - Donate → "Your donation gives your mark its size."

**Mutability**
- Marks are **editable** (recolor later). Each edit **re-enters reactive moderation.**

**Identity & privacy**
- **Anonymous by default.** Opt-in to show your name via a **non-blocking consent popup** (must not gate or interrupt the donate / post-donate flow).
- The **"your mark grew" message** (a re-engagement notification, same family as our inactivity messages) tells a sharer their mark grew **without revealing who donated** (protects the donor; avoids de-anonymizing a low-fan-out share).
- That message has a **config to turn it on/off** — the current pages already surface enough contributor info, so it's optional per deployment.

**Moderation posture**
- **Reactive, matching GFM's existing bar** (report → hide → review; owner-delete; block). We *accept bounded griefing* — worst case is "someone arranged/colored marks rudely," transient and removable, **not** an atrocity, because the primitive + curated palette + system placement cap the blast radius.

**Tone, data, a11y, performance**
- **Tone by cause category** — freedom/skin scales inversely with emotional fragility (celebratory/project vs. memorial/medical); admin/category-gated.
- **Data integrity:** the board is **derived from *settled* donations and is recomputable.** A refund/chargeback shrinks the mark and recomputes any sharer inheritance. (Self-dealing/Sybil is accepted as low-stakes — they gave real money.)
- **Accessibility:** color is never the *sole* carrier of meaning; honor `prefers-reduced-motion`; ship a text/aggregate equivalent ("1,240 supporters"); keyboard-navigable.
- **Performance:** contained, async-hydrated, **zero CLS**, and it must **never compete with the donate CTA.**
- **Cold-start:** an empty/sparse board must have a deliberate "be the first to light this up" state — never a dead grid (negative social proof suppresses donation).

---

## 4. What's OPEN — the designer's sandbox

The ask: **try a couple of options for each of the two windows below.** Everything in §3 is fixed; everything here is yours to explore.

### 4A. Mark placement / the aggregate scene
Show a few takes on **what the board looks like as it fills**, honoring system-controlled placement (§3):
- **Start with the owner's leaning:** background-as-a-**bucket**, marks as **droplets** that fall/settle and fill it (a liquid/level metaphor — the bucket "fills" toward the goal?).
- Alternatives to contrast it against — pick 1–2: mosaic/tile grid, constellation/scatter, gravity-clustered pile of hearts, a silhouette/shape that fills in (e.g. the cause's symbol filling with marks).
- Show how **size** reads (sublinear range, with a floor) and how **color** reads at a glance without being garish against the GFM palette.
- Show the **cold-start / nearly-empty** state and a **dense** state.
- Per-surface framing: the **Community** board (all marks across its fundraisers), the **Fundraiser** slice (this campaign), and the **Profile** collection (your marks across causes).

### 4B. The mark-creation window
Show a couple of takes on the **creation/customization moment**:
- The **greyed-until-unlocked** entry button + the three unlock avenues with their reminder lines (§3).
- The customization UI: choosing a **key gradient** (curated, up to 3 stops), within the GFM token system.
- The **name-consent** step — non-blocking, calm, anonymous-by-default.
- The **"you left a mark"** confirmation moment (best at the post-donate beat) and the **"your mark grew"** return message (donor identity hidden).

---

## 5. Where it lives

| Surface | Role | Best moment |
|---|---|---|
| **Community page** | Primary home — the collective scene (belonging) | Always-present board section |
| **Fundraiser page** | This campaign's slice | Post-donate "you left a mark"; a contained band — **not** over the donate CTA |
| **Profile page** | Your mark-collection across causes (contribution identity) | A reason to return and watch your own wall grow |

Threads the cross-page integration thesis, and reads as the **public, emotional twin of the `/dashboard`** (same underlying meaningful-action events, rendered as a felt object instead of a chart).

---

## 6. Metrics & instrumentation impact (FYI — for the coder, not the designer's task)

The board changes what we capture (details belong in `strategy-metrics-research.md` §4, the single owner of the event schema):
- **New: identity-level single-touch referral attribution** — a pseudonymous `share_id` minted at `Share Clicked`, propagated in the share link, **persisted** so a later `Donate Completed` records the attributed share/sharer. (Scaffolding already exists: `utm_share_user` on `CaptureProps`, the `shared_by_extro` persona.)
- **Upgrades k-factor** from an aggregate ratio to **measured downstream dollars per sharer.**
- **New "Board / Mark" event group** to add deliberately to §4 (like the Post-Donate group) and mirror into `EventName`: `Mark Created`, `Mark Customized`, `Board Viewed`, possibly `Mark Shared`.
- **New leading indicator for Repeat Visits:** does leaving a mark / receiving the "mark grew" message predict return? (the activation→retention test in the metric tree).

---

## 7. Still open (not blocking the design pass)

- Is the board also a **destination we measure** (entry-source = board, board dwell) or purely an output visualization? (decides whether it gets its own funnel)
- Whether to **commit it as a formal delta cluster** (and thus re-baseline the "28").

---

## Cross-links
- `gfm-design-system.md` — tokens (binding for all visuals)
- `strategy-personalization.md` — the "mark grew" message is a personalization/notification slot (L3.5)
- `design-overlay.md` — each mark/region is instrumentable; the board is overlay-annotatable
- `design-dashboard.md` — the analytical twin of this surface
- `strategy-metrics-research.md` §4 — single owner of the event schema the board extends
- `community-wireframe.md` / `fundraiser-wireframe.md` / `profile-wireframe.md` — where the board slots in per page
