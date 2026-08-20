import test from 'node:test';
import assert from 'node:assert/strict';
import { validateManifestOwnership } from '../src/ownership.mjs';

const report = {
  gitlinks: [{ path: 'project-submodule', commit: 'a'.repeat(40) }],
  ownership: [
    { path: 'project-submodule', classification: 'submodule' },
    { path: 'double-owned', classification: 'parent-tree-plus-nested-git' },
    { path: 'untracked-project', classification: 'untracked-nested-git' },
  ],
};

function manifest(path, mode, status = 'active') {
  return { id: path, status, source: { kind: 'project', path, git: { mode } } };
}

test('ownership validator rejects root ownership over nested Git and submodules', () => {
  assert.equal(validateManifestOwnership(manifest('double-owned', 'root'), report).ok, false);
  assert.equal(validateManifestOwnership(manifest('project-submodule', 'root'), report).ok, false);
  assert.equal(validateManifestOwnership(manifest('project-submodule', 'submodule'), report).ok, true);
});

test('provisional adapters surface ownership conflicts as warnings', () => {
  const result = validateManifestOwnership(manifest('double-owned', 'root', 'provisional'), report);
  assert.equal(result.ok, true);
  assert.ok(result.warnings.some((entry) => entry.code.includes('provisional')));
});
