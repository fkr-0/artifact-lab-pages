import { expect, test } from '@playwright/test';

async function morphologyPayload(page) {
  const dataUrl = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 8, 8);
    ctx.fillStyle = 'rgba(60, 140, 220, 1)';
    ctx.fillRect(2, 2, 4, 4);
    return canvas.toDataURL('image/png');
  });
  return {
    name: 'sprite-fan-morphology.png',
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

test('alpha erode and dilate controls change frame pixels deterministically', async ({ page }) => {
  await page.goto('/sprite-fan/atlas-studio.html');
  await page.locator('#file-input').setInputFiles(await morphologyPayload(page));
  await page.locator('#frame-w-num').fill('8');
  await page.locator('#frame-h-num').fill('8');
  await page.locator('#btn-slice').click();
  await expect(page.locator('#slice-info')).toContainText('1 frames');

  await page.locator('button[data-wf="cleanup"]').click();
  const initial = await page.evaluate(() => ({
    hash: window.__spriteFanTest.getFrameHash(0),
    metrics: window.__spriteFanTest.getFrameMetrics(0),
  }));
  expect(initial.metrics.pixels).toBe(16);
  expect(initial.metrics.bbox).toEqual({ x: 2, y: 2, w: 4, h: 4 });

  await setRange(page, '#soften-radius', 0);
  await setRange(page, '#alpha-erode', 1);
  await setRange(page, '#alpha-dilate', 0);
  await page.locator('#btn-soften').click();

  const eroded = await page.evaluate(() => ({
    hash: window.__spriteFanTest.getFrameHash(0),
    metrics: window.__spriteFanTest.getFrameMetrics(0),
  }));
  expect(eroded.hash).not.toBe(initial.hash);
  expect(eroded.metrics.pixels).toBeLessThan(initial.metrics.pixels);
  expect(eroded.metrics.bbox.w).toBeLessThan(initial.metrics.bbox.w);
  expect(eroded.metrics.bbox.h).toBeLessThan(initial.metrics.bbox.h);

  await page.locator('#btn-undo').click();
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameHash(0))).toBe(initial.hash);

  await setRange(page, '#alpha-erode', 0);
  await setRange(page, '#alpha-dilate', 1);
  await page.locator('#btn-soften').click();

  const dilated = await page.evaluate(() => ({
    hash: window.__spriteFanTest.getFrameHash(0),
    metrics: window.__spriteFanTest.getFrameMetrics(0),
  }));
  expect(dilated.hash).not.toBe(initial.hash);
  expect(dilated.metrics.pixels).toBeGreaterThan(initial.metrics.pixels);
  expect(dilated.metrics.bbox.w).toBeGreaterThan(initial.metrics.bbox.w);
  expect(dilated.metrics.bbox.h).toBeGreaterThan(initial.metrics.bbox.h);
});
