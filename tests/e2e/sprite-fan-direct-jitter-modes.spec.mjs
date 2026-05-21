import { expect, test } from '@playwright/test';

async function jitterPayload(page) {
  const dataUrl = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 16, 8);

    // Frame 0 silhouette centered near x=3.5.
    ctx.fillStyle = 'rgba(70, 140, 230, 1)';
    ctx.fillRect(2, 2, 3, 3);

    // Frame 1 silhouette shifted two pixels right inside its 8x8 cell.
    ctx.fillStyle = 'rgba(230, 120, 70, 1)';
    ctx.fillRect(12, 2, 3, 3);

    return canvas.toDataURL('image/png');
  });
  return {
    name: 'sprite-fan-direct-jitter-modes.png',
    mimeType: 'image/png',
    buffer: Buffer.from(dataUrl.split(',')[1], 'base64'),
  };
}

async function loadJitterFrames(page) {
  await page.goto('/sprite-fan/atlas-studio.html');
  await page.locator('#file-input').setInputFiles(await jitterPayload(page));
  await page.locator('#frame-w-num').fill('8');
  await page.locator('#frame-h-num').fill('8');
  await page.locator('#anchor-x-num').evaluate((el) => {
    el.value = '3';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#anchor-y-num').evaluate((el) => {
    el.value = '4';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#btn-slice').click();
  await expect(page.locator('#slice-info')).toContainText('2 frames');
  await page.locator('button[data-wf="cleanup"]').click();
  await page.locator('#jitter-thresh').evaluate((el) => {
    el.value = '0';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

test('direct Fix Jitter adjusts anchors without changing pixels by default', async ({ page }) => {
  await loadJitterFrames(page);
  const before = await page.evaluate(() => ({
    hashes: [window.__spriteFanTest.getFrameHash(0), window.__spriteFanTest.getFrameHash(1)],
    meta: window.__spriteFanTest.getConfig().frameMeta,
    issues: window.__spriteFanTest.getReviewIssues(),
  }));
  expect(before.issues.some((issue) => issue.index === 1 && issue.issues.join(' ').includes('jitter'))).toBe(true);
  expect(before.meta[1].anchor).toEqual({ x: 3, y: 4 });

  await page.locator('#btn-fix-jitter').click();

  const after = await page.evaluate(() => ({
    hashes: [window.__spriteFanTest.getFrameHash(0), window.__spriteFanTest.getFrameHash(1)],
    meta: window.__spriteFanTest.getConfig().frameMeta,
    issues: window.__spriteFanTest.getReviewIssues(),
  }));
  expect(after.hashes).toEqual(before.hashes);
  expect(after.meta[0].anchor).toEqual({ x: 3, y: 4 });
  expect(after.meta[1].anchor).not.toEqual(before.meta[1].anchor);
  expect(after.meta[1].anchor.x).toBeLessThan(before.meta[1].anchor.x);

  await page.locator('#btn-undo').click();
  const undone = await page.evaluate(() => ({
    hashes: [window.__spriteFanTest.getFrameHash(0), window.__spriteFanTest.getFrameHash(1)],
    meta: window.__spriteFanTest.getConfig().frameMeta,
  }));
  expect(undone.hashes).toEqual(before.hashes);
  expect(undone.meta[1].anchor).toEqual(before.meta[1].anchor);
});

test('direct Fix Jitter can shift frame pixels when enabled', async ({ page }) => {
  await loadJitterFrames(page);
  await page.locator('#chk-jitter-shift').check();
  const before = await page.evaluate(() => ({
    hash: window.__spriteFanTest.getFrameHash(1),
    alphaTrailingEdge: window.__spriteFanTest.getFrameAlpha(1, 6, 2),
    alphaAfterTarget: window.__spriteFanTest.getFrameAlpha(1, 2, 2),
    meta: window.__spriteFanTest.getConfig().frameMeta,
  }));
  expect(before.alphaTrailingEdge).toBe(255);
  expect(before.alphaAfterTarget).toBe(0);

  await page.locator('#btn-fix-jitter').click();

  const shifted = await page.evaluate(() => ({
    hash: window.__spriteFanTest.getFrameHash(1),
    alphaOldTrailingEdge: window.__spriteFanTest.getFrameAlpha(1, 6, 2),
    alphaNew: window.__spriteFanTest.getFrameAlpha(1, 2, 2),
    meta: window.__spriteFanTest.getConfig().frameMeta,
  }));
  expect(shifted.hash).not.toBe(before.hash);
  expect(shifted.alphaOldTrailingEdge).toBe(0);
  expect(shifted.alphaNew).toBe(255);
  expect(shifted.meta[1].anchor).toEqual(before.meta[1].anchor);

  await page.locator('#btn-undo').click();
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getFrameHash(1))).toBe(before.hash);
});
