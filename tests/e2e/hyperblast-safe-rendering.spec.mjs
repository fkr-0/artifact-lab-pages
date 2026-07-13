import { expect, test } from '@playwright/test';

function seriousErrors(errors) {
  return errors.filter((message) => {
    const text = String(message || '').toLowerCase();
    return !text.includes('failed to load resource')
      && !text.includes('favicon')
      && !text.includes('net::err')
      && !text.includes('websocket');
  });
}

async function collectPageErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

test.describe('Hyperblast safe rendering', () => {
  test('story messages render dynamic content as text, not executable DOM', async ({ page }) => {
    const errors = await collectPageErrors(page);
    await page.goto('/hyperblast-shooter/index.html?embedded=true&directStart=true&multiplayer=false');

    await page.evaluate(() => {
      window.__hyperblastInjected = false;
      window.game.ui.showStoryMessages([
        {
          speakerName: '<img src=x onerror="window.__hyperblastInjected=true">',
          speakerColor: 'url(javascript:window.__hyperblastInjected=true)',
          role: '<svg onload="window.__hyperblastInjected=true">',
          text: '<img data-testid="unsafe-story-img" src=x onerror="window.__hyperblastInjected=true">',
        },
      ]);
    });

    await expect(page.locator('#storyPanel')).toBeVisible();
    await expect(page.locator('#storyMessages')).toContainText('<img data-testid="unsafe-story-img"');
    await expect(page.locator('#storyMessages img')).toHaveCount(0);
    await expect(page.locator('#storyMessages svg')).toHaveCount(0);
    await expect.poll(async () => page.evaluate(() => window.__hyperblastInjected)).toBe(false);
    expect(seriousErrors(errors)).toEqual([]);
  });

  test('achievement toasts render dynamic content as text, not executable DOM', async ({ page }) => {
    const errors = await collectPageErrors(page);
    await page.goto('/hyperblast-shooter/index.html?embedded=true&directStart=true&multiplayer=false');

    await page.evaluate(() => {
      window.__hyperblastAchievementInjected = false;
      window.game.ui.showAchievement({
        name: '<img data-testid="unsafe-achievement-img" src=x onerror="window.__hyperblastAchievementInjected=true">',
        description: '<script>window.__hyperblastAchievementInjected=true</script>',
        xp: '<img src=x onerror="window.__hyperblastAchievementInjected=true">',
      });
    });

    await expect(page.locator('#achievementPanel')).toBeVisible();
    await expect(page.locator('#achievementPanel')).toContainText('<script>window.__hyperblastAchievementInjected=true</script>');
    await expect(page.locator('#achievementPanel img')).toHaveCount(0);
    await expect(page.locator('#achievementPanel script')).toHaveCount(0);
    await expect.poll(async () => page.evaluate(() => window.__hyperblastAchievementInjected)).toBe(false);
    expect(seriousErrors(errors)).toEqual([]);
  });
  test('multiplayer player list renders remote usernames and colors safely', async ({ page }) => {
    const errors = await collectPageErrors(page);
    await page.goto('/hyperblast-shooter/index.html?embedded=true&directStart=true&multiplayer=false');

    await page.evaluate(() => {
      window.__hyperblastPeerInjected = false;
      window.game.multiplayer = true;
      window.game.state.remote.set('evil-peer', {
        username: '<img data-testid="unsafe-peer-img" src=x onerror="window.__hyperblastPeerInjected=true">',
        color: 'url(javascript:window.__hyperblastPeerInjected=true)',
        score: '<script>window.__hyperblastPeerInjected=true</script>',
        player: { x: 100, y: 120 },
        bullets: [],
        lastUpdate: Date.now(),
      });
      window.game.updateMultiplayerPanel();
    });

    await expect(page.locator('#multiplayerPanel')).toBeVisible();
    await expect(page.locator('#playerList')).toContainText('<img data-testid="unsafe-peer-img"');
    await expect(page.locator('#playerList img')).toHaveCount(0);
    await expect(page.locator('#playerList script')).toHaveCount(0);
    await expect.poll(async () => page.evaluate(() => window.__hyperblastPeerInjected)).toBe(false);
    const dotStyle = await page.locator('#playerList .player:not(.you) .player-dot').getAttribute('style');
    expect(dotStyle).not.toContain('javascript');
    expect(seriousErrors(errors)).toEqual([]);
  });

});
