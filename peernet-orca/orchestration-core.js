const PROTOCOL = 'peernet-orca/orchestration';
const VERSION = 1;

function cloneValue(value) {
  if (value == null) return value;
  try {
    return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
  } catch (_) {
    return value;
  }
}

function normalizeCapabilities(values) {
  const out = new Set();
  for (const value of values || []) {
    const item = String(value || '').trim();
    if (item) out.add(item);
  }
  return [...out].sort();
}

function defaultId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export class OrcaOrchestrationEngine {
  constructor({
    nodeId = defaultId('orca'),
    transport = null,
    capabilities = [],
    now = () => Date.now(),
    taskLeaseMs = 15000,
    peerTimeoutMs = 45000,
    peerHeartbeatMs = 0,
    maintenanceIntervalMs = 1000,
  } = {}) {
    this.nodeId = String(nodeId);
    this.transport = null;
    this.staticCapabilities = new Set(normalizeCapabilities(capabilities));
    this.now = now;
    this.taskLeaseMs = Math.max(100, Number(taskLeaseMs) || 15000);
    this.peerTimeoutMs = Math.max(this.taskLeaseMs, Number(peerTimeoutMs) || 45000);
    const defaultHeartbeatMs = Math.max(100, Math.floor(this.peerTimeoutMs / 3));
    this.peerHeartbeatMs = Math.max(
      100,
      Math.min(Number(peerHeartbeatMs) || defaultHeartbeatMs, this.peerTimeoutMs)
    );
    this.maintenanceIntervalMs = Math.max(100, Number(maintenanceIntervalMs) || 1000);

    this.started = false;
    this.state = 'idle';
    this.lastTransportHealth = null;
    this.activeSessionId = '';
    this.sessions = new Map();
    this.requestedSessions = new Set();
    this.peers = new Map();
    this.tasks = new Map();
    this.incomingTasks = new Map();
    this.handlers = new Map();
    this.listeners = new Map();
    this.seenMessages = new Set();
    this.messageOrder = [];
    this.messageCounter = 0;
    this.taskCounter = 0;
    this.lastAnnounceAt = 0;
    this.transportUnsubscribe = null;
    this.healthUnsubscribe = null;
    this.maintenanceTimer = null;

    if (transport) this.attachTransport(transport);
  }

  on(type, handler) {
    if (typeof handler !== 'function') return () => {};
    const handlers = this.listeners.get(type) || new Set();
    handlers.add(handler);
    this.listeners.set(type, handlers);
    return () => this.off(type, handler);
  }

  off(type, handler) {
    const handlers = this.listeners.get(type);
    if (!handlers) return;
    handlers.delete(handler);
    if (!handlers.size) this.listeners.delete(type);
  }

  emit(type, detail) {
    for (const handler of this.listeners.get(type) || []) {
      try {
        handler(detail);
      } catch (error) {
        this.emitError(error, { event: type });
      }
    }
    for (const handler of this.listeners.get('*') || []) {
      try {
        handler(type, detail);
      } catch (_) {}
    }
  }

  emitError(error, context = {}) {
    const handlers = this.listeners.get('error');
    if (!handlers || !handlers.size) return;
    for (const handler of handlers) {
      try {
        handler({ error, ...context });
      } catch (_) {}
    }
  }

  attachTransport(transport) {
    if (this.transportUnsubscribe) this.transportUnsubscribe();
    if (this.healthUnsubscribe) this.healthUnsubscribe();
    this.transportUnsubscribe = null;
    this.healthUnsubscribe = null;
    this.transport = transport || null;

    if (this.transport && typeof this.transport.subscribe === 'function') {
      this.transportUnsubscribe =
        this.transport.subscribe((message, meta) => this.receive(message, meta)) || null;
    }
    if (this.transport && typeof this.transport.onHealth === 'function') {
      this.healthUnsubscribe =
        this.transport.onHealth((health) => this.handleTransportHealth(health)) || null;
    }
    return this;
  }

  start() {
    if (this.started) return true;
    this.started = true;
    this.state = 'connecting';
    let transportStarted = false;
    if (this.transport && typeof this.transport.start === 'function') {
      try {
        transportStarted = this.transport.start() !== false;
      } catch (error) {
        this.emitError(error, { phase: 'transport-start' });
      }
    }
    if (!transportStarted) {
      this.state = 'degraded';
    } else {
      const transportHealth =
        this.transport && typeof this.transport.health === 'function' ? this.transport.health() : null;
      if (transportHealth?.connected) this.state = 'online';
    }
    this.emit('state', this.health());
    this.announce('start');
    this.reannounceSession();
    if (!this.maintenanceTimer && typeof setInterval === 'function') {
      this.maintenanceTimer = setInterval(() => this.tick(), this.maintenanceIntervalMs);
    }
    return true;
  }

  stop({ stopTransport = false } = {}) {
    if (!this.started) return;
    if (this.activeSessionId) this.leaveSession({ broadcast: true });
    this.started = false;
    this.state = 'stopped';
    if (this.maintenanceTimer && typeof clearInterval === 'function') clearInterval(this.maintenanceTimer);
    this.maintenanceTimer = null;
    if (stopTransport && this.transport && typeof this.transport.stop === 'function') {
      try {
        this.transport.stop();
      } catch (error) {
        this.emitError(error, { phase: 'transport-stop' });
      }
    }
    this.emit('state', this.health());
  }

  health() {
    const transportHealth =
      (this.transport && typeof this.transport.health === 'function' && this.transport.health()) ||
      this.lastTransportHealth ||
      null;
    return {
      nodeId: this.nodeId,
      state: this.state,
      started: this.started,
      activeSessionId: this.activeSessionId || null,
      peerCount: this.peers.size,
      taskCount: this.tasks.size,
      capabilities: this.capabilities(),
      transport: cloneValue(transportHealth),
    };
  }

  capabilities() {
    return normalizeCapabilities([...this.staticCapabilities, ...this.handlers.keys()]);
  }

  registerTaskHandler(kind, handler) {
    const taskKind = String(kind || '').trim();
    if (!taskKind || typeof handler !== 'function') {
      throw new TypeError('registerTaskHandler requires a task kind and handler');
    }
    this.handlers.set(taskKind, handler);
    if (this.started) this.announce('capabilities-changed');
    this.retryQueuedTasks();
    return () => {
      this.handlers.delete(taskKind);
      if (this.started) this.announce('capabilities-changed');
    };
  }

  announce(reason = 'update') {
    if (!this.started) return 0;
    this.lastAnnounceAt = this.now();
    return this.sendEnvelope('peer:hello', {
      reason,
      capabilities: this.capabilities(),
      sessionId: this.activeSessionId || null,
      load: this.localLoad(),
    });
  }

  localLoad() {
    let load = 0;
    for (const task of this.incomingTasks.values()) {
      if (task.state === 'assigned' || task.state === 'running') load += 1;
    }
    return load;
  }

  canExecuteLocally(task) {
    if (!task || !this.handlers.has(task.kind)) return false;
    const available = new Set(this.capabilities());
    return [task.kind, ...(task.requires || [])].every((capability) => available.has(capability));
  }

  retryQueuedTasks() {
    for (const task of this.tasks.values()) {
      if (task.state !== 'queued') continue;
      if (this.selectWorker(task)) this.scheduleTask(task);
    }
  }

  reconsiderQueuedTasksForPeer(peerId) {
    for (const task of this.tasks.values()) {
      if (task.state !== 'queued') continue;
      task.rejectedWorkers.delete(peerId);
    }
    this.retryQueuedTasks();
  }

  openSession({ id = defaultId('session'), title = 'Orca Session', metadata = {} } = {}) {
    const sessionId = String(id);
    const session = {
      id: sessionId,
      title: String(title || 'Orca Session'),
      ownerId: this.nodeId,
      metadata: cloneValue(metadata) || {},
      participants: new Set([this.nodeId]),
      state: 'open',
      updatedAt: this.now(),
    };
    this.sessions.set(sessionId, session);
    this.activeSessionId = sessionId;
    this.requestedSessions.delete(sessionId);
    this.emit('session:open', this.sessionSnapshot(session));
    this.sendEnvelope('session:offer', this.sessionWire(session));
    this.announce('session-open');
    return this.sessionSnapshot(session);
  }

  requestSession(id, { title = 'Orca Session', metadata = {} } = {}) {
    const sessionId = String(id || '').trim();
    if (!sessionId) throw new TypeError('requestSession requires a session id');
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = {
        id: sessionId,
        title: String(title || 'Orca Session'),
        ownerId: '',
        metadata: cloneValue(metadata) || {},
        participants: new Set([this.nodeId]),
        state: 'joining',
        updatedAt: this.now(),
      };
      this.sessions.set(sessionId, session);
    }
    session.state = 'joining';
    session.participants.add(this.nodeId);
    session.updatedAt = this.now();
    this.activeSessionId = sessionId;
    this.requestedSessions.add(sessionId);
    this.emit('session:joining', this.sessionSnapshot(session));
    this.sendEnvelope('session:join-request', { sessionId, title, metadata: cloneValue(metadata) });
    this.announce('session-join-request');
    return this.sessionSnapshot(session);
  }

  acceptSession(id, ownerId = '') {
    const sessionId = String(id || '').trim();
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    if (ownerId) session.ownerId = ownerId;
    session.state = 'joined';
    session.participants.add(this.nodeId);
    session.updatedAt = this.now();
    this.activeSessionId = sessionId;
    this.requestedSessions.delete(sessionId);
    this.emit('session:join', this.sessionSnapshot(session));
    this.sendEnvelope(
      'session:accept',
      { sessionId, participantId: this.nodeId },
      session.ownerId || ownerId || ''
    );
    this.announce('session-joined');
    return true;
  }

  leaveSession({ broadcast = true } = {}) {
    if (!this.activeSessionId) return false;
    const sessionId = this.activeSessionId;
    const session = this.sessions.get(sessionId);
    if (session) {
      session.participants.delete(this.nodeId);
      session.state = 'left';
      session.updatedAt = this.now();
    }
    if (broadcast && this.started) {
      this.sendEnvelope('session:leave', { sessionId, participantId: this.nodeId });
    }
    this.activeSessionId = '';
    this.requestedSessions.delete(sessionId);
    this.emit('session:leave', session ? this.sessionSnapshot(session) : { id: sessionId });
    this.announce('session-left');
    return true;
  }

  reannounceSession() {
    if (!this.activeSessionId) return;
    const session = this.sessions.get(this.activeSessionId);
    if (!session) return;
    if (session.ownerId === this.nodeId) {
      this.sendEnvelope('session:offer', this.sessionWire(session));
    } else if (session.state === 'joining') {
      this.sendEnvelope('session:join-request', { sessionId: session.id, title: session.title });
    } else {
      this.sendEnvelope('session:accept', { sessionId: session.id, participantId: this.nodeId }, session.ownerId);
    }
  }

  submitTask({ id = '', kind, payload = null, requires = [] } = {}) {
    const taskKind = String(kind || '').trim();
    if (!taskKind) throw new TypeError('submitTask requires a task kind');
    const taskId = String(id || `${this.nodeId}:task:${++this.taskCounter}`);
    if (this.tasks.has(taskId)) throw new Error(`Task already exists: ${taskId}`);
    const task = {
      id: taskId,
      kind: taskKind,
      payload: cloneValue(payload),
      requires: normalizeCapabilities(requires),
      sessionId: this.activeSessionId || '',
      originId: this.nodeId,
      state: 'queued',
      assignedTo: '',
      attempt: 0,
      leaseUntil: 0,
      createdAt: this.now(),
      updatedAt: this.now(),
      result: undefined,
      error: null,
      rejectedWorkers: new Set(),
    };
    this.tasks.set(taskId, task);
    this.emit('task:queued', this.taskSnapshot(task));
    this.scheduleTask(task);
    return this.taskSnapshot(task);
  }

  scheduleTask(taskOrId) {
    const task = typeof taskOrId === 'string' ? this.tasks.get(taskOrId) : taskOrId;
    if (!task || task.state === 'completed' || task.state === 'failed') return false;
    const worker = this.selectWorker(task);
    if (worker && worker !== this.nodeId) return this.assignRemote(task, worker);
    if (worker === this.nodeId && this.canExecuteLocally(task)) {
      this.executeLocalTask(task);
      return true;
    }
    task.state = 'queued';
    task.assignedTo = '';
    task.leaseUntil = 0;
    task.updatedAt = this.now();
    this.emit('task:waiting', this.taskSnapshot(task));
    return false;
  }

  selectWorker(task) {
    const required = new Set([task.kind, ...(task.requires || [])]);
    const candidates = [];
    for (const peer of this.peers.values()) {
      if (task.rejectedWorkers.has(peer.id)) continue;
      if (task.sessionId && peer.sessionId !== task.sessionId) continue;
      if ([...required].some((capability) => !peer.capabilities.has(capability))) continue;
      candidates.push(peer);
    }
    candidates.sort((a, b) => a.load - b.load || a.id.localeCompare(b.id));
    if (candidates.length) return candidates[0].id;
    return this.canExecuteLocally(task) ? this.nodeId : '';
  }

  assignRemote(task, workerId) {
    task.attempt += 1;
    task.state = 'assigned';
    task.assignedTo = workerId;
    task.leaseUntil = this.now() + this.taskLeaseMs;
    task.updatedAt = this.now();
    const delivered = this.sendEnvelope(
      'task:assign',
      {
        task: {
          id: task.id,
          kind: task.kind,
          payload: cloneValue(task.payload),
          requires: [...task.requires],
          sessionId: task.sessionId || null,
          originId: this.nodeId,
          attempt: task.attempt,
          leaseUntil: task.leaseUntil,
        },
      },
      workerId
    );
    if (!delivered) {
      task.rejectedWorkers.add(workerId);
      task.state = 'queued';
      task.assignedTo = '';
      task.leaseUntil = 0;
      task.updatedAt = this.now();
      this.emit('task:delivery-failed', this.taskSnapshot(task));
      return this.scheduleTask(task);
    }
    this.emit('task:assigned', this.taskSnapshot(task));
    return true;
  }

  executeLocalTask(task) {
    const handler = this.handlers.get(task.kind);
    if (!handler) return false;
    task.attempt += 1;
    task.state = 'running';
    task.assignedTo = this.nodeId;
    task.leaseUntil = this.now() + this.taskLeaseMs;
    task.updatedAt = this.now();
    this.emit('task:running', this.taskSnapshot(task));
    Promise.resolve()
      .then(() =>
        handler(cloneValue(task.payload), {
          taskId: task.id,
          kind: task.kind,
          originId: this.nodeId,
          sessionId: task.sessionId || null,
          attempt: task.attempt,
          local: true,
        })
      )
      .then((result) => {
        task.state = 'completed';
        task.result = cloneValue(result);
        task.leaseUntil = 0;
        task.updatedAt = this.now();
        this.emit('task:completed', this.taskSnapshot(task));
      })
      .catch((error) => {
        task.state = 'failed';
        task.error = String(error && (error.message || error));
        task.leaseUntil = 0;
        task.updatedAt = this.now();
        this.emit('task:failed', this.taskSnapshot(task));
      });
    return true;
  }

  tick() {
    const current = this.now();
    if (this.started && current - this.lastAnnounceAt >= this.peerHeartbeatMs) {
      this.announce('heartbeat');
    }
    for (const [peerId, peer] of this.peers) {
      if (current - peer.lastSeen > this.peerTimeoutMs) {
        this.peers.delete(peerId);
        this.emit('peer:stale', this.peerSnapshot(peer));
        this.requeueTasksForPeer(peerId, 'peer-stale');
      }
    }
    for (const task of this.tasks.values()) {
      if (
        (task.state === 'assigned' || task.state === 'running') &&
        task.assignedTo &&
        task.assignedTo !== this.nodeId &&
        task.leaseUntil <= current
      ) {
        const workerId = task.assignedTo;
        if (workerId) task.rejectedWorkers.add(workerId);
        task.state = 'queued';
        task.assignedTo = '';
        task.leaseUntil = 0;
        task.updatedAt = current;
        this.emit('task:lease-expired', this.taskSnapshot(task));
        this.scheduleTask(task);
      }
    }
  }

  requeueTasksForPeer(peerId, reason = 'peer-unavailable') {
    for (const task of this.tasks.values()) {
      if (task.assignedTo !== peerId || !['assigned', 'running'].includes(task.state)) continue;
      task.rejectedWorkers.add(peerId);
      task.state = 'queued';
      task.assignedTo = '';
      task.leaseUntil = 0;
      task.updatedAt = this.now();
      this.emit('task:requeued', { ...this.taskSnapshot(task), reason });
      this.scheduleTask(task);
    }
  }

  handleTransportHealth(health) {
    this.lastTransportHealth = cloneValue(health);
    if (!this.started) return;
    const connected = Boolean(health && health.connected);
    const nextState = connected
      ? 'online'
      : health && health.state === 'reconnecting'
        ? 'reconnecting'
        : 'degraded';
    const changed = nextState !== this.state;
    this.state = nextState;
    if (changed) this.emit('state', this.health());
    if (connected) {
      this.announce('transport-connected');
      this.reannounceSession();
    }
  }

  receive(envelope, meta = {}) {
    if (!this.started) return false;
    if (!envelope || envelope.protocol !== PROTOCOL || envelope.version !== VERSION) return false;
    if (!envelope.id || this.seenMessages.has(envelope.id)) return false;
    this.rememberMessage(envelope.id);
    if (envelope.from === this.nodeId) return false;

    const peerId = String(envelope.from || meta.peerId || '').trim();
    if (!peerId) return false;
    const peerWasKnown = this.peers.has(peerId);
    this.touchPeer(peerId, {
      sessionId: envelope.sessionId || '',
      transportPeerId: meta.peerId || '',
    });

    const body = envelope.body || {};
    switch (envelope.type) {
      case 'peer:hello':
      case 'peer:hello-ack':
        this.handleHello(peerId, body, peerWasKnown);
        if (envelope.type === 'peer:hello') {
          this.sendEnvelope(
            'peer:hello-ack',
            {
              capabilities: this.capabilities(),
              sessionId: this.activeSessionId || null,
              load: this.localLoad(),
            },
            peerId
          );
        }
        break;
      case 'session:join-request':
        this.handleSessionJoinRequest(peerId, body);
        break;
      case 'session:offer':
        this.handleSessionOffer(peerId, body);
        break;
      case 'session:accept':
        this.handleSessionAccept(peerId, body);
        break;
      case 'session:confirmed':
        this.handleSessionConfirmed(peerId, body);
        break;
      case 'session:leave':
        this.handleSessionLeave(peerId, body);
        break;
      case 'task:assign':
        this.handleTaskAssign(peerId, body);
        break;
      case 'task:accepted':
        this.handleTaskAccepted(peerId, body);
        break;
      case 'task:result':
        this.handleTaskResult(peerId, body);
        break;
      case 'task:failure':
        this.handleTaskFailure(peerId, body);
        break;
      case 'task:reject':
        this.handleTaskReject(peerId, body);
        break;
      default:
        this.emit('message', { envelope: cloneValue(envelope), meta: cloneValue(meta) });
        break;
    }
    return true;
  }

  handleHello(peerId, body, wasKnown = false) {
    const peer = this.touchPeer(peerId, {
      capabilities: body.capabilities || [],
      sessionId: body.sessionId || '',
      load: Number(body.load) || 0,
    });
    this.emit(wasKnown ? 'peer:update' : 'peer:discover', this.peerSnapshot(peer));
    this.reconsiderQueuedTasksForPeer(peerId);
  }

  handleSessionJoinRequest(peerId, body) {
    const session = this.sessions.get(String(body.sessionId || ''));
    if (!session || session.ownerId !== this.nodeId || session.state === 'left') return;
    this.sendEnvelope('session:offer', this.sessionWire(session), peerId);
  }

  handleSessionOffer(peerId, body) {
    const sessionId = String(body.id || '').trim();
    if (!sessionId) return;
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = {
        id: sessionId,
        title: String(body.title || 'Orca Session'),
        ownerId: String(body.ownerId || peerId),
        metadata: cloneValue(body.metadata) || {},
        participants: new Set(body.participants || []),
        state: 'offered',
        updatedAt: this.now(),
      };
      this.sessions.set(sessionId, session);
    } else {
      session.title = String(body.title || session.title);
      session.ownerId = String(body.ownerId || session.ownerId || peerId);
      session.metadata = cloneValue(body.metadata) || session.metadata;
      for (const participant of body.participants || []) session.participants.add(participant);
      session.updatedAt = this.now();
    }
    this.emit('session:offer', this.sessionSnapshot(session));
    if (this.requestedSessions.has(sessionId)) this.acceptSession(sessionId, session.ownerId || peerId);
  }

  handleSessionAccept(peerId, body) {
    const session = this.sessions.get(String(body.sessionId || ''));
    if (!session || session.ownerId !== this.nodeId) return;
    session.participants.add(String(body.participantId || peerId));
    session.state = 'open';
    session.updatedAt = this.now();
    this.sendEnvelope('session:confirmed', this.sessionWire(session), peerId);
    this.emit('session:participant', this.sessionSnapshot(session));
  }

  handleSessionConfirmed(peerId, body) {
    const sessionId = String(body.id || body.sessionId || '').trim();
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.ownerId = String(body.ownerId || peerId || session.ownerId);
    for (const participant of body.participants || []) session.participants.add(participant);
    session.participants.add(this.nodeId);
    session.state = 'joined';
    session.updatedAt = this.now();
    this.activeSessionId = sessionId;
    this.requestedSessions.delete(sessionId);
    this.emit('session:confirmed', this.sessionSnapshot(session));
    this.announce('session-confirmed');
  }

  handleSessionLeave(peerId, body) {
    const session = this.sessions.get(String(body.sessionId || ''));
    if (!session) return;
    session.participants.delete(String(body.participantId || peerId));
    session.updatedAt = this.now();
    this.emit('session:participant-left', this.sessionSnapshot(session));
  }

  handleTaskAssign(peerId, body) {
    const incoming = body.task || {};
    const taskId = String(incoming.id || '').trim();
    const kind = String(incoming.kind || '').trim();
    if (!taskId || !kind) return;
    if (incoming.sessionId && incoming.sessionId !== this.activeSessionId) {
      this.sendEnvelope('task:reject', { taskId, reason: 'session-mismatch' }, peerId);
      return;
    }
    const handler = this.handlers.get(kind);
    if (!handler) {
      this.sendEnvelope('task:reject', { taskId, reason: 'unsupported-task-kind' }, peerId);
      return;
    }
    const requires = normalizeCapabilities(incoming.requires || []);
    const available = new Set(this.capabilities());
    const missingCapability = requires.find((capability) => !available.has(capability));
    if (missingCapability) {
      this.sendEnvelope(
        'task:reject',
        { taskId, reason: 'unsupported-required-capability', capability: missingCapability },
        peerId
      );
      return;
    }

    const previous = this.incomingTasks.get(taskId);
    if (previous && previous.state === 'completed') {
      this.sendEnvelope('task:result', { taskId, result: cloneValue(previous.result) }, peerId);
      return;
    }
    if (previous && previous.state === 'running') {
      this.sendEnvelope('task:accepted', { taskId, attempt: previous.attempt }, peerId);
      return;
    }

    const task = {
      id: taskId,
      kind,
      payload: cloneValue(incoming.payload),
      requires,
      sessionId: incoming.sessionId || '',
      originId: String(incoming.originId || peerId),
      attempt: Number(incoming.attempt) || 1,
      state: 'running',
      result: undefined,
      error: null,
      updatedAt: this.now(),
    };
    this.incomingTasks.set(taskId, task);
    this.sendEnvelope('task:accepted', { taskId, attempt: task.attempt }, peerId);
    this.emit('task:received', cloneValue(task));
    this.announce('load-changed');

    Promise.resolve()
      .then(() =>
        handler(cloneValue(task.payload), {
          taskId,
          kind,
          originId: task.originId,
          sessionId: task.sessionId || null,
          attempt: task.attempt,
          local: false,
        })
      )
      .then((result) => {
        task.state = 'completed';
        task.result = cloneValue(result);
        task.updatedAt = this.now();
        this.sendEnvelope('task:result', { taskId, result: cloneValue(result) }, peerId);
        this.emit('task:worker-completed', cloneValue(task));
        this.announce('load-changed');
      })
      .catch((error) => {
        task.state = 'failed';
        task.error = String(error && (error.message || error));
        task.updatedAt = this.now();
        this.sendEnvelope('task:failure', { taskId, error: task.error }, peerId);
        this.emit('task:worker-failed', cloneValue(task));
        this.announce('load-changed');
      });
  }

  handleTaskAccepted(peerId, body) {
    const task = this.tasks.get(String(body.taskId || ''));
    if (!task || task.assignedTo !== peerId) return;
    task.state = 'running';
    task.leaseUntil = this.now() + this.taskLeaseMs;
    task.updatedAt = this.now();
    this.emit('task:running', this.taskSnapshot(task));
  }

  handleTaskResult(peerId, body) {
    const task = this.tasks.get(String(body.taskId || ''));
    if (!task || task.assignedTo !== peerId) return;
    task.state = 'completed';
    task.result = cloneValue(body.result);
    task.error = null;
    task.leaseUntil = 0;
    task.updatedAt = this.now();
    this.emit('task:completed', this.taskSnapshot(task));
  }

  handleTaskFailure(peerId, body) {
    const task = this.tasks.get(String(body.taskId || ''));
    if (!task || task.assignedTo !== peerId) return;
    task.state = 'failed';
    task.error = String(body.error || 'remote-task-failed');
    task.leaseUntil = 0;
    task.updatedAt = this.now();
    this.emit('task:failed', this.taskSnapshot(task));
  }

  handleTaskReject(peerId, body) {
    const task = this.tasks.get(String(body.taskId || ''));
    if (!task || task.assignedTo !== peerId) return;
    task.rejectedWorkers.add(peerId);
    task.state = 'queued';
    task.assignedTo = '';
    task.leaseUntil = 0;
    task.updatedAt = this.now();
    this.emit('task:rejected', { ...this.taskSnapshot(task), reason: String(body.reason || 'rejected') });
    this.scheduleTask(task);
  }

  touchPeer(peerId, patch = {}) {
    let peer = this.peers.get(peerId);
    if (!peer) {
      peer = {
        id: peerId,
        capabilities: new Set(),
        sessionId: '',
        load: 0,
        transportPeerId: '',
        firstSeen: this.now(),
        lastSeen: this.now(),
      };
      this.peers.set(peerId, peer);
    }
    if (patch.capabilities) peer.capabilities = new Set(normalizeCapabilities(patch.capabilities));
    if (patch.sessionId !== undefined) peer.sessionId = String(patch.sessionId || '');
    if (patch.load !== undefined) peer.load = Math.max(0, Number(patch.load) || 0);
    if (patch.transportPeerId !== undefined) peer.transportPeerId = String(patch.transportPeerId || '');
    peer.lastSeen = this.now();
    return peer;
  }

  sendEnvelope(type, body = {}, peerId = '') {
    if (!this.transport) return 0;
    const envelope = {
      protocol: PROTOCOL,
      version: VERSION,
      id: `${this.nodeId}:msg:${++this.messageCounter}`,
      type,
      from: this.nodeId,
      sessionId: this.activeSessionId || null,
      sentAt: this.now(),
      body: cloneValue(body) || {},
    };
    try {
      if (peerId && typeof this.transport.send === 'function') {
        const peer = this.peers.get(peerId);
        const transportPeerId = peer?.transportPeerId || peerId;
        return this.transport.send(transportPeerId, envelope) ? 1 : 0;
      }
      if (typeof this.transport.broadcast === 'function') {
        const delivered = this.transport.broadcast(envelope);
        return typeof delivered === 'number' ? delivered : delivered ? 1 : 0;
      }
    } catch (error) {
      this.emitError(error, { phase: 'transport-send', type, peerId });
    }
    return 0;
  }

  rememberMessage(id) {
    this.seenMessages.add(id);
    this.messageOrder.push(id);
    while (this.messageOrder.length > 512) {
      const oldest = this.messageOrder.shift();
      this.seenMessages.delete(oldest);
    }
  }

  sessionWire(session) {
    return {
      id: session.id,
      title: session.title,
      ownerId: session.ownerId,
      metadata: cloneValue(session.metadata) || {},
      participants: [...session.participants].sort(),
      state: session.state,
      updatedAt: session.updatedAt,
    };
  }

  sessionSnapshot(session) {
    return this.sessionWire(session);
  }

  peerSnapshot(peer) {
    return {
      id: peer.id,
      capabilities: [...peer.capabilities].sort(),
      sessionId: peer.sessionId || null,
      load: peer.load,
      transportPeerId: peer.transportPeerId || null,
      firstSeen: peer.firstSeen,
      lastSeen: peer.lastSeen,
    };
  }

  taskSnapshot(task) {
    return {
      id: task.id,
      kind: task.kind,
      payload: cloneValue(task.payload),
      requires: [...(task.requires || [])],
      sessionId: task.sessionId || null,
      originId: task.originId,
      state: task.state,
      assignedTo: task.assignedTo || null,
      attempt: task.attempt,
      leaseUntil: task.leaseUntil || null,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      result: cloneValue(task.result),
      error: task.error,
    };
  }

  getPeer(id) {
    const peer = this.peers.get(id);
    return peer ? this.peerSnapshot(peer) : null;
  }

  getSession(id = this.activeSessionId) {
    const session = this.sessions.get(id);
    return session ? this.sessionSnapshot(session) : null;
  }

  getTask(id) {
    const task = this.tasks.get(id);
    return task ? this.taskSnapshot(task) : null;
  }
}

export const ORCA_ORCHESTRATION_PROTOCOL = Object.freeze({ name: PROTOCOL, version: VERSION });
