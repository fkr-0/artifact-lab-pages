import { expect, test } from '@playwright/test';

test.describe('modernized authoring studios', () => {
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
    await expect(page.locator('.type-scene')).toHaveCount(0);
    await page.click('[data-action="redo"]');
    await expect(page.locator('.type-scene')).toHaveCount(1);

    await page.click('[data-action="toggle-focus"]');
    await expect(page.locator('body')).toHaveClass(/preview-mode/);
    await expect(page.locator('#focusButton')).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Escape');
    await expect(page.locator('body')).not.toHaveClass(/preview-mode/);

    expect(errors).toEqual([]);
  });
});
