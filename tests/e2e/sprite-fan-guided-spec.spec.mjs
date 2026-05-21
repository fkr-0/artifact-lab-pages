import { expect, test } from '@playwright/test';

async function specPayload(page) {
  const dataUrl = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 16, 8);
    ctx.fillStyle = 'rgba(70, 140, 230, 1)';
    ctx.fillRect(1, 1, 5, 5);
    ctx.fillStyle = 'rgba(230, 120, 70, 1)';
    ctx.fillRect(9, 1, 5, 5);
    return canvas.toDataURL('image/png');
  });
  return {
    name: 'sprite-fan-guided-spec.png',
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

test('guided spec mode reports unfinished reqs and persists through config import/export', async ({ page }) => {
  await page.goto('/sprite-fan/atlas-studio.html');
  await page.locator('button[data-wf="export"]').click();
  await page.locator('#btn-spec-check').click();
  await expect(page.locator('#spec-guide-summary')).toHaveText('Spec: 0/8 done');
  await expect(page.locator('#spec-guide-list')).toContainText('Write the intended sprite');

  await page.locator('#spec-prompt').fill('Two-frame idle loop for a small blue/orange creature, transparent background.');
  await page.locator('#manifest-name').fill('guided-idle');
  await page.locator('#manifest-fps').evaluate((el) => {
    el.value = '8';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  await page.locator('button[data-wf="import"]').click();
  await page.locator('#file-input').setInputFiles(await specPayload(page));
  await page.locator('#frame-w-num').fill('8');
  await page.locator('#frame-h-num').fill('8');
  await page.locator('#btn-slice').click();
  await expect(page.locator('#slice-info')).toContainText('2 frames');

  await page.locator('button[data-wf="export"]').click();
  await page.locator('#export-cols').evaluate((el) => {
    el.value = '2';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#btn-spec-check').click();
  await expect(page.locator('#spec-guide-summary')).toHaveText('Spec: 8/8 done');
  await expect(page.locator('#spec-guide-list')).toContainText('✓ Prompt/goals captured');
  await expect(page.locator('#spec-guide-list')).toContainText('✓ Animation metadata exportable');

  const specState = await exportJson(page, '#btn-export-spec-state');
  expect(specState).toMatchObject({
    version: 1,
    source: 'sprite-fan/reqs/animation.yml',
    prompt: 'Two-frame idle loop for a small blue/orange creature, transparent background.',
    summary: { done: 8, total: 8 },
  });
  expect(specState.items.map((item) => item.id)).toEqual([
    'prompt',
    'frames',
    'grid',
    'stable-size',
    'anchor',
    'review',
    'animation',
    'preview',
  ]);

  const manifest = await exportJson(page, '#btn-export-manifest');
  expect(manifest.specGuide).toMatchObject({ summary: { done: 8, total: 8 } });
  expect(manifest.specGuide.prompt).toContain('Two-frame idle loop');

  await page.locator('#btn-config').click();
  await expect.poll(() => page.locator('#cfg-editor').inputValue()).toContain('specGuide');
  const config = JSON.parse(await page.locator('#cfg-editor').inputValue());
  config.specGuide.prompt = 'Imported guided prompt';
  config.specGuide.items = config.specGuide.items.map((item) => ({ ...item, done: false }));
  config.specGuide.summary = { done: 0, total: config.specGuide.items.length };
  await page.locator('#cfg-editor').fill(JSON.stringify(config, null, 2));
  await page.locator('#btn-cfg-apply').click();
  await expect(page.locator('#spec-prompt')).toHaveValue('Imported guided prompt');
  await expect(page.locator('#spec-guide-summary')).toHaveText('Spec: 0/8 done');
});
