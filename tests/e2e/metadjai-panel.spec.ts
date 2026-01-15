import { test, expect } from '@playwright/test';
import { seedDefaultUiState, waitForMainContent } from './test-helpers';

test('metadjai panel opens and closes from the header', async ({ page }) => {
  await seedDefaultUiState(page);
  await page.goto('/');
  await waitForMainContent(page);

  const mobileNav = page.locator('nav[aria-label="Main navigation"]:visible');
  const toggle = (await mobileNav.count())
    ? mobileNav.getByRole('button', { name: 'MetaDJai' })
    : page.locator('#tour-toggle-ai:visible');

  await toggle.first().click({ force: true });
  await expect.poll(async () => (
    (await toggle.first().getAttribute('aria-pressed'))
    ?? (await toggle.first().getAttribute('aria-current'))
    ?? ''
  )).toMatch(/true|page/);

  const closeToggle = page.locator('button[aria-label="Close MetaDJai"]:visible');
  if (await closeToggle.count()) {
    await closeToggle.first().click();
  } else {
    await toggle.first().click({ force: true });
  }
  await expect.poll(async () => (
    (await toggle.first().getAttribute('aria-pressed'))
    ?? (await toggle.first().getAttribute('aria-current'))
    ?? ''
  )).not.toMatch(/true|page/);
});
