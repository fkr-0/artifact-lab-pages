import { expect, test } from '@playwright/test';

async function collectPageErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

function seriousErrors(errors) {
  return errors.filter((message) => {
    const text = String(message || '').toLowerCase();
    return !text.includes('failed to load resource')
      && !text.includes('favicon')
      && !text.includes('net::err')
      && !text.includes('websocket');
  });
}

test.describe('Hyperblast configurable controls', () => {
  test('setup menu can rebind move-right and the rebound key moves horizontally', async ({ page }) => {
    const errors = await collectPageErrors(page);
    await page.goto('/hyperblast-shooter/index.html?multiplayer=false');

    await expect(page.locator('#setupMenu')).toBeVisible();
    await expect(page.locator('#binding-moveRight')).toContainText('D');

    await page.locator('#binding-moveRight').click();
    await expect(page.locator('#binding-moveRight')).toContainText('Press a key');
    await page.keyboard.press('KeyL');
    await expect(page.locator('#binding-moveRight')).toContainText('L');

    await page.locator('#setupStart').click();
    await expect(page.locator('#gameCanvas')).toBeVisible();
    await page.locator('#gameCanvas').click();

    const before = await page.evaluate(() => ({
      x: window.game.state.local.player.x,
      bindings: window.game.keyBindings,
    }));
    expect(before.bindings.moveRight).toEqual(['KeyL']);

    await page.keyboard.down('KeyL');
    await expect.poll(async () => page.evaluate(() => window.game.state.local.player.x)).toBeGreaterThan(before.x);
    await page.keyboard.up('KeyL');

    const after = await page.evaluate(() => ({
      x: window.game.state.local.player.x,
      keys: window.game.state.local.keys,
    }));
    expect(after.x).toBeGreaterThan(before.x);
    expect(after.keys.moveRight).toBe(false);
    expect(seriousErrors(errors)).toEqual([]);
  });

  test('setup menu exposes VS mode and stores it as the match mode', async ({ page }) => {
    const errors = await collectPageErrors(page);
    await page.goto('/hyperblast-shooter/index.html?multiplayer=false');

    await expect(page.locator('#setupMenu')).toBeVisible();
    await expect(page.locator('#setupRoomType option[value="vs"]')).toHaveText(/versus/i);
    await page.locator('#setupRoomType').selectOption('vs');
    await page.locator('#setupStart').click();

    await expect.poll(async () => page.evaluate(() => window.game?.matchMode)).toBe('vs');
    const settings = await page.evaluate(() => window.game.ui.getSettings());
    expect(settings.preferredRoomType).toBe('vs');
    expect(seriousErrors(errors)).toEqual([]);
  });
  test('custom bindings persist across reload and reset restores horizontal defaults', async ({ page }) => {
    const errors = await collectPageErrors(page);
    await page.goto('/hyperblast-shooter/index.html?multiplayer=false');

    await expect(page.locator('#setupMenu')).toBeVisible();
    await page.locator('#binding-moveRight').click();
    await page.keyboard.press('KeyL');
    await expect(page.locator('#binding-moveRight')).toContainText('L');
    await page.locator('#setupStart').click();
    await expect(page.locator('#gameCanvas')).toBeVisible();

    await page.reload();
    await expect(page.locator('#setupMenu')).toBeVisible();
    await expect(page.locator('#setupControls')).toHaveValue('custom');
    await expect(page.locator('#binding-moveRight')).toContainText('L');

    await page.locator('#resetBindings').click();
    await expect(page.locator('#binding-moveRight')).toContainText('Arrow Right');
    await expect(page.locator('#binding-moveRight')).toContainText('D');
    await page.locator('#setupStart').click();
    await expect(page.locator('#gameCanvas')).toBeVisible();
    await page.locator('#gameCanvas').click();

    const before = await page.evaluate(() => window.game.state.local.player.x);
    await page.keyboard.down('ArrowRight');
    await expect.poll(async () => page.evaluate(() => window.game.state.local.player.x)).toBeGreaterThan(before);
    await page.keyboard.up('ArrowRight');
    const afterArrow = await page.evaluate(() => window.game.state.local.player.x);
    await page.keyboard.down('KeyD');
    await expect.poll(async () => page.evaluate(() => window.game.state.local.player.x)).toBeGreaterThan(afterArrow);
    await page.keyboard.up('KeyD');
    expect(seriousErrors(errors)).toEqual([]);
  });

});
