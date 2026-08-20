# Artifact Lab 1.7.0 publication readiness

Date: 2026-08-20
Branch: `ownership/v11pd-infarrange-20260806`
Candidate: `1.7.0`
Status: **App Hub V13 and publication topology ready; root publication blocked by two unrelated dirty-project gates**

## Publication architecture

App Hub V13 is the release front door. `scripts/build-publication-site.mjs` deliberately composes two layers:

1. `tooling/artifactctl` discovers every repository `artifact.json` plus `registry/sources.d/*.json`, generates the Git-history-sorted V13 catalog, materializes native artifacts, vendors `artifact-bridge`, and owns the publication root.
2. `app-hub-v11/artifacts.source.json` remains an explicit compatibility source for not-yet-migrated content and stable historical URLs. It no longer owns `/`.

The composite builder copies V11 compatibility content first and overlays V12 last. The release root redirects to `hub/v13/index.html`. The generated `catalog/catalog.json` is copied byte-for-byte to `hub/v13/catalog.json`, so the V12 same-directory fallback cannot drift from the authoritative release catalog.

The Pages workflow builds Ethic Brawl, V11 Peer DAW, and Badger Sprawl Runner explicitly, then runs the composite builder with `--no-build`; this avoids rebuilding child projects inside the publication composition step. Package/deploy wrappers continue to invoke the composite builder with builds enabled because they are standalone entry points.

## Verified publication paths

The composite-stage contract requires all of these paths before it can succeed:

- `hub/v13/index.html`
- `hub/v13/app.js`
- `hub/v13/styles.css`
- `hub/v13/vendor/artifact-bridge/bridge.js`
- `hub/v13/catalog.json`
- `catalog/catalog.json`
- `app-hub-v11/index.html`
- `club-ledger/index.html`
- `gif-white-to-transparent/index.html`
- `pdf-forge-nexus/index.html`
- `prompt-gen-nexus/index.html`
- `qr-studio/index.html`
- `sexy-love-chat/index.html`
- `sprite-extractor/index.html`

Local `--no-build` publication assembly verifies all 14 paths, 55 V13 catalog entries, 51 entries with committed-change dates, 6 native verified builds, and 49 V11 compatibility entries.

## Source-versus-package/runtime gates

- Source tree: root `index.html` redirects to `apps/app-hub-v13/index.html`; V12 prefers `packages/artifact-bridge/bridge.js` in source-tree serving and falls back to the staged vendor path.
- Assembled publication: root `index.html` redirects to `hub/v13/index.html`; the hub consumes `hub/v13/vendor/artifact-bridge/bridge.js` and the generated release catalog.
- Catalog fallback: `hub/v13/catalog.json` must be byte-identical to `catalog/catalog.json` in every assembled stage.
- Legacy compatibility: `app-hub-v11/` remains present, but V11 must not replace the root index.
- Relocated Phase 2 artifacts: all seven stable root URLs listed above must exist in the assembled stage.
- Packaging: `artifacts-package` materializes the same composite publication stage and uses sorted tar entries plus normalized ownership; set `SOURCE_DATE_EPOCH` for reproducible archive timestamps.
- VPS deployment: `artifacts-deploy` consumes the same composite stage/package. It is not part of this verification run because deployment is explicitly prohibited.

## Dirty-tree isolation and logical commit groups

Do not use `git add .`, `git add -A`, `git reset`, `git clean`, or bulk formatting in this checkout. Phase 2 index changes are already staged and must remain intact. Review and stage only explicit paths after the unrelated dirty work has been separated.

The **current index is intentionally incomplete as a standalone commit**: it contains the stale tracked-export/history removals plus the four verified submodule gitlink pins, while `.gitmodules`, `.gitignore`, the seven relocated artifact directories, their reference/test updates, and the V12/publication work remain unstaged. A later operator must add those complementary paths/hunks deliberately before creating any structural commit; committing the current index as-is would split removals from required replacements.

For shared dirty files such as `CHANGELOG.md`, `package.json`, `.gitmodules`, and `app-hub-v11/artifacts.source.json`, use hunk-level staging and inspect `git diff --cached -- <path>` before every commit. Do not absorb unrelated hunks just because they share a filename with release work.

Suggested logical groups for a later operator-controlled integration:

1. **Structural cleanup / Phase 2** — `.gitmodules`, `.gitignore`, staged gitlinks, stale tracked-export removals, the seven artifact relocations, their registry/reference/test updates, and `migration/inventory.yml`.
2. **V13 catalog / Phase 3** — `apps/app-hub-v13/`, `tooling/artifactctl/`, root `index.html`, `package.json`, V12/catalog tests, and attributable compatibility-contract updates.
3. **Release/publication / Phase 4** — `CHANGELOG.md`, `docs/release-evidence-v1.7.0.yml`, this readiness document, `scripts/build-publication-site.mjs`, `.github/workflows/pages.yml`, package/deploy/serve wrappers, and publication tests.

Before each logical commit, use path-limited `git diff --cached` and `git diff` review. Do not stage Peernet vendor changes, Hyperblast dirty child work, Bathroom outer synthesis work, or any other unrelated working-tree state.

## Branch-to-main integration strategy

Current evidence:

- branch: `ownership/v11pd-infarrange-20260806`
- HEAD: `33d18740d018e04860d3bdfad3893256521b80cc`
- merge-base with `origin/main`: `92dc10c576ef35b7a87f663ebf45eef1173a00c4`
- divergence `origin/main...HEAD`: 14 commits only on `origin/main`, 7 commits only on this branch
- local `main` is stale and must not be treated as the integration target

Use a clean integration worktree based on freshly fetched `origin/main`; do not merge/rebase inside this dirty checkout. Publication-sensitive upstream overlap since the merge-base includes `CHANGELOG.md`, `package.json`, `app-hub-v11/artifacts.source.json`, `app-hub-v11/data/artifact-collection.json`, `app-hub-v11/package.json`, `scripts/audit-artifact-portfolio.mjs`, and release/App-Hub tests. Resolve those deliberately, preserving the V12-root publication model and current upstream release-contract changes.

After the clean-worktree integration, rerun the complete release gates there before any tag or deployment.

## Current blockers

Two root-suite failures remain and are intentionally not repaired by this cleanup because they belong to unrelated dirty work:

- `peernet-vendor-sync`: checked Peernet vendor copies under V11 Peer DAW differ from canonical `peernetjs` sources.
- `hyperblast-shooter-smoke`: dirty Hyperblast behavior exposes story/contract output where the root smoke test expects encounter combat.

Phase 3/4 attributable checks are green. These two unrelated failures keep `releaseReady: false` until their owners reconcile them or an operator explicitly changes the release policy.

## Operator-only publication sequence

The following is a future checklist, not commands executed by this task:

1. Reconcile the two unrelated blockers and obtain a clean full gate on an integration worktree.
2. Review and commit the three logical groups above with explicit path lists.
3. Fetch `origin`, integrate the ownership branch into a clean branch based on `origin/main`, resolve the identified overlaps, and rerun all checks.
4. Inspect the final 1.7.0 diff, release evidence, generated catalog, and publication-stage manifest.
5. Only after approval: merge/push the intended main-branch result, create the `v1.7.0` tag, and let the approved Pages workflow deploy.

No commit, push, tag, package publication, Pages deployment, VPS deployment, or remote-repository creation was performed during this work.
