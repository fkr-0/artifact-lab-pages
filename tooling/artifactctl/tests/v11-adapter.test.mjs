import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { adaptV11Catalog } from '../src/v11-adapter.mjs';
import { validateManifest } from '../src/core.mjs';

const rootDir = resolve(import.meta.dirname, '../../..');

test('V11 adapter represents every current catalog entry without builds or copies', async () => {
  const manifests = await adaptV11Catalog({ rootDir });
  const source = await import(`${new URL('../../../app-hub-v11/artifacts.source.json', import.meta.url).href}`, { with: { type: 'json' } });
  assert.equal(manifests.length, source.default.items.length);
  assert.equal(new Set(manifests.map((item) => item.id)).size, manifests.length);
  assert.ok(manifests.some((item) => item.kind === 'document' && item.build.renderer === 'markdown-html'));
  assert.ok(manifests.some((item) => item.source.git.mode === 'submodule'));
  assert.ok(manifests.some((item) => item.build.provisionalShellCommand));
});

test('all adapted entries reach descriptive validation with explicit provisional findings', async () => {
  const manifests = await adaptV11Catalog({ rootDir });
  const reports = await Promise.all(manifests.map((manifest) => validateManifest(manifest, { rootDir })));
  const hardFailures = reports.flatMap((report, index) => report.errors.map((entry) => ({ id: manifests[index].id, ...entry })));
  assert.deepEqual(hardFailures, []);
  assert.ok(reports.some((report) => report.warnings.some((entry) => entry.code === 'build.provisional-shell')));
});
