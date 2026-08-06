# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses semantic versioning.

## [0.0.2] - 2026-07-01

### Added

- Standalone project metadata for `inf-arrange` as its own git repository.
- Modularization design paper in `ARCHITECTURE.md`.
- Consecutive modularization/refactoring task plan in `MODULARIZATION_TASKS.md`.
- Case studies for OpenAPI-backed canvas documents and audio-playlist/media-graph canvas usage.
- Initial framework-free `canvas-core` module with document schema, serialization, normalization, validation, migration registry, loader/plugin/capability contracts, plugin registry and graph/stat helpers.
- Initial `canvas-react` embedding facade exposing `CanvasStudio` as a reusable React boundary with controlled/uncontrolled document hydration, document/selection callbacks and an imperative handle.
- Public `src/index.ts` barrel exports for future embedding/package use.
- Vite-backed lightweight test runner and tests for document round-trips, unknown item preservation, geometry, migrations, plugin stats and embeddable React smoke coverage.
- OpenAPI loader adapter example under `docs/examples/openapi-loader-adapter.ts`.
- Item capability documentation in `docs/item-capabilities.md` and graph-language documentation in `docs/graph-language.md`.
- Link/web items with card and iframe preview modes.
- Text capability modes for plaintext roles, markdown, rich text and append-only logs.
- First-class audio item schema, renderer, toolbar/file upload path and clipboard paste ingestion.
- Image effect helpers and external image/text editor capability bridge hooks.
- Edge semantic mini-language and relation materialization helpers.
- First Graph panel for editing edge-language relations, inspecting relation/media stats and previewing sequence chains.
- `CanvasRelation[]` is now first-class runtime state and participates in undo/redo, document snapshots and hydration.
- Isolated canvas store support for embedders through `CanvasStudio store={...}` and store factory tests.
- Rollup manual chunking for React, D3, Mantine and utility vendors.
- Lazy-loaded SPA panels for Media Manager, Graph Panel and Keybindings.
- JSON import/export toolbar actions with diagnostics.
- Provider-boundary regression coverage and provider-aware runtime component/hook store access.
- Visible relation overlay on the infinite canvas backed by pure `relationSegments(document)` geometry.
- Multi-clip clipboard history palette opened via `Ctrl/⌘+Shift+V` with `A S D F H J K L` quick selection.
- Minimap, improved clipboard inspector/status, and smoother cursor-anchored wheel zoom.

### Changed

- Current SPA now renders the infinite canvas through the `CanvasStudio` facade instead of directly wiring lower-level canvas internals.
- Vite SPA chrome was moved into `src/app-shell/CanvasStudioApp.tsx`, keeping `src/App.tsx` as a thin entrypoint.
- Media Manager and clipboard summaries now handle richer item types beyond images/text.
- Package version changed to `0.0.2` to start explicit semantic versioning.
- Default keybindings were aligned more closely with diagram-editor/draw.io-style expectations, including clipboard history and z-order shortcuts.
- Clipboard copy/cut now stores deep-cloned webapp-native clips in a reusable history while preserving normal `Ctrl/⌘+V` behavior for latest paste and OS clipboard data.

### Fixed

- The previous Vite >500 kB main JavaScript chunk warning was removed by splitting vendor/app chunks instead of increasing the warning limit.
- Relations are now cleaned up when linked items are removed or cut, preventing dangling graph edges in runtime state.

- Canvas Studio text/plain clipboard fallback parsing now recognizes marked payloads even when preceded by a human-readable summary.
- Browser paste handling no longer blocks OS clipboard images/text before the paste event can inspect them.

### Known issues

- The project is still physically nested under the broader `artifacts` workspace, so parent git status may continue to show the nested repo directory.
