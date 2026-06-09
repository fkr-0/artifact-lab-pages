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

test.describe('Hyperblast corrupt storage resilience', () => {
  test('boots with safe defaults when progress and settings localStorage are corrupt', async ({ page }) => {
    const errors = await collectPageErrors(page);
    await page.goto('/hyperblast-shooter/index.html?embedded=true&directStart=true&noAutoMultiplayer=true', {
      waitUntil: 'domcontentloaded',
    });
    await page.evaluate(() => {
      localStorage.setItem('hyperblast-shooter-progress-v1', '{not valid json');
      localStorage.setItem('shooter-settings', '{not valid json');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });

    await expect(page.locator('#gameCanvas')).toBeVisible();
    await expect(page.locator('#score')).toHaveText('0');
    await expect(page.locator('#lives')).toHaveText('3');
    await expect(page.locator('#sessionModeLabel')).toHaveText('Combat');

    const state = await page.evaluate(() => ({
      hasGame: Boolean(window.game),
      currentWorldId: window.game?.worldProgress?.currentWorldId,
      keyBindings: window.game?.keyBindings,
      playerName: window.game?.username,
    }));
    expect(state.hasGame).toBe(true);
    expect(state.currentWorldId).toBeTruthy();
    expect(state.keyBindings.moveRight).toContain('ArrowRight');
    expect(state.keyBindings.moveRight).toContain('KeyD');
    expect(state.playerName).toBe('Pilot');
    expect(seriousErrors(errors)).toEqual([]);
  });
});
