import { test, expect } from '@playwright/test';
import { seedDefaultUiState, waitForMainContent } from './test-helpers';

test('cinema view toggles from navigation', async ({ page }) => {
  await seedDefaultUiState(page);
  await page.goto('/');
  await waitForMainContent(page);

  const mobileNav = page.locator('nav[aria-label="Main navigation"]:visible');
  if (await mobileNav.count()) {
    await mobileNav.getByRole('button', { name: 'Cinema' }).click({ force: true });
  } else {
    const desktopToggle = page.locator('#tour-nav-cinema:visible');
    if (await desktopToggle.count()) {
      await desktopToggle.first().click({ force: true });
    } else {
      const viewDropdown = page.getByRole('button', { name: /Current view:/i });
      await viewDropdown.first().click({ force: true });
      await page.getByRole('option', { name: 'Cinema' }).click({ force: true });
    }
  }

  await expect(page.locator('[aria-labelledby="cinema-console-heading"]:visible')).toBeVisible();
});
