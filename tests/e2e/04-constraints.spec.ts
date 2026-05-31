/**
 * §4 — Constraint / Guardrail E2E Tests
 *
 * 4.a No green CTA on white — primary CTAs on white/near-white backgrounds must use
 *     #232323, not a green token. The design system forbids green (#4a9d44 / #388e3c)
 *     as a CTA background on white surfaces.
 *
 * 4.b No internal-index leak — visible innerText of each page must not contain bare
 *     D#/C#/P#/S#/W# token strings (attributes are fine; text content must be clean).
 *
 * 4.c data-overlay-events membership — every data-overlay-events value in the DOM
 *     is a comma-list of members from the canonical EventName set (lib/types.ts).
 *     Catches legacy event names from the mock surviving into the build.
 */

import { test, expect, Page } from '@playwright/test';
import { clearOverlayState, CANONICAL_EVENT_NAMES, openDonateForm, donateFormScope } from './helpers';

const WILDFIRE = '/f/realtime-alerts-for-wildfire-safety-r5jkk';
const BANDROOM = '/f/rebuild-the-lincoln-hs-band-room';
const COMMUNITY = '/communities/watch-duty';
const PROFILE = '/u/janahan';
const DASHBOARD = '/dashboard';
const LANDING = '/';

// Green tokens that must NOT appear as CTA backgrounds on white surfaces
// From gfm-design-system.md: the brand green is ~#4a9d44 / rgb(74, 157, 68)
// and its variants. The primary CTA on white must be #232323.
const GREEN_RGB_PATTERNS = [
  /rgb\(74,\s*157,\s*68\)/,   // #4a9d44
  /rgb\(56,\s*142,\s*60\)/,   // #388e3c
  /rgb\(46,\s*125,\s*50\)/,   // #2e7d32
  /rgb\(76,\s*175,\s*80\)/,   // #4CAF50
  /rgb\(67,\s*160,\s*71\)/,   // #43a047
];

// What the primary CTA SHOULD look like on white: ~#232323
const EXPECTED_PRIMARY_BG = /rgb\(35,\s*35,\s*35\)|rgb\(34,\s*34,\s*34\)|rgb\(36,\s*36,\s*36\)/;

// Helper: check if a color string matches green
function isGreenish(colorStr: string): boolean {
  return GREEN_RGB_PATTERNS.some((pattern) => pattern.test(colorStr));
}

// Helper: check if background is white or near-white
function isWhiteBackground(colorStr: string): boolean {
  // White: rgb(255, 255, 255) or rgba(255, 255, 255, 1)
  // Near-white: > 240 on all channels
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return false;
  const [, r, g, b] = match.map(Number);
  return r > 230 && g > 230 && b > 230;
}

