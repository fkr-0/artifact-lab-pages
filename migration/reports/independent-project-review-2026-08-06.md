# Independent Project Worktree Review

Date: 2026-08-06
Repository: `/home/user/work/code/artifacts`
Scope: manually review every detected independent, nested, or submodule Git worktree; preserve coherent work; avoid destructive root cleanup; identify ownership and release blockers.

## Executive result

Twelve independent or nested Git worktrees were reviewed.

- Ten are now internally clean.
- Two deliberately remain dirty because they are recursive byte-duplicate bathroom-guide copies. Creating additional commits there would preserve structural corruption rather than resolve it.
- No root-level submodule gitlink was updated.
- No remote branch was pushed.
- No source worktree was reset or cleaned without first classifying the changes.
- Rescue branches are explicitly checkpoints, not release declarations.

Current clean worktrees:

| Project | Branch | HEAD | Result |
|---|---|---:|---|
| Badger Sprawl Runner | `rescue/badger-mixed-worktree-20260805` | `5a7b946c9457` | clean rescue checkpoint |
| Badger Pixi migration worktree | `worktree-pixi-migration` | `45072948b0eb` | clean verified prototype |
| Ethic Brawl | `rescue/ethic-brawl-mixed-worktree-20260805` | `3e4d7ed94e20` | clean rescue checkpoint |
| Hyperblast Shooter | `release/v0.8.0` | `5a1450f7c76a` | clean after generated-runtime restore |
| V11 Peer DAW | detached at parent pin | `37783861b768` | published submodule aligned; local `main` preserved at `5a45fe665fb8` |
| Inf Arrange | parent-owned | former child `dd0db5f204f7` | root-owned project; complete former history preserved as a verified bundle |
| Bathroom Emergency Guide | `integration/v4-alt-full-synthesis` | `bee0f3e` plus active changes | canonical/alt restructuring is in progress; ownership conversion deferred until integration work is verified |
| Git Recipe Book | parent-owned | former child `de3b1bfb3b16` | root-owned project; complete former history preserved as a verified bundle |
| Bathroom Guide 4.3 candidate | `rescue/bathroom-guide-4.3-accessibility-20260806` | `e8c5dfae13cd` | clean rescue checkpoint |
| Bathroom Guide alternate | `rescue/bathroom-guide-alt-20260806` | `e19763de3047` | clean rescue checkpoint |

Remaining duplicate worktrees:

| Path | HEAD | Dirty state | Required strategy |
|---|---:|---:|---|
| `bathroom-disaster/bathroom-emergency-guide-4.x` | `82c537861246` | 30 tracked + 156 untracked entries | archive and remove recursive duplicate after canonical migration |
| `bathroom-disaster/bathroom-emergency-guide-4.x/bathroom-emergency-guide-4.x` | `82c537861246` | 29 tracked + 155 untracked entries | archive and remove; byte-identical source copy of canonical candidate before local fixes |

## Review principles

The following distinctions were applied manually:

1. Coherent implementation work with passing project gates was committed in the child repository.
2. Mixed work spanning several existing release branches was checkpointed on an explicit `rescue/*` branch.
3. Generated vendor drift that contradicted the project release contract was restored after preserving a patch.
4. Large browser evidence, raw image imports, review renders, dependency trees, and agent state were excluded from normal Git history.
5. Recursive duplicate repositories were not “cleaned” by inventing more commits. They received source snapshots and diffs for later deduplication.
6. Child commits were not promoted into parent gitlinks because rescue commits are not automatically valid release pointers.

## Project reviews

### Hyperblast Shooter

Initial state:

- three modified generated runtime vendor files;
- generated files identified themselves as runtime `1.12.0`;
- `release-train.json` and the project release contract require `1.11.0`;
- `npm run release:plan:check` failed on the mismatch.

Action:

- preserved the generated delta as a binary-capable patch;
- restored the three generated vendor files to the recorded release state;
- reran the release-plan verification.

Verification:

```text
npm run release:plan:check: pass
worktree: clean
```

