# sprite-fan TODO

## Status

- `atlas-studio.html` is currently the main integration surface.
- It already covers the three simpler sibling artifacts in this directory:
  - `alpha-rem.html`: white / near-white background alpha cleanup.
  - `dual-bg.html`: dual-background alpha extraction.
  - `island.html`: alpha island detection and repacking.
- Keep the simpler artifacts as focused reference tools until the studio is easier to test and package.

## Remaining tasks

### Reliability and pixel correctness

- [x] Add browser-level regression tests for:
  - [x] loading a single synthetic image,
  - [x] grid slicing,
  - [x] cleanup-all postprocessing for pinholes and strays,
  - [x] review keyboard stepping and auto-fit toggle,
  - [x] duplicate DOM IDs,
  - [x] alpha cleanup,
  - [x] dual-background extraction,
  - [x] island detection,
  - [x] repack/export flow.
- [x] Build a tiny synthetic image fixture set so pixel fixes can be compared deterministically.
- [x] Improve `Fix Jitter` so it can optionally shift frame pixels, not only update anchors.
- [x] Add before/after preview toggles for pinhole fill, stray-pixel removal, and outline normalization.
- [x] Add a destructive-operation summary before running cleanup across all frames.

### Review workflow

- [x] Add a “review mode” panel that lists per-frame metrics:
  - alpha pixel count,
  - bounding box,
  - center of mass,
  - anchor delta from reference frame,
  - detected stray/pinhole counts.
- [x] Add next/previous issue navigation so review can jump directly to suspicious frames.
- [x] Add optional frame labels or notes stored in exported full config.
- [x] Add a compact keyboard reference in the UI.

### Auto fitting and viewport behavior

- [x] Decide whether auto-fit should be default-on for sliced-frame review.
- [x] Add a preference for max auto-fit zoom per project or artifact type.
- [x] Preserve manual pan/zoom separately for source-sheet mode and frame-review mode.
- [x] Test small frames, very wide sheets, and very tall sheets.

### Artifact architecture

- [x] Do not split immediately. First harden `atlas-studio.html` as the canonical integrated artifact.
- [x] Re-evaluate split after tests exist. Split into a subpackage only when at least two of these are true:
  - studio code grows past comfortable single-file maintenance,
  - shared image-processing functions need unit tests,
  - a build step can emit the final standalone HTML artifact reproducibly,
  - GIF export or larger animation tooling is merged.
- [x] Proposed future shape if split becomes worthwhile:
  - `sprite-fan/package.json`
  - `sprite-fan/src/studio.html`
  - `sprite-fan/src/studio.js`
  - `sprite-fan/src/studio.css`
  - `sprite-fan/src/image-ops.js`
  - `sprite-fan/tests/*.mjs`
  - `sprite-fan/dist/atlas-studio.html`
  - compile command emits `atlas-studio.html` from source parts.

### GIF creator merge review

- [x] Decide whether to merge or add features from `artifacts/spc/sprite-gif-creator.html` and `artifacts/spc/sprite-gif-creator-v2.html`.
- [x] Compare GIF creator features against current studio:
  - GIF import and frame extraction,
  - frame timing / per-frame duration,
  - loop count,
  - GIF export,
  - transparent GIF handling,
  - preview playback controls,
  - palette / dithering options,
  - sprite-sheet-to-GIF workflow.
- [x] Prefer adding only focused GIF import/export modules at first, not copying the whole UI.
- [ ] If GIF support is added, create tests around frame count, duration preservation, transparency, and exported file metadata.



## GIF creator merge decision

- [x] Decision: do not copy the whole UI from `artifacts/spc/sprite-gif-creator.html` or `artifacts/spc/sprite-gif-creator-v2.html` into `atlas-studio.html`.
- [x] Keep `atlas-studio.html` focused on sprite-sheet cleanup, review, repack, PNG export, and manifest/config export.
- [x] Add only focused GIF import/export modules later, after the PNG/manifest postprocessing path remains stable.
- [x] Candidate GIF features to borrow later:
  - frame timing / per-frame duration,
  - transparent GIF handling,
  - GIF export,
  - sprite-sheet-to-GIF workflow,
  - optional frame offset smoothing,
  - sheet download parity only if it improves the current export panel.
- [x] Added `tests/sprite-fan-gif-merge-decision.test.mjs` so the decision remains explicit and the GIF creator feature surface stays discoverable.
- [ ] If GIF support is added, create tests around frame count, duration preservation, transparency, and exported file metadata.


