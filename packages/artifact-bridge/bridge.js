const PROTOCOL = 'artifacts.fkr.dev/bridge-v1';

function envelope(type, payload = {}) {
  return { protocol: PROTOCOL, type, payload, sentAt: new Date().toISOString() };
}

export function createArtifactClientBridge(options = {}) {
  const target = options.target || window.parent;
  const targetOrigin = options.targetOrigin || '*';
  const listeners = new Map();
  const onMessage = (event) => {
    const message = event.data;
    if (!message || message.protocol !== PROTOCOL) return;
    for (const callback of listeners.get(message.type) || []) callback(message.payload, event);
  };
  window.addEventListener('message', onMessage);
  return {
    protocol: PROTOCOL,
    send(type, payload) { target?.postMessage(envelope(type, payload), targetOrigin); },
    ready(payload = {}) { target?.postMessage(envelope('artifact.ready', payload), targetOrigin); },
    on(type, callback) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(callback);
      return () => listeners.get(type)?.delete(callback);
    },
    close() { window.removeEventListener('message', onMessage); listeners.clear(); },
  };
}

export function createArtifactHostBridge(options = {}) {
  const listeners = new Map();
  const allowedOrigins = new Set(options.allowedOrigins || []);
  const onMessage = (event) => {
    const message = event.data;
    if (!message || message.protocol !== PROTOCOL) return;
    if (allowedOrigins.size && !allowedOrigins.has(event.origin)) return;
    for (const callback of listeners.get(message.type) || []) callback(message.payload, event);
  };
  window.addEventListener('message', onMessage);
  return {
    protocol: PROTOCOL,
    send(targetWindow, type, payload, targetOrigin = '*') { targetWindow?.postMessage(envelope(type, payload), targetOrigin); },
    on(type, callback) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(callback);
      return () => listeners.get(type)?.delete(callback);
    },
    close() { window.removeEventListener('message', onMessage); listeners.clear(); },
  };
}

export { PROTOCOL as ARTIFACT_BRIDGE_PROTOCOL };
