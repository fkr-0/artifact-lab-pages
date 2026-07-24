import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../club-ledger.html', import.meta.url), 'utf8');

test('Club Ledger exports and imports wrapped schema payloads', () => {
  assert.match(html, /const LEDGER_SCHEMA = 'club-ledger\/v2'/);
  assert.match(html, /schemaVersion:\s*2/);
  assert.match(html, /Unsupported ledger export schema/);
  assert.match(html, /Ledger export payload is missing a ledger object/);
  assert.match(html, /exportedAt:/);
  assert.match(html, /ledger: normalizeLedger\(state\.ledger\)/);
});
