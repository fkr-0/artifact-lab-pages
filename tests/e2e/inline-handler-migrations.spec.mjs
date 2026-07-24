import { expect, test } from '@playwright/test';

function collectPageErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  return errors;
}

test.describe('inline-handler migrations remain interactive', () => {
  test('NEXUS v9 search, view, settings, and theme controls work', async ({ page }) => {
    const errors = collectPageErrors(page);

    await page.goto('/app-hub/v9-portal.html');
    await expect(page.locator('#artifactsGrid [data-artifact-id]').first()).toBeVisible();

    const [hubLinkBox, viewToggleBox] = await Promise.all([
      page.locator('.hdr-link').boundingBox(),
      page.locator('.view-toggle').boundingBox(),
    ]);
    expect(hubLinkBox).not.toBeNull();
    expect(viewToggleBox).not.toBeNull();
    const overlaps =
      hubLinkBox.x < viewToggleBox.x + viewToggleBox.width &&
      hubLinkBox.x + hubLinkBox.width > viewToggleBox.x &&
      hubLinkBox.y < viewToggleBox.y + viewToggleBox.height &&
      hubLinkBox.y + hubLinkBox.height > viewToggleBox.y;
    expect(overlaps).toBe(false);

    await page.click('#viewList');
    await expect(page.locator('#artifactsGrid')).toHaveClass(/artifacts-list/);
    await expect(page.locator('#viewList')).toHaveClass(/active/);

    await page.click('#viewCards');
    await expect(page.locator('#artifactsGrid')).toHaveClass(/artifacts-grid/);

    await page.click('#settingsBtn');
    await expect(page.locator('#settingsDrawer')).toHaveClass(/open/);
    await page.click('#themeGrid [data-theme="matrix"]');
    await expect(page.locator('body')).toHaveAttribute('data-theme', 'matrix');
    await expect(page.locator('#hdrThemeName')).toHaveText('MATRIX');
    await page.click('#settingsCloseBtn');
    await expect(page.locator('#settingsDrawer')).not.toHaveClass(/open/);

    await page.fill('#searchInput', 'calculator');
    await expect(page.locator('#artifactsGrid [data-artifact-id]')).toHaveCount(1);
    await expect(page.locator('#artifactsGrid')).toContainText(/calculator/i);
    await page.click('#searchClear');
    await expect(page.locator('#searchInput')).toHaveValue('');
    await expect.poll(() => page.locator('#artifactsGrid [data-artifact-id]').count()).toBeGreaterThan(1);

    expect(errors).toEqual([]);
  });

  test('PDF Forge settings, themes, and tab delegation work', async ({ page }) => {
    const errors = collectPageErrors(page);

    await page.goto('/pdf-forge-nexus.html');
    await expect(page.locator('[data-action="open-settings"]')).toBeVisible();

    await page.click('[data-action="open-settings"]');
    await expect(page.locator('#settingsDrawer')).toHaveClass(/open/);
    await page.click('#settingsDrawer [data-theme="matrix"]');
    await expect(page.locator('body')).toHaveAttribute('data-theme', 'matrix');
    await page.click('#settingsDrawer [data-action="close-settings"]');
    await expect(page.locator('#settingsDrawer')).not.toHaveClass(/open/);

    await page.click('.tab-btn[data-tab="split"]');
    await expect(page.locator('.tab-btn[data-tab="split"]')).toHaveClass(/active/);
    await expect(page.locator('#tab-split')).toHaveClass(/active/);
    await page.click('.tab-btn[data-tab="pages"]');
    await expect(page.locator('#tab-pages')).toHaveClass(/active/);

    expect(errors).toEqual([]);
  });

  test('Prompt Forge delegated prompt, tab, settings, and keyboard controls work', async ({ page }) => {
    const errors = collectPageErrors(page);

    await page.goto('/prompt-gen-nexus.html');
    await expect(page.locator('#promptList .prompt-list-item').first()).toBeVisible();
    const before = await page.locator('#promptList .prompt-list-item').count();

    await page.click('[data-action="create-prompt"]');
    await expect(page.locator('#promptList .prompt-list-item')).toHaveCount(before + 1);
    await expect(page.locator('#promptTitle')).toHaveValue('New Prompt');

    await page.click('[data-action="switch-tab"][data-tab="operations"]');
    await expect(page.locator('.tab-btn[data-tab="operations"]')).toHaveClass(/active/);
    await expect(page.locator('#tab-operations')).toHaveClass(/active/);

    await page.click('[data-action="open-settings"]');
    await expect(page.locator('#settingsDrawer')).toHaveClass(/open/);
    const matrixTheme = page.locator('#settingsDrawer [data-theme="matrix"]');
    await matrixTheme.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('body')).toHaveAttribute('data-theme', 'matrix');
    await expect(matrixTheme).toHaveAttribute('aria-pressed', 'true');

    const wrapToggle = page.locator('#toggleWrap');
    const wrapBefore = await wrapToggle.getAttribute('aria-pressed');
    await wrapToggle.focus();
    await page.keyboard.press('Space');
    await expect(wrapToggle).toHaveAttribute('aria-pressed', wrapBefore === 'true' ? 'false' : 'true');

    expect(errors).toEqual([]);
  });

  test('Template Engine seed and select controls retain their behavior', async ({ page }) => {
    const errors = collectPageErrors(page);

    await page.goto('/spc/template_engine.html');
    await expect(page.locator('#seedNext')).toBeVisible();
    const initialSeed = Number(await page.locator('#seedv').textContent());

    await page.click('#seedNext');
    await expect(page.locator('#seedv')).toHaveText(String(initialSeed + 1));
    await expect(page.locator('#seedInput')).toHaveValue(String(initialSeed + 1));

    await page.selectOption('#format', 'square');
    await expect(page.locator('#formatv')).toHaveText('square');
    await page.selectOption('#preset', 'campaign');
    await expect(page.locator('#presetv')).toHaveText('campaign');
    await page.selectOption('#intent', 'broadcast');
    await expect(page.locator('#intentv')).toHaveText('broadcast');

    await page.locator('#titleText').fill('LISTENERS WORK');
    await expect(page.locator('#titleCount')).toHaveText('14c');

    expect(errors).toEqual([]);
  });
});
