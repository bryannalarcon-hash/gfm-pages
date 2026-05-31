/**
 * E2E test helpers — shared utilities for the GoFundMe redesign E2E suite.
 *
 * waitForTickerEvent: bounded poll for a named event in the dashboard ticker.
 * clearOverlayState: clear localStorage overlay keys in beforeEach to isolate tests.
 * setOverlayState: write overlay keys directly.
 * performMockDonate: drives the donation card through a full mock checkout.
 */

import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

// All 24 canonical EventName values from lib/types.ts
export const CANONICAL_EVENT_NAMES = new Set([
  'Page Viewed',
  'Story Scrolled',
  'Donate Intent',
  'Amount Selected',
  'Donate Started',
  'Donate Completed',
  'Donate Failed',
  'Share Clicked',
  'Follow Clicked',
  'Post Donate Viewed',
  'Post Donate Share Clicked',
  'Post Donate Recurring Upgrade Clicked',
  'Post Donate Follow Clicked',
  'Post Donate Dismissed',
  'Community Followed',
  'Update Read',
  'Fundraiser Clicked Through',
  'Section Viewed',
  'Mark Created',
  'Mark Customized',
  'Mark Grew',
  'Mark Shared',
  'Fundraiser Filter Applied',
  'Start Fundraiser Clicked',
]);

// The 6 persona slugs from lib/personas/types.ts
export const PERSONA_SLUGS = [
  'anonymous',
  'close_friend',
  'extrovert',
  'shared_by_extro',
  'returning_lapsed',
  'profile_owner',
] as const;

/**
 * Clear localStorage overlay/persona state. Call in beforeEach so tests are isolated.
 */
export async function clearOverlayState(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.removeItem('overlayOn');
    window.localStorage.removeItem('overlayPersona');
  });
}

/**
 * Set overlay/persona state in localStorage before navigation.
 */
export async function setOverlayState(
  page: Page,
  opts: { on?: boolean; persona?: string },
): Promise<void> {
  await page.addInitScript((o) => {
    if (o.on !== undefined) {
      window.localStorage.setItem('overlayOn', o.on ? 'true' : 'false');
    }
    if (o.persona !== undefined) {
      window.localStorage.setItem('overlayPersona', o.persona);
    }
  }, opts);
}

/**
 * Write overlay state directly (after page load).
 */
export async function writeOverlayState(
  page: Page,
  opts: { on?: boolean; persona?: string },
): Promise<void> {
  await page.evaluate((o) => {
    if (o.on !== undefined) {
      window.localStorage.setItem('overlayOn', o.on ? 'true' : 'false');
    }
    if (o.persona !== undefined) {
      window.localStorage.setItem('overlayPersona', o.persona);
    }
  }, opts);
}

/**
 * Wait for a named event to appear in the dashboard ticker log region.
 * Uses expect.poll with a bounded timeout (default 8s) — no sleeps.
 *
 * The ticker is the [role="log"] aria-live region with buttons whose aria-label
 * contains the event name.
 */
export async function waitForTickerEvent(
  page: Page,
  eventName: string,
  opts: { timeout?: number } = {},
): Promise<void> {
  const timeout = opts.timeout ?? 8000;

  await expect
    .poll(
      async () => {
        // Check the aria-label of each ticker row button for the event name
        const labels = await page.$$eval(
          '[role="log"] button',
          (buttons) => buttons.map((b) => b.getAttribute('aria-label') ?? ''),
        );
        return labels.some((l) => l.startsWith(eventName));
      },
      { timeout, intervals: [300, 500, 700, 1000] },
    )
    .toBe(true);
}

/**
 * Wait for the dashboard EventTicker SSE connection to be live.
 * The W5 ticker renders "Live" when connected, "Reconnecting…" otherwise.
 *
 * Firing events only AFTER the stream is live guarantees they arrive via the live
 * push path (not the limited ~20-event connect-replay), which keeps the assertion
 * deterministic under parallel workers sharing the in-memory SSE store.
 */
export async function waitForTickerConnected(
  page: Page,
  opts: { timeout?: number } = {},
): Promise<void> {
  const timeout = opts.timeout ?? 10000;
  // The status line text is "Live" when connected. Scope to the event-ticker widget.
  const ticker = page.locator('#event-ticker');
  await expect(ticker).toContainText('Live', { timeout });
}

/**
 * Navigate to /dashboard and wait for the live SSE ticker connection.
 * Use before firing events so they stream in live (deterministic, no replay-window race).
 */
export async function gotoDashboardLive(page: Page, dashboardPath = '/dashboard'): Promise<void> {
  await page.goto(dashboardPath);
  await page.waitForSelector('#event-ticker', { timeout: 8000 });
  await waitForTickerConnected(page);
}

/**
 * Count ticker rows for a specific event name (for suppression tests).
 */
export async function countTickerEvent(
  page: Page,
  eventName: string,
): Promise<number> {
  const labels = await page.$$eval(
    '[role="log"] button',
    (buttons) => buttons.map((b) => b.getAttribute('aria-label') ?? ''),
  );
  return labels.filter((l) => l.startsWith(eventName)).length;
}

