import assert from 'node:assert/strict';
import test from 'node:test';

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

class FakeAudioContext {
  constructor() {
    this.state = 'suspended';
    this.currentTime = 1;
    this.destination = {};
    this.resumeCalls = 0;
    this.suspendCalls = 0;
    this.closeCalls = 0;
  }

  async resume() {
    this.resumeCalls += 1;
    this.state = 'running';
  }

  async suspend() {
    this.suspendCalls += 1;
    this.state = 'suspended';
  }

  async close() {
    this.closeCalls += 1;
    this.state = 'closed';
  }

  createGain() {
    return {
      gain: { value: 0, setTargetAtTime() {} },
      connect() {},
      disconnect() {},
    };
  }

  createAnalyser() {
    return {
      fftSize: 0,
      connect() {},
      disconnect() {},
    };
  }
}

class FakeCore extends FakeEmitter {
  constructor(opts) {
    super();
    this.opts = opts;
    this.startCalls = 0;
    this.stopCalls = 0;
    this.broadcastCalls = [];
    this.username = opts.username;
    this.color = opts.color;
  }

  start() {
    this.startCalls += 1;
    this.emit('open', { id: `${this.opts.namespace}-peer-${this.startCalls}` });
  }

  stop() {
    this.stopCalls += 1;
    this.emit('close', {});
  }

  broadcast(msg) {
    this.broadcastCalls.push(msg);
  }
}

class FakeUserManager extends FakeEmitter {
  constructor(opts) {
    super();
    this.opts = opts;
    this.profile = { id: 'user-1', username: 'pilot', color: '#00ffff' };
    this.boundCore = null;
  }

  bindCore(core) {
    this.boundCore = core;
    return this;
  }

  setProfile(patch) {
    this.profile = { ...this.profile, ...patch };
  }

  snapshot() {
    return { profile: { ...this.profile } };
  }

  destroy() {}
}

class FakeSessionManager extends FakeEmitter {
  constructor(opts) {
    super();
    this.opts = opts;
    this.bound = null;
  }

  bind(bound) {
    this.bound = bound;
    return this;
  }

  createSession(meta, state) {
    return { title: meta.title, state };
  }

  destroy() {}
}

class FakeStorageManager extends FakeEmitter {
  constructor(opts) {
    super();
    this.opts = opts;
    this.startAutosaveCalls = 0;
    this.stopAutosaveCalls = 0;
  }

  startAutosave() {
    this.startAutosaveCalls += 1;
  }

  stopAutosave() {
    this.stopAutosaveCalls += 1;
  }

  snapshot(meta) {
    return { title: meta.title, createdAt: Date.now() };
  }
}

test('AudioRuntime recreates closed contexts and PeernetStack reconnect restarts transport', async () => {
  const originalWindow = globalThis.window;
  globalThis.window = {
    AudioContext: FakeAudioContext,
    webkitAudioContext: null,
    PeernetSharedCore: FakeCore,
    PeernetUserManager: FakeUserManager,
    PeernetSessionManager: FakeSessionManager,
    PeernetStorageManager: FakeStorageManager,
  };

  try {
    const { AudioRuntime } = await import(`../PeerModGroove/src/core/audio.js?test=${Date.now()}`);
    const { PeernetStack } = await import(`../PeerModGroove/src/core/peernet-stack.js?test=${Date.now()}`);

    const runtime = new AudioRuntime();
    const first = await runtime.init();
    assert.equal(first.state, 'running');
    await runtime.dispose();
    const second = await runtime.init();
    assert.notEqual(second, first);
    assert.equal(second.state, 'running');
    assert.equal(first.closeCalls, 1);

    const stack = new PeernetStack({
      namespace: 'peermodgroove-test',
      capture: () => ({ rig: true }),
      apply: () => {},
    });

    assert.equal(stack.start({ username: 'alpha', color: '#123456' }), true);
    const startedCore = stack.core;
    assert.equal(startedCore.startCalls, 1);
    assert.equal(stack.storage.startAutosaveCalls, 1);

    assert.equal(await stack.reconnect({ username: 'beta', color: '#654321' }), true);
    assert.equal(startedCore.stopCalls, 1);
    assert.equal(startedCore.startCalls, 2);
    assert.equal(stack.storage.stopAutosaveCalls, 1);
    assert.equal(stack.storage.startAutosaveCalls, 2);
    assert.equal(stack.user.snapshot().profile.username, 'beta');

    await stack.destroy();
    assert.equal(startedCore.stopCalls, 2);
    assert.equal(stack.started, false);
  } finally {
    globalThis.window = originalWindow;
  }
});
