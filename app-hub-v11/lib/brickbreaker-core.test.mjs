import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyInput,
  applySnapshot,
  createInitialState,
  createSnapshot,
  electHost,
  hashState,
  syncCoopPlayers,
} from './brickbreaker-core.mjs';

test('electHost chooses the stable lowest coop player id', () => {
  assert.equal(electHost(['peer-z', 'peer-a', 'peer-m']), 'peer-a');
});

test('syncCoopPlayers keeps one bottom paddle per coop player', () => {
  const state = createInitialState({ players: ['peer-a'] });
  syncCoopPlayers(state, ['peer-a', 'peer-b', 'peer-c']);

  assert.deepEqual(Object.keys(state.players), ['peer-a', 'peer-b', 'peer-c']);
  assert.equal(new Set(Object.values(state.players).map((p) => p.y)).size, 1);
  assert.ok(Object.values(state.players).every((p) => p.y === state.height - 42));
});

test('snapshot restore preserves authoritative coop game state and checksum', () => {
  const state = createInitialState({ players: ['peer-a', 'peer-b'] });
  applyInput(state, 'peer-b', { dx: 25, launch: true });
  const snapshot = createSnapshot(state, { hostId: 'peer-a' });

  const restored = createInitialState({ players: ['peer-x'] });
  applySnapshot(restored, snapshot);

  assert.equal(restored.authority.hostId, 'peer-a');
  assert.deepEqual(Object.keys(restored.players), ['peer-a', 'peer-b']);
  assert.equal(hashState(restored), snapshot.checksum);
});
