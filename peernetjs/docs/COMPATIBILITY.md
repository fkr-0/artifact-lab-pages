# Runtime and browser compatibility

## Supported design target

The core ESM API requires standard modern JavaScript features: ES modules, Promise, Map/Set, optional chaining, and `globalThis`. The production PeerJS adapter additionally relies on browser `EventTarget`/`CustomEvent` through the inherited `PeernetLobby` implementation and on a PeerJS-compatible WebRTC environment.

The package tests run on Node 20+ with browser primitives shimmed only where Node does not provide them. Node test success is not evidence of WebRTC interoperability.

## PeerJS

Repository consumers currently use PeerJS 1.5.x (v11 Peer DAW declares `^1.5.4`; browser artifacts also load 1.5.2/1.5.4). `PeerJsHubTransport` therefore preserves the constructor/connect/event surface already exercised by those applications. A registry dependency is intentionally not added during extraction because browser consumers inject or globally load PeerJS today.

## Browser claims

This pass does **not** claim a real multi-browser or multi-machine WebRTC qualification. Before public release, run a maintained browser matrix against actual PeerJS signalling and WebRTC data channels. At minimum qualify current Chromium, Firefox, and Safari releases and record signalling server, ICE/TURN configuration, network topology, reconnect duration, and evidence artifacts.

## Storage

The new `PeernetClient` has no persistence dependency. The historical lobby can optionally persist a username via `storageKey`; storage exceptions are contained and surfaced as `storage-error`. The legacy user/session/storage managers still access `localStorage` directly and should be migrated behind an explicit storage adapter before they become part of the stable API.
