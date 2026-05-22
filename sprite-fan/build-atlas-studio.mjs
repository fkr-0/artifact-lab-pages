#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, 'src');
const shellPath = resolve(src, 'atlas-studio.html');
const cssPath = resolve(src, 'studio.css');
const jsPath = resolve(src, 'studio.js');
const outPath = resolve(here, 'atlas-studio.html');

const [shell, css, js] = await Promise.all([
  readFile(shellPath, 'utf8'),
  readFile(cssPath, 'utf8'),
  readFile(jsPath, 'utf8'),
]);

assert.match(shell, /\{\{SPRITE_FAN_CSS\}\}/, 'source shell must contain {{SPRITE_FAN_CSS}}');
assert.match(shell, /\{\{SPRITE_FAN_JS\}\}/, 'source shell must contain {{SPRITE_FAN_JS}}');
assert.doesNotMatch(css, /<\/style>/i, 'CSS source must not contain </style>');
assert.doesNotMatch(js, /<\/script>/i, 'JS source must not contain </script>');

const html = shell
  .replace('{{SPRITE_FAN_CSS}}', css)
  .replace('{{SPRITE_FAN_JS}}', js);

await writeFile(outPath, html);
console.log(`built ${outPath}`);
