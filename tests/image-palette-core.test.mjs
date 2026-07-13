import assert from 'node:assert/strict';
import test from 'node:test';

import {
  colorDistance,
  contrastRatio,
  evaluateRolePalette,
  extractPaletteFromPixels,
  normalizeHex,
  pickTastefulRoles,
  rolePaletteCss,
} from '../lib/ui/image-palette.mjs';

function pixelsFrom(colors) {
  return new Uint8ClampedArray(
    colors.flatMap(([r, g, b, a = 255]) => [r, g, b, a]),
  );
}

test('image palette extraction is deterministic, alpha-aware, and diverse', () => {
  const pixels = pixelsFrom([
    ...Array.from({ length: 8 }, () => [242, 38, 52, 255]),
    ...Array.from({ length: 6 }, () => [32, 92, 238, 255]),
    ...Array.from({ length: 4 }, () => [245, 245, 245, 255]),
    ...Array.from({ length: 3 }, () => [8, 10, 18, 255]),
    ...Array.from({ length: 20 }, () => [0, 255, 0, 0]),
  ]);
  const first = extractPaletteFromPixels(pixels, { maxColors: 6, minDistance: 36 });
  const second = extractPaletteFromPixels(pixels, { maxColors: 6, minDistance: 36 });

  assert.deepEqual(first, second);
  assert.ok(first.length >= 3, 'should preserve multiple visible color families');
  assert.ok(
    first.every((color, index) =>
      first.slice(index + 1).every((other) => colorDistance(color, other) >= 36),
    ),
    'selected colors should remain perceptually separated',
  );
});

test('semantic palette roles include readable text and exportable CSS', () => {
  const roles = pickTastefulRoles(['#ef3340', '#2463eb', '#f4f4f4', '#090b12']);
  const evaluation = evaluateRolePalette(roles);

  assert.deepEqual(Object.keys(roles), [
    'primary',
    'secondary',
    'accent',
    'dark-font',
    'light-font',
  ]);
  assert.ok(evaluation.metrics.lightOnDark >= 4.5);
  assert.equal(evaluation.roles.primary, normalizeHex(roles.primary));
  assert.ok(contrastRatio(evaluation.roles['light-font'], evaluation.roles['dark-font']) >= 4.5);
  assert.match(rolePaletteCss(roles), /--generated-primary:/);
  assert.match(rolePaletteCss(roles), /--generated-light-font:/);
});

test('palette evaluation surfaces low-contrast role warnings', () => {
  const evaluation = evaluateRolePalette({
    primary: '#777777',
    secondary: '#787878',
    accent: '#797979',
    'dark-font': '#777777',
    'light-font': '#888888',
  });

  assert.equal(evaluation.ok, false);
  assert.ok(evaluation.warnings.some((warning) => warning.includes('contrast')));
  assert.ok(evaluation.warnings.some((warning) => warning.includes('similar')));
});
