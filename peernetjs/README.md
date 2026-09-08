# PeernetJS

PeernetJS is the canonical peer-messaging runtime extracted from the larger artifacts repository. This directory now has a regular package boundary while preserving the browser scripts that existing v11 applications use.

The stable direction is deliberately narrower than the historical surface:

```text
application
    |
    | topic + payload
    v
PeernetClient                stable application/lifecycle boundary
    |
    | versioned envelope
    v
transport contract           discovery/retry/peer identity boundary
    |
    +-- PeerJsHubTransport -> PeernetLobby -> PeerJS / WebRTC
    |
    `-- InMemoryTransport  -> deterministic tests only
```

## Status

`0.1.0-dev.0` is an extraction baseline, not a public release. The package is `private: true` because standalone license/package-namespace provenance has not yet been resolved. Existing flat files remain compatibility entrypoints.

## Quick start

```js
import { PeernetClient, PeerJsHubTransport } from './src/index.js';

const transport = new PeerJsHubTransport({
  lobbyId: 'my-studio-v1',
  username: 'pilot',
  Peer: globalThis.Peer,
});
const client = new PeernetClient({ transport });

client.on('message:chat/message', ({ from, payload }) => {
  console.log(`${from}: ${payload.text}`);
});

await client.start();
client.broadcast('chat/message', { text: 'hello' });
```

The v1 application envelope is namespaced (`protocol: "peernet/message"`) and intentionally does not use the historical top-level `type` field. That prevents application messages from colliding with legacy hub-control operations such as `join`, `peer-list`, and `peer-left`.

## Project boundaries

- `src/` — new ESM API and transport adapters.
- `src/testing/` — deterministic in-memory transport; not production networking.
- `test/` — package-local deterministic contract/lifecycle tests.
- `docs/` — API, wire semantics, provenance, compatibility, security, migration, and release roadmap.
- `peernet-lib.js` — established `PeernetLobby` PeerJS hub/mesh runtime, including inherited health/reconnect work.
- `peernet-shared-core.js` plus user/session/storage helpers — historical browser-global ecosystem retained for current consumers.
- `peernet-file-share.js`, mini-apps, app-loader, and session-router — experimental/legacy-adjacent helpers; not part of the stable top-level API and excluded from the publishable package file set.

## Verification

```sh
npm test
npm run check
```

Package-local tests are deterministic and do not require a signalling server or real WebRTC peers. `@peernet/peernetjs/testing` also exports `runTransportConformance()` so alternate transports can qualify the same start/health/direct-send/broadcast/stop contract, with optional partition/recovery qualification. The surrounding repository and Peernet ORCA contain simulated PeerJS hub/reconnect tests against the canonical legacy sources. None of those simulations is evidence of a real multi-machine peer session.

## Documentation

- `docs/API.md` — public API and transport contract.
- `docs/PROTOCOL.md` — v1 application envelope and historical wire boundary.
- `docs/COMPATIBILITY.md` — browser/runtime requirements and evidence limits.
- `docs/SECURITY.md` — trust boundaries and non-goals.
- `docs/PROVENANCE.md` — extraction history and publication constraints.
- `docs/MIGRATION.md` — v11 Peer DAW and Peernet ORCA migration sequence.
- `docs/ROADMAP.md` — consumer, browser, security, versioning, and publishing gates.
