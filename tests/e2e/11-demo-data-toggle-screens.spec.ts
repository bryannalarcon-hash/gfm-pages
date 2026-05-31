/**
 * Demo-data toggle — live behaviour with temp screenshots.
 *
 * The user reports "the demo data button isn't working." This test reproduces the real path
 * (including arriving via the /dashboard#repeat-visits deep link a dashboard card uses) and
 * proves what actually happens by:
 *   1. screenshotting the header before the click,
 *   2. clicking the toggle with a TRUSTED click (page.mouse via .click(), not el.click()),
 *   3. screenshotting after,
 *   4. asserting BOTH that the button flips (label + aria-pressed) AND that the gated data
 *      actually changes (a stat card value goes from the blank '—' to a real number).
 *
 * Screenshots land in /tmp/demo-toggle-shots/ for eyeballing. Desktop only — the toggle is
 * a desktop dashboard control.
 */
import { test, expect } from '@playwright/test';

const SHOT_DIR = '/tmp/demo-toggle-shots';

test.describe('demo-data toggle — flips and gates data (with screenshots)', () => {
  for (const entry of ['/dashboard', '/dashboard#repeat-visits']) {
    const tag = entry.includes('#') ? 'deeplink' : 'plain';

    test(`toggle flips + gates data arriving via ${entry}`, async ({ page }) => {
      test.skip(test.info().project.name === 'mobile', 'desktop dashboard control');
      // Demo mode is baked in via NEXT_PUBLIC_DEMO_MODE (webServer env + .env); no localStorage needed.
      await page.goto(entry, { waitUntil: 'domcontentloaded' });
      // Let the #anchor scroll settle (the deep-link path scrolls the page).
      await page.waitForTimeout(1600);

      const toggle = page.locator('[data-testid="demo-data-toggle"]');
      await expect(toggle, 'demo-data toggle must render (NEXT_PUBLIC_DEMO_MODE=true)').toBeVisible({ timeout: 8000 });

      // Start from a known state: ensure it's OFF so the click turns it ON (data: '—' → numbers).
      if ((await toggle.getAttribute('aria-pressed')) === 'true') {
        await toggle.click();
        await page.waitForTimeout(300);
      }
      expect(await toggle.getAttribute('aria-pressed')).toBe('false');

      // The "Repeat Visits (Day 7)" stat card (id="repeat-visits") is blank ('—') when demo
      // data is OFF and shows a real % when ON. Target the card div precisely (the string
      // "Repeat Visits" also appears in the metric tree, so a text= locator is ambiguous).
      const repeatCard = page.locator('#repeat-visits');
      const beforeBtn = (await toggle.textContent())?.toLowerCase().trim() ?? '';

      await page.screenshot({ path: `${SHOT_DIR}/${tag}-1-before.png`, fullPage: false });

      // The toggle's own centre must be the topmost element (not covered by the sticky nav).
      const hitsButton = await toggle.evaluate((btn) => {
        const r = btn.getBoundingClientRect();
        const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return el === btn || btn.contains(el as Node);
      });
      expect(hitsButton, 'toggle centre must not be covered by the sticky nav').toBe(true);

      // TRUSTED click.
      await toggle.click();
      await page.waitForTimeout(500);

      await page.screenshot({ path: `${SHOT_DIR}/${tag}-2-after.png`, fullPage: false });

      // 1. Button flipped.
      const afterBtn = (await toggle.textContent())?.toLowerCase().trim() ?? '';
      expect(afterBtn, 'button label must change on click').not.toBe(beforeBtn);
      expect(afterBtn).toContain('on');
      expect(await toggle.getAttribute('aria-pressed')).toBe('true');

      // 2. Gated DATA actually changed — the stat card is no longer blank.
      const repeatText = (await repeatCard.textContent()) ?? '';
      expect(repeatText, 'stat card must show a real value once demo data is ON').toMatch(/\d/);
      expect(repeatText).not.toContain('—');

      // Toggle back OFF and confirm it blanks again (full round-trip).
      await toggle.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${SHOT_DIR}/${tag}-3-off-again.png`, fullPage: false });
      expect(await toggle.getAttribute('aria-pressed')).toBe('false');
      const repeatOff = (await repeatCard.textContent()) ?? '';
      expect(repeatOff, 'stat card must blank again when demo data OFF').toContain('—');
    });
  }

  // Regression: the metric overlay is suppressed on /dashboard, but its document capture-phase
  // click handler used to install anyway (the render `return null` runs after hooks). With
  // overlayOn persisted true, that invisible handler swallowed EVERY click on the dashboard —
  // the demo-data toggle "didn't change at all," and there was no visible dim to explain it.
  // The user's exact symptom; a clean context never had overlayOn set, so it hid for a while.
  test('toggle still flips when the metric overlay was left ON (overlayOn persisted)', async ({ page }) => {
    test.skip(test.info().project.name === 'mobile', 'desktop dashboard control');
    // Persist the overlay as ON, as the user's browser had it after touring a product page.
    await page.addInitScript(() => { try { localStorage.setItem('overlayOn', 'true'); } catch {} });
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const toggle = page.locator('[data-testid="demo-data-toggle"]');
    await expect(toggle).toBeVisible({ timeout: 8000 });

    // No visible overlay dim should be present on the dashboard regardless of overlayOn.
    await page.screenshot({ path: `${SHOT_DIR}/overlay-on-1-before.png`, fullPage: false });

    const before = await toggle.getAttribute('aria-pressed');
    await toggle.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SHOT_DIR}/overlay-on-2-after.png`, fullPage: false });
    const after = await toggle.getAttribute('aria-pressed');

    expect(after, 'toggle must flip even with overlayOn persisted (overlay must not eat the click on /dashboard)').not.toBe(before);
  });
});
