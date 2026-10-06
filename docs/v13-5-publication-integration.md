# V13.5 publication integration

This repository remains the sole GitHub Pages deployment owner for artifacts.fkr.dev.

The V13.5 convergence project produces a qualified, non-publishing stage and a
PUBLICATION_HANDOFF.json receipt. The handoff records both its canonical source
pin and the actual Artifact Lab checkout revision used for assembly. The local
adapter in scripts/stage-v13-5-publication.mjs consumes that receipt and refuses
to stage it unless the Artifact Lab and V13.5 revisions, V12 44/44 parity, Meme
Lab, Revealive, catalog size, asset count, and recorded SHA-256 evidence all
match.

Local qualification:

    ARTIFACTS_V13_5_ROOT=/home/user/code/artifacts-v13.5 \
      npm run stage:v13.5 -- --out /tmp/artifacts-v13.5-pages

The command performs no network publication and writes
V13_5_PAGES_INTEGRATION.json with deployment.performed=false.

## CI publication boundary

The live Pages workflow checks out an immutable V13.5 revision, generates its
handoff against the current Artifact Lab checkout, stages that qualified output,
and verifies V13_5_PAGES_INTEGRATION.json. The adapter permits an Artifact Lab
checkout newer than the V13.5 qualification pin only when all intervening
changes are in the reviewed integration-only path set.

The verified .artifacts-pages-stage directory is the terminal upload input.
Nothing may rebuild or selectively rewrite that directory after receipt
verification; any such composition change requires a new handoff and receipt.
