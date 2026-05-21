import { expect, test } from '@playwright/test';

async function jitterCleanupPayload(page) {
  const dataUrl = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 16, 8);

    // Frame 0: reference block centered at 3,3.
    ctx.fillStyle = 'rgba(70, 140, 230, 1)';
    ctx.fillRect(2, 2, 3, 3);

    // Frame 1: same block shifted right/down within its 8x8 cell.
    ctx.fillStyle = 'rgba(230, 120, 70, 1)';
    ctx.fillRect(12, 3, 3, 3);

    return canvas.toDataURL('image/png');
  });
  return {
    name: 'sprite-fan-cleanup-jitter-report.png',
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

test('cleanup-all with pixel-shift jitter repair clears jitterFrames in review reports', async ({ page }) => {
  page.on('dialog', async (dialog) => {
    expect(dialog.message()).toContain('Cleanup 2 frame');
    await dialog.accept();
  });

  await page.goto('/sprite-fan/atlas-studio.html');
  await page.locator('#file-input').setInputFiles(await jitterCleanupPayload(page));
  await page.locator('#frame-w-num').fill('8');
  await page.locator('#frame-h-num').fill('8');
  await page.locator('#btn-slice').click();
  await expect(page.locator('#slice-info')).toContainText('2 frames');

  await page.locator('button[data-wf="cleanup"]').click();
  await page.locator('#manifest-name').evaluate((el) => {
    el.value = 'cleanup-jitter-report';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#jitter-thresh').evaluate((el) => {
    el.value = '0';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#chk-jitter-shift').check();

  const dirtyHash = await page.evaluate(() => window.__spriteFanTest.getFrameHash(1));
  const before = await exportReviewReport(page);
  expect(before.totals).toMatchObject({ jitterFrames: 1, issueFrames: 1, strayPixels: 0, pinholePixels: 0 });
  expect(before.frames[1].issues.join(' ')).toContain('jitter');
  expect(Math.abs(before.frames[1].centerDelta.x)).toBeGreaterThan(0.5);
  expect(Math.abs(before.frames[1].centerDelta.y)).toBeGreaterThan(0.5);

  await page.locator('#btn-cleanup-all').click();

  const after = await exportReviewReport(page);
  const cleanHash = await page.evaluate(() => window.__spriteFanTest.getFrameHash(1));
  expect(cleanHash).not.toBe(dirtyHash);
  expect(after.totals).toMatchObject({ jitterFrames: 0, issueFrames: 0, strayPixels: 0, pinholePixels: 0 });
  expect(after.frames[1].issues).toEqual([]);
  expect(Math.abs(after.frames[1].centerDelta.x)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(after.frames[1].centerDelta.y)).toBeLessThanOrEqual(0.5);
  expect(after.batchHistory).toHaveLength(1);
  expect(after.batchHistory[0]).toMatchObject({
    kind: 'cleanup-all',
    before: before.totals,
    after: after.totals,
    delta: { jitterFrames: -1, issueFrames: -1, strayPixels: 0, pinholePixels: 0 },
  });
});
