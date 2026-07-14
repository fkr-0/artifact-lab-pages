import { expect, test } from '@playwright/test';
import { installFakePeerJs } from './fake-peerjs-network.mjs';

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

let dawSessionSequence = 0;

function isolatedDawSession(label = 'case') {
  return `E2E-${process.pid}-${String(label).toUpperCase()}-${dawSessionSequence++}`;
}

function dawUrl({ session = isolatedDawSession(), username = 'e2e' } = {}) {
  return `/v11-peer-daw/index.html?session=${encodeURIComponent(session)}&username=${encodeURIComponent(username)}`;
}

async function openDrawerFor(page, selector) {
  const drawer = page.locator(`details:has(${selector})`);
  if (!(await drawer.evaluate((element) => element.open))) {
    await drawer.evaluate((element) => {
      element.open = true;
      element.dispatchEvent(new Event('toggle'));
    });
  }
  await drawer.scrollIntoViewIfNeeded();
  return drawer;
}

async function bootDaw(page, url = dawUrl(), { moduleCount = 9 } = {}) {
  const errors = await collectPageErrors(page);
  await page.goto(url);
  await expect(page.locator('h1')).toContainText('V11 Peer DAW');
  await expect(page.locator('#modules')).toBeVisible();
  await page.waitForFunction(() => Boolean(window.v11PeerDAW?.patchBay));
  await expect(page.locator('.module-card')).toHaveCount(moduleCount);
  return errors;
}

