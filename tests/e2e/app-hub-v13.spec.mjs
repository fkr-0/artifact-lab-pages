import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { buildPublicationSite } from '../../scripts/build-publication-site.mjs';

const rootDir = fileURLToPath(new URL('../../', import.meta.url));
const outDir = fileURLToPath(new URL('../../dist/v13hub-e2e/', import.meta.url));

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  await rm(outDir, { recursive: true, force: true });
  await buildPublicationSite({ rootDir, outDir });
});

test.afterAll(async () => rm(outDir, { recursive: true, force: true }));

test('V13Hub discovery, preview, local collection permission, external guard, and mobile layout work', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto('/dist/v13hub-e2e/hub/v13/index.html');

  await expect(page.locator('#metric-total')).not.toHaveText('—');
  const total = Number(await page.locator('#metric-total').textContent());
  expect(total).toBeGreaterThan(5);
  await expect(page.locator('#catalog .artifact-card')).toHaveCount(total);
  await expect(page.locator('#peer-proof')).toContainText('No network proof');

  await page.locator('#search').fill('QR Studio');
  await expect(page.locator('#catalog .artifact-card')).toHaveCount(1);
  await expect(page.locator('#catalog h3')).toHaveText('QR Studio');
  await page.locator('#catalog [data-action="inspect"]').click();
  await expect(page.locator('#inspector')).toBeVisible();
  await expect(page.locator('#inspector-content')).toContainText('Health evidence');
  await page.locator('[data-action="close-inspector"]').click();

  await page.locator('#clear-filters').click();
  const firstCollect = page.locator('#catalog [data-action="toggle-collection"]').first();
  await expect(firstCollect).toBeDisabled();
  await page.locator('[data-action="enable-collection"]').click();
  await expect(firstCollect).toBeEnabled();
  await firstCollect.click();
  await expect(page.locator('#metric-collected')).toHaveText('1');
  await page.locator('#collected-only').check();
  await expect(page.locator('#catalog .artifact-card')).toHaveCount(1);

  await page.locator('#clear-filters').click();
  await page.locator('#search').fill('Ethic Brawl source');
  const externalCard = page.locator('#catalog .artifact-card').filter({ hasText: 'Ethic Brawl source' });
  await expect(externalCard).toHaveCount(1);
  await externalCard.locator('[data-action="inspect"]').click();
  await expect(page.locator('#inspector-content')).toContainText('External content is never fetched');
  await expect(page.locator('#inspector-content a[href^="https://github.com"]')).toHaveCount(0);
  await page.locator('[data-action="close-inspector"]').click();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#clear-filters').click();
  await expect(page.locator('#catalog .artifact-card').first()).toBeVisible();
  const layout = await page.evaluate(() => ({ innerWidth: window.innerWidth, scrollWidth: document.documentElement.scrollWidth, cardWidth: document.querySelector('.artifact-card')?.getBoundingClientRect().width || 0 }));
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.innerWidth + 1);
  expect(layout.cardWidth).toBeLessThan(layout.innerWidth);
  expect(pageErrors).toEqual([]);
});

test('failed ID clear keeps Disable & clear UI aligned with persisted browser state', async ({ page }) => {
  await page.addInitScript(({ idsKey }) => {
    const originalRemoveItem = Storage.prototype.removeItem;
    Storage.prototype.removeItem = function removeItem(key) {
      if (key === idsKey) throw new DOMException('deterministic IDS_KEY removal fault', 'QuotaExceededError');
      return originalRemoveItem.call(this, key);
    };
  }, { idsKey: 'v13hub.collection.ids.v1' });

  await page.goto('/dist/v13hub-e2e/hub/v13/index.html');
  await expect(page.locator('#metric-total')).not.toHaveText('—');
  await page.locator('[data-action="enable-collection"]').click();
  await page.locator('#catalog [data-action="toggle-collection"]').first().click();
  await expect(page.locator('#metric-collected')).toHaveText('1');

  await page.locator('[data-action="revoke-collection"]').click();
  await expect(page.locator('#collection-feedback')).toContainText(/Could not clear the stored collection IDs/i);
  await expect(page.locator('[data-action="revoke-collection"]')).toBeVisible();
  await expect(page.locator('[data-action="enable-collection"]')).toHaveCount(0);
  await expect(page.locator('#metric-collected')).toHaveText('1');

  const persisted = await page.evaluate(() => ({
    permission: localStorage.getItem('v13hub.collection.permission.v1'),
    ids: JSON.parse(localStorage.getItem('v13hub.collection.ids.v1') || '[]'),
  }));
  expect(persisted.permission).toBe('granted');
  expect(persisted.ids).toHaveLength(1);
});
