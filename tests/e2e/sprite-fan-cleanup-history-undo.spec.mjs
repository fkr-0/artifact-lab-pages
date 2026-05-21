import { expect, test } from '@playwright/test';

async function historyUndoPayload(page) {
  const dataUrl = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 8, 8);
    ctx.fillStyle = 'rgba(60, 140, 230, 1)';
    ctx.fillRect(2, 2, 4, 4);
    ctx.clearRect(3, 3, 1, 1);
    ctx.fillStyle = 'rgba(255, 0, 0, 1)';
    ctx.fillRect(7, 7, 1, 1);
    return canvas.toDataURL('image/png');
  });
  return {
    name: 'sprite-fan-cleanup-history-undo.png',
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

test('cleanup batch history rolls back on undo and returns on redo', async ({ page }) => {
  page.on('dialog', async (dialog) => {
    expect(dialog.message()).toContain('Cleanup 1 frame');
    await dialog.accept();
  });

  await page.goto('/sprite-fan/atlas-studio.html');
  await page.locator('#file-input').setInputFiles(await historyUndoPayload(page));
  await page.locator('#frame-w-num').fill('8');
  await page.locator('#frame-h-num').fill('8');
  await page.locator('#btn-slice').click();
  await expect(page.locator('#slice-info')).toContainText('1 frames');

  await page.locator('button[data-wf="cleanup"]').click();
  await page.locator('#manifest-name').evaluate((el) => {
    el.value = 'history-undo';
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

  const before = await exportReviewReport(page);
  expect(before.batchHistory).toEqual([]);
  expect(before.totals).toMatchObject({ strayPixels: 1, pinholePixels: 1, issueFrames: 1 });

  await page.locator('#btn-cleanup-all').click();
  const cleaned = await exportReviewReport(page);
  expect(cleaned.totals).toMatchObject({ strayPixels: 0, pinholePixels: 0, issueFrames: 0 });
  expect(cleaned.batchHistory).toHaveLength(1);
  expect(cleaned.batchHistory[0]).toMatchObject({
    kind: 'cleanup-all',
    before: before.totals,
    after: cleaned.totals,
    delta: { strayPixels: -1, pinholePixels: -1, issueFrames: -1 },
  });

  await page.locator('#btn-undo').click();
  const undone = await exportReviewReport(page);
  expect(undone.batchHistory).toEqual([]);
  expect(undone.totals).toMatchObject({ strayPixels: 1, pinholePixels: 1, issueFrames: 1 });
  expect(undone.frames[0].hash).toBe(before.frames[0].hash);

  await page.locator('#btn-redo').click();
  const redone = await exportReviewReport(page);
  expect(redone.batchHistory).toHaveLength(1);
  expect(redone.batchHistory[0]).toMatchObject(cleaned.batchHistory[0]);
  expect(redone.totals).toMatchObject({ strayPixels: 0, pinholePixels: 0, issueFrames: 0 });
  expect(redone.frames[0].hash).toBe(cleaned.frames[0].hash);
});
