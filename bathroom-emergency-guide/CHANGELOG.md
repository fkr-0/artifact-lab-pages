# Changelog

All notable changes to the Bathroom Emergency Guide are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [3.2.0] - 2026-05-03

### Added
- **Scientific/geeky rigor**: 21 mathematical formulas across 7 chapters using LaTeX notation (`$...$` inline, `$$...$$` display)
- **Pandoc footnotes**: 40+ footnotes with scientific source citations and supplementary commentary for core claims
- **8 new scientific diagrams**: `stress_decay_curve.png`, `anxiety_severity_spectrum.png`, `triage_priority_heatmap.png`, `survival_probability_function.png`, `group_complexity_scaling.png`, `pain_nrs_correlates.png`, `decision_flow_graph.png`, `water_requirements_scaling.png`
- **New diagram generator**: `src/diagrams/generate_scientific.py` producing all 8 scientific diagrams with pixel art aesthetic
- **Math rendering in build pipeline**: Pandoc `--mathjax` flag for HTML, native OMML math for DOCX, `+tex_math_dollars` format extension for all output formats
- **CSS v3.2**: Mathematical notation styles (`.math.inline`, `.math.display`, `.formula-box`), footnote styles (`.footnotes`, `a.footnote-ref`), Pandoc math output styling, MathJax override consistency
- **Monochrome CSS v3.2**: Grayscale equivalents for all math, formula, and footnote styles
- **Extended core sections**:
  - Ch.1: Graph-theoretic model $G=(V,E)$ with reachability invariant, math notation legend
  - Ch.2: Gestation milestones table, WHO child development milestones, §32 StGB 4-element formalization, caregiver burnout data
  - Ch.3: GAD-7 severity spectrum (0-21 clinical thresholds), NRS pain scale with physiological correlates, stress response curve, cognitive load theory (Miller 7±2, Cowan 4±1), SO₂ neutralization chemistry
  - Ch.4: Cortisol decay $C(t)=C_0 \cdot e^{-\lambda t}$, 10-min rule formalization, HRV formula, physiological sigh CO₂ offload mechanism, comfort inventory with neurochemical mechanisms
  - Ch.5: Vital signs with 3-column severity, FAST stroke formalization ($t<4.5$h window), Lund-Browder burn chart reference, Bayes' triage formula
  - Ch.6: Survival probability $P(t)=e^{-\lambda t}$, water formula $W=n \cdot 3\text{L/day}$, calorie requirements, communication channels $C(n)$, Dunbar numbers $D_n$, Ostrom's 8 principles, group complexity scaling
  - Ch.7: Therapy effectiveness data (CBT ~60%, EMDR ~70%), IASC 4-layer intervention pyramid, §32 StGB 4-element formalization
  - Ch.8: Diagram index (14 diagrams), formula index (21 formulas), updated cross-reference table
- **16 new source categories** in Ch.10: GAD-7, NRS, cortisol research, HRV, physiological sigh, cognitive load, Dunbar numbers, Ostrom's principles, IASC guidelines, therapy effectiveness, olfactory science, caregiver burnout, stroke treatment, burn assessment, affect labeling, hydration/cognition

### Changed
- Version bumped from 2.5.0 to 3.2.0 across all project metadata
- Build pipeline updated: Pandoc format string extended with `+tex_math_dollars` for LaTeX math support
- HTML build now uses `--mathjax` flag for client-side math rendering
- CSS updated from v2.5 to v3.2 with math, footnote, and formula styling
- All 11 chapter files updated with new revision (3.2.0), footnotes, formulas, and extended content
- Diagram generator now produces 14 diagrams (6 original + 8 scientific)
- README updated for v3.2 features and project structure

## [3.0.0] - 2026-05-02

### Note
- v3.0.0 was developed as a standalone python-docx script, bypassing the modular markdown build pipeline. This version was never properly released through the repo structure.
- All v3.0.0 improvements have been incorporated into v3.2.0 within the proper modular project structure.

## [2.5.0] - 2026-04-29

### Fixed
- **Cover page CSS scoping**: Cover page CSS no longer uses global selectors that override guide styles. All cover selectors are now scoped to `.cover-page` when merged into the combined HTML. `@page { margin: 0 }` changed to `@page :first { margin: 0 }` so only the cover page gets zero margins. Global `*, *::before, *::after { margin:0; padding:0 }` reset removed from merged CSS. `body::before`/`body::after` scanline and pixel border now scoped to `.cover-page::before`/`.cover-page::after`.
- **PDF build pipeline**: Rewrote build pipeline as `bin/build_guide.py` Python script with proper cover merge logic. Shell script `bin/build_guide.sh` now delegates to Python script.
- **Image paths**: Cover page image paths now correctly resolve as `../diagrams/bathroom_icon.png` in the combined HTML (relative to `build/html/`).

