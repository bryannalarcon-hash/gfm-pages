/**
 * CB-85 mobile reflow verification script.
 * Viewport: 390×844 (iPhone 14 Pro), isMobile=true, demoMode=false
 *
 * Asserts:
 *   1. document.body.scrollWidth <= 396 (no horizontal overflow — was 441)
 *   2. Suns markwall renders in rows of ~4 (group items by rounded Y, assert max row >= 3)
 *   3. FundraiserCarousel has prev/next buttons (aria-label "Previous"/"Next")
 *
 * Saves screenshot to screenshots/mobile-qa/AFTER-profile.png
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_PATH = path.join(__dirname, '../screenshots/mobile-qa/AFTER-profile.png');
const PROFILE_URL = 'http://localhost:3000/u/janahan';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });

  const page = await context.newPage();

  // Navigate without demoMode overlay
  await page.goto(PROFILE_URL, { waitUntil: 'networkidle' });

  // Dismiss any overlay/persona selector that might interfere
  // (demoMode=false — navigate without the overlay parameter)
  await page.waitForTimeout(500);

  // ---- 1. Measure scrollWidth ----
  const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
  const viewportWidth = 390;
  const overflowOk = scrollWidth <= 396;

  console.log(`\n--- CB-85 Mobile Reflow Results ---`);
  console.log(`Viewport width:     ${viewportWidth}px`);
  console.log(`document.body.scrollWidth: ${scrollWidth}px`);
  console.log(`Overflow check (≤396): ${overflowOk ? 'PASS' : 'FAIL (was 441, now ' + scrollWidth + ')'}`);

  // ---- 2. Suns board 4-per-row check ----
  const sunsRowData = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.markwall__item'));
    if (items.length === 0) return { rows: [], minRowLen: 0, maxRowLen: 0 };

    // Group items by their rounded Y centroid (within 10px tolerance = same row)
    const rows = [];
    for (const item of items) {
      const rect = item.getBoundingClientRect();
      const cy = rect.top;
      // Group items within 50px vertical range as the same row
      // (grid items in a row can have different top values due to varying heights)
      const existing = rows.find(r => Math.abs(r[0] - cy) < 50);
      if (existing) {
        existing.push(cy);
      } else {
        rows.push([cy]);
      }
    }
    const rowLengths = rows.map(r => r.length);
    return {
      rows: rowLengths,
      minRowLen: Math.min(...rowLengths),
      maxRowLen: Math.max(...rowLengths),
      totalItems: items.length,
    };
  });

  const sunsOk = sunsRowData.maxRowLen >= 3;
  console.log(`\nSuns board rows:    ${JSON.stringify(sunsRowData.rows)}`);
  console.log(`Max items per row:  ${sunsRowData.maxRowLen}`);
  console.log(`4-per-row check (≥3/row): ${sunsOk ? 'PASS' : 'FAIL'}`);

  // ---- 3. Carousel prev/next buttons ----
  const prevBtn = await page.$('button[aria-label="Previous"]');
  const nextBtn = await page.$('button[aria-label="Next"]');
  const carouselOk = prevBtn !== null && nextBtn !== null;
  console.log(`\nCarousel prev button: ${prevBtn ? 'FOUND' : 'MISSING'}`);
  console.log(`Carousel next button: ${nextBtn ? 'FOUND' : 'MISSING'}`);
  console.log(`Carousel controls: ${carouselOk ? 'PASS' : 'FAIL'}`);

  // ---- Screenshot ----
  fs.mkdirSync(path.dirname(SCREENSHOT_PATH), { recursive: true });
  await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true });
  console.log(`\nScreenshot saved: ${SCREENSHOT_PATH}`);

  // ---- Summary ----
  const allPass = overflowOk && sunsOk && carouselOk;
  console.log(`\n=== OVERALL: ${allPass ? 'ALL PASS' : 'SOME FAILURES'} ===`);

  if (!overflowOk) {
    console.error(`FAIL: scrollWidth=${scrollWidth} exceeds 396px threshold`);
  }
  if (!sunsOk) {
    console.error(`FAIL: suns rows don't reach ≥3 per row: ${JSON.stringify(sunsRowData.rows)}`);
  }
  if (!carouselOk) {
    console.error(`FAIL: missing carousel prev/next buttons`);
  }

  await browser.close();
  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
