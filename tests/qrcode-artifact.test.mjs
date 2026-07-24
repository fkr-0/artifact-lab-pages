import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../qrcode.html', import.meta.url), 'utf8');

test('QR Studio prints cleanly and respects reduced motion', () => {
  assert.match(html, /prefers-reduced-motion: reduce/);
  assert.match(html, /print-color-adjust: exact/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /window\.open\(`mailto:\?subject=.*noopener,noreferrer/);
  assert.match(html, /document\.execCommand\('copy'\)/);
  assert.match(html, /PNG export failed/);
  assert.match(html, /qrcode-studio\/state\/v1/);
  assert.match(html, /QR generator library failed to load/);
});
