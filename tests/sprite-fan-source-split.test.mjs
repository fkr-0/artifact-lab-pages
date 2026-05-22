import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const [standalone, shell, css, js, readme] = await Promise.all([
  read('sprite-fan/atlas-studio.html'),
  read('sprite-fan/src/atlas-studio.html'),
  read('sprite-fan/src/studio.css'),
  read('sprite-fan/src/studio.js'),
  read('sprite-fan/src/README.md'),
]);

assert.match(shell, /\{\{SPRITE_FAN_CSS\}\}/, 'source shell should have a CSS insertion marker');
assert.match(shell, /\{\{SPRITE_FAN_JS\}\}/, 'source shell should have a JS insertion marker');
assert.equal(
  shell.replace('{{SPRITE_FAN_CSS}}', css).replace('{{SPRITE_FAN_JS}}', js),
  standalone,
  'split source should rebuild atlas-studio.html byte-for-byte',
);
assert.match(readme, /pnpm run build:sprite-fan/);
assert.match(readme, /pnpm run health:sprite-fan/);
assert.match(standalone, /id="layout-help"/);
assert.match(standalone, /double-click a handle/i);

console.log('sprite fan source split contract OK');