## E2E export coverage added

- [x] Added `tests/e2e/sprite-fan-export.spec.mjs` for:
  - PNG sheet download,
  - `sprites.json` download,
  - full config download,
  - exported manifest frame labels and notes,
  - exported config review/fitting preferences.
- [x] Added frame label and notes fields to `sprites.json` manifest frames.

## E2E postprocessing coverage added

- [x] Added `sprite-fan/lib/sprite-postprocess.mjs` as a deterministic image-operation contract surface.
- [x] Added `tests/sprite-fan-postprocess.test.mjs` for:
  - alpha pixel metrics,
  - bounding boxes,
  - center of mass,
  - stray-pixel removal,
  - transparent pinhole detection and fill,
  - combined postprocessing pipeline.
- [x] Added `tests/e2e/sprite-fan-postprocessing.spec.mjs` to drive `atlas-studio.html` with a generated PNG sheet.
- [x] Added bridge commands:
  - `test:sprite-fan`
  - `e2e:sprite-fan`


## E2E workflow coverage added

- [x] Added `tests/sprite-fan-atlas-contract.test.mjs` to enforce static studio contracts:
  - duplicate DOM IDs stay absent,
  - core postprocessing functions remain present,
  - workflow buttons remain wired.
- [x] Added `tests/e2e/sprite-fan-workflows.spec.mjs` for:
  - alpha cleanup from a white matte,
  - dual-background alpha extraction,
  - island detection with deterministic merge distance,
  - grid slicing before repack,
  - repack canvas sizing.
- [x] Extended `e2e:sprite-fan` to run both postprocessing and workflow specs.


## E2E review coverage added

- [x] Added review issue metrics in the studio UI:
  - alpha pixels,
  - soft alpha pixels,
  - bounding box,
  - center of mass,
  - anchor delta,
  - stray pixel counts,
  - transparent pinhole counts,
  - jitter deltas.
- [x] Added previous/next issue navigation and `I` / `Shift+I` keyboard shortcuts.
- [x] Added frame label and notes fields, persisted through full config export.
- [x] Added a compact keyboard reference in the Frames panel.
- [x] Added optional pixel-shift mode for `Fix Jitter`.
- [x] Added cleanup-all confirmation with current issue summary before destructive batch processing.
- [x] Added `tests/e2e/sprite-fan-review.spec.mjs` for issue navigation, frame metadata config, and pixel-shift jitter fixing.


## E2E preview and fitting coverage added

- [x] Added non-destructive preview repair buttons for:
  - stray-pixel removal,
  - pinhole fill,
  - outline normalization.
- [x] Defaulted frame-review auto-fit on for consistent review.
- [x] Added `Max Auto-Fit Zoom` preference and persisted it in full config.
- [x] Added `tests/e2e/sprite-fan-preview-fit.spec.mjs` for:
  - non-destructive before/after repair previews,
  - max auto-fit zoom cap on tiny frames,
  - wide and tall sheet fit-to-view sanity.

## Done in current pass

