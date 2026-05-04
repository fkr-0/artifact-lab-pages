# PeerModGroove Architecture

PeerModGroove is a peer-based, Reason-alluded modular sound machine. Every tool is represented as an autonomous module with typed input and output ports. A module may generate control data, sound, both, or nothing until externally triggered.

## Core model

    PeerModGroove
    ├─ Peer graph
    │  ├─ local modules
    │  ├─ remote peer modules
    │  └─ shared patch events
    ├─ Transport
    │  ├─ bpm
    │  ├─ step
    │  └─ clock messages
    ├─ Patch bay
    │  ├─ control/control-data routes
    │  ├─ midi-like routes
    │  └─ audio routes
    └─ Mixer
       ├─ central master mixer
       └─ optional submixers owned by modules, e.g. ORCA-style groove mixer

## Port packet types

    midi-like:
      kind: midi
      type: note-on | note-off | cc | clock
      note: C4
      velocity: 0.0..1.0
      at: AudioContext time or null
      channel: logical channel string

    control:
      kind: control
      type: param | trigger | patch | transport
      target: module or param id
      value: any JSON-safe value

    audio:
      kind: audio
      node: AudioNode

## Module contract

A module should be as autonomous as possible. It can receive nothing, midi-like control, generic control, audio, or any subset of those. It can emit midi-like packets, control packets, audio nodes, or any subset of those.

    module = {
      id,
      title,
      kind,
      inputs: [{ id, type }],
      outputs: [{ id, type }],
      mount(root),
      unmount(),
      start(context),
      stop(context),
      receive(packet, inputId),
      connectAudio(destination, outputId),
      disconnectAudio(outputId),
      serialize(),
      hydrate(data)
    }

## First modules

| Module | Receives | Emits | Role |
|---|---|---|---|
| PianoRollModule | transport/control | midi-like | basic sequencer; emits note events only |
| ClockModule | none/control | control clock | transport source |
| BasicSynthModule | midi-like/control | audio | sound generator |
| FieldRecorderModule | control | audio/control | captures or imports audio; emits playback audio |
| MixerModule | audio/control | audio | central master mixer |
| PeerBridgeModule | control/midi-like | control/midi-like | Peernet broadcast adapter |

## Coexisting mixers

The central mixer is the default route for module audio outputs. A module may expose its own internal mixer if it is part of its instrument semantics. Those internal mixers should emit a single audio output to the central mixer, plus optional control ports for remote automation.
