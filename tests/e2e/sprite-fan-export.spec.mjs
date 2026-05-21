import { expect, test } from '@playwright/test';

async function exportSheetPayload(page) {
  const dataUrl = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 16, 8);
    ctx.fillStyle = 'rgba(80, 160, 220, 1)';
    ctx.fillRect(1, 1, 5, 5);
    ctx.fillStyle = 'rgba(220, 100, 80, 1)';
    ctx.fillRect(10, 2, 5, 5);
    return canvas.toDataURL('image/png');
  });
  return {
    name: 'sprite-fan-export.png',
    mimeType: 'image/png',
    buffer: Buffer.from(dataUrl.split(',')[1], 'base64'),
  };
}

async function prepareExportFrames(page) {
  await page.goto('/sprite-fan/atlas-studio.html');
  await page.locator('#file-input').setInputFiles(await exportSheetPayload(page));
  await page.locator('#frame-w-num').fill('8');
  await page.locator('#frame-h-num').fill('8');
  await page.locator('#btn-slice').click();
  await expect(page.locator('#slice-info')).toContainText('2 frames');
  await page.evaluate(() => window.__spriteFanTest.setFrameMeta(0, 'idle-a', 'first frame'));
  await page.evaluate(() => window.__spriteFanTest.setFrameMeta(1, 'idle-b', 'second frame'));
  await page.locator('button[data-wf="export"]').click();
  await page.locator('#manifest-name').fill('hero-idle');
  await page.locator('#manifest-fps').evaluate((el) => {
    el.value = '10';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#export-cols').evaluate((el) => {
    el.value = '2';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#chk-no-pad').check();
}

test('atlas studio exports a PNG sheet download', async ({ page }) => {
  await prepareExportFrames(page);
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#btn-export-png').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('hero-idle_sheet.png');
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const bytes = Buffer.concat(chunks);
  expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(bytes.length).toBeGreaterThan(100);
});

test('atlas studio exports sprites.json with frame metadata', async ({ page }) => {
  await prepareExportFrames(page);
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#btn-export-manifest').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('hero-idle_sprites.json');
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const manifest = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  expect(manifest).toMatchObject({
    name: 'hero-idle',
    fps: 10,
    frameWidth: 8,
    frameHeight: 8,
    columns: 2,
    rows: 1,
    frameCount: 2,
    padding: 0,
    generationContract: {
      source: 'sprite-fan/reqs/animation.yml',
      gridVsIndividual: 'atlas-grid',
      maxPromptGrid: { columns: 4, rows: 4, frames: 16 },
      transparentBackground: true,
      stableFrameSize: true,
    },
    grid: {
      columns: 2,
      rows: 1,
      padding: 0,
      frameWidth: 8,
      frameHeight: 8,
      cellWidth: 8,
      cellHeight: 8,
      sheetWidth: 16,
      sheetHeight: 8,
    },
    animation: {
      id: 'hero-idle',
      frames: 2,
      fps: 10,
      order: [0, 1],
      loop: true,
      tags: ['sprite-fan', 'postprocessed', 'atlas-grid'],
      events: [],
      hitboxes: [],
      hurtboxes: [],
    },
    animations: {
      'hero-idle': {
        frames: 2,
        fps: 10,
        order: [0, 1],
        loop: true,
        tags: ['sprite-fan', 'postprocessed', 'atlas-grid'],
        events: [],
        hitboxes: [],
        hurtboxes: [],
      },
    },
  });
  expect(manifest.frames[0]).toMatchObject({ index: 0, col: 0, row: 0, label: 'idle-a', notes: 'first frame' });
  expect(manifest.frames[1]).toMatchObject({ index: 1, col: 1, row: 0, label: 'idle-b', notes: 'second frame' });
  for (const frame of manifest.frames) {
    expect(frame.hash).toMatch(/^[0-9a-f]{8}$/);
    expect(frame.bbox).toEqual(expect.objectContaining({ x: expect.any(Number), y: expect.any(Number), w: expect.any(Number), h: expect.any(Number) }));
    expect(frame.alphaPixels).toBeGreaterThan(0);
    expect(frame.softAlphaPixels).toBeGreaterThanOrEqual(0);
    expect(frame.strayPixels).toBeGreaterThanOrEqual(0);
    expect(frame.pinholePixels).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(frame.issues)).toBe(true);
  }
});

test('atlas studio exports full config with review and fitting preferences', async ({ page }) => {
  await prepareExportFrames(page);
  await page.locator('#max-auto-fit-zoom').evaluate((el) => {
    el.value = '3';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#btn-export-manifest-full').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('sprite-atlas-config.json');
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const config = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  expect(config.manifestName).toBe('hero-idle');
  expect(config.maxAutoFitZoom).toBe(3);
  expect(config.frameMeta[0]).toMatchObject({ label: 'idle-a', notes: 'first frame' });
  expect(config.frameMeta[1]).toMatchObject({ label: 'idle-b', notes: 'second frame' });
});