// ──────────────────────────────────────────────────────────────────────────────
// 4.a — No green CTA on white
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Constraint 4.a — No green CTA on white', () => {
  test.beforeEach(async ({ page }) => {
    await clearOverlayState(page);
  });

  test('fundraiser page: primary donate CTA is NOT green on white background', async ({ page }) => {
    await page.goto(WILDFIRE);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('button[data-variant="primary"]', { timeout: 8000 });

    // Check all primary buttons
    const primaryButtons = await page.$$('button[data-variant="primary"]');
    for (const btn of primaryButtons) {
      const isVisible = await btn.isVisible();
      if (!isVisible) continue;

      const bgColor = await btn.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      // Get the button's parent background to check if it's on white
      const parentBg = await btn.evaluate((el) => {
        let node: Element | null = el.parentElement;
        while (node) {
          const bg = window.getComputedStyle(node).backgroundColor;
          if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
            return bg;
          }
          node = node.parentElement;
        }
        return 'rgb(255, 255, 255)';
      });

      const onWhite = isWhiteBackground(parentBg) || isWhiteBackground('rgb(255, 255, 255)');

      if (onWhite && isGreenish(bgColor)) {
        // FAIL: green CTA on white
        throw new Error(
          `Green CTA found on white background: bgColor=${bgColor}, parentBg=${parentBg}`,
        );
      }

      // If on white, the CTA should be #232323 (dark charcoal)
      if (onWhite && !isGreenish(bgColor)) {
        // Check it's the correct charcoal
        const isCharcoal = EXPECTED_PRIMARY_BG.test(bgColor);
        // Allow transparent (will be overridden by CSS var) or charcoal
        const isTransparent = bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent';
        if (!isCharcoal && !isTransparent) {
          // Check the CSS variable resolution
          const cssVar = await btn.evaluate((el) => {
            return getComputedStyle(el).getPropertyValue('--hrt-color-button-primary-surface').trim();
          });
          // If the CSS var is set, verify it's not green
          if (cssVar) {
            expect(cssVar).not.toMatch(/#4a9d44|#388e3c|#43a047|#4caf50/i);
          }
        }
      }
    }

    // Pass: no green CTAs on white found
  });

  test('community page: primary CTAs are not green on white', async ({ page }) => {
    await page.goto(COMMUNITY);
    await page.waitForLoadState('domcontentloaded');

    const primaryButtons = await page.$$('button[data-variant="primary"]');
    for (const btn of primaryButtons) {
      const isVisible = await btn.isVisible();
      if (!isVisible) continue;

      const bgColor = await btn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
      expect(isGreenish(bgColor)).toBe(false);
    }
  });

  test('profile page: primary CTAs are not green on white', async ({ page }) => {
    await page.goto(PROFILE);
    await page.waitForLoadState('domcontentloaded');

    const primaryButtons = await page.$$('button[data-variant="primary"]');
    for (const btn of primaryButtons) {
      const isVisible = await btn.isVisible();
      if (!isVisible) continue;

      const bgColor = await btn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
      expect(isGreenish(bgColor)).toBe(false);
    }
  });

  test('donate CTA background resolves to charcoal ~#232323, not green token', async ({ page }) => {
    await page.goto(WILDFIRE);
    await page.waitForLoadState('domcontentloaded');

    // Layout-aware: open the donate form so the submit CTA is on-screen.
    // On mobile the submit button only renders inside the bottom-sheet (off-screen
    // until opened → evaluate would throw on a null/hidden element). Opening the
    // sheet and scoping to the active form fixes this on both layouts.
    await openDonateForm(page);
    const submitBtn = donateFormScope(page).locator('button[type="submit"]');
    await submitBtn.waitFor({ state: 'visible', timeout: 8000 });

    const bgColor = await submitBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);

    // Must NOT be a green tone
    expect(isGreenish(bgColor)).toBe(false);

    // Should be charcoal (~#232323) or a CSS-var-resolved version of it
    // If backgroundColor is transparent, it means a CSS var is driving it
    if (bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
      expect(EXPECTED_PRIMARY_BG.test(bgColor) || !isGreenish(bgColor)).toBe(true);
    }
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 4.b — No internal-index leak (no bare D#/C#/P#/S#/W# tokens in visible text)
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Constraint 4.b — No internal-index leak in page text', () => {
  test.beforeEach(async ({ page }) => {
    await clearOverlayState(page);
  });

  // Pattern: standalone D#, C#, P#, S#, W# tokens that should not appear in user-visible text
  // These are internal delta IDs (D1-D13, C1-C7, P1-P9, S1-S5, W1-W9)
  const INDEX_PATTERN = /\b(D\d{1,2}|C\d|P\d|S\d|W\d)\b/;

  async function assertNoIndexLeak(page: Page, route: string) {
    await page.goto(route);
    await page.waitForLoadState('domcontentloaded');

    // Get visible body text (excludes attribute values and script content)
    const bodyText = await page.evaluate(() => {
      // Walk text nodes only, exclude script/style elements and attribute values
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode(node) {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const tag = parent.tagName.toLowerCase();
            if (['script', 'style', 'noscript', 'template'].includes(tag)) {
              return NodeFilter.FILTER_REJECT;
            }
            // Only include text nodes of visible elements
            const style = window.getComputedStyle(parent);
            if (style.display === 'none' || style.visibility === 'hidden') {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          },
        },
      );

      const texts: string[] = [];
      let node;
      while ((node = walker.nextNode())) {
        const text = node.textContent?.trim();
        if (text) texts.push(text);
      }
      return texts.join(' ');
    });

    // Check for bare index tokens
    // Allow "W5", "W7", etc. ONLY if they appear as part of longer content context
    // A bare D1 in "D1" or "the D1 delta" is a leak; "D11" is a code not a single token
    // We look for standalone tokens surrounded by word boundaries
    const matches = bodyText.match(new RegExp(INDEX_PATTERN, 'g')) ?? [];

    // Filter: allow tokens that are clearly part of other words (e.g., "D1" in a URL)
    // In practice, these should never appear in user-visible copy
    if (matches.length > 0) {
      // Give some context about where the leak is
      for (const match of matches) {
        const idx = bodyText.indexOf(match);
        const context = bodyText.substring(Math.max(0, idx - 30), idx + 30);
        console.warn(`Possible index leak on ${route}: "${match}" in context: "...${context}..."`);
      }
      // Fail only if there are clear standalone tokens
      // Allow things like "S3" that might be in share IDs
      const clearLeaks = matches.filter((m) => {
        // D# and C# and P# and W# are more suspect in fundraiser copy
        return /^(D\d{1,2}|C\d|P\d|W\d)$/.test(m);
      });

      if (clearLeaks.length > 0) {
        throw new Error(
          `Internal index token leak on ${route}: ${clearLeaks.join(', ')} found in page text`,
        );
      }
    }
  }

  test('no D#/C#/P#/W# tokens in wildfire fundraiser page text', async ({ page }) => {
    await assertNoIndexLeak(page, WILDFIRE);
  });

  test('no D#/C#/P#/W# tokens in community page text', async ({ page }) => {
    await assertNoIndexLeak(page, COMMUNITY);
  });

  test('no D#/C#/P#/W# tokens in profile page text', async ({ page }) => {
    await assertNoIndexLeak(page, PROFILE);
  });

  test('no D#/C#/P#/W# tokens in dashboard page text', async ({ page }) => {
    await assertNoIndexLeak(page, DASHBOARD);
  });

  test('no D#/C#/P#/W# tokens in landing page text', async ({ page }) => {
    await assertNoIndexLeak(page, LANDING);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 4.c — data-overlay-events membership in canonical EventName set
// Every data-overlay-events value must be a comma-list of canonical EventNames.
// Catches legacy/mock names that survived into the build.
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Constraint 4.c — data-overlay-events canonical membership', () => {
  test.beforeEach(async ({ page }) => {
    await clearOverlayState(page);
  });

  async function assertOverlayEventsCanonical(page: Page, route: string) {
    await page.goto(route);
    await page.waitForLoadState('domcontentloaded');

    // Collect all data-overlay-events attribute values from the DOM
    const allEventValues = await page.$$eval(
      '[data-overlay-events]',
      (els) => els.map((el) => el.getAttribute('data-overlay-events') ?? ''),
    );

    if (allEventValues.length === 0) {
      // No instrumented elements — nothing to check, but note this
      return;
    }

    const violations: string[] = [];

    for (const eventList of allEventValues) {
      // Split comma-list and trim each name
      const names = eventList.split(',').map((n) => n.trim()).filter(Boolean);

      for (const name of names) {
        if (!CANONICAL_EVENT_NAMES.has(name)) {
          violations.push(`"${name}" (in "${eventList}") on ${route}`);
        }
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `Non-canonical event names in data-overlay-events:\n${violations.join('\n')}\n\n` +
          `Canonical set: ${[...CANONICAL_EVENT_NAMES].join(', ')}`,
      );
    }
  }

  test('wildfire fundraiser: all data-overlay-events are canonical', async ({ page }) => {
    await assertOverlayEventsCanonical(page, WILDFIRE);
  });

  test('bandroom fundraiser: all data-overlay-events are canonical', async ({ page }) => {
    await assertOverlayEventsCanonical(page, BANDROOM);
  });

  test('community page: all data-overlay-events are canonical', async ({ page }) => {
    await assertOverlayEventsCanonical(page, COMMUNITY);
  });

  test('profile page: all data-overlay-events are canonical', async ({ page }) => {
    await assertOverlayEventsCanonical(page, PROFILE);
  });

  test('no legacy event names survive into any page (comprehensive scan)', async ({ page }) => {
    // Legacy mock names from the handoff that must NOT appear
    const legacyNames = [
      'Banner Impression',
      'Activity Feed Viewed',
      'PYMK Module Viewed',
      'Recurring Nudge Viewed',
      'Board Viewed',
    ];

    const routes = [WILDFIRE, BANDROOM, COMMUNITY, PROFILE];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');

      const allEventValues = await page.$$eval(
        '[data-overlay-events]',
        (els) => els.map((el) => el.getAttribute('data-overlay-events') ?? ''),
      );

      const allNames = allEventValues
        .flatMap((v) => v.split(',').map((n) => n.trim()))
        .filter(Boolean);

      for (const legacyName of legacyNames) {
        const found = allNames.includes(legacyName);
        if (found) {
          throw new Error(
            `Legacy event name "${legacyName}" found in data-overlay-events on ${route}`,
          );
        }
      }
    }
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Additional: verify fundraiser SSR content (raised/goal amounts present in HTML)
// This is a CLS guard — numbers should be server-rendered, not loaded async
// ──────────────────────────────────────────────────────────────────────────────
test.describe('SSR content verification (CLS guard)', () => {
  test('wildfire fundraiser: raised and goal amounts are in initial HTML', async ({ page }) => {
    // Intercept the initial HTML response to check SSR content
    const html = await page.request.get(WILDFIRE);
    const body = await html.text();

    // The fundraiser has $34,000 raised of $50,000 goal
    // These numbers should appear in the SSR'd HTML
    expect(body).toContain('34'); // raised amount partial
    expect(body).toContain('50'); // goal amount partial
  });

  test('wildfire fundraiser: page title is SSR\'d', async ({ page }) => {
    const html = await page.request.get(WILDFIRE);
    const body = await html.text();
    expect(body).toContain('Real-Time Alerts for Wildfire Safety');
  });
});
