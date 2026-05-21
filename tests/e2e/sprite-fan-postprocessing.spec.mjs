import { expect, test } from '@playwright/test';

async function makeSpriteSheetPayload(page) {
  const dataUrl = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 16, 8);

    // Frame 1: solid 4x4 block with one transparent pinhole and one isolated stray pixel.
    ctx.fillStyle = 'rgba(70, 120, 210, 1)';
    ctx.fillRect(2, 2, 4, 4);
    ctx.clearRect(3, 3, 1, 1);
    ctx.fillStyle = 'rgba(255, 0, 0, 1)';
    ctx.fillRect(7, 7, 1, 1);

    // Frame 2: similar silhouette offset within the second cell.
    ctx.fillStyle = 'rgba(70, 120, 210, 1)';
    ctx.fillRect(10, 2, 4, 4);
    ctx.clearRect(11, 3, 1, 1);
    ctx.fillStyle = 'rgba(255, 0, 0, 1)';
    ctx.fillRect(15, 7, 1, 1);

    return canvas.toDataURL('image/png');
  });
  return {
    name: 'sprite-fan-e2e.png',
    mimeType: 'image/png',
    buffer: Buffer.from(dataUrl.split(',')[1], 'base64'),
  };
}

test('atlas studio performs sprite postprocessing and review from a synthetic sheet', async ({ page }) => {
  page.on('dialog', async (dialog) => {
    expect(dialog.message()).toContain('Cleanup 2 frame');
    await dialog.accept();
  });
  await page.goto('/sprite-fan/atlas-studio.html');
  await expect(page.locator('.logo')).toContainText('Sprite Atlas Studio');

  const file = await makeSpriteSheetPayload(page);
  await page.locator('#file-input').setInputFiles(file);
  await expect(page.locator('#info-size')).toContainText('16x8');

  await page.locator('#frame-w-num').fill('8');
  await page.locator('#frame-h-num').fill('8');
  await page.locator('#btn-slice').click();
  await expect(page.locator('#slice-info')).toContainText('2 frames');

  await page.locator('button[data-wf="cleanup"]').click();
  await page.locator('#stray-size').evaluate((el) => {
    el.value = '2';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 3, 3))).toBe(0);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 7, 7))).toBe(255);

  await page.locator('#btn-cleanup-all').click();

  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 3, 3))).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 7, 7))).toBe(0);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(1, 3, 3))).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(1, 7, 7))).toBe(0);

  await page.keyboard.press('ArrowRight');
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getState().selectedFrame)).toBe(1);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getReviewText())).toContain('bbox');

  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getState().autoFitFrames)).toBe(true);
  await page.locator('#btn-auto-fit').click();
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getState().autoFitFrames)).toBe(false);
  await page.locator('#btn-auto-fit').click();
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getState().autoFitFrames)).toBe(true);

  await page.keyboard.press('f');
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getState().zoom)).toBeGreaterThan(0);
});
