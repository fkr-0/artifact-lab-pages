# Changelog

All notable changes to Artifact Lab are documented here. The repository follows
[Semantic Versioning](https://semver.org/) and the structure of
[Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- Deployed Nakamoto's Disciples `0.2.0-alpha.10` as a checksummed,
  provenance-recorded static PWA with fail-closed lesson progression, semantic
  schema-3 state validation, accessible repair feedback, read-only completed
  evidence, and safe whole-satoshi transaction input.

### Changed

- Updated the App Hub catalog entry for Nakamoto's Disciples to describe its
  hardened sequential mastery model and learner-visible repair behavior.
- Replaced the previous vendored build with the tagged `v0.2.0-alpha.10` source
  revision while retaining relocatable subpath assets and excluding source maps.

## [1.5.1] - 2026-07-24

### Added

- A portfolio-wide audit command covering catalog uniqueness, launch targets,
  local paths, HTML landmarks, reduced-motion support, unsafe links, duplicate
  IDs, and inline event attributes across every root-owned embedded artifact.
- Permanent focused regression and Chromium interaction suites for NEXUS v9,
  PDF Forge, Prompt Forge, Template Engine, graphics tools, classic games,
  collaboration lifecycles, local persistence, and document security.
- A documented root-owned release gate that rebuilds generated catalog and
  Sprite Fan outputs, runs 133 Node tests, and exercises the full 67-test
  root-owned Chromium matrix without entering independent subprojects.
- An Artifact Portfolio Standard defining ownership boundaries, local-first
  behavior, lifecycle cleanup, accessibility, catalog rules, and release gates.

### Changed

- The V11 catalog now contains 48 unique entries and rejects duplicate IDs
  instead of silently discarding later definitions.
- NEXUS v9, PDF Forge, Prompt Forge, Template Engine, QR Studio, and Magical
  Love Chat now use explicit or delegated event listeners instead of inline
  HTML handlers.
- App Hub v11 received stronger keyboard tab behavior, focus restoration,
  dialog focus containment, storage import guards, and clearer unknown-build
  health reporting.
- Root-owned games, collaboration tools, audio runtimes, GIF creators, and
  editors now pause hidden work and release timers, animation frames, object
  URLs, audio contexts, and peer resources during teardown.
- Generated V11 catalog JSON is newline-terminated consistently, and local
  test, dependency, Python bytecode, and agent-state outputs are ignored.

### Fixed

- NEXUS v9 startup no longer leaves mini-app, session-router, and app-loader
  initialization trapped inside the save-state action.
- The NEXUS v9 link to the current V11 hub no longer floats above and blocks
  header controls.
- Sprite Fan's generated standalone page and canonical split source now agree
  on the main landmark and rebuild byte-for-byte.
- PDF/image imports, shared-state imports, markdown links, GIF validation,
  download cleanup, timer visibility behavior, and browser-storage failures
  now fail visibly and recover without corrupting the active session.
- Root integration tests now reflect Hyperblast's adventure pause mode,
  Python 3.14 dynamic module loading, and the current command-center keyboard
  implementation.

## [1.5.0] - 2026-07-19

### Added

- URL-safe Base64 studio-state sharing through the `state` query parameter, including Unicode-safe encoding, URL-over-local-storage precedence, clipboard actions, migration, validation, and malformed-state recovery.
- A dedicated effect-fader bank with numeric entry, live filled tracks, reset controls, blur, pixelation, posterization, scanlines, bidirectional contrast, and extended saturation.
- Browser coverage for the two-row tab layout, cached rendering, animation-frame coalescing, portrait preview geometry, and complete URL-state round trips.
- A V11 Hub quick-access shelf combining pinned artifacts with recent launches, a resume-last action, persistent favorites-only filtering, and selectable changed/opened/title/kind ordering.
- A compact V11 Hub release, network, open-app, and pinned-artifact health strip with favorite-aware command-center ranking.
- V11 Peer DAW 1.5.0 with live master peak/RMS metering, clip hold, audio latency/sample-rate diagnostics, and persistent low-power telemetry.
- Ethic Brawl 1.5.1 with composite shared-runtime rendering, arcade-core lifecycle and physics primitives, aligned responsive 16:9 viewport scaling, and smoother continuous fighter-animation cadence.
- Badger Sprawl Runner 1.1.0 with complete Mirror Palace and Dub Colony campaign chapters, the full Moss motion atlas, production sprite coverage, and shared-runtime bridge support.
- Hyperblast Shooter 0.2.0 with shared arcade-runtime rendering, display-object reuse, renderer telemetry, and reproducible runtime declarations and metadata.

### Changed

- The compact Procedural Sharepic Studio now presents all six sidebar tabs in a visible two-row grid on narrow sidebars.
- Preview rendering uses its displayed/export aspect ratio, adaptive device resolution, a reusable base-art cache, and one combined pixel-color pass.
- Rapid fader input is coalesced through `requestAnimationFrame`; post-processing changes no longer regenerate the procedural base composition.
- Artifact Lab now pins the exact independently published DAW, Ethic Brawl, Sprawl Runner, and Hyperblast release commits.
- Pinned Hub artifacts are prioritized in command search and remain available through reloads.
- DAW performance telemetry pauses in hidden tabs and lowers its visual update cadence without changing audio scheduling.

### Fixed

- Portrait and landscape export presets no longer retain a misleading square preview.
- Undo, recipe import, and URL restoration now keep the visible tab synchronized with restored state.
- Untrusted shared state is normalized and clamped before reaching canvas, typography, frame, or export controls.
- Hub users can recover frequently used artifacts without rebuilding filters or searching the full catalog.
- DAW master gain writes are clamped and hidden-tab telemetry no longer consumes unnecessary animation frames.
- Game deployments no longer depend on moving development worktrees; only verified tagged component revisions are materialized.

## [1.4.1] - 2026-07-17

### Fixed

- The pinned Hyperblast checkout now includes its vendored PixiJS runtime and license, allowing clean GitHub Actions checkouts to pass the release gate.
- Artifact Lab deployment is reproducible from submodule commits rather than depending on untracked local vendor files.

## [1.4.0] - 2026-07-17

### Added

- Ethic Brawl 1.1.0 “Babylon Release Candidate” with a curated 13-fighter roster, complete normal chains, and four command specials per fighter.
- Complete core-plus-extended 32-frame animation banks for every release fighter, including normalized legacy sheets and new Deleuze–Guattari, Kierkegaard, and Stirner banks.
- Production enemy and item atlases covering all 12 story enemy archetypes and all 31 catalog items.
- Reproducible character-extension generation, release asset validation, and browser-level animation coverage.

### Changed

- The Hub now pins the exact Ethic Brawl 1.1.0 release commit.
- Ethic Brawl Story Mode presents Babylon as the complete playable three-encounter route and later authored routes as locked previews.
- Character selection and reward presentation expose complete movesets, command inputs, fighter gimmicks, enemy intel, and illustrated clear rewards.

### Fixed

- Authored special animation identifiers now resolve to dedicated startup, active, and recovery clips rather than collapsing to one generic special pose.
- The four original large RGB character sheets now deploy through the same transparent 512×512 atlas contract as the newer roster.
- Deployment validation no longer relies on stale hard-coded roster indices or frame totals.

## [1.3.0] - 2026-07-14

### Added

- V11 Peer DAW 1.4.0 “Collaboration Confidence” with protocol-v2 typed operations and protocol-1 snapshot compatibility.
- A persistent per-room collaboration journal with acknowledgements, retry/backoff, reconnect replay, coalescing, deduplication, checkpoints, conflicts, and recovery export.
- Deterministic reducers for mixer/module parameters, tempo, clips, notes, sequencer steps, arrangement placements/loops, multisampler zones, and atomic batches.
- Stable project entity IDs with additive migration for legacy slots, notes, placements, and zones.
- A Sync Center exposing delivery state, human-readable activity, compatibility, conflicts, and recovery controls.
- Browser coverage for zero-rebuild incremental convergence, payload reduction, offline reload replay, and protocol-v2 simultaneous edits.

### Changed

- The Hub pins the exact V11 Peer DAW 1.4.0 release commit.
- Frequent DAW edits now synchronize incrementally while module/routing topology, project import, sample binaries, complex presets, bootstrap, and recovery retain complete snapshots.
- Covered remote edits preserve the active editor and avoid whole-rig reconstruction.
- The complete DAW Chromium gate now contains 15 scenarios.

### Fixed

- Concurrent unrelated edits no longer overwrite one another through whole-project last-writer-wins updates.
- Pending edits survive reload and short disconnects instead of being silently lost.
- Duplicate local and Peernet delivery applies an operation only once.
- Older adds cannot resurrect notes, placements, or zones deleted by newer operations.
- Capability accounting no longer treats multiple transport roles for one logical collaborator as an incompatible client.

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

[Unreleased]: https://github.com/fkr-0/artifact-lab-pages/compare/v1.5.1...HEAD
[1.5.1]: https://github.com/fkr-0/artifact-lab-pages/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/fkr-0/artifact-lab-pages/compare/v1.4.1...v1.5.0
[1.4.1]: https://github.com/fkr-0/artifact-lab-pages/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/fkr-0/artifact-lab-pages/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/fkr-0/artifact-lab-pages/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/fkr-0/artifact-lab-pages/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/fkr-0/artifact-lab-pages/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/fkr-0/artifact-lab-pages/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/fkr-0/artifact-lab-pages/releases/tag/v1.0.0
