import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const html = await readFile(new URL('../prompt-gen-nexus.html', import.meta.url), 'utf8');

test('Prompt Forge keeps persistence guards and removes inline HTML handlers', () => {
  assert.match(html, /promptforge-store\/v2/);
  assert.match(html, /promptforge-ui\/v1/);
  assert.match(html, /schemaVersion:\s*2/);
  assert.match(html, /function readCollection/);
  assert.match(html, /function writeCollection/);
  assert.match(html, /Unsupported export schema/);
  assert.match(html, /Import file is missing prompts or operations/);
  assert.match(html, /persistUiState\(\)/);
  assert.match(html, /readUiState\(\)/);

  assert.equal(html.includes('onclick='), false);
  assert.equal(html.includes('onchange='), false);
  assert.equal(html.includes('oninput='), false);
  assert.equal(html.includes('onkeydown='), false);
});

test('Prompt Forge inline scripts parse cleanly', () => {
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
    .map(([, script]) => script.trim())
    .filter(Boolean);

  assert.ok(scripts.length > 0, 'expected at least one inline script block');

  for (const [index, script] of scripts.entries()) {
    assert.doesNotThrow(() => {
      new vm.Script(script, { filename: `prompt-gen-nexus.inline-${index + 1}.js` });
    });
  }
});
