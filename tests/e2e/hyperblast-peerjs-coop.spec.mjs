import { expect, test } from '@playwright/test';

const fakePeerJsScript = `
  window.Peer = function TestPeer() {};
`;

const fakePeernetModule = `
  export class PeernetLobby extends EventTarget {
    constructor(lobbyId, options = {}) {
      super();
      this.lobbyId = lobbyId;
      this.options = options;
      this.peerId = 'peer_' + Math.random().toString(36).slice(2, 10);
      this.channel = new BroadcastChannel('hyperblast-e2e-' + lobbyId);
      window.__hyperblastTestBroadcasts = [];
      this.channel.onmessage = (event) => {
        const message = event.data || {};
        if (!message || message.from === this.peerId) return;
        if (message.kind === 'data') {
          this.dispatchEvent(new CustomEvent('data', { detail: { from: message.from, data: message.data } }));
        }
        if (message.kind === 'peers') {
          this.dispatchEvent(new CustomEvent('peers', { detail: [{ id: message.from, username: message.username }] }));
        }
      };
    }

    async connect(username) {
      this.username = username;
      this.dispatchEvent(new CustomEvent('status', { detail: { connected: true, peerId: this.peerId, username } }));
      this.channel.postMessage({ kind: 'peers', from: this.peerId, username });
      return this.peerId;
    }

    broadcast(data) {
      window.__hyperblastTestBroadcasts.push(data);
      this.channel.postMessage({ kind: 'data', from: this.peerId, data });
      return true;
    }

    send(peerId, data) {
      return this.broadcast(data);
    }

    destroy() {
      this.channel?.close();
    }
  }
`;

async function installFakePeerNetwork(context) {
  await context.route('**/peerjs*.js', (route) => route.fulfill({
    status: 200,
    contentType: 'application/javascript',
    body: fakePeerJsScript,
  }));
  await context.route('**/lib/peernet/peernet-lib.js', (route) => route.fulfill({
    status: 200,
    contentType: 'application/javascript',
    body: fakePeernetModule,
  }));
}

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

test.describe('Hyperblast PeerJS coop mode', () => {
  test('two coop clients connect through the PeerJS lobby adapter and exchange state', async ({ context }) => {
    await installFakePeerNetwork(context);

    const alpha = await context.newPage();
    const beta = await context.newPage();
    const alphaErrors = await collectPageErrors(alpha);
    const betaErrors = await collectPageErrors(beta);

    await Promise.all([
      alpha.goto('/hyperblast-shooter/index.html?embedded=true&directStart=true&matchMode=coop&username=Alpha&multiplayer=true'),
      beta.goto('/hyperblast-shooter/index.html?embedded=true&directStart=true&matchMode=coop&username=Beta&multiplayer=true'),
    ]);

    await expect.poll(async () => alpha.evaluate(() => window.game?.multiplayer)).toBe(true);
    await expect.poll(async () => beta.evaluate(() => window.game?.multiplayer)).toBe(true);
    await expect.poll(async () => alpha.evaluate(() => window.game?.matchMode)).toBe('coop');
    await expect.poll(async () => beta.evaluate(() => window.game?.matchMode)).toBe('coop');

    await expect.poll(async () => alpha.evaluate(() => window.game.state.remote.size)).toBeGreaterThanOrEqual(1);
    await expect.poll(async () => beta.evaluate(() => window.game.state.remote.size)).toBeGreaterThanOrEqual(1);

    await expect(alpha.locator('#multiplayerPanel')).toBeVisible();
    await expect(beta.locator('#multiplayerPanel')).toBeVisible();
    await expect(alpha.locator('#playerList')).toContainText('Beta');
    await expect(beta.locator('#playerList')).toContainText('Alpha');

    const alphaBroadcastTypes = await alpha.evaluate(() => window.__hyperblastTestBroadcasts.map((item) => ({
      type: item.type,
      matchMode: item.payload?.matchMode,
      username: item.payload?.username,
    })));
    expect(alphaBroadcastTypes).toContainEqual(expect.objectContaining({ type: 'shooter-state', matchMode: 'coop', username: 'Alpha' }));
    expect(alphaBroadcastTypes).toContainEqual(expect.objectContaining({ type: 'shooter-presence', matchMode: 'coop', username: 'Alpha' }));

    expect(seriousErrors(alphaErrors)).toEqual([]);
    expect(seriousErrors(betaErrors)).toEqual([]);
  });
});
