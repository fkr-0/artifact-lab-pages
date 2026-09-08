# Provenance and extraction boundary

PeernetJS is an extracted canonical runtime inside the larger `/home/user/work/code/artifacts` repository. It is not yet an independently published package.

## Evidence retained

- The tracked `peernet-lib.js` history reaches the repository's initial core-artifact commit `87174ae5` (2026-05-05) and later `01493889` (`upgrades`, 2026-07-13).
- The surrounding artifact repository treats `peernetjs/` as the canonical source for synchronized copies in `lib/peernet/`, `v11-peer-daw/vendor/`, and `PeerModGroove/vendor/` via `scripts/sync-peernet-vendors.mjs`.
- `peernet-orca/` consumes the canonical shared core directly rather than maintaining a fork.
- The reconnect/health changes currently present in `peernet-lib.js` and `peernet-shared-core.js` pre-date this package extraction pass and are deliberately preserved.

## Publication constraint

The extracted directory has no standalone license file or release history proving that a package namespace is owned and publishable. `package.json` therefore remains `private: true`, the package name is provisional, and this work does not claim publication rights. Resolve package naming, license provenance, and registry ownership before the first public release.
