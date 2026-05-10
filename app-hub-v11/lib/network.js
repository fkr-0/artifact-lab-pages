export function createNoopNetwork() {
  const listeners = new Map();
  return {
    status: 'offline',
    on(type, fn) { listeners.set(type, [...(listeners.get(type) || []), fn]); },
    emit(type, payload) { for (const fn of listeners.get(type) || []) fn(payload); },
    broadcast(type, payload) { this.emit(type, payload); return { type, payload, localOnly: true }; },
  };
}
