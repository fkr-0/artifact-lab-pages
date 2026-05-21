import { expect, test } from '@playwright/test';

async function multiFrameDirtyPayload(page) {
  const dataUrl = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 16, 8);

    // Frame 0: body, pinhole, stray.
    ctx.fillStyle = 'rgba(70, 140, 230, 1)';
    ctx.fillRect(2, 2, 4, 4);
    ctx.clearRect(3, 3, 1, 1);
    ctx.fillStyle = 'rgba(255, 0, 0, 1)';
    ctx.fillRect(7, 7, 1, 1);

    // Frame 1: body, pinhole, stray.
    ctx.fillStyle = 'rgba(230, 120, 70, 1)';
    ctx.fillRect(10, 2, 4, 4);
    ctx.clearRect(12, 3, 1, 1);
    ctx.fillStyle = 'rgba(255, 0, 0, 1)';
    ctx.fillRect(8, 7, 1, 1);

    return canvas.toDataURL('image/png');
  });
  return {
    name: 'sprite-fan-multiframe-manifest-cleaned.png',
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

async function exportJson(page, selector) {
  const downloadPromise = page.waitForEvent('download');
  await page.locator(selector).click();
  return readDownloadJson(await downloadPromise);
}

test('cleanup-all makes every frame clean in sprites.json and review-report metadata', async ({ page }) => {
  page.on('dialog', async (dialog) => {
    expect(dialog.message()).toContain('Cleanup 2 frame');
    await dialog.accept();
  });

  await page.goto('/sprite-fan/atlas-studio.html');
  await page.locator('#file-input').setInputFiles(await multiFrameDirtyPayload(page));
  await page.locator('#frame-w-num').fill('8');
  await page.locator('#frame-h-num').fill('8');
  await page.locator('#btn-slice').click();
  await expect(page.locator('#slice-info')).toContainText('2 frames');

  await page.locator('button[data-wf="cleanup"]').click();
  await page.locator('#manifest-name').evaluate((el) => {
    el.value = 'multi-manifest-cleaned';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#stray-size').evaluate((el) => {
    el.value = '2';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#jitter-thresh').evaluate((el) => {
    el.value = '99';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  const dirtyHashes = await page.evaluate(() => [
    window.__spriteFanTest.getFrameHash(0),
    window.__spriteFanTest.getFrameHash(1),
  ]);
  await page.locator('#btn-cleanup-all').click();

  const report = await exportJson(page, '#btn-export-review-report');
  expect(report.frameCount).toBe(2);
  expect(report.totals).toMatchObject({ strayPixels: 0, pinholePixels: 0, issueFrames: 0 });

  await page.locator('button[data-wf="export"]').click();
  await page.locator('#chk-no-pad').check();
  await page.locator('#export-cols').evaluate((el) => {
    el.value = '2';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const manifest = await exportJson(page, '#btn-export-manifest');

  expect(manifest).toMatchObject({
    name: 'multi-manifest-cleaned',
    frameCount: 2,
    columns: 2,
    rows: 1,
    padding: 0,
  });

  for (let i = 0; i < 2; i++) {
    const manifestFrame = manifest.frames[i];
    const reportFrame = report.frames[i];
    expect(manifestFrame.hash).toBe(reportFrame.hash);
    expect(manifestFrame.hash).not.toBe(dirtyHashes[i]);
    expect(manifestFrame.bbox).toEqual(reportFrame.bbox);
    expect(manifestFrame.alphaPixels).toBe(reportFrame.pixels);
    expect(manifestFrame.softAlphaPixels).toBe(reportFrame.soft);
    expect(manifestFrame.strayPixels).toBe(0);
    expect(manifestFrame.pinholePixels).toBe(0);
    expect(manifestFrame.issues).toEqual([]);
    expect(reportFrame.issues).toEqual([]);
  }
});
