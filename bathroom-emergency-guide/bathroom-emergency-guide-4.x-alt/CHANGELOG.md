# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.2] - 2026-07-23

### Added

- **Templates subguide** (The Grey Book)
  - 10 printable forms derived from "write that down" tasks across all subguides:
    observation log, pain record, call script, comfort inventory, local resource
    directory, factual timeline, housing evidence pack, body scan record, feedback
    form, and deployer notes.
  - `theme-templates.css` with grey accent palette.
  - Entry in `subguide_manifest.json` and build loop.

- **Support subguide — glossary & cross-reference index**
  - 21-term glossary of guide-specific vocabulary.
  - Expanded emergency numbers table (EU, UK, US, AU, NZ, JP, KR, IN, ZA, BR).
  - Cross-reference index by situation, by form, and by principle.
  - Reference-scheme explanation for readers.

- **Stable section-reference scheme**
  - `inject_section_refs()` in `build_guide.py` auto-tags h1/h2/h3 headings
    with human-readable `[book.chapter.section]` references (e.g. `[amb.1.7.2]`).
  - Per-subguide abbreviation map (calm, amb, resp, safe, zomb, supp, app, body,
    soc, dis, tmpl).
  - `.section-ref` CSS class for small monospace display in margins.

- **Notation system**
  - `::: {.principle}` fenced-div convention for italic principle subtitles.
  - `::: {.infobox}` fenced-div convention for accent-bordered info boxes.
  - Screen and print CSS for both classes with accent glow and break-inside-avoid.

- **Revision stamps**
  - `git_short_hash()` and `build_date()` functions in build pipeline.
  - Automatic `v{VERSION} · {hash} · {date}` stamp appended to every guide.
  - `.revision-stamp` CSS class (visible on screen, hidden in print with string-set).

- **Feedback page** (`src/hub/03-feedback.md`).

- **Print layout enhancements**
  - `@page @top-right` running header with subguide title via `string-set`.
  - `@page @bottom-left` revision string, `@bottom-right` site URL.
  - `@page :first` hides all running headers/footers.
  - h2 gets accent left border in both screen and print.

### Changed

- **Ambulance subguide** — heavily expanded:
  - Added 112/116117 `.infobox` with EU emergency infrastructure bullets.
  - CPR and AED written out on first occurrence.
  - "Why each step matters" `.infobox` for CPR section.
  - Bolded dispatcher guidance throughout.
  - Added 10 `.principle` subtitles (wounds, burns, fractures, choking, etc.).
  - Updated frontmatter with notation guide and `last_updated`.

- **Bold standout sentences** added across subguides:
  - Calm: "Your breath is the one autonomic function…", permission statement.
  - Calm (situations): "New, severe, unusual, or rapidly worsening…"
  - Responsibility: "It is simply harder for shame to sabotage five verbs…"
  - Safety: "Leaving without the complete plan is not failure. It is the plan."
  - Body: "Your body is producing symptoms. Your anxiety is producing interpretations."
  - Social: "The mirror is a reflective surface."
  - Disaster: "The good news — and there is some — is that the bathroom is not a
    terrible place to ride out many emergencies."

- **Support subguide** tagline updated to include glossary and cross-reference index.

- Bumped guide version from `4.0.0-alt.2` to `4.0.0-alt.3`.

## [0.1.1]

### Added

- **CHANGELOG.md**
- **`feat(subguides)`** [`8cfd389`]
  - Added complete draft chapters and supporting sources for Body Owner's
    Manual, Natural Disasters, and Social Field Guide.
  - Replaced placeholder content with actionable guidance and quick-reference
    cards.

- **`feat(build)`** [`f44f3c6`]
  - Added A4, A4/2, and large-print HTML/PDF build variants.
  - Added color and monochrome output modes through `--layout` and `--mono`.
  - Added generation of all layout and color-mode combinations.

- **`feat(styles)`** [`7662301`]
  - Added improved print styling for page headers, footnotes, and tables.
  - Added MathML and figure styling.
  - Added `--sg-text-on-accent` to all themes.

- **`feat(print)`** [`50699aa`]
  - Added A4/2, large-print, and monochrome print stylesheets.
  - Added Playwright-based PDF generation through `chrome_pdf.mjs`.
  - Added subguide-specific diagram generation.

### Changed

- **`feat(subguides)`** [`8cfd389`]
  - Added `revision` and `last_updated` front-matter fields.

