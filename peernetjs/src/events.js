export class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(type, handler) {
    if (typeof handler !== 'function') throw new TypeError('event handler must be a function');
    const handlers = this.listeners.get(type) || new Set();
    handlers.add(handler);
    this.listeners.set(type, handlers);
    return () => this.off(type, handler);
  }

  off(type, handler) {
    const handlers = this.listeners.get(type);
    if (!handlers) return false;
    const removed = handlers.delete(handler);
    if (!handlers.size) this.listeners.delete(type);
    return removed;
  }

  emit(type, payload) {
    for (const handler of [...(this.listeners.get(type) || [])]) handler(payload);
    for (const handler of [...(this.listeners.get('*') || [])]) handler(type, payload);
  }

  clear() {
    this.listeners.clear();
  }
}
