function cloneEnvelope(value) {
  return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

export class InMemoryNetwork {
  constructor() {
    this.transports = new Map();
  }

  createTransport(peerId) {
    if (!peerId || typeof peerId !== 'string') throw new TypeError('peerId is required');
    return new InMemoryTransport(this, peerId);
  }

  _register(transport) {
    const existing = this.transports.get(transport.peerId);
    if (existing && existing !== transport && existing.started) throw new Error(`peer already online: ${transport.peerId}`);
    this.transports.set(transport.peerId, transport);
  }

  _unregister(transport) {
    if (this.transports.get(transport.peerId) === transport) this.transports.delete(transport.peerId);
  }

  partition(peerId, reason = 'partition') {
    const transport = this.transports.get(peerId);
    if (!transport) return false;
    transport._setAvailable(false, 'reconnecting', reason);
    return true;
  }

  recover(peerId) {
    const transport = this.transports.get(peerId);
    if (!transport) return false;
    transport._setAvailable(true, 'connected', null);
    return true;
  }
}

export class InMemoryTransport {
  constructor(network, peerId) {
    this.network = network;
    this.peerId = peerId;
    this.started = false;
    this.available = false;
    this.state = 'idle';
    this.lastError = null;
    this.messageHandlers = new Set();
    this.healthHandlers = new Set();
  }

  start() {
    if (this.started) return true;
    this.network._register(this);
    this.started = true;
    this._setAvailable(true, 'connected', null);
    return true;
  }

  stop() {
    this.started = false;
    this.available = false;
    this.state = 'stopped';
    this.network._unregister(this);
    this._emitHealth();
  }

  restart() {
    if (!this.started) return this.start();
    this._setAvailable(true, 'connected', null);
    return true;
  }

  subscribe(handler) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onHealth(handler) {
    this.healthHandlers.add(handler);
    handler(this.health());
    return () => this.healthHandlers.delete(handler);
  }

  send(peerId, envelope) {
    if (!this.available) return false;
    const target = this.network.transports.get(peerId);
    if (!target?.available) return false;
    target._receive(cloneEnvelope(envelope), this.peerId);
    return true;
  }

  broadcast(envelope) {
    if (!this.available) return 0;
    let delivered = 0;
    for (const target of this.network.transports.values()) {
      if (target === this || !target.available) continue;
      target._receive(cloneEnvelope(envelope), this.peerId);
      delivered += 1;
    }
    return delivered;
  }

  health() {
    return {
      state: this.state,
      connected: this.available,
      role: this.available ? 'peer' : 'offline',
      myId: this.peerId,
      peerCount: [...this.network.transports.values()].filter((entry) => entry !== this && entry.available).length,
      lastError: this.lastError,
    };
  }

  _receive(envelope, peerId) {
    for (const handler of [...this.messageHandlers]) handler(envelope, { peerId, transport: 'in-memory' });
  }

  _setAvailable(available, state, error) {
    this.available = available;
    this.state = state;
    this.lastError = error;
    this._emitHealth();
  }

  _emitHealth() {
    const health = this.health();
    for (const handler of [...this.healthHandlers]) handler(health);
  }
}
