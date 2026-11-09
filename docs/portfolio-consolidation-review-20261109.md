# Artifact Lab consolidation review and proposed design

Date: 2026-11-09. Status: reviewed proposal, awaiting design approval.

## Recommendation

Keep Artifact Lab as an incubation workspace, release integrator, catalog, and
static publication owner. Integrate the V13.5 hub and publisher into this repository.
Keep independent applications in their existing repositories. A published application
is an input to this portfolio; publishing it here does not transfer source ownership.

Use the existing consolidation candidate as implementation material, reconciled with
current upstream main. Do not replace main with the old local checkout or start an
orphan history. A clean new main means a coherent, tested continuation of history.

## Observed repository state

Fetched both configured top-level origins during this review.

| Repository/ref | Observed state | Consequence |
| --- | --- | --- |
| artifacts working checkout | `fix/v13.5-merge-settlement`, `016a6aa0`; 9 commits unique versus origin/main, 18 upstream-only | Neither side alone is the complete portfolio |
| artifacts local main | `0ff31d83`, 27 commits behind origin/main | Do not use local main as the integration baseline |
| artifacts origin/main | `872f60b6` | Latest hosted Pages workflow run succeeded |
| consolidation/hub-v13-5-ready-20261022 | `5402a5e2`; 39 unique commits, missing 3 origin/main commits | Strong migration starting material, not a finished replacement |
| artifacts-v13.5 main | `7f4c563`, clean, matches fetched origin/main | Current standalone hub source |
| v13hub main | `20b0cb1`, clean, no configured remote | Earlier distinct product; retain as reference and optional feature source |
| fix/ethic-brawl-pages-20261101 | `9a10ea1a`, 2 commits beyond current origin/main | Review its 1.9.3 publication repair separately; not already in main |

The working checkout contains existing Scratch Studio code, metadata, tests, docs,
and prompts changes. Ethic Brawl remains a tracked gitlink but is uninitialized
locally (`git submodule status` starts with `-`); Git status shows its missing
directory as a deletion. This is not evidence that its source should be deleted.
None of these changes were staged or overwritten for the review.

The existing Org-roam Artifact Lab project and Codex profile resolve successfully.
The supplied legacy skill path is absent; the actual checkout is under code/.

## Findings, in priority order

1. **An old candidate can lose published content.** The ready branch lacks upstream
   commits `d33ce244`, `057d4cd4`, and `872f60b6`. These introduce the Bewusstsein
   publication/catalog entry and correct workflow syntax. The migration must merge
   these behaviors, including supplement verification, into its monorepo receipt
   path. Replacing the current tree or taking its workflow wholesale is unsafe.
2. **Consolidation is substantially implemented but not generalized.** The ready
   branch embeds `hub-v13.5/`, creates a single-commit/hub-tree receipt, and removes
   the secondary hub checkout. Its workflow still hard-codes Revealive, Badger,
   PeerJS, and Git Recipe Book install/build steps. Its qualification script checks
   existing outputs; it is not the complete project build planner. Historical
   qualification notes mention additional builds outside that workflow.
3. **Foreign project resolution is missing.** The manifest schema accepts project
   sources with Git mode external, but `tooling/artifactctl/src/build.mjs` resolves
   an already-present local source and invokes one compile argv. It does not clone
   a repository, resolve a remote pin, install dependencies, or fetch a verified
   release archive. Existing recursive submodule checkout covers only gitlinks.
4. **There are competing publication paths.** Root `build:site` targets the older
   native V13 pipeline, while Pages uses the V13.5 assembler and adapter. Serving
   defaults to the source tree using legacy deployment mounts. A source preview
   can therefore differ from the directory Pages uploads.
5. **The monorepo default remains machine-dependent.** The ready branch's embedded
   `hub-v13.5/scripts/build.mjs` still defaults to the user's home code/artifacts
   directory. The qualification wrapper overrides this, but invoking the hub
   build directly can read another checkout. Default to the containing repository.
6. **Schema validation is weaker than release readiness.** Current validation
   reports 24 valid manifests and one missing-source warning for required Ethic
   Brawl. Keep descriptive validation useful, but release qualification must fail
   on missing required sources/outputs. Also, 24 native manifests and a larger
   legacy-derived catalog are different populations; do not compare their counts
   as if all catalog records already have native descriptors.
