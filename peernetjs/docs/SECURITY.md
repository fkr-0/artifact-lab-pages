# Security posture

PeernetJS v0.x is a connectivity and messaging library, not an authentication system.

## Trust boundaries

- PeerJS/WebRTC peer identifiers are transport identifiers, not cryptographic identities.
- A fixed lobby ID is discovery/election coordination, not access control.
- `sentAt`, message IDs, usernames, colors, capabilities, session records, and application payloads are peer-supplied data.
- The v1 message parser validates the Peernet envelope only. Every consumer must validate and authorize its own topic payloads before applying state or invoking work.
- No remote payload should be evaluated as code, interpolated into HTML, used as a filesystem path, or treated as an authorization decision without an application-specific validation layer.

## Persistence

The stable client has no implicit persistence. Legacy managers store JSON in browser `localStorage`; that data is local convenience state, not a trusted database. Import paths and remotely received session/save-state objects require schema, quota, and authorization hardening before promotion into the stable package API.

## File sharing

`peernet-file-share.js` is experimental legacy-adjacent code, not part of the stable package export. Its capability token authorizes possession of an offer URL but currently does not provide cryptographic file integrity, authenticated peer identity, resumable transfer integrity, or robust quota enforcement. Do not expose capability URLs in logs or durable public locations.

## Release gates

A public 1.0 should add application-facing schema hooks, payload/transfer limits, authenticated-identity integration points, threat-model fixtures for hostile peers, and a security disclosure policy. TLS on signalling alone would not turn peer-supplied application data into trusted data.
