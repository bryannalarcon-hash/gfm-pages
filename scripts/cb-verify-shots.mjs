// CB-16..23 visual verification screenshots (run against the live dev server on :3000).
// Usage: node scripts/cb-verify-shots.mjs
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const OUT = 'screenshots/cb16-23';
mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:3000';

const browser = await chromium.launch();
const log = (...a) => console.log('[shots]', ...a);

async function ctx(overlayOn, persona = 'anonymous') {
  const c = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await c.addInitScript(([on, p]) => {
    try {
      localStorage.setItem('overlayOn', on ? 'true' : 'false');
      localStorage.setItem('overlayPersona', p);
    } catch {}
  }, [overlayOn, persona]);
  return c;
}

async function shot(page, name, full = false) {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  log('saved', name);
}

// ── 1. Dashboard: CB-18 (no pill/scrim), CB-19 (no GFM bar), CB-22 (refresh dropdown) ──
{
  const c = await ctx(true, 'extrovert'); // overlay ON to prove it is suppressed on /dashboard
  const page = await c.newPage();
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  const hasPill = await page.locator('[data-overlay-pill]').count();
  const hasGnav = await page.locator('[aria-label="GoFundMe — home"]').count();
  const refreshVal = await page.locator('[data-testid="refresh-interval"]').inputValue().catch(() => 'MISSING');
  log(`DASHBOARD: overlay-pill=${hasPill} (expect 0), gfm-nav=${hasGnav} (expect 0), refresh-default=${refreshVal} (expect 30)`);
  await shot(page, '01-dashboard-top');
  await c.close();
}

// ── probe demo mode on a product page ──
let demoOn = false;
{
  const c = await ctx(true, 'anonymous');
  const page = await c.newPage();
  await page.goto(`${BASE}/f/realtime-alerts-for-wildfire-safety-r5jkk`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  demoOn = (await page.locator('[data-overlay-pill]').count()) > 0;
  log(`DEMO MODE on product page: pill present = ${demoOn}`);
  await c.close();
}

// ── 2. CB-17: overlay cut-out on fundraiser + community (only meaningful if demoOn) ──
for (const [slug, label] of [
  ['/f/realtime-alerts-for-wildfire-safety-r5jkk', '02-fundraiser-overlay'],
  ['/communities/watch-duty', '03-community-overlay'],
]) {
  const c = await ctx(true, 'anonymous');
  const page = await c.newPage();
  await page.goto(`${BASE}${slug}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  // confirm scrim SVG + cut-out mask exist
  const scrim = await page.locator('svg mask#ov-dim-cutout').count();
  const holes = await page.locator('mask#ov-dim-cutout rect[fill="black"]').count();
  log(`${label}: scrim-mask=${scrim}, cut-out-holes=${holes}`);
  await shot(page, label);
  await c.close();
}

// ── 3. CB-16: profile owner share copy vs supporter ──
for (const [persona, label] of [['profile_owner', '04-profile-owner-share'], ['close_friend', '05-profile-supporter-share']]) {
  const c = await ctx(false, persona);
  const page = await c.newPage();
  await page.goto(`${BASE}/u/janahan`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  const spread = page.locator('.spread');
  await spread.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(300);
  const wa = await page.locator('.bubble--wa').first().innerText().catch(() => 'N/A');
  log(`${label}: whatsapp copy = ${JSON.stringify(wa.slice(0, 60))}`);
  await shot(page, label);
  await c.close();
}

// ── 4. CB-20: replay player frame change ──
{
  const c = await ctx(false, 'anonymous');
  const page = await c.newPage();
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  // open the single replay
  const firstRow = page.locator('#replays button').first();
  await firstRow.click().catch(() => {});
  await page.waitForTimeout(500);
  const frame0 = await page.locator('[data-testid="replay-frame"]').getAttribute('data-frame').catch(() => 'N/A');
  await page.locator('#replays [aria-label="Session replay player"]').scrollIntoViewIfNeeded().catch(() => {});
  await shot(page, '06-replay-sec0');
  // advance: click near the end of the scrubber
  const scrubber = page.locator('[role="slider"]').first();
  const box = await scrubber.boundingBox().catch(() => null);
  if (box) {
    await page.mouse.click(box.x + box.width * 0.95, box.y + box.height / 2);
    await page.waitForTimeout(400);
  }
  const frameEnd = await page.locator('[data-testid="replay-frame"]').getAttribute('data-frame').catch(() => 'N/A');
  log(`REPLAY: frame@0=${frame0}, frame@end=${frameEnd} (expect different)`);
  await shot(page, '07-replay-secEnd');
  await c.close();
}

await browser.close();
log('done →', OUT);
