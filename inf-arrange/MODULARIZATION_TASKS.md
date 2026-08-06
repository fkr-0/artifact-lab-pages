# Modularization Task Plan

## Phase 0 — Safety net

- [x] Keep current SPA behavior compiling while refactoring.
- [x] Add unit tests for document serialization/deserialization.
- [x] Add smoke tests for embeddable component mounting.
- [x] Add fixture documents for image/text/unknown/audio-like items in core tests.

## Phase 1 — Core document boundary

- [x] Create `src/canvas-core/document.ts` with `CanvasDocument`, `CanvasDocumentItem`, relations, validation, normalization, serialization and runtime adapters.
- [x] Create `src/canvas-core/index.ts` public core barrel.
- [x] Add `src/index.ts` package-level public exports.
- [x] Move pure geometry from `src/lib/geometry.ts` into `src/canvas-core/geometry.ts` and keep compatibility re-exports.
- [x] Add migration registry for future document versions.
- [x] Preserve unknown item types as placeholders instead of dropping them.

## Phase 2 — Embeddable React boundary

- [x] Create `src/canvas-react/CanvasStudio.tsx` facade around the current internal canvas.
- [x] Create `src/canvas-react/index.ts` public React barrel.
- [x] Move Vite SPA shell into `src/app-shell/CanvasStudioApp.tsx`.
- [x] Lazy-load optional SPA chrome panels for media manager, graph panel and keybindings.
- [ ] Split toolbar/media manager/keybinding dialogs into host-configurable chrome slots.
- [x] Support controlled/uncontrolled document props.
- [x] Emit `onDocumentChange` from store snapshots.
- [x] Add a host-facing imperative handle for document snapshot/hydrate, fit/reset and selection.
- [x] Extend host-facing imperative handle with command dispatch.
- [ ] Extend host-facing imperative handle for focus/import/export convenience methods.

## Phase 3 — Commands and changes

- [x] Define initial `CanvasCommand` and `CanvasChange` unions.
- [x] Add initial command dispatch for add/update/remove/select.
- [ ] Route paste/viewport operations through command dispatch.
- [ ] Make undo/redo history command-aware.
- [ ] Expose host interception via `onCommand`.
- [ ] Add operation patches as a collaboration-ready substrate.

## Phase 4 — Item plugin system

- [x] Define `CanvasItemPlugin` interface.
- [x] Add plugin registry/provider.
- [ ] Move image rendering/editing commands into built-in image plugin.
- [ ] Move text rendering/editing into built-in text plugin.
- [x] Add unknown-item fallback renderer.
- [x] Add plugin-level stats extractors.
- [x] Add optional text/image editor provider bridges.
- [ ] Add actual Monaco-backed text/code editor plugin.
- [ ] Add actual modal image editor UI/provider.

## Phase 5 — External data integration

- [x] Define `CanvasDocumentLoader` interface.
- [x] Provide OpenAPI adapter example using generated client shape.
- [x] Add import/export JSON actions to the SPA toolbar.
- [x] Add JSON import diagnostics for invalid JSON/document payloads.
- [ ] Add richer backend validation diagnostics with field paths.
- [ ] Add optimistic save/change callbacks.

## Phase 6 — Multimedia extensions

- [x] Define initial media capability contract: `AudioController` and asset resolver.
- [ ] Expand media capability contracts with `MediaResolver` and `AssetStore`.
- [x] Add `audio` item document schema and built-in/experimental renderer.
- [x] Add playlist sequencing graph operation.
- [ ] Add playback command/presence overlays and host audio-controller wiring.
- [x] Add tests for media metadata serialization/preservation via audio-like document fixtures.

## Phase 7 — Multi-user/collaboration

- [ ] Split document state from presence/selection state.
- [ ] Define remote cursor/selection overlay APIs.
- [ ] Add change-stream adapter for CRDT/OT integration.
- [ ] Make z-order and IDs conflict-safe.
- [ ] Add conflict/migration tests.

## Phase 8 — Graph and stats facilities

- [x] Add `CanvasRelation` graph helpers.
- [x] Add initial spatial stats: type counts, area, z-order range.
- [ ] Add advanced spatial stats: density, clusters, overlap, spatial index.
- [x] Add media stats: durations, missing assets, duplicated sources.
- [x] Add initial graph operation: playlist/sequence traversal.
- [ ] Add advanced graph operations: layout, cluster, align, dependency traversal.
- [ ] Add host-facing analytics callback/export.

## Implementation started in this pass

- Core document model and runtime adapters.
- Core extension contracts: loader, command, item plugin and capabilities.
- Initial graph/statistics helpers.
- Document migration registry.
- Plugin registry and plugin stats aggregation.
- Embeddable `CanvasStudio` facade with controlled/uncontrolled hydration, selection/document callbacks and imperative handle.
- Public exports.
- Compile-time/runtime core tests and embeddable React smoke test.
- Current SPA refactored to render through the facade and moved into `src/app-shell`.


## Implementation continued in this pass

- Repaired `link` item support so link items serialize, deserialize, render and type-check as first-class built-ins instead of falling through unknown-item handling.
- Restored build-green contracts for text capabilities, link/web item typing and image effect typing.
- Added pure media graph helpers: `mediaStats(document)` and `playlistSequence(document, startId?)`.
- Added OpenAPI-style loader adapter factory: `createOpenApiCanvasDocumentLoader(client, options?)`.
- Added regression tests for link round-tripping, media stats/playlist traversal and loader DTO normalization.

## Phase 9 — Item capability extensions

- [x] Add link/web card items with iframe-preview mode.
- [x] Add markdown/source toggle and lightweight rendered mode.
- [x] Add plaintext semantic roles for h1-h6, paragraph, lists, pre and code.
- [x] Add append-only log text blocks.
- [x] Add simple rich-text HTML storage/sanitization path.
- [x] Add image effects and external image-editor capability bridge.
- [x] Add first-class audio items with media metadata and optional native controls.
- [ ] Add capability registry UI/inspector for available item editors/providers.
- [x] Add first graph relation editing UI via the Graph panel.
- [ ] Add direct on-canvas edge drawing/editing handles.
- [ ] Add non-destructive image effect stack editor.
- [ ] Add merge/composite image operations.

## Phase 10 — Packaging and performance

- [x] Add Rollup manual chunking for React, D3, Mantine and utility vendors.
- [x] Remove the >500 kB single-bundle Vite warning without raising the warning limit.
- [x] Add optional lazy-loading for heavy SPA panels.
- [ ] Add lazy-loading for future editor providers.
- [ ] Add package exports/types suitable for non-Vite embedding.

## Recently completed relation-runtime work

- [x] Store `CanvasRelation[]` as runtime state.
- [x] Include relations in undo/redo history snapshots.
- [x] Preserve relations in `CanvasStudio` snapshots and document hydration.
- [x] Clean dangling relations when linked items are removed/cut.
- [x] Add tests for relation history and cleanup behavior.

## Recently completed provider/overlay work

- [x] Add provider-boundary regression test preventing runtime components/hooks from bypassing per-instance canvas stores.
- [x] Migrate components/hooks to provider-aware store access.
- [x] Add pure `relationSegments(document)` geometry helper.
- [x] Add visible relation overlay on the infinite canvas.
- [x] Add lazy chunks for Media Manager, Graph Panel and Keybindings.
