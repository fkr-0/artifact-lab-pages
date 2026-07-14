# Changelog

All notable changes to Artifact Lab are documented here. The repository follows
[Semantic Versioning](https://semver.org/) and the structure of
[Keep a Changelog](https://keepachangelog.com/).

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

[1.0.1]: https://github.com/fkr-0/artifact-lab-pages/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/fkr-0/artifact-lab-pages/releases/tag/v1.0.0
