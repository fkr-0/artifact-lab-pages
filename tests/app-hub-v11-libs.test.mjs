import assert from 'node:assert/strict';
import { buildMenuGroups, collectTagStats, createTagFilterState, filterArtifacts, filterArtifactsWithTags, renderTagFilterControls, tagColorStyle, toggleTagFilter } from '../app-hub-v11/lib/menu.js';
import { createAppRuntimeRegistry, createFloatingPanel, createInlineTabDeck, launchArtifact, launchUrlForMode, normalizeLaunchMode } from '../app-hub-v11/lib/launcher.js';
import { createEventLog } from '../app-hub-v11/lib/event-log.js';
import { clamp, createResizablePanels } from '../app-hub-v11/lib/resizable-panels.js';
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
assert.deepEqual(collectTagStats(items).find((tag) => tag.tag === 'docs'), { tag: 'docs', count: 2 });
const tagState = createTagFilterState(['docs'], 'OR');
assert.deepEqual(filterArtifactsWithTags(items, tagState).map((item) => item.id), ['beta', 'gamma']);
toggleTagFilter(tagState, 'audio');
tagState.mode = 'AND';
assert.deepEqual(filterArtifactsWithTags(items, tagState).map((item) => item.id), []);
assert.match(renderTagFilterControls(items, tagState), /data-tag="docs"/);
assert.match(renderTagFilterControls(items, tagState), /tag-button active/);
assert.match(renderTagFilterControls(items, tagState), /--tag-hue:/, 'tag controls should be color coded');
assert.match(tagColorStyle('docs'), /--tag-hue:\d+/, 'tagColorStyle should produce deterministic CSS variables');
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
        style: {},
        querySelector(selector) {
          if (selector === 'button[data-dock]') return {
            set onclick(handler) { node.events.dock = handler; },
          };
          if (selector === 'button[data-close-floating]' || selector === 'button') return {
            set onclick(handler) { node.events.close = handler; },
          };
          return null;
        },
        getBoundingClientRect() { return { left: 10, top: 20 }; },
        set onpointerdown(handler) { this.events.pointerdown = handler; },
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
assert.match(panel.innerHTML, /data-floating-drag-handle/, 'floating panel should expose a drag handle');
assert.match(panel.innerHTML, /data-floating-resize-handle/, 'floating panel should expose a resize handle');
const docked = [];
const dockPanel = createFloatingPanel({ title: 'Dockable', url: 'dock.html', dockLabel: 'dock inline', onDock: () => docked.push('dock') }, floatingRuntime);
assert.match(dockPanel.innerHTML, /data-dock/, 'dockable floating panels should expose a dock control');
dockPanel.events.dock();
assert.deepEqual(docked, ['dock'], 'dock control should call the provided dock callback');
assert.equal(panel.style.position, 'fixed');
assert.equal(panel.style.resize, 'both', 'floating panel should be browser-resizable');
assert.equal(floatingRuntime.body.appended[0], panel);
assert.equal(typeof panel.events.pointerdown, 'function', 'floating panel should register pointer drag handlers');
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

const bombermanMultiplayerLaunch = launchArtifact(
  { href: '../app-hub/bomberman.html' },
  'floating',
  { open() { throw new Error('floating launch should not open browser window'); } },
  { id: 'multiplayer', multiplayer: true }
);
assert.equal(bombermanMultiplayerLaunch.url, '../app-hub/bomberman.html?embedded=true&multiplayer=true');

const observedBombermanLaunch = launchArtifact(
  { href: '../app-hub/bomberman.html' },
  'inline',
  { open() { throw new Error('inline launch should not open browser window'); } },
  { multiplayer: true, targetPeerId: 'peer 1/2', spectate: true, observe: true, mode: 'vs', session: 'bomberman' }
);
assert.equal(observedBombermanLaunch.url, '../app-hub/bomberman.html?embedded=true&multiplayer=true&targetPeerId=peer%201%2F2&spectate=true&observe=true&mode=vs&session=bomberman');

const dawSessionLaunch = launchArtifact(
  { href: '../v11-peer-daw/index.html' },
  'inline',
  { open() { throw new Error('inline launch should not open browser window'); } },
  { multiplayer: true, targetPeerId: 'peer-a', mode: 'session', session: 'daw' }
);
assert.equal(dawSessionLaunch.url, '../v11-peer-daw/index.html?embedded=true&multiplayer=true&targetPeerId=peer-a&mode=session&session=daw');

function makeNode(tagName = 'div') {
  const node = {
    tagName,
    className: '',
    dataset: {},
    children: [],
    removed: false,
    textContent: '',
    innerHTML: '',
    src: '',
    title: '',
    attributes: {},
    events: {},
    classList: {
      values: new Set(),
      add(name) { this.values.add(name); },
      remove(name) { this.values.delete(name); },
      toggle(name, force) { force ? this.values.add(name) : this.values.delete(name); },
      contains(name) { return this.values.has(name); },
    },
    append(...children) { this.children.push(...children); children.forEach((child) => { child.parentNode = this; }); },
    appendChild(child) { this.append(child); return child; },
    remove() { this.removed = true; if (this.parentNode) this.parentNode.children = this.parentNode.children.filter((child) => child !== this); },
    setAttribute(name, value) { this.attributes[name] = value; this[name] = value; },
    querySelector(selector) {
      if (selector === 'button[data-close]') return this.closeButton || null;
      if (selector === 'button[data-float]') return this.floatButton || null;
      if (selector === 'button[data-dock]') return this.dockButton || null;
      if (selector === 'iframe') return this.children.find((child) => child.tagName === 'iframe') || null;
      return null;
    },
    set onclick(handler) { this.events.click = handler; },
  };
  return node;
}

