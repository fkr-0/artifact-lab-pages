# Bathroom Emergency Guide

> “You are in a room with a door, water, and one next action.”

A sourced, rebuildable decision guide for panic, pain, responsibility, danger,
overload, bad smells, missing places, and infrastructure failure. Version 4
uses a red-flag-first flow, native MathML, and deterministic one-column A4
printing.

## Quick build

    ./bin/build_all.sh

Individual targets:

    ./bin/build_guide.sh html
    ./bin/build_guide.sh pdf
    ./bin/build_guide.sh mono
    ./bin/build_guide.sh chrome
    ./bin/build_guide.sh weasyprint
    ./bin/build_guide.sh docx
    ./bin/build_guide.sh latex
    python3 bin/validate_guide.py

Or with npm:

    npm run build
    npm test

## Requirements

| Tool | Purpose |
|---|---|
| Python 3.10+ | build orchestration and validation |
| Pandoc 3+ | Markdown to semantic HTML, LaTeX, and DOCX |
| matplotlib + Pillow | diagrams and pixel sprites |
| Node.js + Playwright | preferred tagged Chrome PDF |
| WeasyPrint | fallback PDF backend |
| Poppler tools | PDF validation and preview rendering |

The HTML route uses native MathML and system fonts. It has no CDN or runtime
network dependency.

## Source layout

    src/chapters/          canonical content, 00–10
    src/diagrams/          generated orientation and decorative figures
    src/template.html      semantic screen shell and small UI controls
    src/style.css          screen + single-column print system
    src/style-mono.css     monochrome overrides only
    bin/build_guide.py     deterministic document builder
    bin/validate_guide.py  safety and rendering invariants
    build/                 generated deliverables

## Output matrix

| Output | Path | Notes |
|---|---|---|
| Color HTML | build/html/guide.html | responsive TOC, theme and print controls |
| Mono HTML | build/html/guide_mono.html | same structure, grayscale design |
| Color PDF | build/pdf/guide.pdf | A4, one column |
| Mono PDF | build/pdf/guide_mono.pdf | A4, one column, ink-conscious |
| Markdown | build/md/guide.md | assembled, frontmatter-clean |
| DOCX | build/docx/guide.docx | editable |
| LaTeX | build/latex/guide.tex | intermediate |

## Print invariant

The guide is single column in print even though the screen UI has a navigation
rail and some two-up route cards. The Chrome exporter verifies computed
column-count before producing a PDF. The validator also checks:

- 11 source chapters at revision 4.0.0;
- native MathML and no remote MathJax;
- no known unsafe legacy wording;
- every referenced image exists;
- readable A4 PDF with a plausible page count.

## Evidence policy

Statements are labelled by function:

- **protocol** — guidance from an authoritative body;
- **descriptive equation** — exact once inputs are known;
- **conceptual model** — a thinking aid, not a prediction;
- **mnemonic** — memorable compression.

The source chapter records the evidence and the limits of what it supports.
Emergency numbers and links were checked on 17 July 2026.

## Safety scope

This guide supports decisions. It does not diagnose, replace first-aid
training, or overrule emergency dispatchers. In Germany, call **112** when life
may be in danger or lasting harm cannot be excluded.
