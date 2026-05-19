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
      && !text.includes('net::err')
      && !text.includes('clipboard')
      && !text.includes('fonts.googleapis')
      && !text.includes('fonts.gstatic');
  });
}

async function bootDaw(page, url = '/v11-peer-daw/index.html') {
  const errors = await collectPageErrors(page);
  await page.goto(url);
  await expect(page.locator('h1')).toContainText('V11 Peer DAW');
  await expect(page.locator('#modules')).toBeVisible();
  await page.waitForFunction(() => Boolean(window.v11PeerDAW?.patchBay));
  await expect(page.locator('.module-card')).toHaveCount(9);
  return errors;
}

test.describe('v11-peer-daw app', () => {
  test('boots the default modular rig with canvas, routes, mixer, and packet monitor', async ({ page }) => {
    const errors = await bootDaw(page);

    await expect(page.locator('#moduleCount')).toHaveText('9 modules');
    await expect(page.locator('#routeCount')).toContainText('7 packet');
    await expect(page.locator('#patchCanvas')).toBeVisible();
    await expect.poll(async () => page.locator('#routes li').count()).toBeGreaterThan(1);
    await expect.poll(async () => page.locator('#mixerStrip .strip').count()).toBeGreaterThan(0);
    await expect(page.locator('#eventLog')).toBeVisible();

    const state = await page.evaluate(() => ({
      moduleCount: window.v11PeerDAW.patchBay.modules.size,
      packetRouteCount: window.v11PeerDAW.patchBay.routes.length,
      hasClock: Boolean(window.v11PeerDAW.clock),
      hasMixer: Boolean(window.v11PeerDAW.mixer),
      canvasNodes: window.v11PeerDAW.routingGraph.nodes.size,
    }));
    expect(state).toMatchObject({ moduleCount: 9, packetRouteCount: 7, hasClock: true, hasMixer: true });
    expect(state.canvasNodes).toBeGreaterThanOrEqual(9);
    expect(seriousErrors(errors)).toEqual([]);
  });

  test('adds a module from the module bay, auto-patches it, then removes it cleanly', async ({ page }) => {
    const errors = await bootDaw(page);

    await page.locator('#addModule').selectOption('cleansynth');
    await expect(page.locator('#moduleCount')).toHaveText('10 modules');
    await expect(page.locator('.module-card')).toHaveCount(10);
    await expect(page.locator('.module-card:has-text("Clean Synth")')).toBeVisible();

    const afterAdd = await page.evaluate(() => ({
      moduleCount: window.v11PeerDAW.patchBay.modules.size,
      packetRouteCount: window.v11PeerDAW.patchBay.routes.length,
      audioRouteCount: window.v11PeerDAW.routingGraph.edges.filter((edge) => edge.type === 'audio').length,
    }));
    expect(afterAdd.moduleCount).toBe(10);
    expect(afterAdd.packetRouteCount).toBeGreaterThanOrEqual(8);
    expect(afterAdd.audioRouteCount).toBeGreaterThanOrEqual(1);

    await page.locator('.module-card:has-text("Clean Synth") .remove').last().click();
    await expect(page.locator('#moduleCount')).toHaveText('9 modules');
    await expect(page.locator('.module-card')).toHaveCount(9);
    const afterRemove = await page.evaluate(() => window.v11PeerDAW.patchBay.modules.size);
    expect(afterRemove).toBe(9);
    expect(seriousErrors(errors)).toEqual([]);
  });

  test('loads and stages bundled example projects for UI operation demos', async ({ page }) => {
    const errors = await bootDaw(page);

    await expect(page.locator('#exampleProjectSelect')).toBeVisible();
    await page.locator('#exampleProjectSelect').selectOption('detroit-pocket-conant-gardens-study');
    await page.locator('#btnStageExampleProject').click();
    await expect(page.locator('#projectIoText')).toHaveValue(/Detroit Pocket Study/);

    await page.locator('#btnLoadExampleProject').click();
    await expect(page.locator('#moduleCount')).toHaveText('10 modules');
    await expect(page.locator('#routeCount')).toContainText('8 packet');
    await expect(page.locator('.module-card:has-text("Dusty 2-Bar Drum Roll")')).toBeVisible();
    await expect(page.locator('.module-card:has-text("Filtered Pocket Bass")')).toBeVisible();

    await page.locator('#exampleProjectSelect').selectOption('fall-in-love-remix-sketch');
    await page.locator('#btnLoadExampleProject').click();
    await expect(page.locator('#moduleCount')).toHaveText('10 modules');
    await expect(page.locator('#routeCount')).toContainText('8 packet');
    await expect(page.locator('.module-card:has-text("Swing Remix Drum Roll")')).toBeVisible();
    await expect(page.locator('.module-card:has-text("Glass Bell FM")')).toBeVisible();

    const loaded = await page.evaluate(() => ({
      moduleIds: [...window.v11PeerDAW.patchBay.modules.keys()],
      routeCount: window.v11PeerDAW.patchBay.routes.length,
      clockBpm: window.v11PeerDAW.patchBay.modules.get('fil-clock')?.bpm,
    }));
    expect(loaded.moduleIds).toContain('main-mixer');
    expect(loaded.routeCount).toBe(8);
    expect(loaded.clockBpm).toBe(96);
    expect(seriousErrors(errors)).toEqual([]);
  });

  test('exports a project, clears routes, and imports the project back from JSON', async ({ page }) => {
    const errors = await bootDaw(page);

    await page.locator('#btnCopyProject').click();
    await expect(page.locator('#projectIoText')).toHaveValue(/"modules"/);
    const exported = await page.locator('#projectIoText').inputValue();
    expect(JSON.parse(exported).modules.length).toBe(9);

    await page.locator('#btnClearRoutes').click();
    await expect(page.locator('#routeCount')).toContainText('0 packet');

    await page.locator('#projectIoText').fill(exported);
    await page.evaluate(() => { window.__v11ClipboardText = ''; });
    await page.locator('#btnPasteProject').click();
    await expect(page.locator('#moduleCount')).toHaveText('9 modules');
    await expect(page.locator('#routeCount')).toContainText('7 packet');
    expect(seriousErrors(errors)).toEqual([]);
  });

  test('direct join URL updates pilot identity and logs join intent without user clicks', async ({ page }) => {
    const errors = await bootDaw(
      page,
      '/v11-peer-daw/index.html?multiplayer=true&username=E2EPilot&targetPeerId=peer-123&observe=true&session=ROOM42'
    );

    await expect(page.locator('#pilotName')).toHaveValue('E2EPilot');
    await expect(page.locator('#eventLog')).toContainText('observing peer session for peer-123');
    const joinState = await page.evaluate(() => ({
      sessionCode: window.v11PeerDAW.sessionCode,
      targetPeerId: window.v11PeerDAW.targetPeerId,
      spectateMode: window.v11PeerDAW.spectateMode,
    }));
    expect(joinState).toEqual({ sessionCode: 'ROOM42', targetPeerId: 'peer-123', spectateMode: true });
    expect(seriousErrors(errors)).toEqual([]);
  });
});

test.describe('app-hub-v11 integration for v11-peer-daw', () => {
  test('launches v11-peer-daw inline from the hub and gives the DAW iframe usable vertical space', async ({ page }) => {
    const errors = await collectPageErrors(page);
    await page.goto('/app-hub-v11/index.html');
    await page.locator('#search').fill('V11 Peer DAW');
    const card = page.locator('[data-id="v11-peer-daw"]').first();
    await expect(card).toBeVisible();
    await card.locator('[data-launch="inline"]').click();

    await expect(page.locator('#workspacePane.active')).toBeVisible();
    await expect(page.locator('#appDeck')).toHaveClass(/active/);
    const dawFrame = page.frameLocator('iframe[title="V11 Peer DAW"]').first();
    await expect(dawFrame.locator('#modules')).toBeVisible();
    await expect(dawFrame.locator('.module-card')).toHaveCount(9);

    const iframeBox = await page.locator('iframe[title="V11 Peer DAW"]').boundingBox();
    expect(iframeBox?.height || 0).toBeGreaterThan(260);
    expect(seriousErrors(errors)).toEqual([]);
  });
});
