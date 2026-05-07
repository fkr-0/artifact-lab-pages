import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const portal = readFileSync(new URL('../app-hub/v10-portal-enhanced.html', import.meta.url), 'utf8');
const bomberman = readFileSync(new URL('../app-hub/bomberman.html', import.meta.url), 'utf8');

assert.match(portal, /id:'bomberman'/, 'v10 app list includes Bomberman');
assert.match(portal, /function renderBomberman\(/, 'v10 portal renders Bomberman launcher');
assert.match(portal, /function createBombermanPanel\(/, 'v10 portal can create Bomberman panels');
assert.match(portal, /bombermanInlineBtn/, 'inline launch button exists');
assert.match(portal, /bombermanFloatBtn/, 'floating launch button exists');
assert.match(portal, /bombermanFullscreenBtn/, 'fullscreen launch button exists');
assert.match(portal, /bombermanTabBtn/, 'new window or tab launch button exists');
assert.match(portal, /join-bomberman/, 'peer context menu includes Bomberman join action');
assert.match(portal, /presence\.app === 'bomberman'/, 'peer presence exposes Bomberman sessions');
assert.match(portal, /targetPeerId/, 'join feature forwards target peer id into Bomberman URL');
assert.match(portal, /lib\/ui\/floating-panels\.js/, 'v10 portal uses shared Floating Panels UI library');
assert.match(portal, /lib\/peernet\/peernet-lib\.js/, 'v10 portal uses canonical shared Peernet library');
assert.match(portal, /lib\/storage\/local-storage-manager\.js/, 'v10 portal loads shared storage library');
assert.match(portal, /lib\/secret-storage\/secret-storage\.js/, 'v10 portal loads shared secret-storage library');
assert.match(portal, /lib\/ui\/spaceship-ui\.js/, 'v10 portal loads shared spaceship UI library');
assert.match(portal, /lib\/artifact-motion\/artifact-motion\.css/, 'v10 portal loads artifact-motion CSS');

assert.match(bomberman, /PeernetLobby/, 'Bomberman page uses Peernet for one-session multiplayer');
assert.match(bomberman, /bomberman-state/, 'Bomberman broadcasts state snapshots');
assert.match(bomberman, /targetPeerId/, 'Bomberman accepts target peer joins');
assert.match(bomberman, /local-storage-manager\.js/, 'Bomberman page references storage library');
assert.match(bomberman, /secret-storage\.js/, 'Bomberman page references secret storage library');
assert.match(bomberman, /artifact-motion\.css/, 'Bomberman page references artifact-motion styling');
assert.match(bomberman, /spaceship-ui\.js/, 'Bomberman page references spaceship UI library');

console.log('bomberman v10 integration smoke checks passed');
