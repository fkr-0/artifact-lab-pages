import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePorcelainZ, parseSubmoduleStatus } from '../src/inventory.mjs';

test('porcelain status keeps paths and two-character state', () => {
  assert.deepEqual(parsePorcelainZ(' M file.txt\0?? new file.txt\0'), [
    { status: ' M', path: 'file.txt' },
    { status: '??', path: 'new file.txt' },
  ]);
});

test('submodule status exposes pointer drift', () => {
  const records = parseSubmoduleStatus('+410fa46364e1efe6ccb9c33a8493f00604ffd6a8 badger-sprawl-runner (v1.2.0)\n 37783861b7681852b0605a891a2b831c4cde82de v11-peer-daw (v1.5.0)\n');
  assert.equal(records[0].state, 'pointer-drift');
  assert.equal(records[1].state, 'recorded');
});
