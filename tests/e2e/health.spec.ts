import { test, expect } from '@playwright/test';

test('health endpoint returns status payload', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.ok()).toBeTruthy();

  const body = await response.json();
  expect(body).toMatchObject({
    status: expect.any(String),
    timestamp: expect.any(String),
    version: expect.any(String),
  });
});
