import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import { OrcaOrchestrationEngine } from '../orchestration-core.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const adapterSource = await readFile(path.join(here, '..', 'shared-core-adapter.js'), 'utf8');
const sharedCoreSource = await readFile(
  path.join(here, '..', '..', 'peernetjs', 'peernet-shared-core.js'),
  'utf8'
);

class Emitter {
  constructor() {
    this.listeners = new Map();
  }

  on(type, handler) {
    const handlers = this.listeners.get(type) || new Set();
    handlers.add(handler);
    this.listeners.set(type, handlers);
    return this;
  }

  emit(type, payload) {
    for (const handler of this.listeners.get(type) || []) handler(payload);
  }
}

class LegacySharedCore {
  constructor(options = {}) {
    this.Peer = options.Peer;
    this.hubId = options.hubId || 'legacy-hub';
    this.username = options.username || 'legacy-user';
    this.peer = null;
    this.myId = null;
    this.isHub = false;
    this.tryingHub = false;
    this.connections = new Map();
    this.listeners = new Map();
    this.started = false;
    this.state = 'idle';
    this.lastError = null;
  }

  on(type, handler) {
    const handlers = this.listeners.get(type) || new Set();
    handlers.add(handler);
    this.listeners.set(type, handlers);
    return this;
  }

  emit(type, payload) {
    for (const handler of this.listeners.get(type) || []) handler(payload);
    for (const handler of this.listeners.get('*') || []) handler(type, payload);
  }

  health() {
    return {
      state: this.state,
      connected: this.state === 'connected' || this.state === 'hosting',
      role: this.isHub ? 'hub' : this.state === 'connected' ? 'client' : 'offline',
      hubId: this.hubId,
      myId: this.myId,
      peerCount: this.connections.size,
      lastError: this.lastError,
    };
  }

  transition(state) {
    this.state = state;
    this.emit('health', this.health());
  }

  start() {
    if (this.started) return true;
    if (!this.Peer) return false;
    this.started = true;
    this.transition('connecting');
    const peer = new this.Peer({ debug: 0 });
    this.peer = peer;
    peer.on('open', (id) => {
      if (this.peer !== peer || !this.started) return;
      this.myId = id;
      this.setupIncoming(peer);
      this.emit('open', { id });
      this.joinHub();
    });
    peer.on('error', (error) => {
      if (error?.type === 'peer-unavailable' && this.tryingHub) this.becomeHub();
      else {
        this.lastError = error?.type || error?.message || String(error);
        this.transition('offline');
      }
    });
    return true;
  }

  setupIncoming(peer) {
    peer.on('connection', (connection) => {
      connection.on('open', () => this.registerConn(connection));
    });
  }

  registerConn(connection) {
    this.connections.set(connection.peer, { id: connection.peer, conn: connection });
    this.emit('health', this.health());
    connection.on('data', (data) => {
      this.emit('message:' + data.type, {
        id: connection.peer,
        data,
        entry: this.connections.get(connection.peer),
      });
    });
    connection.on('close', () => {
      const entry = this.connections.get(connection.peer);
      this.connections.delete(connection.peer);
      this.emit('peer:leave', { id: connection.peer, entry });
      this.emit('health', this.health());
    });
  }

  joinHub() {
    this.tryingHub = true;
    this.transition('joining');
    const connection = this.peer.connect(this.hubId, { reliable: true });
    connection.on('open', () => {
      this.tryingHub = false;
      this.isHub = false;
      this.registerConn(connection);
      this.transition('connected');
      this.emit('hub:join', { id: this.hubId });
    });
  }

  becomeHub() {
    this.tryingHub = false;
    this.transition('connecting');
    if (this.peer && !this.peer.destroyed) this.peer.destroy();
    const hub = new this.Peer(this.hubId, { debug: 0 });
    this.peer = hub;
    hub.on('open', (id) => {
      if (this.peer !== hub || !this.started) return;
      this.myId = id;
      this.isHub = true;
      this.setupIncoming(hub);
      this.transition('hosting');
      this.emit('hub:ready', { id });
    });
  }

