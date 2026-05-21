import { expect, test } from '@playwright/test';

async function configRoundtripPayload(page) {
  const dataUrl = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 16, 8);
    ctx.fillStyle = 'rgba(90, 180, 240, 1)';
    ctx.fillRect(1, 1, 5, 5);
    ctx.fillStyle = 'rgba(240, 140, 90, 1)';
    ctx.fillRect(10, 2, 5, 5);
    return canvas.toDataURL('image/png');
  });
  return {
    name: 'sprite-fan-config-roundtrip.png',
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

test('atlas studio applies frame metadata config before slicing and exports it', async ({ page }) => {
  await page.goto('/sprite-fan/atlas-studio.html');

  const applied = await page.evaluate(() => window.__spriteFanTest.applyConfig({
    frameW: 8,
    frameH: 8,
    exportCols: 2,
    noPad: true,
    manifestName: 'cfg-walk',
    manifestFps: 9,
    autoFitFrames: true,
    maxAutoFitZoom: 3,
    frameMeta: [
      { index: 0, label: 'cfg-a', notes: 'applied before slice', anchor: { x: 2, y: 6 } },
      { index: 1, label: 'cfg-b', notes: 'second before slice', anchor: { x: 3, y: 7 } },
    ],
  }));
  expect(applied.frameMeta).toEqual([]);

  await page.locator('#file-input').setInputFiles(await configRoundtripPayload(page));
  await page.locator('#btn-slice').click();
  await expect(page.locator('#slice-info')).toContainText('2 frames');

  const cfgAfterSlice = await page.evaluate(() => window.__spriteFanTest.getConfig());
  expect(cfgAfterSlice.frameW).toBe(8);
  expect(cfgAfterSlice.frameH).toBe(8);
  expect(cfgAfterSlice.manifestName).toBe('cfg-walk');
  expect(cfgAfterSlice.manifestFps).toBe(9);
  expect(cfgAfterSlice.frameMeta[0]).toMatchObject({ label: 'cfg-a', notes: 'applied before slice', anchor: { x: 2, y: 6 } });
  expect(cfgAfterSlice.frameMeta[1]).toMatchObject({ label: 'cfg-b', notes: 'second before slice', anchor: { x: 3, y: 7 } });

  await page.locator('button[data-wf="export"]').click();
  const manifestDownload = page.waitForEvent('download');
  await page.locator('#btn-export-manifest').click();
  const manifest = await readDownloadJson(await manifestDownload);
  expect(manifest).toMatchObject({ name: 'cfg-walk', fps: 9, frameWidth: 8, frameHeight: 8, frameCount: 2 });
  expect(manifest.frames[0]).toMatchObject({ label: 'cfg-a', notes: 'applied before slice', anchor: { x: 2, y: 6 } });
  expect(manifest.frames[1]).toMatchObject({ label: 'cfg-b', notes: 'second before slice', anchor: { x: 3, y: 7 } });

  const fullConfigDownload = page.waitForEvent('download');
  await page.locator('#btn-export-manifest-full').click();
  const fullConfig = await readDownloadJson(await fullConfigDownload);
  expect(fullConfig.maxAutoFitZoom).toBe(3);
  expect(fullConfig.frameMeta[0]).toMatchObject({ label: 'cfg-a', notes: 'applied before slice', anchor: { x: 2, y: 6 } });
});
