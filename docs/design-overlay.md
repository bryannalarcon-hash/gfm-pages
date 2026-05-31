# Metric Overlay — High-Level Design

> The portfolio's signature surface: a toggleable annotation layer that turns any of the three redesigned pages into a teaching artifact. When ON, every instrumented element wears a tier-coloured highlight; clicking a highlight surfaces *what* event fires, *why* it's tracked, and *where* it lives on the dashboard. The underlying buttons are inert while the overlay is on — clicks are intercepted to show the annotation, not trigger the action.

---

## The pill — now a menu trigger (always visible)

A floating control that travels with the page on every redesigned surface. Tapping the pill **expands a popover menu above it** with the overlay toggle + a persona switcher. The closed pill displays the currently-active persona name so a viewer can see the state at a glance.

- **Placement:** `position: fixed`, bottom-right, inside `safe-area-inset` on mobile.
- **Closed state (pill collapsed):**
  - `padding: spacing-1 spacing-2`, `border-radius: 624.9375rem`, `min-height: spacing-5` (40px). Body-xs label.
  - **Default visual (overlay OFF, anonymous persona):** `bg #f5f5f5`, `color #6f6f6f`, border `1px solid #b7b7b6`. Label: *"👤 Anonymous · ▾"*.
  - **Overlay ON visual:** `bg #232323`, `color #fff`, no border. Label: *"👤 [Persona name] · overlay on · ▾"*. Pulses subtly (0.5s opacity 0.8↔1) on first activation.
  - **z-index:** above everything else, including modals.
- **Behavior on tap:** opens the menu popover above the pill. Tapping outside the menu or pressing Escape closes it.
- **Two state keys persisted in `localStorage`** so they survive page nav within the demo session:
  - `overlayOn: boolean`
  - `overlayPersona: string` — slug of the current persona (e.g. `"anonymous"`, `"close_friend"`, `"extrovert"`). See `design-personas.md` for the canonical list.

## The menu (popover above the pill)

Opens upward from the pill. Same component on every redesigned page (global state).

- **Anatomy:** card with `border-radius: 16px` (`--hrt-size-radius-xl`), `bg #fff`, `box-shadow: 0 8px 24px rgba(0,0,0,0.18)`, `padding: spacing-2` (16px), width ~280px on desktop, full-bleed minus `spacing-2` gutters on mobile.
- **Item structure:**
  - **First item — Overlay toggle.** Label: *"Show metric overlay"* with a switch control on the right. Tapping toggles `overlayOn` and the menu stays open so the user can see the page change.
  - **Divider** — `1px solid #efefef`, `margin: spacing-1 0`.
  - **Persona section header** — *"View as…"* — body-xs `#6f6f6f` weight 175 uppercase.
  - **Persona items** (one row each, see `design-personas.md` for the list). Each row:
    - Avatar circle (32px, `border-radius: --hrt-size-radius-full`, persona-coloured) on the left.
    - Persona name (body-md `#232323` weight 175) + one-line description (body-xs `#6f6f6f`).
    - Right-aligned check ✓ marker on the currently-active persona.
  - **Tapping a persona row** writes `overlayPersona` to localStorage AND triggers a soft page re-render (Next.js client-side state update — no full reload). The closed pill label updates to reflect the new persona.
- **Closing the menu:** tap outside, press Escape, or tap the pill again.
- **a11y:** `role="menu"`; menu items are `role="menuitemradio"` for personas (single-select) and `role="menuitemcheckbox"` for the overlay toggle. Arrow keys traverse; Enter activates; Escape closes and returns focus to the pill.

## What happens when persona changes

The L3.5 personalization logic is **identical to production** — it reads "current user" data and renders slots accordingly. What changes in demo mode is the *source* of that data: instead of the real authenticated user's record, the app reads a hardcoded persona fixture from `design-personas.md`. Every personalization slot (D8, D10, D3 carousel, P2 feed, P4 PYMK, P9 recurring nudge, C2 divider, C5 strip, etc.) re-renders against the new fixture's data.

This is the demo's signature trick: same page, same code, same overlay annotations — **completely different content because "who the user is" changed.**

