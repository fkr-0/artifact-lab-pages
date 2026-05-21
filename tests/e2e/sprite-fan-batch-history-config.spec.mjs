import { expect, test } from '@playwright/test';

async function historyPayload(page) {
  const dataUrl = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 8, 8);
    ctx.fillStyle = 'rgba(70, 120, 220, 1)';
    ctx.fillRect(2, 2, 4, 4);
    ctx.clearRect(3, 3, 1, 1);
    ctx.fillStyle = 'rgba(255, 0, 0, 1)';
    ctx.fillRect(7, 7, 1, 1);
    return canvas.toDataURL('image/png');
  });
  return {
    name: 'sprite-fan-history-config.png',
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

async function prepareCleanedConfig(page) {
  page.on('dialog', async (dialog) => {
    if (dialog.message().includes('Cleanup 1 frame')) await dialog.accept();
    else await dialog.dismiss();
  });

  await page.goto('/sprite-fan/atlas-studio.html');
  await page.locator('#file-input').setInputFiles(await historyPayload(page));
  await page.locator('#frame-w-num').fill('8');
  await page.locator('#frame-h-num').fill('8');
  await page.locator('#btn-slice').click();
  await expect(page.locator('#slice-info')).toContainText('1 frames');
  await page.locator('button[data-wf="cleanup"]').click();
  await page.locator('#manifest-name').evaluate((el) => {
    el.value = 'history-config';
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
  const downloadPromise = page.waitForEvent('download');
  await page.locator('button[data-wf="export"]').click();
  await page.locator('#btn-export-manifest-full').click();
  return readDownloadJson(await downloadPromise);
}

test('full config preserves cleanup batch history through JSON import and review report export', async ({ page }) => {
  const config = await prepareCleanedConfig(page);
  expect(config.batchHistory).toHaveLength(1);
  expect(config.batchHistory[0]).toMatchObject({ kind: 'cleanup-all' });
  expect(config.batchHistory[0].delta.strayPixels).toBeLessThan(0);
  expect(config.batchHistory[0].delta.pinholePixels).toBeLessThan(0);

  const importedPage = page.context().pages()[0];
  await importedPage.goto('/sprite-fan/atlas-studio.html');
  await importedPage.locator('#btn-config').click();
  await importedPage.locator('#cfg-import-file').setInputFiles({
    name: 'sprite-atlas-config.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(config), 'utf8'),
  });
  await expect.poll(() => importedPage.locator('#cfg-editor').inputValue()).toContain('history-config');
  await importedPage.locator('#btn-cfg-apply').click();

  await importedPage.locator('#file-input').setInputFiles(await historyPayload(importedPage));
  await importedPage.locator('#btn-slice').click();
  await expect(importedPage.locator('#slice-info')).toContainText('1 frames');
  await importedPage.locator('button[data-wf="cleanup"]').click();

  const reviewDownload = importedPage.waitForEvent('download');
  await importedPage.locator('#btn-export-review-report').click();
  const report = await readDownloadJson(await reviewDownload);
  expect(report.name).toBe('history-config');
  expect(report.batchHistory).toHaveLength(1);
  expect(report.batchHistory[0]).toMatchObject(config.batchHistory[0]);
});
