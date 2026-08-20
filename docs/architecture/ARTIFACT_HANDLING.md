# Artifact Handling Standard

Status: normative V12 repository contract
Applies to: every item exposed by an artifacts catalog, deployment, download page, or hub

## 1. Core rule

An artifact is a product boundary, not a location inside a hub.

Every catalog item must be classified independently along five axes:

1. product kind;
2. source shape;
3. Git ownership;
4. build mode;
5. release shape.

These axes must not be collapsed into one overloaded `type` field. For example, a
Markdown document may be a one-file source, assembled into one HTML release, owned by
the root Git repository. A game may be a project source, compiled into a directory
release, and owned by a submodule.

The hub consumes releases and metadata. It does not own artifact implementations,
project build commands, shared libraries, or deployment inclusion rules.

## 2. Required invariants

Every active local artifact MUST:

- have one stable ID and one canonical manifest;
- identify its source root and ownership unambiguously;
- produce or identify a self-contained release boundary;
- run or remain readable without the hub;
- avoid imports from the hub, parent paths, or sibling artifacts at runtime;
- declare every shared library and network dependency;
- be staged into a fresh output directory before publication;
- receive a release receipt containing source identity and file hashes;
- pass the verification profile appropriate to its product kind.

Every catalog-only item MUST still have a manifest, but links and inline text do not
need a local release directory.

## 3. Classification axes

### 3.1 Product kind

| Kind | Use | Local release required |
|---|---|---:|
| `application` | Interactive browser application, game, editor, studio, or tool. | yes |
| `document` | Markdown, HTML, PDF, guide, report, tutorial, or other readable publication. | normally yes |
| `download` | APK, archive, executable, dataset, image pack, or another primary downloadable file. | yes |
| `link` | A deliberately external URL not built or mirrored by this repository. | no |
| `text` | A short catalog note, announcement, warning, or explanatory block. | no |
| `legacy` | Preserved compatibility surface that is not governed as a current application. | yes or external |

`text` is not a substitute for a document. Use it only when the complete content is
small enough to live in the manifest and does not need its own URL, history, download,
or renderer.

### 3.2 Source shape

| `source.kind` | Correct use |
|---|---|
| `file` | Exactly one authored source file. A sidecar manifest is kept in `registry/sources.d/` so the product can remain genuinely one-file. |
| `directory` | A root-owned folder containing one artifact or a package that publishes several explicit artifact entries. |
| `project` | A full software/document project with its own tests, dependencies, build process, or release cadence. |
| `external` | A remote resource the repository intentionally does not build. |
| `inline` | Manifest-contained text only. Never use for executable HTML or scripts. |

### 3.3 Git ownership

| `source.git.mode` | Meaning |
|---|---|
| `root` | Source is tracked by the artifacts repository. No nested `.git` may exist below the source root. |
| `submodule` | Source is a declared Git submodule and the parent tracks only its gitlink. |
| `external` | Source is an external checkout or fetched release pinned by repository URL and revision/hash. The parent does not track its mutable files. |
| `none` | Only valid for external links, inline text, or generated inputs with another declared provenance source. |

The following state is prohibited:

```text
parent repository tracks a directory as ordinary files
AND
that directory contains its own .git repository
```

A project does not automatically require a separate Git repository. A small project
may use `source.kind: project` with `source.git.mode: root`. The distinction is build
and lifecycle complexity, not Git fashion.

### 3.4 Build mode

| `build.mode` | Correct use |
|---|---|
| `none` | Source bytes are already release bytes. Verification and staging still occur. |
| `assemble` | Deterministic composition transforms source into release: Markdown rendering, HTML inlining, vendoring, generated indexes, or document conversion. |
| `compile` | A compiler, bundler, package-manager script, or project pipeline produces the release. |
| `external` | No local build is performed because the item is a deliberate external link. |

Build commands MUST be argument arrays. Shell strings are rejected unless a migration
adapter marks them provisional. Commands execute with an explicit working directory,
clean stage, bounded environment, and no implicit hub directory.

### 3.5 Release shape

| `release.kind` | Meaning |
|---|---|
| `file` | One distributable file, commonly HTML, Markdown, PDF, image, or archive. |
| `directory` | A self-contained static directory with an entrypoint. |
| `download` | One or more downloadable files, optionally with a standalone landing page. |
| `external` | A validated remote URL. |
| `inline` | Manifest-contained catalog text. |

## 4. Decision table

