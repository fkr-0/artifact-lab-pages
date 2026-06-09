import { expect, test } from '@playwright/test';

async function collectRuntimeErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

function seriousRuntimeErrors(errors) {
  return errors.filter((message) => {
    const text = String(message || '').toLowerCase();
    return !text.includes('failed to load resource')
      && !text.includes('favicon')
      && !text.includes('net::err')
      && !text.includes('networkerror')
      && !text.includes('websocket');
  });
}

test.describe('Hyperblast offline/degraded multiplayer behavior', () => {
  test('boots single-player and marks multiplayer unavailable when PeerJS CDN is blocked', async ({ page }) => {
    const errors = await collectRuntimeErrors(page);

    await page.route('**/peerjs*.js', (route) => route.abort());
    await page.route('**/peerjs/**', (route) => route.abort());

    await page.goto('/hyperblast-shooter/index.html?embedded=true&directStart=true');

    await expect(page.locator('#gameCanvas')).toBeVisible();
    await expect(page.locator('#score')).toHaveText('0');
    await expect(page.locator('#lives')).toHaveText('3');
    await expect(page.locator('#sessionModeLabel')).toHaveText('Combat');

    await expect(page.locator('#multiplayerBtn')).toHaveText('Multiplayer: UNAVAILABLE');
    await expect(page.locator('#multiplayerBtn')).toBeDisabled();
    await expect(page.locator('#notification.visible')).toContainText('Multiplayer unavailable');

    const state = await page.evaluate(() => ({
      hasGame: Boolean(window.game),
      loopRunning: Boolean(window.game?.gameLoop),
      multiplayer: window.game?.multiplayer,
      lobby: window.game?.lobby,
      canvasWidth: window.game?.canvas?.width,
      canvasHeight: window.game?.canvas?.height,
    }));

    expect(state).toMatchObject({
      hasGame: true,
      loopRunning: true,
      multiplayer: false,
      lobby: null,
    });
    expect(state.canvasWidth).toBeGreaterThanOrEqual(320);
    expect(state.canvasHeight).toBeGreaterThanOrEqual(240);
    expect(seriousRuntimeErrors(errors)).toEqual([]);
  });
});
