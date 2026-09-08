export const PEERNET_MESSAGE_PROTOCOL = 'peernet/message';
export const PEERNET_MESSAGE_VERSION = 1;
export const MAX_TOPIC_LENGTH = 128;
export const MAX_MESSAGE_ID_LENGTH = 160;

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function defaultId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  if (globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  return `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function validateTopic(topic) {
  if (typeof topic !== 'string') throw new TypeError('topic must be a string');
  const value = topic.trim();
  if (!value) throw new TypeError('topic must not be empty');
  if (value.length > MAX_TOPIC_LENGTH) throw new RangeError(`topic exceeds ${MAX_TOPIC_LENGTH} characters`);
  if (/\s/.test(value)) throw new TypeError('topic must not contain whitespace');
  return value;
}

export function createEnvelope(topic, payload, {
  idFactory = defaultId,
  now = () => Date.now(),
} = {}) {
  const id = String(idFactory());
  if (!id) throw new TypeError('idFactory must return a non-empty identifier');
  return {
    protocol: PEERNET_MESSAGE_PROTOCOL,
    version: PEERNET_MESSAGE_VERSION,
    id,
    topic: validateTopic(topic),
    sentAt: Number(now()),
    payload,
  };
}

export function parseEnvelope(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, error: 'envelope must be an object' };
  }
  if (value.protocol !== PEERNET_MESSAGE_PROTOCOL) {
    return { ok: false, error: 'unsupported protocol' };
  }
  if (value.version !== PEERNET_MESSAGE_VERSION) {
    return { ok: false, error: `unsupported protocol version: ${String(value.version)}` };
  }
  if (!hasOwn(value, 'protocol') || !hasOwn(value, 'version') || !hasOwn(value, 'id') || !hasOwn(value, 'topic') || !hasOwn(value, 'sentAt')) {
    return { ok: false, error: 'envelope fields must be own properties' };
  }
  if (typeof value.id !== 'string' || !value.id || value.id.length > MAX_MESSAGE_ID_LENGTH) {
    return { ok: false, error: `message id must be a non-empty string of at most ${MAX_MESSAGE_ID_LENGTH} characters` };
  }
  let topic;
  try {
    topic = validateTopic(value.topic);
  } catch (error) {
    return { ok: false, error: error.message };
  }
  if (!Number.isFinite(value.sentAt)) {
    return { ok: false, error: 'sentAt must be a finite number' };
  }
  if (!hasOwn(value, 'payload')) {
    return { ok: false, error: 'payload is required' };
  }
  return {
    ok: true,
    value: {
      protocol: PEERNET_MESSAGE_PROTOCOL,
      version: PEERNET_MESSAGE_VERSION,
      id: value.id,
      topic,
      sentAt: value.sentAt,
      payload: value.payload,
    },
  };
}
