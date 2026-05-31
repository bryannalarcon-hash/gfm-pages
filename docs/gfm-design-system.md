# GoFundMe Design System — Extracted Tokens

**Extracted:** 2026-05-28  
**Method:** Empirical extraction from SSR HTML (`gofundme.com/f/realtime-alerts-for-wildfire-safety-r5jkk`, `/communities/watch-duty`, `/u/janahan`) plus five linked Next.js CSS bundles (`9a67444e7e292d24.css` = 643 KB main, `290d2655418da790.css` = 77 KB, three small page-scoped files). The system uses a proprietary design system with class prefix `hrt-` (Heart) and CSS custom properties under the same namespace. JS-in-CSS bundles and runtime theme overrides are not visible here.

---

## Summary

GoFundMe's visual language is clean and confidence-oriented: a single mid-tone green brand color (#4A9D44) carried through CTA buttons, icons, progress gradients, and positive-state indicators, set against neutral near-black text (#232323) on white surfaces. The type system relies exclusively on a custom variable-weight font ("GoFundMe Sans") across a fluid 14-step scale. Spacing is based on a 0.5 rem (8 px) unit with a half-step of 0.25 rem. Buttons are fully pill-shaped (radius = 624.9375 rem ≈ ∞). Cards use large but not pill radii (0.75 rem–1.5 rem). Shadows are subtle single-layer drops. The icon set (177 symbols, SVG sprite via `<use>`) is uniformly filled — all paths use `fill="currentColor"` with no stroke-based outlines.

---

## Color Tokens

### Brand / Primary Greens

| Token name | Hex | Usage | Source |
|---|---|---|---|
| `--hrt-color-surface-brand` | `#4a9d44` | Brand surface, logo bg | `9a67444e7e292d24.css` |
| `--hrt-color-border-brand` | `#4a9d44` | Brand border | same |
| `--hrt-color-icon-brand` | `#4a9d44` | Brand icons | same |
| `--hrt-color-text-brand` | `#4a9d44` | Brand text links | same |
| `--hrt-color-data-categorical-1` | `#4a9d44` | Chart/data primary | same |
| `--hrt-color-data-positive` | `#4a9d44` | Positive data indicator | same |
| `--hrt-color-surface-brand-medium` | `#ccf88e` | Light green pill bg, avatar bg | same |
| `--hrt-color-surface-brand-subtle` | `#e9fcce` | Subtle green bg | same |
| `--hrt-color-surface-brand-strong` | `#274a34` | Dark green surface | same |
| `--hrt-color-surface-brand-strongest` | `#0b291a` | Darkest green | same |
| `--hrt-color-text-brand-strong` | `#274a34` | Strong brand text | same |
| `--hrt-color-text-brand-hover` | `#2d6339` | Brand text hover | same |
| `--hrt-color-icon-brand-hover` | `#2d6339` | Brand icon hover | same |
| `--hrt-gradient-progress-linear` | `linear-gradient(90deg,#acf86c,#4a9d44 93.27%)` | Progress bar fill | same |
| `--hrt-gradient-progress` | `conic-gradient(from 0deg at 50% 50%,#acf86c 0deg,#4a9d44 332.77deg)` | Circle progress | same |

### Neutral / Grays

| Token name | Hex | Usage | Source |
|---|---|---|---|
| `--hrt-color-text-default` | `#232323` | Body text, primary text | `9a67444e7e292d24.css` |
| `--hrt-color-text-headings` | `#232323` | Headings | same |
| `--hrt-color-surface-neutral-strong` | `#232323` | Strong neutral surface | same |
| `--hrt-color-text-strong` | `#424242` | Strong text | same |
| `--hrt-color-text-neutral-strong` | `#424242` | Neutral strong text | same |
| `--hrt-color-text-supporting` | `#6f6f6f` | Supporting / secondary text | same |
| `--hrt-color-text-helper` | `#6f6f6f` | Helper/caption text | same |
| `--hrt-color-border-neutral` | `#b7b7b6` | Default borders | same |
| `--hrt-color-text-disabled` | `#b7b7b6` | Disabled text | same |
| `--hrt-color-border-disabled` | `#d8d8d8` | Disabled border | same |
| `--hrt-color-surface-neutral-subtle` | `#f5f5f5` | Subtle bg, card bg | same |
| `--hrt-color-surface-neutral-extra-subtle` | `#fafafa` | Extra-subtle bg | same |
| `--hrt-color-surface-default` | `#fff` | Page background | same |
| `--hrt-color-surface-raised` | `#fff` | Card / raised surface | same |
| `--hrt-color-border-neutral-extra-subtle` | `#efefef` | Card outer border | same |
| `--hrt-color-surface-neutral-medium` | `#e9e9e9` | Medium neutral | same |

