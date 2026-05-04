---
title: "Version History"
chapter: 9
revision: "3.2.0"
last_updated: "2026-05-03"
type: appendix
dependencies: []
---

# Version History

This appendix tracks all revisions of the Bathroom Emergency Guide. Per-chapter revision numbers are maintained in each file's YAML frontmatter; project-level history is recorded here and in `CHANGELOG.md`.

## Revision Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 3.2.0 | 2026-05-03 | Bathroom Guide Project | **Scientific rigor update.** LaTeX math notation throughout ($...$ / $$...$$). Pandoc footnotes with source citations added to all chapters. New scientific content: GAD-7 scoring (Ch.3), NRS pain scale with physiological correlates (Ch.3/5), cortisol decay function (Ch.4), HRV formula (Ch.4), physiological sigh CO₂ offload mechanism (Ch.4), Huberman Lab RCT citation (Ch.4), dopamine/oxytocin comfort mechanisms (Ch.4), cognitive load theory — Miller's 7±2 and Cowan's 4±1 (Ch.3), SO₂ odor neutralization chemistry (Ch.3), stress response activation curve (Ch.3), vital signs with formal ranges (Ch.5), FAST stroke formalization with treatment window (Ch.5), burn surface area — Lund-Browder chart (Ch.5), Bayes' triage probability (Ch.5), survival probability function (Ch.6), water requirement formula (Ch.6), group communication channel formula (Ch.6), Dunbar numbers (Ch.6), Ostrom's 8 principles (Ch.6), calorie requirements (Ch.6), evidence-based therapy effectiveness data (Ch.7), IASC intervention pyramid (Ch.7), §32 StGB four-element formalization (Ch.7), gestation milestone table with viability data (Ch.2), WHO child development milestones (Ch.2), caregiver burnout data (Ch.2). 8 new diagram references: decision_flow_graph, stress_decay_curve, anxiety_severity_spectrum, pain_nrs_correlates, triage_priority_heatmap, survival_probability_function, group_complexity_scaling, water_requirements_scaling. Formula index and diagram index added to Appendix (Ch.8). |
| 3.0.0 | 2026-05-01 | Bathroom Guide Project | Major content expansion: enriched all chapter bodies to 150+ words per section, added fillable fields, expanded professional support directory, added Sources & Further Reading chapter (Ch.10), refined decision trees. |
| 2.0.0 | 2026-04-29 | Bathroom Guide Project | Major visual and content update: pixel art sprites (12), enhanced diagrams with scanline/border/corner effects, sleeker CSS with gradient headings, dark mode, card-style sections, cyan/magenta/teal/amber accent palette, dedicated HTML cover page for WeasyPrint, new Sources & Further Reading chapter (Ch.10), build pipeline v2. |
| 1.0.0 | 2026-04-29 | Bathroom Guide Project | Initial release. 10 chapters (00–09), 6 diagrams, 4 output formats, build pipeline. |

## Chapter Revisions

| Chapter | File | Current revision | Last updated | Key v3.2 additions |
|---------|------|-----------------|-------------|-------------------|
| 0 | 00-cover.md | 3.2.0 | 2026-05-03 | Version bump, scientific rigor in description, updated doc control table |
| 1 | 01-how-to-use.md | 3.2.0 | 2026-05-03 | Math notation legend, graph-theoretic model $G=(V,E)$, decision_flow_graph diagram, footnotes |
| 2 | 02-situation-a.md | 3.2.0 | 2026-05-03 | Gestation milestone table, WHO child development milestones, §32 StGB elements, cortisol/decision footnote, caregiver data |
| 3 | 03-situations-b-g.md | 3.2.0 | 2026-05-03 | GAD-7 severity spectrum, NRS pain scale with physiological correlates, stress response curve $S(t)$, cognitive load theory (Miller, Cowan), SO₂ neutralization chemistry, anxiety_severity_spectrum + pain_nrs_correlates diagrams |
| 4 | 04-calm-guide.md | 3.2.0 | 2026-05-03 | Stress decay curve $C(t)=C_0 e^{-\lambda t}$, 10-min rule formalization, HRV formula, physiological sigh CO₂ mechanism, Huberman Lab RCT, comfort inventory neurochemical mechanisms (dopamine, oxytocin, olfactory, hydration, warmth, touch), stress_decay_curve diagram |
| 5 | 05-self-ambulance.md | 3.2.0 | 2026-05-03 | Vital signs formal ranges ($HR$, $RR$, $SpO_2$, $BP$), FAST stroke formalization with $t<4.5$h window, Lund-Browder burn surface area, Bayes' triage probability, NRS pain correlation, triage_priority_heatmap + pain_nrs_correlates diagrams |
| 6 | 06-zombie-guide.md | 3.2.0 | 2026-05-03 | Survival probability $P(t)=e^{-\lambda t}$, water formula $W=n·3L/day$, communication channels $C(n)=n(n-1)/2$, Dunbar numbers $D_n=5·3^{n-1}$, Ostrom's 8 principles, calorie requirements ($E_{basal}$, $E_{survival}$), survival_probability_function + group_complexity_scaling + water_requirements_scaling diagrams |
| 7 | 07-professional-support.md | 3.2.0 | 2026-05-03 | Therapy effectiveness data (CBT ~60%, EMDR ~70%), IASC intervention pyramid, §32 StGB four-element table, evidence-based footnotes |
| 8 | 08-appendix.md | 3.2.0 | 2026-05-03 | Diagram index (14 diagrams), formula index (21 formulas), updated cross-reference table with diagram refs, extended color coding (cyan = scientific), updated master tree with formulas |
| 9 | 09-version-history.md | 3.2.0 | 2026-05-03 | Added v3.0.0 and v3.2.0 entries, updated chapter revision table with v3.2 additions column |
| 10 | 10-sources.md | 3.2.0 | 2026-05-03 | Added sections: Anxiety Assessment (GAD-7), Pain Assessment (NRS), Stress & Cortisol Research, Heart Rate Variability (HRV), Physiological Sigh / Breathing Research, Cognitive Load Theory, Dunbar Social Brain, Ostrom Commons Governance, IASC Guidelines, Therapy Effectiveness, Olfactory Science, Caregiver Burnout, Stroke Treatment, Burn Assessment |

## Build Metadata

| Field | Value |
|-------|-------|
| Build system | Bash + Pandoc + WeasyPrint + matplotlib + Pillow |
| Source format | Markdown with YAML frontmatter + LaTeX math + Pandoc footnotes |
| Primary PDF route | Cover HTML + Guide HTML → WeasyPrint PDF |
| Fallback PDF route | Pandoc → LaTeX → PDF |
| Diagram format | PNG (200 DPI) with pixel art enhancements |
| Pixel art format | PNG (32×32 sprites, RGBA) |
| CSS version | 2.0.0 (gradient headings, dark mode, pixel art classes) |
| Math rendering | Pandoc → HTML (MathJax/KaTeX), LaTeX (native), DOCX (OMML) |

## Update Protocol

1. Edit the relevant chapter file in `src/chapters/`.
2. Increment the `revision` field in that file's YAML frontmatter.
3. Add an entry to the Chapter Revisions table above.
4. Add a changelog entry to `CHANGELOG.md`.
5. Rebuild: `./bin/build_all.sh`
6. Verify outputs in `build/`.