7. **Immutable source checks need tightening.** The ready runner checks top-level
   submodule pins, ignores untracked files inside children, and allows modifications
   to two Badger generated dist paths. Those allowances are not proof that every
   consumed byte derives from the recorded commit. Check nested submodules and
   clean inputs before building; attribute generated output after building.
8. **V13 and V13.5 have different product scopes.** V13Hub includes collection,
   peer-lobby, and game-handoff contracts. V13.5 deliberately prioritizes browse,
   search, filter, and open with full payload assembly. A wholesale V13 merge would
   reintroduce product decisions that the convergence release explicitly removed.
   Preserve the source/history; port features only as separately chosen work.

## Target ownership and layout

Retain `hub-v13.5/` initially to reuse the history-preserving subtree candidate.
Call the product Artifact Lab in user-facing copy; the directory name need not
drive future hub version numbers. Avoid moving every application during cutover.

```text
registry/             integration descriptors and explicit publication policy
hub-v13.5/            one active catalog/launcher and its assembly code
tooling/artifactctl/  source resolution, build, verification, composition
packages/, lib/       existing shared code with explicit release contracts
<incubating apps>/    existing root-owned sources; retain paths for now
<submodules>/         independent sources pinned by existing gitlinks
publications/         root-owned document release inputs
.cache/sources/       ignored foreign checkouts, keyed by repository and commit
dist/site/            generated complete site, sole preview/deploy input
docs/                 current contract plus clearly marked historical plans
```

Do not make the full workspace, archives, caches, or source root deployable by
default. Existing source-control history is retained. Cleanup of old archives and
reference snapshots is separate from functional consolidation.

## One release contract, several input methods

Extend the existing manifest schema and tooling rather than introducing a second
registry. Project-internal build configuration remains owned by each project;
the portfolio descriptor provides the integration recipe when necessary.

| Input method | Locked identity | Portfolio action |
| --- | --- | --- |
| Root-owned static file/directory | parent commit and descriptor | Copy or assemble declared release files |
| Root-owned compiled project | parent commit and project lockfile | Install, build, verify, stage output |
| Existing submodule | parent gitlink; descriptor must agree | Initialize recursively, install/build if declared |
| Foreign repository | repository URL and full commit | Fetch isolated checkout; verify HEAD; install/build |
| Prebuilt release | fixed download URL and SHA-256, plus source identity when available | Fetch, verify, extract declared output; no compile |
| External link/inline text | validated descriptor | Catalog only; no pretend local output |

Use submodules where already established or where browsing pinned source inside
this checkout is useful. Prefer foreign checkout descriptors for new integrations
that only need CI assembly. Do not support two mutable pin authorities: gitlinks
are authoritative for submodules; foreign descriptors are authoritative otherwise.
Floating branches/latest URLs may be update-discovery inputs, never release locks.
Keep current public source integrations as scope; private-source credential setup
is not required for the first cutover.

Install/build/verify commands are argv arrays with explicit cwd and declared output.
Record package-manager/runtime versions, lockfile identity, child revision, and
release hashes. Declarations support ordered commands and explicit dependencies;
build each source project once even when it publishes several catalog entries.
No general task scheduler or arbitrary plugin framework is needed.

Source builds run from fresh resolved inputs without publishing credentials.
Archive extraction must reject traversal and escaping links. Required integration
failures stop the release; optional omissions require explicit catalog policy.
Never infer success from a stale dist folder, a package version string, or a cache
hit. A prebuilt package is a complete artifact release, not an unverified replacement
for the whole site. Whole-site deployment consumes only a previously qualified
complete site package and its matching receipt.

## Common command and CI behavior

Proposed commands, not implemented in this review:

```text
artifactctl validate       descriptor and ownership checks
artifactctl plan           resolve release inputs and display work
artifactctl build          acquire, install/build or verify prebuilt, stage
artifactctl site           compose launcher, catalog, routes, receipt into dist/site
artifactctl verify-site    verify complete staged file set and launch routes
artifactctl serve          serve dist/site on loopback; no build or source fallback
```

Root package scripts should expose a small `check`, `build`, `serve` interface to
these operations. Existing advanced commands can remain compatibility aliases.
An explicit development mode can use working sources; it produces no immutable
publication claim and cannot be accidentally selected by CI.

