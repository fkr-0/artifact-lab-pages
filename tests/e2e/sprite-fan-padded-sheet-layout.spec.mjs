import { expect, test } from '@playwright/test';

async function paddedLayoutPayload(page) {
  const dataUrl = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 24;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 24, 8);
    ctx.fillStyle = 'rgba(70, 140, 220, 1)';
    ctx.fillRect(1, 1, 5, 5);
    ctx.fillStyle = 'rgba(220, 140, 70, 1)';
    ctx.fillRect(9, 1, 5, 5);
    ctx.fillStyle = 'rgba(120, 220, 80, 1)';
    ctx.fillRect(17, 1, 5, 5);
    return canvas.toDataURL('image/png');
  });
  return {
    name: 'sprite-fan-padded-layout.png',
    mimeType: 'image/png',
    buffer: Buffer.from(dataUrl.split(',')[1], 'base64'),
  };
}

async function readDownloadJson(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function exportJson(page, selector) {
  const downloadPromise = page.waitForEvent('download');
  await page.locator(selector).click();
  return readDownloadJson(await downloadPromise);
}

test('padded multi-frame sheet layout metadata matches repack coordinates', async ({ page }) => {
  await page.goto('/sprite-fan/atlas-studio.html');
  await page.locator('#file-input').setInputFiles(await paddedLayoutPayload(page));
  await page.locator('#frame-w-num').fill('8');
  await page.locator('#frame-h-num').fill('8');
  await page.locator('#btn-slice').click();
  await expect(page.locator('#slice-info')).toContainText('3 frames');

  await page.locator('button[data-wf="export"]').click();
  await page.locator('#manifest-name').fill('padded-layout');
  await page.locator('#chk-no-pad').uncheck();
  await page.locator('#export-cols').evaluate((el) => {
    el.value = '2';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#export-pad').evaluate((el) => {
    el.value = '2';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#btn-repack').click();
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getCanvasSize())).toEqual({ width: 24, height: 24 });

  await page.locator('button[data-wf="cleanup"]').click();
  const report = await exportJson(page, '#btn-export-review-report');
  await page.locator('button[data-wf="export"]').click();
  const manifest = await exportJson(page, '#btn-export-manifest');

  const expectedLayout = {
    columns: 2,
    rows: 2,
    padding: 2,
    frameWidth: 8,
    frameHeight: 8,
    cellWidth: 12,
    cellHeight: 12,
    sheetWidth: 24,
    sheetHeight: 24,
  };
  expect(report.sheetLayout).toEqual(expectedLayout);
  expect(manifest.sheetLayout).toEqual(expectedLayout);

  const expectedRects = [
    { x: 2, y: 2, w: 8, h: 8 },
    { x: 14, y: 2, w: 8, h: 8 },
    { x: 2, y: 14, w: 8, h: 8 },
  ];
  expect(report.frames.map((frame) => frame.sheetRect)).toEqual(expectedRects);
  expect(manifest.frames.map((frame) => frame.sheetRect)).toEqual(expectedRects);
  expect(report.frames.map((frame) => frame.hash)).toEqual(manifest.frames.map((frame) => frame.hash));
});
