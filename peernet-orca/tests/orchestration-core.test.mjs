import assert from 'node:assert/strict';
import test from 'node:test';

import { OrcaOrchestrationEngine } from '../orchestration-core.js';

class MemoryMesh {
  constructor() {
    this.nodes = new Map();
    this.blocked = new Set();
  }

  transport(id) {
    return new MemoryTransport(this, id);
  }

  key(a, b) {
    return [a, b].sort().join('::');
  }

  setPartition(a, b, blocked = true) {
    const key = this.key(a, b);
    if (blocked) this.blocked.add(key);
    else this.blocked.delete(key);
  }

  canReach(a, b) {
    return !this.blocked.has(this.key(a, b));
  }

  deliver(from, to, message) {
    const target = this.nodes.get(to);
    if (!target?.started || !this.canReach(from, to)) return false;
    queueMicrotask(() => target.receive(message, { peerId: from }));
    return true;
  }
}

class MemoryTransport {
  constructor(mesh, id) {
    this.mesh = mesh;
    this.id = id;
    this.started = false;
    this.subscribers = new Set();
    this.healthSubscribers = new Set();
  }

  start() {
    this.started = true;
    this.mesh.nodes.set(this.id, this);
    this.emitHealth();
    return true;
  }

  stop() {
    this.started = false;
    this.mesh.nodes.delete(this.id);
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
      role: 'mesh',
      peerCount: Math.max(0, this.mesh.nodes.size - 1),
    };
  }

  emitHealth() {
    const health = this.health();
    for (const handler of this.healthSubscribers) handler(health);
  }

  receive(message, meta) {
    for (const handler of this.subscribers) handler(structuredClone(message), meta);
  }

  broadcast(message) {
    let delivered = 0;
    for (const id of this.mesh.nodes.keys()) {
      if (id !== this.id && this.mesh.deliver(this.id, id, message)) delivered += 1;
    }
    return delivered;
  }

  send(peerId, message) {
    return this.mesh.deliver(this.id, peerId, message);
  }
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

test('discovers peers, negotiates a session, and distributes work by capability', async (t) => {
  const mesh = new MemoryMesh();
  const owner = new OrcaOrchestrationEngine({ nodeId: 'owner', transport: mesh.transport('owner') });
  const worker = new OrcaOrchestrationEngine({ nodeId: 'worker', transport: mesh.transport('worker') });

  t.after(() => {
    owner.stop({ stopTransport: true });
    worker.stop({ stopTransport: true });
  });

  const discovered = [];
  owner.on('peer:discover', (peer) => discovered.push(peer.id));
  worker.registerTaskHandler('waveform:analyze', async ({ samples }) => ({
    peak: Math.max(...samples.map((value) => Math.abs(value))),
  }));

  owner.start();
  worker.start();

  await waitFor(() => owner.getPeer('worker')?.capabilities.includes('waveform:analyze'));
  await waitFor(() => worker.getPeer('owner'));
  assert.ok(discovered.includes('worker'));
  assert.equal(owner.health().state, 'online');

  owner.openSession({ id: 'orca:ABCDE', title: 'Studio ABCDE' });
  worker.requestSession('orca:ABCDE');

  await waitFor(() => worker.getSession('orca:ABCDE')?.state === 'joined');
  await waitFor(() => owner.getSession('orca:ABCDE')?.participants.includes('worker'));
  await waitFor(() => owner.getPeer('worker')?.sessionId === 'orca:ABCDE');

  const queued = owner.submitTask({
    kind: 'waveform:analyze',
    payload: { samples: [0.2, -0.75, 0.4] },
  });

  const completed = await waitFor(() => {
    const task = owner.getTask(queued.id);
    return task?.state === 'completed' ? task : null;
  });

  assert.equal(completed.assignedTo, 'worker');
  assert.equal(completed.attempt, 1);
  assert.deepEqual(completed.result, { peak: 0.75 });
});

test('requeues an expired remote lease and falls back to a local handler', async (t) => {
  const mesh = new MemoryMesh();
  const owner = new OrcaOrchestrationEngine({
    nodeId: 'owner',
    transport: mesh.transport('owner'),
    taskLeaseMs: 100,
    maintenanceIntervalMs: 100,
  });
  const worker = new OrcaOrchestrationEngine({
    nodeId: 'worker',
    transport: mesh.transport('worker'),
    taskLeaseMs: 100,
    maintenanceIntervalMs: 100,
  });

  t.after(() => {
    owner.stop({ stopTransport: true });
    worker.stop({ stopTransport: true });
  });

  owner.registerTaskHandler('render', async ({ frame }) => ({ frame, executor: 'owner' }));
  worker.registerTaskHandler('render', async ({ frame }) => {
    await new Promise(() => {});
    return { frame, executor: 'worker' };
  });

  owner.start();
  worker.start();
  await waitFor(() => owner.getPeer('worker')?.capabilities.includes('render'));

  const queued = owner.submitTask({ kind: 'render', payload: { frame: 7 } });
  await waitFor(() => owner.getTask(queued.id)?.assignedTo === 'worker');

  mesh.setPartition('owner', 'worker', true);

  const completed = await waitFor(() => {
    const task = owner.getTask(queued.id);
    return task?.state === 'completed' ? task : null;
  });

  assert.equal(completed.assignedTo, 'owner');
  assert.equal(completed.attempt, 2);
  assert.deepEqual(completed.result, { frame: 7, executor: 'owner' });
});

