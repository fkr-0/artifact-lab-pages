import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderMarkdown, extractHeadings, slugify } from '../app-hub-v11/lib/markdown-renderer.mjs';

const html = await readFile(new URL('../app-hub-v11/markdown-viewer.html', import.meta.url), 'utf8');
assert.match(html, /NEXUS Markdown Viewer/);
assert.match(html, /buildThemeStyleText/);
assert.match(html, /renderMarkdown/);
assert.match(html, /id="toc"/);
assert.match(html, /id="fileInput"/);

const rendered = renderMarkdown('# Hello World\n\n- one\n- two\n\n| A | B |\n| --- | --- |\n| `x` | **y** |');
assert.match(rendered, /<h1 id="hello-world">/);
assert.match(rendered, /<ul><li>one<\/li><li>two<\/li><\/ul>/);
assert.match(rendered, /<table>/);
assert.deepEqual(extractHeadings('## Alpha\ntext\n### Beta').map((h) => h.id), ['alpha', 'beta']);
assert.equal(slugify('Hello, NEXUS!'), 'hello-nexus');

const source = await readFile(new URL('../app-hub-v11/artifacts.source.json', import.meta.url), 'utf8');
assert.match(source, /"id": "markdown-viewer"/);
assert.match(source, /markdown-viewer\.html\?src=/);
console.log('v11 markdown viewer contract OK');
