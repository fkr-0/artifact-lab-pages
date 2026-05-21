import { expect, test } from '@playwright/test';

async function undoPayload(page) {
  const dataUrl = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 8, 8);
    ctx.fillStyle = 'rgba(50, 120, 220, 1)';
    ctx.fillRect(2, 2, 4, 4);
    ctx.clearRect(3, 3, 1, 1);
    ctx.fillStyle = 'rgba(255, 0, 0, 1)';
    ctx.fillRect(7, 7, 1, 1);
    return canvas.toDataURL('image/png');
  });
  return {
    name: 'sprite-fan-cleanup-undo.png',
    mimeType: 'image/png',
    buffer: Buffer.from(dataUrl.split(',')[1], 'base64'),
  };
}

test('cleanup-all can be undone and redone for frame pixels and review history', async ({ page }) => {
  page.on('dialog', async (dialog) => {
    expect(dialog.message()).toContain('Cleanup 1 frame');
    await dialog.accept();
  });

  await page.goto('/sprite-fan/atlas-studio.html');
  await page.locator('#file-input').setInputFiles(await undoPayload(page));
  await page.locator('#frame-w-num').fill('8');
  await page.locator('#frame-h-num').fill('8');
  await page.locator('#btn-slice').click();
  await expect(page.locator('#slice-info')).toContainText('1 frames');
  await page.locator('button[data-wf="cleanup"]').click();
  await page.locator('#stray-size').evaluate((el) => {
    el.value = '2';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#jitter-thresh').evaluate((el) => {
    el.value = '99';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 3, 3))).toBe(0);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 7, 7))).toBe(255);
  const dirtyHash = await page.evaluate(() => window.__spriteFanTest.getFrameHash(0));

  await page.locator('#btn-cleanup-all').click();
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 3, 3))).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 7, 7))).toBe(0);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getReviewIssues().length)).toBe(0);
  const cleanHash = await page.evaluate(() => window.__spriteFanTest.getFrameHash(0));
  expect(cleanHash).not.toBe(dirtyHash);

  await page.locator('#btn-undo').click();
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 3, 3))).toBe(0);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 7, 7))).toBe(255);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getReviewIssues().length)).toBe(1);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getConfig().frameMeta.length)).toBe(1);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameHash(0))).toBe(dirtyHash);

  await page.locator('#btn-redo').click();
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 3, 3))).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 7, 7))).toBe(0);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getReviewIssues().length)).toBe(0);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameHash(0))).toBe(cleanHash);
});
