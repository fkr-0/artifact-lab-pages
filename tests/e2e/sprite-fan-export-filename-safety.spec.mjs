import { expect, test } from '@playwright/test';

async function oneFramePayload(page) {
  const dataUrl = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 8, 8);
    ctx.fillStyle = 'rgba(80, 160, 220, 1)';
    ctx.fillRect(2, 2, 4, 5);
    return canvas.toDataURL('image/png');
  });
  return {
    name: 'one-frame.png',
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

test('path-like sprite names produce safe filenames while preserving manifest display name', async ({ page }) => {
  await page.goto('/sprite-fan/atlas-studio.html');
  await page.locator('#file-input').setInputFiles(await oneFramePayload(page));
  await page.locator('#frame-w-num').fill('8');
  await page.locator('#frame-h-num').fill('8');
  await page.locator('#btn-slice').click();
  await expect(page.locator('#slice-info')).toContainText('1 frames');

  await page.locator('button[data-wf="export"]').click();
  await page.locator('#manifest-name').fill('../../ Hero / Idle ');
  await page.locator('#manifest-name').dispatchEvent('input');

  await expect(page.locator('#export-preview')).toContainText('Hero_Idle_sheet.png');
  await expect(page.locator('#export-preview')).toContainText('Hero_Idle_sprites.json');
  await expect(page.locator('#export-preview')).not.toContainText('../');

  const manifestDownloadPromise = page.waitForEvent('download');
  await page.locator('#btn-export-manifest').click();
  const manifestDownload = await manifestDownloadPromise;
  expect(manifestDownload.suggestedFilename()).toBe('Hero_Idle_sprites.json');
  const manifest = await readDownloadJson(manifestDownload);
  expect(manifest.name).toBe('../../ Hero / Idle');

  await page.locator('#btn-assist-ethic-core').click();
  await expect(page.locator('#export-preview')).toContainText('Hero_Idle_ethic-brawl-core_p01.png');
  await expect(page.locator('#export-preview')).toContainText('Hero_Idle_ethic-brawl-core_manifest.json');
  await expect(page.locator('#export-preview')).not.toContainText('../');

  await page.evaluate(() => {
    window.__spriteFanDownloadNames = [];
    const originalClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function patchedClick() {
      window.__spriteFanDownloadNames.push(this.download || '');
      return undefined;
    };
    window.__restoreAnchorClick = () => {
      HTMLAnchorElement.prototype.click = originalClick;
    };
  });

  await page.locator('#btn-assist-export').click();
  expect(await page.evaluate(() => window.__spriteFanDownloadNames)).toEqual([
    'Hero_Idle_ethic-brawl-core_p01.png',
    'Hero_Idle_ethic-brawl-core_manifest.json',
  ]);
  await page.evaluate(() => window.__restoreAnchorClick?.());
});
