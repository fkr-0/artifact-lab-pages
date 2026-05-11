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
