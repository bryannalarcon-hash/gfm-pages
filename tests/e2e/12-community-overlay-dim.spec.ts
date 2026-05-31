/**
 * Community overlay — the dim must actually shade non-highlighted content, and no highlight
 * ring may span the whole page.
 *
 * Bug: the community wrapped its AMBIENT full-page SunsLayer (position:absolute, z:-1) in an
 * <Instrumented regionLabel="suns-board"> overlay region. regionRect() resolved that to the
 * union of the layer's descendants = the entire 1440×9426 page, clamped to the viewport. That
 * produced (a) a green highlight ring spanning the full viewport — "the share-rate highlight
 * extends way past the box to the right" (its right edge hit the viewport edge, far past the
 * ~1208px content column) — and (b) a full-viewport mask cut-out, so the dim scrim had no area
 * left to paint → "the overlay does not shade non-highlighted objects." The fundraiser never
 * instrumented its ambient SunsLayer (its suns feature is highlighted via the bounded
 * sharer-board); community's S2 metric is likewise covered by the bounded marks-intro region.
 * Fix: drop the Instrumented wrapper from the ambient SunsLayer (CommunitySunsSection).
 */
import { test, expect } from '@playwright/test';

test.describe('community overlay — dim shades non-highlighted content; no full-page ring', () => {
  test('no highlight ring spans the page / extends past the content box', async ({ page }) => {
    test.skip(test.info().project.name === 'mobile', 'content-box overshoot is the desktop symptom');
    await page.addInitScript(() => {
      try { localStorage.setItem('demoMode', 'true'); localStorage.setItem('overlayOn', 'true'); } catch {}
    });
    await page.goto('/communities/watch-duty', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    await page.screenshot({ path: '/tmp/demo-toggle-shots/community-overlay-fixed.png', fullPage: false });

    const data = await page.evaluate(() => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const rings = Array.from(document.querySelectorAll('div[aria-label^="Show metric for"]')).map((d) => {
        const r = d.getBoundingClientRect();
        return {
          label: (d.getAttribute('aria-label') || '').replace('Show metric for ', ''),
          right: r.right, width: r.width, height: r.height,
          areaFrac: (r.width * r.height) / (vw * vh),
        };
      });
      return { vw, vh, rings };
    });

    expect(data.rings.length, 'overlay should build highlight regions').toBeGreaterThan(3);

    // The page content column is centred and ~1024px wide (right edge ≈ 1208 at vw=1440).
    // No ring may reach the viewport's right edge — that only happens for a full-bleed region.
    const CONTENT_RIGHT_MAX = 1240;
    const overshoot = data.rings.filter((r) => r.right > CONTENT_RIGHT_MAX);
    expect(overshoot, `rings overshooting the content box: ${JSON.stringify(overshoot)}`).toHaveLength(0);

    // No ring may cover ~the whole viewport — a full-viewport cut-out erases the dim entirely.
    const fullPage = data.rings.filter((r) => r.areaFrac > 0.7);
    expect(fullPage, `full-viewport rings (kill the dim): ${JSON.stringify(fullPage)}`).toHaveLength(0);
  });

  test('a non-highlighted area is visibly darkened by the dim (overlay ON vs OFF)', async ({ page }) => {
    test.skip(test.info().project.name === 'mobile', 'pixel-sampled desktop check');

    // A point in the hero image, top-right, that is NOT inside any highlight region.
    const SAMPLE = { x: 1300, y: 230, width: 8, height: 8 };
    async function avgLuminance(overlayOn: boolean): Promise<number> {
      await page.addInitScript((on) => {
        try { localStorage.setItem('demoMode', 'true'); localStorage.setItem('overlayOn', on ? 'true' : 'false'); } catch {}
      }, overlayOn);
      await page.goto('/communities/watch-duty', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1800);
      const buf = await page.screenshot({ clip: SAMPLE });
      // Decode the tiny PNG via the browser to avoid a node PNG dep.
      const lum = await page.evaluate(async (bytes) => {
        const blob = new Blob([new Uint8Array(bytes)], { type: 'image/png' });
        const bmp = await createImageBitmap(blob);
        const c = document.createElement('canvas');
        c.width = bmp.width; c.height = bmp.height;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(bmp, 0, 0);
        const { data } = ctx.getImageData(0, 0, c.width, c.height);
        let sum = 0, n = 0;
        for (let i = 0; i < data.length; i += 4) {
          sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
          n++;
        }
        return sum / n;
      }, Array.from(buf));
      return lum;
    }

    const off = await avgLuminance(false);
    const on = await avgLuminance(true);
    // The dim must measurably darken this non-highlighted point.
    expect(on, `non-highlighted area must be darker with overlay ON (off=${off.toFixed(1)}, on=${on.toFixed(1)})`).toBeLessThan(off - 8);
  });
});
