/**
 * CB-80 (REPEAT, root-caused) — the viewer's OWN sun must be ringed + labelled "Your Sun".
 * Two facets, both regressions of the original no-op `handleSunCommit`:
 *   1. A persona who has ALREADY participated (Sarah K. follows + donated) sees her ringed
 *      sun on PAGE LOAD — no manual re-create required.
 *   2. An anonymous viewer who follows in-session gets an own-sun created live.
 * The unit layer only covers isOwn→label rendering; this guards the participation wiring.
 */
import { test, expect } from '@playwright/test';
import { setOverlayState } from './helpers';

const WILDFIRE = '/f/realtime-alerts-for-wildfire-safety-r5jkk';
const OWN = '[data-mark-id="__own_viewer"]';

test.describe('CB-80 — interactive own-sun highlight', () => {
  test('a participating persona (Sarah K.) sees her ringed "Your Sun" on load', async ({ page }) => {
    await setOverlayState(page, { on: false, persona: 'close_friend' });
    await page.goto(WILDFIRE);
    await page.waitForLoadState('networkidle');
    // Present WITHOUT any interaction — she already follows + donated to this fundraiser.
    await expect(page.locator(OWN)).toHaveCount(1);
    await expect(page.getByText('Your Sun', { exact: true }).first()).toBeVisible();
  });

  test('an anonymous viewer who follows gets an own-sun created live', async ({ page }) => {
    await setOverlayState(page, { on: false, persona: 'anonymous' });
    await page.goto(WILDFIRE);
    await page.waitForLoadState('networkidle');
    await expect(page.locator(OWN)).toHaveCount(0); // anon hasn't participated yet
    const follow = page.getByRole('button', { name: /^Follow$/ }).first();
    if (await follow.count()) {
      await follow.click();
      await expect(page.locator(OWN)).toHaveCount(1); // appears once they participate
    }
  });
});
