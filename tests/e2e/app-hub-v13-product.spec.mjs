import { readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { buildPublicationSite } from '../../scripts/build-publication-site.mjs';

const rootDir = fileURLToPath(new URL('../../', import.meta.url));
const outDir = fileURLToPath(new URL('../../dist/v13hub-product-e2e/', import.meta.url));
let provenanceTarget;

test.beforeAll(async () => {
  await rm(outDir, { recursive: true, force: true });
  await buildPublicationSite({ rootDir, outDir });
  const catalog = JSON.parse(await readFile(`${outDir}/catalog/catalog.json`, 'utf8'));
  provenanceTarget = catalog.items.find((item) => item.git?.revision && item.receipt?.version);
  expect(provenanceTarget, 'publication catalog should expose at least one receipt-backed Git revision').toBeTruthy();
});

test.afterAll(async () => rm(outDir, { recursive: true, force: true }));

test('product discovery keeps loading explicit, searches provenance, and preserves card identity while filtering', async ({ page }) => {
  let releaseCatalog;
  const catalogGate = new Promise((resolve) => {
    releaseCatalog = resolve;
  });
  await page.route('**/catalog/catalog.json', async (route) => {
    await catalogGate;
    await route.continue();
  });

  await page.goto('/dist/v13hub-product-e2e/hub/v13/index.html', { waitUntil: 'commit' });
  await expect(page.locator('#catalog')).toContainText('Loading authoritative catalog');
  releaseCatalog();
  await expect(page.locator('#metric-total')).not.toHaveText('—');

  const targetCard = page.locator(`#catalog .artifact-card[data-artifact-id="${provenanceTarget.id}"]`);
  await expect(targetCard).toBeVisible();
  await page.evaluate((id) => {
    window.__v13ProductCard = document.querySelector(`#catalog [data-artifact-id="${CSS.escape(id)}"]`);
  }, provenanceTarget.id);

  await page.locator('#search').fill(provenanceTarget.git.revision);
  await expect(targetCard).toBeVisible();
  expect(await page.evaluate((id) => window.__v13ProductCard?.isSameNode(document.querySelector(`#catalog [data-artifact-id="${CSS.escape(id)}"]`)), provenanceTarget.id)).toBe(true);

  await targetCard.locator('[data-action="inspect"]').click();
  await expect(page.locator('#inspector')).toBeVisible();
  await expect(page.locator('#inspector-content')).toContainText('Health evidence');
  await expect(page.locator('#inspector-content')).toContainText('Provenance');
  await expect(page.locator('#inspector-content')).toContainText('Publication boundary');
  await expect(page.locator('#inspector-content')).toContainText(provenanceTarget.receipt.version);
  await page.locator('[data-action="close-inspector"]').click();

  await page.locator('#search').fill('');
  await expect(targetCard).toBeVisible();
  expect(await page.evaluate((id) => window.__v13ProductCard?.isSameNode(document.querySelector(`#catalog [data-artifact-id="${CSS.escape(id)}"]`)), provenanceTarget.id)).toBe(true);
});
