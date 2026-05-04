# Comment Style

## Purpose

Comments should reduce uncertainty, not narrate the obvious.

## House rules

- Wrap around **88 characters**
- Explain intent, assumptions, and safety boundaries
- Use sentence case
- Prefer calm language over jargon performance
- Avoid macho or militarized metaphors

## Good header example

```txt
// Aster Relay / field note
// Purpose: normalize imported workshop records before export.
// Why: downstream scripts assume UTC timestamps and stable keys.
// Risk: malformed rows are skipped and reported, never silently rewritten.
```

## Accent policy

The brand may carry a slight graffiti / pixel / neon edge, but source code comments stay clean.
Let the edge show in file names, examples, or release covers — not in noisy comment styling.
