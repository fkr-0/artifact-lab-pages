# V13 release overrides

## 2026-09-16 owner-authorized release boundary

The repository owner explicitly authorized the remaining non-V13 blockers to stop gating the Artifact Lab V13 release.

### Peernet vendor-copy parity

`tests/peernet-vendor-sync.test.mjs` and `pnpm run sync:peernet:check` remain available as explicit diagnostics for the independently owned Peernet/V11 compatibility surface. They are not part of the canonical V13 root test or `release:check` gate. This waiver does not declare the vendor copies synchronized and does not authorize rewriting `v11-peer-daw` vendor bytes as part of V13 work.

### Bathroom Emergency Guide

`bathroom-emergency-guide` is archived from the live Artifact Lab portfolio because its ownership has moved to the writing workflow. The registry keeps a historical external provenance record only. Archived manifests are not built into the publication site and are omitted from the live generated catalog.

### Browser gate concurrency

The root and Sprite Fan Chromium matrices retain the same tests but run with one Playwright worker. A six-worker release run exhausted shared Chromium renderer resources and caused broad sub-second navigation failures; the same repaired Badger production round-trip passes alone. Bounding concurrency changes execution pressure only, not assertions or coverage.

This override is intentionally narrow: new V13 product, publication, accessibility, provenance, registry, or E2E failures remain release-blocking.
