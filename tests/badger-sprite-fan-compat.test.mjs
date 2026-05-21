import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const compat = fs.readFileSync('badger-sprawl-runner/docs/sprite-fan/compat.yml', 'utf8');
const badgerAnimation = fs.readFileSync('badger-sprawl-runner/animation.yml', 'utf8');
const spriteFanReq = fs.readFileSync('sprite-fan/reqs/animation.yml', 'utf8');

test('Badger sprite generation declares Sprite Fan compatible atlas contract', () => {
  for (const token of [
    'grid_vs_individual: atlas-grid',
    'transparent_background: true',
    'stable_frame_size: true',
    'max_prompt_grid:',
    'columns: 4',
    'rows: 4',
    'frames: 16',
    'grid:',
    'animations:',
    'order',
    'loop',
    'anchor',
    'events',
    'hitboxes',
    'hurtboxes',
    'sheetRect',
    'hash',
  ]) {
    assert.ok(compat.includes(token), `compat overlay should include ${token}`);
  }

  for (const reqToken of [
    'max_prompt_grid: 4x4',
    '- grid.columns',
    '- animations.order',
    '- animations.anchor',
  ]) {
    assert.ok(spriteFanReq.includes(reqToken), `Sprite Fan req should still mention ${reqToken}`);
  }

  assert.ok(badgerAnimation.includes('runtime_contracts_to_converge'));
  assert.ok(badgerAnimation.includes('sprite_sheet_contract'));
  assert.ok(badgerAnimation.includes('metadata_fields'));
});
