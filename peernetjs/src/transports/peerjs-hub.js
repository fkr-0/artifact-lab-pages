import { PeernetLobby } from '../../peernet-lib.js';

function offlineHealth(lobbyId, state = 'idle', lastError = null) {
  return {
    state,
    connected: false,
    role: 'offline',
    lobbyId,
    myId: null,
    peerCount: 0,
    lastError,
  };
}

/**
 * Transport facade over the proven legacy PeernetLobby hub/mesh implementation.
 * The facade is intentionally narrower than PeernetLobby: application protocol
 * code sees only envelopes and transport metadata, not PeerJS connections.
 */
export class PeerJsHubTransport {
  constructor({
    lobbyId,
    username = '',
    Peer,
    LobbyClass = PeernetLobby,
    ...lobbyOptions
  } = {}) {
    if (!lobbyId || typeof lobbyId !== 'string') throw new TypeError('PeerJsHubTransport requires lobbyId');
    this.lobbyId = lobbyId;
    this.username = username;
    this.Peer = Peer;
    this.LobbyClass = LobbyClass;
    this.lobbyOptions = lobbyOptions;
    this.lobby = null;
    this.lastHealth = offlineHealth(this.lobbyId, 'idle');
    this.messageHandlers = new Set();
    this.healthHandlers = new Set();
    this._bound = false;
  }

  _ensureLobby() {
    if (this.lobby) return this.lobby;
    const options = { ...this.lobbyOptions };
    if (this.Peer !== undefined) options.Peer = this.Peer;
    const lobby = new this.LobbyClass(this.lobbyId, options);
    this.lobby = lobby;
    this._bound = true;
    lobby.addEventListener('data', (event) => {
      const detail = event.detail || {};
      for (const handler of [...this.messageHandlers]) handler(detail.data, { peerId: detail.from || '', transport: 'peerjs-hub' });
    });
    lobby.addEventListener('health', (event) => {
      this.lastHealth = event.detail || lobby.health || this.lastHealth;
      for (const handler of [...this.healthHandlers]) handler(this.lastHealth);
    });
    return lobby;
  }

  async start() {
    const lobby = this._ensureLobby();
    try {
      await lobby.connect(this.username);
      return true;
    } catch (error) {
      this.lastHealth = offlineHealth(this.lobbyId, 'offline', error?.message || String(error));
      for (const handler of [...this.healthHandlers]) handler(this.lastHealth);
      return false;
    }
  }

  stop() {
    if (this.lobby) this.lobby.destroy();
    this.lobby = null;
    this._bound = false;
    this.lastHealth = offlineHealth(this.lobbyId, 'stopped');
    for (const handler of [...this.healthHandlers]) handler(this.lastHealth);
  }

  async restart() {
    if (!this.lobby) return this.start();
    try {
      await this.lobby.reconnect();
      return true;
    } catch (error) {
      this.lastHealth = offlineHealth(this.lobbyId, 'offline', error?.message || String(error));
      for (const handler of [...this.healthHandlers]) handler(this.lastHealth);
      return false;
    }
  }

  subscribe(handler) {
    if (typeof handler !== 'function') throw new TypeError('subscribe requires a handler');
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onHealth(handler) {
    if (typeof handler !== 'function') throw new TypeError('onHealth requires a handler');
    this.healthHandlers.add(handler);
    handler(this.health());
    return () => this.healthHandlers.delete(handler);
  }

  broadcast(envelope) {
    return this.lobby?.broadcast(envelope) || 0;
  }

  send(peerId, envelope) {
    return this.lobby?.send(peerId, envelope) || false;
  }

  health() {
    return this.lobby?.health || this.lastHealth;
  }

  diagnostics() {
    return this.lobby?.diagnostics || this.health();
  }

  get myId() {
    return this.lobby?.myId || null;
  }

  get peers() {
    return this.lobby?.peers || new Map();
  }
}
