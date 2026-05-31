import { chromium } from '/home/bryann/gauntlet/gofundme-pages/node_modules/playwright/index.mjs';

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
});
const page = await context.newPage();
await page.addInitScript(() => localStorage.setItem('demoMode', 'false'));
await page.goto('http://localhost:3000/f/realtime-alerts-for-wildfire-safety-r5jkk', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);

const info = await page.evaluate(() => {
  const maincol = document.querySelector('.maincol');
  const updates = document.querySelector('#updates');
  const footer = document.querySelector('footer');
  return {
    maincolBottom: maincol ? maincol.getBoundingClientRect().bottom + window.scrollY : null,
    updatesBottom: updates ? updates.getBoundingClientRect().bottom + window.scrollY : null,
    footerTop: footer ? footer.getBoundingClientRect().top + window.scrollY : null,
    maincolPaddingBottom: maincol ? window.getComputedStyle(maincol).paddingBottom : null,
  };
});
console.log(JSON.stringify(info, null, 2));
const gap = Math.round(info.maincolBottom - info.updatesBottom);
console.log(`Gap after #updates to .maincol bottom: ${gap}px`);
console.log(`#updates bottom to footer top: ${Math.round(info.footerTop - info.updatesBottom)}px`);
await browser.close();
