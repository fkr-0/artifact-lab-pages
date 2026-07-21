# Sprite Fan source split plan

## Goal

Keep `sprite-fan/atlas-studio.html` as the public standalone artifact while moving day-to-day editing into source modules that can be tested and bundled reproducibly.

## Constraints

- The emitted artifact must remain a single browser-loadable HTML file.
- Existing URLs and app-hub links to `sprite-fan/atlas-studio.html` must keep working.
- Existing `test:sprite-fan` and `e2e:sprite-fan` coverage must run against the emitted artifact, not only the source files.
- The split should not require a dev server beyond the existing artifacts server.
- The first split should avoid behavior changes.

## Proposed layout

```text
sprite-fan/
  src/
    atlas-studio.html
    studio.css
    studio.js
    config.js
    image-io.js
    pixel-analysis.js
    frame-operations.js
    review-report.js
    manifest-export.js
    gif-export.js
    spec-guide.js
    test-hooks.js
  dist/
    atlas-studio.html
  build-atlas-studio.mjs
```

## Migration phases

1. Add the build script while keeping `atlas-studio.html` as the checked-in source of truth.
   - Script extracts CSS and JS sections into generated scratch files.
   - Script immediately reassembles byte-identical output.
   - Contract: generated output equals current standalone artifact.

2. Move pure logic first.
   - Move config sanitization, spec-guide rendering, GIF encoding, review report generation, and manifest construction into source modules.
   - Keep DOM wiring in `studio.js` until the pure pieces are stable.
   - Unit-test pure modules with `node --test`.

3. Move CSS and HTML shell.
   - Keep `src/atlas-studio.html` as a readable shell with injection markers.
   - Emit `dist/atlas-studio.html`, then copy or promote it to `sprite-fan/atlas-studio.html` for deployment.

4. Switch tests to generated artifact.
   - `test:sprite-fan` should run the builder, syntax-check the generated inline script, then run existing contracts.
   - `e2e:sprite-fan` should load the generated artifact.

5. Remove direct edits to generated output.
   - Add a byte-for-byte contract that detects source/output drift.
   - Document `src/` as the editing surface and `atlas-studio.html` as generated release output.

## Current implementation state

The checked-in standalone artifact is now assembled from an HTML shell, CSS,
and ordered JavaScript modules. The following pure boundaries have been moved
out of the DOM/canvas controller and are covered directly by Node contracts:

- `config-core.js`: imported/localStorage config normalization and bounds;
- `ui-navigation.js`: roving tab state and modal focus decisions;
- `workflow-core.js`: workflow progress, redirects, and availability;
- `image-io.js`: object-URL creation, error handling, and exactly-once cleanup.
- `pixel-analysis.js`: frame metrics, connected components, holes, hashes, and
  cross-frame issue reports;
- `frame-operations.js`: immutable repair, morphology, cleanup-pipeline, and
  anchor/pixel alignment transforms;
- `export-core.js`: review reports, manifests, page plans, and safe filenames;
- `gif-core.js`: deterministic palette and long-frame-safe GIF encoding;
- `spec-guide.js`: deterministic requirement evaluation and display-line formatting.

`studio.js` remains the DOM/canvas orchestration layer and no longer owns copies
of the production repair algorithms.

## Extraction roadmap

Completed:

- `config-core.js`: schema normalization and safe defaults for imported/localStorage configs;
- `ui-navigation.js`: keyboard navigation and modal focus decisions;
- `workflow-core.js`: workflow state, availability, and redirects;
- `image-io.js`: object URL lifecycle and image loading error handling.
- `export-core.js`: deterministic review reports, generic/target manifests,
  page plans, and filesystem-safe download names.
- `gif-core.js`: deterministic palette construction and a long-frame-safe GIF
  encoder with bounded-width LZW clear blocks.
- `pixel-analysis.js`: frame metrics, connected components, pinhole detection,
  stable hashing, and sequence-level jitter review.
- `frame-operations.js`: immutable repair, morphology, composed cleanup, and
  anchor/pixel alignment operations shared by preview and apply paths.
- `spec-guide.js`: deterministic requirement evaluation and display-line
  formatting without DOM dependencies.

Next:

- smaller DOM controllers for repair, timeline, and contract export workflows.

## Definition of done

- A clean rebuild emits the exact standalone artifact used by app-hub.
- Focused unit contracts and all Sprite Fan e2e tests pass.
- Docs no longer describe merged GIF export as future work.
- Unsafe imported config/spec content is rendered with text nodes, not HTML.