Rescue evidence:

```text
/tmp/artifacts-v12-rescue/2026-08-05/hyperblast-shooter-runtime-1.12.patch
SHA-256 1becf616e1563c88cdff0d49ac8b93728f42767ffba2879949f5caca8cfb64f9
```

Parent action:

- keep the current child revision unless a deliberate runtime 1.12 upgrade is prepared with matching release metadata;
- do not update the parent gitlink merely because the checkout is currently at a different recorded revision.

### V11 Peer DAW

Initial state:

- coherent diagnostics, host bridge, Peernet lifecycle, tests, vendor synchronization, and planning work;
- vendored Peernet sources were byte-identical to the parent canonical copies;
- repository-wide Biome check has unrelated pre-existing formatting debt.

Verification:

```text
45 suites / 250 tests: pass
pnpm build: pass
vendor/peernet-lib.js: canonical hash match
vendor/peernet/peernet-shared-core.js: canonical hash match
repository-wide Biome: fails on pre-existing broader formatting debt
```

Commits:

```text
061959e feat: add host diagnostics and peernet lifecycle reporting
5a45fe6 docs: add session clip chain UX plan
```

Rescue evidence:

```text
/tmp/artifacts-v12-rescue/2026-08-05/v11-peer-daw-before-clean.patch
SHA-256 fc018b12dbda7d867646d8c079d759f171d6bbe513240111be380ccfab1ac52e
```

Parent action:

- inspect and promote `5a45fe6` as a normal child revision after deciding whether the project is ready for a parent gitlink update;
- track the existing Biome debt separately rather than rewriting this verified feature commit.

### Inf Arrange

Initial state:

- one coherent batch covering embeddable command dispatch, structured change notifications, history behavior, accessibility, and tests;
- repository is an untracked nested Git repository from the parent’s perspective.

Verification:

```text
36 tests: pass
pnpm build: pass
pnpm check: pass
```

Commit:

```text
dd0db5f feat: harden embeddable canvas runtime
```

Rescue evidence:

```text
/tmp/artifacts-v12-rescue/2026-08-05/inf-arrange-embeddable-runtime.patch
SHA-256 1f7e320e217146555a4d80c24faaad4a181e024415afed7f0f0dc3f710b3ba0c
```

Parent action:

Choose one explicit ownership model:

1. add it as a real submodule at a deliberate parent path;
2. register it as an external pinned project;
3. import it into the parent as ordinary root-owned files after removing its nested `.git`.

Do not leave it as an indefinitely untracked nested repository.

### Ethic Brawl

Initial state:

- checkout was on stale `release/v1.6.0`;
- dedicated worktrees already existed for `release/v1.7.0`, `release/v1.7.1`, and multiple 1.7.2 feature branches;
- dirty content combined animation production, release evidence, source, tests, generated sheets, and later release-line work;
- therefore unsuitable for a misleading release commit.

Cleanup actions:

- excluded ignored `.ws-bridge` and `docs/prompts` evidence from Biome scanning;
- ignored `.tmp-*` review workspaces;
- archived and removed only the temporary review directories;
- formatted the two real test files found by the corrected lint scope;
- committed all remaining classified work to a rescue branch.

Verification:

```text
animation/full-set checks: pass
lint: pass
typecheck: pass
43 unit-test files / 132 tests: pass
production build: pass
full browser release gate: fail
```

Browser failures:

- application remained on sprite-loading screen and did not reach the expected `start` state;
- two renderer performance tests timed out;
- lifecycle/browser assertions later failed as a consequence.

Rescue branch and commit:

```text
rescue/ethic-brawl-mixed-worktree-20260805
3e4d7ed checkpoint: preserve mixed 1.7 animation workspace
```

Temporary review archive:

```text
/tmp/artifacts-v12-rescue/2026-08-05/ethic-brawl-temp-review.tar.gz
SHA-256 232f491c10b15740e96ea083d85b63b8b0ddef1f52df014911337290b52c66ed
```

