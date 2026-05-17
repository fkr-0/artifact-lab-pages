import { PeernetLobby } from '../../peernetjs/peernet-lib.js';
import { electHost } from './brickbreaker-core.mjs';

export function createBrickbreakerPeernetNetwork({
  localId,
  lobbyId = 'nexus-brickbreaker-coop',
  username = `BrickBreaker-${localId}`,
  storageKey = 'nexus-brickbreaker',
  debug = false,
} = {}) {
  if (!localId) throw new Error('createBrickbreakerPeernetNetwork requires localId');

  const listeners = new Map();
  const lobby = new PeernetLobby(lobbyId, { debug, storageKey });
  let status = 'connecting';
  let hostId = localId;

  lobby.addEventListener('status', (event) => {
    status = event.detail.text;
    emit('status', { status, hostId });
  });

  lobby.addEventListener('peers', (event) => {
    const ids = [localId, ...Array.from(event.detail.keys())].sort();
    hostId = electHost(ids) || localId;
    emit('players', ids);
    emit('status', { status, hostId });
  });

  lobby.addEventListener('data', (event) => {
    const payload = event.detail.data;
    if (!payload?.type) return;
    emit(payload.type, payload.payload);
  });

  const ready = lobby.connect(username).catch((error) => {
    status = `offline: ${error?.message || error}`;
    emit('status', { status, hostId });
  });

  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  return {
    get status() { return status; },
    get hostId() { return hostId; },
    ready,
    on(type, fn) {
      listeners.set(type, [...(listeners.get(type) || []), fn]);
    },
    broadcast(type, payload) {
      lobby.broadcast({ type, payload });
      emit(type, payload);
    },
    destroy() {
      lobby.destroy();
    },
  };
}
