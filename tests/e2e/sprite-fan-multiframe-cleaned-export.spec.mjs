import { expect, test } from '@playwright/test';

async function multiFrameDirtyPayload(page) {
  const dataUrl = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 16, 8);

    // Frame 0: body, pinhole, stray.
    ctx.fillStyle = 'rgba(70, 140, 230, 1)';
    ctx.fillRect(2, 2, 4, 4);
    ctx.clearRect(3, 3, 1, 1);
    ctx.fillStyle = 'rgba(255, 0, 0, 1)';
    ctx.fillRect(7, 7, 1, 1);

    // Frame 1: body, pinhole, stray at mirrored coordinates within its own 8x8 cell.
    ctx.fillStyle = 'rgba(230, 120, 70, 1)';
    ctx.fillRect(10, 2, 4, 4);
    ctx.clearRect(12, 3, 1, 1);
    ctx.fillStyle = 'rgba(255, 0, 0, 1)';
    ctx.fillRect(8, 7, 1, 1);

    return canvas.toDataURL('image/png');
  });
  return {
    name: 'sprite-fan-multiframe-cleaned-export.png',
    mimeType: 'image/png',
    buffer: Buffer.from(dataUrl.split(',')[1], 'base64'),
  };
}

async function readDownloadBuffer(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function readDownloadJson(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function decodePngSamples(page, buffer, points) {
  return page.evaluate(async ({ base64, points }) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    const samples = {};
    for (const point of points) {
      const data = ctx.getImageData(point.x, point.y, 1, 1).data;
      samples[`${point.x},${point.y}`] = [data[0], data[1], data[2], data[3]];
    }
    return { width: image.width, height: image.height, samples };
  }, { base64: buffer.toString('base64'), points });
}

test('cleanup-all repairs every frame and exported sheet pixels match both cleaned cells', async ({ page }) => {
  page.on('dialog', async (dialog) => {
    expect(dialog.message()).toContain('Cleanup 2 frame');
    await dialog.accept();
  });

  await page.goto('/sprite-fan/atlas-studio.html');
  await page.locator('#file-input').setInputFiles(await multiFrameDirtyPayload(page));
  await page.locator('#frame-w-num').fill('8');
  await page.locator('#frame-h-num').fill('8');
  await page.locator('#btn-slice').click();
  await expect(page.locator('#slice-info')).toContainText('2 frames');

  await page.locator('button[data-wf="cleanup"]').click();
  await page.locator('#stray-size').evaluate((el) => {
    el.value = '2';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#jitter-thresh').evaluate((el) => {
    el.value = '99';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  const dirtyHashes = await page.evaluate(() => [
    window.__spriteFanTest.getFrameHash(0),
    window.__spriteFanTest.getFrameHash(1),
  ]);
  expect(dirtyHashes[0]).not.toBe(dirtyHashes[1]);

  await page.locator('#btn-cleanup-all').click();
  const cleanHashes = await page.evaluate(() => [
    window.__spriteFanTest.getFrameHash(0),
    window.__spriteFanTest.getFrameHash(1),
  ]);
  expect(cleanHashes[0]).not.toBe(dirtyHashes[0]);
  expect(cleanHashes[1]).not.toBe(dirtyHashes[1]);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getReviewIssues().length)).toBe(0);

  const reportDownload = page.waitForEvent('download');
  await page.locator('#btn-export-review-report').click();
  const report = await readDownloadJson(await reportDownload);
  expect(report.totals).toMatchObject({ strayPixels: 0, pinholePixels: 0, issueFrames: 0 });
  expect(report.batchHistory[0].before).toMatchObject({ strayPixels: 2, pinholePixels: 2, issueFrames: 2 });
  expect(report.batchHistory[0].after).toMatchObject({ strayPixels: 0, pinholePixels: 0, issueFrames: 0 });

  await page.locator('button[data-wf="export"]').click();
  await page.locator('#manifest-name').fill('multi-cleaned');
  await page.locator('#chk-no-pad').check();
  await page.locator('#export-cols').evaluate((el) => {
    el.value = '2';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  const pngDownload = page.waitForEvent('download');
  await page.locator('#btn-export-png').click();
  const png = await readDownloadBuffer(await pngDownload);
  const decoded = await decodePngSamples(page, png, [
    { x: 3, y: 3 }, // frame 0 former pinhole
    { x: 7, y: 7 }, // frame 0 former stray
    { x: 12, y: 3 }, // frame 1 former pinhole
    { x: 8, y: 7 }, // frame 1 former stray
  ]);
  expect(decoded).toMatchObject({ width: 16, height: 8 });
  expect(decoded.samples['3,3'][3]).toBeGreaterThan(0);
  expect(decoded.samples['7,7'][3]).toBe(0);
  expect(decoded.samples['12,3'][3]).toBeGreaterThan(0);
  expect(decoded.samples['8,7'][3]).toBe(0);
});