Parent action:

- do not promote `3e4d7ed` as a release gitlink;
- compare/cherry-pick coherent portions into the existing 1.7.1/1.7.2 worktrees;
- fix sprite startup and renderer performance E2E before selecting a canonical release branch;
- after reconciliation, retire the rescue branch or retain it as immutable recovery evidence.

### Badger Sprawl Runner

Initial state:

- checkout was on stale `release/v1.2.1` at the v1.2.0 commit;
- a separate `release/v1.3.0` worktree already existed;
- dirty workspace contained substantial post-1.3 game, adventure, renderer, persistence, evidence, and sprite-production work;
- 2,187 untracked files occupied approximately 1.34 GB.

Manual classification:

- approximately 1.1 GB consisted of browser release evidence, traces, raw DALL-E batches, duplicated Chronicle image archives, review renders, GIMP references, and agent state;
- approximately 18 MB of Markdown/JSON prompt and render-job contracts is tested source and was retained;
- generated `dist` remains tracked under the project’s existing policy;
- source and tests were retained and checkpointed.

Ignored but physically preserved:

```text
release-evidence/
images_6a23c916_DALLE_-_Pixel_Art_Sprite_Sheet/
images_6a23c916_DALLE_-_Pixel_Art_Sprite_Sheet.zip
gimp-anchor-refs/
renders/
renders-raw/
renders-rejected/
review_unmatched_images.html
docs/sprite-production/chronicle-images-*/
docs/sprite-production/*.zip
.ws-bridge/
.opencode/
.claude/worktrees/
Python caches
```

Bug fixed during review:

- `ReleaseEvidenceCollector.test.ts` used `process.cwd()` as repository root;
- package-filtered Vitest therefore searched `apps/runner/apps/runner/src`;
- root resolution now derives from `import.meta.url`, making the test independent of invocation directory.

Verification:

```text
workspace tests: pass
runner: 181 files / 673 tests pass
typecheck: pass
production build: pass
```

Rescue branch and commit:

```text
rescue/badger-mixed-worktree-20260805
5a7b946 checkpoint: preserve verified post-1.3 workspace
```

Parent action:

- do not promote `5a7b946` directly as a release gitlink;
- reconcile it against `release/v1.3.0` by subsystem or merge review;
- move ignored evidence/raw image corpora to an artifact/object store with manifests and hashes;
- retain only tested prompt contracts, runtime sprites, and curated release evidence in Git.

### Badger Pixi migration worktree

Path:

```text
badger-sprawl-runner/.claude/worktrees/pixi-migration
```

Finding:

- the nested worktree is a genuine Pixi renderer prototype, not accidental residue.

Verification:

```text
40 focused test files / 116 tests: pass
typecheck: pass
production build: pass
```

Commit:

```text
4507294 checkpoint: preserve verified pixi migration prototype
```

Rescue patch:

```text
/tmp/artifacts-v12-rescue/2026-08-05/badger-pixi-migration.patch
SHA-256 40e9caba770b06dee9b27d58bf81a92e93b0962e706ca4527ade0833033f288a
```

Parent action:

- compare this prototype against the newer retained-native renderer work on the Badger rescue branch;
- either cherry-pick reusable Pixi pieces or retire the nested worktree after merge;
- do not keep active worktrees under `.claude/` long-term—move them to a normal sibling worktree directory.

### Bathroom Emergency Guide child repository

State:

```text
branch main
HEAD 42eb11490941
worktree clean
```

Problem:

- child repository is internally clean;
- parent repository simultaneously tracks its directory as ordinary files;
- this is prohibited double ownership.

Rescue bundle:

```text
/tmp/artifacts-v12-rescue/2026-08-06/bathroom-emergency-guide.bundle
SHA-256 dad7823488c7ee6be11088637e0f711f92744dc6cb2a14dd16843154b6047b29
```

Parent action:

Preferred: convert the project to a real submodule after the parent records/removes its ordinary tracked copy. Alternative: remove the nested `.git` and keep it root-owned. Do not retain both owners.

