# Changelog

All notable changes to Artifact Lab are documented here. The repository follows
[Semantic Versioning](https://semver.org/) and the structure of
[Keep a Changelog](https://keepachangelog.com/).

## [1.2.0] - 2026-07-14

### Added

- V11 Peer DAW 1.3.0 with persistent focus mode and independently visible setup and monitor panels.
- Collapsible Patch Canvas and Module Rack surfaces with remembered state.
- View-specific context headings, direct workspace keyboard shortcuts, and accessible arrow-key tab navigation.
- Persistent Mixer, Routes, and Packet Monitor drawers with live counts.
- Non-blocking feedback for transport, synchronization, layout, module, route, and clipboard operations.
- Browser coverage for persistent layout state, constrained-height operation, mobile overflow, and keyboard navigation.

### Changed

- The Hub now pins the exact V11 Peer DAW 1.3.0 release commit.
- Collaboration controls use explicit action labels and the central editor can occupy the full available width.
- Long workspace editors preserve scroll position during same-view rerenders.
- Arrangement browser coverage separates real pointer dragging, copy-modifier behavior, and rendered-view verification.

### Fixed

- Closed inspector drawers now restore as closed.
- The DAW inspector no longer forces horizontal overflow on narrow screens.
- Collaboration refreshes no longer make long editor workflows fail merely because their visible view was replaced between operations.

## [1.1.0] - 2026-07-14

### Added

- V11 Peer DAW 1.2.0 with room-scoped project synchronization over Peernet/PeerJS.
- Request, snapshot, update, and acknowledgement messages shared across remote and local transports.
- Deterministic browser coverage for remote-only late joining, live project updates, and acknowledgements.
- A reusable fake low-level PeerJS network for production shared-core browser tests.

### Changed

- The V11 Peer DAW Session dashboard now shows project revision, transport timestamps, delivery counts, and acknowledgement state.
- Remote Peernet subscriptions are registered before startup and survive transport initialization/reconnection.
- Project hydration retries when a PeerJS connection becomes available after initial application startup.

### Fixed

- Collaborators on different browsers no longer remain on the default rig unless they also join an App Hub sub-lobby.
- Duplicate local and remote delivery of the same project message no longer rebuilds the DAW twice.

## [1.0.1] - 2026-07-14

### Added

- Explicit build-provenance inputs for the release commit and source-tree cleanliness state.
- V11 Peer DAW 1.1.1 with late-join project hydration, manual room joining, and visible synchronization recovery.

### Changed

- GitHub Pages upload now uses `actions/upload-pages-artifact@v5` and its current Node 24-compatible artifact stack.
- The deployed Hub build manifest resolves message and date metadata from the exact supplied source commit.

### Fixed

- Reproducible staging no longer causes an otherwise clean release build to be displayed as a dirty source checkout.
- Hub metadata now distinguishes source provenance from files generated later in the deployment job.

## [1.0.0] - 2026-07-14

### Added

- Semantic repository and V11 Hub versions exposed through package metadata.
- Build metadata schema with release version, full and short commit hashes, commit date, branch, dirty-state flag, build timestamp, and artifact count.
- Visible V11 Hub release, commit, and last-built badges with detailed provenance tooltips and ticker integration.
- Changelog and release-check workflow for reproducible tagged releases.
- Expanded browser regression coverage for Storyboard Studio, both Procedural Sharepic studios, and V11 Peer DAW.

### Changed

- V11 Peer DAW is updated as its independent repository/submodule and remains separately versioned and released.
- Storyboard and Procedural Sharepic history now preserves immediate edits before undo and distinguishes editing history from view-only changes.
- Catalog Procedural Sharepic controls and layer operations now participate consistently in undo and redo.

### Fixed

- Authoring studios remain usable when browser local storage is unavailable and display a clear persistence warning.
- V11 Peer DAW route counts, continuous controls, FM zero values, session isolation, peer presence, project convergence, and constrained-height sidebar interaction.
- Parallel DAW browser tests no longer share an unintended default collaboration room.

[1.2.0]: https://github.com/fkr-0/artifact-lab-pages/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/fkr-0/artifact-lab-pages/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/fkr-0/artifact-lab-pages/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/fkr-0/artifact-lab-pages/releases/tag/v1.0.0