| Case | Product | Source | Git | Build | Release | Manifest location |
|---|---|---|---|---|---|---|
| Single self-contained HTML | application/document | file | root | none | file | `registry/sources.d/<id>.json` |
| HTML plus local JS/CSS/assets | application | directory | root | none | directory | source root `artifact.json` |
| Single HTML that uses shared libraries but must remain one file | application | file | root | assemble | file | registry sidecar |
| Static folder requiring copied versioned libraries | application | directory | root | assemble | directory | source root |
| Vite/React/game/software project | application | project | root/submodule/external | compile | directory or file | project root; root keeps a reference for non-root ownership |
| Markdown published as a web page | document | file | root | assemble with `markdown-html` | file | registry sidecar |
| Markdown intentionally offered raw | document/download | file | root | none | file/download | registry sidecar |
| PDF or DOCX generated from sources | document/download | project or directory | root/submodule | compile/assemble | file/download | source/project root |
| APK/archive with landing page | download | directory/project | root/submodule | none/compile | download | source/project root |
| Remote website or repository link | link | external | none | external | external | registry sidecar |
| Short informational catalog note | text | inline | none | none | inline | registry sidecar |
| Old hub/tool preserved unchanged | legacy | file/directory/project | root/submodule | none/compile | file/directory | source root or sidecar |

## 5. Case instructions

### 5.1 One-file artifacts

Use when the complete executable/readable product is one file and no local runtime
dependency is required.

Required handling:

1. Keep the source file independent; do not move its implementation into the hub.
2. Store metadata in `registry/sources.d/<id>.json`.
3. Use `source.kind: file`, `build.mode: none`, and `release.kind: file`.
4. Stage the file under `dist/artifacts/<id>/<version>/`.
5. Verify it from that directory with the hub unavailable.

If it imports local JavaScript, CSS, fonts, images, or WASM, it is not a one-file
artifact. Either change it to a directory artifact or use an `assemble` step that
embeds those dependencies and proves the emitted release is one file.

### 5.2 Directory artifacts without a build

Use for authored static folders whose existing files are already deployable.

Required handling:

- place `artifact.json` at the source root;
- declare the entrypoint and explicit include/exclude policy;
- stage only the declared artifact closure, never the entire top-level directory by
  inference;
- exclude tests, reports, caches, source-only docs, nested VCS data, and temporary
  outputs;
- audit every relative URL from the staged entrypoint.

A directory may publish several artifacts, but each published entry receives a stable
ID, release root, entrypoint, and receipt. A shared source directory is not permission
to deploy every file in that directory.

### 5.3 Directory artifacts with assembly

Use when the authored directory needs deterministic preparation but not a general
software compiler.

Examples:

- vendor exact shared-library releases;
- inline CSS/JavaScript into one HTML output;
- render a Markdown collection into static HTML;
- generate an index from declared files;
- copy a curated subset of assets.

Assembly MUST be reproducible, path-contained, receipt-producing, and unable to mutate
the source directory.

### 5.4 Projects without a build

Use `source.kind: project` even when no compile step exists if the artifact has a
project lifecycle: extensive tests, release evidence, package metadata, several
products, or independent versioning.

Use `build.mode: none`; do not misclassify it as a simple directory merely to avoid
modeling ownership. The release selector must still identify the exact deployable
subtree.

### 5.5 Projects with a build

Required handling:

1. The project owns its dependencies, tests, and build command.
2. The parent manifest/reference declares the project checkout and expected release
   output, not project-specific implementation steps scattered through root CI.
3. The build runs in the project root and writes to a project output directory.
4. Artifact tooling copies only the declared release output into a fresh stage.
5. The parent records child revision, command argv, output hashes, and verification.

For submodules, commit child work first and update the parent gitlink in a separate
commit. For external checkouts, pin an immutable revision or release hash.

### 5.6 Markdown

Choose one of two explicit contracts:

#### Published document

```json
{
  "kind": "document",
  "source": { "kind": "file", "path": "docs/example.md", "git": { "mode": "root" } },
  "build": { "mode": "assemble", "renderer": "markdown-html" },
  "release": { "kind": "file", "entrypoint": "index.html" }
}
```

The result is standalone HTML and does not depend on a hub Markdown viewer.

#### Raw source/download

Use `build.mode: none` and `release.kind: file` or `download`. The launch action must
make clear that the user receives raw Markdown.

Do not make a current document depend permanently on a query string into a hub-owned
Markdown renderer. A generic renderer may be a versioned assembly package, not a hub
implementation dependency.

