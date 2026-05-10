import assert from 'node:assert/strict';
import { buildMenuGroups, filterArtifacts } from '../app-hub-v11/lib/menu.js';
import { launchUrlForMode, normalizeLaunchMode } from '../app-hub-v11/lib/launcher.js';
import { readHubSetting, writeHubSetting } from '../app-hub-v11/lib/storage.js';
import { themes } from '../app-hub-v11/lib/themes.js';

const items = [
  { id: 'alpha', title: 'Alpha Synth', kind: 'html-path', tags: ['audio', 'tool'], description: 'Patchable music app' },
  { id: 'beta', title: 'Beta Notes', kind: 'info', tags: ['docs'], note: 'Only information' },
  { id: 'gamma', title: 'Gamma Link', kind: 'external-link', tags: ['docs', 'network'], href: 'https://example.invalid' },
];

assert.deepEqual(filterArtifacts(items, 'synth audio').map((item) => item.id), ['alpha']);
assert.deepEqual(filterArtifacts(items, 'docs').map((item) => item.id), ['beta', 'gamma']);
assert.equal(buildMenuGroups(items).find((group) => group.id === 'docs').items.length, 2);
assert.equal(normalizeLaunchMode('popup'), 'newWindow');
assert.equal(launchUrlForMode({ hubHref: 'compiled/alpha/index.html' }, 'inline'), 'compiled/alpha/index.html?embedded=true');
assert.equal(launchUrlForMode({ href: 'https://example.invalid' }, 'newWindow'), 'https://example.invalid');
assert.ok(themes.length >= 6);

const memory = new Map();
const adapter = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, value),
};
writeHubSetting('theme', 'matrix', adapter);
assert.equal(readHubSetting('theme', 'default', adapter), 'matrix');