The CI graph is:

```text
validate -> resolve inputs -> build/verify releases -> compose site
         -> verify hashes + routes + browser launch checks -> upload site
                                                        -> deploy same site
```

Run validation/qualification for pull requests, with deployment restricted to the
deployment owner's main or an explicit trusted manual deployment. Builds receive
read-only permissions; Pages write/OIDC permissions belong to the deploy job.
Use the same scripts locally and in CI. Caches accelerate resolved immutable inputs;
they do not decide what version is built. A later optimization may parallelize
independent projects after the sequential contract works.

Support both build-from-source and prebuilt inputs in one composition pass. A
deployment-only operation verifies an already-qualified complete site package and
uploads those exact bytes without rerunning builds. Preview serves those same
bytes. Pages remains a static host; backend services are external dependencies,
not processes this workflow will host.

GitHub's custom Pages workflow supports uploading generated static output and
deploying that artifact: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
Workflow artifacts are suitable for passing build output between jobs; retained
release inputs need a deliberate durable release location rather than depending
on temporary run artifact retention:
https://docs.github.com/en/actions/concepts/workflows-and-actions/workflow-artifacts

## Reconciliation and cutover sequence

1. Create an isolated integration worktree from freshly fetched origin/main.
   Record existing dirty work; leave it in the user's checkout. Bring in the
   ready branch with a real merge and review overlapping publication code,
   catalog metadata, tests, and ignore rules. Preserve later hub changes if any.
2. Review the separate Ethic Brawl publication branch against current main and
   the child's reachable release pins. Carry its demonstrated runtime repair
   if still applicable; do not assume its 1.9.3 pin is already approved by main.
3. Preserve all committed Scratch Studio and quiz work from the migration branch.
   Keep the currently uncommitted Scratch Studio redesign outside the candidate;
   it remains available for separate review and integration.
4. Finish the one-checkout paths and current publication supplements. Ensure
   every required current route survives, including Bewusstsein and the Roborock
   article/figures. Capture a current expected route inventory; the old 44-route
   V12 baseline remains a minimum compatibility gate, not the complete site.
5. Add the declarative resolver/build/prebuilt paths and route existing CI builds
   through them. Consolidate build output and preview on dist/site. Update README
   and server entrypoints so the documented path matches publication.
6. Qualify the final committed candidate from a fresh recursive clone with no
   sibling repositories, home-directory defaults, or old dist directories. Test
   submodule and foreign source builds, verified prebuilt input, wrong pins,
   missing required outputs, archive containment, and tampered stage rejection.
7. Run root/hub/adapter checks, site browser smoke and exact route/file checks.
   Produce a complete immutable site package and receipt for the exact commit.
   Historical test totals must not stand in for these fresh checks.
8. Promote via a reviewable main integration, run hosted CI, deploy the qualified
   package, and check public routes/receipt. Keep the previous qualified site
   package for rollback by redeployment; avoid force-pushing source history.
9. Only after verified cutover, mark standalone V13.5 as superseded and document
   V13Hub as historical/feature reference. Repository archival or deletion is a
   separate explicit action; independent application repositories stay active.

Implementation details left to the builder: exact CLI flag spelling, schema
extension names, cache implementation, and internal module boundaries. Preserve
existing contracts wherever they can express the proposed behavior.

## Evidence from this review

- Standalone V13.5 tests: 26/26 pass.
- Current working checkout publication adapter tests: 17/17 pass.
- Current native registry: 24 valid, zero invalid, one missing-source warning.
- Latest hosted Pages run on origin/main: success,
  https://github.com/fkr-0/artifact-lab-pages/actions/runs/40495808018
- No open pull requests returned by the repository query.
- No full clean-clone build, browser smoke, new deployment, or live route audit
  was performed in this review. Historical candidate results are documentary
  evidence only. No merge, application code change, push, or deployment occurred.

## Decision requested

Approve this scope: reconcile the existing ready candidate with current main,
retain independent app ownership, implement the shared source/prebuilt release
pipeline, and use one generated site directory for preview and deployment.
The next deliverable after approval is a concrete implementation plan and isolated
candidate; production promotion follows its exact-commit verification.
