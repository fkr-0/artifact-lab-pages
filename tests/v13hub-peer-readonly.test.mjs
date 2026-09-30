import assert from 'node:assert/strict';
import test from 'node:test';
import { PeerJsNetLobby } from '../src/v13hub/peer-lobby.js';

class FakeEmitter {
  constructor(extra = {}) {
    Object.assign(this, extra);
    this.handlers = new Map();
  }

  on(type, handler) {
    const handlers = this.handlers.get(type) || [];
    handlers.push(handler);
    this.handlers.set(type, handlers);
    return this;
  }

  emit(type, value) {
    for (const handler of this.handlers.get(type) || []) handler(value);
  }
}

async function waitForHandler(emitter, type) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if ((emitter.handlers.get(type) || []).length > 0) return;
    await new Promise((resolve) => setImmediate(resolve));
  }
  throw new Error(`Timed out waiting for ${type} handler registration`);
}

test('peer diagnostic lobby is inert until explicit connect and exposes no application send API', () => {
  let factoryCalls = 0;
  const lobby = new PeerJsNetLobby({
    username: 'must-not-be-retained',
    peerFactory: async () => {
      factoryCalls += 1;
      return new FakeEmitter();
    },
  });

  assert.equal(factoryCalls, 0);
  assert.equal(lobby.state, 'idle');
  assert.equal(lobby.peer, null);
  assert.equal(lobby.username, undefined);
  assert.equal(lobby.broadcast, undefined);
});

test('explicit client diagnostic connect sends no username, hello, metadata, or application payload', async () => {
  const sends = [];
  const connectCalls = [];
  const connection = new FakeEmitter({
    peer: 'artifact-lab-v13',
    open: true,
    send: (value) => sends.push(value),
  });
  const peer = new FakeEmitter({
    connect: (id, options) => {
      connectCalls.push({ id, options });
      return connection;
    },
  });
  const lobby = new PeerJsNetLobby({
    lobbyId: 'artifact-lab-v13',
    username: 'private-name',
    peerFactory: async () => peer,
  });

  const pending = lobby.connect();
  await waitForHandler(peer, 'open');
  peer.emit('open', 'client-1');
  connection.emit('open');
  const health = await pending;

  assert.equal(health.connected, true);
  assert.deepEqual(connectCalls, [{ id: 'artifact-lab-v13', options: { reliable: true } }]);
  assert.deepEqual(sends, []);
  assert.equal('metadata' in connectCalls[0].options, false);
  assert.equal(lobby.broadcast, undefined);
});

test('host fallback accepts diagnostic connections without emitting application payloads', async () => {
  const sends = [];
  const client = new FakeEmitter({ destroy() {} });
  const host = new FakeEmitter();
  let factoryCall = 0;
  const lobby = new PeerJsNetLobby({
    peerFactory: async (id) => {
      factoryCall += 1;
      assert.equal(factoryCall === 1 ? id : 'artifact-lab-v13', id);
      return factoryCall === 1 ? client : host;
    },
  });

  const pending = lobby.connect();
  await waitForHandler(client, 'error');
  client.emit('error', { type: 'peer-unavailable' });
  await waitForHandler(host, 'open');
  host.emit('open', 'artifact-lab-v13');
  const health = await pending;

  const inbound = new FakeEmitter({
    peer: 'peer-2',
    open: true,
    send: (value) => sends.push(value),
  });
  host.emit('connection', inbound);
  inbound.emit('open');

  assert.equal(health.role, 'host');
  assert.equal(health.connected, true);
  assert.deepEqual(lobby.peers(), ['peer-2']);
  assert.deepEqual(sends, []);
  assert.equal(lobby.broadcast, undefined);
});
