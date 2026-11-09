# Portfolio consolidation Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for inline execution, followed by one independent whole-branch review.

**Goal:** Consolidate the publisher and declare the complete portfolio in YAML, including explicit acquisition and preparation recipes.

**Architecture:** Reconcile the existing history-preserving hub candidate with upstream main. inventory.yml owns publication selection, descriptors and recipes; JSON remains generated compatibility output. One runner resolves recipes and one qualified site is served and deployed.

**Tech Stack:** Node ESM, YAML, node:test, pnpm, Git, existing Python static server, GitHub Pages.

**Spec:** docs/portfolio-consolidation-review-20261109.md, amended by user approval requiring YAML and separate recursive clone/copy/build recipes.

## Global constraints

- Preserve independent project repositories and all existing publication routes.
- Preserve the original checkout and its uncommitted Scratch Studio work.
- Immutable full Git pins, recursive submodules, argv commands and explicit output boundaries.
- Preview and deploy the exact qualified output; never serve source as a publication fallback.
- Deployment requires verification of the exact committed candidate.

## Review focus

- Clone-only recipes never execute build/install commands.
- Child/submodule revision drift and missing required output fail releases.
- Paths, archive members and symlinks cannot escape declared roots.
- Legacy entries and recent document supplements survive composition.
- A fresh clone works with no sibling repos, stale dist or home-directory defaults.

### Task 1: Reconcile existing migration

Files: .github/workflows/pages.yml, scripts/stage-v13-5-publication.mjs, embedded hub and existing migration files.
- [ ] Merge the ready candidate into current upstream main, retaining both monorepo hashes and newer document publication checks.
- [ ] Run adapter, hub and root baseline tests; record existing environmental failures.
- [ ] Review the independent Ethic Brawl repair and preserve its qualified release integration when applicable.
- [ ] Commit the reconciled migration without unrelated working changes.

### Task 2: YAML inventory and recipe planner

Files: inventory.yml, tooling/artifactctl/src/portfolio.mjs, tooling/artifactctl/tests/portfolio.test.mjs, package.json, pnpm-lock.yaml.
Interfaces: loadPortfolio(rootDir) returns validated inventory; planPortfolio(inventory) returns ordered recipes.
- [ ] Write tests for invalid YAML, duplicate IDs, missing recipes, recursive clone-only versus clone-build, pin mismatch, unsafe output and command arrays. Run red.
- [ ] Implement YAML loading, explicit recipe validation and complete native plus legacy inventory; retain IDs and compatibility routes.
- [ ] Test generated JSON manifests and inventory/catalog coverage. Run green and commit.

### Task 3: Recipe execution

Files: tooling/artifactctl/src/recipes.mjs, tooling/artifactctl/tests/recipes.test.mjs.
Interfaces: executeRecipes(inventory, {rootDir}) returns provenance receipts and prepared output paths.
- [ ] Write real fixture tests for local copy, recursively cloned Git copy, cloned build, submodule copy/build, wrong pins, build failures, prebuilt hash mismatch and escaping paths. Run red.
- [ ] Resolve local/submodule/git/release sources, run only declared install/build/check argv, stage declared releases and record revisions/file hashes.
- [ ] Verify clean source inputs and nested pins before builds, reject missing outputs, and verify archive extraction. Run green and commit.

### Task 4: Unified composition, preview and CI

Files: scripts/qualify-monorepo.mjs, scripts/portfolio.mjs, scripts/verify-site.mjs, .github/workflows/pages.yml, hub-v13.5/scripts/build.mjs, package.json, README.md, SERVER_GUIDE.md.
- [ ] Write integration tests for inventory-generated manifests, one-checkout source defaults, complete-site tamper detection and identical preview/deploy root. Run red.
- [ ] Generate compatibility manifests/catalog from YAML; run recipes then existing parity/handoff composition into dist/site.
- [ ] Replace app-specific workflow steps with shared commands; qualify pull requests without publication credentials; deploy only verified main output.
- [ ] Document recipe examples and migrate serve entrypoints. Run green and commit.

### Task 5: Final qualification and integration

- [ ] Run all root, tooling, hub and adapter suites; fresh worktree build; full output hash and route checks; browser smoke.
- [ ] Independent code review; address important findings with regression tests.
- [ ] Record exact commit/build evidence and Org-roam check-in; retain old deployment for rollback.
- [ ] Promote the verified result to main and run hosted CI/deployment only when safe and authorized; report exact publication evidence or remaining blockers.
