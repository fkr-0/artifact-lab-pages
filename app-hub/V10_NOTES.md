# NEXUS v10 Portal Notes

v10 is a clean portal runtime for lightweight app collaboration.

## Rule

- Lightweight apps use `peernetjs/peernet-lib.js` (`PeernetLobby`).
- Raw `new Peer(...)` app code should not be added to v10.
- PeerModGroove stays focused on peer-synchronized modular audio, not generic text editing.

## Included v10 apps

- Local-first Notepad: localStorage plus optional PeernetLobby mirroring.
- Shared Text Pad: lightweight last-write-wins lobby pad.
- Peer Console: debug broadcast console.
- Shared Step Sequencer: op-synchronized 16-step pattern toy and PeerModGroove handoff.
- PeerModGroove Launcher: opens the separate modular audio app from v10.

## Non-goals

- CRDT text editing.
- Replacing PeerModGroove's structured audio/session stack.
- Rewriting old v9 in place.

## URLs

Serve repo root and open:

    /app-hub/v10-portal.html

## Relationship to PeerModGroove

PeerModGroove is not v10 itself. It is a launchable app from v10, focused on modular audio, patching, transport, instruments, and peer-synced performance state.

## Shared transport clock

The sequencer publishes `transport:start`, `transport:tick`, and `transport:stop` messages over `PeernetLobby`. PeerModGroove consumes those messages when launched with `?seq=<docId>` and maps active ticks into MIDI-like PatchBay packets.