  broadcast(message) {
    for (const entry of this.connections.values()) {
      if (entry.conn.open) entry.conn.send(message);
    }
  }

  send(peerId, message) {
    const entry = this.connections.get(peerId);
    if (entry?.conn?.open) entry.conn.send(message);
  }

  stop() {
    this.started = false;
    for (const entry of this.connections.values()) entry.conn.close();
    this.connections.clear();
    if (this.peer && !this.peer.destroyed) this.peer.destroy();
    this.peer = null;
    this.myId = null;
    this.isHub = false;
    this.tryingHub = false;
    this.transition('stopped');
  }
}

class FakeConnection extends Emitter {
  constructor(ownerId, peerId) {
    super();
    this.ownerId = ownerId;
    this.peer = peerId;
    this.open = false;
    this.other = null;
    this.closed = false;
  }

  send(data) {
    if (!this.open || this.closed || !this.other?.open || this.other.closed) {
      throw new Error(`connection ${this.ownerId}->${this.peer} is closed`);
    }
    const target = this.other;
    queueMicrotask(() => target.emit('data', structuredClone(data)));
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    this.open = false;
    const other = this.other;
    queueMicrotask(() => this.emit('close'));
    if (other && !other.closed) {
      other.closed = true;
      other.open = false;
      queueMicrotask(() => other.emit('close'));
    }
  }
}

class FakePeerNetwork {
  constructor() {
    this.peers = new Map();
    this.connections = new Set();
    this.counter = 0;
    const network = this;

    this.Peer = class FakePeer extends Emitter {
      constructor(idOrOptions) {
        super();
        this.destroyed = false;
        this.connections = new Set();
        const requestedId = typeof idOrOptions === 'string' ? idOrOptions : '';
        this.id = requestedId || `peer-${++network.counter}`;

        if (network.peers.has(this.id)) {
          queueMicrotask(() => this.emit('error', { type: 'unavailable-id' }));
          return;
        }

        network.peers.set(this.id, this);
        queueMicrotask(() => {
          if (!this.destroyed) this.emit('open', this.id);
        });
      }

      connect(targetId) {
        const client = new FakeConnection(this.id, targetId);
        this.connections.add(client);
        network.connections.add(client);
        const target = network.peers.get(targetId);

        if (!target || target.destroyed) {
          queueMicrotask(() => {
            if (!this.destroyed) this.emit('error', { type: 'peer-unavailable', peer: targetId });
          });
          return client;
        }

        const server = new FakeConnection(targetId, this.id);
        client.other = server;
        server.other = client;
        target.connections.add(server);
        network.connections.add(server);

        queueMicrotask(() => target.emit('connection', server));
        queueMicrotask(() => {
          if (this.destroyed || target.destroyed) return;
          client.open = true;
          server.open = true;
          client.emit('open');
          server.emit('open');
        });
        return client;
      }

      destroy() {
        if (this.destroyed) return;
        this.destroyed = true;
        if (network.peers.get(this.id) === this) network.peers.delete(this.id);
        for (const connection of this.connections) connection.close();
        this.connections.clear();
      }
    };
  }

  disconnect(a, b) {
    let disconnected = false;
    for (const connection of this.connections) {
      if (connection.closed) continue;
      if (
        (connection.ownerId === a && connection.peer === b) ||
        (connection.ownerId === b && connection.peer === a)
      ) {
        connection.close();
        disconnected = true;
      }
    }
    return disconnected;
  }
}

function createStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

