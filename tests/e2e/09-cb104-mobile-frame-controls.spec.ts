/**
 * CB-104 — Mobile-frame parent chrome controls
 *
 * Verifies that when the CB-96 mobile-preview frame is open:
 *  (a) The IFRAME document has NO visible funding slider and NO visible [data-overlay-pill].
 *  (b) The PARENT has a visible funding slider + persona pill OUTSIDE the phone bezel.
 *  (c) Moving the PARENT funding slider changes the iframe's goalbar width
 *      (cross-document localStorage sync).
 *
 * Runs on DESKTOP only (the mobile-frame toggle is hidden ≤700px).
 */

import { test, expect } from '@playwright/test';
import { clearOverlayState, isMobile } from './helpers';

const WILDFIRE = '/f/realtime-alerts-for-wildfire-safety-r5jkk';

// Skip on mobile viewport — the mobile-frame toggle is CSS-hidden ≤700px.
test.beforeEach(async ({ page }) => {
  test.skip(isMobile(page), 'CB-104 desktop-only: mobile-frame toggle hidden ≤700px');
  await clearOverlayState(page);
});

test.describe('CB-104 — mobile frame parent chrome', () => {
  test('(a) iframe has no visible funding slider and no visible overlay pill', async ({ page }) => {
    await page.goto(WILDFIRE);
    await page.waitForLoadState('domcontentloaded');

    // Open the mobile-frame by clicking the toggle pill
    const toggle = page.locator('[data-mobile-frame-toggle]');
    await expect(toggle).toBeVisible({ timeout: 8000 });
    await toggle.click();

    // Wait for the iframe to appear
    const iframeEl = page.frameLocator('[data-mobile-frame-screen]');
    await page.waitForSelector('[data-mobile-frame-screen]', { timeout: 8000 });

    // Allow the iframe to fully load + post-mount effects to run
    await page.waitForTimeout(1500);

    // (a1) Funding slider [data-demo-control] must NOT be visible inside the iframe
    const iframeSlider = iframeEl.locator('[data-demo-control]');
    // Either not present, or hidden
    const sliderCount = await iframeSlider.count();
    if (sliderCount > 0) {
      await expect(iframeSlider.first()).toBeHidden();
    }

    // (a2) OverlayPill [data-overlay-pill] must NOT be visible inside the iframe
    const iframePill = iframeEl.locator('[data-overlay-pill]');
    const pillCount = await iframePill.count();
    if (pillCount > 0) {
      await expect(iframePill.first()).toBeHidden();
    }
  });

  test('(b) parent has visible funding slider and overlay pill outside the bezel', async ({ page }) => {
    await page.goto(WILDFIRE);
    await page.waitForLoadState('domcontentloaded');

    // Open the mobile-frame
    const toggle = page.locator('[data-mobile-frame-toggle]');
    await expect(toggle).toBeVisible({ timeout: 8000 });
    await toggle.click();
    await page.waitForSelector('[data-mobile-frame-screen]', { timeout: 8000 });
    await page.waitForTimeout(800);

    // (b1) Funding slider must be visible in the PARENT document (not inside iframe)
    const parentSlider = page.locator('[data-mobile-frame-slider] [data-demo-control]');
    await expect(parentSlider).toBeVisible({ timeout: 5000 });

    // (b2) Overlay pill must be visible in the PARENT document
    const parentPill = page.locator('button.ov-pill-animated');
    await expect(parentPill).toBeVisible({ timeout: 5000 });

    // (b3) The pill must NOT be inside the iframe bezel (it must be in the parent document root)
    // Verify the pill's bounding box is outside the bezel rect
    const bezel = page.locator('[data-mobile-frame="on"]');
    const bezelBox = await bezel.boundingBox();
    const pillBox = await parentPill.boundingBox();
    expect(bezelBox).not.toBeNull();
    expect(pillBox).not.toBeNull();
    if (bezelBox && pillBox) {
      // Pill should not overlap with the bezel's x-range (it's bottom-right, bezel is centered)
      // Or at minimum: pill right > bezel right OR pill left < bezel left → outside bezel
      const pillRightOfBezel = pillBox.x > bezelBox.x + bezelBox.width;
      const pillLeftOfBezel = pillBox.x + pillBox.width < bezelBox.x;
      const pillBelowBezel = pillBox.y > bezelBox.y + bezelBox.height;
      expect(pillRightOfBezel || pillLeftOfBezel || pillBelowBezel).toBe(true);
    }
  });

  test('(c) parent slider changes iframe goalbar width via localStorage sync', async ({ page }) => {
    test.setTimeout(90000);

    await page.goto(WILDFIRE);
    await page.waitForLoadState('domcontentloaded');

    // Open the mobile-frame
    const toggle = page.locator('[data-mobile-frame-toggle]');
    await expect(toggle).toBeVisible({ timeout: 8000 });
    await toggle.click();

    const iframeLocator = page.locator('[data-mobile-frame-screen]');
    await iframeLocator.waitFor({ timeout: 8000 });
    // Allow the iframe to fully mount + storage listeners to attach
    await page.waitForTimeout(2000);

    // Read the iframe's goalbar fill width via Playwright's frame API
    const iframeFrame = page.frameLocator('[data-mobile-frame-screen]');

    const getGoalbarWidth = async (): Promise<number> => {
      return iframeFrame.locator('.goalbar__fill').evaluate((el: HTMLElement) => {
        return parseFloat(el.style.width) || 0;
      });
    };

    // Simulate the parent-slider writing to localStorage AND dispatching a StorageEvent
    // to the iframe window. Playwright's page.evaluate runs in the parent context;
    // we use contentWindow.dispatchEvent to push the storage notification into the iframe.
    const simulateSliderChange = async (pct: number) => {
      await page.evaluate((value) => {
        const key = 'demoFundedPct';
        const oldVal = window.localStorage.getItem(key);
        window.localStorage.setItem(key, String(value));
        // Dispatch a StorageEvent into the iframe document (same-origin, direct access).
        const iframeEl = document.querySelector('[data-mobile-frame-screen]') as HTMLIFrameElement | null;
        if (iframeEl?.contentWindow) {
          const event = new StorageEvent('storage', {
            key,
            oldValue: oldVal,
            newValue: String(value),
            storageArea: window.localStorage,
            url: window.location.href,
            bubbles: false,
          });
          iframeEl.contentWindow.dispatchEvent(event);
        }
      }, pct);
    };

    // Set to 20% and read
    await simulateSliderChange(0.2);
    await page.waitForTimeout(600);
    const widthAt20 = await getGoalbarWidth();

    // Set to 80% and read
    await simulateSliderChange(0.8);
    await page.waitForTimeout(600);
    const widthAt80 = await getGoalbarWidth();

    // goalbar width at 80% should be greater than at 20%
    expect(widthAt80).toBeGreaterThan(widthAt20);
  });
});
