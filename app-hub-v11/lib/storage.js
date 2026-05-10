export const hubStoragePrefix = 'app-hub-v11:';

function storage(adapter) {
  return adapter || globalThis.localStorage;
}

function fullKey(key) {
  return key.startsWith(hubStoragePrefix) ? key : `${hubStoragePrefix}${key}`;
}

export function readHubSetting(key, fallback = null, adapter) {
  try {
    const value = storage(adapter)?.getItem(fullKey(key));
    return value == null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function writeHubSetting(key, value, adapter) {
  storage(adapter)?.setItem(fullKey(key), JSON.stringify(value));
  return value;
}

export function listHubSettings(adapter) {
  const s = storage(adapter);
  if (!s) return [];
  const keys = [];
  if (typeof s.length === 'number' && typeof s.key === 'function') {
    for (let index = 0; index < s.length; index += 1) {
      const key = s.key(index);
      if (key?.startsWith(hubStoragePrefix)) keys.push(key);
    }
    return keys.sort();
  }
  return Object.keys(s).filter((key) => key.startsWith(hubStoragePrefix)).sort();
}

export function safeParseStorageValue(value) {
  try { return JSON.parse(value); } catch { return value; }
}

export function byteSize(value) {
  return new TextEncoder().encode(String(value ?? '')).length;
}

export function buildStorageSnapshot(adapter) {
  const s = storage(adapter);
  const entries = listHubSettings(s).map((key) => {
    const raw = s.getItem(key) ?? '';
    return {
      key,
      shortKey: key.slice(hubStoragePrefix.length),
      raw,
      parsed: safeParseStorageValue(raw),
      bytes: byteSize(raw),
    };
  });
  return {
    prefix: hubStoragePrefix,
    totalKeys: entries.length,
    totalBytes: entries.reduce((sum, entry) => sum + entry.bytes, 0),
    entries,
  };
}

export function exportHubSettings(adapter) {
  const snapshot = buildStorageSnapshot(adapter);
  return JSON.stringify({ exportedAt: new Date().toISOString(), prefix: hubStoragePrefix, entries: snapshot.entries }, null, 2);
}

export function importHubSettings(json, adapter) {
  const payload = typeof json === 'string' ? JSON.parse(json) : json;
  const s = storage(adapter);
  for (const entry of payload.entries || []) s.setItem(entry.key, entry.raw);
  return buildStorageSnapshot(s);
}

export function clearHubSettings(adapter) {
  const s = storage(adapter);
  for (const key of listHubSettings(s)) s.removeItem(key);
  return buildStorageSnapshot(s);
}
