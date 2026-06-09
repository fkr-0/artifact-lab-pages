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
    expect(footerBox?.height || 0).toBeGreaterThanOrEqual(28);
    expect(stageBox?.height || 0).toBeGreaterThanOrEqual(28);
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
    await page.goto('/hyperblast-shooter/index.html?embedded=true&directStart=true');

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

  test('supports exploration mode, world-map travel, and signal puzzle rewards', async ({ page }) => {
    const errors = await collectPageErrors(page);
    await page.goto('/hyperblast-shooter/index.html?embedded=true&directStart=true');

    await expect(page.locator('#sessionModeLabel')).toHaveText('Combat');
    await page.locator('#exploreBtn').click();
    await expect(page.locator('#sessionModeLabel')).toHaveText('Explore');
    const exploreState = await page.evaluate(() => {
      const before = window.game.state.local.spawnTimer;
      window.game.update();
      window.game.update();
      return {
        mode: window.game.sessionMode,
        before,
        after: window.game.state.local.spawnTimer,
      };
    });
    expect(exploreState).toEqual({ mode: 'explore', before: 0, after: 0 });

    await page.locator('#worldMapBtn').click();
    await expect(page.locator('#worldMapPanel')).toBeVisible();
    await expect(page.locator('#routeCount')).toHaveText('1');
    await expect(page.locator('#intelCount')).toHaveText('0');
    await expect(page.locator('#milestoneCount')).toHaveText('1');
    await page.locator('#milestonesBtn').click();
    await expect(page.locator('#milestonesPanel')).toBeVisible();
    await expect(page.locator('#milestonesPanel')).toContainText('Safe Dock Found');
    await expect(page.locator('#milestonesPanel')).toContainText('Shortcut Cartographer');
    await expect(page.locator('#chapterCount')).toHaveText('0');
    await page.locator('#chapterLogBtn').click();
    await expect(page.locator('#chapterLogPanel')).toBeVisible();
    await expect(page.locator('#chapterLogPanel')).toContainText('Chapter 1: Patrol Anomaly');
    await expect(page.locator('#chapterLogPanel')).toContainText('Chapter 3: Ancient Lattice');
    await expect(page.locator('#chapterLogPanel')).toContainText(/locked/i);
    await page.locator('#intelArchiveBtn').click();
    await expect(page.locator('#intelArchivePanel')).toBeVisible();
    await expect(page.locator('#intelArchivePanel')).toContainText('0 / 5 entries decoded');
    await expect(page.locator('#intelArchivePanel')).toContainText('Heat-Haze Signal');
    await expect(page.locator('#intelArchivePanel')).toContainText(/locked/i);
    await page.locator('#routeIntelBtn').click();
    await expect(page.locator('#routeIntelPanel')).toBeVisible();
    await expect(page.locator('#routeIntelPanel')).toContainText('Caldera Mile drift corridor');
    await expect(page.locator('#routeIntelPanel')).toContainText('Missing intel: heat-haze-signal');
    await expect(page.locator('[data-world-id="verdant-ion-reef"]')).toBeDisabled();
    await expect(page.locator('#worldMapPanel')).toContainText('requires heat-haze-signal');

    await page.locator('[data-world-id="ember-belt"]').click();
    await expect(page.locator('#currentWorldName')).toHaveText('Ember Belt');
    await expect(page.locator('#stage')).toHaveText('2');
    await expect(page.locator('#worldLandingPanel')).toBeVisible();
    await expect(page.locator('#worldLandingTitle')).toHaveText('Ember Belt');
    await expect(page.locator('#worldLandingBrief')).toContainText('Use Explore time');
    await expect(page.locator('#worldLandingNextStep')).toContainText('Next Step: Listen locally');
    await expect(page.locator('#landingNextStepBtn')).toHaveText('Open Local Signals');
    await expect(page.locator('#worldLandingLandmark [data-landmark-world="ember-belt"]')).toBeVisible();
    await expect(page.locator('#worldLandingLandmark')).toContainText('Thermal Gate Dock');
    await page.locator('#landingNextStepBtn').click();
    await expect(page.locator('#localSignalsPanel')).toBeVisible();
    await page.locator('#localSignalsPanel [data-signal-quest="cool-ember-noise"]').click();
    await expect(page.locator('#localSignalsPanel')).toContainText(/active/i);
    await page.locator('#signalPuzzleBtn').click();
    await expect(page.locator('#signalPuzzleTitle')).toContainText('Thermal Noise Filter');
    await page.locator('#signalPuzzleAutoFillBtn').click();
    await page.locator('#signalPuzzleCheckBtn').click();
    await expect(page.locator('#signalPuzzleTitle')).toContainText('solved');
    await page.locator('#signalPuzzleCloseBtn').click();
    await page.locator('#worldMapBtn').click();
    await expect(page.locator('#routeCount')).toHaveText('2');
    await expect(page.locator('#intelCount')).toHaveText('1');
    await expect(page.locator('#chapterCount')).toHaveText('1');
    await expect(page.locator('#milestoneCount')).toHaveText('5');
    await expect(page.locator('#milestonesPanel')).toContainText('Shortcut Cartographer');
    await expect(page.locator('#milestonesPanel')).toContainText('Reef Route Open');
    await page.locator('#worldLandingBtn').click();
    await expect(page.locator('#worldLandingNextStep')).toContainText('Next Step: Route plotted');
    await expect(page.locator('#landingNextStepBtn')).toHaveText('Open World Map');
    await page.locator('#landingNextStepBtn').click();
    await expect(page.locator('#worldMapPanel')).toBeVisible();
    await expect(page.locator('#chapterLogPanel')).toContainText('Chapter 2: Heat-Haze Signal');
    await expect(page.locator('#chapterLogPanel')).toContainText(/complete/i);
    await expect(page.locator('#intelArchivePanel')).toContainText('1 / 5 entries decoded');
    await expect(page.locator('#intelArchivePanel')).toContainText('A clean carrier emerges below the Ember Belt noise floor.');
    await expect(page.locator('#routeIntelPanel')).toContainText('Filtered Unknown signal path');
    await expect(page.locator('#routeIntelPanel')).toContainText('Shortcut plotted in the nav computer.');
    await page.locator('#progressBtn').click();
    await expect(page.locator('#progressPanel')).toBeVisible();
    await expect(page.locator('#progressStats')).toContainText('Routes');
    await expect(page.locator('#progressStats')).toContainText('2/4');
    await page.locator('#progressSaveBtn').click();
    const savedMeta = await page.evaluate(() => JSON.parse(localStorage.getItem('hyperblast-shooter-progress-v1')).meta);
    expect(savedMeta.schemaVersion).toBe(3);
    expect(typeof savedMeta.savedAt).toBe('string');
    await page.locator('#progressCloseBtn').click();
    await expect(page.locator('[data-world-id="verdant-ion-reef"]')).toBeEnabled();

    await page.locator('[data-world-id="verdant-ion-reef"]').click();
    await expect(page.locator('#currentWorldName')).toHaveText('Verdant Ion Reef');
    await expect(page.locator('#stage')).toHaveText('3');
    await expect(page.locator('#sessionModeLabel')).toHaveText('Explore');
    await expect(page.locator('#worldLandingPanel')).toBeVisible();
    await expect(page.locator('#worldLandingTitle')).toHaveText('Verdant Ion Reef');
    await expect(page.locator('#worldLandingStatus')).toContainText('Puzzle');
    await expect(page.locator('#worldLandingLandmark [data-landmark-world="verdant-ion-reef"]')).toBeVisible();
    await expect(page.locator('#worldLandingLandmark')).toContainText('Ion Coral Relay');

    await page.locator('#landingSignalsBtn').click();
    await expect(page.locator('#localSignalsPanel')).toBeVisible();
    await expect(page.locator('#localSignalsPanel')).toContainText('Reef Whisper');
    await expect(page.locator('#localSignalsPanel')).toContainText('The reef is a lock');
    await page.locator('#localSignalsPanel [data-signal-quest="map-ion-reef-pulse"]').click();
    await expect(page.locator('#localSignalsPanel')).toContainText(/active/i);
    const acceptedState = await page.evaluate(() => window.game.questState.questStatusById['map-ion-reef-pulse']);
    expect(acceptedState).toBe('active');

    const moneyBefore = await page.evaluate(() => window.game.state.local.money);
    await page.locator('#signalPuzzleBtn').click();
    await expect(page.locator('#signalPuzzlePanel')).toBeVisible();
    await expect(page.locator('#signalPuzzleTitle')).toContainText('Reef Resonance Lock');
    await page.locator('#signalPuzzleAutoFillBtn').click();
    await page.locator('#signalPuzzleCheckBtn').click();
    await expect(page.locator('#signalPuzzleTitle')).toContainText('solved');

    await page.locator('#questLogBtn').click();
    await expect(page.locator('#questLogPanel')).toBeVisible();
    await expect(page.locator('#questLogPanel')).toContainText('Map the Ion Reef Pulse');
    await expect(page.locator('#questLogPanel')).toContainText(/complete/i);
    await expect(page.locator('#localSignalsPanel')).toContainText('You heard it');

    const solvedState = await page.evaluate(() => ({
      mode: window.game.sessionMode,
      money: window.game.state.local.money,
      completed: window.game.worldProgress.completedObjectiveIds,
      questStatus: window.game.questState.questStatusById['map-ion-reef-pulse'],
      questObjectives: window.game.questState.completedObjectiveIds,
      unlockedIntel: window.game.questState.unlockedIntelIds,
      persisted: JSON.parse(localStorage.getItem('hyperblast-shooter-progress-v1')),
    }));
    expect(solvedState.mode).toBe('puzzle');
    expect(solvedState.money).toBeGreaterThan(moneyBefore);
    expect(solvedState.completed).toContain('puzzle:verdant-ion-reef-resonance');
    expect(solvedState.questStatus).toBe('complete');
    expect(solvedState.questObjectives).toContain('quest:map-ion-reef-pulse:puzzle:verdant-ion-reef-resonance');
    expect(solvedState.unlockedIntel).toContain('ancient-lattice-route');
    expect(solvedState.persisted.questState.questStatusById['map-ion-reef-pulse']).toBe('complete');

    await page.locator('#signalPuzzleCloseBtn').click();
    await expect(page.locator('#sessionModeLabel')).toHaveText('Explore');
    await page.locator('#progressBtn').click();
    await expect(page.locator('#progressPanel')).toBeVisible();
    await page.locator('#progressResetBtn').click();
    await expect(page.locator('#currentWorldName')).toHaveText('Neon Drift Lanes');
    await expect(page.locator('#routeCount')).toHaveText('1');
    await expect(page.locator('#intelCount')).toHaveText('0');
    await expect(page.locator('#chapterCount')).toHaveText('0');
    const resetState = await page.evaluate(() => JSON.parse(localStorage.getItem('hyperblast-shooter-progress-v1')));
    expect(resetState.worldProgress.currentWorldId).toBe('neon-drift');
    expect(resetState.questState.unlockedIntelIds).toEqual([]);

    await page.locator('#combatBtn').click();
    await expect(page.locator('#sessionModeLabel')).toHaveText('Combat');
    expect(seriousErrors(errors)).toEqual([]);
  });

  test('launches and completes a bounded patrol contract from Dock', async ({ page }) => {
    const errors = await collectPageErrors(page);
    await page.goto('/hyperblast-shooter/index.html?embedded=true&directStart=true');

    await page.locator('#exploreBtn').click();
    await page.locator('#worldLandingBtn').click();
    await expect(page.locator('#worldLandingPanel')).toBeVisible();
    await expect(page.locator('#worldLandingStatus')).toContainText('Patrol');
    await expect(page.locator('#landingCombatBtn')).toHaveText('Launch Patrol');
    await expect(page.locator('#worldLandingStatus')).toContainText('Standard first clear');
    await page.locator('#landingPatrolTier').selectOption('elite');
    await expect(page.locator('#worldLandingStatus')).toContainText('8 hostiles');
    await expect(page.locator('#worldLandingStatus')).toContainText('Elite first clear ¤112');
    await page.locator('#landingPatrolTier').selectOption('standard');

    const before = await page.evaluate(() => ({
      money: window.game.state.local.money,
      score: window.game.state.local.score,
    }));
    await page.locator('#landingCombatBtn').click();
    await expect(page.locator('#sessionModeLabel')).toHaveText('Combat');

    const launched = await page.evaluate(() => ({
      activeContractId: window.game.contractState.activeContractId,
      stageGoal: window.game.state.local.stageGoal,
      combatActive: window.game.isCombatActive(),
    }));
    expect(launched.activeContractId).toBe('patrol-neon-drift');
    expect(launched.stageGoal).toBe(6);
    expect(launched.combatActive).toBe(true);

    const completed = await page.evaluate(() => {
      window.game.state.local.stageKills = window.game.state.local.stageGoal;
      window.game.completeActivePatrolContract();
      return {
        mode: window.game.sessionMode,
        activeContractId: window.game.contractState.activeContractId,
        completed: window.game.contractState.completedContractIds,
        money: window.game.state.local.money,
        score: window.game.state.local.score,
      };
    });
    expect(completed.mode).toBe('explore');
    expect(completed.activeContractId).toBe(null);
    expect(completed.completed).toContain('patrol-neon-drift');
    expect(completed.money - before.money).toBe(70);
    expect(completed.score - before.score).toBe(300);
    await expect(page.locator('#worldLandingPanel')).toBeVisible();
    await expect(page.locator('#sessionModeLabel')).toHaveText('Explore');
    await expect(page.locator('#patrolCount')).toHaveText('1');
    await page.locator('#patrolLogBtn').click();
    await expect(page.locator('#patrolLogPanel')).toBeVisible();
    await expect(page.locator('#patrolLogPanel')).toContainText('Neon Drift Patrol Pocket');
    await expect(page.locator('#patrolLogPanel')).toContainText(/complete/i);
    const savedContract = await page.evaluate(() => JSON.parse(localStorage.getItem('hyperblast-shooter-progress-v1')).contractState);
    expect(savedContract.completedContractIds).toContain('patrol-neon-drift');
    await expect(page.locator('#patrolLogPanel')).toContainText('Next reward: Standard repeat ¤25');

    const replayed = await page.evaluate(() => {
      const moneyBeforeReplay = window.game.state.local.money;
      const scoreBeforeReplay = window.game.state.local.score;
      window.game.launchPatrolContract();
      window.game.state.local.stageKills = window.game.state.local.stageGoal;
      window.game.completeActivePatrolContract();
      return {
        moneyDelta: window.game.state.local.money - moneyBeforeReplay,
        scoreDelta: window.game.state.local.score - scoreBeforeReplay,
        completed: window.game.contractState.completedContractIds,
      };
    });
    expect(replayed.moneyDelta).toBe(25);
    expect(replayed.scoreDelta).toBe(105);
    expect(replayed.completed).toEqual(['patrol-neon-drift']);

    await page.locator('#worldMapBtn').click();
    await page.locator('[data-world-id="ember-belt"]').click();
    await expect(page.locator('#worldLandingTitle')).toHaveText('Ember Belt');
    await page.locator('#landingCombatBtn').click();
    const secondStarted = await page.evaluate(() => ({
      activeContractId: window.game.contractState.activeContractId,
      completed: window.game.contractState.completedContractIds,
    }));
    expect(secondStarted.activeContractId).toBe('patrol-ember-belt');
    expect(secondStarted.completed).toContain('patrol-neon-drift');
    expect(seriousErrors(errors)).toEqual([]);
  });

  test('responds to keyboard input, fires bullets, and can restart cleanly', async ({ page }) => {
    const errors = await collectPageErrors(page);
    await page.goto('/hyperblast-shooter/index.html?embedded=true&directStart=true');
    await page.locator('#gameCanvas').click();

    const before = await page.evaluate(() => ({
      x: window.game.state.local.player.x,
      y: window.game.state.local.player.y,
      bullets: window.game.state.local.bullets.length,
    }));

    await page.keyboard.down('ArrowUp');
    await expect.poll(async () => page.evaluate(() => window.game.state.local.player.y)).toBeLessThan(before.y);
    await page.keyboard.up('ArrowUp');

    await page.keyboard.down('ArrowRight');
    await expect.poll(async () => page.evaluate(() => window.game.state.local.player.x)).toBeGreaterThan(before.x);
    await page.keyboard.up('ArrowRight');

    await page.keyboard.down('Space');
    await expect.poll(async () => page.evaluate(() => window.game.state.local.bullets.length)).toBeGreaterThanOrEqual(before.bullets + 1);
    await page.keyboard.up('Space');

    const after = await page.evaluate(() => ({
      x: window.game.state.local.player.x,
      y: window.game.state.local.player.y,
      vx: window.game.state.local.player.vx,
      vy: window.game.state.local.player.vy,
      tilt: window.game.state.local.player.tilt,
      bulletsCreated: window.game.state.local.bullets.length,
    }));
    expect(after.x).toBeGreaterThan(before.x);
    expect(after.y).toBeLessThan(before.y);
    expect(typeof after.vx).toBe('number');
    expect(typeof after.vy).toBe('number');
    expect(typeof after.tilt).toBe('number');
    expect(after.bulletsCreated).toBeGreaterThanOrEqual(before.bullets + 1);

    await page.locator('#restartBtn').click();
    await expect(page.locator('#score')).toHaveText('0');
    await expect(page.locator('#lives')).toHaveText('3');
    expect(seriousErrors(errors)).toEqual([]);
  });
});
