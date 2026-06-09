# Hyperblast Shooter

Hyperblast Shooter is a static browser/Canvas space shooter artifact in the `artifacts` monorepo. The first release target is a small playable v0.1: arcade combat, exploration/story systems, local progress, tested key rebinding, and experimental multiplayer mode negotiation.

## Run locally

From the artifacts repository root, serve the repository with any static server and open:

    hyperblast-shooter/index.html

For automated browser tests, use the Playwright web server configured by the monorepo.

## Release gate

Before release or deploy, run from the artifacts repository root:

    npm run check:hyperblast

This runs the scoped Node smoke tests and Hyperblast Playwright E2E suite. The GitHub Pages workflow also runs this gate before materializing the deploy stage.

## Controls

Default movement supports both WASD and arrow keys:

- Move: WASD or Arrow keys
- Fire: Space
- Cycle weapon: Q
- Deploy turret: T

## Key rebinding

Open the setup menu before launch and use the per-action binding buttons to reassign controls. Custom bindings are stored in `localStorage` and survive reload. Use **Reset Bindings** to restore the full default set, including both WASD and arrow-key horizontal movement.

## Multiplayer

Co-op mode is experimental but covered by deterministic E2E tests using a fake PeerJS/Peernet transport. Those tests prove that two browser clients can connect through the game’s lobby adapter contract and exchange state without depending on a public PeerJS broker.

Versus Mode (experimental) is currently a selectable/broadcast match mode. It does not yet implement full competitive rules such as remote-player damage, scoring, or win/loss conditions. Those tasks are tracked in `release-todo.yml` and `docs/multiplayer-input-remaining-tasks.md`.

## Release limitations

- Real public PeerJS broker connectivity is not part of the default CI gate.
- VS mode is mode negotiation only until VS gameplay semantics are implemented.
- Some panel HTML builders remain to be migrated behind safer render-model helpers.
- The project is still partly contained in a large `index.html`; future work should continue extracting runtime boundaries into modules.

## Key release documents

- `release-todo.yml`: first-release checklist, implemented items, and deferred tasks.
- `project-review.yml`: evidence-based architecture and quality review.
- `docs/e2e-testing-strategy.md`: browser-test strategy.
- `docs/multiplayer-input-remaining-tasks.md`: multiplayer/input follow-up tasks.
