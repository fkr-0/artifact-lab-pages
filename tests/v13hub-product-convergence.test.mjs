import assert from 'node:assert/strict';
import test from 'node:test';
import { filterArtifacts } from '../src/v13hub/search.js';

function item(overrides = {}) {
  return {
    id: 'artifact-a',
    title: 'Artifact A',
    description: 'A deterministic local tool',
    kind: 'application',
    status: 'active',
    tags: ['audio'],
    sourceKind: 'directory',
    gitMode: 'root',
    buildMode: 'assemble',
    releaseKind: 'directory',
    availability: 'verified',
    changedAt: '2026-09-01T00:00:00.000Z',
    git: { basis: 'source', path: 'tools/artifact-a', revision: 'abc123def456' },
    receipt: { version: '2.4.0' },
    ...overrides,
  };
}

test('discovery can find an artifact by publication and provenance evidence, not only marketing copy', () => {
  const items = [item(), item({ id: 'artifact-b', title: 'Artifact B', git: { basis: 'unknown' }, receipt: null, availability: 'source-only', buildMode: 'compile' })];
  assert.deepEqual(filterArtifacts(items, { query: 'assemble 2.4.0 source', sort: 'recent' }).map(({ id }) => id), ['artifact-a']);
  assert.deepEqual(filterArtifacts(items, { query: 'abc123def456', sort: 'recent' }).map(({ id }) => id), ['artifact-a']);
  assert.deepEqual(filterArtifacts(items, { query: 'tools/artifact-a', sort: 'recent' }).map(({ id }) => id), ['artifact-a']);
});

test('large deterministic catalogs remain searchable with stable ordering', () => {
  const items = Array.from({ length: 2_000 }, (_, index) => item({
    id: `artifact-${String(index).padStart(4, '0')}`,
    title: `Artifact ${String(index).padStart(4, '0')}`,
    description: index === 1731 ? 'needle provenance target' : 'ordinary catalog entry',
    changedAt: new Date(Date.UTC(2026, 0, 1, 0, 0, index % 60)).toISOString(),
  }));
  assert.deepEqual(filterArtifacts(items, { query: 'needle provenance', sort: 'recent' }).map(({ id }) => id), ['artifact-1731']);
  const alphabetical = filterArtifacts(items.slice(0, 50), { sort: 'title' }).map(({ id }) => id);
  assert.deepEqual(alphabetical, [...alphabetical].sort());
});
