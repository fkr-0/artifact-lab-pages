# Remaining Modularization Slices Implementation Plan

**Goal:** Finish the next practical boundaries: per-instance stores, command dispatch, plugin migration scaffolding, JSON import/export, and app-shell code splitting.

**Architecture:** Keep heavy/editor/browser behavior outside `canvas-core`; add pure functions and React boundaries that preserve current SPA behavior. Store isolation is introduced through a Zustand vanilla store factory plus React provider, while legacy imports are migrated to provider-aware hooks.

**Tech Stack:** Vite, React, TypeScript, Zustand, Biome, existing custom Vite SSR test harness.

---

### Checklist

- [x] Task 1: Store factory/provider and targeted component migration
- [x] Task 2: Initial command dispatch helpers
- [ ] Task 3: Built-in plugin descriptors for image/text/link plus registry defaults
- [ ] Task 4: JSON document import/export helpers and SPA shell wiring
- [x] Task 5: Manual vendor chunking to reduce initial bundle pressure
- [ ] Task 5b: Lazy-load optional SPA chrome panels
- [ ] Task 6: Update docs and run full verification

### Verification Gate

Every task follows a small-test loop: add coverage where practical, run `pnpm test`, implement the minimal slice, then run `pnpm check && pnpm build` at batch boundaries.
