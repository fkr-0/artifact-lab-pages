import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { dirname, join, normalize } from 'node:path';

const modulePath = 'v11-peer-daw/src/modules/peer-bridge.js';
const source = await readFile(modulePath, 'utf8');
const importLine = source.split('\n').find((line) => line.includes('PeernetLobby') && line.includes('from'));
assert.ok(importLine, 'PeerBridgeModule should import PeernetLobby explicitly');
const imported = importLine.split('from')[1].trim().replace(/['";]/g, '');
const importedPath = normalize(join(dirname(modulePath), imported));
await stat(importedPath);
assert.equal(importedPath, 'v11-peer-daw/vendor/peernet-lib.js');

const app = await readFile('v11-peer-daw/src/app.js', 'utf8');
assert.match(app, /this\.urlParams = new URLSearchParams\(window\.location\.search\)/, 'v11 DAW should read launch URL params');
assert.match(app, /this\.targetPeerId = this\.urlParams\.get\('targetPeerId'\)/, 'v11 DAW should consume targetPeerId for hub joins');
assert.match(app, /this\.spectateMode = this\.urlParams\.get\('spectate'\) === 'true' \|\| this\.urlParams\.get\('observe'\) === 'true'/, 'v11 DAW should support observe mode');
assert.match(app, /autoJoinFromUrl\(\)/, 'v11 DAW should auto-join peer sessions from URL params');
assert.match(app, /this\.peernet\.start\(\{[\s\S]*?username,[\s\S]*?targetPeerId: this\.targetPeerId,[\s\S]*?spectate: this\.spectateMode,[\s\S]*?sessionCode: this\.sessionCode,?[\s\S]*?\}\)/, 'v11 DAW should pass hub join params into peernet stack');
