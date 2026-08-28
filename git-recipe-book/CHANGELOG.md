# Changelog

All notable changes to Git Recipe Book are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- A complete curriculum-v2 layer with concept/scenario registries, goal predicates, declarative lesson definitions, objective retrieval checks, reference solutions, schema validation, prerequisite-cycle checks, and a compatibility adapter for the existing lesson engine.
- Typed semantic repository events and beginner/advanced delta projections, rendered as an entity-level event timeline in the command evidence notebook.
- Strict assessed-attempt evidence recording plus browser journeys proving no-prediction/no-execution and failed-command/no-progression behavior.
- Teaching-backend capability and lesson-support matrix checks, including simulator support for `git show` and `git diff --staged`.
- Focused Workspace Bridge commands for curriculum-v2, semantic-event, roadmap-semantics, native-Git conformance, and learning E2E verification.
- Guided, Practice Lab, Recovery Lab, and Challenge modes with deterministic scenario reset, progressive hint ladders, and hint-use evidence.
- Timestamped concept evidence for guided success, retrieval, transfer, misses, and hint dependence, plus concept-level spaced-review scheduling.
- Full beginner learning stages for focused snapshots, branch pointers, fast-forward/true merge/conflict cases, rebase, restore/revert/reset/stash/reflog recovery, two-repository remote collaboration, tags, cherry-pick, abstract Git internals, interleaved review, and two outcome-graded capstones.
- Simulator support for merge-conflict lifecycle/abort, `restore`, `revert`, reflog evidence, reset modes, explicit tracking branches, and non-fast-forward push rejection/recovery.
- Curriculum-linked native Git differential coverage for every assessed Git command family, including local snapshots/inspection, branches/switching, merge conflict/abort, rebase, restore/revert/reset/reflog, stash, remotes/fetch/pull/push/rejection recovery, tags, and cherry-pick; adding an uncovered assessed family now fails the contract test.
- `@axe-core/playwright` accessibility release-gate coverage for initial, course/lesson, populated graph/evidence, mobile overlay, and keyboard-navigation states, with the audit evidence and remaining assistive-technology limitation recorded in `A11Y-AUDIT.md`.
- A side-by-side local/remote repository model, context-sensitive state-layer emphasis, destructive-operation previews, reduced-motion behavior, and a screen-reader-accessible textual commit graph.
- A sticky learning compass that keeps the current instructional priority visible and provides direct navigation between the mission, state model, graph, and practice workspace.
- Deliberate course, evidence, and focus controls for switching between guided context and a distraction-reduced canvas.

### Changed

- Enforced the advertised prediction → action → evidence → reflection contract in the runtime: assessed commands require a prediction, failed commands remain evidence but cannot advance unless the lesson explicitly expects the safe failure state (for example a merge conflict or rejected push), and validated actions require objective reflection/retrieval evidence.
- Replaced count-only command-change inference with event-backed explanations so index content and branch-ref movement remain observable when counts do not change.
- Corrected simulator snapshot semantics so focused commits preserve untouched parent-tree paths and unstaged/staged diff views model working tree vs index and index vs HEAD separately.
- Corrected beginner explanations for merge fast-forwards versus merge commits, remote-tracking checkout, explicit tracking-branch creation, explicit upstream setup with `push -u`, configurable pull integration, and `git add` as index selection/copying.
- Reorganized the course by conceptual dependency and progressively reveals only current/next/later work by default instead of displaying the complete locked curriculum.
- Replaced self-reported v2 mastery with objective retrieval choices, timestamped evidence, transfer labs, and outcome-based state predicates that can accept multiple valid command sequences.
- Reworked rebase and cherry-pick to replay commit deltas instead of overlaying full snapshots, preserving unrelated receiving-branch changes.
- Publishes immutable Git-state snapshots from the mutable backend so React graph/state views reliably update when nested commits and refs move.
- Marked the experimental isomorphic backend as non-reference (`isRealGit = false`); native Git differential tests now define the semantic reference across the complete assessed teaching command-family contract.
- Made the evidence drawer progressively disclosed instead of permanently reducing the central learning canvas.
- Replaced the mobile course and evidence columns with fixed overlays so the active mission now appears near the top of the first viewport.
- Added explicit accessible names and pressed states to icon-only workspace controls.
- Made the horizontally scrollable Git-state rail and terminal transcript keyboard-focusable, and raised terminal/locked-course/risk-badge contrast to satisfy automated WCAG checks.

### Fixed

- Added the previously taught-but-unsupported `git show` command to the simulator.
- Stopped plain `git push origin <branch>` from silently creating upstream configuration; upstream tracking is now created only with `-u` / `--set-upstream`.
- Made direct checkout of a remote-tracking ref enter detached HEAD instead of silently creating a local tracking branch; explicit `switch -c ... --track ...` now owns that behavior.
- Prevented regex-matching commands that Git rejects from satisfying lesson progression.
- Corrected soft/mixed/hard reset semantics, pull failure propagation, non-fast-forward push safety, and commit-tree preservation for focused commits.
- Corrected stale graph rendering caused by memoizing nested mutable backend objects; UI state now receives immutable snapshots.
- Corrected cherry-pick to preserve the selected commit message, matching native Git instead of inventing a `(cherry-picked from …)` suffix.
- Removed invalid ARIA labeling from decorative progress bars while keeping their progress exposed textually; fixed scroll-region keyboard access and contrast issues found by axe-core.

### Verification

- `pnpm lint`
- `pnpm test` — 213 tests passed across 14 files, including curriculum reachability and curriculum-linked native-Git differential checks.
- `pnpm build` — TypeScript and Vite production build passed (2,269 modules transformed).
- `pnpm playwright test --project=chromium` — 34/34 browser journeys passed, including 390 px mobile coverage for snapshot, merge, recovery, remote, and capstone stages plus the formal accessibility suite.
- `test:a11y` / `e2e/accessibility.spec.ts` — 5/5 axe + keyboard scenarios passed with no serious or critical axe violations in the audited stable states.
- Manual `abc` keyboard/accessibility-tree review verified named/focusable state and terminal scroll regions, primary focus order, mobile horizontal keyboard scrolling, and populated textual commit-graph semantics.

### Remaining before a 2.0 release

- Run one literal screen-reader application pass on a target desktop environment. The current workstation has no screen-reader executable installed, so the completed axe + keyboard + browser accessibility-tree audit is not being overstated as a literal assistive-technology session.
- Perform release/version/tag/publish steps only after that final assistive-technology gate is accepted.

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
