# Artifact Lab

Artifact Lab is the incubation repository for small interactive experiments, browser tools, games, documents, and media prototypes that are useful before they justify a repository of their own.

The lifecycle is deliberately simple:

```text
experiment in Artifact Lab
        ↓
stable artifact + durable identity
        ↓
graduate to an independent repository
        ↓
Artifact Lab keeps only the release/integration reference it needs
```

Graduation does not mean an experiment stops being available through the Lab. It means source ownership and releases have become durable enough to live independently while the Lab can retain a release-pinned submodule or catalog link.

## Build, preview and publish

The publication inventory and per-project recipes live in [`inventory.yml`](./inventory.yml).
Acquisition (`local`, recursive `submodule`, pinned `git`, or verified `release`)
is independent of preparation (`copy`, `assemble`, or `build`). Independent apps
keep their own repositories. The embedded [`hub-v13.5/`](./hub-v13.5/) contains
the current launcher and publisher.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm inventory
pnpm build
pnpm check
pnpm serve
```

Builds require committed source and resolve the selected recipes. Preview and CI
publication both use the qualified `dist/site` directory. See
[the inventory and deployment contract](./docs/PORTFOLIO.md) for fresh checkout,
prebuilt releases, packaging and rollback. Version/status tables below are historical
project summaries; YAML selects the current publication.

## Graduated projects

| Project | Status | Release pinned here | Link |
|---|---|---:|---|
| Ethic Brawl | **Graduated** — independent repository | `v1.7.4` | [GitHub](https://github.com/fkr-0/ethic-brawl) |
| Badger Sprawl Runner | **Graduated** — independent repository | `v1.5.2` | [GitHub](https://github.com/fkr-0/badger-sprawl-runner) |
| Hyperblast Shooter | **Graduated** — independent repository | `v0.2.0` | [GitHub](https://github.com/fkr-0/hyperblast-shooter) |

## Lab project catalog

| Project | Status | Version / release | Link |
|---|---|---:|---|
| Aster Relay Identity | Incubating / uncataloged | — | [source](./aster-relay-identity-nightline-configurable/) |
| Bathroom Emergency Guide | Independent submodule; **experimental** in Lab registry | `v5.1.2` pin | [GitHub](https://github.com/fkr-0/bathroom-emergency) |
| BrickBreaker Coop | **Provisional** | `0.1.0` | [source](./brickbreaker/) |
| Chadō: Interactive Zen Tea Ceremony Guide | **Experimental** | `0.1.0` | [source](./chado-zen-tea/) |
| Clausewitz: On War Interactive Atlas | **Provisional** | — | [source](./clausewitz-on-war-interactive/) |
| Club Ledger | **Provisional** | — | [source](./club-ledger/) |
| File Diff Studio | **Provisional** | — | [source](./file-diff-studio/) |
| Font Lab Browser | **Provisional** | — | [source](./font-lab-browser/) |
| GIF White→Alpha Preprocessor | **Provisional** | — | [source](./gif-white-to-transparent/) |
| Git Recipe Book | **Experimental**; root-owned extraction candidate | `1.1.0` | [source](./git-recipe-book/) |
| Inf Arrange / Canvas Studio | **Experimental**; root-owned extraction candidate | `0.0.2` | [source](./inf-arrange/) |
| Markdown Viewer | **Provisional** | — | [source](./markdown-viewer/) |
| Meme Lab | **Provisional** | — | [source](./meme-lab/) |
| Classic Minesweeper | **Provisional** | — | [source](./minesweeper/) |
| Overlay Cam | **Experimental** | `0.1.0` | [source](./overlay-cam/) |
| Palette Studio | **Provisional** | — | [source](./palette-studio/) |
| PDF Forge Nexus | **Provisional** | — | [source](./pdf-forge-nexus/) |
| Peer Music Groove | Incubating / uncataloged | — | [source](./peer-music-groove/) |
| PeerModGroove | **Provisional** | — | [source](./PeerModGroove/) |
| Peernet ORCA | Incubating / uncataloged | — | [source](./peernet-orca/) |
| PeernetJS | Incubating / uncataloged | — | [source](./peernetjs/) |
| Prompt Forge Nexus | **Provisional** | — | [source](./prompt-gen-nexus/) |
| QR Studio | **Experimental** | `0.1.0` | [source](./qr-studio/) |
| RevealPeerJS | **Provisional** | — | [source](./reveal-peer-plugin/) |
| Magical Love Chat | **Provisional** | — | [source](./sexy-love-chat/) |
| Classic Solitaire | **Provisional** | — | [source](./solitaire/) |
| Sharepic Creator / SPC collection | **Provisional** collection | — | [source](./spc/) |
| Sprite Extractor | **Provisional** | — | [source](./sprite-extractor/) |
| Sprite Fan Atlas Studio | **Provisional** | — | [source](./sprite-fan/) |
| Storyboard Studio | **Provisional** | — | [source](./storyboard-studio/) |
| Telegram Bot API Workbench | **Provisional** | — | [source](./telegram-bot-api-workbench/) |
| V11 Peer DAW | Independent submodule; **provisional** in Lab registry | `v1.5.0` pin | [GitHub](https://github.com/fkr-0/v11-peer-daw) |

## Lab infrastructure

[Artifacts Hub V13](./apps/app-hub-v13/) is the current catalog and launcher. [App Hub V11](./app-hub-v11/) and the older [App Hub](./app-hub/) remain compatibility/legacy surfaces; registry, tooling, tests, migration data, and shared libraries are Lab infrastructure rather than artifact projects.

The machine-readable catalog and ownership metadata live under [`registry/`](./registry/). Historical [`ARTIFACTS_TOC.md`](./ARTIFACTS_TOC.md) is retained for compatibility but is not the status authority.
