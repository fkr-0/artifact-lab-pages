import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BRICKBREAKER_SPRITE_PROMPTS,
  buildSpritePromptSheet,
  spritePromptById,
} from './brickbreaker-sprites.mjs';

test('sprite prompts cover every brickbreaker gameplay asset with clean constraints', () => {
  const requiredIds = ['paddle', 'ball', 'brick', 'armored-brick', 'laser-shot', 'powerup-capsule', 'particle'];
  assert.deepEqual(BRICKBREAKER_SPRITE_PROMPTS.map((prompt) => prompt.id), requiredIds);

  for (const prompt of BRICKBREAKER_SPRITE_PROMPTS) {
    assert.equal(prompt.style, 'clean pixel-sprite');
    assert.match(prompt.prompt, /transparent background/i);
    assert.match(prompt.prompt, /no text/i);
    assert.match(prompt.prompt, /single centered/i);
    assert.match(prompt.negativePrompt, /watermark/i);
    assert.match(prompt.negativePrompt, /blur/i);
  }
});

test('buildSpritePromptSheet returns copyable prompts and lookup keeps ids stable', () => {
  const sheet = buildSpritePromptSheet();

  assert.match(sheet, /# NEXUS BrickBreaker Clean Sprite Prompts/);
  assert.match(sheet, /## paddle/);
  assert.match(sheet, /Negative:/);
  assert.equal(spritePromptById('laser-shot').id, 'laser-shot');
  assert.equal(spritePromptById('missing'), null);
});
