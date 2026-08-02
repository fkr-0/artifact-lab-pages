# File Diff Studio

File Diff Studio is a self-contained, local-first browser artifact for comparing two text files and producing a third merged document without overwriting either source.

## Core workflow

1. Paste anywhere outside an editor: the first paste fills **Original**, the second fills **Changed**.
2. Type or paste normally inside either source editor, or upload/drop a local text file.
3. Review each line-level change occurrence and choose **Original**, **Changed**, or **Both**.
4. Navigate changes with `[` / `]` or `Alt+ArrowUp` / `Alt+ArrowDown`.
5. Edit, copy, or download the generated result document.
6. Undo and redo source revisions, decisions, and result edits from the operation journal.
7. Export the full journal as JSON for exact replay or later import.

## Privacy and durability

- No server requests, external libraries, analytics, or service workers.
- Local files stay in the browser.
- Inputs are retained as separate source revisions and are never rewritten by merge decisions.
- Every operation contains before/after snapshots and hashes in the exported JSON journal.
- Session autosave is limited to approximately 1.8 MB and is removed when the workspace is reset.

## Release

Artifact version: **1.0.0**
