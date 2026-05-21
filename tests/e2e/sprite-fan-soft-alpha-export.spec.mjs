import { expect, test } from '@playwright/test';

async function softAlphaPayload(page) {
  const dataUrl = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 8, 8);
    ctx.fillStyle = 'rgba(70, 150, 230, 1)';
    ctx.fillRect(2, 2, 4, 4);
    return canvas.toDataURL('image/png');
  });
  return {
    name: 'sprite-fan-soft-alpha-export.png',
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

async function exportJson(page, selector) {
  const downloadPromise = page.waitForEvent('download');
  await page.locator(selector).click();
  return readDownloadJson(await downloadPromise);
}

async function decodeAlphaStats(page, buffer) {
  return page.evaluate(async ({ base64 }) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    const data = ctx.getImageData(0, 0, image.width, image.height).data;
    let transparent = 0;
    let solid = 0;
    let soft = 0;
    for (let i = 3; i < data.length; i += 4) {
      const alpha = data[i];
      if (alpha === 0) transparent += 1;
      else if (alpha === 255) solid += 1;
      else soft += 1;
    }
    return { width: image.width, height: image.height, transparent, solid, soft };
  }, { base64: buffer.toString('base64') });
}

test('edge-softened frames export partial alpha in PNG and metadata', async ({ page }) => {
  await page.goto('/sprite-fan/atlas-studio.html');
  await page.locator('#file-input').setInputFiles(await softAlphaPayload(page));
  await page.locator('#frame-w-num').fill('8');
  await page.locator('#frame-h-num').fill('8');
  await page.locator('#btn-slice').click();
  await expect(page.locator('#slice-info')).toContainText('1 frames');

  await page.locator('button[data-wf="cleanup"]').click();
  await page.locator('#soften-radius').evaluate((el) => {
    el.value = '1';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#alpha-erode').evaluate((el) => {
    el.value = '0';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#alpha-dilate').evaluate((el) => {
    el.value = '0';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  const beforeMetrics = await page.evaluate(() => window.__spriteFanTest.getFrameMetrics(0));
  expect(beforeMetrics.soft).toBe(0);
  await page.locator('#btn-soften').click();
  const softened = await page.evaluate(() => ({
    hash: window.__spriteFanTest.getFrameHash(0),
    metrics: window.__spriteFanTest.getFrameMetrics(0),
  }));
  expect(softened.metrics.soft).toBeGreaterThan(0);

  await page.locator('#manifest-name').evaluate((el) => {
    el.value = 'soft-alpha-export';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const report = await exportJson(page, '#btn-export-review-report');
  expect(report.frames[0]).toMatchObject({ hash: softened.hash, soft: softened.metrics.soft });

  await page.locator('button[data-wf="export"]').click();
  await page.locator('#chk-no-pad').check();
  await page.locator('#export-cols').evaluate((el) => {
    el.value = '1';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  const manifest = await exportJson(page, '#btn-export-manifest');
  expect(manifest.frames[0]).toMatchObject({
    hash: softened.hash,
    softAlphaPixels: softened.metrics.soft,
  });

  const pngDownload = page.waitForEvent('download');
  await page.locator('#btn-export-png').click();
  const png = await readDownloadBuffer(await pngDownload);
  expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');

  const stats = await decodeAlphaStats(page, png);
  expect(stats).toMatchObject({ width: 8, height: 8 });
  expect(stats.soft).toBe(softened.metrics.soft);
  expect(stats.solid).toBeGreaterThan(0);
  expect(stats.transparent).toBeGreaterThan(0);
});
