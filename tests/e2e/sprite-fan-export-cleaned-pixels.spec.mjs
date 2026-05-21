import { expect, test } from '@playwright/test';

async function dirtyExportPayload(page) {
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
    name: 'sprite-fan-export-cleaned-pixels.png',
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

async function samplePngPixels(page, pngBuffer, points) {
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
  }, { base64: pngBuffer.toString('base64'), points });
}

test('exported PNG sheet contains cleaned postprocessed pixels', async ({ page }) => {
  page.on('dialog', async (dialog) => {
    expect(dialog.message()).toContain('Cleanup 1 frame');
    await dialog.accept();
  });

  await page.goto('/sprite-fan/atlas-studio.html');
  await page.locator('#file-input').setInputFiles(await dirtyExportPayload(page));
  await page.locator('#frame-w-num').fill('8');
  await page.locator('#frame-h-num').fill('8');
  await page.locator('#btn-slice').click();
  await expect(page.locator('#slice-info')).toContainText('1 frames');

  await page.locator('button[data-wf="cleanup"]').click();
  await page.locator('#stray-size').evaluate((el) => {
    el.value = '2';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#jitter-thresh').evaluate((el) => {
    el.value = '99';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 3, 3))).toBe(0);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 7, 7))).toBe(255);

  await page.locator('#btn-cleanup-all').click();
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 3, 3))).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 7, 7))).toBe(0);

  await page.locator('button[data-wf="export"]').click();
  await page.locator('#manifest-name').fill('cleaned-export');
  await page.locator('#chk-no-pad').check();
  await page.locator('#export-cols').evaluate((el) => {
    el.value = '1';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#btn-export-png').click();
  const buffer = await readDownloadBuffer(await downloadPromise);
  expect(buffer.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');

  const decoded = await samplePngPixels(page, buffer, [
    { x: 3, y: 3 },
    { x: 7, y: 7 },
  ]);
  expect(decoded).toMatchObject({ width: 8, height: 8 });
  expect(decoded.samples['3,3'][3]).toBeGreaterThan(0);
  expect(decoded.samples['7,7'][3]).toBe(0);
});
