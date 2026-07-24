import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { auditArtifactPortfolio } from '../scripts/audit-artifact-portfolio.mjs';

test('embedded artifact portfolio has no blocking catalog or HTML defects', async () => {
  const report = await auditArtifactPortfolio({ rootDir: process.cwd() });

  assert.equal(report.summary.errors, 0, report.issues
    .filter((entry) => entry.severity === 'error')
    .map((entry) => `${entry.code}: ${entry.message}`)
    .join('\n'));
  assert.equal(report.summary.catalogItems, report.summary.uniqueArtifactIds);
  assert.ok(report.summary.inspectedArtifacts >= 40, 'expected the embedded catalog surface to be audited');
  assert.ok(report.summary.skippedIndependentProjects >= 5, 'independent subprojects should be integration-checked but not rewritten');
  assert.deepEqual(
    report.issues.filter((entry) => entry.code.startsWith('a11y.')),
    [],
    'every embedded artifact should satisfy the static landmark and reduced-motion baseline',
  );
});

test('portfolio audit rejects duplicate IDs and placeholder external links', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'artifact-portfolio-audit-'));
  await mkdir(join(rootDir, 'app-hub-v11'), { recursive: true });
  await writeFile(join(rootDir, 'app-hub-v11', 'index.html'), '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width"><title>Hub</title></head><body><main></main></body></html>');
  await writeFile(join(rootDir, 'app-hub-v11', 'artifacts.source.json'), JSON.stringify({
    collection: { id: 'test', title: 'Test' },
    items: [
      {
        id: 'duplicate',
        title: 'First',
        kind: 'external-link',
        href: 'https://example.com/',
        tags: ['test'],
        launch: { modes: ['newWindow'], defaultAction: 'newWindow' },
      },
      {
        id: 'duplicate',
        title: 'Second',
        kind: 'external-link',
        href: 'https://example.org/',
        tags: ['test'],
        launch: { modes: ['newWindow'], defaultAction: 'newWindow' },
      },
    ],
  }, null, 2));

  const report = await auditArtifactPortfolio({ rootDir });
  const codes = report.issues.map((entry) => entry.code);
  assert.ok(codes.includes('catalog.duplicate-id'));
  assert.ok(codes.includes('catalog.placeholder-link'));
  assert.ok(report.summary.errors >= 3);
});
