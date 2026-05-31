/**
 * BEFORE measurement script — captures baseline metrics for CB-70, CB-72, CB-73, CB-75.
 * Run BEFORE applying fixes.
 */
import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const URL = 'http://localhost:3000/f/realtime-alerts-for-wildfire-safety-r5jkk';
const VIEWPORT = { width: 390, height: 844 };

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    isMobile: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  });

  const page = await context.newPage();

  // Set demoMode=false as specified
  await page.addInitScript(() => {
    localStorage.setItem('demoMode', 'false');
  });

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // CB-70: horizontal overflow check
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  console.log(`\n=== CB-70/72/73/75 BEFORE Measurements ===`);
  console.log(`scrollWidth: ${scrollWidth}, clientWidth: ${clientWidth}, overflow: ${scrollWidth - clientWidth}px`);

  // CB-70: returning banner and donatebar positions
  const bannerRect = await page.evaluate(() => {
    const el = document.querySelector('[data-slot="returning_banner"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { height: r.height, top: r.top, bottom: r.bottom };
  });
  const donatebar = await page.evaluate(() => {
    const el = document.querySelector('.donatebar');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return { height: r.height, top: r.top, bottom: r.bottom, position: cs.position };
  });
  console.log(`\nCB-70:`);
  console.log(`  returning_banner: ${JSON.stringify(bannerRect)}`);
  console.log(`  donatebar: ${JSON.stringify(donatebar)}`);

  // CB-72: page content bottom edge vs document height
  const pageBottom = await page.evaluate(() => {
    const bodyHeight = document.body.scrollHeight;
    // Find footer bottom
    const footer = document.querySelector('footer');
    const footerBottom = footer ? footer.getBoundingClientRect().bottom + window.scrollY : null;
    // Find last visible child of maincol
    const maincol = document.querySelector('.maincol');
    const maincolChildren = maincol ? Array.from(maincol.children) : [];
    const lastChild = maincolChildren[maincolChildren.length - 1];
    const lastChildBottom = lastChild ? lastChild.getBoundingClientRect().bottom + window.scrollY : null;
    return { bodyHeight, footerBottom, lastChildBottom };
  });
  console.log(`\nCB-72: trailing whitespace`);
  console.log(`  ${JSON.stringify(pageBottom)}`);

  // CB-73: marks-intro button center vs pane center
  const marksBtnMeasure = await page.evaluate(() => {
    const btn = document.querySelector('.marks-intro__btn');
    const pane = document.querySelector('.marks-intro');
    if (!btn || !pane) return null;
    const btnR = btn.getBoundingClientRect();
    const paneR = pane.getBoundingClientRect();
    const btnCenterX = btnR.left + btnR.width / 2;
    const paneCenterX = paneR.left + paneR.width / 2;
    return {
      btnLeft: Math.round(btnR.left),
      btnRight: Math.round(btnR.right),
      btnCenterX: Math.round(btnCenterX),
      paneCenterX: Math.round(paneCenterX),
      offset: Math.round(btnCenterX - paneCenterX),
      btnWidth: Math.round(btnR.width),
      paneWidth: Math.round(paneR.width),
      whiteSpace: getComputedStyle(btn).whiteSpace,
      textAlign: getComputedStyle(btn).textAlign,
    };
  });
  console.log(`\nCB-73: marks-intro button centering`);
  console.log(`  ${JSON.stringify(marksBtnMeasure)}`);

  // CB-75: per-update share buttons overflow/clipping
  const shareRowMeasure = await page.evaluate(() => {
    const shareRow = document.querySelector('#updates .flex.gap-\\[var\\(--hrt-size-spacing-1\\)\\]');
    // fallback: find share row in updates section
    const updatesSection = document.getElementById('updates');
    if (!updatesSection) return { error: 'no updates section' };
    const rows = updatesSection.querySelectorAll('[role="list"]');
    if (!rows.length) return { error: 'no share rows' };
    const row = rows[0];
    const rowR = row.getBoundingClientRect();
    const buttons = row.querySelectorAll('button');
    const btnData = Array.from(buttons).map((btn, i) => {
      const r = btn.getBoundingClientRect();
      return { i, left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), visible: r.right <= window.innerWidth + 2 };
    });
    return {
      rowLeft: Math.round(rowR.left),
      rowRight: Math.round(rowR.right),
      rowWidth: Math.round(rowR.width),
      scrollWidth: row.scrollWidth,
      viewportWidth: window.innerWidth,
      buttons: btnData,
    };
  });
  console.log(`\nCB-75: per-update share buttons`);
  console.log(`  ${JSON.stringify(shareRowMeasure)}`);

  // Take screenshot
  await page.screenshot({ path: path.join(__dirname, '../screenshots/mobile-qa/BEFORE-fundraiser.png'), fullPage: true });
  console.log(`\nScreenshot saved: screenshots/mobile-qa/BEFORE-fundraiser.png`);

  await browser.close();
}

run().catch(console.error);
