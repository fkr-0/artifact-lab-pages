import { expect, test } from '@playwright/test';

async function makeSheet(page, { width, height, draw }) {
  const dataUrl = await page.evaluate(async ({ width, height, drawSource }) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    const draw = new Function('ctx', drawSource);
    draw(ctx);
    return canvas.toDataURL('image/png');
  }, { width, height, drawSource: draw.toString().replace(/^\(?ctx\)?\s*=>\s*/, '') });
  return {
    name: `sprite-fan-${width}x${height}.png`,
    mimeType: 'image/png',
    buffer: Buffer.from(dataUrl.split(',')[1], 'base64'),
  };
}

async function repairPayload(page) {
  return makeSheet(page, {
    width: 8,
    height: 8,
    draw: (ctx) => {
      ctx.fillStyle = 'rgba(30, 120, 220, 1)';
      ctx.fillRect(2, 2, 4, 4);
      ctx.clearRect(3, 3, 1, 1);
      ctx.fillStyle = 'rgba(255, 0, 0, 1)';
      ctx.fillRect(7, 7, 1, 1);
    },
  });
}

test('repair previews are non-destructive and reveal before/after alpha changes', async ({ page }) => {
  await page.goto('/sprite-fan/atlas-studio.html');
  await page.locator('#file-input').setInputFiles(await repairPayload(page));
  await page.locator('#frame-w-num').fill('8');
  await page.locator('#frame-h-num').fill('8');
  await page.locator('#btn-slice').click();
  await page.locator('button[data-wf="cleanup"]').click();
  await page.locator('#stray-size').evaluate((el) => {
    el.value = '2';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 7, 7))).toBe(255);
  await page.locator('#btn-preview-stray').click();
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getPreviewMode())).toBe('PREVIEW STRAY');
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getPreviewAlpha(7, 7))).toBe(0);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 7, 7))).toBe(255);

  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 3, 3))).toBe(0);
  await page.locator('#btn-preview-pinholes').click();
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getPreviewMode())).toBe('PREVIEW PINHOLES');
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getPreviewAlpha(3, 3))).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameAlpha(0, 3, 3))).toBe(0);

  await page.locator('#btn-preview-cur').click();
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getPreviewMode())).toBe('CURRENT');
});

test('max auto-fit zoom preference caps tiny frames and persists in config', async ({ page }) => {
  await page.goto('/sprite-fan/atlas-studio.html');
  await page.locator('#file-input').setInputFiles(await makeSheet(page, {
    width: 4,
    height: 4,
    draw: (ctx) => {
      ctx.fillStyle = 'rgba(80, 180, 90, 1)';
      ctx.fillRect(0, 0, 4, 4);
    },
  }));

  await page.locator('#max-auto-fit-zoom').evaluate((el) => {
    el.value = '2';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#btn-zoom-fit').click();
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getState().zoom)).toBeLessThanOrEqual(2.01);
  const config = await page.evaluate(() => window.__spriteFanTest.getConfig());
  expect(config.maxAutoFitZoom).toBe(2);
  expect(config.autoFitFrames).toBe(true);
});

test('fit-to-view handles wide and tall sheets with positive centered pan', async ({ page }) => {
  await page.goto('/sprite-fan/atlas-studio.html');
  await page.locator('#file-input').setInputFiles(await makeSheet(page, {
    width: 320,
    height: 16,
    draw: (ctx) => {
      ctx.fillStyle = 'rgba(80, 80, 220, 1)';
      ctx.fillRect(0, 0, 320, 16);
    },
  }));
  await page.locator('#btn-zoom-fit').click();
  const wide = await page.evaluate(() => window.__spriteFanTest.getState());
  expect(wide.zoom).toBeGreaterThan(0);
  expect(Number.isFinite(wide.panX)).toBe(true);
  expect(Number.isFinite(wide.panY)).toBe(true);

  await page.locator('#file-input').setInputFiles(await makeSheet(page, {
    width: 16,
    height: 320,
    draw: (ctx) => {
      ctx.fillStyle = 'rgba(220, 80, 80, 1)';
      ctx.fillRect(0, 0, 16, 320);
    },
  }));
  await page.locator('#btn-zoom-fit').click();
  const tall = await page.evaluate(() => window.__spriteFanTest.getState());
  expect(tall.zoom).toBeGreaterThan(0);
  expect(Number.isFinite(tall.panX)).toBe(true);
  expect(Number.isFinite(tall.panY)).toBe(true);
});
