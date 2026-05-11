import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const cssPath = 'app-hub-v11/lib/v9-shell.css';
const css = await readFile(cssPath, 'utf8');
await stat(cssPath);

assert.match(css, /--bg-primary:\s*#0a0a12/, 'shared shell should carry v9 cyber base background token');
assert.match(css, /--fg-primary:\s*#00ffff/, 'shared shell should carry v9 cyan foreground token');
assert.match(css, /--accent-secondary:\s*#ff3366/, 'shared shell should carry v9 hot accent token');
assert.match(css, /\.artifact-card/, 'shared shell should expose reusable artifact card rules');
assert.match(css, /\.panel/, 'shared shell should expose reusable panel rules');
assert.match(css, /\.toolbar/, 'shared shell should expose reusable toolbar spacing rules');
assert.match(css, /\.hub-app-shell/, 'shared shell should expose a small adoption wrapper class');
assert.match(css, /gap:\s*(?:1\.5rem|24px)/, 'shared shell should add a tad more layout breathing room');

const indexHtml = await readFile('app-hub-v11/index.html', 'utf8');
assert.match(indexHtml, /<link rel="stylesheet" href="lib\/v9-shell\.css">/, 'v11 index should consume the extracted v9 shell CSS');

const gifHtml = await readFile('spc/sprite-gif-creator-v2.html', 'utf8');
assert.match(gifHtml, /<link rel="stylesheet" href="\.\.\/app-hub-v11\/lib\/v9-shell\.css">/, 'sprite GIF creator should be able to adopt the shared v9 look via one stylesheet');
assert.match(gifHtml, /class="hub-app-shell/, 'sprite GIF creator should opt into the shared shell adoption wrapper');

console.log('shared v9 shell CSS contract OK');
