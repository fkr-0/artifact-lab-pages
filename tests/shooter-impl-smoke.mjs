import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, game, styles] = await Promise.all([
  readFile('hyperblast-shooter/index.html', 'utf8'),
  readFile('hyperblast-shooter/js/game.js', 'utf8'),
  readFile('hyperblast-shooter/styles.css', 'utf8'),
]);

assert.match(html, /src="\.\/js\/game\.js"/, 'HTML should load the extracted game runtime');
assert.match(html, /href="\.\/styles\.css"/, 'HTML should load the extracted style sheet');
assert.doesNotMatch(html, /class ShooterGame/, 'HTML should no longer embed the runtime class');
assert.match(html, /src="\.\/vendor\/peerjs\.min\.js"/, 'standalone build should vendor PeerJS');
assert.match(game, /import \{ PeernetLobby \} from '\.\.\/vendor\/peernet-lib\.js'/, 'runtime should use the vendored lobby adapter');

function block(startNeedle, endNeedle, from = 0) {
  const start = game.indexOf(startNeedle, from);
  assert.notEqual(start, -1, `missing block start: ${startNeedle}`);
  const end = game.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing block end after ${startNeedle}: ${endNeedle}`);
  return game.slice(start, end);
}

const constructorBlock = block('constructor() {', 'this.init();');
assert.match(constructorBlock, /local:\s*this\.createInitialLocalState\(\{ y: 0 \}\)/, 'constructor should initialize local state through createInitialLocalState');
assert.match(constructorBlock, /this\.stageStoryState = savedProgress\.stageStoryState/, 'constructor should hydrate stage story state');
assert.match(constructorBlock, /this\.versusState = createVersusState\(\)/, 'constructor should initialize deterministic versus state');
assert.match(constructorBlock, /this\.paused = false/, 'runtime should own an explicit pause state');

const initialStateBlock = block('createInitialLocalState(', 'loadProgress() {');
for (const key of [
  'player', 'ownedShips', 'ownedBoosters', 'ownedWeapons', 'bullets', 'enemies',
  'particles', 'turrets', 'allies', 'shields', 'enemyProjectiles', 'score', 'money',
  'enemyAmountMultiplier', 'enemyPowerMultiplier', 'stage', 'stageKills', 'stageGoal',
  'bossActive', 'bossDefeated', 'storyComplete', 'keys', 'spawnTimer', 'sessionMode',
  'worldProgress', 'questState', 'contractState', 'lastFrameAt', 'story', 'gameOver',
]) {
  assert.match(initialStateBlock, new RegExp(`\\b${key}:`), `createInitialLocalState should initialize ${key}`);
}
assert.match(initialStateBlock, /stageGoal: storyStageKillGoal/, 'story stage goals should come from the campaign model');

const combatBlock = block('isCombatActive() {', 'currentWorld() {');
assert.match(combatBlock, /this\.combatRunMode === 'story' \|\| isContractActive/, 'default story combat should run without requiring a patrol contract');
assert.match(combatBlock, /this\.versusState\.phase === 'active'/, 'versus combat should require an active duel');

const updateBlock = block('update() {', 'draw() {');
assert.match(updateBlock, /const pveCombatActive = combatActive && !\(this\.matchMode === ROOM_TYPES\.VS/, 'PVE spawns should be disabled during 1v1');
assert.match(updateBlock, /this\.spawnBoss\(\)/, 'story kill goals should expose a stage boss');
assert.match(updateBlock, /this\.completeActivePatrolContract\(\)/, 'patrol runs should retain bounded completion');
assert.match(updateBlock, /this\.updateVersusCombat\(Date\.now\(\)\)/, 'the live loop should evaluate network duel hits');

const advanceBlock = block('advanceStage() {', 'update() {');
assert.match(advanceBlock, /completeStoryStage/, 'boss clears should advance the serializable story campaign');
assert.match(advanceBlock, /STORY CAMPAIGN COMPLETE/, 'final-stage completion should have a campaign conclusion');
assert.match(advanceBlock, /this\.saveProgress\(\)/, 'story stage advancement should persist');

const loopBlock = block('loop() {', 'spendMoney(');
assert.match(
  loopBlock,
  /if \(!this\.state\.local\.gameOver && !this\.paused && this\.sessionMode !== 'shipyard'\) this\.update\(\)/,
  'pause, game-over, and shipyard states should halt simulation updates'
);
assert.match(loopBlock, /this\.draw\(\)/, 'pause should keep the rendered scene visible');

const destroyBlock = block('destroy() {', 'loop() {');
assert.match(destroyBlock, /this\.stopMultiplayer\(\)/, 'destroy should reuse network cleanup');
assert.match(game, /window\.addEventListener\('beforeunload', \(\) => game\.destroy\(\)\)/, 'window unload should destroy the runtime');

assert.match(styles, /prefers-reduced-motion/, 'visual style should respect reduced-motion preferences');
assert.match(styles, /:focus-visible/, 'visual style should expose keyboard focus');
assert.match(styles, /story-stage-card/, 'visual style should include campaign stage presentation');

console.log('shooter implementation smoke checks passed');
