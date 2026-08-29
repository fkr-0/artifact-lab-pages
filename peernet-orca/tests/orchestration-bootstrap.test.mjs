import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { bootstrapOrcaOrchestration } from '../orchestration-bootstrap.js';

class MemoryStorage {
  constructor(entries = {}) {
    this.entries = new Map(Object.entries(entries));
  }

  getItem(key) {
    return this.entries.has(key) ? this.entries.get(key) : null;
  }

  setItem(key, value) {
    this.entries.set(key, String(value));
  }
}

class FakeTransport {
  constructor() {
    this.started = false;
    this.subscribers = new Set();
    this.healthSubscribers = new Set();
  }

  start() {
    this.started = true;
    this.emitHealth();
    return true;
  }

  stop() {
    this.started = false;
    this.emitHealth();
  }

  subscribe(handler) {
    this.subscribers.add(handler);
    return () => this.subscribers.delete(handler);
  }

  onHealth(handler) {
    this.healthSubscribers.add(handler);
    handler(this.health());
    return () => this.healthSubscribers.delete(handler);
  }

  health() {
    return {
      state: this.started ? 'connected' : 'idle',
      connected: this.started,
      role: 'test',
      peerCount: 0,
    };
  }

  emitHealth() {
    const health = this.health();
    for (const handler of this.healthSubscribers) handler(health);
  }

  broadcast() {
    return 0;
  }

  send() {
    return false;
  }
}

class FakeWindow extends EventTarget {
  constructor({ name = 'Test Pilot', shared = true } = {}) {
    super();
    this.localStorage = new MemoryStorage({ 'orca-name': name });
    this.console = { warn() {} };
    this.OrcaLegacyNet = { myName: name, sessionCode: '' };
    this.identityUpdates = [];
    this.transportOptions = null;
    this.transport = null;
    if (shared) {
      this.OrcaSharedPeernet = {
        core: {
          setIdentity: (identity) => this.identityUpdates.push(identity),
        },
        createTransport: (options) => {
          this.transportOptions = options;
          this.transport = new FakeTransport();
          return this.transport;
        },
      };
    }
  }
}

function dispatchLegacy(target, detail) {
  const event = new Event('orca:legacy-session');
  Object.defineProperty(event, 'detail', { value: detail });
  target.dispatchEvent(event);
}

async function waitFor(predicate, { timeoutMs = 1000, intervalMs = 5 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = predicate();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  assert.fail('condition was not satisfied before timeout');
}

test('bootstrap maps legacy host connect/disconnect into orchestration session lifecycle', (t) => {
  const target = new FakeWindow({ name: 'Host Ada' });
  const runtime = bootstrapOrcaOrchestration({ target, random: () => 0.25 });
  t.after(() => runtime.dispose({ stopTransport: true }));

  assert.ok(runtime.engine.started);
  assert.equal(target.OrcaOrchestrator, runtime.engine);
  assert.equal(target.transportOptions.username, 'Host Ada');
  assert.equal(target.transportOptions.channel, 'orca-orchestration');

  dispatchLegacy(target, {
    phase: 'connected',
    role: 'host',
    code: 'abcde',
    name: 'Ada Lovelace',
  });

  assert.equal(runtime.engine.activeSessionId, 'orca:ABCDE');
  assert.equal(runtime.engine.getSession('orca:ABCDE').ownerId, runtime.engine.nodeId);
  assert.equal(runtime.engine.getSession('orca:ABCDE').state, 'open');
  assert.deepEqual(target.identityUpdates.at(-1), { username: 'Ada Lovelace' });

  dispatchLegacy(target, { phase: 'disconnected', role: 'host', code: 'abcde' });
  assert.equal(runtime.engine.activeSessionId, '');
  assert.equal(runtime.engine.getSession('orca:ABCDE').state, 'left');

  runtime.dispose({ stopTransport: true });
  assert.equal(target.OrcaOrchestrator, undefined);
  assert.equal(target.transport.started, false);
});

test('bootstrap maps legacy guest connect/disconnect into join and leave requests', (t) => {
  const target = new FakeWindow({ name: 'Guest Grace' });
  const runtime = bootstrapOrcaOrchestration({ target, random: () => 0.5 });
  t.after(() => runtime.dispose({ stopTransport: true }));

  dispatchLegacy(target, {
    phase: 'connected',
    role: 'guest',
    code: 'qwert',
    name: 'Grace Hopper',
  });

  assert.equal(runtime.engine.activeSessionId, 'orca:QWERT');
  assert.equal(runtime.engine.getSession('orca:QWERT').state, 'joining');
  assert.equal(runtime.engine.getSession('orca:QWERT').ownerId, '');
  assert.deepEqual(target.identityUpdates.at(-1), { username: 'Grace Hopper' });

  dispatchLegacy(target, { phase: 'disconnected', role: 'guest', code: 'qwert' });
  assert.equal(runtime.engine.activeSessionId, '');
  assert.equal(runtime.engine.getSession('orca:QWERT').state, 'left');
  runtime.dispose({ stopTransport: true });
});

test('bootstrap degrades without shared transport and keeps local ping functional', async (t) => {
  const target = new FakeWindow({ shared: false });
  target.OrcaLegacyNet.sessionCode = 'SOLO1';
  const runtime = bootstrapOrcaOrchestration({ target, random: () => 0.75 });
  t.after(() => runtime.dispose());

  assert.equal(runtime.transport, null);
  assert.equal(runtime.engine.health().state, 'degraded');
  const queued = runtime.engine.submitTask({ kind: 'orca:ping', payload: { hello: 'solo' } });
  const completed = await waitFor(() => {
    const task = runtime.engine.getTask(queued.id);
    return task?.state === 'completed' ? task : null;
  });
  assert.equal(completed.result.ok, true);
  assert.deepEqual(completed.result.payload, { hello: 'solo' });
  assert.equal(completed.result.legacySessionCode, 'SOLO1');
  runtime.dispose();
});

test('index keeps legacy lifecycle hooks and module bootstrap wired', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  assert.match(html, /function emitLegacySession\(phase, detail\)/);
  assert.ok((html.match(/emitLegacySession\('connected'/g) || []).length >= 2);
  assert.ok((html.match(/emitLegacySession\('disconnected'/g) || []).length >= 3);
  assert.match(html, /window\.OrcaLegacyNet = net/);
  assert.match(html, /<script type="module" src="orchestration-bootstrap\.js"><\/script>/);
});