### Semantic States

| Token name | Hex | Semantic | Source |
|---|---|---|---|
| `--hrt-color-text-negative` | `#b01509` | Error text | `9a67444e7e292d24.css` |
| `--hrt-color-surface-negative-strong` | `#880e06` | Error surface | same |
| `--hrt-color-surface-notification` | `#b01509` | Notification badge | same |
| `--hrt-color-text-informative` | `#185b93` | Info text | same |
| `--hrt-color-surface-informative-strong` | `#1c456b` | Info surface | same |
| `--hrt-color-surface-informative-medium` | `#a7e3e3` | Info medium | same |
| `--hrt-color-text-positive` | `#2d6339` | Success text | same |
| `--hrt-color-surface-positive-strong` | `#274a34` | Success surface | same |
| `--hrt-color-surface-positive-medium` | `#ccf88e` | Success medium | same |
| `--hrt-color-text-tip` | `#68570d` | Warning/tip text | same |
| `--hrt-color-surface-tip-medium` | `#ffd863` | Warning/tip surface | same |
| `--hrt-color-surface-tip-subtle` | `#fff3d0` | Warning/tip subtle | same |
| `--hrt-color-text-feature` | `#81379b` | Feature/premium text | same |
| `--hrt-color-surface-feature-strong` | `#642878` | Feature surface | same |
| `--hrt-color-surface-feature-medium` | `#eccff6` | Feature medium | same |

### Button Surface Colors

| Token name | Hex | Usage | Source |
|---|---|---|---|
| `--hrt-color-button-primary-surface` | `#232323` | Primary button bg (default) | `9a67444e7e292d24.css` |
| `--hrt-color-button-primary-surface-hover` | `#585858` | Primary button bg hover | same |
| `--hrt-color-button-primary-text` | `#fff` | Primary button label | same |
| `--hrt-color-button-secondary-border` | `#b7b7b6` | Secondary button border | same |
| `--hrt-color-button-secondary-text` | `#232323` | Secondary button label | same |

> **Note on the "Donate" CTA:** The donate button uses `hrt-primary-button--default-on-strong` (appears on the green hero section), giving it bg `#ccf88e` (brand-on-strong) with text `#274a34`. On white sections it uses `hrt-primary-button--default`: bg `#232323`, text `#fff`. The real green button color is not a direct primary — it appears as the "on-strong" variant.

---

## Typography

### Font Stack

```css
--hrt-font-family: "GoFundMe Sans", Trebuchet, Helvetica, Arial, sans-serif;
--hrt-font-family-mono: ui-monospace, Menlo, Monaco, "Cascadia Mono", "Segoe UI Mono",
  "Roboto Mono", "Oxygen Mono", "Ubuntu Monospace", "Source Code Pro",
  "Fira Mono", "Droid Sans Mono", "Courier New", monospace;
```

**Font source:** `https://cdn.gofundme.com/fonts/GoFundMeSans-Variable.woff2`  
**Font display:** `fallback`  
**Variable axis:** `font-weight: 30 200` (variable font; numeric weights map to named semantic weights below)

### Font Weights (variable axis values)

| Token | Value | Usage |
|---|---|---|
| `--hrt-font-weight-regular` | `100` | Body text |
| `--hrt-font-weight-medium` | `130` | Medium emphasis |
| `--hrt-font-weight-bold` | `175` | Headings, buttons, bold body |

### Type Scale (fluid / clamp-based)

