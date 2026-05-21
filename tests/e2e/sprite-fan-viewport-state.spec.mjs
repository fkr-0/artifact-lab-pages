import { expect, test } from '@playwright/test';

async function viewportSheetPayload(page) {
  const dataUrl = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 32, 16);
    ctx.fillStyle = 'rgba(80, 160, 220, 1)';
    ctx.fillRect(2, 2, 12, 12);
    ctx.fillStyle = 'rgba(220, 120, 80, 1)';
    ctx.fillRect(18, 2, 12, 12);
    return canvas.toDataURL('image/png');
  });
  return {
    name: 'sprite-fan-viewport.png',
    mimeType: 'image/png',
    buffer: Buffer.from(dataUrl.split(',')[1], 'base64'),
  };
}

test('atlas studio preserves separate source-sheet and frame-review viewport state', async ({ page }) => {
  await page.goto('/sprite-fan/atlas-studio.html');
  await page.locator('#file-input').setInputFiles(await viewportSheetPayload(page));
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getState().viewMode)).toBe('source');

  await page.locator('#btn-zoom-in').click();
  await page.locator('#btn-zoom-in').click();
  const sourceBeforeSlice = await page.evaluate(() => window.__spriteFanTest.getState());
  expect(sourceBeforeSlice.viewMode).toBe('source');
  expect(sourceBeforeSlice.zoom).toBeGreaterThan(1);

  await page.locator('#frame-w-num').fill('16');
  await page.locator('#frame-h-num').fill('16');
  await page.locator('#btn-slice').click();
  await expect(page.locator('#slice-info')).toContainText('2 frames');
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getState().viewMode)).toBe('frame');

  await page.locator('#btn-auto-fit').click();
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getState().autoFitFrames)).toBe(false);
  await page.locator('#btn-zoom-out').click();
  const frameView = await page.evaluate(() => window.__spriteFanTest.getState());
  expect(frameView.viewMode).toBe('frame');
  expect(frameView.selectedFrame).toBe(0);
  expect(frameView.zoom).not.toBeCloseTo(sourceBeforeSlice.zoom, 4);

  await page.locator('button[data-wf="import"]').click();
  const sourceRestored = await page.evaluate(() => window.__spriteFanTest.getState());
  expect(sourceRestored.viewMode).toBe('source');
  expect(sourceRestored.selectedFrame).toBe(-1);
  expect(sourceRestored.zoom).toBeCloseTo(sourceBeforeSlice.zoom, 4);
  expect(sourceRestored.viewStates.source.zoom).toBeCloseTo(sourceBeforeSlice.zoom, 4);
  expect(sourceRestored.viewStates.frame.zoom).toBeCloseTo(frameView.zoom, 4);

  await page.evaluate(() => window.__spriteFanTest.selectFrame(1));
  const frameRestored = await page.evaluate(() => window.__spriteFanTest.getState());
  expect(frameRestored.viewMode).toBe('frame');
  expect(frameRestored.selectedFrame).toBe(1);
  expect(frameRestored.zoom).toBeCloseTo(frameView.zoom, 4);
});
