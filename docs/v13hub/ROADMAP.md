# V13Hub roadmap

This roadmap separates product value from network ambition. Items do not imply that a capability currently works or has network proof.

## P0 — product foundation (implemented)

- Registered `app-hub-v13` source at `src/v13hub`.
- Native-manifest publication path independent of deleted V11 hub code.
- Responsive discovery workbench with deterministic ordering, product/evidence facets, collected-only view, and token search across descriptive, release, and provenance fields.
- Metadata preview with separate health, provenance, and publication-boundary sections plus receipt-backed health semantics.
- Explicit loading, empty, and authoritative-load failure states; keyed card reuse preserves DOM/focus continuity across unrelated renders and repeated filtering.
- Permissioned browser-local collection storing stable artifact IDs only, with mutation results reconciled from persisted browser bytes and stale IDs scrubbed before re-enablement.
- External-content review gate and same-origin launch classification.
- Read-only Peernet health adapter seam; no automatic transport startup.
- WCAG-AA-qualified dim text, keyboard/modal focus restoration, 320px-to-desktop reflow, 44px interactive targets, and reduced-motion behavior.
- Pure model tests, adversarial trust tests, publication tests, static UI contracts, large-catalog search qualification, and Chromium workflow coverage.

## P1 — product-strength catalog and preview layer

- Add catalog schema evolution tests and explicit compatibility negotiation.
- Merge repository validation diagnostics into generated catalog records so “manifest valid”, “ownership valid”, and “release verified” remain separate evidence axes.
- Add receipt-file drill-down and SHA-256 copy actions without treating hashes as authenticity signatures.
- Generate safe static preview assets at build time for artifacts that explicitly opt in; keep executable previews isolated and disabled by default.
- Add saved local views and user-authored labels behind the same explicit storage permission boundary.
- Add import/export for the local **collection list** with schema/version validation and no embedded artifact payloads.

## P2 — collection as a durable local product

- Replace raw localStorage with an IndexedDB repository supporting transactions, schema migration, quotas, and explicit purge/export.
- Add local collection groups, notes, and recency without modifying canonical artifact metadata.
- Add offline catalog snapshots with source hash, generated-at value, and stale-state UI; never silently substitute stale data for current publication evidence.
- Add a service worker only after its cache scope and artifact network policies can be derived from manifests.

## P3 — permissioned Peernet handoff

- Define a versioned `v13hub.peer-offer/v1` envelope with sender/session identity, short-lived capability token, artifact ID, optional manifest hash, expiry, and size bounds.
- Implement a Peernet adapter that exposes read-only health plus a queue of offers; transport messages never dispatch directly into hub reducer state.
- Require user approval before requesting metadata and a second trust decision before collecting/launching any received artifact.
- Verify offered metadata against a local manifest/receipt or show it permanently as **unverified peer metadata**. Never promote a peer offer into the authoritative catalog automatically.
- Add expiration, replay protection, wrong-peer rejection, transfer size limits, and deterministic protocol tests inspired by `PeernetFileShare`.

## P4 — regular product architecture

- Move contracts to TypeScript with generated JSON Schema and editor-visible discriminated unions.
- Introduce a component/runtime layer only when navigation, persisted views, and preview isolation justify it; keep catalog/search/collection/peer ports framework-neutral.
- Add worker-backed full-text search and optional local semantic indexing with reproducible index versions.
- Add provenance graph views linking artifact → manifest → source ownership → build → receipt → publication.
- Add plugin contracts for artifact-specific previewers with sandbox/capability declarations and explicit network policies.

## P5 — distribution and federation research

- Signed publication indexes and receipt signatures, after key ownership and rotation policy are defined.
- Content-addressed local artifact cache with quota/eviction policy.
- Peer-assisted transfer of already-verified release bytes where the expected digest is known before transfer.
- Multiple catalog subscriptions with origin trust policy, explicit enablement, and per-origin health—not an ambient global feed.

## Open risks

1. The repository still contains substantial inherited dirty/deleted history; V13Hub intentionally does not reinterpret those unrelated changes.
2. Native `artifactctl` validation currently has known ownership failures elsewhere in the portfolio. V13Hub displays catalog evidence but does not resolve those ownership defects.
3. PeernetJS contains useful headless ideas alongside legacy auto-apply/session behavior. Reuse should happen behind a new adapter/protocol, not by loading all legacy globals into V13Hub.
4. A static site can enforce “do not fetch remote content” in the hub, but artifacts launched in a new window retain their own declared network behavior; manifest network policy must eventually become publish-time enforcement.
5. “Verified” currently means a repository-generated artifact receipt passed its configured verification profile. It is not a cryptographic identity or supply-chain signature.
