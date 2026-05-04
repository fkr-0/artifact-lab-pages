# Bathroom Emergency Guide

> *"You're in a bathroom. That's already a good start."*

A modular, revisionable, re-buildable decision-support document for
deployment in bathroom environments. Provides structured guidance for
situations ranging from acute anxiety and physical pain to —
hypothetically — zombie apocalypses.

## What's New in v3.2

- **Scientific rigor**: 21 mathematical formulas across 7 chapters (cortisol decay, GAD-7 scoring, survival probability, Dunbar numbers, communication channel scaling, water requirements, etc.)
- **LaTeX math notation**: Inline (`$...$`) and display (`$$...$$`) math in markdown, rendered via MathJax (HTML) and Pandoc native math (DOCX/LaTeX)
- **40+ Pandoc footnotes**: Scientific source citations and supplementary commentary for core claims
- **8 new scientific diagrams**: Stress Decay Curve, GAD-7 Anxiety Spectrum, Triage Priority Heatmap, Survival Probability Function, Group Complexity Scaling, Pain NRS with Physiological Correlates, Decision Flow Graph, Water Requirements Scaling (total: 14 diagrams)
- **Extended core sections**: GAD-7 severity spectrum (Ch.3), cortisol/HRV breathing efficacy (Ch.4), vital signs with severity columns (Ch.5), survival probability with Rule of 3s (Ch.6), Ostrom's governance principles (Ch.6), therapy effectiveness data (Ch.7)
- **Formula index**: 21 formulas catalogued in Appendix (Ch.8)
- **16 new source categories**: GAD-7, NRS, cortisol, HRV, physiological sigh, cognitive load, Dunbar, Ostrom, IASC, therapy effectiveness, olfactory science, caregiver burnout, stroke treatment, burn assessment, affect labeling, hydration/cognition

## Project Structure

```
bathroom-emergency-guide/
├── README.md              ← you are here
├── CHANGELOG.md           ← version history
├── SOURCES.md             ← raw source research data
├── src/
│   ├── chapters/          ← modular markdown source files (00–10)
│   │   ├── 00-cover.md
│   │   ├── 01-how-to-use.md
│   │   ├── 02-situation-a.md
│   │   ├── 03-situations-b-g.md
│   │   ├── 04-calm-guide.md
│   │   ├── 05-self-ambulance.md
│   │   ├── 06-zombie-guide.md
│   │   ├── 07-professional-support.md
│   │   ├── 08-appendix.md
│   │   ├── 09-version-history.md
│   │   └── 10-sources.md
│   ├── diagrams/          ← Python diagram generators
│   │   ├── generate_all.py       ← 6 diagrams + pixel art enhancements
│   │   ├── generate_scientific.py ← 8 scientific diagrams (formulas, spectra, curves)
│   │   └── generate_pixel_art.py ← 12 pixel art sprites
│   ├── cover.html         ← standalone HTML cover page (WeasyPrint)
│   ├── style.css          ← CSS v3.2 for HTML + WeasyPrint PDF
│   └── style-mono.css     ← CSS v3.2 monochrome variant
├── bin/
│   ├── build_diagrams.sh  ← generate sprites + diagrams → build/diagrams/
│   ├── build_guide.sh     ← assemble chapters → all output formats
│   └── build_all.sh       ← full pipeline: diagrams + guide
└── build/
    ├── diagrams/          ← generated PNG images (diagrams + sprites)
    ├── md/                ← assembled single markdown
    ├── html/              ← styled HTML output
    ├── pdf/               ← WeasyPrint PDF from HTML
    ├── latex/             ← Pandoc LaTeX output
    └── docx/              ← Pandoc DOCX output
```

## Prerequisites

| Tool | Purpose | Install |
|------|---------|----------|
| Python 3.10+ | Diagram & pixel art generation | System package |
| matplotlib | Diagram rendering | `pip install matplotlib` |
| Pillow (PIL) | Pixel art generation + diagram enhancement | `pip install Pillow` |
| Pandoc 3.x | Format conversion (MD→HTML/LaTeX/DOCX) with `+tex_math_dollars` | `brew install pandoc` or system package |
| WeasyPrint | HTML→PDF (primary PDF route) | `pip install weasyprint` |
| MathJax | LaTeX math rendering in HTML (CDN-loaded, no local install needed) | Automatic via `--mathjax` flag |

## Quick Start

```bash
# Full build: pixel art + diagrams + all document formats
./bin/build_all.sh

# Or step by step:
./bin/build_diagrams.sh          # generate sprites + diagrams
./bin/build_guide.sh             # assemble + convert to all formats

# Single format:
./bin/build_guide.sh html        # HTML only
./bin/build_guide.sh pdf         # PDF only (with cover page)
./bin/build_guide.sh latex       # LaTeX only
./bin/build_guide.sh docx        # DOCX only
./bin/build_guide.sh md          # assembled markdown only
```

## Output Formats

| Format | Method | File | Notes |
|--------|--------|------|-------|
| **HTML** | Pandoc + style.css | `build/html/guide.html` | Primary reading format; self-contained |
| **PDF** | WeasyPrint (cover.html + HTML→PDF) | `build/pdf/guide.pdf` | Best visual fidelity; cover page + styled content |
| **LaTeX** | Pandoc (MD→LaTeX) | `build/latex/guide.tex` | Intermediate; customizable for print |
| **DOCX** | Pandoc (MD→DOCX) | `build/docx/guide.docx` | Editable; fallback for Word users |
| **MD** | Concatenation | `build/md/guide.md` | Single-file assembled source |

## Visual Design System

| Element | Details |
|---------|---------|
| Primary color | Math Blue `#2563EB` |
| Accents | Cyan `#06B6D4`, Magenta `#EC4899`, Teal `#14B8A6`, Amber `#F59E0B` |
| Heading font | Space Grotesk |
| Body font | Inter |
| Mono font | JetBrains Mono |
| Math rendering | MathJax (HTML), native OMML (DOCX), LaTeX (LaTeX/PDF) via `+tex_math_dollars` |
| Math styles | `.math.inline`, `.math.display`, `.formula-box` for styled formula blocks |
| Footnotes | Pandoc footnotes (`[^n]`) with `.footnotes` and `a.footnote-ref` styling |
| Pixel art | 12 sprites at 32×32px, used in diagrams and CSS decorations |
| Diagrams | 14 total (6 original + 8 scientific), pixel art aesthetic |
| Dark mode | Auto (`prefers-color-scheme`) + manual (`.dark-mode` class) |
| Cover page | Dark gradient background with cyan glow, pixel-art border |

## Editing

Each chapter is a self-contained markdown file with YAML frontmatter:

```yaml
---
title: "Calm Guide"
chapter: 4
revision: "2.0.0"
last_updated: "2026-04-29"
dependencies:
  - build/diagrams/breathing_techniques.png
---
```

Edit chapters independently. Rebuild to propagate changes.
Diagram scripts accept output path as argument; rebuild diagrams after script changes.

## Versioning

- Per-chapter: `revision` field in YAML frontmatter
- Project-level: `CHANGELOG.md` + git log
- Build metadata: embedded in cover page frontmatter

## License

Personal use. Share the calm.
