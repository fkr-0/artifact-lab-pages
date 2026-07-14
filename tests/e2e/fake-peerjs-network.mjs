export const fakePeerJsScript = String.raw`
(() => {
  const SIGNAL_CHANNEL = 'v11-e2e-fake-peerjs-signals';
  const REGISTRY_PREFIX = 'v11-e2e-fake-peerjs:';

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

  class FakeDataConnection extends Emitter {
    constructor(ownerId, peerId, connectionId) {
      super();
      this.ownerId = ownerId;
      this.peer = peerId;
      this.connectionId = connectionId;
      this.open = false;
      this.channel = new BroadcastChannel('v11-e2e-fake-peerjs-conn:' + connectionId);
      this.channel.onmessage = (event) => {
        const message = event.data || {};
        if (message.from === this.ownerId) return;
        if (message.kind === 'data') this.emit('data', message.data);
        if (message.kind === 'close') this.close(false);
      };
    }
    openConnection() {
      if (this.open) return;
      this.open = true;
      queueMicrotask(() => this.emit('open'));
    }
    send(data) {
      if (!this.open) return;
      this.channel.postMessage({ kind: 'data', from: this.ownerId, data });
    }
    close(announce = true) {
      if (announce && this.open) {
        this.channel.postMessage({ kind: 'close', from: this.ownerId });
      }
      this.open = false;
      this.channel.close();
      this.emit('close');
    }
  }

  class FakePeer extends Emitter {
    constructor(idOrOptions) {
      super();
      this.id = typeof idOrOptions === 'string'
        ? idOrOptions
        : 'peer-' + Math.random().toString(36).slice(2, 11);
      this.destroyed = false;
      this.pending = new Map();
      this.connections = new Map();
      this.signal = new BroadcastChannel(SIGNAL_CHANNEL);
      this.signal.onmessage = (event) => this.handleSignal(event.data || {});
      setTimeout(() => {
        if (this.destroyed) return;
        const key = REGISTRY_PREFIX + this.id;
        if (localStorage.getItem(key)) {
          this.emit('error', { type: 'unavailable-id', message: this.id + ' already exists' });
          return;
        }
        localStorage.setItem(key, String(Date.now()));
        this.emit('open', this.id);
      }, 0);
    }

    connect(peerId) {
      const connectionId = this.id + ':' + peerId + ':' + Math.random().toString(36).slice(2, 10);
      const connection = new FakeDataConnection(this.id, peerId, connectionId);
      this.pending.set(connectionId, connection);
      setTimeout(() => {
        if (this.destroyed) return;
        if (!localStorage.getItem(REGISTRY_PREFIX + peerId)) {
          this.emit('error', { type: 'peer-unavailable', message: peerId + ' unavailable' });
          return;
        }
        this.signal.postMessage({
          kind: 'connect',
          from: this.id,
          to: peerId,
          connectionId,
        });
      }, 20);
      return connection;
    }

    handleSignal(message) {
      if (message.to !== this.id || this.destroyed) return;
      if (message.kind === 'connect') {
        const connection = new FakeDataConnection(
          this.id,
          message.from,
          message.connectionId
        );
        this.connections.set(message.connectionId, connection);
        this.emit('connection', connection);
        setTimeout(() => {
          connection.openConnection();
          this.signal.postMessage({
            kind: 'accept',
            from: this.id,
            to: message.from,
            connectionId: message.connectionId,
          });
        }, 0);
      }
      if (message.kind === 'accept') {
        const connection = this.pending.get(message.connectionId);
        connection?.openConnection();
      }
    }

    destroy() {
      if (this.destroyed) return;
      this.destroyed = true;
      localStorage.removeItem(REGISTRY_PREFIX + this.id);
      for (const connection of this.pending.values()) connection.close(false);
      for (const connection of this.connections.values()) connection.close(false);
      this.pending.clear();
      this.connections.clear();
      this.signal.close();
      this.emit('close');
    }
  }

  window.Peer = FakePeer;
})();
`;

export async function installFakePeerJs(context) {
  await context.route('https://cdn.jsdelivr.net/npm/peerjs@*/dist/peerjs.min.js', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: fakePeerJsScript,
    })
  );
}
