const DEFAULT_PEERJS_URL = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js';
const SAFE_ID = /[^a-zA-Z0-9_-]+/g;

function cleanId(value, fallback) {
  const normalized = String(value || '').trim().replace(SAFE_ID, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  return normalized || fallback;
}

function loadPeerJs(url = DEFAULT_PEERJS_URL) {
  if (globalThis.Peer) return Promise.resolve(globalThis.Peer);
  if (!globalThis.document) return Promise.reject(new Error('PeerJS requires a browser document'));
  const existing = document.querySelector('script[data-v13-peerjs]');
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => globalThis.Peer ? resolve(globalThis.Peer) : reject(new Error('PeerJS loaded without Peer global')), { once: true });
      existing.addEventListener('error', () => reject(new Error('PeerJS failed to load')), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.dataset.v13Peerjs = 'true';
    script.referrerPolicy = 'no-referrer';
    script.onload = () => globalThis.Peer ? resolve(globalThis.Peer) : reject(new Error('PeerJS loaded without Peer global'));
    script.onerror = () => reject(new Error('PeerJS failed to load'));
    document.head.append(script);
  });
}

export class PeerJsNetLobby extends EventTarget {
  constructor({ lobbyId = 'artifact-lab-v13', peerFactory = null, peerJsUrl = DEFAULT_PEERJS_URL } = {}) {
    super();
    this.lobbyId = cleanId(lobbyId, 'artifact-lab-v13');
    this.peerFactory = peerFactory;
    this.peerJsUrl = peerJsUrl;
    this.peer = null;
    this.connections = new Map();
    this.state = 'idle';
    this.role = 'offline';
    this.myId = null;
    this.lastError = null;
    this.changedAt = Date.now();
  }

  health() {
    return {
      state: this.state,
      connected: this.state === 'online' || this.state === 'hosting',
      role: this.role,
      lobbyId: this.lobbyId,
      myId: this.myId,
      peerCount: this.connections.size,
      changedAt: this.changedAt,
      lastError: this.lastError,
    };
  }

  _emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  _transition(state, role = this.role, error = null) {
    this.state = state;
    this.role = role;
    this.lastError = error ? String(error?.message || error) : null;
    this.changedAt = Date.now();
    this._emit('health', this.health());
  }

  async _makePeer(id) {
    if (this.peerFactory) return this.peerFactory(id);
    const Peer = await loadPeerJs(this.peerJsUrl);
    return id ? new Peer(id) : new Peer();
  }

  _bindConnection(connection) {
    if (!connection || !connection.peer || this.connections.has(connection.peer)) return;
    this.connections.set(connection.peer, connection);
    connection.on('data', (data) => this._emit('data', { from: connection.peer, data }));
    connection.on('close', () => {
      this.connections.delete(connection.peer);
      this._emit('peers', this.peers());
      this._emit('health', this.health());
    });
    connection.on('error', (error) => this._transition(this.state, this.role, error));
    this._emit('peers', this.peers());
  }

  peers() {
    return [...this.connections.keys()].sort();
  }

  async connect() {
    if (this.peer) return this.health();
    this._transition('connecting', 'client');
    const candidate = await this._makePeer();
    this.peer = candidate;
    return new Promise((resolve) => {
      const fail = (error) => {
        if (error?.type === 'peer-unavailable') return this._becomeHost(resolve);
        this._transition('offline', 'offline', error);
        resolve(this.health());
      };
      candidate.on('error', fail);
      candidate.on('connection', (connection) => connection.on('open', () => this._bindConnection(connection)));
      candidate.on('open', (id) => {
        this.myId = id;
        this._transition('joining', 'client');
        const hub = candidate.connect(this.lobbyId, { reliable: true });
        hub.on('open', () => {
          this._bindConnection(hub);
          this._transition('online', 'client');
          resolve(this.health());
        });
        hub.on('error', fail);
      });
    });
  }

  async _becomeHost(resolve) {
    try { this.peer?.destroy?.(); } catch {}
    this.connections.clear();
    this._transition('connecting', 'host');
    const host = await this._makePeer(this.lobbyId);
    this.peer = host;
    host.on('connection', (connection) => connection.on('open', () => this._bindConnection(connection)));
    host.on('error', (error) => this._transition('offline', 'offline', error));
    host.on('open', (id) => {
      this.myId = id;
      this._transition('hosting', 'host');
      resolve(this.health());
    });
  }

  disconnect() {
    for (const connection of this.connections.values()) {
      try { connection.close?.(); } catch {}
    }
    this.connections.clear();
    try { this.peer?.destroy?.(); } catch {}
    this.peer = null;
    this.myId = null;
    this._transition('closed', 'offline');
  }
}

export function createPeerJsNetLobby(options) {
  return new PeerJsNetLobby(options);
}

export { DEFAULT_PEERJS_URL };
