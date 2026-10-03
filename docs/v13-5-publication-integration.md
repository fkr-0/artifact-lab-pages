# V13.5 publication integration

This repository remains the sole GitHub Pages deployment owner for artifacts.fkr.dev.

The V13.5 convergence project produces a qualified, non-publishing stage and a
PUBLICATION_HANDOFF.json receipt. The local adapter in
scripts/stage-v13-5-publication.mjs consumes that receipt and refuses to stage it
unless the Artifact Lab and V13.5 revisions, V12 44/44 parity, Meme Lab,
Revealive, catalog size, asset count, and recorded SHA-256 evidence all match.

Local qualification:

    ARTIFACTS_V13_5_ROOT=/home/user/code/artifacts-v13.5 \
      npm run stage:v13.5 -- --out /tmp/artifacts-v13.5-pages

The command performs no network publication and writes
V13_5_PAGES_INTEGRATION.json with deployment.performed=false.

## CI switch boundary

The live Pages workflow should switch its publication-stage producer only after
the V13.5 project has a stable remote repository identity and pinned commit.
Then CI can check out that pin, generate/verify its handoff against this Artifact
Lab revision, stage it with this adapter, and keep the existing deploy-pages job
as the sole deployment owner.

Do not overwrite the currently dirty primary Artifact Lab checkout merely to
perform this switch. Merge the adapter and later workflow switch from reviewed
clean work after active changes are reconciled.
