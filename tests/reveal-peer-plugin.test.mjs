import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('RevealPeerJS cleans up pagehide listeners and avoids duplicate hub buttons', async () => {
  const html = await readFile(new URL('../reveal-peer-plugin/reveal-peerjs.js', import.meta.url), 'utf8');
  assert.match(html, /window\.addEventListener\("beforeunload",v\)/);
  assert.match(html, /window\.addEventListener\("pagehide",v\)/);
  assert.match(html, /document\.addEventListener\("visibilitychange",z\)/);
  assert.match(html, /window\.removeEventListener\("beforeunload",v\)/);
  assert.match(html, /window\.removeEventListener\("pagehide",v\)/);
  assert.match(html, /!document\.getElementById\("rpjs-btn-hub"\)/);
});