| Token | Min size | Max size | Clamp expression |
|---|---|---|---|
| `--hrt-size-font-display-lg` | 3rem (48px) | 5.125rem (82px) | fluid |
| `--hrt-size-font-display-md` | 2.5rem (40px) | 4rem (64px) | fluid |
| `--hrt-size-font-display-sm` | 1.75rem (28px) | 2.5rem (40px) | fluid |
| `--hrt-size-font-heading-xl` | 1.75rem (28px) | 2rem (32px) | fluid |
| `--hrt-size-font-heading-lg` | 1.5rem (24px) | 1.75rem (28px) | fluid |
| `--hrt-size-font-heading-md` | 1.25rem (20px) | 1.5rem (24px) | fluid |
| `--hrt-size-font-heading-sm` | 1rem (16px) | 1.25rem (20px) | fluid |
| `--hrt-size-font-heading-xs` | 0.875rem (14px) | 1rem (16px) | fluid |
| `--hrt-size-font-body-lg` | 1.25rem (20px) | 1.5rem (24px) | fluid |
| `--hrt-size-font-body-md` | 1rem (16px) | 1rem (16px) | fixed |
| `--hrt-size-font-body-sm` | 0.875rem (14px) | 0.875rem (14px) | fixed |
| `--hrt-size-font-body-xs` | 0.75rem (12px) | 0.75rem (12px) | fixed |
| `--hrt-size-font-legend` | 1.25rem (20px) | 1.25rem (20px) | fixed |

Fluid breakpoints: min viewport = 23.4375rem (375px), max = 90rem (1440px).

### Line Heights

| Token | Value |
|---|---|
| `--hrt-line-height-body` | `1.5` |
| `--hrt-line-height-heading` | `1.2` |
| `--hrt-line-height-condensed` | `1.333` |
| `--hrt-line-height-tight` | `1.1` |
| `--hrt-line-height-none` | `1` |

### Letter Spacing

| Token | Value | Applied to |
|---|---|---|
| `--hrt-letter-spacing-tighter` | `-0.02em` | Display |
| `--hrt-letter-spacing-tight` | `-0.01em` | Headings XL–LG, legend |
| `--hrt-letter-spacing-normal` | `0em` | Heading SM–XS, body |

---

## Spacing, Border Radii, and Shadows

### Spacing Scale (base unit = 0.5rem / 8px)

| Token | Value | Pixels |
|---|---|---|
| `--hrt-size-spacing-half` | `0.25rem` | 4px |
| `--hrt-size-spacing-1` | `0.5rem` | 8px |
| `--hrt-size-spacing-2` | `1rem` | 16px |
| `--hrt-size-spacing-3` | `1.5rem` | 24px |
| `--hrt-size-spacing-4` | `2rem` | 32px |
| `--hrt-size-spacing-5` | `2.5rem` | 40px |
| `--hrt-size-spacing-6` | `3rem` | 48px |
| `--hrt-size-spacing-7` | `3.5rem` | 56px |
| `--hrt-size-spacing-8` | `4rem` | 64px |
| `--hrt-size-spacing-9` | `4.5rem` | 72px |
| `--hrt-size-spacing-10` | `5rem` | 80px |
| `--hrt-size-spacing-11` | `5.5rem` | 88px |
| `--hrt-size-spacing-12` | `6rem` | 96px |
| `--hrt-size-spacing-15` | `7.5rem` | 120px |
| `--hrt-size-spacing-30` | `15rem` | 240px |

Base unit: **0.5rem (8px)**. Each step = +0.5rem. Half-step at 0.25rem (4px).

### Border Radii

| Token | Value | Used for |
|---|---|---|
| `--hrt-size-radius-xs` | `0.125rem` (2px) | Micro elements |
| `--hrt-size-radius-sm` / `--hrt-size-radius-1` | `0.25rem` (4px) | Tags |
| `--hrt-size-radius-md` / `--hrt-size-radius-2` | `0.5rem` (8px) | Small card thumbnails, inputs |
| `--hrt-size-radius-lg` / `--hrt-size-radius-3` | `0.75rem` (12px) | Cards (condensed) |
| `--hrt-size-radius-xl` / `--hrt-size-radius-4` | `1rem` (16px) | Card image containers (default) |
| `--hrt-size-radius-xxl` / `--hrt-size-radius-5` | `1.25rem` (20px) | Fundraiser card outer (default) |
| `--hrt-size-radius-xxxl` / `--hrt-size-radius-6` | `1.5rem` (24px) | Large cards, section edges, upsell banners |
| `--hrt-size-radius-full` | `624.9375rem` | Buttons (pill), avatars, progress circles, tags |

