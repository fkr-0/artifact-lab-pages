import { expect, test } from '@playwright/test';

test.describe('modernized authoring studios', () => {
  test('catalog sharepic text layers and inspector sliders update the visible composition', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.goto('/spc/procedural_sharepic_studio.html');
    await expect(page.locator('#preview')).toBeVisible();

    const geometry = await page.evaluate(() => {
      const preview = document.getElementById('preview').getBoundingClientRect();
      const stage = document.getElementById('stage').getBoundingClientRect();
      return {
        preview: { x: preview.x, y: preview.y, width: preview.width, height: preview.height },
        stage: { x: stage.x, y: stage.y, width: stage.width, height: stage.height },
      };
    });
    expect(geometry.stage.x).toBeCloseTo(geometry.preview.x, 1);
    expect(geometry.stage.y).toBeCloseTo(geometry.preview.y, 1);
    expect(geometry.stage.width).toBeCloseTo(geometry.preview.width, 1);
    expect(geometry.stage.height).toBeCloseTo(geometry.preview.height, 1);

    await page.click('[data-tab="layers"]');
    await page.click('#btn-add-text');
    await expect(page.locator('#stage .el.text')).toHaveCount(1);
    await expect(page.locator('#stage .text-edit')).toBeVisible();
    await page.locator('#stage .text-edit').fill('INLINE TEXT WORKS');
    await page.locator('#stage .text-edit').blur();

    await page.click('[data-tab="inspector"]');
    const textInput = page.locator('#inp-text');
    await expect(textInput).toHaveValue('INLINE TEXT WORKS');
    await textInput.fill('SHAREPIC');
    await textInput.press('Home');
    await textInput.type('LIVE ');
    await expect(textInput).toHaveValue('LIVE SHAREPIC');
    await expect(page.locator('#stage .text-display')).toHaveText('LIVE SHAREPIC');
    await expect.poll(() => page.evaluate(() => sel().text)).toBe('LIVE SHAREPIC');

    await page.locator('#inp-opacity').fill('0.35');
    await expect.poll(() => page.evaluate(() => sel().opacity)).toBe(0.35);
    await expect(page.locator('#stage .el')).toHaveCSS('opacity', '0.35');

    await page.locator('#inp-radius').fill('55');
    await expect.poll(() => page.evaluate(() => sel().radius)).toBe(55);
    await expect(page.locator('#stage .box')).toHaveCSS('border-radius', '55px');

    await page.locator('#inp-stroke-width').fill('12');
    await expect.poll(() => page.evaluate(() => sel().strokeWidth)).toBe(12);
    await expect.poll(() => page.evaluate(() => document.querySelector('#stage .text-display').style.webkitTextStroke)).toContain('12px');
    await expect.poll(() => page.evaluate(() => document.getElementById('inp-stroke-width').style.getPropertyValue('--fill-pct'))).toBe('50%');

    await page.click('[data-tab="tune"]');
    await page.locator('#slider-disruptFactor').fill('65');
    await expect.poll(() => page.evaluate(() => state.disruptFactor)).toBe(65);
    await expect.poll(() => page.evaluate(() => document.getElementById('slider-disruptFactor').style.getPropertyValue('--fill-pct'))).toBe('65%');

    expect(errors).toEqual([]);
  });

  test('procedural studio keeps all tabs visible, caches base art, and round-trips Base64 URL state', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 820 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.goto('/procedural-sharepic-studio.html');
    await expect(page.locator('.tab-btn')).toHaveCount(6);
    const tabGeometry = await page.locator('.tab-btn').evaluateAll(nodes => ({
      rows: [...new Set(nodes.map(node => Math.round(node.getBoundingClientRect().top)))],
      allInside: nodes.every(node => {
        const rect = node.getBoundingClientRect();
        const bar = node.parentElement.getBoundingClientRect();
        return rect.left >= bar.left - 1 && rect.right <= bar.right + 1 && rect.top >= bar.top - 1 && rect.bottom <= bar.bottom + 1;
      }),
    }));
    expect(tabGeometry.rows).toHaveLength(2);
    expect(tabGeometry.allInside).toBe(true);

    await page.click('[data-tab="tune"]');
    await expect(page.locator('.effect-fader')).toHaveCount(10);
    await page.waitForTimeout(180);
    const beforeEffect = await page.evaluate(() => ({
      preview: previewRenderCount,
      base: previewBaseRenderCount,
    }));
    await page.locator('#slider-blur').fill('8');
    await page.locator('#slider-grain').fill('24');
    await expect.poll(() => page.evaluate(() => previewRenderCount)).toBeGreaterThan(beforeEffect.preview);
    await page.waitForTimeout(80);
    expect(await page.evaluate(() => previewBaseRenderCount)).toBe(beforeEffect.base);
    await expect(page.locator('#number-blur')).toHaveValue('8');

    const burstPerformance = await page.evaluate(async () => {
      const input = document.getElementById('slider-grain');
      const before = { preview: previewRenderCount, base: previewBaseRenderCount };
      for (let value = 1; value <= 50; value += 1) {
        input.value = String(value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return {
        previewDelta: previewRenderCount - before.preview,
        baseDelta: previewBaseRenderCount - before.base,
        value: state.grain,
      };
    });
    expect(burstPerformance.previewDelta).toBeLessThanOrEqual(1);
    expect(burstPerformance.baseDelta).toBe(0);
    expect(burstPerformance.value).toBe(50);

    await page.locator('#number-blur').fill('6');
    await expect.poll(() => page.evaluate(() => state.blur)).toBe(6);
    await page.click('#reset-blur');
    await expect.poll(() => page.evaluate(() => state.blur)).toBe(0);

    const baseBeforeStructure = await page.evaluate(() => previewBaseRenderCount);
    await page.locator('#slider-complexity').fill('12');
    await expect.poll(() => page.evaluate(() => previewBaseRenderCount)).toBeGreaterThan(baseBeforeStructure);

    await page.click('[data-tab="content"]');
    await page.locator('label:has(#content-enabled)').click();
    await page.locator('#content-heading').fill('Ästhetik · 東京 · URL state');
    await page.click('[data-tab="tune"]');
    await page.locator('#slider-scanlines').fill('37');
    await expect.poll(() => page.evaluate(() => {
      const encoded = new URL(location.href).searchParams.get('state');
      return encoded ? decodeStudioState(encoded).scanlines : null;
    })).toBe(37);

    const encodedState = await page.evaluate(() => {
      const encoded = new URL(location.href).searchParams.get('state');
      const decoded = decodeStudioState(encoded);
      return { encoded, heading: decoded.content.heading, scanlines: decoded.scanlines };
    });
    expect(encodedState.encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(encodedState.heading).toBe('Ästhetik · 東京 · URL state');
    expect(encodedState.scanlines).toBe(37);

    await page.click('[data-tab="export"]');
    await page.selectOption('#export-preset', '1');
    await expect.poll(() => page.evaluate(() => canvas.height > canvas.width)).toBe(true);
    await page.click('#btn-share-state');
    await expect(page.locator('#toast')).toContainText(/Share URL copied|Could not copy/);

    const sharedUrl = page.url();
    const clone = await context.newPage();
    const cloneErrors = [];
    clone.on('pageerror', error => cloneErrors.push(error.message));
    await clone.addInitScript(() => {
      localStorage.setItem('procedural-sharepic-studio-state-v6', JSON.stringify({
        type: 'hardRects',
        theme: 'newsprint',
        scanlines: 0,
        content: { heading: 'LOCAL STORAGE MUST LOSE' },
      }));
    });
    await clone.goto(sharedUrl);
    await expect.poll(() => clone.evaluate(() => state.content.heading)).toBe('Ästhetik · 東京 · URL state');
    await expect.poll(() => clone.evaluate(() => state.scanlines)).toBe(37);
    await expect.poll(() => clone.evaluate(() => state.selectedPreset)).toBe(1);
    expect(cloneErrors).toEqual([]);
    expect(errors).toEqual([]);
    await context.close();
  });

  test('procedural sharepic flushes pending text edits before undo and survives unavailable local storage', async ({ browser }) => {
    const normalPage = await browser.newPage();
    await normalPage.goto('/procedural-sharepic-studio.html');
    await normalPage.click('[data-tab="content"]');
    await normalPage.locator('label:has(#content-enabled)').click();
    await normalPage.locator('#content-heading').fill('BEFORE');
    await normalPage.waitForTimeout(400);
    await normalPage.locator('#content-heading').fill('AFTER');
    await normalPage.keyboard.press(process.platform === 'darwin' ? 'Meta+Z' : 'Control+Z');
    await expect.poll(() => normalPage.evaluate(() => state.content.heading)).toBe('BEFORE');
    await normalPage.keyboard.press(process.platform === 'darwin' ? 'Meta+Shift+Z' : 'Control+Shift+Z');
    await expect.poll(() => normalPage.evaluate(() => state.content.heading)).toBe('AFTER');
    await normalPage.close();

    const blockedPage = await browser.newPage();
    const errors = [];
    blockedPage.on('pageerror', error => errors.push(error.message));
    await blockedPage.addInitScript(() => {
      Storage.prototype.setItem = function setItem() {
        throw new DOMException('Storage denied for test', 'SecurityError');
      };
    });
    await blockedPage.goto('/procedural-sharepic-studio.html');
    await blockedPage.click('[data-tab="content"]');
    await blockedPage.locator('label:has(#content-enabled)').click();
    await blockedPage.locator('#content-heading').fill('STILL EDITABLE');
    await expect.poll(() => blockedPage.evaluate(() => state.content.heading)).toBe('STILL EDITABLE');
    await expect(blockedPage.locator('#save-state')).toContainText('Local save unavailable');
    expect(errors).toEqual([]);
    await blockedPage.close();
  });

  test('catalog sharepic undo and redo cover layer creation, text edits, and inspector sliders', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.goto('/spc/procedural_sharepic_studio.html');
    await page.click('[data-tab="layers"]');
    await page.click('#btn-add-text');
    await expect(page.locator('#stage .el.text')).toHaveCount(1);

    await page.click('#btn-undo');
    await expect(page.locator('#stage .el')).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => state.elements.length)).toBe(0);
    await page.click('#btn-redo');
    await expect(page.locator('#stage .el.text')).toHaveCount(1);

    await page.click('[data-tab="inspector"]');
    await page.locator('#inp-text').fill('UNDOABLE SHAREPIC');
    await page.locator('#inp-text').blur();
    await expect(page.locator('#stage .text-display')).toHaveText('UNDOABLE SHAREPIC');
    await page.click('#btn-undo');
    await expect.poll(() => page.evaluate(() => sel().text)).toBe('DOUBLE TAP TO EDIT');
    await page.click('#btn-redo');
    await expect.poll(() => page.evaluate(() => sel().text)).toBe('UNDOABLE SHAREPIC');

    await page.locator('#inp-opacity').fill('0.4');
    await page.locator('#inp-opacity').blur();
    await expect.poll(() => page.evaluate(() => sel().opacity)).toBe(0.4);
    await page.click('#btn-undo');
    await expect.poll(() => page.evaluate(() => sel().opacity)).toBe(1);
    await page.click('#btn-redo');
    await expect.poll(() => page.evaluate(() => sel().opacity)).toBe(0.4);

    expect(errors).toEqual([]);
  });

  test('procedural sharepic supports recipes, reversible edits, preview aids, and export configuration', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.goto('/procedural-sharepic-studio.html');
    await expect(page.locator('#preview')).toBeVisible();
    await expect(page.locator('#save-state')).toContainText('Autosaved');

    const initialType = await page.evaluate(() => state.type);
    await page.selectOption('#recipe-select', { label: 'Street Poster' });
    await page.click('#btn-apply-recipe');
    await expect.poll(() => page.evaluate(() => state.type)).toBe('sprayField');

    await page.click('#btn-safe-area');
    await expect(page.locator('#safe-area-overlay')).toHaveClass(/visible/);
    await expect(page.locator('#btn-safe-area')).toHaveAttribute('aria-pressed', 'true');

    await page.click('#btn-undo');
    await expect.poll(() => page.evaluate(() => state.type)).toBe(initialType);
    await page.click('#btn-redo');
    await expect.poll(() => page.evaluate(() => state.type)).toBe('sprayField');

    await page.click('[data-type="contourMap"]');
    await expect.poll(() => page.evaluate(() => state.type)).toBe('contourMap');
    await page.click('[data-tab="palette"]');
    await page.selectOption('#palette-adapter', 'triadic');
    await page.locator('#slider-hueShift').fill('35');
    await expect.poll(() => page.evaluate(() => state.paletteAdapter)).toBe('triadic');
    await expect(page.locator('#palette-info-card')).toContainText('Triadic wheel');

    await page.click('[data-tab="tune"]');
    await page.selectOption('#procedural-profile', 'kinetic');
    await page.click('#btn-apply-profile');
    await expect.poll(() => page.evaluate(() => state.flow)).toBe(92);

    await page.click('[data-tab="content"]');
    await page.locator('label:has(#content-enabled)').click();
    await expect(page.locator('.type-preset')).toHaveCount(6);
    await page.click('[data-preset="editorial"]');
    await expect.poll(() => page.evaluate(() => state.content.headingFont)).toBe('editorial');
    await expect(page.locator('#content-heading-font')).toHaveValue('editorial');

    const proceduralSweep = await page.evaluate(() => {
      const types = ['contourMap', 'voronoiShards', 'lissajousRibbons', 'cellularAutomata', 'guilloche'];
      const adapters = Object.keys(paletteAdapters);
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 320;
      const rendered = types.map(type => {
        generate(canvas, { ...state, type, complexity: 8, density: 7, scale: 8 });
        return type;
      });
      const adapted = adapters.map(paletteAdapter => activeTheme({ ...state, paletteAdapter }).colors.length);
      return { rendered, adapted };
    });
    expect(proceduralSweep.rendered).toHaveLength(5);
    expect(proceduralSweep.adapted.every(count => count > 0)).toBe(true);

    await page.click('[data-tab="export"]');
    await page.locator('label:has(#export-custom)').click();
    await page.fill('#export-width', '1440');
    await page.fill('#export-height', '1800');
    await page.selectOption('#export-format', 'webp');
    await expect(page.locator('#export-info')).toContainText('1440 × 1800');
    await expect(page.locator('#export-info')).toContainText('WEBP');

    expect(errors).toEqual([]);
  });

  test('storyboard supports structural templates, scene editing, search, history, and focus mode', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.goto('/storyboard-studio/');
    await expect(page.locator('#documentPreview')).toBeVisible();
    await expect(page.locator('#docHealth')).toContainText('blocks');

    await page.selectOption('#designPresetSelect', { label: 'Technical dossier' });
    await page.click('[data-action="apply-design-preset"]');
    await expect(page.locator('#documentPreview')).toHaveClass(/type-technical/);
    await expect(page.locator('#documentPreview')).toHaveClass(/image-mono/);
    await expect(page.locator('#documentPreview')).toHaveClass(/rhythm-compact/);

    await page.selectOption('#templateSelect', { label: 'Character dossier' });
    await page.click('[data-action="apply-template"]');
    await expect(page.locator('.type-character')).toHaveCount(3);

    await page.click('[data-action="add-scene"]');
    await expect(page.locator('.type-scene')).toHaveCount(1);
    await page.fill('#blockMetaInput', 'Scene 07 · rooftop · blue hour');
    await expect(page.locator('.scene-kicker')).toContainText('rooftop');

    await page.fill('#blockSearchInput', 'rooftop');
    await expect(page.locator('.block-row')).toHaveCount(1);
    await page.fill('#blockSearchInput', '');

    await page.click('[data-action="undo"]');
    await expect(page.locator('.type-scene')).toHaveCount(1);
    await expect(page.locator('.scene-kicker')).not.toContainText('rooftop');
    await page.click('[data-action="undo"]');
    await expect(page.locator('.type-scene')).toHaveCount(0);
    await page.click('[data-action="redo"]');
    await expect(page.locator('.type-scene')).toHaveCount(1);
    await page.click('[data-action="redo"]');
    await expect(page.locator('.scene-kicker')).toContainText('rooftop');

    await page.click('[data-action="toggle-focus"]');
    await expect(page.locator('body')).toHaveClass(/preview-mode/);
    await expect(page.locator('#focusButton')).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Escape');
    await expect(page.locator('body')).not.toHaveClass(/preview-mode/);

    expect(errors).toEqual([]);
  });

  test('storyboard flushes pending edits before undo and remains editable without local storage', async ({ browser }) => {
    const normalPage = await browser.newPage();
    await normalPage.goto('/storyboard-studio/');
    await normalPage.locator('#titleInput').fill('BEFORE');
    await normalPage.waitForTimeout(450);
    await normalPage.locator('#titleInput').fill('AFTER');
    await normalPage.keyboard.press(process.platform === 'darwin' ? 'Meta+Z' : 'Control+Z');
    await expect.poll(() => normalPage.evaluate(() => state.title)).toBe('BEFORE');
    await normalPage.keyboard.press(process.platform === 'darwin' ? 'Meta+Shift+Z' : 'Control+Shift+Z');
    await expect.poll(() => normalPage.evaluate(() => state.title)).toBe('AFTER');
    await normalPage.close();

    const blockedPage = await browser.newPage();
    const errors = [];
    blockedPage.on('pageerror', error => errors.push(error.message));
    await blockedPage.addInitScript(() => {
      Storage.prototype.setItem = function setItem() {
        throw new DOMException('Storage denied for test', 'SecurityError');
      };
    });
    await blockedPage.goto('/storyboard-studio/');
    await blockedPage.locator('#titleInput').fill('STILL EDITABLE');
    await expect(blockedPage.locator('#previewTitle')).toHaveText('STILL EDITABLE');
    await expect(blockedPage.locator('#docHealth')).toContainText('Local save unavailable');
    expect(errors).toEqual([]);
    await blockedPage.close();
  });
});
