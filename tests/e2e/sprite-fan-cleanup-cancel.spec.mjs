import { expect, test } from '@playwright/test';

async function cancelPayload(page) {
  const dataUrl = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 8, 8);
    ctx.fillStyle = 'rgba(40, 130, 230, 1)';
    ctx.fillRect(2, 2, 4, 4);
    ctx.clearRect(3, 3, 1, 1);
    ctx.fillStyle = 'rgba(255, 0, 0, 1)';
    ctx.fillRect(7, 7, 1, 1);
    return canvas.toDataURL('image/png');
  });
  return {
    name: 'sprite-fan-cleanup-cancel.png',
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

async function exportReviewReport(page) {
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#btn-export-review-report').click();
  return readDownloadJson(await downloadPromise);
}

test('cancelled cleanup-all leaves pixels, reports, undo, and batch history unchanged', async ({ page }) => {
  page.on('dialog', async (dialog) => {
    expect(dialog.message()).toContain('Cleanup 1 frame');
    await dialog.dismiss();
  });

  await page.goto('/sprite-fan/atlas-studio.html');
  await page.locator('#file-input').setInputFiles(await cancelPayload(page));
  await page.locator('#frame-w-num').fill('8');
  await page.locator('#frame-h-num').fill('8');
  await page.locator('#btn-slice').click();
  await expect(page.locator('#slice-info')).toContainText('1 frames');

  await page.locator('button[data-wf="cleanup"]').click();
  await page.locator('#manifest-name').evaluate((el) => {
    el.value = 'cancel-report';
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

  const beforeHash = await page.evaluate(() => window.__spriteFanTest.getFrameHash(0));
  const before = await exportReviewReport(page);
  expect(before.totals.strayPixels).toBe(1);
  expect(before.totals.pinholePixels).toBe(1);
  expect(before.batchHistory).toEqual([]);

  await page.locator('#btn-cleanup-all').click();

  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameHash(0))).toBe(beforeHash);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 3, 3))).toBe(0);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 7, 7))).toBe(255);
  await expect(page.locator('#status-undo')).toHaveText('Undo: 0');

  const after = await exportReviewReport(page);
  expect(after.totals).toMatchObject(before.totals);
  expect(after.frames[0].hash).toBe(before.frames[0].hash);
  expect(after.batchHistory).toEqual([]);
});
