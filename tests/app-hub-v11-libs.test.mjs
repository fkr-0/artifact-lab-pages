import assert from 'node:assert/strict';
import { buildMenuGroups, filterArtifacts } from '../app-hub-v11/lib/menu.js';
import { createFloatingPanel, launchArtifact, launchUrlForMode, normalizeLaunchMode } from '../app-hub-v11/lib/launcher.js';
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


const floatingRuntime = {
  created: [],
  body: {
    appended: [],
    append(node) { this.appended.push(node); },
  },
  document: {
    createElement(tagName) {
      const node = {
        tagName,
        className: '',
        innerHTML: '',
        removed: false,
        events: {},
        querySelector(selector) {
          if (selector !== 'button') return null;
          return {
            set onclick(handler) { node.events.close = handler; },
          };
        },
        remove() { this.removed = true; },
      };
      floatingRuntime.created.push(node);
      return node;
    },
    querySelector(selector) {
      return selector === '.floating' ? floatingRuntime.existingPanel : null;
    },
  },
};
floatingRuntime.existingPanel = { removed: false, remove() { this.removed = true; } };
const panel = createFloatingPanel({ title: 'Hyperblast Shooter', url: '../app-hub/shooter.html?embedded=true' }, floatingRuntime);
assert.equal(floatingRuntime.existingPanel.removed, true);
assert.equal(panel.className, 'floating');
assert.match(panel.innerHTML, /Hyperblast Shooter/);
assert.match(panel.innerHTML, /..\/app-hub\/shooter.html\?embedded=true/);
assert.equal(floatingRuntime.body.appended[0], panel);
panel.events.close();
assert.equal(panel.removed, true);


const multiplayerLaunch = launchArtifact(
  { href: '../app-hub/shooter.html' },
  'floating',
  { open() { throw new Error('floating launch should not open browser window'); } },
  { multiplayer: true }
);
assert.equal(multiplayerLaunch.mode, 'floating');
assert.equal(multiplayerLaunch.handledByBrowser, false);
assert.equal(multiplayerLaunch.url, '../app-hub/shooter.html?embedded=true&multiplayer=true');
