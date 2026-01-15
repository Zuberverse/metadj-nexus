import { test, expect } from '@playwright/test';
import { seedDefaultUiState, waitForMainContent } from './test-helpers';

test('cinema view toggles from navigation', async ({ page }) => {
  await seedDefaultUiState(page);
  await page.goto('/');
  await waitForMainContent(page);

  const mobileNav = page.locator('nav[aria-label="Main navigation"]:visible');
  const cinemaToggle = (await mobileNav.count())
    ? mobileNav.getByRole('button', { name: 'Cinema' })
    : page.locator('#tour-nav-cinema:visible');
  await cinemaToggle.first().click({ force: true });

  await expect(page.locator('[aria-labelledby="cinema-console-heading"]:visible')).toBeVisible();
});
