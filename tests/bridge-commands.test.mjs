import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const bridge = await readFile('bridge.yml', 'utf8');

assert.match(bridge, /static:app-hub-v11:/, 'bridge should expose a static app-hub-v11 verification command');
assert.match(bridge, /app-hub-v11 static verification/, 'static command should describe v11 static verification');
assert.match(bridge, /app-hub-v11-index-ui\.test\.mjs/, 'static command should include v11 index UI contract');
assert.match(bridge, /app-hub-v11-root-safe-imports\.test\.mjs/, 'static command should include root-safe import contract');
assert.match(bridge, /app-hub-v11-shared-v9-shell-css\.test\.mjs/, 'static command should include shared shell CSS contract');
assert.match(bridge, /node --check app-hub-v11\/lib\/launcher\.js/, 'static command should syntax-check launcher lib');
assert.match(bridge, /node --check app-hub-v11\/lib\/network\.js/, 'static command should syntax-check network lib');
assert.match(bridge, /scripts\/extract-html-module\.mjs/, 'static command should use the shared module-script extractor');
assert.match(bridge, /app-hub-v11-index-module\.mjs/, 'static command should write and syntax-check the extracted hub module script');

console.log('bridge command contract OK');