### 5.7 Simple external links

Use `kind: link`, `source.kind: external`, `build.mode: external`, and
`release.kind: external`.

Required fields:

- HTTPS URL unless an explicit local-development policy allows otherwise;
- title and description explaining that the destination is external;
- optional health-check policy;
- no fake local release path;
- no silent mirroring assumption.

Links are catalog records, not artifacts built by the repository. They remain subject
to ID uniqueness, URL safety, and availability reporting.

### 5.8 Simple text

Use `kind: text`, `source.kind: inline`, `build.mode: none`, and
`release.kind: inline`.

Inline text MUST:

- contain no executable HTML or scripts;
- remain short and presentation-neutral;
- be rendered by the hub as escaped text or sanitized Markdown according to the
  manifest's declared format;
- not claim launch modes that require a URL.

When content grows into a tutorial, essay, changelog, or policy, move it into a
document artifact.

### 5.9 Downloads

A download artifact identifies the downloadable file as the product. A landing page
is optional but, when present, must itself be standalone inside the release directory.

The receipt records hashes and media types for every downloadable file. Catalog launch
actions distinguish `open landing page`, `view`, and `download`.

### 5.10 Legacy items

Legacy status is explicit and does not exempt an item from path containment or safe
launching.

Preserve a whole legacy host as one artifact unless individual embedded tools are
actually extracted into independent releases. Query routes such as
`legacy-tools.html?tool=x` are migration aliases, not durable modern product
boundaries.

## 6. Shared libraries

Shared code lives under `packages/`, has a version and release descriptor, and is
delivered through one of:

| Delivery | Rule |
|---|---|
| `inline` | Assembly embeds exact library bytes into a file release. |
| `vendor` | Assembly copies exact library release files into the artifact stage and records hashes. |
| `bundle` | A project compiler includes the dependency; its lockfile/build receipt proves the version. |

An artifact MUST NOT import `app-hub-v12/lib/...`, `app-hub-v11/lib/...`, or a sibling
artifact path. Generated vendor files are not edited manually.

## 7. Manifest location and authority

```text
file source       -> registry/sources.d/<id>.json
inline/link       -> registry/sources.d/<id>.json
directory source  -> <source-root>/artifact.json
root project      -> <project-root>/artifact.json
submodule project -> canonical child manifest + root reference descriptor
external project  -> canonical remote manifest or root locked reference descriptor
```

JSON is the canonical enforcement format for the first V12 implementation. YAML may be
added as an input syntax later, but tooling must normalize it to the same schema before
validation.

## 8. Lifecycle

```text
author source
  -> validate manifest and ownership
  -> resolve/build libraries
  -> build or assemble in isolation
  -> stage a fresh release root
  -> audit dependency closure
  -> run standalone verification
  -> emit receipt and hashes
  -> generate catalog entry
  -> assemble site
  -> run site launch smoke
  -> deploy immutable release
```

No step may copy an inferred top-level directory merely because an entrypoint happens
to be inside it.

## 9. Enforcement levels

### Level 1: descriptive

- manifest parses;
- ID and classification fields exist;
- source is discoverable.

### Level 2: structural

- paths are contained;
- ownership matches Git topology;
- source/build/release combinations are legal;
- local entrypoints exist.

### Level 3: release

- stage is fresh and attributed;
- file hashes and library provenance exist;
- no undeclared local dependency escapes the stage;
- required output files exist.

### Level 4: behavioral

- artifact works without the hub;
- browser/document/download checks pass;
- accessibility, security, lifecycle, and offline claims are verified.

New artifacts should reach Level 4 before being marked `active`. V11-adapted entries
may initially be marked `provisional` and must expose their missing level explicitly.

## 10. Review checklist

Before accepting an artifact or migration, answer all of these:

```text
[ ] Is the product kind accurate?
[ ] Is the source shape accurate?
[ ] Is exactly one Git owner authoritative?
[ ] Is the build mode explicit and reproducible?
[ ] Is the release boundary self-contained?
[ ] Does the artifact work without a hub?
[ ] Are shared libraries versioned and delivered explicitly?
[ ] Are Markdown, text, links, and downloads modeled directly?
[ ] Does staging avoid source mutation and path inference?
[ ] Does the receipt attribute every released file?
[ ] Can the catalog omit the hub and still describe the release?
[ ] Can the release be rolled back without reconstructing source state?
```
