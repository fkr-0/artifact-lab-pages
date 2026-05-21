import { expect, test } from '@playwright/test';

async function paddedPngPayload(page) {
  const dataUrl = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 24;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 24, 8);

    ctx.fillStyle = 'rgba(80, 140, 230, 1)';
    ctx.fillRect(1, 1, 5, 5);
    ctx.fillStyle = 'rgba(230, 120, 80, 1)';
    ctx.fillRect(9, 1, 5, 5);
    ctx.fillStyle = 'rgba(120, 220, 90, 1)';
    ctx.fillRect(17, 1, 5, 5);

    return canvas.toDataURL('image/png');
  });
  return {
    name: 'sprite-fan-padded-png-pixels.png',
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

test('padded PNG export places frame pixels and transparent padding at sheetRect coordinates', async ({ page }) => {
  await page.goto('/sprite-fan/atlas-studio.html');
  await page.locator('#file-input').setInputFiles(await paddedPngPayload(page));
  await page.locator('#frame-w-num').fill('8');
  await page.locator('#frame-h-num').fill('8');
  await page.locator('#btn-slice').click();
  await expect(page.locator('#slice-info')).toContainText('3 frames');

  await page.locator('button[data-wf="export"]').click();
  await page.locator('#manifest-name').fill('padded-png');
  await page.locator('#chk-no-pad').uncheck();
  await page.locator('#export-cols').evaluate((el) => {
    el.value = '2';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#export-pad').evaluate((el) => {
    el.value = '2';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#btn-export-png').click();
  const buffer = await readDownloadBuffer(await downloadPromise);
  expect(buffer.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');

  const decoded = await decodePngSamples(page, buffer, [
    // transparent outer padding and inter-cell padding
    { x: 0, y: 0 },
    { x: 1, y: 1 },
    { x: 11, y: 3 },
    { x: 13, y: 3 },
    { x: 23, y: 23 },
    // first visible pixel from each source frame, shifted by padding and grid cell
    { x: 3, y: 3 },
    { x: 15, y: 3 },
    { x: 3, y: 15 },
  ]);

  expect(decoded).toMatchObject({ width: 24, height: 24 });
  for (const key of ['0,0', '1,1', '11,3', '13,3', '23,23']) {
    expect(decoded.samples[key][3]).toBe(0);
  }
  for (const key of ['3,3', '15,3', '3,15']) {
    expect(decoded.samples[key][3]).toBe(255);
  }
});