**Button radius:** fully pill (`--hrt-size-radius-full` = 624.9375rem).

### Shadows

| Token | Value | Used for |
|---|---|---|
| `--hrt-shadow-soft` | `0px 1px 2px #0000001a` | Subtle elevation |
| `--hrt-shadow-medium` | `0px 2px 6px #0000001a` | Cards, dropdowns |
| `--hrt-shadow-medium-strong` | `0px 4px 8px #0000001a` | Modals, popovers |
| `--hrt-shadow-strong` | `0px 6px 14px #0000001a` | High elevation |
| `--hrt-color-drop-shadow` | `#2323231a` | Shadow color (10% near-black) |
| `--hrt-color-drop-shadow-brand` | `#e9fcce` | Brand-colored drop shadow |

All shadows are single-layer, transparent-black, no spread.

---

## Component Primitives

### Button

```
Primary button (default variant):
  border-radius:  var(--hrt-size-radius-full)  [fully pill]
  padding-x:      var(--hrt-size-spacing-3)    [1.5rem / 24px per side]
  padding-y (large): var(--hrt-size-spacing-1) [0.5rem / 8px per side]
  min-height (large): var(--hrt-size-spacing-6) [3rem / 48px]
  min-height (medium): var(--hrt-size-spacing-5) [2.5rem / 40px]
  min-height (small): var(--hrt-size-spacing-4) [2rem / 32px]
  font:           body-md (1rem)
  font-weight:    var(--hrt-font-weight-bold) = 175
  line-height:    1.25rem
  border:         1px solid transparent

Default (on white):  bg #232323, text #fff
Default hover:       bg #585858, text #fff
"on-strong" (on green hero):  bg #ccf88e, text #274a34
```

```
Secondary button:
  Same border-radius (pill)
  border: 1px solid #b7b7b6
  bg: transparent (#23232300)
  bg hover: #2323230d  (~5% black)
  text: #232323
  text-disabled: #b7b7b6
```

### Card (Fundraiser Card)

```
Default size (.hrt-fundraiser-card--size-default):
  border-radius (outer): var(--hrt-size-radius-xxl)  [1.25rem / 20px]
  image-container:
    aspect-ratio: 3/2
    border-radius: var(--hrt-size-radius-xl)  [1rem / 16px]
  content padding: var(--hrt-size-spacing-2) [1rem / 16px] top, left, right
  border: 1px solid transparent (hover: 1px solid #efefef)
  bg: initial (transparent — parent surface shows through)
  title: body-md / font-weight 175 / line-height 1.2
  body text: body-sm / color supporting (#6f6f6f)

Medium size (.hrt-fundraiser-card--size-medium):
  border-radius (outer): var(--hrt-size-radius-xxxl)!important  [1.5rem]
  border: 1px solid #efefef
  bg: #fff (raised)
  padding: var(--hrt-size-spacing-2)  [1rem]
  gap: var(--hrt-size-spacing-2)      [1rem]
  max-width: 560px

Condensed size (.hrt-fundraiser-card--size-condensed):
  border-radius (outer): var(--hrt-size-radius-xl)  [1rem]
  flex-direction: row
  image: 1:1, max-width: var(--hrt-size-spacing-11) [5.5rem / 88px]
  image border-radius: var(--hrt-size-radius-md) [0.5rem]
```

### Progress Bar (Goal Bar)

```
.hrt-goal-bar:
  height: var(--hrt-size-spacing-1)  [0.5rem / 8px]
  border-radius: var(--hrt-size-radius-full)  [pill]
  background (track): var(--hrt-color-surface-unfilled-subtle) = #2323230d
  fill: linear-gradient(90deg, #acf86c, #4a9d44 93.27%)
  margin-top: var(--hrt-size-spacing-2) [1rem] (default card context)

Label:
  font: body-sm (0.875rem)
  font-weight: 175
  margin-top: 0.375rem
  color: #232323
```

