import { expect, test } from '@playwright/test';

async function reviewSheetPayload(page) {
  const dataUrl = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 16, 8);

    // Frame 1: reference 3x3 block centered around 3,3.
    ctx.fillStyle = 'rgba(40, 160, 220, 1)';
    ctx.fillRect(2, 2, 3, 3);

    // Frame 2: same block shifted right/down, plus a single stray pixel.
    ctx.fillStyle = 'rgba(40, 160, 220, 1)';
    ctx.fillRect(12, 3, 3, 3);
    ctx.fillStyle = 'rgba(255, 0, 0, 1)';
    ctx.fillRect(15, 7, 1, 1);

    return canvas.toDataURL('image/png');
  });
  return {
    name: 'sprite-fan-review.png',
    mimeType: 'image/png',
    buffer: Buffer.from(dataUrl.split(',')[1], 'base64'),
  };
}

test('atlas studio review mode tracks issues, metadata, and pixel-shift jitter fixing', async ({ page }) => {
  await page.goto('/sprite-fan/atlas-studio.html');
  await page.locator('#file-input').setInputFiles(await reviewSheetPayload(page));
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
    el.value = '8';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  await expect(page.locator('#keyboard-help')).toContainText('I next issue');
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getReviewIssues().length)).toBeGreaterThan(0);

  await page.locator('#btn-next-issue').click();
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getState().selectedFrame)).toBe(1);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getReviewText())).toContain('stray');

  await page.locator('#frame-label').fill('walk-east-issue');
  await page.locator('#frame-notes').fill('contains stray and center jitter before cleanup');
  const config = await page.evaluate(() => window.__spriteFanTest.getConfig());
  expect(config.frameMeta[1]).toMatchObject({
    label: 'walk-east-issue',
    notes: 'contains stray and center jitter before cleanup',
  });

  const before = await page.evaluate(() => window.__spriteFanTest.getFrameMetrics(1).center);
  await page.locator('#chk-jitter-shift').check();
  await page.locator('#btn-fix-jitter').click();
  const after = await page.evaluate(() => window.__spriteFanTest.getFrameMetrics(1).center);
  expect(Math.abs(after.x - before.x)).toBeGreaterThan(0.5);
  expect(Math.abs(after.y - before.y)).toBeGreaterThan(0.5);

  await page.keyboard.press('Shift+I');
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getState().selectedFrame)).toBe(1);
});
