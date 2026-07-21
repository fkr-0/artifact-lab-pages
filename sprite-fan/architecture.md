# Sprite Fan architecture decision

## Decision

Use `sprite-fan/src/` as the canonical editing surface and generate the public
standalone `sprite-fan/atlas-studio.html` artifact reproducibly.

The generated file remains the stable browser and app-hub URL. It must not be
edited directly.

## Why the decision changed

The original single-file decision was appropriate while behavior was weakly
tested. The split criteria have since been met:

- the DOM/canvas controller grew beyond comfortable single-file maintenance;
- reusable image, workflow, export, and GIF logic needed direct tests;
- the build now reproduces the deployable standalone HTML byte-for-byte;
- browser workflows run against that generated artifact.

Keeping duplicate test-only and production algorithms became a larger risk than
the small deterministic assembly step. The source split removes that drift while
preserving the zero-install standalone result.

## Current boundaries

```text
sprite-fan/
  src/
    atlas-studio.html   # HTML shell with injection markers
    studio.css          # UI styling
    config-core.js      # imported/persisted config normalization
    ui-navigation.js    # keyboard and focus decisions
    workflow-core.js    # workflow availability and redirects
    image-io.js         # object URL and image loading lifecycle
    pixel-analysis.js   # metrics, components, pinholes, hashes, jitter review
    frame-operations.js # repair, morphology, cleanup, and alignment transforms
    spec-guide.js       # requirement evaluation and display-line formatting
    export-core.js      # review reports, manifests, page plans, safe names
    gif-core.js         # deterministic GIF encoder
    studio.js           # DOM/canvas orchestration
  build-atlas-studio.mjs
  atlas-studio.html     # generated public artifact
```

Pure modules use classic-script globals because the final output is one
self-contained HTML file. Node contract tests load those exact production
scripts in a VM; browser E2E tests load the assembled artifact.

## Build contract

The build must:

- emit one standalone browser-loadable HTML artifact;
- preserve the public filename and existing app-hub links;
- preserve module order explicitly;
- reject embedded closing `</script>` or `</style>` sequences;
- support a source/output drift check;
- require no development server beyond the existing artifact server.

## Testing contract

Changes to a pure boundary need direct Node coverage. Changes to user-visible
workflows need Chromium coverage against `atlas-studio.html`. Pixel operations
must test immutability, malformed input, deterministic output, and undo/export
integration where applicable.

Focused GIF export lives in `src/gif-core.js` with direct binary tests and a real
Chromium decode regression. Future GIF work should remain focused import/export
modules rather than copying the separate GIF-creator UI.

## Remaining architecture work

Continue reducing `studio.js` through smaller repair, timeline, and
contract-export controllers. New modules should be
introduced only when they establish a meaningful testable boundary, not merely
to reduce line count.
