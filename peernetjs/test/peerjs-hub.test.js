import assert from 'node:assert/strict';
import test from 'node:test';

import { PeerJsHubTransport } from '../src/transports/peerjs-hub.js';

if (!globalThis.CustomEvent) {
  globalThis.CustomEvent = class CustomEvent extends Event {
    constructor(type, options = {}) {
      super(type);
      this.detail = options.detail;
    }
  };
}

class FakeLobby extends EventTarget {
  constructor(lobbyId, options) {
    super();
    this.lobbyId = lobbyId;
    this.options = options;
    this.myId = 'fake-peer';
    this.peers = new Map([['remote', {}]]);
    this.sent = [];
    this.health = { state: 'idle', connected: false, role: 'offline', peerCount: 0, myId: null };
    this.diagnostics = { ...this.health, transitions: [] };
  }

  async connect(username) {
    this.username = username;
    this.health = { state: 'connected', connected: true, role: 'client', peerCount: 1, myId: this.myId };
    this.dispatchEvent(new CustomEvent('health', { detail: this.health }));
    return this.myId;
  }

  broadcast(envelope) {
    this.sent.push({ kind: 'broadcast', envelope });
    return 1;
  }

  send(peerId, envelope) {
    this.sent.push({ kind: 'send', peerId, envelope });
    return peerId === 'remote';
  }

  async reconnect() {
    this.health = { ...this.health, state: 'reconnecting', connected: false };
    this.dispatchEvent(new CustomEvent('health', { detail: this.health }));
    this.health = { ...this.health, state: 'connected', connected: true };
    this.dispatchEvent(new CustomEvent('health', { detail: this.health }));
    return this.myId;
  }

  destroy() {
    this.health = { state: 'destroyed', connected: false, role: 'offline', peerCount: 0, myId: null };
  }

  receive(from, data) {
    this.dispatchEvent(new CustomEvent('data', { detail: { from, data } }));
  }
}

test('PeerJsHubTransport exposes the narrow ORCA-compatible transport contract', async () => {
  const transport = new PeerJsHubTransport({ lobbyId: 'test-hub', username: 'pilot', LobbyClass: FakeLobby });
  const health = [];
  const messages = [];
  transport.onHealth((entry) => health.push(entry.state));
  transport.subscribe((data, meta) => messages.push({ data, meta }));

  assert.equal(await transport.start(), true);
  assert.equal(transport.health().connected, true);
  assert.equal(transport.broadcast({ protocol: 'test' }), 1);
  assert.equal(transport.send('remote', { protocol: 'test' }), true);
  transport.lobby.receive('remote', { protocol: 'test', value: 7 });
  assert.deepEqual(messages[0], { data: { protocol: 'test', value: 7 }, meta: { peerId: 'remote', transport: 'peerjs-hub' } });

  assert.equal(await transport.restart(), true);
  assert.ok(health.includes('reconnecting'));
  assert.equal(transport.health().connected, true);
  transport.stop();
  assert.equal(transport.health().connected, false);
  assert.equal(transport.health().state, 'stopped');
});
