# Sprite Fan source editing

The files in this directory are the editable source for the integrated Sprite Atlas Studio.

## Files

```text
src/
  atlas-studio.html  # HTML shell with CSS and JS insertion markers
  studio.css         # CSS payload for the standalone artifact
  config-core.js     # Dependency-free imported-config sanitization
  ui-navigation.js   # Dependency-free keyboard/focus decisions
  workflow-core.js   # Dependency-free workflow state and redirects
  image-io.js        # Object URL and image lifecycle boundary
  pixel-analysis.js  # Frame metrics, components, pinholes, hashes, jitter review
  frame-operations.js # Pure repair, morphology, cleanup, and alignment transforms
  spec-guide.js      # Requirement evaluation and safe display-line formatting
  export-core.js     # Review, manifest, page-plan, and filename domain
  gif-core.js        # Deterministic GIF palette and binary encoder
  studio.js          # DOM, canvas, workflow, and export orchestration
```

## Build

```sh
pnpm run build:sprite-fan
```

The builder concatenates the JavaScript modules in dependency order and writes
`sprite-fan/atlas-studio.html`, which remains the standalone browser artifact.

## Check drift

```sh
pnpm run health:sprite-fan
```

The health check fails if the split source no longer rebuilds the checked-in standalone artifact byte-for-byte.

## Editing rule

Prefer editing `src/*` first, then rebuild. Only edit `atlas-studio.html` directly for emergency generated-output patches, and immediately copy those changes back into `src/*`.
