import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const html = await readFile(new URL('../pdf-forge-nexus.html', import.meta.url), 'utf8');
const inlineScriptMatch = html.match(/<script>\s*([\s\S]*?)<\/script>\s*<\/body>/i);

test('PDF Forge Nexus has no inline event attributes', () => {
  assert.equal((html.match(/\son[a-z]+=/gi) || []).length, 0);
});

test('PDF Forge Nexus inline script parses cleanly', () => {
  assert.ok(inlineScriptMatch, 'expected the inline script block to exist');
  new vm.Script(inlineScriptMatch[1], { filename: 'pdf-forge-nexus.inline.js' });
});

test('PDF Forge Nexus caches PDF documents and matches picker filters to supported files', () => {
  assert.match(html, /accept="\.pdf,\.png,\.jpg,\.jpeg"/);
  assert.match(html, /async _getPdfDoc\(doc\)/);
  assert.match(html, /async _releasePdfDoc\(doc\)/);
  assert.match(html, /doc\._pdfDocPromise/);
});