test.describe('v11-peer-daw app', () => {
  test.describe.configure({ mode: 'serial' });

  test('converges two default V11 Open Studio clients through the local session bus', async ({ browser }) => {
    const context = await browser.newContext();
    const pilotA = await context.newPage();
    const pilotB = await context.newPage();
    const session = isolatedDawSession('convergence');
    const errorsA = await bootDaw(pilotA, dawUrl({ session, username: 'alpha' }));
    const errorsB = await bootDaw(pilotB, dawUrl({ session, username: 'beta' }));

    await expect(pilotA.locator('#sessionCode')).toHaveText(session);
    await expect(pilotB.locator('#sessionCode')).toHaveText(session);
    await expect(pilotA.locator('#workspaceMainView')).toContainText('Participants');
    await expect(pilotB.locator('#workspaceMainView')).toContainText('Participants');
    await expect(pilotA.locator('#localPeerCount')).toHaveText('1');
    await expect(pilotB.locator('#localPeerCount')).toHaveText('1');
    await expect
      .poll(() => pilotA.evaluate(() => window.v11PeerDAW.collaboration.compatiblePeerIds().length))
      .toBe(1);
    await expect
      .poll(() => pilotB.evaluate(() => window.v11PeerDAW.collaboration.compatiblePeerIds().length))
      .toBe(1);

    await pilotA.locator('#addModule').selectOption('cleansynth');
    await expect(pilotA.locator('#moduleCount')).toHaveText('10 modules');
    await expect(pilotB.locator('#moduleCount')).toHaveText('10 modules', { timeout: 10000 });
    await expect(pilotB.locator('.module-card:has-text("Clean Synth")')).toBeVisible();
    await expect(pilotB.locator('#eventLog')).toContainText('local session project update');

    expect(seriousErrors([...errorsA, ...errorsB])).toEqual([]);
    await context.close();
  });

  test('hydrates a late joiner from the current room snapshot without another edit', async ({ browser }) => {
    const context = await browser.newContext();
    const pilotA = await context.newPage();
    const pilotB = await context.newPage();
    const session = isolatedDawSession('late-join');
    const errorsA = await bootDaw(pilotA, dawUrl({ session, username: 'alpha' }));

    await pilotA.locator('#addModule').selectOption('cleansynth');
    await expect(pilotA.locator('#moduleCount')).toHaveText('10 modules');

    const errorsB = await bootDaw(
      pilotB,
      dawUrl({ session, username: 'late-beta' }),
      { moduleCount: 10 }
    );
    await expect(pilotB.locator('.module-card:has-text("Clean Synth")')).toBeVisible();
    await expect(pilotB.locator('#eventLog')).toContainText('local session snapshot received');
    await expect(pilotB.locator('#projectSyncSummary')).toContainText('synced');
    await expect(pilotA.locator('#localPeerCount')).toHaveText('1');
    await expect(pilotB.locator('#localPeerCount')).toHaveText('1');

    expect(seriousErrors([...errorsA, ...errorsB])).toEqual([]);
    await context.close();
  });

  test('hydrates and acknowledges projects over Peernet when the local bus is disabled', async ({ browser }) => {
    const context = await browser.newContext();
    await installFakePeerJs(context);
    const pilotA = await context.newPage();
    const pilotB = await context.newPage();
    const session = isolatedDawSession('remote-hydration');
    const remoteUrl = (username) =>
      `${dawUrl({ session, username })}&localSync=false`;
    const errorsA = await bootDaw(pilotA, remoteUrl('remote-alpha'));

    await expect
      .poll(() => pilotA.evaluate(() => window.v11PeerDAW.peernet.health().role))
      .toBe('hub');
    await pilotA.locator('#addModule').selectOption('cleansynth');
    await expect(pilotA.locator('#moduleCount')).toHaveText('10 modules');

    const errorsB = await bootDaw(pilotB, remoteUrl('remote-beta'), { moduleCount: 10 });
    await expect(pilotA.locator('#localPeerCount')).toHaveText('0');
    await expect(pilotB.locator('#localPeerCount')).toHaveText('0');
    await expect(pilotB.locator('#eventLog')).toContainText('Peernet room snapshot received');
    await expect(pilotB.locator('#projectSyncSummary')).toContainText('peernet');

    await pilotA.locator('#addModule').selectOption('fmsynth');
    await expect(pilotB.locator('#moduleCount')).toHaveText('11 modules');
    await expect(pilotB.locator('#eventLog')).toContainText('Peernet project update');
    await expect(pilotA.locator('#projectSyncSummary')).toContainText('ack');
    await expect
      .poll(() =>
        pilotB.evaluate(
          () => window.v11PeerDAW.projectSync.diagnostics().transports.peernet?.receivedAt || 0
        )
      )
      .toBeGreaterThan(0);

    expect(seriousErrors([...errorsA, ...errorsB])).toEqual([]);
    await context.close();
  });

  test('merges acknowledged incremental operations without rebuilding either rig', async ({ browser }) => {
    const context = await browser.newContext();
    const pilotA = await context.newPage();
    const pilotB = await context.newPage();
    const session = isolatedDawSession('operation-convergence');
    const errorsA = await bootDaw(pilotA, dawUrl({ session, username: 'op-alpha' }));
    const errorsB = await bootDaw(pilotB, dawUrl({ session, username: 'op-beta' }));

    await expect
      .poll(() => pilotA.evaluate(() => window.v11PeerDAW.collaboration.compatiblePeerIds().length))
      .toBe(1);
    await expect
      .poll(() => pilotB.evaluate(() => window.v11PeerDAW.collaboration.compatiblePeerIds().length))
      .toBe(1);

    await Promise.all(
      [pilotA, pilotB].map((page) =>
        page.evaluate(() => {
          const app = window.v11PeerDAW;
          app.__operationTestRebuilds = 0;
          const original = app.rebuildRigFromProject.bind(app);
          app.rebuildRigFromProject = async (...args) => {
            app.__operationTestRebuilds += 1;
            return original(...args);
          };
        })
      )
    );
    await pilotA.waitForTimeout(900);
    const rebuildBaseline = await Promise.all(
      [pilotA, pilotB].map((page) =>
        page.evaluate(() => ({
          rebuilds: window.v11PeerDAW.__operationTestRebuilds,
          legacy: window.v11PeerDAW.hasLegacyCollaborationPeers(),
          compatible: window.v11PeerDAW.collaboration.compatiblePeerIds().length,
        }))
      )
    );
    expect(rebuildBaseline.map((state) => state.compatible)).toEqual([1, 1]);
    expect(rebuildBaseline.map((state) => state.legacy)).toEqual([false, false]);

    await pilotA.locator('[data-workspace-view="mixer"]').click();
    const masterA = pilotA.locator('[data-module-input="master-volume"]');
    await masterA.focus();
    await pilotB.evaluate(() => {
      const app = window.v11PeerDAW;
      app.focusedModuleId = app.clock.id;
      app.setWorkspaceView('module');
    });
    const bpmB = pilotB.locator('[data-module-input="clock-bpm"]');

    await Promise.all([masterA.fill('0.42'), bpmB.fill('137')]);

    await expect
      .poll(() => pilotA.evaluate(() => window.v11PeerDAW.clock.bpm))
      .toBe(137);
    await expect
      .poll(() => pilotB.evaluate(() => window.v11PeerDAW.mixerState.masterVolume))
      .toBeCloseTo(0.42, 5);
    await expect(masterA).toBeFocused();
    await expect
      .poll(() => pilotA.evaluate(() => window.v11PeerDAW.__operationTestRebuilds))
      .toBe(rebuildBaseline[0].rebuilds);
    await expect
      .poll(() => pilotB.evaluate(() => window.v11PeerDAW.__operationTestRebuilds))
      .toBe(rebuildBaseline[1].rebuilds);

    await expect
      .poll(() =>
        pilotA.evaluate(() =>
          [...window.v11PeerDAW.collaboration.journal.entries.values()].every(
            (entry) => entry.status === 'acknowledged'
          )
        )
      )
      .toBe(true);
    await expect
      .poll(() =>
        pilotB.evaluate(() =>
          [...window.v11PeerDAW.collaboration.journal.entries.values()].every(
            (entry) => entry.status === 'acknowledged'
          )
        )
      )
      .toBe(true);

    const payloadRatio = await pilotA.evaluate(() => {
      const entries = [...window.v11PeerDAW.collaboration.journal.entries.values()];
      const operation = entries.at(-1)?.operation;
      return JSON.stringify(operation).length / JSON.stringify(window.v11PeerDAW.serializeRig()).length;
    });
    expect(payloadRatio).toBeLessThan(0.1);

    await pilotA.locator('#btnSyncCenter').click();
    await expect(pilotA.locator('#syncCenter')).toHaveAttribute('aria-hidden', 'false');
    await expect(pilotA.locator('[data-sync-state]')).toHaveText('SYNCED');
    await expect(pilotA.locator('[data-sync-activity]')).toContainText(/master|tempo/i);
    await expect(pilotA.locator('[data-sync-pending]')).toContainText('No pending operations');

    expect(seriousErrors([...errorsA, ...errorsB])).toEqual([]);
    await context.close();
  });

  test('persists and replays the local operation journal across reload', async ({ browser }) => {
    const context = await browser.newContext();
    await installFakePeerJs(context);
    const page = await context.newPage();
    const session = isolatedDawSession('operation-replay');
    const errors = await bootDaw(
      page,
      `${dawUrl({ session, username: 'offline-editor' })}&localSync=false`
    );

    await page.locator('[data-workspace-view="mixer"]').click();
    await page.locator('[data-module-input="master-volume"]').fill('0.36');
    const before = await page.evaluate(() => {
      const app = window.v11PeerDAW;
      const entry = [...app.collaboration.journal.entries.values()].at(-1);
      return {
        actorId: app.clientId,
        opId: entry.operation.opId,
        attempts: entry.attempts,
        pending: app.collaboration.diagnostics().pendingCount,
      };
    });
    expect(before.pending).toBeGreaterThan(0);

    await page.reload();
    await page.waitForFunction(() => Boolean(window.v11PeerDAW?.collaboration));
    const after = await page.evaluate((opId) => {
      const app = window.v11PeerDAW;
      const entry = app.collaboration.journal.entries.get(opId);
      return {
        actorId: app.clientId,
        exists: Boolean(entry),
        attempts: entry?.attempts || 0,
        pending: app.collaboration.diagnostics().pendingCount,
      };
    }, before.opId);

    expect(after.actorId).toBe(before.actorId);
    expect(after.exists).toBe(true);
    expect(after.attempts).toBeGreaterThan(before.attempts);
    expect(after.pending).toBeGreaterThan(0);
    await expect(page.locator('#btnSyncCenter')).toContainText(/PENDING|RECONNECTING/);
    await page.locator('#btnSyncCenter').click();
    await expect(page.locator('[data-sync-pending]')).toContainText(before.opId);

    expect(seriousErrors(errors)).toEqual([]);
    await context.close();
  });

  test('supports a persistent focus layout, collapsible production surfaces, and keyboard view navigation', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1180, height: 680 } });
    const page = await context.newPage();
    const errors = await bootDaw(
      page,
      dawUrl({ session: isolatedDawSession('layout-ux'), username: 'layout-pilot' })
    );

    await expect(page.locator('#workspaceTitle')).toHaveText('Session');
    await expect(page.locator('#workspaceDescription')).toContainText('project synchronization');
    await expect(page.locator('#btnToggleLeftPanel')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#btnToggleRightPanel')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('[data-drawer-key="Packet Monitor"] summary').click();

    await page.locator('#btnWorkspaceFocus').click();
    await expect(page.locator('.shell')).toHaveClass(/layout-focus-mode/);
    await expect(page.locator('.sidebar-left')).toBeHidden();
    await expect(page.locator('.inspector')).toBeHidden();
    await expect(page.locator('#btnWorkspaceFocus')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#toastRegion')).toContainText('Focus mode enabled');

    await page.keyboard.press('Control+6');
    await expect(page.locator('#workspaceTitle')).toHaveText('Mixer');
    await expect(page.locator('.workspace-tab[data-workspace-view="mixer"]')).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(page.locator('#workspaceContextMeta')).toHaveText('Ctrl 6');

    await page.locator('#btnTogglePatchCanvas').click();
    await page.locator('#btnToggleRack').click();
    await expect(page.locator('#patchSurface')).toHaveAttribute('data-collapsed', 'true');
    await expect(page.locator('#rackSurface')).toHaveAttribute('data-collapsed', 'true');
    await expect(page.locator('#btnTogglePatchCanvas')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#btnToggleRack')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('[data-drawer-key="Packet Monitor"]')).not.toHaveAttribute('open', '');

    await page.reload();
    await page.waitForFunction(() => Boolean(window.v11PeerDAW?.patchBay));
    await expect(page.locator('.shell')).toHaveClass(/layout-focus-mode/);
    await expect(page.locator('#workspaceTitle')).toHaveText('Mixer');
    await expect(page.locator('#patchSurface')).toHaveAttribute('data-collapsed', 'true');
    await expect(page.locator('#rackSurface')).toHaveAttribute('data-collapsed', 'true');
    await expect(page.locator('[data-drawer-key="Packet Monitor"]')).not.toHaveAttribute('open', '');

    await page.keyboard.press('Control+Shift+KeyF');
    await expect(page.locator('.shell')).not.toHaveClass(/layout-focus-mode/);
    await expect(page.locator('.sidebar-left')).toBeVisible();
    await expect(page.locator('.inspector')).toBeVisible();

    await page.locator('.workspace-tab[data-workspace-view="mixer"]').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#workspaceTitle')).toHaveText(/Focused Module|OCRA|Clock/);
    await expect(page.locator('.workspace-tab[data-workspace-view="module"]')).toBeFocused();
    await expect(page.locator('#inspectorMixerCount')).not.toHaveText('0');
    await expect(page.locator('#inspectorRouteCount')).not.toHaveText('0');

    await page.setViewportSize({ width: 580, height: 900 });
    await expect(page.locator('.layout-controls')).toBeVisible();
    await expect(page.locator('.workspace-tabs')).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
      )
      .toBe(true);

    expect(seriousErrors(errors)).toEqual([]);
    await context.close();
  });

  test('joins a room from the session code control and updates the URL', async ({ browser }) => {
    const context = await browser.newContext();
    const pilotA = await context.newPage();
    const pilotB = await context.newPage();
    const sharedSession = isolatedDawSession('manual-room');
    const otherSession = isolatedDawSession('other-room');
    const errorsA = await bootDaw(
      pilotA,
      dawUrl({ session: sharedSession, username: 'alpha' })
    );
    const errorsB = await bootDaw(
      pilotB,
      dawUrl({ session: otherSession, username: 'beta' })
    );

    await pilotA.locator('#addModule').selectOption('cleansynth');
    await expect(pilotA.locator('#moduleCount')).toHaveText('10 modules');
    await pilotB.locator('#sessionCodeInput').fill(sharedSession.toLowerCase());
    await pilotB.locator('#btnJoinSession').click();

    await expect(pilotB.locator('#sessionCode')).toHaveText(sharedSession);
    await expect(pilotB).toHaveURL(new RegExp(`session=${encodeURIComponent(sharedSession)}`));
    await expect(pilotB.locator('#moduleCount')).toHaveText('10 modules');
    await expect(pilotB.locator('#projectSyncSummary')).toContainText('synced');
    await expect(pilotA.locator('#localPeerCount')).toHaveText('1');
    await expect(pilotB.locator('#localPeerCount')).toHaveText('1');

    expect(seriousErrors([...errorsA, ...errorsB])).toEqual([]);
    await context.close();
  });

  test('resolves simultaneous local-session edits deterministically on every client', async ({ browser }) => {
    const context = await browser.newContext();
    const pilotA = await context.newPage();
    const pilotB = await context.newPage();
    const session = isolatedDawSession('conflict');
    const errorsA = await bootDaw(pilotA, dawUrl({ session, username: 'alpha' }));
    const errorsB = await bootDaw(pilotB, dawUrl({ session, username: 'beta' }));
    await expect(pilotA.locator('#localPeerCount')).toHaveText('1');
    await expect(pilotB.locator('#localPeerCount')).toHaveText('1');

    const clients = await Promise.all([
      pilotA.evaluate(() => window.v11PeerDAW.clientId),
      pilotB.evaluate(() => window.v11PeerDAW.clientId),
    ]);
    const expectedBpm = clients[0].localeCompare(clients[1]) > 0 ? 111 : 222;
    const startAt = Date.now() + 250;
    await Promise.all([
      pilotA.evaluate(async ({ startAt: at }) => {
        while (Date.now() < at) await new Promise((resolve) => setTimeout(resolve, 5));
        const app = window.v11PeerDAW;
        app.clock.bpm = 111;
        app.publishCollaborativeOperation(
          'clock',
          'set-bpm',
          { moduleId: app.clock.id, moduleTitle: app.clock.title, field: 'bpm' },
          { value: 111 },
          { reason: 'simultaneous-alpha', coalesce: true }
        );
      }, { startAt }),
      pilotB.evaluate(async ({ startAt: at }) => {
        while (Date.now() < at) await new Promise((resolve) => setTimeout(resolve, 5));
        const app = window.v11PeerDAW;
        app.clock.bpm = 222;
        app.publishCollaborativeOperation(
          'clock',
          'set-bpm',
          { moduleId: app.clock.id, moduleTitle: app.clock.title, field: 'bpm' },
          { value: 222 },
          { reason: 'simultaneous-beta', coalesce: true }
        );
      }, { startAt }),
    ]);

    await expect.poll(() => pilotA.evaluate(() => window.v11PeerDAW.clock.bpm)).toBe(expectedBpm);
    await expect.poll(() => pilotB.evaluate(() => window.v11PeerDAW.clock.bpm)).toBe(expectedBpm);
    await expect
      .poll(() => pilotA.evaluate(() => window.v11PeerDAW.collaboration.diagnostics().pendingCount))
      .toBe(0);
    await expect
      .poll(() => pilotB.evaluate(() => window.v11PeerDAW.collaboration.diagnostics().pendingCount))
      .toBe(0);
    expect(
      await pilotA.evaluate(() => window.v11PeerDAW.collaboration.diagnostics().conflictCount)
    ).toBe(0);
    expect(
      await pilotB.evaluate(() => window.v11PeerDAW.collaboration.diagnostics().conflictCount)
    ).toBe(0);
    expect(seriousErrors([...errorsA, ...errorsB])).toEqual([]);
    await context.close();
  });

  test('boots the default modular rig with canvas, routes, mixer, and packet monitor', async ({ page }) => {
    const errors = await bootDaw(page);
    const session = await page.locator('#sessionCode').textContent();

    await expect(page.locator('#moduleCount')).toHaveText('9 modules');
    await expect(page.locator('#appVersion')).toHaveText('v1.4.0');
    await expect(page.locator('#routeCount')).toContainText('7 packet');
    expect(session).toMatch(/^E2E-/);
    await expect(page.locator('#workspaceMainView')).toContainText('Shared session');
    await expect(page.locator('#workspaceMainView')).toContainText(session);
    await expect(page.locator('#patchCanvas')).toBeVisible();
    await expect.poll(async () => page.locator('#routes li').count()).toBeGreaterThan(1);
    await expect.poll(async () => page.locator('#mixerStrip .strip').count()).toBeGreaterThan(0);
    await expect(page.locator('#eventLog')).toBeVisible();
    await expect(page.locator('#sessionHealthSummary')).not.toContainText('starting');

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

  test('shows serious workspace views for session, clips, arrangement, mixer, and module detail', async ({ page }) => {
    const errors = await bootDaw(page);

    await expect(page.locator('#workspaceMainView')).toContainText('Shared session');
    await page.locator('[data-workspace-view="clips"]').click();
    await expect(page.locator('#workspaceMainView')).toContainText('CREATE CLIP');
    await expect(page.locator('#workspaceMainView .clip-slot-row')).toHaveCount(4);
    await page.locator('[data-clip-action="create"]').click();
    await expect(page.locator('#workspaceMainView .clip-slot-row')).toHaveCount(5);
    await page.locator('[data-clip-action="launch"]').first().click();
    await expect(page.locator('#eventLog')).toContainText('clip launched');
    await page.locator('[data-clip-action="place"]').first().click();
    await expect(page.locator('#eventLog')).toContainText('clip placed on arrangement');
    await page.locator('[data-workspace-view="arrangement"]').click();
    await expect(page.locator('#workspaceMainView .timeline-lane')).toHaveCount(1);
    await expect(page.locator('#workspaceMainView .timeline-clip')).toHaveCount(1);
    await expect(page.locator('#workspaceMainView')).toContainText('Arrangement editing');
    await page.locator('[data-arrangement-input="loop-start"]').fill('2');
    await page.locator('[data-arrangement-input="loop-end"]').fill('10');
    await page.locator('[data-arrangement-input="preview-beat"]').fill('12');
    await expect(page.locator('#eventLog')).toContainText('arrangement preview beat');
    await page.locator('[data-arrangement-action="move-right"]').first().click();
    await expect(page.locator('#eventLog')).toContainText('arrangement clip moved');
    await page.locator('[data-arrangement-action="duplicate"]').first().click();
    await expect(page.locator('#workspaceMainView .timeline-clip')).toHaveCount(2);
    await page.locator('[data-arrangement-action="delete"]').last().click();
    await expect(page.locator('#workspaceMainView .timeline-clip')).toHaveCount(1);
    const arrangementState = await page.evaluate(() => ({
      loopStart: window.v11PeerDAW.arrangement.loopStartBeat,
      loopEnd: window.v11PeerDAW.arrangement.loopEndBeat,
      placements: window.v11PeerDAW.arrangement.clips.length,
      currentBeat: window.v11PeerDAW.currentBeat,
    }));
    expect(arrangementState).toMatchObject({ loopStart: 2, loopEnd: 10, placements: 1 });
    expect(arrangementState.currentBeat).toBeGreaterThanOrEqual(2);
    expect(arrangementState.currentBeat).toBeLessThan(10);
    const arrangementClip = page.locator('[data-arrangement-clip]').first();
    const arrangementClipLabel = arrangementClip.locator(':scope > strong');
    await arrangementClip.scrollIntoViewIfNeeded();
    const clipBox = await arrangementClip.boundingBox();
    expect(clipBox).toBeTruthy();
    const clipLabelBox = await arrangementClipLabel.boundingBox();
    expect(clipLabelBox).toBeTruthy();
    await arrangementClipLabel.hover();
    await page.mouse.down();
    await page.mouse.move(clipLabelBox.x + clipLabelBox.width / 2 + 150, clipLabelBox.y + clipLabelBox.height / 2, {
      steps: 5,
    });
    await page.mouse.up();
    await expect(page.locator('#eventLog')).toContainText('arrangement clip dragged');
    const draggedBeat = await page.evaluate(() => window.v11PeerDAW.arrangement.clips[0].startBeat);
    expect(draggedBeat).toBeGreaterThan(arrangementState.placements - 1);
    await page.keyboard.down(process.platform === 'darwin' ? 'Meta' : 'Control');
    const copyModifierKey = process.platform === 'darwin' ? 'meta' : 'control';
    await expect
      .poll(() =>
        page.evaluate((key) => window.v11PeerDAW.modifierState[key], copyModifierKey)
      )
      .toBe(true);
    const copyGesture = await page.evaluate(() => {
      const app = window.v11PeerDAW;
      if (!app || app.arrangement.clips.length !== 1) {
        return { copied: false, count: app?.arrangement?.clips?.length || 0 };
      }
      const fakeTrack = {
        getBoundingClientRect() {
          return { width: 800 };
        },
      };
      const fakeClip = {
        dataset: { placementIndex: '0' },
        isConnected: false,
        closest(selector) {
          return selector === '.timeline-track' ? fakeTrack : null;
        },
      };
      const fakeTarget = {
        closest(selector) {
          if (selector === '[data-arrangement-clip]') return fakeClip;
          return null;
        },
      };
      const startX = 100;
      const startY = 20;
      app.handleArrangementPointerDown({
        target: fakeTarget,
        clientX: startX,
        clientY: startY,
        pointerId: 77,
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        shiftKey: false,
        preventDefault() {},
      });
      const copied = Boolean(app.arrangementDrag?.copied);
      app.handleArrangementPointerMove({
        buttons: 1,
        clientX: startX + 80,
        clientY: startY,
      });
      app.endArrangementDrag();
      return { copied, count: app.arrangement.clips.length };
    });
    await page.keyboard.up(process.platform === 'darwin' ? 'Meta' : 'Control');
    expect(copyGesture).toEqual({ copied: true, count: 2 });
    await expect(page.locator('#eventLog')).toContainText('arrangement clip copied');
    await page.locator('[data-workspace-view="arrangement"]').click();
    await expect(page.locator('[data-arrangement-clip]')).toHaveCount(2);
    await page.locator('[data-arrangement-clip]').last().click({ modifiers: ['Alt'] });
    await expect(page.locator('[data-arrangement-clip]')).toHaveCount(1);
    const beforeResizeLength = await page.evaluate(() => window.v11PeerDAW.arrangement.clips[0].clip.lengthBeats);
    const resizeBox = await page.locator('[data-arrangement-clip]').first().boundingBox();
    await page.mouse.move(resizeBox.x + resizeBox.width - 3, resizeBox.y + 12);
    await page.mouse.down();
    await page.mouse.move(resizeBox.x + resizeBox.width + 140, resizeBox.y + 12, { steps: 5 });
    await page.mouse.up();
    await expect(page.locator('#eventLog')).toContainText('arrangement clip resized');
    const afterResizeLength = await page.evaluate(() => window.v11PeerDAW.arrangement.clips[0].clip.lengthBeats);
    expect(afterResizeLength).toBeGreaterThan(beforeResizeLength);
    await page.locator('[data-workspace-view="mixer"]').click();
    await expect(page.locator('#workspaceMainView')).toContainText('Master');
    await expect(page.locator('#workspaceMainView .mixer-channel')).toHaveCount(6);
    await page.locator('[data-module-input="master-volume"]').fill('0.55');
    await page.locator('#workspaceMainView [data-module-action="toggle-mute"]').first().click();
    await expect(page.locator('#workspaceMainView .mixer-channel.muted')).toHaveCount(1);
    await page.locator('#workspaceMainView [data-module-action="toggle-solo"]').first().click();
    await expect(page.locator('#workspaceMainView .mixer-channel.solo')).toHaveCount(1);
    const mixerState = await page.evaluate(() => window.v11PeerDAW.serializeMixerState());
    expect(mixerState.masterVolume).toBeCloseTo(0.55);
    expect(Object.values(mixerState.channels).some((channel) => channel.muted && channel.solo)).toBe(true);
    await page.locator('[data-workspace-view="module"]').click();
    await expect(page.locator('#workspaceMainView')).toContainText('Shift+arrows length/velocity');
    await expect(page.locator('#workspaceMainView .piano-cell.on').first()).toBeVisible();
    const noteCountBefore = await page.evaluate(() => window.v11PeerDAW.patchBay.modules.get('default-drum-roll')?.notes.length);
    await page.locator('#workspaceMainView .piano-cell:not(.on)').first().click();
    const noteCountAfter = await page.evaluate(() => window.v11PeerDAW.patchBay.modules.get('default-drum-roll')?.notes.length);
    expect(noteCountAfter).toBe(noteCountBefore + 1);
    await page.locator('#workspaceMainView .piano-cell.on').first().click({ modifiers: ['Shift'] });
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+D' : 'Control+D');
    await expect(page.locator('#eventLog')).toContainText('duplicated 2 grid cells');
    const noteCountDuplicated = await page.evaluate(() => window.v11PeerDAW.patchBay.modules.get('default-drum-roll')?.notes.length);
    expect(noteCountDuplicated).toBeGreaterThan(noteCountAfter);
    await page.keyboard.press('Shift+ArrowRight');
    await page.keyboard.press('Shift+ArrowUp');
    await expect(page.locator('#eventLog')).toContainText('grid keyboard edit');
    const keyboardEditedNotes = await page.evaluate(() => {
      const roll = window.v11PeerDAW.patchBay.modules.get('default-drum-roll');
      return roll.notes.map((note) => ({ note: note.note, beat: note.beat, duration: note.duration, velocity: note.velocity }));
    });
    expect(keyboardEditedNotes.some((note) => note.duration > 0.5)).toBe(true);
    expect(keyboardEditedNotes.some((note) => note.velocity > 0.8)).toBe(true);
    await page.keyboard.press('Delete');
    await expect(page.locator('#eventLog')).toContainText('erased');
    const noteCountAfterDelete = await page.evaluate(() => window.v11PeerDAW.patchBay.modules.get('default-drum-roll')?.notes.length);
    expect(noteCountAfterDelete).toBeLessThan(noteCountDuplicated);
    await page.locator('[data-workspace-view="module"]').click();
    await expect(page.locator('#workspaceMainView [data-module-action="clear-notes"]')).toBeVisible();
    await page.locator('#workspaceMainView [data-module-action="clear-notes"]').click();
    await expect(page.locator('#workspaceMainView')).toContainText('No notes yet');

    await page.locator('[data-module-id="main-synth"] .focus').click();
    await expect(page.locator('#workspaceMainView')).toContainText('Full synth control panel');
    await expect(page.locator('#workspaceMainView')).toContainText('Patch summary');
    await expect(page.locator('#workspaceMainView .module-port-grid .pill')).toHaveCount(3);
    await page.locator('[data-module-input="synth-param"][data-param-key="cutoff"]').fill('2400');
    await page.locator('[data-module-input="synth-param"][data-param-key="release"]').fill('0.42');
    await page.locator('[data-module-action="audition-chord"]').click();
    await expect(page.locator('#eventLog')).toContainText('audition chord: Main Synth');
    const focusedSynth = await page.evaluate(() => ({
      cutoff: window.v11PeerDAW.patchBay.modules.get('main-synth')?.cutoff,
      release: window.v11PeerDAW.patchBay.modules.get('main-synth')?.release,
      focused: window.v11PeerDAW.focusedModuleId,
    }));
    expect(focusedSynth).toMatchObject({ cutoff: 2400, release: 0.42, focused: 'main-synth' });

    await page.locator('#addModule').selectOption('analogsynth');
    await page.locator('.module-card:has-text("Subtractive Analog Synth") .focus').last().click();
    await expect(page.locator('#workspaceMainView')).toContainText('Filter / Drive');
    await expect(page.locator('#workspaceMainView')).toContainText('Envelope');
    await page.locator('[data-module-input="synth-param"][data-param-key="oscillatorMix.saw"]').fill('0.9');
    await page.locator('[data-module-input="synth-param"][data-param-key="resonance"]').fill('9');
    await page.locator('[data-module-input="synth-param"][data-param-key="attack"]').fill('0.08');
    const analogState = await page.evaluate(() => {
      const analog = [...window.v11PeerDAW.patchBay.modules.values()].find((module) => module.title === 'Subtractive Analog Synth');
      return { saw: analog.oscillatorMix.saw, resonance: analog.resonance, attack: analog.attack };
    });
    expect(analogState).toMatchObject({ saw: 0.9, resonance: 9, attack: 0.08 });

    await page.locator('#addModule').selectOption('fmsynth');
    await page.locator('.module-card:has-text("FM / Phase Mod Synth") .focus').last().click();
    await expect(page.locator('#workspaceMainView')).toContainText('FM operator');
    await page.locator('[data-module-input="synth-param"][data-param-key="carrierRatio"]').fill('1.5');
    await page.locator('[data-module-input="synth-param"][data-param-key="modulationIndex"]').fill('5.5');
    const fmState = await page.evaluate(() => {
      const fm = [...window.v11PeerDAW.patchBay.modules.values()].find((module) => module.title === 'FM / Phase Mod Synth');
      return { carrierRatio: fm.carrierRatio, modulationIndex: fm.modulationIndex };
    });
    expect(fmState).toMatchObject({ carrierRatio: 1.5, modulationIndex: 5.5 });
    await page.locator('[data-module-input="synth-param"][data-param-key="modulationIndex"]').fill('0');
    await expect.poll(() => page.evaluate(() => {
      const fm = [...window.v11PeerDAW.patchBay.modules.values()].find((module) => module.title === 'FM / Phase Mod Synth');
      return fm.modulationIndex;
    })).toBe(0);

    await page.locator('#addModule').selectOption('wavetablesynth');
    await page.locator('.module-card:has-text("Wavetable Synth") .focus').last().click();
    await expect(page.locator('#workspaceMainView')).toContainText('Wavetable');
    await page.locator('[data-module-input="synth-param"][data-param-key="wavetable"]').selectOption('glass');
    await page.locator('[data-module-input="synth-param"][data-param-key="morph"]').fill('0.77');
    const waveState = await page.evaluate(() => {
      const wavetable = [...window.v11PeerDAW.patchBay.modules.values()].find((module) => module.title === 'Wavetable Synth');
      return { wavetable: wavetable.wavetable, morph: wavetable.morph };
    });
    expect(waveState).toMatchObject({ wavetable: 'glass', morph: 0.77 });

    await page.locator('[data-module-id="main-sampler"] .focus').click();
    await expect(page.locator('#workspaceMainView')).toContainText('Sample editor coverage');
    await expect(page.locator('#workspaceMainView')).toContainText('Pitch/time');
    await page.locator('[data-module-input="sampler-param"][data-param-key="rootNote"]').fill('D4');
    await page.locator('[data-module-input="sampler-meta"][data-meta-key="tags"]').fill('field, chopped');
    await page.locator('[data-module-input="waveform-edit"][data-waveform-key="trimStartMs"]').fill('25');
    await page.locator('[data-module-input="waveform-edit"][data-waveform-key="fadeInMs"]').fill('10');
    await page.locator('[data-module-action="waveform-normalize"]').click();
    await page.locator('[data-module-action="waveform-reverse"]').click();
    await page.locator('[data-module-action="sampler-add-cue"]').click();
    await page.locator('[data-module-action="sampler-sync-library"]').click();
    await expect(page.locator('#eventLog')).toContainText('synced sampler metadata to global library');
    const samplerState = await page.evaluate(() => {
      const sampler = window.v11PeerDAW.patchBay.modules.get('main-sampler');
      return { rootNote: sampler.rootNote, tags: sampler.sampleMetadata.tags, cues: sampler.sampleMetadata.cues.length, waveformEdit: sampler.waveformEdit };
    });
    expect(samplerState).toMatchObject({ rootNote: 'D4', tags: ['field', 'chopped'], cues: 1 });
    expect(samplerState.waveformEdit).toMatchObject({ trimStartMs: 25, fadeInMs: 10, normalized: true, reverse: true });

    await page.locator('[data-module-id="default-drum-sampler"] .focus').click();
    await expect(page.locator('#workspaceMainView')).toContainText('Drum pad setup');
    await page.locator('[data-module-input="drum-pad"][data-pad-id="kick"][data-pad-key="name"]').fill('Boom');
    await page.locator('[data-module-action="drum-trigger-pad"]').first().click();
    await expect(page.locator('#eventLog')).toContainText('drum pad trigger');
    const drumPadName = await page.evaluate(() => window.v11PeerDAW.patchBay.modules.get('default-drum-sampler').pads.get('kick').name);
    expect(drumPadName).toBe('Boom');

    await page.locator('#addModule').selectOption('multisampler');
    await page.locator('.module-card:has-text("Slicing MultiSampler") .focus').last().click();
    await expect(page.locator('#workspaceMainView')).toContainText('Multisampler zones');
    await page.locator('[data-module-action="multisampler-add-zone"]').click();
    await expect(page.locator('#workspaceMainView')).toContainText('zone 1');
    await page.locator('[data-module-input="multisampler-slices"]').fill('12');
    const multiState = await page.evaluate(() => {
      const multi = [...window.v11PeerDAW.patchBay.modules.values()].find((module) => module.title === 'Slicing MultiSampler');
      return { sliceCount: multi.sliceCount, zones: multi.zones.length };
    });
    expect(multiState).toMatchObject({ sliceCount: 12, zones: 1 });

    await page.locator('[data-module-id="main-ocra"] .focus').click();
    await expect(page.locator('#workspaceMainView')).toContainText('OCRA grid editor');
    await page.locator('[data-module-input="ocra-row"][data-row-index="0"]').fill('D4..............................');
    await page.locator('[data-module-action="ocra-step"]').click();
    await expect(page.locator('#eventLog')).toContainText('ocra frame');
    const ocraRow = await page.evaluate(() => window.v11PeerDAW.patchBay.modules.get('main-ocra').grid[0].join(''));
    expect(ocraRow.startsWith('D4')).toBe(true);

    await page.locator('#addModule').selectOption('sequencer');
    await page.locator('.module-card:has-text("Step Sequencer") .focus').last().click();
    await expect(page.locator('#workspaceMainView')).toContainText('Step sequencer pattern');
    await page.locator('#workspaceMainView [data-module-action="sequencer-toggle-step"]').first().click();
    await page.locator('#workspaceMainView [data-grid-kind="sequencer"][data-step-index="1"]').first().click({ modifiers: ['Shift'] });
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+D' : 'Control+D');
    const sequencerState = await page.evaluate(() => {
      const seq = [...window.v11PeerDAW.patchBay.modules.values()].find((module) => module.title === 'Step Sequencer');
      return { firstStep: seq.rows[0].steps[0].enabled, secondStep: seq.rows[0].steps[1].enabled, thirdStep: seq.rows[0].steps[2].enabled, length: seq.length };
    });
    expect(sequencerState.firstStep).toBe(false);
    expect(sequencerState.secondStep).toBe(true);
    expect(sequencerState.thirdStep).toBe(true);

    await page.locator('#addModule').selectOption('arp');
    await page.locator('.module-card:has-text("ARP MIDI Generator") .focus').last().click();
    await expect(page.locator('#workspaceMainView')).toContainText('ARP pattern editor');
    await page.locator('[data-module-input="arp-notes"]').fill('C3, E3, G3');
    await page.locator('[data-module-input="arp-param"][data-param-key="interval"]').selectOption('fifth');
    await page.locator('[data-module-action="arp-preview"]').click();
    await expect(page.locator('#eventLog')).toContainText('arp pattern');
    const arpState = await page.evaluate(() => {
      const arp = [...window.v11PeerDAW.patchBay.modules.values()].find((module) => module.title === 'ARP MIDI Generator');
      return { notes: arp.notes, interval: arp.interval, pattern: arp.arpPattern() };
    });
    expect(arpState.notes).toEqual(['C3', 'E3', 'G3']);
    expect(arpState.interval).toBe('fifth');
    expect(arpState.pattern.length).toBeGreaterThan(0);

    await page.locator('[data-module-id="field-recorder"] .focus').click();
    await expect(page.locator('#workspaceMainView')).toContainText('Field take manager');
    await page.locator('[data-module-action="field-add-take"]').click();
    await page.locator('[data-module-input="field-take"][data-take-key="name"]').fill('street take');
    await page.locator('[data-module-action="field-promote-sample"]').click();
    await expect(page.locator('#eventLog')).toContainText('field sample promoted');
    const fieldState = await page.evaluate(() => {
      const field = window.v11PeerDAW.patchBay.modules.get('field-recorder');
      return { takes: field.takes.length, name: field.takes[0].name };
    });
    expect(fieldState).toMatchObject({ takes: 1, name: 'street take' });

    await page.locator('[data-module-id="peer-bridge"] .focus').click();
    await expect(page.locator('#workspaceMainView')).toContainText('Peer / wiring monitor');
    await page.locator('[data-module-input="peer-pilot"]').fill('packet-pilot');
    await page.locator('[data-module-action="peer-test-packet"]').click();
    await expect(page.locator('#eventLog')).toContainText('peer test packet');
    await expect(page.locator('#workspaceMainView')).toContainText('test');
    const peerState = await page.evaluate(() => {
      const peer = window.v11PeerDAW.patchBay.modules.get('peer-bridge');
      return { lastPilot: peer.lastPilot, packetLog: peer.packetLog.length };
    });
    expect(peerState).toMatchObject({ lastPilot: 'packet-pilot', packetLog: 1 });

    await page.locator('#btnWorkspaceReset').click();
    await expect(page.locator('[data-workspace-view="session"]')).toHaveClass(/active/);
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

    await openDrawerFor(page, '#exampleProjectSelect');
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

    await page.locator('[data-workspace-view="clips"]').click();
    await page.locator('[data-clip-action="create"]').click();
    await page.locator('[data-clip-action="place"]').first().click();

    await openDrawerFor(page, '#btnCopyProject');
    await page.locator('#btnCopyProject').click();
    await expect(page.locator('#projectIoText')).toHaveValue(/"modules"/);
    const exported = await page.locator('#projectIoText').inputValue();
    const exportedProject = JSON.parse(exported);
    expect(exportedProject.modules.length).toBe(9);
    expect(exportedProject.clips.slots.length).toBeGreaterThanOrEqual(5);
    expect(exportedProject.arrangement.clips.length).toBeGreaterThanOrEqual(1);

    await page.locator('#btnClearRoutes').click();
    await expect(page.locator('#routeCount')).toContainText('0 packet');

    await page.locator('#projectIoText').fill(exported);
    await page.evaluate(() => { window.__v11ClipboardText = ''; });
    await page.locator('#btnPasteProject').click();
    await expect(page.locator('#moduleCount')).toHaveText('9 modules');
    await expect(page.locator('#routeCount')).toContainText('7 packet');
    await page.locator('[data-workspace-view="clips"]').click();
    await expect(page.locator('#workspaceMainView .clip-slot-row')).toHaveCount(exportedProject.clips.slots.length);
    await page.locator('[data-workspace-view="arrangement"]').click();
    await expect(page.locator('#workspaceMainView .timeline-clip')).toHaveCount(exportedProject.arrangement.clips.length);
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
  test.describe.configure({ mode: 'serial' });

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
