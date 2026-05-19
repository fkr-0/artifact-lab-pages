import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile('app-hub/shooter.html', 'utf8');
assert.match(html, /this\.urlParams = new URLSearchParams\(window\.location\.search\)/, 'shooter should centralize URL params');
assert.match(html, /this\.targetPeerId = this\.urlParams\.get\('targetPeerId'\)/, 'shooter should consume targetPeerId for joins');
assert.match(html, /this\.sessionMode = this\.urlParams\.get\('mode'\) \|\| 'stage'/, 'shooter should consume stage/vs mode');
assert.match(html, /this\.spectateMode = this\.urlParams\.get\('spectate'\) === 'true' \|\| this\.urlParams\.get\('observe'\) === 'true'/, 'shooter should support spectate/observe mode');

function block(startNeedle, endNeedle, from = 0) {
  const start = html.indexOf(startNeedle, from);
  assert.notEqual(start, -1, `missing block start: ${startNeedle}`);
  const end = html.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing block end after ${startNeedle}: ${endNeedle}`);
  return html.slice(start, end);
}

const toggleBlock = block('toggleMultiplayer() {', 'async startMultiplayer() {');
assert.match(toggleBlock, /this\.multiplayer\s*=\s*!this\.multiplayer/, 'toggleMultiplayer should flip multiplayer mode');
assert.match(toggleBlock, /btn\.textContent\s*=\s*'Multiplayer: ON'/, 'toggleMultiplayer should label ON mode');
assert.match(toggleBlock, /btn\.classList\.add\('active'\)/, 'toggleMultiplayer should style ON mode as active');
assert.match(toggleBlock, /this\.startMultiplayer\(\)/, 'toggleMultiplayer should connect when enabling multiplayer');
assert.match(toggleBlock, /btn\.textContent\s*=\s*'Multiplayer: OFF'/, 'toggleMultiplayer should label OFF mode');
assert.match(toggleBlock, /btn\.classList\.remove\('active'\)/, 'toggleMultiplayer should clear active style when disabling');
assert.match(toggleBlock, /this\.stopMultiplayer\(\)/, 'toggleMultiplayer should disconnect when disabling multiplayer');

const startMultiplayerBlock = block('async startMultiplayer() {', 'stopMultiplayer() {');
assert.match(startMultiplayerBlock, /new PeernetLobby\(SHOOTER_LOBBY_ID, \{\s*storageKey: 'shooter-lobby',\s*debug: false\s*\}\)/s, 'startMultiplayer should connect to the shooter lobby');
for (const eventName of ['status', 'peers', 'data']) {
  assert.match(startMultiplayerBlock, new RegExp(`this\\.lobby\\.addEventListener\\('${eventName}'`), `startMultiplayer should listen for ${eventName} events`);
}
assert.match(startMultiplayerBlock, /await this\.lobby\.connect\(this\.username\)/, 'startMultiplayer should connect with the local username');
assert.match(startMultiplayerBlock, /this\.lobby\.send\?\.\(this\.targetPeerId/, 'startMultiplayer should request state from the target peer when joining');
assert.match(startMultiplayerBlock, /type: 'shooter-join-request'/, 'startMultiplayer should emit explicit shooter join requests');
assert.match(startMultiplayerBlock, /if \(!this\.spectateMode\) \{\s*this\.networkUpdateInterval\s*=\s*setInterval/s, 'spectate mode should not broadcast a playable state loop');
assert.match(startMultiplayerBlock, /this\.networkUpdateInterval\s*=\s*setInterval\(\(\) => \{\s*this\.broadcastGameState\(\);\s*\}, GAME_CONFIG\.NETWORK_UPDATE_INTERVAL\)/s, 'startMultiplayer should broadcast state at the configured 20Hz interval');
assert.match(startMultiplayerBlock, /this\.broadcastPresence\(\)/, 'startMultiplayer should announce local presence after connecting');
assert.match(startMultiplayerBlock, /this\.toggleMultiplayer\(\)/, 'startMultiplayer should roll back mode on connection failure');

const stopMultiplayerBlock = block('stopMultiplayer() {', 'broadcastGameState() {');
assert.match(stopMultiplayerBlock, /clearInterval\(this\.networkUpdateInterval\)/, 'stopMultiplayer should stop periodic state broadcasts');
assert.match(stopMultiplayerBlock, /this\.networkUpdateInterval\s*=\s*null/, 'stopMultiplayer should clear the interval handle');
assert.match(stopMultiplayerBlock, /this\.state\.remote\.clear\(\)/, 'stopMultiplayer should remove all remote players');
assert.match(stopMultiplayerBlock, /this\.broadcastPresence\(false\)/, 'stopMultiplayer should broadcast leaving presence before disconnect');
assert.match(stopMultiplayerBlock, /this\.lobby\.destroy\?\.\(\)/, 'stopMultiplayer should destroy the lobby safely');
assert.match(stopMultiplayerBlock, /this\.lobby\s*=\s*null/, 'stopMultiplayer should clear the lobby reference');

const broadcastStateBlock = block('broadcastGameState() {', 'broadcastPresence(playing = true) {');
assert.match(broadcastStateBlock, /if \(!this\.lobby \|\| !this\.multiplayer\) return/, 'broadcastGameState should be inactive outside multiplayer mode');
assert.match(broadcastStateBlock, /type: 'shooter-state'/, 'broadcastGameState should publish shooter-state messages');
assert.match(broadcastStateBlock, /player: \{ x: state\.player\.x, y: state\.player\.y \}/, 'broadcastGameState should include local player coordinates');
assert.match(broadcastStateBlock, /bullets: state\.bullets\.map/, 'broadcastGameState should include local bullets');

const broadcastPresenceBlock = block('broadcastPresence(playing = true) {', 'handleNetworkMessage({ from, data }) {');
assert.match(broadcastPresenceBlock, /if \(!this\.lobby \|\| !this\.multiplayer\) return/, 'broadcastPresence should be inactive outside multiplayer mode');
assert.match(broadcastPresenceBlock, /type: 'shooter-presence'/, 'broadcastPresence should publish shooter-presence messages');
assert.match(broadcastPresenceBlock, /playing: playing/, 'broadcastPresence should include current playing mode');
assert.match(broadcastPresenceBlock, /observing: this\.spectateMode/, 'broadcastPresence should disclose observe mode');
assert.match(broadcastPresenceBlock, /targetPeerId: this\.targetPeerId/, 'broadcastPresence should include target peer for joins');
assert.match(broadcastPresenceBlock, /mode: this\.sessionMode/, 'broadcastPresence should include selected session mode');
assert.match(broadcastPresenceBlock, /score: this\.state\.local\.score/, 'broadcastPresence should include local score');
assert.match(broadcastPresenceBlock, /color: this\.playerColor/, 'broadcastPresence should include local color');

const handleNetworkBlock = block('handleNetworkMessage({ from, data }) {', 'updateRemotePlayer(peerId, payload) {');
assert.match(handleNetworkBlock, /if \(!data \|\| !data\.type\) return/, 'handleNetworkMessage should ignore malformed data');
assert.match(handleNetworkBlock, /case 'shooter-state':\s*this\.updateRemotePlayer\(from, data\.payload\);\s*break;/s, 'handleNetworkMessage should route state messages');
assert.match(handleNetworkBlock, /case 'shooter-presence':\s*this\.updateRemotePresence\(from, data\.payload\);\s*break;/s, 'handleNetworkMessage should route presence messages');
assert.match(handleNetworkBlock, /case 'shooter-join-request':\s*if \(!this\.spectateMode\) this\.broadcastGameState\(\);\s*break;/s, 'handleNetworkMessage should answer join requests from observing peers');

const updateRemotePresenceBlock = block('updateRemotePresence(peerId, payload) {', 'renderPlayerList(peers) {');
assert.match(updateRemotePresenceBlock, /if \(payload\?\.playing === false\)/, 'updateRemotePresence should handle leaving/offline mode');
assert.match(updateRemotePresenceBlock, /this\.state\.remote\.delete\(peerId\)/, 'updateRemotePresence should remove peers that leave');
assert.match(updateRemotePresenceBlock, /this\.updateMultiplayerPanel\(\)/, 'updateRemotePresence should refresh the multiplayer panel');

const panelBlock = block('updateMultiplayerPanel() {', 'showNotification(text) {');
assert.match(panelBlock, /if \(!this\.multiplayer \|\| this\.state\.remote\.size === 0\)/, 'panel should hide when multiplayer is off or no remotes exist');
assert.match(panelBlock, /panel\.classList\.remove\('visible'\)/, 'panel should hide in inactive multiplayer modes');
assert.match(panelBlock, /panel\.classList\.add\('visible'\)/, 'panel should show when remote players exist');

const startupBlock = html.slice(html.indexOf('// Initialize game'));
assert.match(startupBlock, /const DEFAULT_MULTIPLAYER = true;/, 'startup should default multiplayer mode on');
assert.match(startupBlock, /if \(DEFAULT_MULTIPLAYER \|\| urlParams\.get\('multiplayer'\) === 'true'\)/, 'startup should enable multiplayer by default or explicit query');
assert.match(startupBlock, /if \(!game\.multiplayer\) game\.toggleMultiplayer\(\)/, 'startup auto-enable should not double-toggle multiplayer off');

console.log('shooter multiplayer smoke checks passed');
