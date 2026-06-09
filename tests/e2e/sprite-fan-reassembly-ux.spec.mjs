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

async function twentyFrameSheetPayload(page) {
  return pngPayload(page, 'twenty-frame-sheet.png', (canvas) => {
    const fw = 6;
    const fh = 6;
    const cols = 4;
    const rows = 5;
    canvas.width = fw * cols;
    canvas.height = fh * rows;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < cols * rows; i += 1) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      ctx.fillStyle = `rgb(${40 + (i * 9) % 180},${70 + (i * 13) % 160},${90 + (i * 17) % 140})`;
      ctx.fillRect(col * fw + 1, row * fh + 1, 4, 4);
    }
  });
}

async function loadAndSliceTwentyFrames(page) {
  await page.goto('/sprite-fan/atlas-studio.html');
  await page.locator('#file-input').setInputFiles(await twentyFrameSheetPayload(page));
  await page.locator('button[data-wf="import"]').click();
  await page.locator('#frame-w-num').fill('6');
  await page.locator('#frame-h-num').fill('6');
  await page.locator('#btn-slice').click();
  await expect(page.locator('#slice-info')).toContainText('20 frames');
  await expect.poll(() => page.evaluate(() => window.__spriteFanTest.getState().frames)).toBe(20);
}

test('reassembly UX guides a 20-frame sheet into Badger-compatible 4x4 pages', async ({ page }) => {
  await loadAndSliceTwentyFrames(page);

  await expect(page.locator('#task-order-strip .task-card')).toHaveCount(8);
  await expect(page.locator('#assistant-status')).toContainText('20 frame');
  await expect(page.locator('#info-target')).toContainText('generic');

  await page.locator('#btn-assist-badger').click();
  await expect(page.locator('#info-target')).toContainText('Badger Runner');
  await expect(page.locator('#info-pages')).toContainText('2');
  await expect(page.locator('#contract-page-info')).toContainText('2');
  await expect(page.locator('#export-preview')).toContainText('sprite_badger-runner_p01.png');
  await expect(page.locator('#export-preview')).toContainText('sprite_badger-runner_p02.png');
  await expect(page.locator('#export-preview')).toContainText('sprite_badger-runner_manifest.json');

  await page.locator('button[data-wf="export"]').click();
  await expect(page.locator('#contract-page-map .page-card')).toHaveCount(2);
  await expect(page.locator('#contract-page-map .page-cell.filled')).toHaveCount(20);
  await expect(page.locator('#contract-page-map .page-cell.empty')).toHaveCount(12);

  await page.locator('#contract-page-map .page-cell', { hasText: '18' }).click();
  await expect(page.locator('#tl-frame-info')).toContainText('18/20');
  await expect(page.locator('#contract-page-map .page-cell.selected')).toHaveText('18');
});

test('contract export preview and filenames adapt to Ethic Brawl targets', async ({ page }) => {
  await loadAndSliceTwentyFrames(page);

  await page.locator('#btn-assist-ethic-core').click();
  await page.locator('#manifest-name').fill('hero');
  await page.locator('#manifest-name').dispatchEvent('input');
  await expect(page.locator('#info-target')).toContainText('Ethic Brawl core');
  await expect(page.locator('#export-preview')).toContainText('hero_ethic-brawl-core_p01.png');
  await expect(page.locator('#export-preview')).toContainText('hero_ethic-brawl-core_p02.png');
  await expect(page.locator('#export-preview')).toContainText('hero_ethic-brawl-core_manifest.json');

  await page.evaluate(() => {
    window.__spriteFanDownloadNames = [];
    const originalClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function patchedClick() {
      window.__spriteFanDownloadNames.push(this.download || '');
      return undefined;
    };
    window.__restoreAnchorClick = () => { HTMLAnchorElement.prototype.click = originalClick; };
  });

  await page.locator('#btn-assist-export').click();
  const names = await page.evaluate(() => window.__spriteFanDownloadNames);
  expect(names).toEqual([
    'hero_ethic-brawl-core_p01.png',
    'hero_ethic-brawl-core_p02.png',
    'hero_ethic-brawl-core_manifest.json',
  ]);
  await page.evaluate(() => window.__restoreAnchorClick?.());
});
