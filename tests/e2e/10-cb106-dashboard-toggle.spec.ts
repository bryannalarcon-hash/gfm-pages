/**
 * CB-106 — the dashboard demo-data toggle must be clickable after arriving via a deep link
 * (e.g. an overlay card's "See this on the dashboard →" → /dashboard#repeat-visits, which
 * scrolls the page). Regression: the dashboard's sticky page-header (top:0) collided with the
 * 56px sticky UnifiedNav (z:40) once the page had scrolled, so the nav's links covered the
 * toggle → tapping it did nothing ("button doesn't flip"). Fix: header sticks at top:56.
 */
import { test, expect } from '@playwright/test';

test.describe('CB-106 — dashboard demo-data toggle clickable from a #anchor deep link', () => {
  test('toggle is not covered by the nav after arriving at /dashboard#repeat-visits and flips on click', async ({ page }) => {
    test.skip(test.info().project.name === 'mobile', 'desktop nav-overlap regression');
    await page.addInitScript(() => { try { localStorage.setItem('demoMode', 'true'); } catch {} });
    await page.goto('/dashboard#repeat-visits', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollTo(0, 1200)); // mimic being deep in the page
    await page.waitForTimeout(400);

    const toggle = page.locator('[data-testid="demo-data-toggle"]');
    await expect(toggle).toBeVisible({ timeout: 8000 });

    // The toggle's OWN centre must be the topmost element there — not a nav link covering it.
    const hitsButton = await toggle.evaluate((btn) => {
      const r = btn.getBoundingClientRect();
      const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return el === btn || btn.contains(el);
    });
    expect(hitsButton, 'demo-data toggle centre must not be covered by the nav').toBe(true);

    const before = (await toggle.textContent())?.toLowerCase() ?? '';
    await toggle.click();
    await page.waitForTimeout(400);
    const after = (await toggle.textContent())?.toLowerCase() ?? '';
    expect(after).not.toBe(before); // flipped on/off
    expect(await toggle.getAttribute('aria-pressed')).toBe('true');
  });
});
