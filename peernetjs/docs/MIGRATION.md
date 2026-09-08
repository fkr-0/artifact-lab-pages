# Consumer migration guidance

No consumer was rewritten by this extraction pass. Migrations should be explicit, tested changes in each owning project.

## v11 Peer DAW

Current state:

- `src/modules/peer-bridge.js` imports a synchronized `vendor/peernet-lib.js` copy and talks directly to `PeernetLobby`.
- `src/core/peernet-stack.js` composes browser-global `PeernetSharedCore`, user, session, and storage managers.
- The parent vendor-sync test currently reports drift for the v11 copies versus canonical reconnect-enabled sources. Treat that as existing checkout state, not as a reason to silently overwrite v11.

Recommended staged migration:

1. Add `PeerJsHubTransport` + `PeernetClient` behind `PeerBridgeModule` while preserving its `pmg-packet` module contract.
2. Translate `pmg-packet` to a namespaced topic such as `v11/pmg-packet`; validate packet shape at the module boundary.
3. Move `PeernetStack` networking to the transport contract, but keep user/session/storage managers as explicit optional services until their persistence APIs are redesigned.
4. Replace copied vendor files only after v11 build/deploy tests prove direct package imports work in Vite and static deployment.
5. Run v11 unit/build/browser smoke and a deliberate two-browser WebRTC test before removing compatibility imports.

Do not change the logical session/hub naming in the same migration as the API swap; that would combine wire compatibility and transport changes unnecessarily.

## Peernet ORCA

ORCA is already close to the target architecture. `shared-core-adapter.js#createTransport()` implements the same narrow shape adopted by the new package, and `OrcaOrchestrationEngine` is transport-agnostic.

Recommended migration:

1. Keep the legacy VAPOR·ORCA room data plane untouched initially.
2. Replace only the orchestration adapter's internal `PeernetSharedCore` construction with `PeerJsHubTransport`, or inject a `PeernetClient` if ORCA wants v1 envelope/topic validation at that boundary.
3. Preserve `OrcaSharedPeernet.start()/stop()/core` as a compatibility facade until callers no longer inspect `.core`.
4. Re-run ORCA's deterministic adapter/orchestration suite, especially hub election, partition reconnect, logical-node-to-transport-peer mapping, and degraded local execution.
5. Only then consider converging the older music-room data plane onto the same transport. That is a separate protocol migration, not required for library adoption.

ORCA's existing deterministic in-memory PeerJS tests are structural/simulated evidence. They must not be relabeled as real multi-peer WebRTC E2E.
