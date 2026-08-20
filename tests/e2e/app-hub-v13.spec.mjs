import { expect, test } from '@playwright/test';

test('V13 root launch, filters, runtime stats, and mobile cards work from the source tree', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/');
  await expect(page).toHaveURL(/\/apps\/app-hub-v13\/index\.html$/);
  await expect(page.locator('#portfolio-version')).toHaveText('v1.7.0');
  await expect(page.locator('#artifact-count')).toHaveText('55');
  await expect(page.locator('#catalog .artifact-card')).toHaveCount(55);
  await expect(page.locator('#load-ms')).toContainText('ms');

  await page.locator('#search').fill('QR Studio');
  await expect(page.locator('#catalog .artifact-card')).toHaveCount(1);
  await expect(page.locator('#catalog h2')).toHaveText('QR Studio');
  await expect(page.locator('#visible-count')).toHaveText('1');

  await page.locator('#clear-filters').click();
  await page.locator('#availability-filter').selectOption('provisional');
  const provisionalCards = page.locator('#catalog .artifact-card');
  await expect(provisionalCards.first().locator('.availability')).toHaveText('provisional');
  const provisionalCount = await provisionalCards.count();
  expect(provisionalCount).toBeGreaterThan(0);
  await expect(page.locator('#visible-count')).toHaveText(String(provisionalCount));

  await page.locator('#clear-filters').click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#catalog .artifact-card').first()).toBeVisible();
  const layout = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    cardWidth: document.querySelector('.artifact-card')?.getBoundingClientRect().width || 0,
    footerWidth: document.querySelector('.site-footer')?.getBoundingClientRect().width || 0,
  }));
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.innerWidth + 1);
  expect(layout.cardWidth).toBeLessThan(layout.innerWidth);
  expect(layout.footerWidth).toBeLessThanOrEqual(layout.innerWidth);
  expect(pageErrors).toEqual([]);
});