### Git Recipe Book ownership reconciliation

The nested child repository had no canonical remote, while the parent already tracked the project directory. The project was therefore converted to one explicit root owner rather than creating an uncloneable submodule.

Before conversion:

```text
branch main
HEAD de3b1bfb3b166e87b2c53d5b9682ab05ae56aae6
worktree clean
86 tracked files
```

Verification before adoption:

```text
10 Vitest files / 173 tests: pass
Biome check: pass
production build: pass
Playwright Chromium: 19 tests pass
```

Recovery evidence:

```text
/tmp/artifacts-v12-rescue/2026-08-06/ownership-reconcile-2/git-recipe-book-before-root-ownership.bundle
SHA-256 61ff237bdd32786ca908744a3a24f9f279cf807a57ff6f57d70f5cd9339a9035

/tmp/artifacts-v12-rescue/2026-08-06/ownership-reconcile-2/git-recipe-book.git/
```

The complete child history, tag `v1.1.0`, and ws-bridge review refs remain recoverable. The parent now owns the exact former child tree and the V12 manifest declares root ownership plus the test, lint, build, and browser verification commands.

### Bathroom Guide 4.3 candidate

Path:

```text
bathroom-emergency-guide/bathroom-emergency-guide-4.x
```

Initial state:

- based on tagged v4.2.0;
- coherent 4.3 routing, safe-place, locale, large-print, and accessibility work;
- generated build tree, legacy 3.3 comparison tree, and `.ws-bridge` state were untracked.

Cleanup actions:

- ignored generated build output, `.ws-bridge`, and the legacy comparison checkout;
- fixed a stale parity literal from `Complete decision tree` to the actual durable source phrase `full text decision tree`;
- retained all 4.3 source and accessibility contracts;
- preserved executable mode on the validator.

Verification:

```text
route validation: pass
guide source/content validation: pass
13 chapters, 200,601 source characters
9 reviewed fact sets
8 evidence figures
5 route/access figures
HTML and all layout generation: produced
PDF accessibility verification: fail
```

Release blocker:

- Chromium `Page.printToPDF` fails in the current environment;
- the build falls back to WeasyPrint;
- fallback PDFs are intentionally rejected because they are untagged;
- A4/2, large-print, and standard PDFs therefore cannot yet satisfy the tagged-PDF release contract.

Rescue branch and commits:

```text
rescue/bathroom-guide-4.3-accessibility-20260806
7cb4944 checkpoint: preserve 4.3 routing and accessibility work
e8c5dfa chore: preserve validator executable bit
```

Rescue bundle:

```text
/tmp/artifacts-v12-rescue/2026-08-06/bathroom-guide-4.3.bundle
SHA-256 6fef662bc8af949e9a238893ffe7b12ae1e4967fcd0bab4cb0dcf37ecf90c257
```

Recommended release strategy:

- retain this branch as the canonical 4.3 source candidate;
- fix or replace the tagged-PDF backend in a controlled environment;
- do not weaken the tag verification to make fallback PDFs pass;
- after tagged PDFs and accessibility raster checks pass, fast-forward or merge into the canonical guide branch.

### Bathroom Guide alternate architecture

Path:

```text
bathroom-disaster/bathroom-emergency-guide-4.x-alt
```

Finding:

- genuinely different hub/subguide architecture;
- includes an eleventh `templates` subguide;
- three tests still hard-coded ten subguides;
- cover and planning notes form a coherent draft.

Cleanup actions:

- ignored `node_modules`;
- updated manifest/palette/mascot tests for the `templates` subguide;
- retained `notes.md`, `structure.md`, and the lockfile;
- checkpointed on a rescue branch.

Verification:

```text
25 tests: pass
diagram generation: pass
combined HTML assembly: pass
Chrome PDF: fail with Page.printToPDF protocol error
```

Rescue branch and commit:

```text
rescue/bathroom-guide-alt-20260806
e19763d checkpoint: preserve alternate guide cover and templates
```

