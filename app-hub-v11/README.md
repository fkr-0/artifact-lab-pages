# NEXUS App Hub v11

v11 is a data-driven successor to the v10 portal. It keeps the v10 idea of a lightweight launcher/runtime and extracts reusable behavior into small libs.

## Compile the artifact list

    node app-hub-v11/server/artifact-catalog.mjs app-hub-v11/artifacts.source.json app-hub-v11/data

## Open

Serve the repository root, then open:

    /app-hub-v11/index.html

## Key files

| Path | Purpose |
| --- | --- |
| `artifacts.source.json` | Server-side editable source catalog. |
| `data/artifact-collection.json` | Clean compiled list consumed by the browser hub. |
| `server/artifact-catalog.mjs` | Compiler and extensible operation registry. |
| `lib/*.js` | Small browser/server-testable runtime libraries. |
| `docs/ROADMAP.md` | Specs and TODOs for deeper modularization. |
