import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const htmlPath = new URL('../file-diff-studio/index.html', import.meta.url);
const catalogPath = new URL('../app-hub-v11/artifacts.source.json', import.meta.url);

async function html() {
  return readFile(htmlPath, 'utf8');
}

test('File Diff Studio is a self-contained, hardened HTML artifact', async () => {
  const source = await html();
  assert.match(source, /^<!doctype html>/i);
  assert.match(source, /<html lang="en">/);
  assert.match(source, /<main class="app">/);
  assert.match(source, /Content-Security-Policy/);
  assert.match(source, /Permissions-Policy/);
  assert.match(source, /prefers-reduced-motion/);
  assert.doesNotMatch(source, /<script\s+src=/i);
  assert.doesNotMatch(source, /<link\s+[^>]*rel=["']stylesheet/i);
  assert.doesNotMatch(source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ''), /\son[a-z]+\s*=/i);
});

test('File Diff Studio exposes the required diff, merge, paste, upload, and journal contracts', async () => {
  const source = await html();
  for (const marker of [
    'DWIM paste',
    'function myersDiff',
    'function coarseDiff',
    'function generatedResult',
    'function journalDocument',
    'file-diff-studio/journal-v1',
    'data-upload="a"',
    'data-upload="b"',
    'id="result"',
    'id="undo"',
    'id="redo"',
    'id="previous-hunk"',
    'id="next-hunk"',
    'window.__FILE_DIFF_STUDIO__'
  ]) assert.ok(source.includes(marker), `missing contract marker: ${marker}`);
});

test('File Diff Studio is registered as a deployable app-hub artifact', async () => {
  const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
  const item = catalog.items.find(entry => entry.id === 'file-diff-studio');
  assert.ok(item, 'catalog entry is missing');
  assert.equal(item.kind, 'html-path');
  assert.equal(item.href, '../file-diff-studio/index.html');
  assert.equal(item.deploy.includePath, 'file-diff-studio');
  assert.deepEqual(item.launch.modes, ['inline', 'floating', 'fullscreen', 'newWindow']);
  assert.equal(item.launch.defaultAction, 'newWindow');
});
