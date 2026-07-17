---
title: "Version History"
chapter: 9
revision: "4.0.0"
last_updated: "2026-07-17"
dependencies: []
---

# Version History

## 4.0.0 — 17 July 2026

### Technical realization

- Replaced CDN MathJax and timed browser waiting with native MathML.
- Removed brittle cover-document CSS merging; chapters and cover now share one
  semantic document.
- Added a Pandoc template with table of contents, mobile navigation, theme
  toggle, reading progress, and print action.
- Rebuilt print CSS around an enforced A4 single-column invariant.
- Added an independent monochrome layer without copying the full stylesheet.
- Added Chrome and WeasyPrint PDF backends consuming identical HTML.
- Added structural, safety-wording, MathML, image, A4, and page-count validation.
- Fixed chapter assembly so repeated YAML frontmatter does not leak into output.

### Orientation and UI

- Replaced route-first diagrams with a portrait, red-flag-first flowgraph.
- Added four explicit destinations and a reassessment loop.
- Reduced decorative cards and gradients in favour of a bathroom-tile,
  high-contrast utilitarian system.
- Improved mobile contents navigation and print table/figure behaviour.

### Content and evidence

- Corrected newborn/medical routing from 110 to 112.
- Removed concentration-free bleach dosing, unsafe foraging advice, match-based
  smell advice, pain “physiological correlates,” and fictional cortisol decay.
- Reframed GAD-7 and pain scales as communication/screening tools, not triage.
- Rewrote CPR, bleeding, burn, stroke, poisoning, anaphylaxis, crisis, violence,
  water, outage, pregnancy, and caregiver sections against authoritative
  sources.
- Marked every formula as protocol, descriptive equation, conceptual model, or
  mnemonic.
- Expanded current German help numbers and source annotations.

## Earlier versions

| Version | Date | Summary |
|---|---|---|
| 3.4 | 2026-06-10 | experimental multi-backend and two-column work |
| 3.2 | 2026-05-03 | formula and scientific-diagram expansion |
| 3.0 | 2026-05-01 | modular content and source chapter |
| 2.0 | 2026-04-29 | pixel assets and themed HTML/PDF |
| 1.0 | 2026-04-29 | initial guide |

Version 4 deliberately removes several “scientific-looking” claims introduced
in 3.2. More formulas are not automatically more science; better boundaries
are.
