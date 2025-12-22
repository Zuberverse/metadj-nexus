import { test, expect } from '@playwright/test';

test('home loads and skip link reaches main content', async ({ page }) => {
  await page.goto('/');

  const skipLink = page.getByRole('link', { name: /skip to main content/i });
  await skipLink.focus();
  await expect(skipLink).toBeFocused();
  await skipLink.press('Enter');

  await expect(page).toHaveURL(/#main-content$/);
  await expect(page.locator('#main-content')).toBeVisible();
  await expect(page.getByLabel('Hub content')).toBeVisible();
});
