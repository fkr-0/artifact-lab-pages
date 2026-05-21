import { expect, test } from '@playwright/test';

test('animation timing loop metadata persists through config import and manifest export', async ({ page }) => {
  await page.goto('/sprite-fan/atlas-studio.html');
  await page.locator('#btn-config').click();
  const config = JSON.parse(await page.locator('#cfg-editor').inputValue());
  config.manifestName = 'timed-loop';
  config.manifestFps = 20;
  config.manifestLoop = 5;
  await page.locator('#cfg-editor').fill(JSON.stringify(config, null, 2));
  await page.locator('#btn-cfg-apply').click();

  await expect(page.locator('#manifest-name')).toHaveValue('timed-loop');
  await expect(page.locator('#manifest-loop')).toHaveValue('5');
  await expect(page.locator('#loop-val')).toHaveText('5');

  const dataUrl = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 8, 8);
    ctx.fillStyle = 'rgba(70, 140, 230, 1)';
    ctx.fillRect(1, 1, 6, 6);
    return canvas.toDataURL('image/png');
  });
  await page.locator('#file-input').setInputFiles({
    name: 'timed-loop.png',
    mimeType: 'image/png',
    buffer: Buffer.from(dataUrl.split(',')[1], 'base64'),
  });
  await page.locator('#frame-w-num').fill('8');
  await page.locator('#frame-h-num').fill('8');
  await page.locator('#btn-slice').click();
  await expect(page.locator('#slice-info')).toContainText('1 frames');

  await page.locator('button[data-wf="export"]').click();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#btn-export-manifest').click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const manifest = JSON.parse(Buffer.concat(chunks).toString('utf8'));

  expect(manifest.animation).toMatchObject({
    id: 'timed-loop',
    fps: 20,
    frameDurationMs: 50,
    frameDurationsMs: [50],
    loop: false,
    loopCount: 5,
  });
  expect(manifest.animations['timed-loop']).toMatchObject({
    fps: 20,
    frameDurationMs: 50,
    frameDurationsMs: [50],
    loop: false,
    loopCount: 5,
  });
});
