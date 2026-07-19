import { expect, test } from '@playwright/test';

test('Telegram Bot API Workbench loads and exposes its main workflows', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/telegram-bot-api-workbench/');

  await expect(page).toHaveTitle('Telegram Bot API Workbench');
  await expect(page.getByRole('heading', { name: 'Telegram Bot API Workbench' })).toBeVisible();
  await expect(page.getByText('Use a dedicated development bot.')).toBeVisible();
  await expect(page.locator('#metric-mode')).toHaveText('—');

  await page.getByRole('button', { name: 'Messages' }).click();
  await expect(page.getByRole('heading', { name: 'sendMessage' })).toBeVisible();
  await page.locator('#send-text').fill('Browser smoke test');
  await expect(page.locator('#send-count')).toHaveText('18');

  await page.getByRole('button', { name: 'API lab' }).click();
  await page.getByRole('button', { name: 'Load example' }).click();
  await expect(page.locator('#lab-method')).toHaveValue('sendLocation');
  await expect(page.locator('#lab-params')).toHaveValue(/50\.7753/);

  await page.getByRole('button', { name: 'Status' }).click();
  await page.locator('#token').fill('not-a-token');
  await page.getByRole('button', { name: 'Test' }).click();
  await expect(page.locator('#out-me')).toContainText('token format');
  await expect(page.locator('#status-label')).toHaveText('Invalid or unreachable');

  expect(pageErrors).toEqual([]);
});

test('non-secret profile list excludes token and webhook secret', async ({ page }) => {
  await page.goto('/telegram-bot-api-workbench/#lab');
  const selectors = await page.evaluate(() => profileSelectors);
  expect(selectors).not.toContain('#token');
  expect(selectors).not.toContain('#hook-secret');
  expect(selectors).toContain('#send-chat');
  expect(selectors).toContain('#lab-params');
});
