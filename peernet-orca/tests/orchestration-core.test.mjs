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
