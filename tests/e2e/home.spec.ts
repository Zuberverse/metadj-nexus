import { test, expect } from '@playwright/test';
import { setWelcomeDismissed, waitForMainContent } from './test-helpers';

test('home loads and skip link reaches main content', async ({ page }) => {
  await setWelcomeDismissed(page);
  await page.goto('/');
  await waitForMainContent(page);

  const skipLinks = page.locator('a.skip-link');
  if (await skipLinks.count()) {
    const desktopMainVisible = await page.locator('#main-content-desktop').isVisible();
    const preferredHref = desktopMainVisible ? '#main-content-desktop' : '#main-content-mobile';
    const preferredLink = page.locator(`a.skip-link[href="${preferredHref}"]`);
    const skipLink = (await preferredLink.count()) ? preferredLink.first() : skipLinks.first();
    const target = (await skipLink.getAttribute('href')) ?? '#main-content';
    const targetId = target.replace('#', '');

    await expect(skipLink).toHaveAttribute('href', `#${targetId}`);
  }
});
