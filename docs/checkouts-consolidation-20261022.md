# Artifact checkout consolidation — 2026-10-22

## Canonical source and release boundaries

- **Canonical portfolio/source:** `/home/user/code/artifacts` (`fkr-0/artifact-lab-pages`).
- **Independent hub/publisher source:** `/home/user/code/artifacts-v13.5`
  (`fkr-0/artifacts-v13.5`). This is a distinct Git repository, **not**
  a redundant worktree: the GitHub Pages workflow checks out this repository
  separately at a reviewed revision. Keep it until that publication contract
  is intentionally migrated; simply deleting or embedding it would break
  checkout/release provenance.
- **Published site:** `https://artifacts.fkr.dev` (not modified by this
  local consolidation).

## Removed obsolete sibling worktrees

| Directory | Provenance at removal | Disposition |
| --- | --- | --- |
| artifacts-diff-studio-release | 5484d83 (ancestor of canonical HEAD) | Git worktree removed |
| artifacts-file-diff-layout | a1805ac (ancestor of canonical HEAD) | Git worktree removed |
| artifacts-file-diff-release | e0a3994 (ancestor of canonical HEAD) | Git worktree removed |
| artifacts-label-sheet-release | 03b0cc6 (ancestor of canonical HEAD) | Git worktree removed |
| artifacts-release-alpha9 | 5484d83 (ancestor of canonical HEAD) | Git worktree removed |
| artifacts-vtr-release | 890fdfec (11 commits beyond former canonical HEAD) | Released content integrated and redundant worktree removed |

All six had clean tracked and non-ignored untracked states. Historical branch
references were preserved. The VTR repository also included clean nested
submodule checkouts; these were deinitialized before removal. Because
`git worktree remove` rejects worktrees containing gitlinks, its remaining
worktree directory and **only its dedicated worktree metadata entry** were
removed after hash/content and reverse-link checks. Other registered or
prunable worktrees were not touched.

## Integration evidence

- Canonical release import: `5c973c7c00d6c9141adbee869691461fac1198d9`
  — reviewed files from VTR head `890fdfec83a331cf65a6a39aa245ad4b8070002d`.
  All tracked imported release paths were compared to the source VTR revision;
  they matched byte for byte. The VTR branch remains in local Git history.
- Catalog addition: `f7a06435579d2de637d6082bedacd37f15f0af40`.
  Only the four missing deployed records (Vim Tomb Raider, Nakamoto's
  Disciples, Sudoku Lab, Killer Sudoku Lab) were committed. This was staged
  from HEAD plus those four records, **not** from the entire dirty working
  catalog, so unrelated uncommitted owner changes remain in place.
- The working catalog retains an additional, uncommitted
  `groove-scratch-studio` addition and previously modified Ethic Brawl
  and Git Recipe Book metadata. These local changes are intentionally
  preserved and were *not* swept into consolidation commits.
- The build from the current source tree includes all four recovered
  release routes plus Groove Scratch Studio: **64 catalog entries**
  and **44/44 required V12 routes**, with no missing required routes.
  The live public site had 63 entries before consolidation; no publishing
  was performed.

## Reproduce the validation

From `~/code/artifacts`:

    node --test tests/sudoku-lab.test.mjs tests/killer-sudoku-lab.test.mjs tests/v13-5-publication-adapter.test.mjs

From `~/code/artifacts-v13.5`:

    npm test
    npm run release:check
    node tests/qualification/browser-smoke.mjs dist

The publication handoff requires a separate clean Git/provenance review
before deployment. The canonical portfolio still contains unrelated
pre-existing dirty/untracked work; do not run `git reset --hard` or
`git clean` to manufacture a clean state.

## Remaining work

- Reconcile, commit or explicitly exclude the canonical working tree's
  pre-existing dirty metadata and Groove Scratch assets with their owners.
- Regenerate publication evidence from the intended immutable source
  revision and update the reviewed Pages hub revision when authorized.
- Run the final publication handoff and browser/live checks; **never**
  treat local build success alone as proof of a completed deploy.
