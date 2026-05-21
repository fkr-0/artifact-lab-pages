import { expect, test } from '@playwright/test';

async function reportPayload(page) {
  const dataUrl = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 16, 8);

    // Two frames, each with a 4x4 sprite block, one transparent pinhole, and one stray pixel.
    ctx.fillStyle = 'rgba(60, 130, 220, 1)';
    ctx.fillRect(2, 2, 4, 4);
    ctx.clearRect(3, 3, 1, 1);
    ctx.fillStyle = 'rgba(255, 0, 0, 1)';
    ctx.fillRect(7, 7, 1, 1);

    ctx.fillStyle = 'rgba(60, 130, 220, 1)';
    ctx.fillRect(10, 2, 4, 4);
    ctx.clearRect(11, 3, 1, 1);
    ctx.fillStyle = 'rgba(255, 0, 0, 1)';
    ctx.fillRect(15, 7, 1, 1);

    return canvas.toDataURL('image/png');
  });
  return {
    name: 'sprite-fan-review-report.png',
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

test('atlas studio exports review reports that show cleanup issue reduction', async ({ page }) => {
  page.on('dialog', async (dialog) => {
    expect(dialog.message()).toContain('Cleanup 2 frame');
    await dialog.accept();
  });

  await page.goto('/sprite-fan/atlas-studio.html');
  await page.locator('#file-input').setInputFiles(await reportPayload(page));
  await page.locator('#frame-w-num').fill('8');
  await page.locator('#frame-h-num').fill('8');
  await page.locator('#btn-slice').click();
  await expect(page.locator('#slice-info')).toContainText('2 frames');

  await page.locator('button[data-wf="cleanup"]').click();
  await page.locator('#manifest-name').evaluate((el) => {
    el.value = 'report-sprite';
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
  expect(before).toMatchObject({ version: 1, name: 'report-sprite', frameCount: 2 });
  expect(before.totals.issueFrames).toBe(2);
  expect(before.totals.strayPixels).toBe(2);
  expect(before.totals.pinholePixels).toBe(2);
  expect(before.frames[0].issues.join(' ')).toContain('stray');
  expect(before.frames[0].issues.join(' ')).toContain('holes');
  expect(before.frames[0].hash).toMatch(/^[0-9a-f]{8}$/);

  await page.locator('#btn-cleanup-all').click();
  const after = await exportReviewReport(page);
  expect(after.frameCount).toBe(2);
  expect(after.totals.strayPixels).toBe(0);
  expect(after.totals.pinholePixels).toBe(0);
  expect(after.frames[0].hash).toMatch(/^[0-9a-f]{8}$/);
  expect(after.frames[0].hash).not.toBe(before.frames[0].hash);
  expect(after.totals.issueFrames).toBeLessThan(before.totals.issueFrames);
  expect(after.batchHistory).toHaveLength(1);
  expect(after.batchHistory[0]).toMatchObject({ kind: 'cleanup-all', before: before.totals, after: after.totals });
  expect(after.batchHistory[0].delta.strayPixels).toBeLessThan(0);
  expect(after.batchHistory[0].delta.pinholePixels).toBeLessThan(0);
  expect(after.frames[0].pixels).toBeGreaterThan(before.frames[0].pixels - 2);
});
