# Artifacts ↔ V13.5 consolidation feasibility (2026-10-22)

## Ownership and actual repository boundaries

| Root | Upstream | Purpose |
| --- | --- | --- |
| `~/code/artifacts` | `fkr-0/artifact-lab-pages` | Canonical artifact source tree and registry; Pages workflow; submodules, builds, published release adapters and shipped payloads. |
| `~/code/artifacts-v13.5` | `fkr-0/artifacts-v13.5` | V12-compatible hub UI, frozen V12 baseline, release assembler, parity and asset manifests, publication handoff generator, independent tests and evidence snapshots. |
| `~/code/artifacts/ethic-brawl` | `fkr-0/ethic-brawl` (gitlink) | Dedicated upstream game source; the portfolio pins and consumes a particular version. |

The two top-level repos have **different Git histories** and independent release
invariants. A plain `git merge` from the main project does not merge source
files into an intended subdirectory and would collide with existing names.
A history-preserving `git subtree` migration is possible.

## Completed safe prototype (not deployed)

- **Prototype branch:** `consolidation/hub-v13-5-prototype-20261022`
- **Prototype head:** `bfb668e3461326076e495488a88f94caa6d2676d`
- **Imported location:** `hub-v13.5/` (82 tracked hub files).
- Imported with `git subtree add --prefix=hub-v13.5
  /home/user/code/artifacts-v13.5 main` without squashing history.
  The prototype merge has parents `d1f8cf6c896acfbade6d6e9fa37cceeccf48f397`
  (Artifact Lab) and `e6eb4909cf13734edc5adec652b2a4ac75df9c4d`
  (Hub).
- The prototype's **hub unit suite passed 26/26**, strict build passed
  **44/44** V12 expected routes and assembled **64 artifacts**. A Chromium
  smoke test rendered 64 artifacts, found Meme Lab and opened a route.
- **Important limitation:** this test used
  `ARTIFACTS_SOURCE_ROOT=/home/user/code/artifacts`, pointing back at the
  existing canonical checkout. It proves code/history co-location is viable,
  **not** that an isolated single checkout can build and publish yet.
- All work was confined to the prototype branch. No published workflow,
  production branch, external remote, or public site was changed.

## Why not remove the standalone V13.5 repository today?

The current `.github/workflows/pages.yml` in Artifact Lab explicitly:

1. checks out `fkr-0/artifacts-v13.5` at the exact
   `ARTIFACTS_V13_5_REVISION` (currently `53c397650860b03bbed12f0da476dd0ae1a88abe`);
2. runs `publication:handoff` **inside that second Git repository**;
3. validates and publishes via the source project's
   `stage-v13-5-publication.mjs`, requiring a separately attested hub
   Git revision, canonical source revision, exact parity and file hashes.

Just embedding the V13.5 files is insufficient: its build/handoff defaults
still point to `~/code/artifacts`, and the adapter deliberately verifies
both Git roots. An unmodified deployment workflow would continue fetching the
standalone repository, ignoring the new subtree.

The other, newer, locally committed hub dashboard at `e6eb490` is not the
version presently pinned by Pages. A migration needs an explicit, reviewed
promotion of that code; do not label a local build as deployed.

## Proposed complete monorepo migration

1. **Make builds self-contained:** use `<superproject>/hub-v13.5` as the
   hub path and `<superproject>` as the source path; check the expected
   registry schema and refuse a missing parent checkout. Use an exact
   `--source-root` override only for local tests.
2. **Migrate publication metadata:** replace the two-repository attestation
   with a **single immutable source commit**, plus separately hashed
   `hub-v13.5/` inputs and the assembled payload. Preserve strict
   source-change review, route manifest, asset SHA-256 verification and V12
   `44/44` parity. Do **not** skip pin checks without a replacement.
3. **Update Pages workflow:** remove the secondary checkout; run
   `hub-v13.5` tests and handoff from the main checkout; stage from
   `hub-v13.5/dist`; compare the output's recorded source commit to
   `github.sha`. Keep `deploy-pages` approval and the staged-vs-deployed
   distinction.
4. **Qualify from one clean checkout:** build nested submodules and
   Git Recipe Book first; run both projects' suites, exact-route assertions,
   standalone browser testing, and an immutable-file verification of the
   publication archive. An additional negative test must fail on tampered
   content or a wrong checkout revision.
5. **Migrate reproducibly:** merge the prototype branch into main only after
   the above gates pass. Publish through GitHub Pages and confirm that all 64
   artifacts are accessible before archiving the now-redundant independent
   V13.5 repository/checkout. Keep its Git history and remote in archival
   form if needed for previous release receipts.

## Current uncommitted Ethic Brawl boundary

Ethic Brawl is a **separate repository**, NOT a duplicated source folder:
`https://github.com/fkr-0/ethic-brawl` attached as a submodule.
The portfolio's gitlink remains `2754b6e9` (documented 1.7.4 source).
The local submodule checkout is `9e53636e` and its main is
**17 commits ahead of origin/main**. The local new revision includes newer
release and sprite work; the GitHub Pages source pin has **not** been
promoted. Two sizeable `.atls` review files in the submodule are untracked
and were preserved. Do not silently point a production release at those
unpublished commits or change the pin to remove a dirty status.

## Source-change consolidation 2026-10-22

- Quiz keyboard/focus/accessibility code and Playwright E2E coverage committed.
- Groove Scratch Studio 1.4.0 GUI/CLI source, schemas and Node/Python tests committed.
- Release metadata and generated source catalog revalidated/recommitted.
- Generated `dist/`, `.wsbridge/` and validation JSON are ignored (left
  physically intact); no project data was deleted.
- Playwright supports `ARTIFACTS_CHROMIUM_EXECUTABLE` for system Chromium.
- Two stale historical tests were corrected after earlier release imports;
  the full root `npm test` suite now passes **218/218**.

**No push, deployment or destructive Git reset has been performed.**
