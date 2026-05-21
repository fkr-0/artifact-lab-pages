import { expect, test } from '@playwright/test';

async function softOutlinePayload(page) {
  const dataUrl = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 8, 8);

    // Main body plus a one-pixel protrusion so outline normalization has a visible target.
    ctx.fillStyle = 'rgba(70, 150, 230, 1)';
    ctx.fillRect(2, 2, 3, 3);
    ctx.fillRect(6, 6, 1, 1);
    return canvas.toDataURL('image/png');
  });
  return {
    name: 'sprite-fan-soft-outline.png',
    mimeType: 'image/png',
    buffer: Buffer.from(dataUrl.split(',')[1], 'base64'),
  };
}

async function setRange(page, selector, value) {
  await page.locator(selector).evaluate((el, nextValue) => {
    el.value = String(nextValue);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

async function loadSingleFrame(page) {
  await page.goto('/sprite-fan/atlas-studio.html');
  await page.locator('#file-input').setInputFiles(await softOutlinePayload(page));
  await page.locator('#frame-w-num').fill('8');
  await page.locator('#frame-h-num').fill('8');
  await page.locator('#btn-slice').click();
  await expect(page.locator('#slice-info')).toContainText('1 frames');
  await page.locator('button[data-wf="cleanup"]').click();
}

test('edge softening creates soft-alpha pixels and remains undoable', async ({ page }) => {
  await loadSingleFrame(page);
  const before = await page.evaluate(() => ({
    hash: window.__spriteFanTest.getFrameHash(0),
    metrics: window.__spriteFanTest.getFrameMetrics(0),
  }));
  expect(before.metrics.soft).toBe(0);

  await setRange(page, '#soften-radius', 1);
  await setRange(page, '#alpha-erode', 0);
  await setRange(page, '#alpha-dilate', 0);
  await page.locator('#btn-soften').click();

  const after = await page.evaluate(() => ({
    hash: window.__spriteFanTest.getFrameHash(0),
    metrics: window.__spriteFanTest.getFrameMetrics(0),
  }));
  expect(after.hash).not.toBe(before.hash);
  expect(after.metrics.soft).toBeGreaterThan(0);
  expect(after.metrics.pixels).toBe(before.metrics.pixels);

  await page.locator('#btn-undo').click();
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameHash(0))).toBe(before.hash);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameMetrics(0).soft)).toBe(0);
});

test('outline normalization changes protrusion alpha without losing review metrics', async ({ page }) => {
  await loadSingleFrame(page);
  const before = await page.evaluate(() => ({
    hash: window.__spriteFanTest.getFrameHash(0),
    alpha: window.__spriteFanTest.getFrameAlpha(0, 6, 6),
    metrics: window.__spriteFanTest.getFrameMetrics(0),
  }));
  expect(before.alpha).toBe(255);
  expect(before.metrics.pixels).toBe(10);

  await setRange(page, '#outline-radius', 1);
  await page.locator('#btn-normalize-outline').click();

  const after = await page.evaluate(() => ({
    hash: window.__spriteFanTest.getFrameHash(0),
    alpha: window.__spriteFanTest.getFrameAlpha(0, 6, 6),
    metrics: window.__spriteFanTest.getFrameMetrics(0),
  }));
  expect(after.hash).not.toBe(before.hash);
  expect(after.alpha).toBeLessThan(before.alpha);
  expect(after.alpha).toBeGreaterThan(0);
  expect(after.metrics.soft).toBeGreaterThan(before.metrics.soft);
  expect(after.metrics.pixels).toBe(before.metrics.pixels);
});
