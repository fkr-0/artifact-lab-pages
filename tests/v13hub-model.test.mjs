import assert from 'node:assert/strict';
import test from 'node:test';
import { loadCatalog } from '../src/v13hub/catalog.js';
import { createLocalCollectionStore, IDS_KEY, PERMISSION_KEY } from '../src/v13hub/collection.js';
import { healthEvidence, targetPolicy, validateCatalog } from '../src/v13hub/contracts.js';
import { readPeerSnapshot, reviewRemoteOffer } from '../src/v13hub/peer-boundary.js';
import { arcadeCapabilitySummary } from '../src/v13hub/arcade-tools.js';
import { filterArtifacts } from '../src/v13hub/search.js';
import { createInitialState, hubReducer } from '../src/v13hub/state.js';

const artifacts = [
  { id: 'local-tool', title: 'Local Tool', description: 'offline editor', kind: 'application', status: 'active', tags: ['tool'], sourceKind: 'directory', gitMode: 'root', buildMode: 'none', releaseKind: 'directory', availability: 'verified', url: '/artifacts/local-tool/1.0.0/index.html', changedAt: '2026-08-01T00:00:00.000Z', git: { basis: 'source', revision: 'abc', path: 'local-tool' }, receipt: { version: '1.0.0', files: 3, generatedAt: '2026-08-01T00:00:00.000Z' } },
  { id: 'outside', title: 'Outside Link', description: 'repository', kind: 'link', status: 'experimental', tags: ['source'], sourceKind: 'external', gitMode: 'none', buildMode: 'external', releaseKind: 'external', availability: 'external', url: 'https://example.org/repo', changedAt: null, git: { basis: 'unknown' }, receipt: null },
];

function catalog(items = artifacts) {
  return validateCatalog({ schemaVersion: 'artifacts.fkr.dev/catalog-v1', generatedAt: '2026-08-02T00:00:00.000Z', summary: { total: items.length }, items });
}

function faultStorage(initial = {}, shouldThrow = () => false) {
  const values = new Map(Object.entries(initial));
  const fail = (operation, key, phase) => {
    if (shouldThrow({ operation, key, phase, values })) throw new Error(`storage fault: ${operation}:${key}:${phase}`);
  };
  return {
    values,
    getItem(key) {
      fail('getItem', key, 'before');
      const value = values.get(key) ?? null;
      fail('getItem', key, 'after');
      return value;
    },
    setItem(key, value) {
      fail('setItem', key, 'before');
      values.set(key, String(value));
      fail('setItem', key, 'after');
    },
    removeItem(key) {
      fail('removeItem', key, 'before');
      values.delete(key);
      fail('removeItem', key, 'after');
    },
  };
}

test('catalog validation preserves evidence fields and rejects duplicate identities', () => {
  const parsed = catalog();
  assert.equal(parsed.items[0].receipt.files, 3);
  assert.equal(healthEvidence(parsed.items[0]).label, 'Receipt verified');
  assert.throws(() => catalog([artifacts[0], artifacts[0]]), /duplicate artifact id/);
});

test('arcade tooling resolves only catalog-backed surfaces', () => {
  const summary = arcadeCapabilitySummary(catalog().items);
  assert.equal(summary.total, 4);
  assert.equal(summary.available, 0);
  assert.equal(summary.tools.find((tool) => tool.id === 'sprite-fan-atlas-studio').availability, 'not-cataloged');
});

test('catalog loader never fetches cross-origin candidates', async () => {
  let fetchCalls = 0;
  await assert.rejects(
    loadCatalog({
      pageUrl: 'https://artifacts.example/hub/v13/index.html',
      candidates: ['https://untrusted.example/catalog.json'],
      fetchImpl: async () => { fetchCalls += 1; return { ok: true, json: async () => ({}) }; },
    }),
    /No authoritative V13 catalog could be loaded/,
  );
  assert.equal(fetchCalls, 0);
});

