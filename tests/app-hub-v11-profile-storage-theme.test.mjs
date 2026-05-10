import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { applyThemeTokens, buildThemeStyleText, themes } from '../app-hub-v11/lib/themes.js';
import {
  buildStorageSnapshot,
  clearHubSettings,
  exportHubSettings,
  importHubSettings,
} from '../app-hub-v11/lib/storage.js';
import {
  avatarInitials,
  normalizeProfile,
  profileSummary,
} from '../app-hub-v11/lib/profile.js';

function memoryStorage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    get length() { return map.size; },
    key(index) { return [...map.keys()][index] ?? null; },
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) { map.delete(key); },
  };
}

assert.ok(themes.every((theme) => theme.tokens?.accent && theme.tokens?.surface && theme.tokens?.glow));
const css = buildThemeStyleText(themes.slice(0, 2));
assert.match(css, /\[data-theme="nexus"\]/);
assert.match(css, /--hub-surface:/);

const styleTarget = {
  values: new Map(),
  setAttribute(name, value) { this[name] = value; },
  style: { setProperty: (key, value) => styleTarget.values.set(key, value) },
};
applyThemeTokens('matrix', styleTarget);
assert.equal(styleTarget['data-theme'], 'matrix');
assert.equal(styleTarget.values.get('--hub-accent'), '#00ff88');
assert.ok(styleTarget.values.has('--hub-glow'));

const profile = normalizeProfile({ displayName: 'flo topcoder', handle: '@flo', color: '#ff00aa' });
assert.equal(avatarInitials(profile), 'FT');
assert.match(profileSummary(profile), /@flo/);
assert.equal(normalizeProfile({}).displayName.startsWith('Pilot-'), true);

const storage = memoryStorage({
  'app-hub-v11:theme': JSON.stringify('matrix'),
  'app-hub-v11:profile': JSON.stringify(profile),
  'other:key': 'ignore me',
});
const snapshot = buildStorageSnapshot(storage);
assert.equal(snapshot.totalKeys, 2);
assert.equal(snapshot.entries.find((entry) => entry.key.endsWith(':profile')).parsed.displayName, 'flo topcoder');
assert.equal(snapshot.totalBytes > 20, true);

const exported = exportHubSettings(storage);
clearHubSettings(storage);
assert.equal(buildStorageSnapshot(storage).totalKeys, 0);
importHubSettings(exported, storage);
assert.equal(buildStorageSnapshot(storage).totalKeys, 2);

const html = await readFile('app-hub-v11/index.html', 'utf8');
assert.match(html, /id="profileButton"/);
assert.match(html, /id="profileMenu"/);
assert.match(html, /id="storageTable"/);
assert.match(html, /buildStorageSnapshot/);
assert.match(html, /buildThemeStyleText/);
