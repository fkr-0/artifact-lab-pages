# Git Recipe Book

Git Recipe Book is an interactive React/TypeScript curriculum for learning Git by reasoning about repository state instead of memorizing command recipes. The published package version remains **1.1.0**; the current `Unreleased` work hardens the curriculum and learning runtime without implying a 2.0 release.

## Learning model

The course repeatedly uses this evidence loop:

```text
model → predict → act → inspect → explain → retrieve → transfer
```

The learner works with five visible Git state layers:

```text
working tree → staging area / index → commit history → branches & HEAD → remote repository
```

Lessons require observable outcomes, retrieval checks, and progressively revealed hints. Assessed Git steps declare either an exact/reference command path or a state goal so the curriculum can verify that examples actually work.

## Curriculum structure

```text
src/curriculum/
├── concepts.ts              concept registry
├── scenarios.ts             deterministic repository fixtures
├── scenario-loader.ts       scenario construction
├── goals.ts                 state-goal predicates
├── schema.ts                curriculum validation
├── adapter.ts               compatibility layer for the existing lesson provider
├── lessons-v2.ts            ordered curriculum registry
└── lessons/
    ├── core.ts              orientation and local snapshots
    ├── branching.ts         branches, merge cases, rebase
    ├── recovery.ts          restore, revert, reset, reflog, stash
    ├── remotes.ts           fetch, tracking, pull, push, rejection recovery
    ├── selective-history.ts tags and cherry-pick
    └── review.ts            internals, spaced retrieval, transfer capstones

src/git-model/
├── events.ts                typed repository semantic events
└── delta.ts                 beginner and advanced event projections
```

`src/lib/__tests__/curriculum-v2.test.ts` is the curriculum contract. It checks the prerequisite graph, scenario construction, simulator command support, explicit outcomes/retrieval/hints, and a working reference path for every assessed step. Native Git differential tests cover the assessed Git command families used by the curriculum.

## Development

Requirements: Node.js with `pnpm` available.

```sh
pnpm install
pnpm dev
```

Primary verification commands:

```sh
pnpm lint
pnpm test
pnpm build
pnpm playwright test --project=chromium
```

Focused Workspace Bridge commands are also declared in `bridge.yml`, including curriculum-v2, semantic-event, roadmap-semantics, native-Git conformance, accessibility, learning E2E, and production-build checks.

## Themes

The application supports the standard **Light** and **Dark** themes plus **V11 Cyberpunk**. Theme state is owned by `ThemeProvider` and persisted under the `theme` browser-storage key. The V11 theme layers its visual treatment on the dark base while retaining the same learning UI and semantics.

## Accessibility

Automated accessibility coverage lives in `e2e/accessibility.spec.ts`, with the current audit recorded in `A11Y-AUDIT.md`. The audit intentionally distinguishes automated axe/keyboard/accessibility-tree evidence from a literal screen-reader application pass.

## Release state

See `CHANGELOG.md` for the exact 1.1.0 history and current unreleased hardening, `ROADMAP.md` for the educational architecture, and `release-evidence/v1.1.0.yml` for the preserved 1.1.0 release evidence. That evidence predates the 2026-08-06 adoption into the parent artifacts repository: its recorded standalone commit IDs are not part of the parent history, and the parent repository's existing `v1.1.0` tag belongs to Artifact Lab rather than Git Recipe Book. Version/tag/publish work is separate from ordinary curriculum development and is not performed implicitly.
