# Sprite Fan architecture decision

## Decision

Keep `atlas-studio.html` as the canonical integrated artifact for now.

Do **not** split the studio into `src/`, `dist/`, and a compile-to-artifact pipeline yet.

## Why

The current pass hardened the single-file artifact with static contracts and end-to-end browser coverage for the main postprocessing and export workflows:

- load and slice a synthetic sprite sheet,
- alpha cleanup,
- dual-background alpha extraction,
- island detection,
- cleanup-all postprocessing,
- issue review,
- preview-before-apply checks,
- PNG sheet export,
- sprites.json export,
- full config export,
- source-sheet versus frame-review viewport state,
- focused GIF export.

A split would now add build-system complexity before the studio has a strong enough reason to require it. The simpler sibling artifacts still act as focused reference tools, and `atlas-studio.html` is now covered enough to remain the integration surface.

## Split criteria

Reconsider splitting only when at least two of these become true:

1. The studio grows beyond comfortable single-file maintenance.
2. Shared image-processing functions need independent browser/runtime unit tests outside the existing `sprite-fan/lib` contract surface.
3. GIF import is merged into the studio, or GIF export grows beyond the current focused standalone encoder.
4. A reproducible compile step can emit a standalone `atlas-studio.html` without breaking the current zero-build artifact use case.
5. Multiple artifacts start sharing the same sprite postprocessing UI components.

## Future split shape

If the criteria are met, use this shape:

```text
sprite-fan/
  package.json
  src/
    studio.html
    studio.css
    studio.js
    image-ops.js
    review-state.js
    export-manifest.js
  tests/
    *.mjs
  dist/
    atlas-studio.html
```

The compile step must:

- emit a single standalone HTML artifact,
- preserve the current public filename `atlas-studio.html`,
- run existing e2e specs against the emitted artifact,
- include a source-map or readable section comments for reviewability,
- avoid introducing a mandatory dev server beyond the existing artifact server.

## Current package stance

`atlas-studio.html` remains the source of truth. `sprite-fan/lib/sprite-postprocess.mjs` is the current deterministic contract boundary for reusable image logic.

Focused GIF export is now merged into `atlas-studio.html` as a small standalone encoder with e2e coverage. This does not by itself trigger a split, because GIF import and shared GIF UI modules are still absent.

Future GIF work should continue as focused import/export modules, not by copying the full GIF creator UI.
