/**
 * CB-71 verification script — carousel prev/next controls at 390px mobile.
 *
 * Loads /communities/watch-duty at 390×844 (iPhone-like), asserts:
 *   1. The prev button (aria-label="Previous") is present.
 *   2. The next button (aria-label="Next") is present.
 *   3. Dot indicators exist.
 *   4. Clicking Next changes the active dot (visible card index advances).
 *
 * Saves screenshot to screenshots/mobile-qa/AFTER-community.png.
 */

const { chromium } = require('@playwright/test');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();

  const BASE = process.env.BASE_URL || 'http://localhost:3000';
  await page.goto(`${BASE}/communities/watch-duty`, { waitUntil: 'domcontentloaded' });

  // Wait briefly for hydration
  await page.waitForTimeout(600);

  // ── 1. Prev button ──────────────────────────────────────────────────────────
  const prevBtn = page.getByRole('button', { name: 'Previous' });
  const prevCount = await prevBtn.count();
  if (prevCount === 0) {
    console.error('FAIL: Previous button not found');
    await browser.close();
    process.exit(1);
  }
  console.log('PASS: Previous button present');

  // ── 2. Next button ──────────────────────────────────────────────────────────
  const nextBtn = page.getByRole('button', { name: 'Next' });
  const nextCount = await nextBtn.count();
  if (nextCount === 0) {
    console.error('FAIL: Next button not found');
    await browser.close();
    process.exit(1);
  }
  console.log('PASS: Next button present');

  // ── 3. Dot indicators ───────────────────────────────────────────────────────
  const dots = page.locator('[data-carousel-dot]');
  const dotCount = await dots.count();
  if (dotCount === 0) {
    console.error('FAIL: No dot indicators found');
    await browser.close();
    process.exit(1);
  }
  console.log(`PASS: ${dotCount} dot indicator(s) present`);

  // ── 4. Clicking Next advances active dot ───────────────────────────────────
  // Read the initial active dot (aria-current="true")
  const initialActiveDot = await page.evaluate(() => {
    const dots = document.querySelectorAll('[data-carousel-dot]');
    for (let i = 0; i < dots.length; i++) {
      if (dots[i].getAttribute('aria-current') === 'true') return i;
    }
    return -1;
  });
  console.log(`INFO: Initial active dot index = ${initialActiveDot}`);

  await nextBtn.first().click();
  await page.waitForTimeout(200);

  const afterActiveDot = await page.evaluate(() => {
    const dots = document.querySelectorAll('[data-carousel-dot]');
    for (let i = 0; i < dots.length; i++) {
      if (dots[i].getAttribute('aria-current') === 'true') return i;
    }
    return -1;
  });
  console.log(`INFO: Active dot after clicking Next = ${afterActiveDot}`);

  if (afterActiveDot === initialActiveDot) {
    console.error('FAIL: Clicking Next did not change the active dot index');
    await browser.close();
    process.exit(1);
  }
  console.log('PASS: Clicking Next changed the active dot');

  // ── Screenshot ──────────────────────────────────────────────────────────────
  const screenshotPath = path.resolve(
    __dirname,
    '../screenshots/mobile-qa/AFTER-community.png',
  );
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`SCREENSHOT: ${screenshotPath}`);

  console.log('\nAll CB-71 carousel assertions PASSED.');
  await browser.close();
  process.exit(0);
})().catch((err) => {
  console.error('Verification script error:', err);
  process.exit(1);
});
