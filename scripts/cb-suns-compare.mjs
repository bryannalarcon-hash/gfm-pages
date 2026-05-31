// Compare live suns physics board vs the v4.2 reference PDF (1440-wide full page).
// Usage: node scripts/cb-suns-compare.mjs
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const OUT = 'screenshots/suns-compare';
mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:3000';

const browser = await chromium.launch();
const c = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await c.addInitScript(() => { try { localStorage.setItem('overlayOn', 'false'); } catch {} });
const page = await c.newPage();
await page.goto(`${BASE}/f/realtime-alerts-for-wildfire-safety-r5jkk`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

// measure rendered gutter suns: count + size distribution by vertical band
const stats = await page.evaluate(() => {
  const nodes = Array.from(document.querySelectorAll('[data-mark-id]'));
  const rects = nodes.map(n => n.getBoundingClientRect()).filter(r => r.width > 2 && r.height > 2);
  const docH = document.body.scrollHeight;
  const band = (r) => r.top + window.scrollY < docH / 3 ? 'top' : (r.top + window.scrollY < (2 * docH) / 3 ? 'mid' : 'bot');
  const byBand = { top: [], mid: [], bot: [] };
  for (const r of rects) byBand[band(r)].push(r.width);
  const summ = (a) => a.length ? { n: a.length, avgW: +(a.reduce((s, x) => s + x, 0) / a.length).toFixed(1), min: +Math.min(...a).toFixed(1), max: +Math.max(...a).toFixed(1) } : { n: 0 };
  return { total: rects.length, docH, top: summ(byBand.top), mid: summ(byBand.mid), bot: summ(byBand.bot) };
});
console.log('[suns] live stats:', JSON.stringify(stats, null, 2));

await page.screenshot({ path: `${OUT}/live-fundraiser-full.png`, fullPage: true });
console.log('[suns] saved live-fundraiser-full.png');
await browser.close();
