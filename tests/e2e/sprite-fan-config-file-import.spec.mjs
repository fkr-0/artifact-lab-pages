import { expect, test } from '@playwright/test';

async function importSheetPayload(page) {
  const dataUrl = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 18;
    canvas.height = 9;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 18, 9);
    ctx.fillStyle = 'rgba(80, 170, 230, 1)';
    ctx.fillRect(1, 1, 6, 6);
    ctx.fillStyle = 'rgba(230, 120, 80, 1)';
    ctx.fillRect(11, 2, 6, 6);
    return canvas.toDataURL('image/png');
  });
  return {
    name: 'sprite-fan-config-file-import.png',
    mimeType: 'image/png',
    buffer: Buffer.from(dataUrl.split(',')[1], 'base64'),
  };
}

test('config modal imports a JSON file and applies postprocessing settings before slicing', async ({ page }) => {
  await page.goto('/sprite-fan/atlas-studio.html');
  await page.evaluate(() => localStorage.removeItem('sprite-atlas-studio-cfg'));

  const importedConfig = {
    frameW: 9,
    frameH: 9,
    gridOx: 0,
    gridOy: 0,
    straySize: 4,
    jitterThresh: 6,
    outlineRadius: 1,
    softenRadius: 1,
    exportCols: 2,
    exportPad: 0,
    noPad: true,
    manifestName: 'imported-config-sprite',
    manifestFps: 18,
    autoFitFrames: true,
    maxAutoFitZoom: 6,
    frameMeta: [
      { index: 0, label: 'import-a', notes: 'from config file', anchor: { x: 4, y: 8 } },
      { index: 1, label: 'import-b', notes: 'second from file', anchor: { x: 5, y: 8 } },
    ],
  };

  await page.locator('#btn-config').click();
  await expect(page.locator('#config-modal')).toHaveClass(/open/);
  await page.locator('#cfg-import-file').setInputFiles({
    name: 'sprite-atlas-config.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(importedConfig), 'utf8'),
  });
  await expect.poll(() => page.locator('#cfg-editor').inputValue()).toContain('imported-config-sprite');
  await page.locator('#btn-cfg-apply').click();
  await expect(page.locator('#config-modal')).not.toHaveClass(/open/);

  await page.locator('#file-input').setInputFiles(await importSheetPayload(page));
  await page.locator('#btn-slice').click();
  await expect(page.locator('#slice-info')).toContainText('2 frames');

  const restored = await page.evaluate(() => window.__spriteFanTest.getConfig());
  expect(restored).toMatchObject({
    frameW: 9,
    frameH: 9,
    straySize: 4,
    jitterThresh: 6,
    outlineRadius: 1,
    softenRadius: 1,
    exportCols: 2,
    exportPad: 0,
    noPad: true,
    manifestName: 'imported-config-sprite',
    manifestFps: 18,
    maxAutoFitZoom: 6,
  });
  expect(restored.frameMeta[0]).toMatchObject({ label: 'import-a', notes: 'from config file', anchor: { x: 4, y: 8 } });
  expect(restored.frameMeta[1]).toMatchObject({ label: 'import-b', notes: 'second from file', anchor: { x: 5, y: 8 } });

  await page.locator('button[data-wf="export"]').click();
  await page.locator('#btn-repack').click();
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getCanvasSize())).toEqual({ width: 18, height: 9 });
});
