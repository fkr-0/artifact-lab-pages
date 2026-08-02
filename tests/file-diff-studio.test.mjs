import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../file-diff-studio/index.html', import.meta.url), 'utf8');

test('File Diff Studio is a self-contained accessible artifact', () => {
  assert.match(html, /<!doctype html>/i);
  assert.match(html, /<main\b/i);
  assert.match(html, /aria-label="Source A text"/);
  assert.match(html, /aria-label="Source B text"/);
  assert.match(html, /prefers-reduced-motion/);
  assert.doesNotMatch(html, /https?:\/\//i, 'artifact must not depend on remote assets');
  assert.doesNotMatch(html, /\sonclick=/i, 'artifact must avoid inline handlers');
});

test('File Diff Studio exposes the non-destructive merge contract', () => {
  for (const token of [
    "schema:'file-diff-studio/session-v1'",
    "document.addEventListener('paste'",
    "function diffLines",
    "function choose",
    "function undo",
    "function redo",
    "Export </span>Session JSON",
    'Download </span>Result',
  ]) assert.ok(html.includes(token), `missing contract token: ${token}`);

  assert.match(html, /Paste anywhere: fills Source A/);
  assert.match(html, /next change/);
  assert.match(html, /accept A here/);
  assert.match(html, /accept B here/);
});
