import { expect, test } from '@playwright/test';

async function pngPayload(page, name, drawSource) {
  const dataUrl = await page.evaluate(async (source) => {
    const draw = new Function('canvas', source);
    const canvas = document.createElement('canvas');
    draw(canvas);
    return canvas.toDataURL('image/png');
  }, drawSource.toString().replace(/^\(?canvas\)?\s*=>\s*/, ''));
  return {
    name,
    mimeType: 'image/png',
    buffer: Buffer.from(dataUrl.split(',')[1], 'base64'),
  };
}

async function simpleAlphaCleanupPayload(page) {
  return pngPayload(page, 'alpha-cleanup.png', (canvas) => {
    canvas.width = 10;
    canvas.height = 10;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgb(255,255,255)';
    ctx.fillRect(0, 0, 10, 10);
    ctx.fillStyle = 'rgb(20,40,200)';
    ctx.fillRect(3, 3, 4, 4);
  });
}

async function dualBgPayloads(page) {
  const common = (bg) => `(canvas) => {
    canvas.width = 6;
    canvas.height = 6;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgb(${bg},${bg},${bg})';
    ctx.fillRect(0, 0, 6, 6);
    ctx.fillStyle = 'rgb(${Math.round(120 * 0.5 + bg * 0.5)},${Math.round(40 * 0.5 + bg * 0.5)},${Math.round(200 * 0.5 + bg * 0.5)})';
    ctx.fillRect(2, 2, 2, 2);
  }`;
  return [
    await pngPayload(page, 'dual-white.png', common(255)),
    await pngPayload(page, 'dual-black.png', common(0)),
  ];
}

async function islandPayload(page) {
  return pngPayload(page, 'islands.png', (canvas) => {
    canvas.width = 18;
    canvas.height = 10;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 18, 10);
    ctx.fillStyle = 'rgb(30,180,90)';
    ctx.fillRect(2, 2, 4, 4);
    ctx.fillStyle = 'rgb(200,50,90)';
    ctx.fillRect(11, 3, 4, 4);
  });
}

test('atlas studio alpha cleanup makes white matte transparent', async ({ page }) => {
  await page.goto('/sprite-fan/atlas-studio.html');
  await page.locator('#file-input').setInputFiles(await simpleAlphaCleanupPayload(page));

  await page.locator('button[data-wf="cleanup"]').click();
  await page.locator('#tolerance').evaluate((el) => {
    el.value = '28';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#btn-clean-run').click();

  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getCurrentAlpha(0, 0))).toBe(0);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getCurrentAlpha(4, 4))).toBe(255);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameMetrics(-1).bbox)).toEqual({ x: 3, y: 3, w: 4, h: 4 });
});

test('atlas studio dual-background extraction creates a transparent sprite', async ({ page }) => {
  await page.goto('/sprite-fan/atlas-studio.html');
  await page.locator('#btn-dual-toggle').click();
  await page.locator('button[data-wf="cleanup"]').click();
  const [whitePayload, blackPayload] = await dualBgPayloads(page);
  await page.locator('#white-file').setInputFiles(whitePayload);
  await page.locator('#black-file').setInputFiles(blackPayload);

  await page.locator('#btn-dual-extract').click();
  await expect(page.locator('#info-size')).toContainText('6x6');

  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getCurrentAlpha(0, 0))).toBe(0);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getCurrentAlpha(2, 2))).toBeGreaterThan(120);
  const rgba = await page.evaluate(() => window.__spriteFanTest.getCurrentRgba(2, 2));
  expect(rgba[0]).toBeGreaterThan(80);
  expect(rgba[2]).toBeGreaterThan(130);
});

test('atlas studio detects islands and repacks them into an exportable sheet', async ({ page }) => {
  await page.goto('/sprite-fan/atlas-studio.html');
  await page.locator('#file-input').setInputFiles(await islandPayload(page));
  await page.locator('button[data-wf="cleanup"]').click();
  await page.locator('#merge-distance').evaluate((el) => {
    el.value = '0';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#btn-detect').click();

  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getState().detectedGroups)).toBe(2);
  const groups = await page.evaluate(() => window.__spriteFanTest.getDetectedGroups());
  expect(groups[0]).toMatchObject({ minX: 2, minY: 2, width: 4, height: 4 });
  expect(groups[1]).toMatchObject({ minX: 11, minY: 3, width: 4, height: 4 });

  await page.locator('button[data-wf="import"]').click();
  await page.locator('#frame-w-num').fill('9');
  await page.locator('#frame-h-num').fill('10');
  await page.locator('#btn-slice').click();
  await expect(page.locator('#slice-info')).toContainText('2 frames');

  await page.locator('button[data-wf="export"]').click();
  await page.locator('#export-cols').evaluate((el) => {
    el.value = '1';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#chk-no-pad').check();
  await page.locator('#btn-repack').click();

  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getCanvasSize())).toEqual({ width: 9, height: 20 });
});
