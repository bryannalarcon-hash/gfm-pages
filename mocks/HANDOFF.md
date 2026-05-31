# GoFundMe v4.2 — Build Handoff (Claude Code)

**Goal:** ship the **v4.2 "Suns"** direction for **Fundraiser, Community, Profile**, in both **desktop and mobile**. These static HTML/CSS mocks are the visual source of truth — port them into the real app.

## What's in this folder
| File | Role |
|---|---|
| `fundraiser-v4.2.html` | Fundraiser page (share-first + ambient suns) |
| `community-v4.2.html` | Community page (posts feed + ambient suns) |
| `profile-v4.2.html` | Profile page (fundraisers + suns above shares) |
| `mobile.html` | Phone-frame gallery that loads the three pages at 390px |
| `tokens.css` | Design-system tokens (binding — no invented colors; no green CTA on white) |
| `shared.css` | Component primitives (nav, buttons, cards, post cards, footer, tabs) |
| `v4.css` | Share-first layout (hero, **share studio carousel**, ripple, sharer board) |
| `marks.css` | Suns visuals: logo mask, letter, own-sun ring, creation modal, ribbon, animated legend |
| `marks-bg.js` | Ambient suns engine (gutter fill, bucket physics, sliders, own/sharer highlight) |
| `suncreate.js` | "Light your sun" creation modal + per-persona states + share ribbon |
| `overlay.css/js` | Demo-only metric overlay + persona switcher + page/version pill nav |
| `before.css` | Demo-only "Before" (current-GFM recreation) for the Before/After toggle |
| `icons.js` | Inline SVG sprite (filled, currentColor) |

## The "Suns" system (the signature surface)
Every supporter leaves a **sun** (the GoFundMe rising-sun logo, a CSS mask):
- **Follow** = places a sun (uncoloured grey)
- **Share** = colours it (curated key-gradients only — never a free hex picker)
- **Give** = grows it (size)
Suns fill the **side gutters** of the page (an absolute, full-height layer behind content; `z-index:-1` with the page background moved to `<html>`), packed bottom-up like cottonballs in a bucket, fading toward the centre via a horizontal mask so they never sit under the content column. No dollar figures are ever shown — only presence + a text aggregate.

### Tunable behaviour (demo panel, bottom-centre)
- **Density** (default **0.74**) — overall packing; bottom always denser than top.
- **Size contrast** (default **1**) — top-vs-bottom sun size difference.
- **Funded %** (default 0.78) — scales sun **size/crowding**, NOT emptiness: low % = fewer, larger, comfortable suns filling the full gutter; high % = many small crowded suns. The page must never read as empty.
> In production these are not user controls — they are derived inputs (density/contrast = design constants; funded % = the campaign's real progress). The panel is a demo affordance; **do not ship it**.

### Highlights
- Viewer's own sun is ringed + tagged **"Your sun"** for personas who've contributed.
- Arriving via a share link tags the **sharer's** sun ("Mike T. shared this").

## Mobile rules
- Pages are mobile-first/responsive. Below ~700px the gutters collapse, so suns become a **faint field behind content** (visible but subtle, ~0.17 opacity).
- Share studio is a **single-card carousel** (swipe through all 4 channels) at every width — one card visible with a peek of the next.
- Persistent **Donate bar** under the top nav on Fundraiser.
- Hide the demo panel (`.marks-panel`) on mobile (already `display:none` ≤700px).

## Instrumentation
Every redesigned block carries `data-overlay-*` (tier, events, metric, rationale) and delta tags. Wire the named events; the overlay/persona/Before chrome is **demo-only — strip for production**.

## Don't ship (demo-only)
`overlay.css`, `overlay.js`, `before.css`, the `.marks-panel` sliders, and the `data-overlay-*` attributes are for the portfolio demo. Keep the suns engine (`marks-bg.js`, `suncreate.js`, `marks.css`), `v4.css`, `shared.css`, `tokens.css`, `icons.js`.

## Acceptance
1. Desktop: suns fill both gutters, fade toward centre, never overlap content; share studio carousels; Donate bar sticky.
2. Mobile (390px): faint suns behind content; share studio = 1-card carousel; Donate bar present.
3. No green CTA on white; all colors from `tokens.css`.
4. `prefers-reduced-motion` respected (no sun fall/wobble; static rest state).
