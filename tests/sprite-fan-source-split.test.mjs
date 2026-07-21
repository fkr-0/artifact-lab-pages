import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const [standalone, shell, css, configCore, uiNavigation, workflowCore, imageIo, pixelAnalysis, frameOperations, specGuide, exportCore, gifCore, studio, readme] = await Promise.all([
  read('sprite-fan/atlas-studio.html'),
  read('sprite-fan/src/atlas-studio.html'),
  read('sprite-fan/src/studio.css'),
  read('sprite-fan/src/config-core.js'),
  read('sprite-fan/src/ui-navigation.js'),
  read('sprite-fan/src/workflow-core.js'),
  read('sprite-fan/src/image-io.js'),
  read('sprite-fan/src/pixel-analysis.js'),
  read('sprite-fan/src/frame-operations.js'),
  read('sprite-fan/src/spec-guide.js'),
  read('sprite-fan/src/export-core.js'),
  read('sprite-fan/src/gif-core.js'),
  read('sprite-fan/src/studio.js'),
  read('sprite-fan/src/README.md'),
]);
const js = [configCore, uiNavigation, workflowCore, imageIo, pixelAnalysis, frameOperations, specGuide, exportCore, gifCore, studio].join('\n\n');

assert.match(shell, /\{\{SPRITE_FAN_CSS\}\}/, 'source shell should have a CSS insertion marker');
assert.match(shell, /\{\{SPRITE_FAN_JS\}\}/, 'source shell should have a JS insertion marker');
assert.equal(
  shell.replace('{{SPRITE_FAN_CSS}}', css).replace('{{SPRITE_FAN_JS}}', js),
  standalone,
  'split source should rebuild atlas-studio.html byte-for-byte',
);
assert.match(readme, /pnpm run build:sprite-fan/);
assert.match(readme, /pnpm run health:sprite-fan/);
assert.match(readme, /config-core\.js/);
assert.match(readme, /ui-navigation\.js/);
assert.match(readme, /workflow-core\.js/);
assert.match(readme, /image-io\.js/);
assert.match(readme, /pixel-analysis\.js/);
assert.match(readme, /frame-operations\.js/);
assert.match(readme, /spec-guide\.js/);
assert.match(readme, /export-core\.js/);
assert.match(readme, /gif-core\.js/);
assert.match(standalone, /id="layout-help"/);
assert.match(standalone, /double-click a handle/i);

console.log('sprite fan source split contract OK');