Rescue bundle:

```text
/tmp/artifacts-v12-rescue/2026-08-06/bathroom-guide-alt.bundle
SHA-256 adfd452f70a833bff1b4ace386e3a4fb8f912d3b45dd3b1e0cb4bbec22d2c4f0
```

Parent action:

- keep this as an explicitly alternate product, not another copy of the canonical 4.x release;
- assign its own artifact ID and release contract if development continues;
- share common content through packages or generated imports rather than manual copy drift.

### Recursive bathroom duplicates

Paths:

```text
bathroom-disaster/bathroom-emergency-guide-4.x
bathroom-disaster/bathroom-emergency-guide-4.x/bathroom-emergency-guide-4.x
```

Content comparison:

- canonical 4.x candidate and the inner duplicate had 83 corresponding source files that were byte-identical before the canonical review fixes;
- the outer duplicate contains the inner duplicate recursively plus another source copy;
- the outer copy differs materially in only one additional CSS file among corresponding source paths;
- committing both would multiply the same work across three repositories.

Preserved evidence:

```text
/tmp/artifacts-v12-rescue/2026-08-06/bathroom-duplicate-outer-source.tar.gz
SHA-256 73dc442d342483c368823efa609844210075383e8b2b8afcbf220c681dfe7579

/tmp/artifacts-v12-rescue/2026-08-06/bathroom-duplicate-outer.diff
SHA-256 ddea8228e63f2518db22318eb35798d19fcabbd8bdb8ee569dcc61efe7181df9

/tmp/artifacts-v12-rescue/2026-08-06/bathroom-duplicate-inner-source.tar.gz
SHA-256 ea1ccb950970014b85039d5ea8ae69091bdc70fae3ccee9c1baa1db49e28f79f

/tmp/artifacts-v12-rescue/2026-08-06/bathroom-duplicate-inner.diff
SHA-256 7fad058144b01b671c3073232d05242f4e166c852995822ef2eef42ede56aaab
```

Recommended cleanup sequence:

1. designate `bathroom-emergency-guide/bathroom-emergency-guide-4.x` rescue branch as the only canonical 4.3 candidate;
2. inspect and port the outer copy’s `src/style-a4-half.css` divergence if still desirable;
3. compare hashes against the stored source snapshots;
4. remove the recursive inner directory;
5. remove or archive the outer duplicate directory;
6. keep the alternate architecture separately under a distinct project/artifact identity;
7. rerun nested-Git inventory and require zero undeclared duplicate roots.

The duplicate trees intentionally remain dirty until this destructive deduplication is explicitly authorized.

## Parent repository implications

Current parent submodule status:

```text
+5a7b946c94574b6764eef4850feb7bcf339ad8d7 badger-sprawl-runner
+3e4d7ed94e20e23b983410bcbc1619aae73a48b3 ethic-brawl
+5a1450f7c76af6a725e384402ba7e5bd9595c296 hyperblast-shooter
 37783861b7681852b0605a891a2b831c4cde82de v11-peer-daw
```

A leading `+` means the checked-out child revision differs from the parent gitlink. These differences are now explainable, but they should not be committed as one blanket parent pointer update.

Recommended parent commits, separately reviewed:

1. V11 Peer DAW ownership reconciled: keep the published parent pin until the verified child commits are published and deliberately promoted.
2. Hyperblast gitlink normalization only after comparing the recorded parent revision and the clean v0.8.0 child.
3. Badger gitlink update only after rescue-to-release reconciliation.
4. Ethic Brawl gitlink update only after rescue-to-1.7.x reconciliation and browser repair.
5. Inf Arrange ownership reconciled as a root-owned parent project with recoverable former Git history.
6. Git Recipe Book ownership reconciled as root-owned; resolve the Bathroom Emergency Guide only after its active main/alt integration work is committed and verified.
7. Remove recursive bathroom duplicates after snapshot verification.

## Recommended next execution order

