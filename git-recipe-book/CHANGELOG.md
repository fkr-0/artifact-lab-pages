# Changelog

All notable changes to Git Recipe Book are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- A sticky learning compass that keeps the current instructional priority visible and provides direct navigation between the mission, state model, graph, and practice workspace.
- Deliberate course, evidence, and focus controls for switching between guided context and a distraction-reduced canvas.

### Changed

- Made the evidence drawer progressively disclosed instead of permanently reducing the central learning canvas.
- Replaced the mobile course and evidence columns with fixed overlays so the active mission now appears near the top of the first viewport.
- Added explicit accessible names and pressed states to icon-only workspace controls.

### Planned

- Expand deliberate practice beyond the Git Basics path into branching, merging, rebasing, remotes, and recovery scenarios.
- Add more challenge-mode tasks that begin with a development goal instead of an exact command.

## [1.1.0] - 2026-07-31

### Added

- A learning-first workspace built around the cycle **model → predict → act → inspect → explain**.
- A persistent five-layer Git state model covering the working tree, staging area, commit history, branches and `HEAD`, and remotes.
- Explicit pre-command predictions, including a first-class “no state change” choice for observational commands.
- A command evidence notebook that compares predicted and actual state changes, classifies command risk, and explains the causal result.
- Reflection checkpoints that prevent guided lessons from advancing until the learner reviews and secures the mechanism.
- A sequential course map with prerequisites, persisted mastery, adaptive recommendations, and deliberate replay of completed lessons.
- Beginner orientation, glossary, safety, spaced-review, and challenge phases, plus guided cherry-pick and tag lessons.
- Reproducible Workspace Bridge commands for linting, unit tests, focused lesson tests, Chromium end-to-end tests, and production builds.

### Changed

- Reorganized the application from a dense IDE-style layout into a focused mission, state model, graph, experiment terminal, and evidence workspace.
- Made Git Orientation a prerequisite for command-heavy Git Basics.
- Split the production bundle into application, learning-content, graph, motion, and React runtime chunks.
- Improved mobile and tablet layouts, including contained horizontal scrolling for the Git state model and a 390 px no-overflow browser check.
- Reworked help and onboarding surfaces to introduce terminology before command syntax and to expose clearer accessible labels.
- Normalized the full source tree with Biome and removed the previous repository-wide formatting and lint backlog.

### Fixed

- Prevented terminal commands from executing twice.
- Captured immutable before-state snapshots so command evidence remains truthful after simulator mutations.
- Preserved persisted lesson progress and converted completed lessons into replay practice instead of resetting mastery.
- Added defensive queue and stash invariants in both simulator backends.
- Corrected keyboard access for file previews, explicit button behavior, semantic dialogs, theme initialization, and application root bootstrapping.
- Repaired the malformed project bridge manifest.

### Verification

- `pnpm lint`
- `pnpm test -- --run` — 172 tests passed across 10 files.
- `pnpm build`
- `pnpm playwright test --project=chromium` — 18 browser journeys passed.

### Known limitations

- The default learning environment is a deterministic browser-side Git simulator and intentionally does not implement every edge case of native Git.
- Remote repositories are modeled locally for teaching; no network repository is contacted.
- Learning progress is stored in the current browser profile and is not synchronized between devices.

## [1.0.0] - 2026-06-09

### Added

- Initial React, TypeScript, Vite, and Tailwind application scaffold.
- Interactive Git simulator with terminal commands, commit graph, branch views, file inspection, help content, and baseline tests.
- Commit hover states and an improved graph legend.

`1.0.0` existed as the package baseline but was not tagged in Git history.