- [x] Confirmed that the studio covers alpha cleanup, dual-background extraction, and island detection/repacking.
- [x] Fixed duplicate `chk-force-transparent` control IDs.
- [x] Added an auto-fit review toggle and `F` hotkey.
- [x] Added left/right frame review hotkeys.
- [x] Added review metrics for alpha pixel count, soft alpha count, and bounding box.
- [x] Added a pinhole fill operation and included it in cleanup-all.
- [x] Made undo snapshots clone image data instead of storing mutable references.
- [x] Added deterministic sprite postprocessing contracts for metrics, stray removal, and pinhole fill.
- [x] Added Playwright e2e coverage for synthetic sprite-sheet postprocessing in `atlas-studio.html`.
- [x] Exposed a narrow `window.__spriteFanTest` hook for e2e review assertions.
- [x] Added focused bridge commands for Sprite Fan tests and e2e.
- [x] Added static atlas-studio contract coverage for duplicate IDs and required workflow functions.
- [x] Added Playwright e2e coverage for alpha cleanup, dual-background extraction, island detection, and repack sizing.
- [x] Added review issue metrics, issue navigation, frame metadata, keyboard help, cleanup confirmation, and pixel-shift jitter mode.
- [x] Added Playwright e2e coverage for review-mode issue navigation and frame metadata persistence.
- [x] Added non-destructive preview repair buttons for stray removal, pinhole fill, and outline normalization.
- [x] Added max auto-fit zoom preference and e2e coverage for small/wide/tall fitting.
- [x] Added e2e download coverage for PNG sheets, sprites.json, and full config export.
- [x] Added explicit GIF creator merge decision contract: borrow focused modules later, do not copy the full UI.
- [x] Added separate source-sheet/frame-review viewport state and e2e coverage for restoring each view.
- [x] Added architecture decision doc and contract: keep atlas-studio as canonical single-file artifact for now, no split yet.
- [x] Added review-report export and e2e coverage proving cleanup reduces reported stray/pinhole issues.
- [x] Added cleanup batch history to review-report export with before/after totals and issue deltas.
- [x] Added frame-aware undo/redo snapshots and e2e coverage for cleanup-all undo/redo.
- [x] Added LocalStorage config persistence e2e for review/postprocessing settings and frame metadata after reload.
- [x] Added deterministic per-frame pixel hashes in review reports and e2e assertions for cleanup/undo/redo fingerprint changes.
- [x] Added Config modal JSON file import e2e for postprocessing settings and frame metadata before slicing.
- [x] Added cleanup-all cancel-safety e2e proving pixels, reports, undo state, and batch history remain unchanged.
- [x] Added full-config batch-history persistence and e2e coverage through JSON export/import and review-report export.
- [x] Added morphology e2e coverage for alpha erode/dilate controls with deterministic frame hash and metric checks.
- [x] Added softening and outline-normalization e2e coverage with undo/hash/alpha metric checks.
- [x] Fixed single-frame direct Remove Stray behavior and added direct repair e2e for Remove Stray/Fix Pinholes undoability.
- [x] Added exported-PNG pixel verification e2e proving cleaned pinhole/stray pixels are present in the downloaded sheet.
- [x] Added sprites.json postprocessing metadata export for per-frame hash, bbox, alpha counts, issue counts, and e2e assertions.
- [x] Added manifest/review-report consistency e2e proving cleaned sprites.json metadata matches review-report metrics.
- [x] Added review-report sheet layout and per-frame sheet rectangle metadata with e2e assertions.
- [x] Fixed sheet rectangle math to match padded repack layout and added multi-frame padded layout e2e coverage.
- [x] Added padded exported-PNG pixel e2e proving transparent padding and frame pixels land at sheetRect coordinates.
- [x] Added multi-frame cleanup/export e2e proving cleanup-all repairs every frame and downloaded PNG cells contain cleaned pixels.
- [x] Added multi-frame cleaned manifest e2e proving sprites.json hashes/issues match cleaned review-report metadata for every frame.
- [x] Added cleanup-history undo/redo e2e proving batchHistory rolls back and returns with frame/report hashes.
- [x] Added sprites.json sheetLayout metadata and e2e assertions matching review-report layout.
- [x] Added soft-alpha export e2e proving edge-softened partial alpha appears in review report, sprites.json, and downloaded PNG bytes.
- [x] Fixed direct jitter threshold logic and added e2e coverage for anchor-adjust and pixel-shift jitter repair modes.
- [x] Added jitterFrames review-report totals and cleanup-all batch deltas, with e2e coverage for pixel-shift jitter cleanup.
- [x] Added Sprite Fan Atlas Studio to the v11 hub manifest/deploy catalog with reachability regression coverage.
- [x] Added sprites.json generationContract and animation metadata aligned with sprite-fan/reqs atlas-grid requirements.
- [x] Add guided spec mode: Manifest panel now has prompt/checklist guidance based on sprite-fan/reqs requirements, exports spec-state JSON, embeds specGuide in sprites.json/full config, and re-imports/persists checklist state through Config Manager.
- [x] adapt ../badger-sprawl-runner to the Sprite Fan spec via `docs/sprite-fan/compat.yml`, mapping Badger's atlas runtime contract to Sprite Fan grid/animations/frame metadata fields.
- [ ] adapt the animation spec ymls in ../ethic-brawl/ to the sprite-fan spec
- [x] add post-processing-animation preview: selectable timeline subset can be marked with Ctrl/Meta-click or `M`, preview playback loops only marked frames, and Escape/clear resets to all frames. GIF export remains a future optional extension.
- [x] adapt ../badger-sprawl-runner project to the spec exported from Sprite Fan through a checked compatibility overlay and root contract test
- [ ] make sure to adapt the ../ethic-brawl animation project rsystem to the spec exported from sprite-fan
