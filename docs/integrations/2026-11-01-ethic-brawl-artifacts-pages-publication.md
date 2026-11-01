# Ethic Brawl 1.9.3 — Artifact Lab Pages publication integration

**OCP task:** `ARTIFACTS-20261101-FIX-ETHIC-BRAWL-GRADUATED-ARTIFACTS-PAG-20261101-8B3AAD`
**Date:** 2026-11-01
**Owner:** Artifact Lab publication integration, not game source ownership.

## Immutable source and release ownership

| Repo | Base revision / pin | Role |
| --- | --- | --- |
| [fkr-0/artifact-lab-pages](https://github.com/fkr-0/artifact-lab-pages) | `872f60b641f8c5892fd421d3803667bc376a29a6` remote main at integration pickup; final integration commit must be recorded separately | Pages workflow and source registry |
| [fkr-0/artifacts-v13.5](https://github.com/fkr-0/artifacts-v13.5) | `7f4c563942aa6d756760d7cd6870019c09e5a72a` | Qualified V13.5 handoff and Pages site base |
| [fkr-0/ethic-brawl](https://github.com/fkr-0/ethic-brawl) | `9e53636e65831ecacc489f034f665e7afc79d152` | Independent, remotely retrievable game source; committed `package.json` version 1.9.3 |
| Artifact Lab submodule | gitlink `9e53636e65831ecacc489f034f665e7afc79d152` | Immutable source reference; no in-repository source duplication |

The working `/home/user/code/ethic-brawl` checkout had 100+ foreign dirty sprite and gameplay edits. The `/home/user/code/artifacts` checkout also had foreign Groove Scratch Studio edits and an uninitialized submodule. Neither was reset, staged or used to build this release. A managed isolated Artifact Lab worktree initialized the submodule by its Git SHA and built from its clean tracked source. No uncommitted animation assets were used.

## Source → build → qualified stage → Pages

1. Checkout Artifact Lab with recursive submodules, pinning Ethic Brawl to exact gitlink. Assert the registry revision, gitlink, submodule HEAD and committed game package version agree. Refuse missing/uninitialized submodule or tracked source edits.
2. With the game's committed `pnpm-lock.yaml`, `pnpm install --frozen-lockfile --ignore-scripts` followed by `pnpm run build`. Vite's production `base: './'` makes its assets safe under a nested route.
3. Build Artifacts V13.5 and qualify its original handoff without relaxing source transitions, the 44/44 V12 parity floor, catalog >=55, asset hashes, or other existing release tests.
4. Overlay the *compiled* Ethic Brawl runtime into `.artifacts-pages-stage/artifacts/ethic-brawl/1.9.3/`. Do not copy generated source maps, Vite's internal manifest, or the dirty game checkout. Hash the runtime into the final asset manifest and add an independent `ETHIC_BRAWL_PAGES_RELEASE.json` provenance receipt. Update the single Ethic Brawl Hub entry to `availability: verified` and the single route to the versioned path; keep `ethic-brawl-source` as an external GitHub link. Supply a redirect at the original V12 `/ethic-brawl/index.html`.
5. Run the overlay's post-stage verifier over the source SHA, version, catalog/route membership, bytes, asset hashes and unchanged V13.5 handoff. Deploy only after the existing V13.5 checks plus these checks succeed.

The game's current committed HTML bundles CSS in a `<style>` element and references hashed JavaScript chunks, which is a valid self-contained static release. CSS is permitted as an external hashed asset *or* inline styling. Every HTML-referenced local asset must exist in the runtime inventory.

## Public routes

- **Playable release target, only after successful deployment:** `https://artifacts.fkr.dev/artifacts/ethic-brawl/1.9.3/index.html`
- **Legacy compatibility route:** `https://artifacts.fkr.dev/ethic-brawl/index.html`, redirecting to the versioned executable.
- **Source link (not the artifact):** `https://github.com/fkr-0/ethic-brawl`

## Verification and evidence

- **Committed source qualified locally:** clean, pinned `9e53636`; `pnpm run build` succeeded at `1.9.3`; compiled `dist/index.html`, hashed JS, projected runtime sprites; 304 runtime files excluding source maps and Vite internal metadata, approximately 186.6 MiB.
- **Automated checks:** `node --test tests/ethic-brawl-pages-publication.test.mjs tests/v13-5-publication-adapter.test.mjs tests/app-hub-v11-pages-workflow.test.mjs tests/badger-sprawl-runner-pages-build.test.mjs` — 30/30 passed at integration development checkpoint. These check missing/mismatched gitlinks, stale manifest versions, dirty submodule, absent compiled output, wrong source link, parity gate, corrupted staged JS and modified catalog bytes.
- **V13.5 full handoff and production stage:** **not yet verified** at the initial integration checkpoint; do not substitute fixture tests for a full release qualification.
- **GitHub Pages deployment:** **not verified** at the initial integration checkpoint. A GitHub Actions build/upload step or a local stage is not proof of deployment.
- **Live HTTP response and asset fetches:** **not verified** at the initial integration checkpoint; only record a deployment run SHA and HTTP results if independently checked.

## Release gate and failure handling

The existing V13.5 `PUBLICATION_HANDOFF.json` continues to attest to its own pre-overlay build, while the separate game receipt records the later overlay and final asset-manifest hash. The publication overlay does **not** claim to be part of the earlier handoff signature. Its verifier checks both receipts. The stage's `deployment.performed` remains `false` until an external GitHub Pages run confirms deployment. Never infer publication from artifact assembly.

The publication pipeline aborts if a submodule is missing, a gitlink or version disagrees, output is missing or non-relocatable, references are absent, asset sizes exceed the cap, catalog/route IDs collide, a stage hash differs, or the V13.5 receipt fails. Do not bypass the V12 parity / catalog floor to accommodate this game.

## Completion ledger

| Milestone | State |
| --- | --- |
| Pinned source/build | Verified locally |
| Artifact Lab integration and tests | Implemented in isolated branch; tests passing |
| Full V13.5 handoff and versioned stage | Pending final integration run |
| GitHub Pages workflow and deployment | Pending merge/release approval and successful run |
| Hosted HTTP HTML/JS/assets and Hub entry | Pending external verification |

**Final integration commit:** pending final scoped commit.
**Deployment run / SHA:** none verified.
**Public URL HTTP status:** not asserted.
