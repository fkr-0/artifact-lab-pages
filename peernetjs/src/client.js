import { EventBus } from './events.js';
import { createEnvelope, parseEnvelope } from './protocol.js';

export const PeernetClientState = Object.freeze({
  IDLE: 'idle',
  STARTING: 'starting',
  ONLINE: 'online',
  RECONNECTING: 'reconnecting',
  OFFLINE: 'offline',
  STOPPING: 'stopping',
  STOPPED: 'stopped',
  DESTROYED: 'destroyed',
});

function transportState(health, fallback) {
  if (health?.connected) return PeernetClientState.ONLINE;
  if (health?.state === 'reconnecting') return PeernetClientState.RECONNECTING;
  if (health?.state === 'stopped' || health?.state === 'destroyed') return PeernetClientState.STOPPED;
  if (health?.state === 'idle') return fallback;
  return PeernetClientState.OFFLINE;
}

export class PeernetClient {
  constructor({ transport, now = () => Date.now(), idFactory } = {}) {
    if (!transport) throw new TypeError('PeernetClient requires a transport');
    for (const method of ['start', 'stop', 'subscribe', 'onHealth', 'broadcast', 'send', 'health']) {
      if (typeof transport[method] !== 'function') {
        throw new TypeError(`transport.${method} must be a function`);
      }
    }
    this.transport = transport;
    this.now = now;
    this.idFactory = idFactory;
    this.events = new EventBus();
    this.state = PeernetClientState.IDLE;
    this.started = false;
    this.destroyed = false;
    this.lastError = null;
    this._unsubscribeMessage = null;
    this._unsubscribeHealth = null;
  }

  on(type, handler) {
    return this.events.on(type, handler);
  }

  off(type, handler) {
    return this.events.off(type, handler);
  }

  _transition(state, detail = {}) {
    if (this.state === state && !detail.force) return;
    const previous = this.state;
    this.state = state;
    const status = { state, previous, at: this.now(), ...detail };
    this.events.emit('status', status);
    this.events.emit('state', status);
  }

  _bind() {
    if (!this._unsubscribeMessage) {
      this._unsubscribeMessage = this.transport.subscribe((raw, meta = {}) => {
        const parsed = parseEnvelope(raw);
        if (!parsed.ok) {
          this.events.emit('protocol-error', { error: parsed.error, raw, meta });
          return;
        }
        const message = { from: meta.peerId || '', envelope: parsed.value, topic: parsed.value.topic, payload: parsed.value.payload, meta };
        this.events.emit('message', message);
        this.events.emit(`message:${parsed.value.topic}`, message);
      });
    }
    if (!this._unsubscribeHealth) {
      this._unsubscribeHealth = this.transport.onHealth((health) => {
        if (health?.connected) this.lastError = null;
        const state = transportState(health, this.started ? PeernetClientState.STARTING : this.state);
        this._transition(state, { health });
        this.events.emit('health', this.health());
      });
    }
  }

  async start() {
    if (this.destroyed) throw new Error('PeernetClient is destroyed');
    if (this.started && this.state === PeernetClientState.ONLINE) return true;
    this.started = true;
    this._bind();
    this._transition(PeernetClientState.STARTING);
    try {
      const result = await Promise.resolve(this.transport.start());
      const health = this.transport.health();
      if (result === false) {
        this.lastError = health?.lastError || 'transport start failed';
        this._transition(PeernetClientState.OFFLINE, { health, error: this.lastError });
        return false;
      }
      this._transition(transportState(health, PeernetClientState.STARTING), { health });
      return true;
    } catch (error) {
      this.lastError = error;
      this._transition(PeernetClientState.OFFLINE, { error, health: this.transport.health() });
      this.events.emit('error', error);
      return false;
    }
  }

  async stop() {
    if (this.destroyed) return;
    this._transition(PeernetClientState.STOPPING);
    this.started = false;
    await Promise.resolve(this.transport.stop());
    this._transition(PeernetClientState.STOPPED, { health: this.transport.health() });
  }

  async reconnect() {
    if (this.destroyed) throw new Error('PeernetClient is destroyed');
    this._bind();
    this.started = true;
    this._transition(PeernetClientState.RECONNECTING);
    try {
      const result = typeof this.transport.restart === 'function'
        ? await Promise.resolve(this.transport.restart())
        : (await Promise.resolve(this.transport.stop()), await Promise.resolve(this.transport.start()));
      const health = this.transport.health();
      if (result === false) {
        this._transition(PeernetClientState.OFFLINE, { health });
        return false;
      }
      this._transition(transportState(health, PeernetClientState.STARTING), { health });
      return true;
    } catch (error) {
      this.lastError = error;
      this._transition(PeernetClientState.OFFLINE, { error, health: this.transport.health() });
      this.events.emit('error', error);
      return false;
    }
  }

  send(peerId, topic, payload) {
    if (!peerId || this.state !== PeernetClientState.ONLINE) return false;
    const envelope = createEnvelope(topic, payload, { now: this.now, idFactory: this.idFactory });
    return this.transport.send(peerId, envelope) === true;
  }

  broadcast(topic, payload) {
    if (this.state !== PeernetClientState.ONLINE) return 0;
    const envelope = createEnvelope(topic, payload, { now: this.now, idFactory: this.idFactory });
    const result = this.transport.broadcast(envelope);
    return typeof result === 'number' ? result : result === false ? 0 : 1;
  }

  health() {
    const transport = this.transport.health() || {};
    return Object.freeze({
      state: this.state,
      connected: this.state === PeernetClientState.ONLINE,
      transport,
      lastError: this.lastError ? String(this.lastError.message || this.lastError) : transport.lastError || null,
    });
  }

  async destroy() {
    if (this.destroyed) return;
    await this.stop();
    this._unsubscribeMessage?.();
    this._unsubscribeHealth?.();
    this._unsubscribeMessage = null;
    this._unsubscribeHealth = null;
    this.destroyed = true;
    this._transition(PeernetClientState.DESTROYED);
    this.events.clear();
  }
}
