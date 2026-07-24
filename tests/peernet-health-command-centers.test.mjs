import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

if (!globalThis.CustomEvent) {
  globalThis.CustomEvent = class CustomEvent extends Event {
    constructor(type, options = {}) {
      super(type, options);
      this.detail = options.detail;
    }
  };
}

class FakeEmitter {
  constructor() {
    this.listeners = new Map();
  }

  on(type, listener) {
    this.listeners.set(type, [...(this.listeners.get(type) || []), listener]);
    return this;
  }

  emit(type, payload) {
    for (const listener of this.listeners.get(type) || []) listener(payload);
  }
}

class FakeConnection extends FakeEmitter {
  constructor(peer) {
    super();
    this.peer = peer;
    this.open = false;
    this.sent = [];
  }

  send(payload) {
    this.sent.push(payload);
  }

  openConnection() {
    this.open = true;
    this.emit('open');
  }

  close() {
    if (!this.open) return;
    this.open = false;
    this.emit('close');
  }
}

class FakePeer extends FakeEmitter {
  static instances = [];

  constructor(idOrOptions) {
    super();
    this.requestedId = typeof idOrOptions === 'string' ? idOrOptions : null;
    this.connections = [];
    this.destroyed = false;
    this.disconnected = false;
    FakePeer.instances.push(this);
  }

  connect(peerId) {
    const connection = new FakeConnection(peerId);
    this.connections.push(connection);
    return connection;
  }

  destroy() {
    this.destroyed = true;
    this.emit('close');
  }
}

test('PeernetLobby exposes observable health and delivery results', async () => {
  FakePeer.instances = [];
  const { PeernetConnectionState, PeernetLobby } = await import('../peernetjs/peernet-lib.js');
  const lobby = new PeernetLobby('nexus-test-hub', { Peer: FakePeer });
  const states = [];
  lobby.addEventListener('health', (event) => states.push(event.detail.state));

  const connected = lobby.connect('tester');
  const peer = FakePeer.instances.at(-1);
  peer.emit('open', 'client-01');
  const hubConnection = peer.connections.at(-1);
  hubConnection.openConnection();

  assert.equal(await connected, 'client-01');
  assert.equal(lobby.state, PeernetConnectionState.CONNECTED);
  assert.deepEqual(
    {
      connected: lobby.health.connected,
      role: lobby.health.role,
      peerCount: lobby.health.peerCount,
    },
    { connected: true, role: 'client', peerCount: 1 },
  );
  assert.equal(lobby.send('nexus-test-hub', { type: 'ping' }), true);
  assert.equal(lobby.send('missing-peer', { type: 'ping' }), false);
  assert.equal(lobby.broadcast({ type: 'broadcast' }), 1);
  assert.ok(states.includes(PeernetConnectionState.CONNECTING));
  assert.ok(states.includes(PeernetConnectionState.JOINING));
  assert.ok(states.includes(PeernetConnectionState.CONNECTED));

  lobby.destroy();
  assert.equal(lobby.state, PeernetConnectionState.DESTROYED);
  assert.equal(lobby.health.peerCount, 0);
});

test('PeernetLobby fails clearly when PeerJS is unavailable', async () => {
  const { PeernetConnectionState, PeernetLobby } = await import('../peernetjs/peernet-lib.js');
  const lobby = new PeernetLobby('missing-peerjs', { Peer: null });

  await assert.rejects(lobby.connect('tester'), /PeerJS is unavailable/);
  assert.equal(lobby.state, PeernetConnectionState.OFFLINE);
  assert.match(lobby.health.lastError, /PeerJS is unavailable/);
});

test('PeernetLobby ignores stale close events during an intentional hub handoff', async () => {
  FakePeer.instances = [];
  const { PeernetConnectionState, PeernetLobby } = await import('../peernetjs/peernet-lib.js');
  const lobby = new PeernetLobby('handoff-hub', { Peer: FakePeer });
  const states = [];
  lobby.addEventListener('health', (event) => states.push(event.detail.state));

  const connected = lobby.connect('host');
  const clientPeer = FakePeer.instances.at(-1);
  clientPeer.emit('open', 'client-before-host');
  clientPeer.emit('error', { type: 'peer-unavailable' });
  const hubPeer = FakePeer.instances.at(-1);
  hubPeer.emit('open', 'handoff-hub');

  assert.equal(await connected, 'handoff-hub');
  assert.equal(lobby.state, PeernetConnectionState.HOSTING);
  assert.equal(lobby.health.role, 'hub');
  assert.equal(states.includes(PeernetConnectionState.OFFLINE), false);
  assert.equal(states.includes(PeernetConnectionState.RECONNECTING), false);
  lobby.destroy();
});

test('PeernetSharedCore reports lifecycle health and supports listener removal', async () => {
  FakePeer.instances = [];
  await import(`../peernetjs/peernet-shared-core.js?test=${Date.now()}`);
  const core = new globalThis.PeernetSharedCore({
    Peer: FakePeer,
    namespace: 'test-core',
    hubId: 'test-core-hub',
  });
  const states = [];
  const listener = (health) => states.push(health.state);
  core.on('health', listener);

  assert.equal(core.start(), true);
  const peer = FakePeer.instances.at(-1);
  peer.emit('open', 'core-client-01');
  peer.connections.at(-1).openConnection();

  assert.equal(core.health().state, 'connected');
  assert.equal(core.health().role, 'client');
  assert.equal(core.health().peerCount, 1);
  assert.ok(states.includes('connecting'));
  assert.ok(states.includes('joining'));
  assert.ok(states.includes('connected'));

  core.off('health', listener);
  const countBeforeStop = states.length;
  core.stop();
  assert.equal(states.length, countBeforeStop);
  assert.equal(core.health().state, 'stopped');
});

test('App Hub v11 and V11 Peer DAW expose keyboard command centers and health surfaces', async () => {
  const [hubHtml, hubNetwork, dawHtml, dawApp, dawStack] = await Promise.all([
    readFile('app-hub-v11/index.html', 'utf8'),
    readFile('app-hub-v11/lib/network.js', 'utf8'),
    readFile('v11-peer-daw/index.html', 'utf8'),
    readFile('v11-peer-daw/src/app.js', 'utf8'),
    readFile('v11-peer-daw/src/core/peernet-stack.js', 'utf8'),
  ]);

  assert.match(hubHtml, /id="commandCenter"/);
  assert.match(hubHtml, /id="openCommandCenter"/);
  assert.match(hubHtml, /recentArtifactIds/);
  assert.match(hubHtml, /const key = String\(event\.key \|\| ""\)/);
  assert.match(hubHtml, /key\.toLowerCase\(\) === "k"/);
  assert.match(hubHtml, /Reconnect Peernet Lobby/);
  assert.match(hubNetwork, /get health\(\)/);
  assert.match(hubNetwork, /reconnect\(\)/);

  assert.match(dawHtml, /id="commandCenter"/);
  assert.match(dawHtml, /id="commandCenterHealth"/);
  assert.match(dawApp, /commandCenterEntries\(\)/);
  assert.match(dawApp, /Network health/);
  assert.match(dawApp, /action === 'peer-reconnect'/);
  assert.doesNotMatch(dawApp, /const _row = module\.rows/);
  assert.match(dawStack, /reconnect\(profile = \{\}\)/);
  assert.match(dawStack, /storageStarted/);
});
