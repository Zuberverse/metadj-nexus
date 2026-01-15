import { test, expect } from '@playwright/test';
import { seedDefaultUiState, waitForMainContent } from './test-helpers';

test('search adds a track to the queue', async ({ page }) => {
  await seedDefaultUiState(page);
  await page.goto('/');
  await waitForMainContent(page);

  const searchToggle = page.locator('#tour-search-toggle:visible');

  if (await searchToggle.count()) {
    await searchToggle.first().click({ force: true });
    const searchInput = page.locator('#metadj-search-input:visible');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Majestic Ascent');
  } else {
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('metadj:openMusicPanel')));
    const searchInput = page.locator('#metadj-left-panel-search-input');
    await expect(searchInput).toBeVisible();
    await searchInput.click();
    await searchInput.fill('Majestic Ascent');
  }

  const addButton = page.getByRole('button', { name: /Add Majestic Ascent to queue/i }).first();
  await expect(addButton).toBeVisible();
  await addButton.click();

  const closeSearch = page.locator('button[aria-label="Close search"]:visible');
  if (await closeSearch.count()) {
    await closeSearch.first().click();
  }

  await page.waitForFunction(() => {
    const raw = window.localStorage.getItem('metadj_queue_state');
    if (!raw) return false;
    try {
      const state = JSON.parse(raw) as { queue?: Array<{ title?: string }> };
      return Array.isArray(state.queue)
        && state.queue.some((track) => track?.title === 'Majestic Ascent');
    } catch {
      return false;
    }
  });
});
