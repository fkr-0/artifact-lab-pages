# Portfolio inventory and publication

`inventory.yml` is the editable authority for publication selection, recipes,
current native descriptors, and compatibility routes. Existing `artifact.json`
and `registry/sources.d/*.json` files are historical compatibility snapshots;
when an inventory exists, discovery consumes YAML. Build-only JSON is generated
under `hub-v13.5/.generated/`. Edit YAML to change the deployed portfolio.

The repository owns experiments, integration policy and the launcher. Independent
applications keep their repositories, lockfiles and release histories. Incorporating
a release into the portfolio does not incorporate its source ownership.

## Acquisition and preparation

Each artifact selects a named recipe. Several artifacts can share a recipe, which
runs once. `source.kind` controls acquisition; `prepare` controls what happens next.

| Source | `prepare: copy` | `prepare: build` |
| --- | --- | --- |
| `local` | Use declared files in this checkout | Run the root-owned project's recipe |
| `submodule` | Initialize the pinned child recursively; copy its release files | Initialize recursively; build a disposable checkout at that pin |
| `git` | Fetch a full immutable commit, recursively initialize children; copy | Resolve the same way; build a disposable checkout |
| `release` | Download hash-verified prebuilt bytes; safely extract/copy | Unsupported: prebuilt releases need no compilation |

`prepare: assemble` executes an explicit argv recipe like build, for document
rendering and composition. `copy` runs no install/build commands; optional `checks`
are separate verification commands. An omitted install/build command is never
inferred from package.json. Disabled reference recipes are visible but do not run.
All enabled outputs are required; a missing output stops publication even if an
older catalog described it as provisional. Catalog links/text have no recipe.

```yaml
recipes:
  static-child:
    source:
      kind: submodule
      path: static-child
      repository: https://github.com/example/static-child.git
      revision: "0123456789abcdef0123456789abcdef01234567"
      recursive: true
    prepare: copy
    output: public
    expectedFiles: [index.html]

  compiled-child:
    source:
      kind: git
      repository: https://github.com/example/compiled-child.git
      revision: "0123456789abcdef0123456789abcdef01234567"
      recursive: true
    prepare: build
    install: [[pnpm, install, --frozen-lockfile]]
    commands: [[pnpm, run, build]]
    output: dist
    expectedFiles: [index.html]

  prebuilt-child:
    source:
      kind: release
      url: https://example.org/releases/site.tar.gz
      sha256: "<64 lowercase hexadecimal characters>"
      format: tar.gz
    prepare: copy
    output: .
    expectedFiles: [index.html]
```

The parent gitlink is authoritative for a submodule. The recipe's revision must
agree with it and with the native descriptor. Foreign sources use their inventory
commit as authority. `recursive: true` means nested submodules are initialized,
not that a build is requested. HTTPS public repositories are the initial scope.

Commands are arrays, never interpolated shell strings. They run in the resolved
source root, or its contained `cwd`. `output` is relative to the source root,
including when `cwd` is different. Build/assemble outputs cannot be the source root.
Use the project's pinned package-manager declaration and committed lockfile. Source
builds require committed inputs. Resolved inputs and disposable child build trees
live in ignored `.cache/`; a cached output never substitutes for a requested build.

Artifacts retain their full descriptor under `manifest` and may retain an explicit
`compatibility` route record. Existing legacy routes use the same assembled payload;
compiled legacy apps receive their compiled output rather than development HTML.
The V12 44-route gate is retained, alongside newer native entries and documents.
`publish: reference` records and `workspaceOnly` items are inventory, not deployment.

## Commands

Node 24+ and the root-pinned pnpm are required. From a fresh checkout:

```sh
git submodule update --init --recursive
corepack enable
pnpm install --frozen-lockfile
pnpm inventory          # list records and enabled recipes
pnpm plan               # display the acquisition/preparation work
pnpm inventory:check    # descriptors and Git ownership
pnpm build              # run recipes, assemble and qualify dist/site
pnpm check              # root, tooling, hub and Hyperblast contracts
pnpm verify:site        # exact file set, sizes, SHA-256, source commit
pnpm serve              # serve dist/site only, on 127.0.0.1:8080
```

`./artifacts-serve [port]` is also a qualified-site preview. No build or source-tree
fallback occurs during preview. For explicit legacy source debugging only, use
`ARTIFACTS_SOURCE_PREVIEW=1 ./artifacts-serve`. The older sourced server functions
and browser wrapper are compatibility development tools, not publication previews.

`pnpm build` requires a clean committed checkout. Make candidate changes in an
isolated branch/worktree and commit them before qualification. It builds everything
selected by the inventory and writes one complete site, including launcher, catalog,
route/parity reports, source receipt, asset hashes and `SITE_RECEIPT.json`.
It does not publish. The default hub build path is its containing repository;
there is no sibling-checkout or home-directory requirement.

## Packaging and deployment

`./artifacts-package [output-directory]` verifies and packages the existing
`dist/site` without rebuilding or adding files. It emits a complete-site tar.gz and
an archive SHA-256. Preserve that pair in a durable release location for rollback.

To import a previously qualified complete site without compiling:

```sh
SITE_URL=https://example.org/qualified-site.tar.gz \
SITE_SHA256=<archive-sha256> SITE_REVISION=<full-source-commit> pnpm import:site
SITE_REVISION=<full-source-commit> pnpm verify:site
pnpm serve
```

The package must contain `SITE_RECEIPT.json` at its root. The download hash, archive
containment, receipt commit and complete payload are verified. This differs from
an individual prebuilt app recipe: it replaces the complete assembled site.

Pull requests run source build, contract checks and browser smoke, but cannot deploy.
Main runs the same work then uploads `dist/site` and deploys those bytes through the
existing Pages owner. Only the deploy job gets Pages/OIDC write permissions. Manual
workflow inputs `site_url`, `site_sha256` and `site_revision` support verified
complete-site redeployment without running project builds. Keep secrets out of
URLs and inventory; source-build jobs have no publication credentials.

`./artifacts-deploy --dry-run` verifies the same site and displays an explicit VPS
mirror destination without network access. Configure `ARTIFACTS_VPS_HOST` and
`ARTIFACTS_VPS_PATH`; omit `--dry-run` to rsync the exact site. Pages stays the primary
publication owner. Old package/deploy implementations are available only with
`ARTIFACTS_LEGACY_TOOLS=1` for historical recovery, not normal publication.

Static hosting serves browser apps and documents. Backends remain separately hosted
services declared by their applications; this pipeline does not start them.
