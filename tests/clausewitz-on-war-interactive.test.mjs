import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../clausewitz-on-war-interactive/index.html', import.meta.url), 'utf8');

test('Clausewitz atlas exposes selection state and empty search feedback', () => {
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /role="tab"/);
  assert.match(html, /aria-selected="\$\{b\.id===selected\.id\}"/);
  assert.match(html, /aria-pressed="false"/);
  assert.match(html, /searchState/);
  assert.match(html, /No matches found\./);
  assert.match(html, /clausewitz-on-war-interactive\/state\/v1/);
  assert.match(html, /document\.addEventListener\('keydown'/);
  assert.match(html, /applySearch\(\)/);
});