test('does not duplicate a long-running local task when its nominal lease passes', async () => {
  let now = 2000;
  const engine = new OrcaOrchestrationEngine({
    nodeId: 'solo-worker',
    now: () => now,
    taskLeaseMs: 100,
    maintenanceIntervalMs: 1000,
  });
  engine.registerTaskHandler('slow', async () => new Promise(() => {}));
  engine.start();

  const queued = engine.submitTask({ kind: 'slow' });
  await waitFor(() => engine.getTask(queued.id)?.state === 'running');
  now += 500;
  engine.tick();

  const task = engine.getTask(queued.id);
  assert.equal(task.state, 'running');
  assert.equal(task.assignedTo, 'solo-worker');
  assert.equal(task.attempt, 1);
  engine.stop();
});

test('gracefully degrades without a transport and still executes local work', async () => {
  const engine = new OrcaOrchestrationEngine({ nodeId: 'solo' });
  engine.registerTaskHandler('echo', async (payload) => ({ ...payload, local: true }));

  assert.equal(engine.start(), true);
  assert.equal(engine.health().state, 'degraded');
  assert.equal(engine.health().peerCount, 0);

  const queued = engine.submitTask({ kind: 'echo', payload: { value: 42 } });
  const completed = await waitFor(() => {
    const task = engine.getTask(queued.id);
    return task?.state === 'completed' ? task : null;
  });

  assert.deepEqual(completed.result, { value: 42, local: true });
  assert.equal(completed.assignedTo, 'solo');
  engine.stop();
});

