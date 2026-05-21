import { expect, test } from '@playwright/test';

async function consistencyPayload(page) {
  const dataUrl = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 8, 8);
    ctx.fillStyle = 'rgba(60, 150, 230, 1)';
    ctx.fillRect(2, 2, 4, 4);
    ctx.clearRect(3, 3, 1, 1);
    ctx.fillStyle = 'rgba(255, 0, 0, 1)';
    ctx.fillRect(7, 7, 1, 1);
    return canvas.toDataURL('image/png');
  });
  return {
    name: 'sprite-fan-manifest-review-consistency.png',
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

test('cleaned sprites.json metadata matches review-report frame metrics', async ({ page }) => {
  page.on('dialog', async (dialog) => {
    expect(dialog.message()).toContain('Cleanup 1 frame');
    await dialog.accept();
  });

  await page.goto('/sprite-fan/atlas-studio.html');
  await page.locator('#file-input').setInputFiles(await consistencyPayload(page));
  await page.locator('#frame-w-num').fill('8');
  await page.locator('#frame-h-num').fill('8');
  await page.locator('#btn-slice').click();
  await expect(page.locator('#slice-info')).toContainText('1 frames');

  await page.locator('button[data-wf="cleanup"]').click();
  await page.locator('#manifest-name').evaluate((el) => {
    el.value = 'cleaned-consistency';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#stray-size').evaluate((el) => {
    el.value = '2';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#jitter-thresh').evaluate((el) => {
    el.value = '99';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  await page.locator('#btn-cleanup-all').click();
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getReviewIssues().length)).toBe(0);

  await page.locator('button[data-wf="export"]').click();
  await page.locator('#chk-no-pad').check();
  await page.locator('#export-cols').evaluate((el) => {
    el.value = '1';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('button[data-wf="cleanup"]').click();
  const report = await exportJson(page, '#btn-export-review-report');
  await page.locator('button[data-wf="export"]').click();
  const manifest = await exportJson(page, '#btn-export-manifest');

  expect(manifest).toMatchObject({
    name: 'cleaned-consistency',
    frameWidth: 8,
    frameHeight: 8,
    frameCount: 1,
    columns: 1,
    rows: 1,
    padding: 0,
  });

  const manifestFrame = manifest.frames[0];
  const reportFrame = report.frames[0];
  expect(manifestFrame.hash).toBe(reportFrame.hash);
  expect(manifestFrame.bbox).toEqual(reportFrame.bbox);
  expect(manifestFrame.alphaPixels).toBe(reportFrame.pixels);
  expect(manifestFrame.softAlphaPixels).toBe(reportFrame.soft);
  expect(manifestFrame.strayPixels).toBe(0);
  expect(manifestFrame.pinholePixels).toBe(0);
  expect(manifestFrame.issues).toEqual([]);
  const expectedLayout = { columns: 1, rows: 1, padding: 0, frameWidth: 8, frameHeight: 8, cellWidth: 8, cellHeight: 8, sheetWidth: 8, sheetHeight: 8 };
  expect(report.sheetLayout).toMatchObject(expectedLayout);
  expect(manifest.sheetLayout).toMatchObject(expectedLayout);
  expect(reportFrame).toMatchObject({ col: 0, row: 0, sheetRect: { x: 0, y: 0, w: 8, h: 8 } });
  expect(report.totals.strayPixels).toBe(0);
  expect(report.totals.pinholePixels).toBe(0);
});
