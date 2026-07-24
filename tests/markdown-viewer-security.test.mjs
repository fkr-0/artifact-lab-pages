import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { inlineMarkdown, isSafeSourceUrl, renderMarkdown } from '../markdown-viewer/lib/markdown-renderer.mjs';

const html = await readFile(new URL('../markdown-viewer/index.html', import.meta.url), 'utf8');

test('markdown renderer keeps unsafe links inert and escapes raw html', () => {
  assert.doesNotMatch(renderMarkdown('[x](javascript:alert(1))'), /href="javascript:/i);
  assert.doesNotMatch(renderMarkdown('![alt](javascript:alert(1))'), /src="javascript:/i);
  assert.match(renderMarkdown('<script>alert(1)</script>'), /&lt;script&gt;alert\(1\)&lt;\/script&gt;/i);
  assert.match(inlineMarkdown('[docs](https://example.org)'), /<a href="https:\/\/example\.org"/i);
  assert.equal(isSafeSourceUrl('javascript:alert(1)'), false);
  assert.equal(isSafeSourceUrl('../docs/README.md'), true);
});

test('viewer has accessible load and status affordances', () => {
  assert.match(html, /id="meta" class="muted" aria-live="polite"/);
  assert.match(html, /id="content" class="markdown-body" aria-live="polite"/);
  assert.match(html, /Could not load .*:\s*\$\{response\.status\}/);
  assert.match(html, /No headings detected\./);
  assert.match(html, /Blocked unsafe source URL/);
});