test('heartbeats keep quiet healthy peers discoverable beyond the stale timeout', async (t) => {
  let now = 0;
  const mesh = new MemoryMesh();
  const options = {
    now: () => now,
    taskLeaseMs: 100,
    peerTimeoutMs: 300,
    peerHeartbeatMs: 100,
    maintenanceIntervalMs: 100000,
  };
  const owner = new OrcaOrchestrationEngine({ ...options, nodeId: 'owner', transport: mesh.transport('owner') });
  const worker = new OrcaOrchestrationEngine({ ...options, nodeId: 'worker', transport: mesh.transport('worker') });

  t.after(() => {
    owner.stop({ stopTransport: true });
    worker.stop({ stopTransport: true });
  });

  owner.start();
  worker.start();
  await waitFor(() => owner.getPeer('worker') && worker.getPeer('owner'));

  for (const timestamp of [110, 220, 330, 440]) {
    now = timestamp;
    owner.tick();
    worker.tick();
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  assert.ok(owner.getPeer('worker'));
  assert.ok(worker.getPeer('owner'));
  assert.equal(owner.getPeer('worker').lastSeen, 440);
  assert.equal(worker.getPeer('owner').lastSeen, 440);
});

test('a task queued before peer discovery runs when a capable peer appears', async (t) => {
  const mesh = new MemoryMesh();
  const owner = new OrcaOrchestrationEngine({ nodeId: 'owner', transport: mesh.transport('owner') });
  const worker = new OrcaOrchestrationEngine({ nodeId: 'worker', transport: mesh.transport('worker') });

  t.after(() => {
    owner.stop({ stopTransport: true });
    worker.stop({ stopTransport: true });
  });

  owner.start();
  const queued = owner.submitTask({ kind: 'late-worker', payload: { value: 9 } });
  assert.equal(owner.getTask(queued.id).state, 'queued');

  worker.registerTaskHandler('late-worker', async ({ value }) => ({ value, executor: 'worker' }));
  worker.start();

  const completed = await waitFor(() => {
    const task = owner.getTask(queued.id);
    return task?.state === 'completed' ? task : null;
  });
  assert.equal(completed.assignedTo, 'worker');
  assert.deepEqual(completed.result, { value: 9, executor: 'worker' });
});

test('a transiently rejected worker becomes eligible again after it reannounces', async (t) => {
  const mesh = new MemoryMesh();
  const owner = new OrcaOrchestrationEngine({ nodeId: 'owner', transport: mesh.transport('owner') });
  const worker = new OrcaOrchestrationEngine({ nodeId: 'worker', transport: mesh.transport('worker') });

  t.after(() => {
    owner.stop({ stopTransport: true });
    worker.stop({ stopTransport: true });
  });

  worker.registerTaskHandler('recoverable', async ({ value }) => ({ value, recovered: true }));
  owner.start();
  worker.start();
  await waitFor(() => owner.getPeer('worker')?.capabilities.includes('recoverable'));

  mesh.setPartition('owner', 'worker', true);
  const queued = owner.submitTask({ kind: 'recoverable', payload: { value: 11 } });
  await waitFor(() => owner.getTask(queued.id)?.state === 'queued');
  assert.equal(owner.getTask(queued.id).attempt, 1);

  mesh.setPartition('owner', 'worker', false);
  worker.announce('partition-healed');

  const completed = await waitFor(() => {
    const task = owner.getTask(queued.id);
    return task?.state === 'completed' ? task : null;
  });
  assert.equal(completed.assignedTo, 'worker');
  assert.equal(completed.attempt, 2);
  assert.deepEqual(completed.result, { value: 11, recovered: true });
});

test('registering a local handler wakes compatible queued work', async () => {
  const engine = new OrcaOrchestrationEngine({ nodeId: 'solo' });
  engine.start();
  const queued = engine.submitTask({ kind: 'late-local', payload: { value: 5 } });
  assert.equal(engine.getTask(queued.id).state, 'queued');

  engine.registerTaskHandler('late-local', async ({ value }) => ({ doubled: value * 2 }));
  const completed = await waitFor(() => {
    const task = engine.getTask(queued.id);
    return task?.state === 'completed' ? task : null;
  });
  assert.equal(completed.assignedTo, 'solo');
  assert.deepEqual(completed.result, { doubled: 10 });
  engine.stop();
});

test('local fallback respects every declared required capability', async () => {
  let calls = 0;
  const engine = new OrcaOrchestrationEngine({ nodeId: 'solo' });
  engine.registerTaskHandler('render', async () => {
    calls += 1;
    return { ok: true };
  });
  engine.start();

  const queued = engine.submitTask({ kind: 'render', requires: ['gpu'] });
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(engine.getTask(queued.id).state, 'queued');
  assert.equal(engine.getTask(queued.id).assignedTo, null);
  assert.equal(calls, 0);
  engine.stop();
});

test('workers revalidate required capabilities before accepting stale assignments', async (t) => {
  const mesh = new MemoryMesh();
  const owner = new OrcaOrchestrationEngine({ nodeId: 'owner', transport: mesh.transport('owner') });
  const worker = new OrcaOrchestrationEngine({ nodeId: 'worker', transport: mesh.transport('worker') });
  let calls = 0;
  worker.registerTaskHandler('render', async () => {
    calls += 1;
    return { ok: true };
  });

  t.after(() => {
    owner.stop({ stopTransport: true });
    worker.stop({ stopTransport: true });
  });

  owner.start();
  worker.start();
  await waitFor(() => owner.getPeer('worker')?.capabilities.includes('render'));

  // Simulate an origin with stale capability knowledge. The worker must still fail closed.
  owner.peers.get('worker').capabilities.add('gpu');
  let rejection = null;
  owner.on('task:rejected', (task) => {
    rejection = task;
  });
  const queued = owner.submitTask({ kind: 'render', requires: ['gpu'] });
  await waitFor(() => rejection);

  assert.equal(rejection.reason, 'unsupported-required-capability');
  assert.equal(owner.getTask(queued.id).state, 'queued');
  assert.equal(calls, 0);
});

test('workers advertise load when remote work starts and clears it on completion', async (t) => {
  const mesh = new MemoryMesh();
  const owner = new OrcaOrchestrationEngine({ nodeId: 'owner', transport: mesh.transport('owner') });
  const worker = new OrcaOrchestrationEngine({ nodeId: 'worker', transport: mesh.transport('worker') });
  let finish;
  worker.registerTaskHandler(
    'slow-remote',
    async () => new Promise((resolve) => {
      finish = resolve;
    })
  );

  t.after(() => {
    owner.stop({ stopTransport: true });
    worker.stop({ stopTransport: true });
  });

  owner.start();
  worker.start();
  await waitFor(() => owner.getPeer('worker')?.capabilities.includes('slow-remote'));
  const queued = owner.submitTask({ kind: 'slow-remote' });

  await waitFor(() => owner.getTask(queued.id)?.state === 'running');
  await waitFor(() => owner.getPeer('worker')?.load === 1);
  finish({ ok: true });
  await waitFor(() => owner.getTask(queued.id)?.state === 'completed');
  await waitFor(() => owner.getPeer('worker')?.load === 0);
});
