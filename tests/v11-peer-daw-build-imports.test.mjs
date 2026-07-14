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
const projectSync = await readFile('v11-peer-daw/src/core/project-sync.js', 'utf8');
const collaborationEngine = await readFile(
  'v11-peer-daw/src/core/collaboration-engine.js',
  'utf8'
);
const projectOperations = await readFile(
  'v11-peer-daw/src/core/project-operations.js',
  'utf8'
);
const operationJournal = await readFile(
  'v11-peer-daw/src/core/operation-journal.js',
  'utf8'
);
assert.match(app, /this\.urlParams = new URLSearchParams\(window\.location\.search\)/, 'v11 DAW should read launch URL params');
assert.match(app, /this\.targetPeerId = this\.urlParams\.get\('targetPeerId'\)/, 'v11 DAW should consume targetPeerId for hub joins');
assert.match(app, /this\.spectateMode\s*=\s*this\.urlParams\.get\('spectate'\) === 'true' \|\| this\.urlParams\.get\('observe'\) === 'true'/, 'v11 DAW should support observe mode');
assert.match(app, /autoJoinFromUrl\(\)/, 'v11 DAW should auto-join peer sessions from URL params');
assert.match(app, /const profile = \{[\s\S]*?username,[\s\S]*?targetPeerId: this\.targetPeerId,[\s\S]*?spectate: this\.spectateMode,[\s\S]*?sessionCode: this\.defaultSessionCode,?[\s\S]*?\}/, 'v11 DAW should assemble hub join params once');
assert.match(app, /this\.peernet\.start\(profile\)/, 'v11 DAW should start the peernet stack from the shared session profile');
const autoJoinBody = app.slice(app.indexOf('  autoJoinFromUrl() {'), app.indexOf('  bindPeernetStack() {'));
assert.doesNotMatch(autoJoinBody, /this\.peernet\.start\(/, 'URL auto-join should not start the peernet stack a second time');
assert.match(app, /PROJECT_SYNC_CHANNEL/, 'v11 DAW should bind its project protocol to Peernet');
assert.match(app, /this\.peernet\.onMessage\(PROJECT_SYNC_CHANNEL/, 'v11 DAW should receive remote project messages');
assert.match(app, /this\.peernet\.send\(PROJECT_SYNC_CHANNEL/, 'v11 DAW should publish remote project messages');
assert.match(projectSync, /project-request/, 'project sync should support snapshot requests');
assert.match(projectSync, /project-snapshot/, 'project sync should support snapshot responses');
assert.match(projectSync, /project-update/, 'project sync should support live updates');
assert.match(projectSync, /project-ack/, 'project sync should support acknowledgements');
assert.match(app, /new CollaborationEngine/, 'v11 DAW should initialize the operation engine');
assert.match(app, /publishCollaborativeOperation/, 'v11 DAW should publish typed domain operations');
assert.match(app, /applyCollaborationOperation/, 'v11 DAW should apply typed operations incrementally');
assert.match(collaborationEngine, /COLLABORATION_CAPABILITY/, 'collaboration should negotiate operation capability');
assert.match(collaborationEngine, /replayPending/, 'collaboration should replay persisted pending work');
assert.match(projectOperations, /COLLABORATION_PROTOCOL = 2/, 'operation protocol should be version 2');
assert.match(projectOperations, /OPERATION_MESSAGE_TYPE = 'project-operation'/, 'operation protocol should expose typed messages');
assert.match(operationJournal, /class OperationJournal/, 'operation journal should be independently testable');
assert.match(operationJournal, /dueOperations/, 'operation journal should expose retry scheduling');