const deckNode = makeNode('section');
const tabsNode = makeNode('div');
const bodyNode = makeNode('div');
const inlineRuntime = { document: { createElement: makeNode } };
const inlineDeck = createInlineTabDeck({ deck: deckNode, tabs: tabsNode, body: bodyNode, runtime: inlineRuntime });
const alphaArtifact = { id: 'alpha', title: 'Alpha Synth', href: 'alpha.html' };
const betaArtifact = { id: 'beta', title: 'Beta Notes', href: 'beta.html' };

inlineDeck.open(alphaArtifact, { url: 'alpha.html?embedded=true' });
inlineDeck.open(betaArtifact, { url: 'beta.html?embedded=true' });
assert.equal(tabsNode.children.length, 2, 'inline deck should keep multiple app tabs open');
assert.equal(bodyNode.children.length, 2, 'inline deck should keep multiple app panels open');
assert.equal(inlineDeck.activeId(), 'beta');
inlineDeck.open(alphaArtifact, { url: 'alpha.html?embedded=true' });
assert.equal(tabsNode.children.length, 2, 'opening an existing app should switch instead of duplicating');
assert.equal(inlineDeck.activeId(), 'alpha');

assert.equal(tabsNode.children[0].floatButton?.dataset.float, 'alpha', 'inline app tabs should expose a float control');
const alphaData = inlineDeck.openApps.get('alpha');
assert.equal(alphaData.containerMode, 'inline');
const alphaIframe = alphaData.iframeNode;
const floatedAlpha = inlineDeck.float('alpha');
assert.equal(floatedAlpha.containerMode, 'floating', 'inline deck float() should mark the app as floating');
assert.equal(tabsNode.children.some((child) => child.dataset.appId === 'alpha'), false, 'floating an app should remove its inline tab');
assert.equal(bodyNode.children.some((child) => child.dataset.appId === 'alpha'), false, 'floating an app should remove its inline panel');
assert.equal(floatedAlpha.iframeNode, alphaIframe, 'floating an app should preserve the iframe node for state transfer');
inlineDeck.dock(floatedAlpha);
assert.equal(inlineDeck.openApps.get('alpha').containerMode, 'inline', 'docking should restore the app to inline mode');
assert.equal(inlineDeck.openApps.get('alpha').iframeNode, alphaIframe, 'docking should preserve the same iframe node');
assert.equal(tabsNode.children.some((child) => child.dataset.appId === 'alpha'), true, 'docking should recreate the inline tab');
assert.equal(bodyNode.children.some((child) => child.dataset.appId === 'alpha'), true, 'docking should recreate the inline panel');
inlineDeck.close('alpha');
assert.equal(tabsNode.children.length, 1, 'closing a tab should remove its tab node');
assert.equal(bodyNode.children.length, 1, 'closing a tab should remove its panel node');
assert.equal(inlineDeck.activeId(), 'beta');
inlineDeck.close('beta');
assert.equal(deckNode.classList.contains('active'), false, 'closing the final tab should hide the deck');

const logTarget = { textContent: '' };
const eventLog = createEventLog({ target: logTarget, limit: 2 });
eventLog.info('boot');
eventLog.success('launch', 'alpha');
eventLog.warn('oldest should drop');
assert.equal(eventLog.entries.length, 2);
assert.match(logTarget.textContent, /WARN oldest should drop/);
assert.doesNotMatch(logTarget.textContent, /INFO boot/);
eventLog.clear();
assert.equal(logTarget.textContent, '');

assert.equal(clamp(5, 10, 20), 10);
assert.equal(clamp(25, 10, 20), 20);
assert.equal(clamp(15, 10, 20), 15);

const resizeRoot = { style: { values: {}, setProperty(name, value) { this.values[name] = value; } } };
const verticalHandle = { listeners: {}, addEventListener(type, handler) { this.listeners[type] = handler; } };
const horizontalHandle = { listeners: {}, addEventListener(type, handler) { this.listeners[type] = handler; } };
const resizeRuntime = {
  addEventListener(type, handler) { this[type] = handler; },
  removeEventListener() {},
};
createResizablePanels({
  root: resizeRoot,
  runtime: resizeRuntime,
  handles: [
    { handle: verticalHandle, axis: 'x', variable: '--sidebar-width', min: 260, max: 620, unit: 'px' },
    { handle: horizontalHandle, axis: 'y', variable: '--filter-panel-fr', min: 0.35, max: 2.5, unit: 'fr', toValue: ({ clientY }) => clientY / 240 },
  ],
});
verticalHandle.listeners.pointerdown({ clientX: 700, preventDefault() {} });
resizeRuntime.pointermove({ clientX: 700 });
assert.equal(resizeRoot.style.values['--sidebar-width'], '620px');
horizontalHandle.listeners.pointerdown({ clientY: 120, preventDefault() {} });
resizeRuntime.pointermove({ clientY: 480 });
assert.equal(resizeRoot.style.values['--filter-panel-fr'], '2fr');