function createContext({ includeSharedCore = true } = {}) {
  const events = [];
  class FakeCustomEvent {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail;
    }
  }

  const context = vm.createContext({
    console,
    setTimeout,
    clearTimeout,
    queueMicrotask,
    structuredClone,
    Date,
    Math,
    Map,
    Set,
    Promise,
    Error,
    Object,
    Array,
    JSON,
    Number,
    String,
    Boolean,
    CustomEvent: FakeCustomEvent,
    localStorage: createStorage(),
    dispatchEvent(event) {
      events.push(event);
      return true;
    },
  });
  context.window = context;
  context.globalThis = context;
  context.__events = events;
  if (includeSharedCore) vm.runInContext(sharedCoreSource, context, { filename: 'peernet-shared-core.js' });
  vm.runInContext(adapterSource, context, { filename: 'shared-core-adapter.js' });
  return context;
}

async function waitFor(predicate, { timeoutMs = 1500, intervalMs = 5 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = predicate();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  assert.fail('condition was not satisfied before timeout');
}

test('shared-core transport establishes peers, delivers messages, and reconnects after partition', async () => {
  const network = new FakePeerNetwork();
  const hostContext = createContext();
  const guestContext = createContext();
  const common = {
    Peer: network.Peer,
    namespace: 'orca-adapter-test',
    hubId: 'orca-adapter-test-hub',
    channel: 'orca-test-channel',
    reconnectBaseDelayMs: 5,
    reconnectMaxDelayMs: 5,
    reconnectMaxAttempts: 4,
    reconnectJitter: 0,
  };

  const host = hostContext.OrcaSharedPeernet.createTransport({ ...common, username: 'host' });
  const guest = guestContext.OrcaSharedPeernet.createTransport({ ...common, username: 'guest' });

  const hostMessages = [];
  host.subscribe((message, meta) => hostMessages.push({ message, meta }));
  const guestStates = [];
  guest.onHealth((health) => guestStates.push(health.state));

  assert.equal(host.start(), true);
  await waitFor(() => host.health().role === 'hub' && host.health().connected);

  assert.equal(guest.start(), true);
  await waitFor(() => guest.health().connected && guest.health().role === 'client');
  await waitFor(() => host.health().peerCount === 1 && guest.health().peerCount === 1);

  const originalGuestId = guestContext.OrcaSharedPeernet.core.myId;
  assert.equal(guest.broadcast({ kind: 'probe', value: 7 }), 1);
  await waitFor(() => hostMessages.length === 1);
  assert.deepEqual(hostMessages[0].message, { kind: 'probe', value: 7 });
  assert.equal(hostMessages[0].meta.peerId, originalGuestId);

  assert.equal(network.disconnect(originalGuestId, common.hubId), true);
  await waitFor(() => guestStates.includes('reconnecting'));
  await waitFor(() => guest.health().connected && guestContext.OrcaSharedPeernet.core.myId !== originalGuestId);

  assert.equal(guest.health().role, 'client');
  assert.equal(guest.health().reconnectAttempts, 0);
  assert.ok(guestStates.includes('reconnecting'));

  guestContext.OrcaSharedPeernet.stop();
  hostContext.OrcaSharedPeernet.stop();
});

test('orchestration resolves logical node ids to real shared-core transport peers', async () => {
  const network = new FakePeerNetwork();
  const ownerContext = createContext();
  const workerContext = createContext();
  const common = {
    Peer: network.Peer,
    namespace: 'orca-engine-adapter-test',
    hubId: 'orca-engine-adapter-test-hub',
    channel: 'orca-engine-channel',
    reconnectBaseDelayMs: 5,
    reconnectMaxDelayMs: 5,
    reconnectJitter: 0,
    ownsCore: true,
  };
  const ownerTransport = ownerContext.OrcaSharedPeernet.createTransport({
    ...common,
    username: 'owner-transport',
  });
  const workerTransport = workerContext.OrcaSharedPeernet.createTransport({
    ...common,
    username: 'worker-transport',
  });
  const owner = new OrcaOrchestrationEngine({ nodeId: 'logical-owner', transport: ownerTransport });
  const worker = new OrcaOrchestrationEngine({ nodeId: 'logical-worker', transport: workerTransport });
  worker.registerTaskHandler('mix:analyze', async ({ values }) => ({ total: values.reduce((a, b) => a + b, 0) }));

  owner.start();
  await waitFor(() => ownerTransport.health().role === 'hub' && ownerTransport.health().connected);
  worker.start();
  await waitFor(() => workerTransport.health().connected);
  await waitFor(() => owner.getPeer('logical-worker')?.capabilities.includes('mix:analyze'));

  const discovered = owner.getPeer('logical-worker');
  assert.notEqual(discovered.transportPeerId, 'logical-worker');
  assert.ok(discovered.transportPeerId.startsWith('peer-'));

  owner.openSession({ id: 'orca:LOGIC', title: 'Logical transport test' });
  worker.requestSession('orca:LOGIC');
  await waitFor(() => worker.getSession('orca:LOGIC')?.state === 'joined');
  await waitFor(() => owner.getSession('orca:LOGIC')?.participants.includes('logical-worker'));
  await waitFor(() => owner.getPeer('logical-worker')?.sessionId === 'orca:LOGIC');

  const queued = owner.submitTask({ kind: 'mix:analyze', payload: { values: [2, 3, 5] } });
  const completed = await waitFor(() => {
    const task = owner.getTask(queued.id);
    return task?.state === 'completed' ? task : null;
  });
  assert.equal(completed.assignedTo, 'logical-worker');
  assert.deepEqual(completed.result, { total: 10 });

  worker.stop({ stopTransport: true });
  owner.stop({ stopTransport: true });
});

test('adapter fails soft when PeernetSharedCore is unavailable', () => {
  const context = createContext({ includeSharedCore: false });
  const transport = context.OrcaSharedPeernet.createTransport({ channel: 'orca-test-channel' });
  const states = [];
  transport.onHealth((health) => states.push(health.state));

  assert.equal(transport.start(), false);
  assert.equal(transport.health().connected, false);
  assert.equal(transport.health().state, 'offline');
  assert.equal(transport.broadcast({ kind: 'probe' }), 0);
  assert.equal(transport.send('missing-peer', { kind: 'probe' }), false);
  assert.ok(states.includes('offline'));
});

test('adapter supplies bounded reconnect fallback for the committed legacy shared-core contract', async () => {
  const network = new FakePeerNetwork();
  const hostContext = createContext({ includeSharedCore: false });
  const guestContext = createContext({ includeSharedCore: false });
  hostContext.PeernetSharedCore = LegacySharedCore;
  guestContext.PeernetSharedCore = LegacySharedCore;

  const common = {
    Peer: network.Peer,
    hubId: 'legacy-adapter-hub',
    channel: 'orca-legacy-channel',
    reconnectBaseDelayMs: 5,
    reconnectMaxDelayMs: 5,
    reconnectMaxAttempts: 3,
    reconnectJitter: 0,
  };
  const host = hostContext.OrcaSharedPeernet.createTransport({ ...common, username: 'legacy-host' });
  const guest = guestContext.OrcaSharedPeernet.createTransport({ ...common, username: 'legacy-guest' });
  const guestStates = [];
  guest.onHealth((health) => guestStates.push(health.state));

  assert.equal(host.start(), true);
  await waitFor(() => host.health().role === 'hub' && host.health().connected);
  assert.equal(guest.start(), true);
  await waitFor(() => guest.health().role === 'client' && guest.health().connected);

  const firstGuestId = guestContext.OrcaSharedPeernet.core.myId;
  assert.equal(network.disconnect(firstGuestId, common.hubId), true);
  await waitFor(() => guestStates.includes('reconnecting'));
  await waitFor(
    () =>
      guest.health().connected &&
      guestContext.OrcaSharedPeernet.core.myId &&
      guestContext.OrcaSharedPeernet.core.myId !== firstGuestId,
  );

  assert.equal(guest.health().role, 'client');
  guestContext.OrcaSharedPeernet.stop();
  hostContext.OrcaSharedPeernet.stop();
});