/**
 * Returns true when running on the mobile (iPhone-13 / 390px) project.
 * Branches on project name first, falls back to viewport width.
 */
export function isMobile(page: Page): boolean {
  const projectName = test.info().project.name;
  if (projectName === 'mobile') return true;
  const vp = page.viewportSize();
  return !!vp && vp.width < 1024; // Tailwind lg breakpoint = 1024px
}

/**
 * Returns a Locator scoping to the ACTIVE donation form.
 *  - Mobile (<1024px): the bottom-sheet dialog [role="dialog"][aria-label="Donate"].
 *    NOTE: on mobile BOTH a hidden desktop right-rail card AND the sheet carry
 *    [data-overlay-region="donation-card"], so we must scope to the visible sheet.
 *  - Desktop (≥1024px): the right-rail card (the only visible donation-card).
 *
 * Caller must ensure the form is open first (openDonateForm).
 */
export function donateFormScope(page: Page) {
  // v4 renders ONE donate sheet on all widths: <aside class="rail" aria-label="Donation">
  // sliding up when body.sheet-open. The DonationCard's instrumented region inside it is the
  // scope for presets/submit. (Pre-v4 mobile used a separate [role=dialog][aria-label=Donate]
  // sheet that no longer exists — share-first redesign.)
  return page.locator('[data-overlay-region="donation-card"]');
}

/**
 * Ensure the DonationCard form (with smart-presets + submit) is on-screen and
 * interactable. Layout-aware:
 *  - CB-03: On ALL viewports the donate card is a fixed bottom-sheet (hidden until
 *    opened). The donatebar "Donate now" button (desktop) or the sticky CTA bar
 *    (mobile) opens it.
 *  - Desktop (≥1024px): click the donatebar "Donate now" button to open the sheet.
 *  - Mobile (<1024px): tap the sticky Donate bar to open the bottom-sheet.
 *
 * After this returns, the active donation form's submit button is in the viewport
 * and interactable.
 */
export async function openDonateForm(page: Page): Promise<void> {
  // v4 (share-first): the donate sheet is ONE persistent <aside class="rail"> on ALL widths,
  // opened by the .donatebar "Donate now" button (the pre-v4 mobile sticky CTA is hidden). On
  // mobile, the mobile-frame toggle pill used to cover this button (CB-94/CB-95 fix gated it to
  // wide viewports). Unified path for both projects: click the donatebar button → body.sheet-open.
  if (!(await page.evaluate(() => document.body.classList.contains('sheet-open')))) {
    const donatebarBtn = page.locator('.donatebar .btn--primary').first();
    await donatebarBtn.waitFor({ state: 'visible', timeout: 8000 });
    await donatebarBtn.click();
    await page.waitForFunction(
      () => document.body.classList.contains('sheet-open'),
      { timeout: 5000 },
    );
  }

  // Ensure the donation card's submit button is present and scrolled into view. On mobile the
  // v4 `.rail` sheet (max-height:92vh, overflow:auto) is taller than the viewport, so the submit
  // sits below the fold and must be scrolled into view WITHIN the rail (not just "in viewport").
  const submit = page.locator('[data-overlay-region="donation-card"] button[type="submit"]').first();
  await submit.waitFor({ state: 'visible', timeout: 6000 });
  await submit.scrollIntoViewIfNeeded().catch(() => {});
}

/**
 * Drive the DonationCard through a mock checkout. Layout-aware via openDonateForm.
 * - Opens the donate form (mobile bottom-sheet or desktop right-rail)
 * - Picks the given preset index (0-based; default=1)
 * - Submits the form (amount != 13 to avoid forced failure)
 * Returns after the form finishes processing.
 */
export async function performMockDonate(
  page: Page,
  opts: { presetIndex?: number } = {},
): Promise<void> {
  const presetIndex = opts.presetIndex ?? 1;

  await openDonateForm(page);
  const scope = donateFormScope(page);

  // Pick preset amount (the preset buttons inside the smart-presets region of the active form).
  const presetBtns = scope.locator('[data-overlay-region="smart-presets"] button');
  const count = await presetBtns.count();
  if (count > presetIndex) {
    await presetBtns.nth(presetIndex).click();
  }

  // Submit the form — the submit button is type=submit inside the active donation card.
  const submitBtn = scope.locator('button[type="submit"]');
  await submitBtn.waitFor({ state: 'visible', timeout: 3000 });
  await submitBtn.click();

  // Wait for completion via the post-donate "Thank you" screen, which renders on BOTH
  // layouts when onCompleted fires. We can't poll the submit button text because on
  // mobile the bottom-sheet UNMOUNTS on completion (setDonateOpen(false)), detaching it.
  // The post-donate dialog is the reliable cross-layout completion signal.
  const postDonate = page.locator('[role="dialog"][aria-label="Thank you for donating"]');
  await postDonate.waitFor({ state: 'visible', timeout: 6000 });
}