1. Compare Badger rescue branch against `release/v1.3.0` by subsystem.
2. Compare Ethic rescue branch against 1.7.1/1.7.2 worktrees and repair browser startup.
3. Repair tagged-PDF generation for the canonical bathroom 4.3 branch.
4. Port any unique CSS from the bathroom duplicate outer copy.
5. Delete/archive the recursive duplicate bathroom trees.
6. Resolve Bathroom Emergency Guide ownership after the active `integration/v4-alt-full-synthesis` workspace is clean and its two sibling histories are preserved.
7. Normalize Hyperblast's parent gitlink after its recorded revision is reviewed.

## Definition of completion for this review phase

The manual review phase is complete when:

- each coherent child tree is committed or intentionally restored;
- every rescue branch is named as such and has documented release blockers;
- generated/evidence corpora are excluded from ordinary source commits;
- duplicate trees have recoverable snapshots;
- parent gitlink differences are explained rather than blindly recorded;
- destructive deduplication remains a separate, explicit operation.

## Ownership reconciliation addendum — 2026-08-06

### V11 Peer DAW

Ownership remains `submodule`. The parent gitlink stays pinned to the published and remotely reachable revision `37783861b7681852b0605a891a2b831c4cde82de` (`release: v11 peer daw 1.5.0`). The submodule checkout was realigned to that revision, removing the unexplained parent `M` state.

The verified unpublished work remains preserved on the child repository's local `main` branch at `5a45fe665fb880c4b5dcb46417e6ec30b6e92e6c`. It was deliberately not promoted into the parent gitlink because `origin/main` still resolves to `37783861b7681852b0605a891a2b831c4cde82de`; recording the unpublished commit would make a fresh parent clone unable to initialize the submodule.

The artifact manifest now records the canonical repository and immutable parent-owned revision. Restore the unpublished child work locally with:

```sh
git -C v11-peer-daw switch main
```

### Inf Arrange

Ownership changed from `untracked-nested-git` to `root`. No canonical remote exists, and the expected GitHub repository was verified absent, so a submodule or external declaration would require inventing an unavailable repository.

Before conversion, the complete standalone history at `dd0db5f204f7e2b09518d88967587703c9021647` was preserved as a verified Git bundle. The nested `.git` directory was moved outside the parent checkout, after which `inf-arrange/` became an ordinary parent-owned project directory. A native V12 registry manifest now declares root ownership, the `pnpm` compile pipeline, release directory, and verification commands.

Recovery evidence:

```text
/tmp/artifacts-v12-rescue/2026-08-06/ownership-reconcile/inf-arrange-before-root-ownership.bundle
SHA-256 37d67d1d80a44f0d84db8d9dc469d115a34e839a32af4ce917c90d01f7633009

/tmp/artifacts-v12-rescue/2026-08-06/ownership-reconcile/inf-arrange.git/
```

The bundle was verified as complete and contains `refs/heads/main` plus `HEAD` at `dd0db5f204f7e2b09518d88967587703c9021647`.

### Git Recipe Book

Ownership changed from `parent-tree-plus-nested-git` to `root`. No remote was configured for the former child repository, so preserving it as a submodule would have produced a parent checkout that other clones could not initialize.

The complete child object database was bundled before its `.git` directory was moved outside the checkout. The parent adopted all 86 child-tracked files and now owns the application directly. The manifest records version `1.1.0`, root ownership, the compile pipeline, and all verified checks.

Recovery evidence:

```text
/tmp/artifacts-v12-rescue/2026-08-06/ownership-reconcile-2/git-recipe-book-before-root-ownership.bundle
SHA-256 61ff237bdd32786ca908744a3a24f9f279cf807a57ff6f57d70f5cd9339a9035

/tmp/artifacts-v12-rescue/2026-08-06/ownership-reconcile-2/git-recipe-book.git/
```

The bundle was verified as complete and preserves `main`, tag `v1.1.0`, HEAD `de3b1bfb3b166e87b2c53d5b9682ab05ae56aae6`, and the prior ws-bridge review refs.
