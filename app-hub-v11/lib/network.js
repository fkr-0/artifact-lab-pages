import { PeernetLobby } from "../../peernetjs/peernet-lib.js";

function createEmitter() {
  const listeners = new Map();
  return {
    on(type, fn) {
      listeners.set(type, [...(listeners.get(type) || []), fn]);
    },
    emit(type, payload) {
      for (const fn of listeners.get(type) || []) fn(payload);
    },
  };
}

function normalizePeers(input) {
  if (!input) return new Map();
  if (input instanceof Map) return new Map(input);
  if (Array.isArray(input)) return new Map(input);
  if (typeof input === "object") return new Map(Object.entries(input));
  return new Map();
}

export function createLobbyNetwork({
  lobbyId = "nexus-v11-hub-main",
  username = "pilot",
  storageKey = "v11-peernet",
  debug = false,
} = {}) {
  const emitter = createEmitter();
  const lobby = new PeernetLobby(lobbyId, { storageKey, debug });
  let status = "connecting";
  let peers = new Map();

  lobby.addEventListener("status", (event) => {
    const detail = event.detail || {};
    status = detail.text || status;
    emitter.emit("status", detail);
  });
  lobby.addEventListener("peers", (event) => {
    peers = normalizePeers(event.detail);
    emitter.emit("peers", peers);
  });
  lobby.addEventListener("data", (event) => {
    const detail = event.detail || {};
    const data = detail.data || {};
    emitter.emit("data", detail);
    if (typeof data.type === "string") {
      emitter.emit(`message:${data.type}`, {
        id: detail.from || "",
        payload: data.payload,
        raw: data,
      });
    }
  });

  lobby.connect(username).catch((error) => {
    status = `offline: ${error?.message || error}`;
    emitter.emit("status", { connected: false, text: status });
  });

  return {
    on: emitter.on,
    get status() {
      return status;
    },
    get peers() {
      return peers;
    },
    setUsername(nextUsername) {
      username = nextUsername || username;
      if (typeof lobby.setUsername === "function") lobby.setUsername(username);
    },
    broadcast(type, payload) {
      const packet = { type, payload, fromName: username, at: Date.now() };
      lobby.broadcast(packet);
      return { type, payload, localOnly: false };
    },
    destroy() {
      lobby.destroy();
    },
  };
}
