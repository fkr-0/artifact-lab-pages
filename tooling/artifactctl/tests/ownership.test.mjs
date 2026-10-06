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

function manifest(path, mode, status = 'active', revision = 'a'.repeat(40)) {
  const git = { mode };
  if (mode === 'submodule') {
    git.repository = 'https://example.com/project.git';
    git.revision = revision;
  }
  return { id: path, status, source: { kind: 'project', path, git } };
}

test('ownership validator rejects root ownership over nested Git and submodules', () => {
  assert.equal(validateManifestOwnership(manifest('double-owned', 'root'), report).ok, false);
  assert.equal(validateManifestOwnership(manifest('project-submodule', 'root'), report).ok, false);
  assert.equal(validateManifestOwnership(manifest('project-submodule', 'submodule'), report).ok, true);
});

test('submodule ownership requires immutable metadata matching the parent gitlink', () => {
  const mismatch = validateManifestOwnership(manifest('project-submodule', 'submodule', 'active', 'b'.repeat(40)), report);
  assert.equal(mismatch.ok, false);
  assert.ok(mismatch.errors.some((entry) => entry.code === 'ownership.submodule-revision-mismatch'));

  const unpinned = validateManifestOwnership(
    { id: 'project-submodule', status: 'active', source: { kind: 'project', path: 'project-submodule', git: { mode: 'submodule' } } },
    report,
  );
  assert.equal(unpinned.ok, false);
  assert.ok(unpinned.errors.some((entry) => entry.code === 'ownership.submodule-unpinned'));
});

test('provisional adapters surface ownership conflicts as warnings', () => {
  const rootConflict = validateManifestOwnership(manifest('double-owned', 'root', 'provisional'), report);
  assert.equal(rootConflict.ok, true);
  assert.ok(rootConflict.warnings.some((entry) => entry.code.includes('provisional')));

  const revisionConflict = validateManifestOwnership(manifest('project-submodule', 'submodule', 'provisional', 'b'.repeat(40)), report);
  assert.equal(revisionConflict.ok, true);
  assert.ok(revisionConflict.warnings.some((entry) => entry.code === 'ownership.submodule-revision-mismatch.provisional'));
});