- **`feat(build)`** [`f44f3c6`]
  - Updated build scripts and output filenames for layout and color variants.

- **`feat(styles)`** [`7662301`]
  - Refined diagram pattern generation.
  - Updated combined HTML/PDF build targets and project version metadata.

### Fixed

- **`fix`** [`080e987`]
  - Applied all whole-branch review findings.
  - Included hub diagrams in the build pipeline through `generate_all`.
  - Added WCAG AA-aware routing-box text colors.
  - Corrected PDF build failure handling.
  - Removed an unused pattern-generator argument.
  - Ignored and untracked generated build artifacts.
  - Documented the project's two color systems.

  
  
## [0.1.0] - 2026-07-23

### Added

* **`feat(subguides)`** [`8cfd389`]

  * Added complete draft chapters for:

    * Body Owner's Manual
    * Natural Disasters
    * Social Field Guide
  * Added supporting sources for each guide.
  * Added actionable guidance and quick-reference cards in place of placeholder content.

* **`feat(build)`** [`f44f3c6`]

  * Added `--layout` and `--mono` options to `build_guide.py`.
  * Added support for A4, A4/2, and large-print output.
  * Added color and monochrome variants for HTML and PDF builds.
  * Added `build_all_variants` to generate every supported layout and color-mode combination.

* **`feat(styles)`** [`7662301`]

  * Added page-header, footnote, and table styling for printed A4 output.
  * Added MathML and figure styling for HTML and PDF output.
  * Added the `--sg-text-on-accent` custom property to all themes.

* **`feat(print)`** [`50699aa`]

  * Added `print-a4half.css` for the A4/2 vertical field-strip edition.
  * Added `print-largeprint.css` for the accessible large-print edition.
  * Added `print-mono.css` for monochrome print output.
  * Added `chrome_pdf.mjs` for Playwright-based PDF generation.
  * Added `generate_subguide_diagrams.py` for subguide-specific diagrams.

### Changed

* **`feat(subguides)`** [`8cfd389`]

  * Revised front matter to include `revision` and `last_updated` fields.
  * Replaced remaining placeholder text with structured, actionable content.

* **`feat(build)`** [`f44f3c6`]

  * Updated `build_all.sh` to generate all layout and color variants for combined and individual subguide outputs.
  * Updated output filenames to identify their layout and color mode.

* **`feat(styles)`** [`7662301`]

  * Refined diagram-pattern generation to make patterns more visually distinct.
  * Updated build scripts for combined HTML and PDF targets.
  * Updated the project version.

### Fixed

* **`fix`** [`080e987`]

  * Updated `build_all.sh` and `package.json` to invoke `generate_all`, ensuring hub diagrams are included in the build pipeline.
  * Added `_text_color_for_bg()` to `generate_hub.py` and used it to select WCAG AA-compliant text colors for subguide routing boxes.
  * Added `--sg-text-on-accent` to `tokens.css` and `base.css`.
  * Set accent text to `#ffffff` only for the Ambulance, Safety, Zombie, and Social themes, where white meets the 4.5:1 contrast requirement.
  * Updated `build_guide.py` so `--target pdf` exits with status code `1` and a clear error when PDF generation fails.
  * Removed the unused `accent_hex` parameter from `generate_pattern()`.
  * Added `build/` to `.gitignore`.
  * Removed previously committed build artifacts from version control.
  * Documented the separate semantic and subguide color systems in `palette.py` and `tokens.css`.

## [0.0.2] - 2026-07-22

### Added

* **`feat`** [`e5a522d`]

  * Added `generate_all.py` as the single entry point for generating:

    * Pattern tiles
    * Mascot sprites
    * Hub flowcharts
    * Emergency banners
    * Axiom icons
  * Added two integration tests covering expected generated files and end-to-end Markdown builds.
  * Confirmed generation of all 23 expected assets.

* **`feat`** [`0cb264c`]

  * Added `generate_hub.py`.
  * Added the master flowchart v2.
  * Added the emergency banner.
  * Added axiom icons.
  * Added four hub-generator tests.

* **`feat`** [`4858eeb`]

  * Added a manifest-driven build pipeline.
  * Added shared CSS tokens and base styles.
  * Added ten subguide theme stylesheets.
  * Added a Pandoc HTML template.
  * Added `--subguide` and `--target` options to `build_guide.py`.
  * Added an emergency-gate invariant to the build process.
  * Added `build_all.sh`.
  * Added npm build scripts to `package.json`.
  * Added five build tests.

