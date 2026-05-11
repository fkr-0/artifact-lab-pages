import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { themes } from '../app-hub-v11/lib/themes.js';
import { normalizeProfile } from '../app-hub-v11/lib/profile.js';

const v11 = await readFile('app-hub-v11/index.html', 'utf8');
const v8Editor = await readFile('app-hub/collab-editor.html', 'utf8');
const v9 = await readFile('app-hub/v9-portal.html', 'utf8');
const v10 = await readFile('app-hub/v10-portal.html', 'utf8');
const v10Enhanced = await readFile('app-hub/v10-portal-enhanced.html', 'utf8');

for (const [label, expectedHref] of [
  ['v8', '../app-hub/collab-editor.html'],
  ['v9', '../app-hub/v9-portal.html'],
  ['v10 classic', '../app-hub/v10-portal.html'],
  ['v10 enhanced', '../app-hub/v10-portal-enhanced.html'],
]) {
  assert.match(v11, new RegExp(expectedHref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `v11 should link to ${label}`);
}

for (const [label, html] of [
  ['v8 collab editor', v8Editor],
  ['v9 portal', v9],
  ['v10 portal', v10],
  ['v10 enhanced portal', v10Enhanced],
]) {
  assert.match(html, /app-hub-v11\/index\.html/, `${label} should link back to v11`);
}

assert.deepEqual(
  themes.map((theme) => theme.id),
  ['nexus', 'default', 'synthwave', 'cyberpunk', 'retro8bit', 'midnight', 'vaporwave', 'neon-rust', 'matrix'],
  'v11 should include v9/v10 theme ids plus its nexus shell theme'
);

const profile = normalizeProfile({ username: 'Flo', status: 'coding', note: 'porting v11', sharedLayer: true, allowIncomingSaveStates: false });
assert.equal(profile.displayName, 'Flo');
assert.equal(profile.status, 'coding');
assert.equal(profile.note, 'porting v11');
assert.equal(profile.sharedLayer, true);
assert.equal(profile.allowIncomingSaveStates, false);

for (const requiredId of [
  'profileStatus',
  'profileNote',
  'profileSharedLayer',
  'profileAllowIncomingSaveStates',
  'lobbyChatLog',
  'lobbyChatInput',
  'sendLobbyChat',
  'clearLobbyChat',
]) {
  assert.match(v11, new RegExp(`id=["']${requiredId}["']`), `v11 settings drawer should expose ${requiredId}`);
}

assert.match(v11, /BroadcastChannel\('app-hub-v11:lobby-chat'\)/, 'v11 lobby chat should support same-browser chat sync');
