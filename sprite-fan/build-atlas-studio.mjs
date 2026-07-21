#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, 'src');
const shellPath = resolve(src, 'atlas-studio.html');
const cssPath = resolve(src, 'studio.css');
const jsPaths = [
  resolve(src, 'config-core.js'),
  resolve(src, 'ui-navigation.js'),
  resolve(src, 'workflow-core.js'),
  resolve(src, 'image-io.js'),
  resolve(src, 'pixel-analysis.js'),
  resolve(src, 'frame-operations.js'),
  resolve(src, 'spec-guide.js'),
  resolve(src, 'export-core.js'),
  resolve(src, 'gif-core.js'),
  resolve(src, 'studio.js'),
];
const outPath = resolve(here, 'atlas-studio.html');

const [shell, css, ...jsSources] = await Promise.all([
  readFile(shellPath, 'utf8'),
  readFile(cssPath, 'utf8'),
  ...jsPaths.map((path) => readFile(path, 'utf8')),
]);
const js = jsSources.join('\n\n');

assert.match(shell, /\{\{SPRITE_FAN_CSS\}\}/, 'source shell must contain {{SPRITE_FAN_CSS}}');
assert.match(shell, /\{\{SPRITE_FAN_JS\}\}/, 'source shell must contain {{SPRITE_FAN_JS}}');
assert.doesNotMatch(css, /<\/style>/i, 'CSS source must not contain </style>');
jsSources.forEach((source, index) => {
  assert.doesNotMatch(source, /<\/script>/i, `${jsPaths[index]} must not contain </script>`);
});

const html = shell
  .replace('{{SPRITE_FAN_CSS}}', css)
  .replace('{{SPRITE_FAN_JS}}', js);

await writeFile(outPath, html);
console.log(`built ${outPath}`);
