# Changelog

## Unreleased

- Added a transport-neutral `PeernetClient` with explicit lifecycle, fail-closed direct delivery reporting, and versioned application envelopes with own-property validation.
- Added `PeerJsHubTransport`, containing the established `PeernetLobby` hub/mesh implementation behind a narrow transport contract.
- Added deterministic in-memory transport, a reusable transport conformance harness, and failure/recovery tests.
- Documented provenance, API/protocol semantics, compatibility limits, security posture, consumer migration, and publishing gates.
- Preserved the existing flat Peernet files as compatibility entrypoints; no consumer was silently rewritten.