test('launch policy allows same-origin releases but requires explicit review for external content', () => {
  const [local, outside] = catalog().items;
  const pageUrl = 'https://artifacts.example/hub/v13/index.html';
  assert.deepEqual(targetPolicy(local, pageUrl), {
    mode: 'local', allowed: true, requiresExplicitApproval: false, reason: 'same-origin-release', url: 'https://artifacts.example/artifacts/local-tool/1.0.0/index.html',
  });
  const external = targetPolicy(outside, pageUrl);
  assert.equal(external.mode, 'external-review');
  assert.equal(external.allowed, false);
  assert.equal(external.requiresExplicitApproval, true);
});

test('collection persists only after explicit local permission and stores IDs only', () => {
  const unavailable = createLocalCollectionStore(null);
  assert.deepEqual(unavailable.snapshot(), { available: false, permitted: false, ids: [] });
  assert.equal(unavailable.grant().reason, 'storage-unavailable');
  assert.equal(unavailable.toggle('local-tool').reason, 'storage-unavailable');

  const values = new Map();
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key) };
  const store = createLocalCollectionStore(storage);
  assert.deepEqual(store.snapshot(), { available: true, permitted: false, ids: [] });
  assert.equal(store.toggle('local-tool').reason, 'permission-required');
  assert.equal(values.size, 0);
  assert.equal(store.grant().ok, true);
  assert.deepEqual(store.toggle('local-tool').ids, ['local-tool']);
  assert.equal([...values.values()].some((value) => value.includes('Local Tool')), false);
  assert.deepEqual(store.revoke(), { ok: true, available: true, permitted: false, ids: [] });
});

test('collection fails closed when storage cannot be read', () => {
  const storage = faultStorage({}, ({ operation }) => operation === 'getItem');
  const store = createLocalCollectionStore(storage);
  assert.deepEqual(store.snapshot(), { available: false, permitted: false, ids: [] });
  assert.equal(store.grant().reason, 'storage-unavailable');
  assert.equal(store.reset().reason, 'storage-unavailable');
  assert.equal(store.revoke().reason, 'storage-unavailable');
  assert.equal(storage.values.size, 0);
});

test('failed ID removal leaves permission and persisted IDs visibly intact', () => {
  const storage = faultStorage({
    [PERMISSION_KEY]: 'granted',
    [IDS_KEY]: JSON.stringify(['artifact-a']),
  }, ({ operation, key, phase }) => operation === 'removeItem' && key === IDS_KEY && phase === 'before');
  const result = createLocalCollectionStore(storage).revoke();
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'ids-clear-failed');
  assert.deepEqual(result, { ok: false, reason: 'ids-clear-failed', available: true, permitted: true, ids: ['artifact-a'] });
  assert.equal(storage.values.get(PERMISSION_KEY), 'granted');
  assert.equal(storage.values.get(IDS_KEY), '["artifact-a"]');
});

test('partial revoke reports cleared IDs but keeps permission truthful when permission removal fails', () => {
  const storage = faultStorage({
    [PERMISSION_KEY]: 'granted',
    [IDS_KEY]: JSON.stringify(['artifact-a']),
  }, ({ operation, key, phase }) => operation === 'removeItem' && key === PERMISSION_KEY && phase === 'before');
  const result = createLocalCollectionStore(storage).revoke();
  assert.deepEqual(result, { ok: false, reason: 'permission-clear-failed', available: true, permitted: true, ids: [] });
  assert.equal(storage.values.get(PERMISSION_KEY), 'granted');
  assert.equal(storage.values.has(IDS_KEY), false);
});

test('re-enable scrubs stale IDs from an earlier failed revoke instead of resurrecting them', () => {
  const storage = faultStorage({ [IDS_KEY]: JSON.stringify(['artifact-a']) });
  const result = createLocalCollectionStore(storage).grant();
  assert.deepEqual(result, { ok: true, available: true, permitted: true, ids: [] });
  assert.equal(storage.values.get(PERMISSION_KEY), 'granted');
  assert.equal(storage.values.has(IDS_KEY), false);
});

