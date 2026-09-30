# V13Hub architecture

Status: implemented product boundary, converged 2026-09-15

## Intent

V13Hub is the catalog-facing product boundary for Artifact Lab. It is intentionally not an artifact owner, package manager, Peernet daemon, or remote-content proxy. The product turns the old release-card launcher into an evidence-oriented discovery and local collection surface while preserving the rule that manifests, source ownership, builds, and receipts remain authoritative outside the hub.

## Information architecture

```text
V13Hub
├── landing / posture
│   ├── catalog evidence count
│   ├── receipt-backed release count
│   ├── browser-local collection count
│   └── peer gateway state (no inferred connectivity)
├── trust rail
│   ├── provenance contract
│   ├── local collection permission
│   └── peer boundary / supplied health proof
├── discovery workbench
│   ├── token search
│   ├── product and evidence facets
│   ├── collected-only view
│   ├── recent/title ordering
│   └── artifact cards
└── metadata preview
    ├── health evidence
    ├── source/Git provenance
    ├── receipt facts
    ├── local launch when same-origin and evidenced
    └── explicit review gate for external destinations
```

“Preview” deliberately means metadata/evidence preview. V13Hub does not iframe an artifact or fetch an external URL to produce a preview. That avoids turning catalog inspection into implicit code execution or remote tracking.

## Modules

| Module | Responsibility |
|---|---|
| `contracts.js` | Normalize catalog records, validate catalog identity, derive artifact-health evidence, expose provenance, and classify launch targets. |
| `catalog.js` | Load only known same-site catalog candidates; reject wrong schema and malformed records; no synthetic fallback. |
| `search.js` | Pure deterministic token filtering, facets, collected-only selection, and ordering. |
| `collection.js` | Browser-local ID collection behind an explicit permission bit; storage failures fail closed. |
| `peer-boundary.js` | Read an explicitly injected adapter's health report without starting a transport; review remote capability offers without auto-applying them. |
| `state.js` | Small reducer separating catalog, filters, collection, peer state, and selected preview. |
| `view.js` | DOM-only rendering with text nodes/textContent and no remote rendering surface. |
| `app.js` | Browser wiring, event delegation, permission transitions, and catalog startup. |

The modules are ordinary ESM with no framework dependency. That keeps the current static publication model cheap while giving a future application shell stable seams to replace individually.

## Data authority and health semantics

V13Hub consumes `artifacts.fkr.dev/catalog-v1`. It does not mutate catalog objects. `artifactctl` only emits compact catalog receipt metadata after the staged `.artifact-receipt.json` has `verification.ok === true`; the browser still requires the catalog's `availability=verified` claim to be paired with a structurally complete receipt (`version`, non-negative file count, and parseable `generatedAt`) whose version matches the artifact version when one is declared. A contradictory `verified` record with missing, malformed, or version-mismatched receipt evidence rejects the catalog candidate rather than rendering green.

Health and provenance are modeled as independent evidence axes:

```text
source ownership  -> reported metadata | unknown
validation        -> unknown in catalog-v1 (validator results are not exposed)
receipt           -> verified only from coherent verified+receipt evidence
runtime           -> unknown from catalog data
network / peer    -> unknown from catalog data
```

Non-verified availability remains descriptive (`provisional`, `source-only`, `external`, `inline`) rather than being promoted into release health. A green-looking “healthy” state is never inferred from `status=active`, URL existence, runtime reachability, or a peer claim. Git basis/revision, validation, receipt, runtime, and network state therefore remain distinct instead of being collapsed into one status.

## Collection contract

The collection is a local reading/listening queue, not a package installation mechanism.

```text
initial state
  permission = false
  storage writes = 0
      |
      | explicit “Enable local collection”
      v
permission = true
  stored values = sorted artifact IDs only
      |
      +-- toggle IDs
      +-- clear IDs
      `-- disable & clear
```

No artifact metadata, remote payload, user profile, timestamp, or peer identity is persisted. Storage exceptions return a failed result instead of silently switching to another persistence mechanism.

## PeernetJS extraction

The canonical `peernetjs/` code informed four choices:

1. `PeernetSharedCore.health()` demonstrates that connection state should be explicit and evidence-bearing, with a real `connected` boolean, role, peer count, and transition data.
2. `PeernetFileShare` demonstrates short-lived capability-bearing offers and target-peer/token checks rather than ambient shared state.
3. `PeernetStorageManager` demonstrates namespaced local persistence and bounded ownership of stored state.
4. The session/user managers demonstrate useful headless boundaries, but their legacy behavior can auto-join/apply incoming session state. V13Hub intentionally does **not** copy that behavior.

V13Hub does not start peer networking at page load. A host may explicitly inject `window.__V13HUB_PEER_ADAPTER__` with a read-only `health()` method, or the user may explicitly opt in to the built-in PeerJS diagnostic lobby. That lobby may establish/accept connections only to observe connectivity and peer identity; it sends no application-level hello, username, metadata, broadcast, catalog, collection, or release payload. V13Hub reports “connected” only when the adapter or opt-in lobby explicitly reports `connected === true`; an omitted connectivity boolean is unproven, not offline or healthy. Peer health is labeled as diagnostic runtime/network evidence and never becomes release health.

A remote artifact offer must pass structural capability checks and an explicit user-review gate before it can reach `staged-for-review`. When the caller supplies previously seen offer IDs or capability tokens, replays fail closed; supplied expiries must also be valid and in the future. Accepted peer metadata is reduced to inert identity/display fields and is returned with explicit `catalog=false`, `collection=false`, and `release=false` authority. URLs, receipts, availability, and status claims from the peer are not carried into that staged metadata.

## Publication boundary

The old builder depended on deleted `app-hub-v11/server/artifact-build.mjs` and the deleted `apps/app-hub-v13` tree. V13Hub is now registered via `registry/sources.d/app-hub-v13.json` with source `src/v13hub`.

`scripts/build-publication-site.mjs` discovers native manifests only and calls the existing `artifactctl` site assembler. The assembler stages eligible native releases, generates the receipt-aware catalog, copies the registered hub release to `hub/v13`, and emits the root redirect. V11 compatibility is no longer an implicit build dependency.

## Security boundary

- Catalog loading is same-origin, HTTP(S)-only, credential-free, and schema checked. Malformed/unsafe candidates are rejected before fetch; redirects are requested with `redirect: "error"`, any response marked `redirected` is rejected defensively, and the final `Response.url` is revalidated before JSON parsing. Failure can only proceed to another configured same-origin candidate; no synthetic catalog is invented.
- Catalog strings are rendered through DOM text APIs, never `innerHTML`.
- Unsafe URL protocols and credential-bearing URLs are blocked; protocol-relative/network-path references remain external and cannot be reinterpreted through the deployment-base resolver as local releases.
- Same-origin release targets may be linked; external destinations receive no anchor until the explicit review control is activated, then require browser confirmation.
- No iframe is created for previews.
- No peer transport is instantiated until explicit user opt-in; the optional diagnostic lobby has no application-level outbound payload API.
- Local collection writes require explicit permission.
- Missing catalogs produce an error state, not invented examples.

## Growth seams

A future TypeScript/React/Svelte shell can retain the contracts and replace the DOM view. A durable database can replace `collection.js` behind the same permission semantics. A real Peernet adapter can implement the narrow health/offer boundary without handing remote messages directly to UI state. Search can move to a worker or indexed engine without changing catalog authority.
