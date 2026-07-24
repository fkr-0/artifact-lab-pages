import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../chado-zen-tea/index.html', import.meta.url), 'utf8');

test('Chadō guide keeps keyboard state and empty search feedback visible', () => {
  assert.match(html, /body\.reduced-motion \*,/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /setAttribute\("aria-current", "location"\)/);
  assert.match(html, /setAttribute\("aria-current", index === currentStep \? "step" : "false"\)/);
  assert.match(html, /No glossary entries match your search\./);
  assert.match(html, /chado-zen-tea\/state\/v1/);
  assert.match(html, /writeGuideState\(\)/);
});
