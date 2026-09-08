# Publishing and versioning roadmap

## 0.1 — extraction baseline

Status of this pass: regular ESM package shape, transport-neutral client, versioned application envelope, PeerJS hub adapter, deterministic in-memory transport, lifecycle/failure tests, and explicit legacy entrypoints. Package remains private.

## 0.2 — consumer qualification

- Migrate one v11 Peer DAW slice behind the public API without changing its application protocol simultaneously.
- Migrate ORCA orchestration transport while retaining its compatibility facade.
- Add schema-validation hooks and payload-size policy.
- Put legacy user/session/storage managers behind injected storage and clock/id boundaries.

## 0.3 — browser/network qualification

- Automated browser matrix with a controlled PeerJS signalling service.
- Real two-peer and three-peer WebRTC evidence including hub loss/election, signalling interruption, reconnect, duplicate/late messages, and TURN-required topology.
- Record browser versions, ICE configuration, signalling version, timings, and artifacts.

## 0.x release discipline

Use semantic versioning for the new ESM API. Protocol changes are versioned independently inside the envelope. Breaking `PeernetClient`/transport changes require a semver major (while pre-1.0, a minor bump); additive topics do not require a library protocol bump.

Before any registry publish: resolve license provenance, choose/verify a package namespace, remove `private: true` deliberately, add peer/development dependency policy for PeerJS, generate an npm pack manifest, run clean-install tests, and attach conformance/browser evidence. Publishing, tagging, or pushing is outside this pass.

## 1.0 gates

A stable 1.0 requires documented API compatibility policy, browser support matrix, hostile-peer security tests, storage migration/versioning, observability semantics, real WebRTC reconnect evidence, and at least two migrated consumers without direct dependency on legacy control messages.
