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

## Diff-first workspace

Version 1.1 adds progressive disclosure and persistent workspace customization:

- **Balanced** keeps sources, change occurrences, result, and journal visible.
- **Diff focus** collapses sources, result, and journal; the change list expands to the available viewport and defaults to vertically stacked Original/Changed lines.
- **Merge** hides sources and journal while preserving the decision list and result document.
- Sources, result, and journal can also be shown or hidden independently, producing a **Custom** layout.
- Drag the horizontal source divider to change editor height.
- Drag the workspace divider to allocate width between change occurrences and the result.
- Drag any Original/Changed divider inside a hunk to change the shared diff-column ratio.
- Every divider is keyboard operable with the arrow keys and resets on double-click.
- Long lines can remain horizontally scrollable or wrap within the diff column.
- Layout preferences are stored separately in local storage and survive reloads without entering the content journal.

### Layout shortcuts

| Shortcut | Action |
|---|---|
| `Alt+1` | Balanced layout |
| `Alt+2` or `F` | Diff focus layout |
| `Alt+3` | Merge layout |
| `V` | Side-by-side / stacked diff |
| `W` | Toggle long-line wrapping |

## Privacy and durability

- No server requests, external libraries, analytics, or service workers.
- Local files stay in the browser.
- Inputs are retained as separate source revisions and are never rewritten by merge decisions.
- Every content operation contains before/after snapshots and hashes in the exported JSON journal.
- Session autosave is limited to approximately 1.8 MB and is removed when the workspace is reset.
- Layout state is device-local and deliberately separate from replayable document history.

## Release

Artifact version: **1.1.0**
