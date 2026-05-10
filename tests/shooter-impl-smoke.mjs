import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile('app-hub/shooter.html', 'utf8');

const constructorBlock = html.slice(
  html.indexOf('constructor() {'),
  html.indexOf('this.gameLoop = null;')
);
for (const key of ['allies', 'shields', 'enemyProjectiles']) {
  const matches = constructorBlock.match(new RegExp(`${key}: \\[\\]`, 'g')) || [];
  assert.equal(matches.length, 1, `constructor should initialize ${key} exactly once`);
}

const stopBlock = html.slice(
  html.indexOf('stopMultiplayer() {'),
  html.indexOf('broadcastGameState() {')
);
assert.match(stopBlock, /this\.lobby\.destroy\?\.\(\)/, 'stopMultiplayer should destroy the PeernetLobby instance');
assert.match(stopBlock, /this\.lobby\s*=\s*null/, 'stopMultiplayer should clear lobby reference');

const destroyBlock = html.slice(
  html.indexOf('destroy() {'),
  html.indexOf('loop() {')
);
assert.match(destroyBlock, /this\.stopMultiplayer\(\)/, 'destroy should reuse stopMultiplayer cleanup');
assert.match(html, /window\.addEventListener\('beforeunload', \(\) => game\.destroy\(\)\)/, 'window unload should destroy the shooter runtime');

console.log('shooter implementation smoke checks passed');