* **`feat`** [`d01a435`]

  * Added `src/data/subguide_manifest.json` as the build system's single source of truth for ten subguides:

    * Calm
    * Ambulance
    * Responsibility
    * Safety
    * Zombie
    * Support
    * Appendix
    * Body
    * Social
    * Disaster
  * Added parallel `src/subguides/{name}/chapters/` directories while retaining the original `src/chapters/` files for backward compatibility.
  * Added per-subguide `sources.md` and `version.md` files.
  * Added the hub-page triptych:

    * `src/hub/00-cover.md`
    * `src/hub/01-map.md`
    * `src/hub/02-directory.md`
  * Added four manifest tests covering loading, required fields, referenced files, and hub files.

* **`feat`** [`8bd05f7`]

  * Added a pixel-art mascot sprite generator for all ten subguides.

* **`feat`** [`6df2341`]

  * Added `generate_patterns.py`.
  * Added ten structurally distinct 128×128 pattern tiles:

    * Wave
    * Cross
    * Diamond
    * Shield
    * Crosshatch
    * Dots
    * Solid
    * Pulse
    * Zigzag
    * Speech
  * Added test-driven coverage for:

    * Generated file count
    * Image size
    * Image mode
    * Structural distinctness in grayscale

* **`feat`** [`0b78a18`]

  * Added the shared `src/diagrams/palette.py` module.
  * Added the ten-entry `SUBGUIDES` palette mapping.
  * Added the `SubguidePalette` data class.
  * Added the `hex_to_rgba` utility.
  * Added shared `PAPER`, `INK`, `MUTED`, and `WHITE` constants.
  * Added palette tests and shared test import-path configuration.

### Changed

* **`feat`** [`e5a522d`]

  * Updated `src/diagrams/__init__.py` to expose `generate_all`.

* **`feat`** [`4858eeb`]

  * Reorganized CSS into shared tokens, base styles, and individual subguide themes.

* **`feat`** [`d01a435`]

  * Copied existing chapters into the new subguide structure without removing the original chapter layout.

### Fixed

* **`fix(hub-diagram)`** [`2b6532b`]

  * Added the shared `DECISION` color to `palette.py`.
  * Replaced hard-coded danger-red values with the Ambulance subguide accent.
  * Replaced the local hard-coded decision-green value with the shared palette constant.
  * Restored the Body subguide label:

    * “Skin / teeth / digestion / ‘is this normal?’”
  * Corrected the bottom-row coordinates:

    * Disaster: `(6.0, 6.5)`
    * Appendix: `(6.0, 4.5)`

* **`fix`** [`9eecf5b`]

  * Removed the duplicate inline `onclick` handler from the theme-toggle button.
  * Retained the `addEventListener` implementation as the sole theme-toggle handler.
  * Restored correct light/dark theme switching.
  * Preserved theme selections through `localStorage` with error handling.

### Documentation

* **`docs`** [`84b2790`]

  * Added the Phase 1 foundation implementation plan.
  * Documented seven implementation tasks:

    1. Shared palette module
    2. Pattern generator
    3. Mascot sprite generator
    4. Manifest and directory restructuring
    5. Build pipeline
    6. Hub diagrams
    7. Diagram orchestrator
  * Added test-first implementation steps, exact file paths, and complete code examples.

## [0.0.1] - 2026-07-22

### Added

* **`init`** [`be4faa2`]

  * Added the initial v4-alt Bathroom Emergency Guide.
  * Added source chapters using the restored v4-alt voice.
  * Added the design specification for modular visual expansion.
  * Added the hub-and-subguide architecture.
  * Added the visual identity system.
  * Added the diagram plan.
  * Added three new subguides.

* **`merge`** [`d282f7a`]

  * Incorporated safety-relevant material from v4.x into the Calm Guide:

    * WHO-based 5-4-3-2-1 grounding
    * Longer-exhale breathing as the simplest breathing technique
    * Panic temporal-profile guidance
    * Distinction between the diving response and cold-shock risk
    * Practical Yerkes-Dodson guidance
    * “When calm is not enough” escalation criteria
    * Fillable nice-place map
  * Added a situational-syncope section to Self Ambulance.
  * Added sources 56 through 60.

> See the repository history for changes made before the documented releases.
