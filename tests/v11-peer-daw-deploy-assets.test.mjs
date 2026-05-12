import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const html = await readFile('v11-peer-daw/dist/index.html', 'utf8');

assert.doesNotMatch(html, /(?:src|href)="\/assets\//, 'built V11 DAW must use relative asset URLs so it works under /v11-peer-daw/');
assert.match(html, /(?:src|href)="\.\/assets\//, 'built V11 DAW should reference its local ./assets directory');

const staticRuntimeFiles = [
  'vendor/peernet/peernet-shared-core.js',
  'vendor/peernet/peernet-user-manager.js',
  'vendor/peernet/peernet-session-manager.js',
  'vendor/peernet/peernet-storage-manager.js',
  'docs/ARCHITECTURE.md',
];

for (const file of staticRuntimeFiles) {
  await stat(join('v11-peer-daw/dist', file));
}

console.log('v11 peer daw deploy asset contract OK');
