import { expect, test } from '@playwright/test';

async function repairPayload(page) {
  const dataUrl = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 8, 8);
    ctx.fillStyle = 'rgba(50, 140, 230, 1)';
    ctx.fillRect(2, 2, 4, 4);
    ctx.clearRect(3, 3, 1, 1);
    ctx.fillStyle = 'rgba(255, 0, 0, 1)';
    ctx.fillRect(7, 7, 1, 1);
    return canvas.toDataURL('image/png');
  });
  return {
    name: 'sprite-fan-direct-repair.png',
    mimeType: 'image/png',
    buffer: Buffer.from(dataUrl.split(',')[1], 'base64'),
  };
}

async function setStraySize(page, value) {
  await page.locator('#stray-size').evaluate((el, nextValue) => {
    el.value = String(nextValue);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

async function loadRepairFrame(page) {
  await page.goto('/sprite-fan/atlas-studio.html');
  await page.locator('#file-input').setInputFiles(await repairPayload(page));
  await page.locator('#frame-w-num').fill('8');
  await page.locator('#frame-h-num').fill('8');
  await page.locator('#btn-slice').click();
  await expect(page.locator('#slice-info')).toContainText('1 frames');
  await page.locator('button[data-wf="cleanup"]').click();
  await setStraySize(page, 2);
}

test('direct Remove Stray updates a single selected frame and remains undoable', async ({ page }) => {
  await loadRepairFrame(page);
  const beforeHash = await page.evaluate(() => window.__spriteFanTest.getFrameHash(0));
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 7, 7))).toBe(255);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 3, 3))).toBe(0);

  await page.locator('#btn-remove-stray').click();
  const afterHash = await page.evaluate(() => window.__spriteFanTest.getFrameHash(0));
  expect(afterHash).not.toBe(beforeHash);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 7, 7))).toBe(0);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 3, 3))).toBe(0);

  await page.locator('#btn-undo').click();
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameHash(0))).toBe(beforeHash);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 7, 7))).toBe(255);
});

test('direct Fix Pinholes fills enclosed transparent pixels and remains undoable', async ({ page }) => {
  await loadRepairFrame(page);
  const beforeHash = await page.evaluate(() => window.__spriteFanTest.getFrameHash(0));
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 3, 3))).toBe(0);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 7, 7))).toBe(255);

  await page.locator('#btn-fix-pinholes').click();
  const afterHash = await page.evaluate(() => window.__spriteFanTest.getFrameHash(0));
  expect(afterHash).not.toBe(beforeHash);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 3, 3))).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 7, 7))).toBe(255);

  await page.locator('#btn-undo').click();
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameHash(0))).toBe(beforeHash);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 3, 3))).toBe(0);
});
