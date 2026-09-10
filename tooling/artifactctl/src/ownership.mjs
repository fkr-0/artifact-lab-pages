function pathContains(root, child) {
  return child === root || child.startsWith(`${root}/`);
}

export function validateManifestOwnership(manifest, ownershipReport) {
  const errors = [];
  const warnings = [];
  const sourcePath = manifest.source?.path;
  if (!sourcePath || !ownershipReport) return { ok: true, errors, warnings };
  const normalized = sourcePath.replaceAll('\\', '/').replace(/\/$/, '');
  const nested = (ownershipReport.ownership || []).filter((entry) => pathContains(entry.path, normalized) || pathContains(normalized, entry.path));
  const exactGitlink = (ownershipReport.gitlinks || []).find((entry) => entry.path === normalized);

  if (manifest.source.git.mode === 'root') {
    for (const entry of nested) {
      if (entry.classification === 'parent-tree-plus-nested-git') {
        errors.push({ code: 'ownership.double-git', message: `${manifest.id}: root-owned source overlaps parent-tracked nested Git repository ${entry.path}.` });
      } else if (entry.classification === 'submodule') {
        errors.push({ code: 'ownership.submodule-as-root', message: `${manifest.id}: source ${normalized} is inside submodule ${entry.path} but declares root ownership.` });
      } else if (entry.classification === 'untracked-nested-git') {
        errors.push({ code: 'ownership.untracked-project', message: `${manifest.id}: root-owned source overlaps untracked nested Git repository ${entry.path}.` });
      }
    }
  }
  if (manifest.source.git.mode === 'submodule' && !exactGitlink) {
    errors.push({ code: 'ownership.missing-gitlink', message: `${manifest.id}: ${normalized} declares submodule ownership but is not a parent gitlink.` });
  }
  if (manifest.source.git.mode === 'submodule' && exactGitlink) {
    const repository = manifest.source.git.repository;
    const revision = manifest.source.git.revision;
    if (!repository || !revision) {
      errors.push({ code: 'ownership.submodule-unpinned', message: `${manifest.id}: submodule source requires repository and immutable revision metadata.` });
    } else if (revision !== exactGitlink.commit) {
      errors.push({ code: 'ownership.submodule-revision-mismatch', message: `${manifest.id}: manifest revision ${revision} does not match parent gitlink ${exactGitlink.commit} for ${normalized}.` });
    }
  }
  if (manifest.source.git.mode === 'external' && exactGitlink) {
    errors.push({ code: 'ownership.external-is-submodule', message: `${manifest.id}: ${normalized} is a submodule, not an external checkout.` });
  }
  if (manifest.source.kind === 'project' && manifest.source.git.mode === 'external' && (!manifest.source.git.repository || !manifest.source.git.revision)) {
    errors.push({ code: 'ownership.external-unpinned', message: `${manifest.id}: external project requires repository and immutable revision.` });
  }
  if (manifest.status === 'provisional' && errors.length) {
    warnings.push(...errors.map((entry) => ({ ...entry, code: `${entry.code}.provisional` })));
    errors.length = 0;
  }
  return { ok: errors.length === 0, errors, warnings };
}
