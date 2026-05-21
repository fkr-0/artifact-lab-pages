import { expect, test } from '@playwright/test';

async function previewSubsetPayload(page) {
  const dataUrl = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 32, 8);
    ctx.fillStyle = 'rgba(80, 140, 230, 1)';
    ctx.fillRect(1, 1, 5, 5);
    ctx.fillStyle = 'rgba(230, 120, 80, 1)';
    ctx.fillRect(9, 1, 5, 5);
    ctx.fillStyle = 'rgba(120, 220, 90, 1)';
    ctx.fillRect(17, 1, 5, 5);
    ctx.fillStyle = 'rgba(220, 220, 90, 1)';
    ctx.fillRect(25, 1, 5, 5);
    return canvas.toDataURL('image/png');
  });
  return {
    name: 'sprite-fan-animation-preview-subset.png',
    mimeType: 'image/png',
    buffer: Buffer.from(dataUrl.split(',')[1], 'base64'),
  };
}

test('timeline preview subset marks frames and playback loops only selected frames', async ({ page }) => {
  await page.goto('/sprite-fan/atlas-studio.html');
  await page.locator('#file-input').setInputFiles(await previewSubsetPayload(page));
  await page.locator('#frame-w-num').fill('8');
  await page.locator('#frame-h-num').fill('8');
  await page.locator('#btn-slice').click();
  await expect(page.locator('#slice-info')).toContainText('4 frames');

  await expect(page.locator('#tl-preview-info')).toHaveText('Preview: all');
  await page.evaluate(() => window.__spriteFanTest.togglePreviewFrame(0));
  await page.evaluate(() => window.__spriteFanTest.togglePreviewFrame(2));
  await expect(page.locator('#tl-preview-info')).toHaveText('Preview: 1,3');
  await expect(page.locator('.tl-frame.preview-selected')).toHaveCount(2);
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getPreviewSequence())).toEqual([0, 2]);

  await page.locator('#tl-fps').fill('30');
  await page.evaluate(() => window.__spriteFanTest.selectFrame(0));
  await page.locator('#btn-tl-next').click();
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getState().selectedFrame)).toBe(2);
  await page.locator('#btn-tl-next').click();
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getState().selectedFrame)).toBe(0);
  await page.locator('#btn-tl-play').click();
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getState().playing)).toBe(true);
  await page.locator('#btn-tl-play').click();
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getState().playing)).toBe(false);

  await page.locator('#btn-tl-clear').click();
  await expect(page.locator('#tl-preview-info')).toHaveText('Preview: all');
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getPreviewSequence())).toEqual([]);
});
