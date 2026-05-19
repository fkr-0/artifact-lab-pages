import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile('app-hub/shooter.html', 'utf8');

const constructorBlock = html.slice(
  html.indexOf('constructor() {'),
  html.indexOf('this.gameLoop = null;')
);
const localStateKeys = [
  'player',
  'ownedShips',
  'ownedBoosters',
  'ownedWeapons',
  'bullets',
  'enemies',
  'particles',
  'turrets',
  'allies',
  'shields',
  'enemyProjectiles',
  'score',
  'money',
  'enemyAmountMultiplier',
  'enemyPowerMultiplier',
  'stage',
  'stageKills',
  'stageGoal',
  'bossActive',
  'bossDefeated',
  'keys',
  'spawnTimer',
  'lastFrameAt',
  'story',
  'gameOver',
];
const requiredCombatArrays = ['allies', 'shields', 'enemyProjectiles'];
assert.match(constructorBlock, /local:\s*this\.createInitialLocalState\(\{ y: 0 \}\)/, 'constructor should initialize local state through createInitialLocalState');

const initialLocalStateBlock = html.slice(
  html.indexOf('createInitialLocalState('),
  html.indexOf('getUsername() {')
);
assert.match(initialLocalStateBlock, /createInitialLocalState\(\{ y = 0, keys = \{\}, enemyAmount = 2, enemyPower = 2 \} = \{\}\)/, 'ShooterGame should centralize local-state construction with safe defaults');
for (const key of localStateKeys) {
  assert.match(initialLocalStateBlock, new RegExp(`\\b${key}:`), `createInitialLocalState should initialize ${key}`);
}
for (const key of requiredCombatArrays) {
  const matches = initialLocalStateBlock.match(new RegExp(`${key}: \\[\\]`, 'g')) || [];
  assert.equal(matches.length, 1, `createInitialLocalState should initialize ${key} exactly once`);
}

const resizeBlock = html.slice(
  html.indexOf('resize() {'),
  html.indexOf('setupControls() {')
);
assert.match(resizeBlock, /Math\.max\(GAME_CONFIG\.MIN_CANVAS_WIDTH, container\.clientWidth\)/, 'embedded resize should keep a playable minimum canvas width');
assert.match(resizeBlock, /Math\.max\(GAME_CONFIG\.MIN_CANVAS_WIDTH, window\.innerWidth\)/, 'standalone resize should keep a playable minimum canvas width');
assert.match(resizeBlock, /Math\.max\(GAME_CONFIG\.MIN_CANVAS_HEIGHT, window\.innerHeight\)/, 'standalone resize should keep a playable minimum canvas height');

const startBlock = html.slice(
  html.indexOf('start() {'),
  html.indexOf('this.updateHUD();', html.indexOf('start() {'))
);
assert.match(startBlock, /this\.resize\(\)/, 'start should refresh canvas dimensions before spawning the player');
assert.match(startBlock, /this\.state\.local\s*=\s*this\.createInitialLocalState\(/, 'start should reset through createInitialLocalState');
assert.doesNotMatch(startBlock, /this\.state\.local\s*=\s*\{/, 'start should not duplicate the local-state object literal');
assert.match(startBlock, /keys:\s*this\.state\.local\.keys/, 'start should preserve the live keyboard state object across restart');
assert.match(startBlock, /enemyAmount:\s*document\.getElementById\('enemyAmount'\)\?\.value \|\| 2/, 'start should preserve the enemy amount fader value');
assert.match(startBlock, /enemyPower:\s*document\.getElementById\('enemyPower'\)\?\.value \|\| 2/, 'start should preserve the enemy power fader value');

const updateBlock = html.slice(
  html.indexOf('update() {'),
  html.indexOf('// Turrets decay over time')
);
assert.match(updateBlock, /s\.enemyProjectiles\s*=\s*s\.enemyProjectiles\.filter/, 'update should filter initialized enemy projectiles');

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
assert.match(html, /const DEFAULT_MULTIPLAYER = true;/, 'shooter should default to multiplayer mode');
assert.match(html, /if \(DEFAULT_MULTIPLAYER \|\| urlParams\.get\('multiplayer'\) === 'true'\)/, 'startup should auto-enable multiplayer by default');
assert.match(html, /if \(!game\.multiplayer\) game\.toggleMultiplayer\(\)/, 'startup multiplayer enable should be idempotent');

console.log('shooter implementation smoke checks passed');
