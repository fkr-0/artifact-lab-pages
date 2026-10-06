import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { buildPublicationSite } from '../../scripts/build-publication-site.mjs';

const rootDir = fileURLToPath(new URL('../../', import.meta.url));
const outDir = fileURLToPath(new URL('../../dist/v13hub-a11y-e2e/', import.meta.url));
const hubPath = '/dist/v13hub-a11y-e2e/hub/v13/index.html';

test.describe.configure({ mode: 'serial' });

async function tabTo(page, selector, { backwards = false, limit = 30 } = {}) {
  const locator = page.locator(selector).first();
  for (let step = 0; step < limit; step += 1) {
    if (await locator.evaluate((element) => element === document.activeElement)) return locator;
    await page.keyboard.press(backwards ? 'Shift+Tab' : 'Tab');
  }
  throw new Error(`keyboard focus did not reach ${selector} within ${limit} tabs`);
}

test.beforeAll(async () => {
  await rm(outDir, { recursive: true, force: true });
  await buildPublicationSite({ rootDir, outDir });
});

test.afterAll(async () => rm(outDir, { recursive: true, force: true }));

test('keyboard-only discovery, filtering, preview, dialog escape, and focus return work', async ({ page }) => {
  await page.goto(hubPath);
  await expect(page.locator('#metric-total')).not.toHaveText('—');

  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#catalog')).toBeFocused();

  await page.reload();
  const search = await tabTo(page, '#search');
  await expect(search).toBeFocused();
  await page.keyboard.type('QR Studio');
  await expect(page.locator('#catalog .artifact-card')).toHaveCount(1);
  await expect(page.locator('#result-summary')).toHaveText(/1 shown/);

  const preview = await tabTo(page, '#catalog [data-action="inspect"]');
  const focusStyle = await preview.evaluate((element) => {
    const style = getComputedStyle(element);
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
  });
  expect(focusStyle.outlineStyle).not.toBe('none');
  expect(Number.parseFloat(focusStyle.outlineWidth)).toBeGreaterThanOrEqual(2);

  await page.keyboard.press('Enter');
  await expect(page.locator('#inspector')).toBeVisible();
  await expect(page.locator('[data-action="close-inspector"]')).toBeFocused();
  await expect(page.locator('#inspector')).toHaveAttribute('aria-labelledby', 'inspector-title');

  await page.keyboard.press('Escape');
  await expect(page.locator('#inspector')).not.toBeVisible();
  await expect(preview).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(page.locator('#inspector')).toBeVisible();
  await page.mouse.click(2, 2);
  await expect(page.locator('#inspector')).not.toBeVisible();
  await expect(preview).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(page.locator('#inspector')).toBeVisible();
  await page.locator('[data-action="close-inspector"]').click();
  await expect(page.locator('#inspector')).not.toBeVisible();
  await expect(preview).toBeFocused();
});

test('collection controls expose disabled and pressed state and remain keyboard operable', async ({ page }) => {
  await page.goto(hubPath);
  await expect(page.locator('#metric-total')).not.toHaveText('—');

  const firstCollect = page.locator('#catalog [data-action="toggle-collection"]').first();
  await expect(firstCollect).toBeDisabled();
  await expect(firstCollect).toHaveAttribute('aria-pressed', 'false');

  const enable = await tabTo(page, '[data-action="enable-collection"]');
  await expect(enable).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#collection-summary')).toContainText('stored as IDs in this browser');

  const search = await tabTo(page, '#search');
  await page.keyboard.type('QR Studio');
  await expect(page.locator('#catalog .artifact-card')).toHaveCount(1);
  const collect = await tabTo(page, '#catalog [data-action="toggle-collection"]');
  await expect(collect).toBeEnabled();
  await expect(collect).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.press('Enter');
  await expect(collect).toBeFocused();
  await expect(collect).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#metric-collected')).toHaveText('1');
  await expect(page.locator('#collection-summary')).toContainText('1 artifact stored as IDs');

  await page.locator('#catalog [data-action="inspect"]').click();
  const inspectorCollect = page.locator('#inspector [data-action="toggle-collection"]');
  await expect(inspectorCollect).toBeEnabled();
  await expect(inspectorCollect).toHaveAttribute('aria-pressed', 'true');
  await expect(inspectorCollect).toHaveText('Remove from collection');
});

test('320px / 400%-equivalent reflow, 390/768/desktop layout, touch targets, and reduced motion remain qualified', async ({ page }) => {
  await page.goto(hubPath);
  await expect(page.locator('#metric-total')).not.toHaveText('—');

  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const layout = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      catalogWidth: document.querySelector('#catalog')?.getBoundingClientRect().width ?? 0,
    }));
    expect(layout.scrollWidth, `${width}px viewport must not require horizontal page scrolling`).toBeLessThanOrEqual(layout.innerWidth + 1);
    expect(layout.catalogWidth).toBeLessThanOrEqual(layout.innerWidth);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  const undersized = await page.locator('button, input[type="search"], select').evaluateAll((elements) => elements
    .filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    })
    .map((element) => {
      const rect = element.getBoundingClientRect();
      return { text: element.textContent?.trim() || element.getAttribute('aria-label') || element.id, width: rect.width, height: rect.height };
    })
    .filter(({ height }) => height < 44));
  expect(undersized).toEqual([]);
  const toggleTargetHeight = await page.locator('.toggle-field').evaluate((element) => element.getBoundingClientRect().height);
  expect(toggleTargetHeight).toBeGreaterThanOrEqual(44);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const motion = await page.locator('.artifact-card').first().evaluate((element) => ({
    scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    transitionDuration: getComputedStyle(element).transitionDuration,
    transform: getComputedStyle(element).transform,
  }));
  expect(motion.scrollBehavior).toBe('auto');
  expect(Number.parseFloat(motion.transitionDuration)).toBeLessThanOrEqual(0.001);
  expect(motion.transform).toBe('none');
});

test('status and error announcements are present at runtime and evidence is not color-only', async ({ page }) => {
  await page.goto(hubPath);
  await expect(page.locator('#metric-total')).not.toHaveText('—');
  await expect(page.locator('#result-summary')).toHaveAttribute('role', 'status');
  await expect(page.locator('#collection-summary')).toHaveAttribute('role', 'status');
  const health = await page.locator('.health-chip').evaluateAll((chips) => chips.map((chip) => ({ level: chip.dataset.level, text: chip.textContent?.trim() })));
  expect(health.length).toBeGreaterThan(0);
  expect(health.every(({ level, text }) => Boolean(level) && Boolean(text))).toBe(true);

  const broken = await page.context().newPage();
  await broken.route('**/*.json', (route) => route.abort());
  await broken.goto(hubPath);
  await expect(broken.locator('#catalog-error')).toBeVisible();
  await expect(broken.locator('#catalog-error')).toHaveAttribute('role', 'alert');
  await expect(broken.locator('#catalog-error-message')).not.toBeEmpty();
  await broken.close();
});
