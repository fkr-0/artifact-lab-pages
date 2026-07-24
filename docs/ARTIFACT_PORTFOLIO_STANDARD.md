# Artifact Portfolio Standard

This repository treats every embedded artifact as a small product, not as an unreviewed demo page.

## Ownership boundary

The root portfolio owns:

- the v11 catalog and launcher;
- standalone HTML applications and directories without their own Git root;
- portfolio-wide quality contracts, release metadata, packaging, and deployment integration.

Independent nested repositories retain their own architecture and release process. The root portfolio validates only their declared launch targets and deployment integration.

## Required contract

Every catalog item must have:

- a unique, stable `id`;
- a real title, description, tags, and supported launch modes;
- a launch target that exists, or an explicit independent-project build contract;
- no placeholder production URL;
- launch action IDs and modes that are internally consistent.

Portfolio preview servers must additionally:

- serve the built artifact URL, not the source entrypoint;
- block path traversal outside the workspace root;
- set browser-safe MIME types and no-store cache headers for preview content;
- emit actionable startup diagnostics when the port is unavailable.

Every embedded HTML artifact must have:

- HTML5 doctype, language, viewport, and title metadata;
- unique static DOM IDs;
- a semantic main region;
- keyboard-operable controls and visible focus;
- automatic reduced-motion behavior when it animates;
- safe text rendering and validated import/persistence boundaries;
- explicit error, empty, loading, and success states;
- deterministic cleanup for object URLs, media, animation loops, network sessions, and audio contexts.

## Architecture direction

The portfolio follows a local-first, capability-oriented model:

```text
catalog metadata
      │
      ▼
launcher/runtime ──► isolated artifact capability
      │                    │
      │                    ├─ state adapter
      │                    ├─ import/export codec
      │                    ├─ lifecycle controller
      │                    └─ accessibility contract
      ▼
observable health + release evidence
```

Artifacts may remain deliberately strange, playful, or domain-specific. Their visual identity is not an excuse for hidden state, inaccessible interaction, unsafe parsing, irreversible actions, or lifecycle leaks.

## Validation

Run:

```sh
pnpm run audit:artifacts
pnpm run test:portfolio
```

The audit fails on blocking catalog, launch-target, or static-document defects. Warnings identify modernization debt such as missing reduced-motion behavior, missing landmarks, inline event handlers that prevent a strict Content Security Policy, or preview-server issues that still need cleanup.

The release gate runs the portfolio audit before the broader test suite.

## Evolution rule

New shared abstractions should be extracted only after at least two artifacts demonstrate the same stable capability boundary. Shared code must reduce lifecycle or security risk without erasing each artifact's interaction model and aesthetic character.
