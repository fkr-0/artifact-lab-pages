const PERMISSION_KEY = 'v13hub.collection.permission.v1';
const IDS_KEY = 'v13hub.collection.ids.v1';

function parseIds(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((entry) => typeof entry === 'string' && entry))].sort();
  } catch {
    return [];
  }
}

export function createLocalCollectionStore(storage) {
  if (storage === undefined) {
    try { storage = globalThis.localStorage; } catch { storage = null; }
  }

  const available = Boolean(
    storage
      && typeof storage.getItem === 'function'
      && typeof storage.setItem === 'function'
      && typeof storage.removeItem === 'function',
  );

  function readRaw(key) {
    if (!available) return { ok: false, value: null };
    try { return { ok: true, value: storage.getItem(key) ?? null }; } catch { return { ok: false, value: null }; }
  }

  function writeAndVerify(key, value) {
    if (!available) return { ok: false, reason: 'storage-unavailable' };
    try { storage.setItem(key, value); } catch { /* Re-read: a storage implementation may mutate before throwing. */ }
    const observed = readRaw(key);
    if (!observed.ok) return { ok: false, reason: 'storage-unavailable' };
    return observed.value === String(value)
      ? { ok: true }
      : { ok: false, reason: key === PERMISSION_KEY ? 'permission-write-failed' : 'ids-write-failed' };
  }

  function removeAndVerify(key) {
    if (!available) return { ok: false, reason: 'storage-unavailable' };
    try { storage.removeItem(key); } catch { /* Re-read to determine persisted truth. */ }
    const observed = readRaw(key);
    if (!observed.ok) return { ok: false, reason: 'storage-unavailable' };
    return observed.value === null
      ? { ok: true }
      : { ok: false, reason: key === PERMISSION_KEY ? 'permission-clear-failed' : 'ids-clear-failed' };
  }

  function snapshot() {
    const permission = readRaw(PERMISSION_KEY);
    const ids = readRaw(IDS_KEY);
    return {
      available: permission.ok && ids.ok,
      permitted: permission.ok && permission.value === 'granted',
      ids: ids.ok ? parseIds(ids.value) : [],
    };
  }

  function failure(reason) {
    return { ok: false, reason, ...snapshot() };
  }

  function sameIds(left, right) {
    return left.length === right.length && left.every((id, index) => id === right[index]);
  }

  return {
    snapshot,
    grant() {
      const current = snapshot();
      if (!current.available) return failure('storage-unavailable');
      if (current.permitted) return { ok: true, ...current };

      // A previous/legacy failed revoke can leave IDs behind while permission is absent.
      // The explicit enable action must never resurrect those stale IDs.
      const staleIdsCleared = removeAndVerify(IDS_KEY);
      if (!staleIdsCleared.ok) return failure(staleIdsCleared.reason);

      const permissionWritten = writeAndVerify(PERMISSION_KEY, 'granted');
      if (!permissionWritten.ok) return failure(permissionWritten.reason);
      const next = snapshot();
      return next.available && next.permitted && next.ids.length === 0
        ? { ok: true, ...next }
        : { ok: false, reason: next.available ? 'storage-state-changed' : 'storage-unavailable', ...next };
    },
    toggle(id) {
      const current = snapshot();
      if (!current.available) return failure('storage-unavailable');
      if (!current.permitted) return { ok: false, reason: 'permission-required', ...current };
      if (typeof id !== 'string' || !id) return { ok: false, reason: 'invalid-id', ...current };
      const ids = new Set(current.ids);
      if (ids.has(id)) ids.delete(id); else ids.add(id);
      const next = [...ids].sort();
      const written = writeAndVerify(IDS_KEY, JSON.stringify(next));
      if (!written.ok) return failure(written.reason);
      const persisted = snapshot();
      return persisted.available && persisted.permitted && sameIds(persisted.ids, next)
        ? { ok: true, ...persisted }
        : { ok: false, reason: persisted.available ? 'storage-state-changed' : 'storage-unavailable', ...persisted };
    },
    reset() {
      const current = snapshot();
      if (!current.available) return failure('storage-unavailable');
      if (!current.permitted) return { ok: false, reason: 'permission-required', ...current };
      const cleared = removeAndVerify(IDS_KEY);
      if (!cleared.ok) return failure(cleared.reason);
      const persisted = snapshot();
      return persisted.available && persisted.permitted && persisted.ids.length === 0
        ? { ok: true, ...persisted }
        : { ok: false, reason: persisted.available ? 'storage-state-changed' : 'storage-unavailable', ...persisted };
    },
    revoke() {
      const current = snapshot();
      if (!current.available) return failure('storage-unavailable');

      // Clear data first. Permission is only disabled once absence of the ID key
      // is verified, so a failed clear can never masquerade as a successful revoke.
      const idsRemoved = removeAndVerify(IDS_KEY);
      if (!idsRemoved.ok) return failure(idsRemoved.reason);
      const permissionRemoved = removeAndVerify(PERMISSION_KEY);
      if (!permissionRemoved.ok) return failure(permissionRemoved.reason);

      const persisted = snapshot();
      return persisted.available && !persisted.permitted && persisted.ids.length === 0
        ? { ok: true, ...persisted }
        : { ok: false, reason: persisted.available ? 'storage-state-changed' : 'storage-unavailable', ...persisted };
    },
  };
}

export { IDS_KEY, PERMISSION_KEY };
