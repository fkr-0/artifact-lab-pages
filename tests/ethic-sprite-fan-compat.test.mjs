import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const compat = fs.readFileSync('ethic-brawl/docs/sprite-fan/compat.yml', 'utf8');
const roster = fs.readFileSync('ethic-brawl/assets/sprites/roster/roster.sprite-spec.yml', 'utf8');
const spriteFanReq = fs.readFileSync('sprite-fan/reqs/animation.yml', 'utf8');

test('Ethic Brawl sprite roster declares Sprite Fan compatible 4x4 atlas contract', () => {
  for (const token of [
    'grid_vs_individual: atlas-grid',
    'transparent_background: true',
    'stable_frame_size: true',
    'max_prompt_grid:',
    'columns: 4',
    'rows: 4',
    'frames: 16',
    'core_4x4:',
    'extended_4x4:',
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

  assert.ok(roster.includes('core_4x4:'));
  assert.ok(roster.includes('extended_4x4:'));
  assert.ok(roster.includes('frame_count: 16'));

  for (const reqToken of [
    'max_prompt_grid: 4x4',
    '- grid.columns',
    '- animations.order',
    '- animations.anchor',
  ]) {
    assert.ok(spriteFanReq.includes(reqToken), `Sprite Fan req should still mention ${reqToken}`);
  }
});