For the full per-persona render table per delta, see `design-personas.md`.

## The overlay (visible when pill is ON)

A soft dimming layer + targeted highlights.

- **Dim layer:** full-viewport, `position: fixed`, `bg: rgba(35,35,35,0.35)`, `pointer-events: all`. Sits below the highlights and the pill, above the page content.
- **Highlight cutouts:** every instrumented element (every CHANGED-BY-delta region from the three feature-parity matrices) gets a tier-coloured outline + a slight inner glow:
  - **Tier 1 (Core conversion):** outline `2px solid #ffd863`, glow `0 0 12px rgba(255,216,99,0.6)`.
  - **Tier 2 (Loop / retention):** outline `2px solid #4a9d44`, glow `0 0 12px rgba(74,157,68,0.55)`.
  - **Tier guardrail (dashboard-only):** *not highlighted* on-page; surfaced only in the dashboard.
- **Click interception rule:** while the overlay is ON, ALL clicks are intercepted. Three cases:
  1. **Click on the pill** → toggles overlay off (always works).
  2. **Click on a highlighted region** → opens the metric blob (popover) for that region. Underlying action does NOT fire (no donation, no share, no follow).
  3. **Click anywhere else** (dim area, non-instrumented region) → does nothing; click is absorbed.

## The metric blob (popover)

Opens anchored to the clicked highlight. Same component on all 3 pages.

- **Anatomy:** card with `border-radius: 16px`, `bg #fff`, `box-shadow: 0 6px 14px rgba(0,0,0,0.1)`, `padding: spacing-3`, max-width 360px.
- **Content (high-level):**
  - **Event name(s)** that fire when this is clicked (e.g. `Donate Completed`, `Share Clicked` + `share_channel`).
  - **Tier badge** (warm-red Tier 1 / green Tier 2) matching the highlight outline.
  - **Why it's tracked** — one-line plain-English: which graded metric it moves + the supporting research or GFM-confirmed experiment (pulled from the redesign delta's body).
  - **Where on the dashboard** — a one-line "see this in the [Donate Funnel] chart" link that scrolls/navigates to that dashboard widget.
  - **Close** (× icon) and **previous/next** (◂ ▸) to step through all highlights on the page without dismissing the overlay.

## Data the overlay reads

Each instrumented element on the rendered page carries data attributes:

- `data-overlay-tier="1|2"` — tier coloring.
- `data-overlay-events="Donate Completed,Donate Started"` — comma-list of events that fire here.
- `data-overlay-delta="D1"` — the delta ID for cross-reference.
- `data-overlay-metric="Donate conversion"` — the graded metric served.
- `data-overlay-why="..."` — short rationale (pulled at build time from the delta's body).
- `data-overlay-dashboard="donate-funnel"` — dashboard widget anchor.

The overlay scans the DOM for `[data-overlay-tier]` on activation and draws the highlights + wires the blob.

## Persistence + cross-page

- Toggle state in `localStorage` under one key — `overlayOn: true|false`. Read on every page mount.
- Same pill, same blob, same coloring across fundraiser / community / profile.
- The before/after toggle (separate from this overlay) is its own control; the two can be on simultaneously, but if the page is in *Before (current-GFM)* mode the overlay shows zero highlights (current GFM doesn't carry our `data-overlay-*` attributes).

## Mobile

- Pill respects `safe-area-inset-bottom`.
- Highlight outlines use 3px instead of 2px (small screens need more contrast).
- Blob renders bottom-sheet style instead of anchored popover — fixed full-width above the keyboard area.

## Accessibility

- Pill has `aria-pressed` reflecting state.
- Each highlighted region gets `role="button"` + `aria-label="Show metric for [region name]"` *only while overlay is on*.
- Blob is a focus trap with Escape to close; arrow keys step through highlights.
- Respects `prefers-reduced-motion` — no pulse, no glow animation.

## What it deliberately does NOT do

- No annotation editing in the demo (badges are baked from the delta docs at build time).
- No "live event firing" in the overlay UI (the dashboard shows the live stream — see `design-dashboard.md` when written).
- No diff against an "original" — that's the before/after toggle's job.
