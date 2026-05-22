# Sprite Fan source editing

The files in this directory are the editable source for the integrated Sprite Atlas Studio.

## Files

```text
src/
  atlas-studio.html  # HTML shell with CSS and JS insertion markers
  studio.css         # CSS payload for the standalone artifact
  studio.js          # JS payload for the standalone artifact
```

## Build

```sh
pnpm run build:sprite-fan
```

The builder writes `sprite-fan/atlas-studio.html`, which remains the standalone browser artifact.

## Check drift

```sh
pnpm run health:sprite-fan
```

The health check fails if the split source no longer rebuilds the checked-in standalone artifact byte-for-byte.

## Editing rule

Prefer editing `src/*` first, then rebuild. Only edit `atlas-studio.html` directly for emergency generated-output patches, and immediately copy those changes back into `src/*`.
