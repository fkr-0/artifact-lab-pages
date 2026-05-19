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
      && !text.includes('peerjs')
      && !text.includes('websocket')
      && !text.includes('networkerror')
      && !text.includes('net::err');
  });
}

test.describe('app-hub-v11 shell', () => {
  test('boots, renders catalog results, and keeps the status band inside the lower stage', async ({ page }) => {
    const errors = await collectPageErrors(page);
    await page.goto('/app-hub-v11/index.html');

    await expect(page.locator('#resultsPanel')).toBeVisible();
    await expect(page.locator('#workspacePane')).toBeVisible();
    await expect(page.locator('#stage')).toBeVisible();
    await expect(page.locator('#stage > #footerBar')).toBeVisible();
    await expect(page.locator('body > #footerBar')).toHaveCount(0);

    const footerBox = await page.locator('#footerBar').boundingBox();
    const stageBox = await page.locator('#stage').boundingBox();
    const workspaceBox = await page.locator('#workspacePane').boundingBox();
    expect(footerBox?.height || 0).toBeGreaterThanOrEqual(34);
    expect(stageBox?.height || 0).toBeGreaterThanOrEqual(38);
    expect(footerBox?.y || 0).toBeGreaterThanOrEqual(workspaceBox?.y || 0);
    expect((footerBox?.y || 0) + (footerBox?.height || 0)).toBeLessThanOrEqual((workspaceBox?.y || 0) + (workspaceBox?.height || 0) + 2);

    await expect(page.locator('#results article').first()).toBeVisible();
    expect(seriousErrors(errors)).toEqual([]);
  });

  test('launches Hyperblast inline and gives the iframe the full app-deck vertical lane', async ({ page }) => {
    const errors = await collectPageErrors(page);
    await page.goto('/app-hub-v11/index.html');

    await page.locator('#search').fill('Hyperblast');
    const card = page.locator('[data-id="hyperblast-shooter"]').first();
    await expect(card).toBeVisible();
    await card.locator('[data-launch="inline"]').click();

    await expect(page.locator('#appDeck.active')).toBeVisible();
    const frame = page.frameLocator('iframe[title="Hyperblast Shooter"]').first();
    await expect(frame.locator('#gameCanvas')).toBeVisible();

    const deckBox = await page.locator('#appDeck').boundingBox();
    const iframeBox = await page.locator('iframe[title="Hyperblast Shooter"]').boundingBox();
    expect(iframeBox?.height || 0).toBeGreaterThan(220);
    expect(iframeBox?.height || 0).toBeLessThanOrEqual((deckBox?.height || 0) + 2);

    await expect(frame.locator('#score')).toHaveText(/\d+/);
    await expect(frame.locator('#lives')).toHaveText(/\d+/);
    expect(seriousErrors(errors)).toEqual([]);
  });
});

test.describe('Hyperblast Shooter', () => {
  test('boots directly in embedded/directStart mode and exposes a live game API', async ({ page }) => {
    const errors = await collectPageErrors(page);
    await page.goto('/app-hub/shooter.html?embedded=true&directStart=true');

    await expect(page.locator('#gameCanvas')).toBeVisible();
    await expect(page.locator('#score')).toHaveText('0');
    await expect(page.locator('#lives')).toHaveText('3');
    await expect(page.locator('#stage')).toHaveText('1');

    const state = await page.evaluate(() => ({
      hasGame: Boolean(window.game),
      hasLoop: Boolean(window.game?.gameLoop),
      canvasWidth: window.game?.canvas?.width,
      canvasHeight: window.game?.canvas?.height,
      playerY: window.game?.state?.local?.player?.y,
      bullets: window.game?.state?.local?.bullets?.length,
    }));
    expect(state.hasGame).toBe(true);
    expect(state.hasLoop).toBe(true);
    expect(state.canvasWidth).toBeGreaterThanOrEqual(320);
    expect(state.canvasHeight).toBeGreaterThanOrEqual(240);
    expect(state.playerY).toBeGreaterThan(0);
    expect(state.bullets).toBe(0);
    expect(seriousErrors(errors)).toEqual([]);
  });

  test('responds to keyboard input, fires bullets, and can restart cleanly', async ({ page }) => {
    const errors = await collectPageErrors(page);
    await page.goto('/app-hub/shooter.html?embedded=true&directStart=true');
    await page.locator('#gameCanvas').click();

    const before = await page.evaluate(() => ({
      y: window.game.state.local.player.y,
      bullets: window.game.state.local.bullets.length,
    }));

    await page.keyboard.down('ArrowUp');
    await page.waitForTimeout(150);
    await page.keyboard.up('ArrowUp');
    await page.keyboard.press('Space');
    await page.waitForTimeout(120);

    const after = await page.evaluate(() => ({
      y: window.game.state.local.player.y,
      bullets: window.game.state.local.bullets.length,
    }));
    expect(after.y).toBeLessThan(before.y);
    expect(after.bullets).toBeGreaterThanOrEqual(before.bullets + 1);

    await page.locator('#restartBtn').click();
    await expect(page.locator('#score')).toHaveText('0');
    await expect(page.locator('#lives')).toHaveText('3');
    expect(seriousErrors(errors)).toEqual([]);
  });
});