test('permission and ID-key mutation failures reconcile from persisted bytes', () => {
  const permissionStorage = faultStorage({}, ({ operation, key, phase }) => operation === 'setItem' && key === PERMISSION_KEY && phase === 'before');
  const permissionResult = createLocalCollectionStore(permissionStorage).grant();
  assert.deepEqual(permissionResult, { ok: false, reason: 'permission-write-failed', available: true, permitted: false, ids: [] });

  const idsStorage = faultStorage({ [PERMISSION_KEY]: 'granted' }, ({ operation, key, phase }) => operation === 'setItem' && key === IDS_KEY && phase === 'before');
  const idsStore = createLocalCollectionStore(idsStorage);
  const toggleResult = idsStore.toggle('artifact-a');
  assert.deepEqual(toggleResult, { ok: false, reason: 'ids-write-failed', available: true, permitted: true, ids: [] });

  const resetStorage = faultStorage({
    [PERMISSION_KEY]: 'granted',
    [IDS_KEY]: JSON.stringify(['artifact-a']),
  }, ({ operation, key, phase }) => operation === 'removeItem' && key === IDS_KEY && phase === 'before');
  const resetResult = createLocalCollectionStore(resetStorage).reset();
  assert.deepEqual(resetResult, { ok: false, reason: 'ids-clear-failed', available: true, permitted: true, ids: ['artifact-a'] });
});

test('post-mutation exceptions are judged by the bytes that actually persisted', () => {
  const storage = faultStorage({
    [PERMISSION_KEY]: 'granted',
    [IDS_KEY]: JSON.stringify(['artifact-a']),
  }, ({ operation, key, phase }) => operation === 'removeItem' && key === IDS_KEY && phase === 'after');
  const result = createLocalCollectionStore(storage).revoke();
  assert.deepEqual(result, { ok: true, available: true, permitted: false, ids: [] });
  assert.equal(storage.values.size, 0);
});

test('search composes tokens, evidence facets, collected-only state, and deterministic ordering', () => {
  const parsed = catalog().items;
  assert.deepEqual(filterArtifacts(parsed, { query: 'offline tool', sort: 'recent' }).map((item) => item.id), ['local-tool']);
  assert.deepEqual(filterArtifacts(parsed, { availability: 'external', sort: 'recent' }).map((item) => item.id), ['outside']);
  assert.deepEqual(filterArtifacts(parsed, { collectedOnly: true, sort: 'recent' }, ['outside']).map((item) => item.id), ['outside']);
});

test('peer boundary never infers connectivity and remote offers remain review-gated', () => {
  assert.equal(readPeerSnapshot(null).state, 'disabled');
  assert.equal(readPeerSnapshot({ health: () => ({ state: 'connected', connected: false, peerCount: 4 }) }).connected, false);
  const connected = readPeerSnapshot({ health: () => ({ state: 'hosting', connected: true, peerCount: 2, myId: 'peer-a' }) });
  assert.equal(connected.connected, true);
  assert.equal(connected.proof.peerCount, 2);
  const offer = { offerId: 'offer-1', token: 'cap-1', artifact: { id: 'remote-one' } };
  assert.equal(reviewRemoteOffer(offer).reason, 'explicit-review-required');
  assert.equal(reviewRemoteOffer(offer, { userApproved: true }).state, 'staged-for-review');
});

test('state reducer keeps catalog, filters, collection, and selection as independent domains', () => {
  const initial = createInitialState();
  const loaded = hubReducer(initial, { type: 'catalog.loaded', catalog: catalog() });
  const filtered = hubReducer(loaded, { type: 'filter.patch', patch: { query: 'tool' } });
  const collected = hubReducer(filtered, { type: 'collection.changed', collection: { permitted: true, ids: ['local-tool'] } });
  const selected = hubReducer(collected, { type: 'inspect', id: 'local-tool' });
  assert.equal(selected.catalogStatus, 'ready');
  assert.equal(selected.filters.query, 'tool');
  assert.deepEqual(selected.collection.ids, ['local-tool']);
  assert.equal(selected.selectedId, 'local-tool');
});