### Avatar

```
Small:    32px × 32px   (var(--hrt-size-spacing-3))
Medium:   2rem × 2rem   (var(--hrt-size-spacing-4))
Large:    2.5rem × 2.5rem
XLarge:   3.5rem × 3.5rem
XXXLarge: 6rem × 6rem   (var(--hrt-size-spacing-12))

border-radius: var(--hrt-size-radius-full)  [circle]
Neutral bg: #f5f5f5
Brand bg:   #ccf88e (text: #274a34)
font-weight: 175 (bold) for initials
```

### Layout Container

```
.hrt-container:
  margin: 0 auto
  padding-x: var(--hrt-size-spacing-3)  [1.5rem / 24px]
  max-width (default): 48rem  (768px)
  max-width (lg):      64rem  (1024px)
  max-width (xl):      72rem  (1152px)
```

---

## Iconography

**Style:** Filled paths (`fill="currentColor"`) — no stroke-based outlines.  
**Source:** Custom SVG sprite at `/_next/static/images/core-[hash].svg` (177 symbols).  
**Usage:** `<svg class="hrt-icon hrt-icon--default"><use href="sprite.svg#icon-name"></use></svg>`  
**Sizes:**
- xsmall: `--hrt-size-spacing-1` = 0.5rem (8px)
- small: `--hrt-size-spacing-2` = 1rem (16px)
- default: `--hrt-size-spacing-3` = 1.5rem (24px)
- medium: `--hrt-size-spacing-4` = 2rem (32px)
- large: `--hrt-size-spacing-5` = 2.5rem (40px)

**Icon availability:** both line-style and filled variants exist as separate symbols (e.g., `account` vs `account-fill`), so the base set appears as **filled** but line versions are available.

---

## Animation Tokens

| Token | Value |
|---|---|
| `--hrt-ease-default` | `cubic-bezier(0.3, 0.01, 0, 1)` |
| `--hrt-time-transition` | `0.50s` |
| `--hrt-time-transition-fast` | `0.25s` |
| `--hrt-time-delay-offset` | `0.06s` |
| `--hrt-time-delay-guidance` | `1.50s` |

Card image hover: `transform: scale(1.05)` over `0.25s cubic-bezier(0.3,0.01,0,1)`.

---

## Confidence Notes

### High confidence (extracted directly from CSS custom property definitions)
- All color hex values — these are literal values in the compiled stylesheet
- Font family name and WOFF2 URL
- Font weight axis values (100/130/175 on the variable font)
- Spacing scale (all 16 steps, 8px base)
- Border radius scale (all 9 named values)
- Shadow values (4 levels)
- Button anatomy (padding, radius, min-height, hover colors)
- Fundraiser card anatomy (radii, padding, border)
- Progress bar anatomy (height, fill gradient, track color)
- Icon system (filled paths, currentColor, 177-icon sprite)
- Transition easing and duration values

### Medium confidence (inferred from token names + CSS rules; visual behavior requires browser rendering)
- Which button variant is actually used for the Donate CTA on a given page context ("default-on-strong" vs "default")
- Card shadow — the `--hrt-shadow-medium` token is defined but card rules show `border: 1px solid #efefef` rather than shadow; elevation may be from border only on cards
- Icon fill vs line usage in practice — both variants exist; primary UI appears to use filled

### Not visible from SSR (exists in JS bundles / runtime CSS-in-JS)
- Hover and focus state animations (CSS transitions are defined, but interactive state classes come from JS)
- Input field design (`.hrt-input` rules were not found in the CSS bundles; likely in a separate lazy-loaded chunk)
- Modal anatomy and backdrop blur
- Toast / notification positioning
- Dark mode or theme overrides (if any)
- Custom property values for `--hrt-text-body-md` composite shorthand (the `font:` shorthand token itself resolves at runtime)
- Any A/B test variant themes
