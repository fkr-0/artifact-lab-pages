import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const game = await readFile('hyperblast-shooter/js/game.js', 'utf8');

assert.match(game, /this\.urlParams = new URLSearchParams\(window\.location\.search\)/, 'shooter should centralize URL params');
assert.match(game, /this\.targetPeerId = this\.urlParams\.get\('targetPeerId'\)/, 'shooter should consume targetPeerId for joins');
assert.match(game, /this\.matchMode = this\.normalizeMatchMode/, 'shooter should normalize requested multiplayer modes');
assert.match(game, /this\.spectateMode = this\.urlParams\.get\('spectate'\) === 'true' \|\| this\.urlParams\.get\('observe'\) === 'true'/, 'shooter should support spectate/observe mode');

function block(startNeedle, endNeedle, from = 0) {
  const start = game.indexOf(startNeedle, from);
  assert.notEqual(start, -1, `missing block start: ${startNeedle}`);
  const end = game.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing block end after ${startNeedle}: ${endNeedle}`);
  return game.slice(start, end);
}

const toggleBlock = block('toggleMultiplayer() {', 'markMultiplayerUnavailable(');
assert.match(toggleBlock, /this\.multiplayer\s*=\s*!this\.multiplayer/, 'toggleMultiplayer should flip multiplayer mode');
assert.match(toggleBlock, /this\.startMultiplayer\(\)/, 'toggleMultiplayer should connect when enabled');
assert.match(toggleBlock, /this\.stopMultiplayer\(\)/, 'toggleMultiplayer should disconnect when disabled');

const startBlock = block('async startMultiplayer() {', 'stopMultiplayer() {');
assert.match(startBlock, /new PeernetLobby\(SHOOTER_LOBBY_ID/, 'runtime should use the production PeernetLobby adapter');
assert.match(startBlock, /typeof window\.Peer !== 'function'/, 'runtime should degrade if PeerJS is unavailable');
for (const eventName of ['status', 'peers', 'data']) {
  assert.match(startBlock, new RegExp(`this\\.lobby\\.addEventListener\\('${eventName}'`), `runtime should listen for ${eventName}`);
}
assert.match(startBlock, /this\.localPeerId = await this\.lobby\.connect\(this\.username\)/, 'runtime should retain the real PeerJS peer id');
assert.match(startBlock, /this\.syncVersusOpponent\(this\.lobby\.peers\)/, 'runtime should negotiate a 1v1 opponent through lobby peers');
assert.match(startBlock, /this\.networkUpdateInterval\s*=\s*setInterval/, 'playable clients should broadcast state periodically');
assert.match(startBlock, /if \(!this\.spectateMode\)/, 'spectators should not broadcast playable state');

const stateBlock = block('broadcastGameState() {', 'broadcastPresence(playing = true) {');
assert.match(stateBlock, /type: 'shooter-state'/, 'network state should use the shooter-state envelope');
for (const field of ['x', 'y', 'lives']) {
  assert.match(
    stateBlock,
    new RegExp(`\\b${field}: state\\.player\\.${field}`),
    `state should carry player ${field}`
  );
}
assert.match(stateBlock, /id: b\.id/, 'state should carry stable projectile IDs');
assert.match(stateBlock, /versusPublicSnapshot/, 'state should carry serializable duel state');

const messageBlock = block('handleNetworkMessage({ from, data }) {', 'updateRemotePlayer(peerId, payload) {');
for (const type of ['shooter-state', 'shooter-presence', 'shooter-join-request', 'shooter-vs-hit', 'shooter-vs-rematch']) {
  assert.match(messageBlock, new RegExp(`case '${type}'`), `network router should handle ${type}`);
}

const versusBlock = block('syncVersusOpponent(', 'broadcastGameState() {');
assert.match(versusBlock, /beginVersusRound/, 'peer discovery should start a deterministic duel');
assert.match(versusBlock, /positionVersusPlayer/, 'duel participants should receive opposing spawn positions');
assert.match(versusBlock, /updateVersusCombat/, 'runtime should detect remote projectile hits');
assert.match(versusBlock, /shooter-vs-hit/, 'victim-authoritative hit results should traverse PeerJS');
assert.match(versusBlock, /validOpponentReport/, 'incoming duel results should be participant-validated');
assert.match(versusBlock, /shooter-vs-rematch/, 'duels should support network rematches');

const stopBlock = block('stopMultiplayer() {', 'peerIdsFromDetail(');
assert.match(stopBlock, /clearInterval\(this\.networkUpdateInterval\)/, 'disconnect should stop state broadcasts');
assert.match(stopBlock, /this\.state\.remote\.clear\(\)/, 'disconnect should remove remote players');
assert.match(stopBlock, /this\.lobby\.destroy\?\.\(\)/, 'disconnect should destroy the PeerJS lobby');
assert.match(stopBlock, /this\.versusState = createVersusState\(\)/, 'disconnect should reset duel state');

const startupBlock = game.slice(game.indexOf('// Initialize game'));
assert.match(startupBlock, /const multiplayerRequested =/, 'startup should derive rather than hard-code network behavior');
assert.match(startupBlock, /urlParams\.get\('multiplayer'\) === 'true'/, 'explicit multiplayer links should connect');
assert.match(startupBlock, /game\.ui\.getSettings\(\)\.autoMultiplayer/, 'direct launches should honor the stored auto-connect preference');
assert.match(startupBlock, /if \(!game\.multiplayer\) game\.toggleMultiplayer\(\)/, 'startup auto-connect should be idempotent');

console.log('shooter multiplayer smoke checks passed');
