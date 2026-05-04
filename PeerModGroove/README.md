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
