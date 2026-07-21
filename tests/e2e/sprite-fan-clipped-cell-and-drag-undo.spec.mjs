import { expect, test } from '@playwright/test';

async function opaquePayload(page, name = 'opaque-grid.png') {
  const dataUrl = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(220, 50, 70, 1)';
    ctx.fillRect(0, 0, 8, 8);
    return canvas.toDataURL('image/png');
  });
  return {
    name,
    mimeType: 'image/png',
    buffer: Buffer.from(dataUrl.split(',')[1], 'base64'),
  };
}

async function loadSingleCellGrid(page) {
  await page.goto('/sprite-fan/atlas-studio.html');
  await page.locator('#file-input').setInputFiles(await opaquePayload(page));
  await page.locator('#frame-w-num').fill('8');
  await page.locator('#frame-h-num').fill('8');
}

test('cell overrides outside the source preserve transparent padding instead of shifting pixels', async ({ page }) => {
  await loadSingleCellGrid(page);
  await page.evaluate(() => window.__spriteFanTest.setCellOverride(0, { dx: -2, dy: -1, dw: 0, dh: 0 }));
  await page.locator('#btn-slice').click();

  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 0, 0))).toBe(0);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 1, 1))).toBe(0);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 2, 1))).toBe(255);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 7, 7))).toBe(255);
});

test('dragged cell corrections create one undoable history entry', async ({ page }) => {
  await loadSingleCellGrid(page);
  await page.locator('#grid-edit-mode').selectOption('cell');
  await page.locator('#grid-cell-index').fill('0');

  const container = page.locator('#canvas-container');
  const box = await container.boundingBox();
  expect(box).not.toBeNull();
  const zoom = await page.evaluate(() => window.__spriteFanTest.getState().zoom);
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + Math.max(2, Math.round(zoom * 3)), startY + Math.max(2, Math.round(zoom * 2)));
  await page.mouse.up();

  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getCellOverride(0))).toMatchObject({ dx: 3, dy: 2 });
  await page.locator('#btn-undo').click();
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getCellOverride(0))).toEqual({ dx: 0, dy: 0, dw: 0, dh: 0 });
});
