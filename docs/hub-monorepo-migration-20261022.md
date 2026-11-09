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

The deployed `.github/workflows/pages.yml` on the remote `main` branch still:

1. checks out `fkr-0/artifacts-v13.5` at the exact
   `ARTIFACTS_V13_5_REVISION` (updated on remote `main` to `7f4c563942aa6d756760d7cd6870019c09e5a72a`);
2. runs `publication:handoff` **inside that second Git repository**;
3. validates and publishes via the source project's
   `stage-v13-5-publication.mjs`, requiring a separately attested hub
   Git revision, canonical source revision, exact parity and file hashes.

Just embedding the V13.5 files is insufficient: its build/handoff defaults
still point to `~/code/artifacts`, and the adapter deliberately verifies
both Git roots. An unmodified deployment workflow would continue fetching the
standalone repository, ignoring the new subtree.

The remote Pages pin includes the newer hub dashboard, but it still fetches
its code from a separate repository. The monorepo branch changes that release
authority without claiming its candidate has already been deployed.

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

## Isolated finalization candidate (2026-10-22; not deployed)

- **Local worktree branch:** `consolidation/hub-v13-5-ready-20261022`.
  It merges the history-preserving hub prototype with the remote Pages
  `main` at `a51908026306f0787a7302ca421b26fbca7810b0`, preserving
  the public release additions while removing the secondary hub checkout from
  the candidate workflow.
- **One-checkout implementation:** `hub-v13.5/` is tracked directly;
  `scripts/qualify-monorepo.mjs` builds its catalog and release stage from
  the same immutable Git commit. The stage receipt binds that commit and the
  `HEAD:hub-v13.5` tree. The site upload consumes exactly the validated stage,
  with per-file SHA-256 and strict 44/44 V12 parity.
- **Verified in an isolated worktree:** initialized all seven pinned Git
  submodules, including the independent Ethic Brawl release pin. Built
  Revealive, Badger, PeerJS lobby, Git Recipe Book and the V11 DAW; passed
  Hyperblast release checks. Node suites passed **221/221** root,
  **26/26** embedded hub, and **20/20** publication-adapter tests. The
  registry validated **24/24** descriptors without errors/warnings.
- **Publication stage:** **64** catalog entries, **44/44** expected legacy
  routes, zero missing, **706** files (**704** content-hashed stage files).
  Chromium browser smoke rendered all 64, located Meme Lab and successfully
  navigated its launch route.
- **Immutable-source guard:** both tracked changes and non-ignored untracked
  source files must be rejected; only intentionally ignored generated build
  outputs are admissible. Pinned submodules must match their Git links.
  Badger's known generated `packages/{progression,sprite-contracts}/dist`
  tracked differences are explicitly recognized during qualification.
- **Release boundary:** no external push, merge to production `main`,
  GitHub Pages deployment or public-site verification is claimed. The old
  `artifacts-v13.5` checkout and the compatibility adapter remain in place
  until the candidate is published and rollback constraints are reviewed.

**Cutover gates:** re-run qualification on the exact final commit; review the
published Pages workflow diff; promote the branch to the deployment owner's
`main`, verify the Pages artifact and public URL, then retire the separate
hub checkout. Do not remove application submodules or V11 compatibility routes
solely because the hub/publisher migration has succeeded.

**No push, deployment or destructive Git reset has been performed.**
