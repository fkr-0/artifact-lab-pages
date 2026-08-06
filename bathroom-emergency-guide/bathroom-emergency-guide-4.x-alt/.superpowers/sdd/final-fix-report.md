# Final Fix Report — Bathroom Emergency Guide v4-alt

Date: 2026-07-23

## Status: COMPLETE

All 6 findings from the whole-branch review have been addressed.

## Test Results

25 passed in 4.87s (all tests green).

## Fixes Applied

### Fix 1 — Hub diagrams missing from build pipeline (Critical)
- `bin/build_all.sh`: Replaced two individual calls (`generate_patterns`, `generate_mascots`) with a single `python3 -m src.diagrams.generate_all "$PROJECT_DIR/build/diagrams"`.
- `package.json` `build:diagrams`: Replaced two-step `&&` chain with `python3 -m src.diagrams.generate_all build/diagrams`.

### Fix 2 — WCAG AA contrast failure: white text on light accents (Critical)
**PNG diagrams (`src/diagrams/generate_hub.py`):**
- Added `_text_color_for_bg(bg_hex)` helper using WCAG 2.x relative luminance. Returns WHITE only if contrast ≥ 4.5:1, else INK.
- `generate_master_flowchart`: subguide routing boxes now call `_text_color_for_bg(sg.accent)` instead of hardcoded WHITE.

**CSS (`src/styles/tokens.css` + `base.css` + 4 theme files):**
- Added `--sg-text-on-accent: var(--ink)` default in `tokens.css` (safe dark text for all light accents).
- Changed `th { color: #ffffff }` to `color: var(--sg-text-on-accent)` in `base.css`.
- Added `--sg-text-on-accent: #ffffff` in the four themes whose accent passes ≥ 4.5:1 with white:
  - `theme-ambulance.css` (#C23D2E ≈ 4.87:1)
  - `theme-safety.css` (#2563EB ≈ 4.81:1)
  - `theme-zombie.css` (#4A6741 ≈ 5.72:1)
  - `theme-social.css` (#9333EA ≈ 4.97:1)

### Fix 3 — `--target pdf` silently does nothing (Important)
- `bin/build_guide.py`: Added early guard that prints a clear error to stderr and returns 1 when `--target pdf` is passed, before any assembly work begins.

### Fix 4 — `generate_pattern()` accepts unused `accent_hex` (Important)
- `src/diagrams/generate_patterns.py`: Removed `accent_hex` parameter from `generate_pattern()`. Updated the call in `generate_all_patterns()` to not pass it.

### Fix 5 — No `.gitignore` for build artifacts (Important)
- Created `.gitignore` at project root with `build/`, `__pycache__/`, `*.pyc`, `*.pyo`, `.pytest_cache/`.
- Ran `git rm -r --cached build/` to untrack previously-committed build artifacts.

### Fix 6 — Dual color systems undocumented (Important)
- `src/diagrams/palette.py`: Added comment `# Diagram palette — warm-toned for print/PNG output. HTML uses separate tokens in src/styles/tokens.css.`
- `src/styles/tokens.css`: Added comment `/* HTML palette — cool-toned for screen. Diagram generation uses src/diagrams/palette.py. */`