### Added
- **Monochrome CSS variant** (`src/style-mono.css`): Full grayscale stylesheet for print-friendly monochrome output. All accent colors replaced with black/white/gray equivalents. Gradient effects replaced with solid colors. Produces `guide_mono_with_cover.html` and `guide_mono.pdf`.
- **Python build script** (`bin/build_guide.py`): Complete build orchestration in Python — assembles markdown, builds HTML, merges cover with scoped CSS, generates PDF/LaTeX/DOCX, and builds monochrome variants.

### Changed
- Version bumped from 2.0.0 to 2.5.0 across all project metadata
- CSS header comment updated to v2.5
- `@page :first { margin: 0 }` added to guide CSS for proper cover page zero-margin rendering

## [2.0.0] - 2026-04-29

### Added
- **Pixel art system**: 12 pixel art sprites generated via Pillow (bathroom_icon, water_drop, brain, heart, zombie_hand, flame, shield, book, breath, first_aid, compass, pixel_border)
- **Enhanced diagram aesthetics**: Scanline overlay, pixel-art border frames with corner diamonds, sprite corner decorations, warmer graph-paper background tones
- **Sleeker CSS (v2.0)**: Gradient headings (blue→cyan), card-style sections with hover effects, dark mode (auto `prefers-color-scheme` + manual `.dark-mode` toggle), expanded color palette (cyan, magenta, teal, amber accents), pixel-art CSS classes (`.pixel-border`, `.retro-badge`, `.pixel-divider`, `.pixel-corner`, `.scanline-overlay`), gradient underline links, dark code blocks with cyan borders, gradient blockquote borders, pixel-art figure corner decorations, semantic section classes (`.calm-section`, `.water-section`, `.urgent-section`, `.warning`)
- **Dedicated cover page**: `src/cover.html` with dark gradient background, cyan glow title, pixel-art decorative border, ambient glow blobs, scanline overlay, classification badge, decorative pixel bar — renders as WeasyPrint PDF page 1
- **Sources & Further Reading chapter** (Ch.10, `10-sources.md`): 85+ verified sources with URLs and credibility tiers across 10 categories: first aid, survival, electricity safety, nutrition, water purification, child development, mental health, Seneca/Tao/I Ching, social psychology & group dynamics (Le Bon, Asch, Milgram, Zimbardo, Tajfel, Goffman, Canetti), governance models (Sociocracy, Holacracy), and German legal standards (StGB, BGB, IASC, ICRC)
- **Build pipeline v2**: `build_diagrams.sh` now generates pixel art sprites before diagrams; `build_guide.sh` merges cover page with guide HTML before WeasyPrint conversion; supports 11 chapters (00–10)

### Changed
- CSS updated from v1.0 to v2.0 with gradient text, dark mode, and pixel art classes
- Cover page now uses dedicated `cover.html` instead of markdown-only approach
- Diagram generation now includes PIL-based post-processing pipeline (scanlines → corner sprites → pixel border)
- Graph paper background warmed from `#F1F5F9` to `#FBF7F0` with matching grid lines
- Version bumped from 1.0.0 to 2.0.0 across all project metadata

## [1.0.0] - 2026-04-29

### Added
- Initial release of the Bathroom Emergency Guide
- 7 entry-point situations (A–G) with decision flowcharts
- 4 shared destination guides: Calm Guide, Self Ambulance, Zombie Guide, Professional Support Directory
- 6 embedded diagrams: master flowchart, breathing techniques, Situation A tree, survival pyramid, scaling chart, triage flow
- Professional Support Directory with Germany-focused emergency numbers, psychological, legal, medical, and social support
- Fillable fields for personalization (WiFi, doctor, contacts)
- Master cross-reference table and symbol legend
- Build pipeline: markdown → HTML → PDF (WeasyPrint), LaTeX, DOCX (Pandoc/python-docx)
- Modular chapter structure (00–09) with YAML frontmatter
- CSS stylesheet with math-blue + graph-paper visual identity
- Diagram generation scripts (matplotlib)

### Changed
- Restructured from monolithic .docx to modular markdown project
- Improved visual design: graph-paper backgrounds, color-coded flowcharts, consistent typography

### Sources
- Breathing techniques: Huberman Lab (Stanford), Navy SEAL box breathing protocol
- First aid: ERC Guidelines 2021, German Red Cross (DRK) first aid reference
- Self-defense law: §32 StGB (Notwehr), Weisser Ring victim support
- Social support: Bundesamt für Familie, Pro Familia, Kinderschutzbund
- Survival skills: SAS Survival Handbook (Loft), WHO emergency water purification guidelines
- Governance models: Sociocracy (Consent), Holacracy reference implementations
