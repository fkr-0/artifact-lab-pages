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

test.describe('BrickBreaker Coop', () => {
  test('boots directly in solo mode with a playable polished UI', async ({ page }) => {
    const errors = await collectPageErrors(page);
    await page.goto('/brickbreaker/index.html');

    await expect(page.locator('h1')).toHaveText('BrickBreaker Coop');
    await expect(page.locator('#game')).toBeVisible();
    await expect(page.locator('#soloMode')).toHaveClass(/active/);
    await expect(page.locator('#score')).toHaveText(/score: 0/);
    await expect(page.locator('#lives')).toHaveText(/lives: 3/);
    await expect(page.locator('#network')).toContainText('offline solo');
    await expect(page.locator('#players')).toHaveText('players: 1');
    await expect(page.locator('#modeCopy')).toContainText('Solo mode');
    await expect(page.locator('#networkDetail')).toContainText('Solo mode');

    const runtime = await page.evaluate(() => ({
      hasRuntime: Boolean(window.brickbreaker),
      isMultiplayer: window.brickbreaker?.isMultiplayer,
      players: Object.keys(window.brickbreaker?.state?.players || {}).length,
      bricks: window.brickbreaker?.state?.bricks?.length,
      balls: window.brickbreaker?.state?.balls?.length,
    }));
    expect(runtime).toMatchObject({ hasRuntime: true, isMultiplayer: false, players: 1, balls: 1 });
    expect(runtime.bricks).toBeGreaterThan(20);

    await page.locator('#pauseBtn').click();
    await expect(page.locator('#pauseBtn')).toHaveText('Resume');
    await expect(page.locator('#overlayTip')).toContainText('Paused');
    await page.locator('#resetBtn').click();
    await expect(page.locator('#score')).toHaveText(/score: 0/);
    expect(seriousErrors(errors)).toEqual([]);
  });

  test('boots directly in multiplayer mode and exposes invite/network controls', async ({ page }) => {
    const errors = await collectPageErrors(page);
    await page.goto('/brickbreaker/index.html?multiplayer=true&playerId=e2e-a&username=E2E');

    await expect(page.locator('#game')).toBeVisible();
    await expect(page.locator('#multiMode')).toHaveClass(/active/);
    await expect(page.locator('#modeCopy')).toContainText('Multiplayer mode');
    await expect(page.locator('#copyInvite')).toBeVisible();
    await expect(page.locator('#network')).not.toContainText('offline solo');
    await expect(page.locator('#players')).toHaveText(/players: \d+/);

    const runtime = await page.evaluate(() => ({
      isMultiplayer: window.brickbreaker?.isMultiplayer,
      localId: window.brickbreaker?.localId,
      status: window.brickbreaker?.network?.status,
      hostId: window.brickbreaker?.state?.authority?.hostId,
    }));
    expect(runtime.isMultiplayer).toBe(true);
    expect(runtime.localId).toBe('e2e-a');
    expect(typeof runtime.status).toBe('string');
    expect(runtime.hostId).toBeTruthy();
    expect(seriousErrors(errors)).toEqual([]);
  });

  test('launches from app-hub-v11 inline and renders the game iframe', async ({ page }) => {
    const errors = await collectPageErrors(page);
    await page.goto('/app-hub-v11/index.html');
    await page.locator('#search').fill('BrickBreaker');
    const card = page.locator('[data-id="brickbreaker"]').first();
    await expect(card).toBeVisible();
    await card.locator('[data-launch="inline"]').click();

    await expect(page.locator('#appDeck.active')).toBeVisible();
    const frame = page.frameLocator('iframe[title="BrickBreaker Coop"]').first();
    await expect(frame.locator('h1')).toHaveText('BrickBreaker Coop');
    await expect(frame.locator('#game')).toBeVisible();
    await expect(frame.locator('#network')).toContainText('offline solo');
    const runtime = await frame.locator('#game').evaluate(() => Boolean(window.brickbreaker));
    expect(runtime).toBe(true);
    expect(seriousErrors(errors)).toEqual([]);
  });
});
