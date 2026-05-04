# PeerModGroove

PeerModGroove is a new artifact subtree for a peer-based modular sound machine inspired by Reason-style routing and the NEXUS v9 spaceship console look.

## What is copied in

    PeerModGroove/vendor/
    ├── peernet-lib.js                 # reusable PeernetLobby source
    ├── peer-music-groove-app.js       # current groove station source snapshot
    ├── peer-music-groove-index.html   # current groove station UI snapshot
    ├── peernet-orca-index.html        # ORCA-style peer music artifact snapshot
    └── v9-portal.html                 # spaceship/starfield hub source snapshot

## New redesign files

    PeerModGroove/
    ├── index.html
    ├── style.css
    ├── docs/ARCHITECTURE.md
    └── src/
        ├── app.js
        ├── core/
        │   ├── audio.js
        │   ├── contracts.js
        │   └── patchbay.js
        └── modules/
            ├── basic-synth.js
            ├── clock.js
            ├── field-recorder.js
            ├── mixer.js
            ├── peer-bridge.js
            └── piano-roll.js

## Current default patch

    Transport Clock.clock
      -> Piano Roll.clock
      -> Piano Roll.midi
      -> Basic Synth.midi
      -> Central Mixer.audio

The piano roll intentionally emits midi-like JSON control only. It does not produce sound. Sound generators, recorders, and future instruments receive control and optionally emit audio.

## Run

Serve the repository root and open:

    /PeerModGroove/index.html

From bridge.yml after this patch:

    bridge run serve:peermodgroove
    bridge run lint:peermodgroove

## Design direction

- Keep modules autonomous.
- Let modules expose typed ports rather than relying on global app state.
- Treat MIDI as JSON-safe control data, not a requirement to use browser MIDI APIs.
- Keep one central mixer as the default master bus.
- Allow instrument-owned mixers, such as ORCA-style submixers, to coexist by emitting one audio output to the central mixer.
- Use PeernetLobby for peer graph synchronization of patch/control/midi events.


## Test strategy

Current repo-safe checks are dependency-free and shell runnable:

    node PeerModGroove/tests/smoke-contracts.mjs
    node --check PeerModGroove/src/app.js
    for f in PeerModGroove/src/core/*.js PeerModGroove/src/modules/*.js; do node --check "$f"; done

These are wired into:

    bridge run lint:peermodgroove
    bridge run smoke:peermodgroove

Recommended next layer is a browser smoke harness that serves the artifact and checks layout overflow, WebAudio boot, module add/remove, and session storage through a headless browser. I kept this pass dependency-free to avoid creating a package-manager island inside the static artifact repo.

## Peernet 4-layer architecture

PeerModGroove now loads the latest manager stack from vendor/peernet:

    identity   -> PeernetUserManager
    network    -> PeernetSharedCore
    sessions   -> PeernetSessionManager
    storage    -> PeernetStorageManager

The app adapter lives in src/core/peernet-stack.js and binds session/storage capture to the current rig serialization.

## Added modules in enhancement pass

    CleanSynthModule    -> MIDI/control in, polished filtered synth audio out
    CleanSamplerModule  -> MIDI/trigger in, sample audio out with pitch-rate mapping
    OcraGridModule      -> clock/control in, midi out, optional internal click submix audio out
    Master mixer UI     -> resizable panel, per-audio-module strips, contained overflow
