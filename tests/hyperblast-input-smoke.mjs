import assert from 'node:assert/strict';
import {
  ACTION_LABELS,
  DEFAULT_KEY_BINDINGS,
  actionForKeyCode,
  keyBindingsSummary,
  normalizeKeyBindings,
  rebindKey,
} from '../hyperblast-shooter/js/input.js';

assert.deepEqual(ACTION_LABELS.moveRight, 'Move Right', 'input module should expose human-readable action labels');

{
  const bindings = normalizeKeyBindings();
  assert.ok(bindings.moveLeft.includes('ArrowLeft'), 'default bindings should keep ArrowLeft');
  assert.ok(bindings.moveLeft.includes('KeyA'), 'default bindings should keep A for left movement');
  assert.ok(bindings.moveRight.includes('ArrowRight'), 'default bindings should keep ArrowRight');
  assert.ok(bindings.moveRight.includes('KeyD'), 'default bindings should keep D for right movement');
  assert.equal(actionForKeyCode('ArrowRight', bindings), 'moveRight', 'ArrowRight should map to moveRight');
  assert.equal(actionForKeyCode('KeyD', bindings), 'moveRight', 'D should map to moveRight');
  assert.equal(actionForKeyCode('Space', bindings), 'fire', 'Space should map to fire');
}

{
  const rebound = rebindKey(DEFAULT_KEY_BINDINGS, 'moveRight', 'KeyL');
  assert.deepEqual(rebound.moveRight, ['KeyL'], 'rebinding should replace moveRight with the selected key');
  assert.equal(actionForKeyCode('KeyL', rebound), 'moveRight', 'custom L binding should drive right movement');
  assert.equal(actionForKeyCode('ArrowRight', rebound), null, 'old right key should be released after custom rebind');
  assert.equal(keyBindingsSummary(rebound).moveRight, 'L', 'summary should display readable key labels');
}

{
  const normalized = normalizeKeyBindings({ moveRight: [''], moveLeft: 'KeyJ', fire: ['Enter'] });
  assert.deepEqual(normalized.moveRight, DEFAULT_KEY_BINDINGS.moveRight, 'empty custom bindings should fall back to defaults');
  assert.deepEqual(normalized.moveLeft, ['KeyJ'], 'single string custom binding should normalize to an array');
  assert.deepEqual(normalized.fire, ['Enter'], 'custom fire binding should be retained');
}

console.log('hyperblast input binding smoke checks passed');
