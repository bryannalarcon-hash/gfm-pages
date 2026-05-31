/**
 * CB-88 — the "ripple" share-reward panel must personalize per persona: a sharer sees a GREEN
 * active state with real counts (people brought + raised); a non-sharer sees the neutral
 * first-share prompt. Previously the panel was hardcoded grey for everyone.
 */
import { test, expect } from '@playwright/test';
import { setOverlayState } from './helpers';

const WILDFIRE = '/f/realtime-alerts-for-wildfire-safety-r5jkk';

test.describe('CB-88 — persona-aware share ripple', () => {
  test('a sharer (Sarah K.) sees the green active ripple with real counts', async ({ page }) => {
    await setOverlayState(page, { on: false, persona: 'close_friend' });
    await page.goto(WILDFIRE);
    await page.waitForLoadState('networkidle');
    const ripple = page.locator('.ripple');
    await expect(ripple).toHaveClass(/ripple--active/);
    await expect(ripple).toContainText('Your ripple is growing');
    await expect(ripple).toContainText(/brought\s+8\s+people/);
    await expect(ripple).toContainText('$215');
  });

  test('a non-sharer (anonymous) sees the neutral first-share prompt', async ({ page }) => {
    await setOverlayState(page, { on: false, persona: 'anonymous' });
    await page.goto(WILDFIRE);
    await page.waitForLoadState('networkidle');
    const ripple = page.locator('.ripple');
    await expect(ripple).not.toHaveClass(/ripple--active/);
    await expect(ripple).toContainText('Share once and watch your ripple grow');
  });
});
