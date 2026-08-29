# Peernet ORCA

Peernet ORCA is a browser-based collaborative music environment with an additive peer-to-peer orchestration plane. The existing VAPOR·ORCA room protocol still carries live grid, cursor, BPM, transport, and mixer collaboration. The new orchestration layer provides reusable peer discovery, session negotiation, and capability-based task distribution without making the music room depend on those primitives.

## Current codebase audit

The project is deliberately small and is embedded in the larger v11 artifact repository.

| Path | Status | Responsibility |
| --- | --- | --- |
| `index.html` | Implemented | Complete VAPOR·ORCA UI/audio engine plus the legacy `vo-<code>` PeerJS room data plane. |
| `shared-core-adapter.js` | Implemented | Compatibility bridge from ORCA to the canonical `PeernetSharedCore`, plus the transport facade used by the orchestration engine. |
| `orchestration-core.js` | Implemented | Headless discovery, session negotiation, task placement, leases, result routing, and degraded local execution. |
| `orchestration-bootstrap.js` | Implemented | Browser wiring between legacy room lifecycle events and the orchestration engine. |
| `tests/` | Implemented | Headless lifecycle and realistic shared-core/PeerJS simulation tests. |

The older repository inventory described separate `app.js` and `peernet.js` files. That description is stale: the current application logic is inline in `index.html`; shared Peernet runtime code lives in the sibling `peernetjs/` directory.

### Still intentionally missing

- A durable/persisted orchestration queue. Tasks are in-memory and use bounded leases.
- Authentication, authorization, cryptographic peer identity, or untrusted-code execution. A task handler is local application code; task payloads must be treated as untrusted data.
- Cross-session task scheduling. Remote candidates are restricted to the active logical session when a task has one.
- A native V12 artifact manifest for ORCA. The larger artifact catalog currently reaches ORCA through legacy compatibility metadata.
- A self-hosted signalling service. The page loads PeerJS from a CDN and PeerJS/WebRTC still requires signalling infrastructure even though ORCA has no application server.

## Architecture

```text
┌─────────────────────────────────────────────────────────────────────┐
│ index.html — VAPOR·ORCA                                            │
│  legacy room: vo-<code>                                            │
│  grid / cursor / BPM / transport / mixer                           │
└───────────────┬─────────────────────────────────────────────────────┘
                │ orca:legacy-session events
                v
┌───────────────────────────────┐
│ orchestration-bootstrap.js    │
└───────────────┬───────────────┘
                v
┌─────────────────────────────────────────────────────────────────────┐
│ OrcaOrchestrationEngine                                            │
│ peer discovery → session negotiation → capability/task placement   │
└───────────────┬─────────────────────────────────────────────────────┘
                │ narrow transport contract
                v
┌───────────────────────────────┐       ┌─────────────────────────────┐
│ shared-core-adapter.js        │──────>│ peernetjs/PeernetSharedCore│
└───────────────────────────────┘       └──────────────┬──────────────┘
                                                       v
                                                 PeerJS / WebRTC
```

The two network planes are additive:

- **Music room data plane:** the original host/guest session in `index.html`. It is optimized for immediate shared editor state and preserves the existing user experience.
- **Orchestration plane:** a stable shared Peernet hub used to discover capabilities and negotiate logical ORCA sessions. It can reconnect independently after a signalling/network interruption and can continue local work if shared networking is unavailable.

## Orchestration API

The browser bootstrap exposes the running engine as `window.OrcaOrchestrator`.

```js
const engine = window.OrcaOrchestrator;

engine.registerTaskHandler('waveform:analyze', async (payload) => {
  return analyzeLocally(payload.samples);
});

const task = engine.submitTask({
  kind: 'waveform:analyze',
  payload: { samples: [0.1, -0.2, 0.3] },
});

engine.on('task:completed', (completed) => {
  if (completed.id === task.id) console.log(completed.result);
});
```

Task handlers automatically become advertised capabilities. A scheduler chooses the least-loaded discovered peer in the same active session that advertises every required capability. Local fallback is held to the same required-capability gate. Assigned work has a lease; `engine.tick()` expires stale leases and tries another eligible worker. Bounded heartbeats keep quiet healthy peers discoverable, and a fresh peer announcement reconsiders queued work after transient delivery or partition failures.

For explicit logical sessions:

```js
engine.openSession({ id: 'orca:ABCDE', title: 'Studio ABCDE' }); // owner
engine.requestSession('orca:ABCDE');                            // participant
engine.leaveSession();
```

The browser bootstrap performs this negotiation automatically from the existing create/join/disconnect room lifecycle. It also propagates the legacy display name to the shared core identity when that core is available. The initializer is exported for deterministic qualification while `index.html` retains automatic module startup.

## Shared-core adapter contract

`OrcaSharedPeernet` preserves the older compatibility surface:

```js
OrcaSharedPeernet.start();
OrcaSharedPeernet.stop();
OrcaSharedPeernet.core;
```

It additionally exposes a transport facade:

```js
const transport = OrcaSharedPeernet.createTransport({
  namespace: 'orca-orchestration-v1',
  hubId: 'orca-orchestration-v1-hub',
  channel: 'orca-orchestration',
});

transport.subscribe((message, meta) => console.log(meta.peerId, message));
transport.onHealth((health) => console.log(health.state));
transport.start();
transport.broadcast({ hello: 'peers' });
```

If `PeernetSharedCore` is absent, `start()` returns `false`, health reports an offline/degraded state, and send/broadcast operations fail without throwing. This is deliberate: local ORCA audio/editing and locally satisfiable orchestration tasks remain usable.

## Relationship to the v11 Peernet ecosystem

`peernetjs/` is the canonical browser runtime in this repository. ORCA consumes `PeernetSharedCore` directly through `shared-core-adapter.js`; it does not vendor or fork that implementation.

`v11-peer-daw/src/core/peernet-stack.js` is a sibling integration with a broader responsibility. `PeernetStack` composes the same shared core with the Peernet user, session, and storage managers for the DAW. ORCA intentionally keeps its orchestration core narrower: application session/task semantics are headless and transport-agnostic, while identity/storage managers remain optional ecosystem services rather than hidden engine dependencies.

This split gives v11 artifacts a common wire/runtime foundation without forcing every artifact to adopt the same application-level session model.

## Development and verification

No install is required for the headless test suite.

```sh
cd peernet-orca
npm test
npm run check
```

The adapter tests load the real sibling `../peernetjs/peernet-shared-core.js` into an isolated VM and exercise it with a deterministic in-memory PeerJS network. They cover initial hub election/connection, message delivery, network-partition reconnection, startup failure reporting, the missing-shared-core degradation path, and compatibility reconnect behavior for the older shared-core contract.

The orchestration tests use a transport-only in-memory mesh so discovery/session/task logic is verified independently from PeerJS. Bootstrap tests drive the legacy host/guest/disconnect lifecycle against a headless browser target and statically verify that `index.html` still emits the lifecycle hooks and loads the module bootstrap.

