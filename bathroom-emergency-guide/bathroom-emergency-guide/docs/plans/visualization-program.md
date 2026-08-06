# Visualization Program — From Illustrated Guide to Visual Evidence System

Status: implementation plan
Initial target: 4.4 data foundations, 4.5 subguide integration, continuous expansion
Prepared: 22 July 2026

## 1. Goal

The guide currently contains useful route diagrams and a small set of evidence
figures. Future editions should use visual explanation much more systematically:
not decoration, but diagrams and charts that make structure, mechanism,
comparison, uncertainty, and handoff faster to understand.

The target is a **visual evidence system** in which every figure has:

- one question;
- one intended comparison or inference;
- one source or declared conceptual-model status;
- one accessible text equivalent;
- one monochrome-safe encoding;
- one reproducible specification;
- one explicit practical limit.

The program should increase the current figure count from 13 generated route and
evidence figures to approximately **48–60 reviewed visuals** across the master
guide, without forcing a chart into every topic.

## 2. Editorial standard

A visualization must earn its page area by doing at least one of these jobs
better than prose:

1. reveal a route or branching structure;
2. compare magnitudes, distributions, or changes;
3. show a process, mechanism, or dependency;
4. place an estimate beside its uncertainty and denominator;
5. show spatial or temporal context;
6. make a handoff, checklist, or sequence easier to execute;
7. expose where evidence is strong, weak, absent, or non-comparable.

Do not visualize a scalar merely because it exists. A single percentage usually
belongs in prose or a compact evidence card unless a meaningful comparison,
distribution, timeline, or denominator can be shown.

## 3. Visual grammar

The implementation-level renderer and page-composition rules live in
`docs/plans/visual-design-system.md`. The central rationale is deliberately
bounded: Vega-Lite is preferred for ordinary quantitative comparison because a
declarative specification can be reviewed and validated as data, transforms,
scales, marks, and encodings. It is not a universal illustration engine.

### 3.1 Figure families

| Family | Use | Typical forms |
|---|---|---|
| Orientation | show location in the guide graph | node-link graph, neighbourhood map, breadcrumb |
| Routing | support action selection | decision tree, route matrix, state transition |
| Mechanism | explain how something works | annotated schematic, causal chain, system map |
| Quantitative evidence | compare measured values | dot plot, interval plot, line, bars, small multiples |
| Uncertainty | show precision or model range | confidence intervals, bands, scenario ranges |
| Temporal | show sequence or duration | timeline, event strip, burn-down/runtime chart |
| Spatial | show place or service geography | locator map, regional small multiples, distance bands |
| Dependency | show what relies on what | directed network, layered system map, fault tree |
| Handoff | transfer information reliably | annotated form, message anatomy, role matrix |
| Observation | support a safe mini-experiment | before/after strip, measurement protocol, comparison grid |
| Reference | organize concepts and evidence | taxonomy, notation map, source provenance graph |

### 3.2 Chart selection rules

- Use **ranked horizontal bars or dot plots** for categorical comparison.
- Use **lines** for continuous time and **columns** for discrete periods.
- Use **small multiples** when several series would otherwise overlap; use the
  same scale across panels.
- Use **interval/dot plots** rather than detached error-bar decoration when
  uncertainty is central.
- Use **heatmaps** only when a two-dimensional pattern is the question and exact
  values remain available in labels or a table.
- Use **maps** only when geography changes interpretation or routing.
- Use **networks** only when relationships are the subject; never use them as a
  decorative overview.
- Avoid dual axes, 3D charts, perspective, exploded pies, ornamental gradients,
  and area encodings when precise comparison matters.
- Bar-chart quantitative axes start at zero. Non-zero starts require a chart
  form that does not encode magnitude by bar length and a visible explanation.

## 4. Data-journalism communication rules

Every communicative chart should contain:

1. a takeaway title or a neutral question title;
2. a subtitle naming measure, population/model, place, and period;
3. direct labels where practical;
4. restrained gridlines and no decorative frame;
5. concise annotations placed beside the relevant data;
6. source, review date, denominator, and evidence class;
7. visible uncertainty when it changes interpretation;
8. a one-sentence limit;
9. alternative text plus a longer description for complex figures;
10. a machine-readable or HTML-table fallback for essential data.

Categories should be ordered by value or by a genuine natural order, not
alphabetically by default. Comparable small multiples use consistent scales.
Annotations should state context, not repeat the label already visible.

## 5. Accessibility and pattern rules

- Colour is never the only differentiator.
- Series use direct labels plus at least one of shape, line style, pattern, or
  position.
- Required graphical objects target at least 3:1 contrast against adjacent
  colours or receive a contrasting boundary.
- Pattern fills use coarse, print-safe geometry and are tested in monochrome.
- Text remains text in SVG/HTML when possible; PNG is a robust PDF fallback, not
  the canonical semantic representation.
- Essential charts receive a short alt description, a structured long
  description, and a data table or equivalent list.
- Interactive HTML charts must remain understandable without hover and usable
  by keyboard, touch, zoom, and high-contrast presentation.
- Animation is optional and never the only way to perceive a change.

Primary guidance anchors:

- W3C WCAG 2.2, Use of Color:
  https://www.w3.org/WAI/WCAG22/Understanding/use-of-color
- W3C WCAG 2.2, Non-text Contrast:
  https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast
- W3C G111, Using color and pattern:
  https://www.w3.org/WAI/WCAG22/Techniques/general/G111.html
- W3C Complex Images tutorial:
  https://www.w3.org/WAI/tutorials/images/complex/
- ONS data-visualisation guidance:
  https://service-manual.ons.gov.uk/data-visualisation/guidance

## 6. Per-subguide visualization target

A mature core subguide should normally contain **4–8 substantial visuals**:

- one orientation or local graph;
- one mechanism or explanatory schematic;
- one quantitative/evidence visual when defensible data exist;
- one route, handoff, or comparison visual;
- optional additional small multiples, timelines, maps, or observation figures.

A satellite module should normally contain 2–5 visuals. Figure count is a
planning range, not a quota that overrides judgment.

## 7. Candidate visual inventory

### O — Small-Room Observatory

1. Interoception loop: body signal → attention → interpretation → action.
2. Gut–brain stress pathways, separating gastric and colonic effects.
3. Hard-surface bathroom acoustics and reverberation path.
4. Anxiety/time-perception experiment design and possible response shapes.
5. Olfactory habituation timeline.
6. Situational-syncope trigger cascade and safer-position handoff.
7. Three-minute experiment before/change/compare strip.

### A — Responsibility and Care

1. Four clocks of responsibility: live harm, effects, repair, ongoing care.
2. Repair sequence state machine.
3. Responsibility-category map: person, animal, social, technical, unclear.
4. Reproductive-health estimates with separate denominators.
5. Parent/baby first-hours dependency map.
6. Caregiver load and backup-network diagram.
7. Child/dependant immediate-safety inventory.

### B — Alarm and Calm

1. Four layers of anxiety: sensation, emotion, prediction, impulse.
2. Panic/medical-overlap routing diagram.
3. GAD-7 development versus pooled diagnostic-accuracy interval plot.
4. Working-memory queue under stress.
5. Sleep-restriction small multiples.
6. Breath-cycle timing diagram with optional patterns.
7. Breathwork-trial design map.
8. Bathroom control-panel matrix: sound, light, posture, temperature, contact.

### C — Body and First Aid

1. Pain geometry: location, onset, quality, rhythm, function, associated signs.
2. OPQRST annotated timeline.
3. First-minute preservation sequence.
4. Triage flow and priority matrix.
5. Bleeding-control sequence.
6. Burn depth/extent caution schematic without self-diagnostic overreach.
7. Stroke time model with model-status label.
8. Observation handoff: measurement, context, trend, limit.

### D — Threat and Safe Place

1. Three clocks of threat: now, expected, after-effect.
2. Active-threat exit/shelter decision structure.
3. Four-route safe-place map.
4. Safety-plan network: person, place, transport, device, documents, dependants.
5. Digital-discovery risk decision tree.
6. Access/care barrier matrix and runtime timeline.
7. Safe-place handoff anatomy.

### H — Air, Smell, and Environment

1. Hazard override matrix.
2. Source → path → exposure → action schematic for smoke, CO, gas, chemicals,
   and electricity.
3. Combustion/CO room diagram with fresh-air route.
4. Gas-spark prevention diagram.
5. Cleaner incompatibility matrix based only on authoritative product classes.
6. Electrical current-path and isolation schematic.
7. Indoor source versus official outdoor warning decision diagram.
8. Post-event recovery checklist as a process strip.

### Z — Outage and Continuity

1. Household dependency network.
2. Priority pyramid for disrupted infrastructure.
3. Water planner with three- and ten-day scenarios.
4. Medication/powered-device reserve runtime chart.
5. Heat-balance mechanism and symptom escalation route.
6. Shelter-versus-evacuate timeline.
7. Resource stock burn-down worksheet.
8. Communication-channel reliability matrix.
9. Group scale and coordination network.

### P — Professional Support

1. Service-selection route map.
2. IASC support pyramid.
3. Call-script anatomy.
4. Communication-channel/access matrix.
5. Local-service ownership map: national, regional, municipal, provider.
6. Legal/medical/social handoff preparation strips.
7. Social-connection association plot with causal-limit annotation.
8. Waiting-and-backup route timeline.

### R — Reference

1. Complete subguide graph.
2. Evidence-class taxonomy.
3. Claim → data → figure → source provenance graph.
4. Formula/model taxonomy.
5. Route coverage matrix.
6. Source freshness dashboard.
7. Version-to-version visual change map.

## 8. Future-module visualization opportunities

- **Small-Room Physics:** psychrometric/condensation chart, ventilation pathways,
  sound reflections, heat transfer, surface drying.
- **Decision Science Under Stress:** signal-detection matrix, queueing model,
  satisficing tree, base-rate/likelihood examples.
- **Sanitation and Plumbing:** trap schematic, sewer-gas path, toilet-failure
  modes, household water-flow map.
- **Digital Safety and Information Reliability:** verification funnel, metadata
  exposure map, rumour propagation network.
- **Mutual Aid and Group Coordination:** role network, communication scaling,
  commons-governance matrix, resource-accountability flow.
- **Measurement and Evidence Literacy:** distribution versus individual,
  sensitivity/specificity matrix, absolute versus relative risk, uncertainty
  intervals, model versus protocol taxonomy.

## 9. Reproducible build architecture

### 9.1 Canonical catalog

Introduce `src/data/visualization_catalog.json`:

```json
{
  "id": "sleep-restriction-small-multiples",
  "subguides": ["B"],
  "family": "quantitative-evidence",
  "question": "How did performance change across restriction conditions?",
  "takeaway": "Objective deficits accumulated while subjective sleepiness became less informative.",
  "data": "src/data/derived/sleep-restriction.csv",
  "spec": "src/visualizations/sleep-restriction.vl.json",
  "sources": ["van-dongen-2003"],
  "evidence_class": "controlled laboratory study",
  "denominator": "48 healthy adults",
  "uncertainty_policy": "show reported intervals when available",
  "alt": "...",
  "long_description": "...",
  "table_fallback": true,
  "mono_encoding": ["shape", "line-style", "direct-label"],
  "reviewed_on": "YYYY-MM-DD"
}
```

### 9.2 Rendering stack

Use different tools for different visual questions:

- **Vega-Lite** for reproducible quantitative charts and small multiples;
- **Graphviz or generated SVG** for graph topology and dependencies;
- **matplotlib** for scientific explanatory figures and custom interval plots;
- **Pillow** only for pixel-art assets or final raster post-processing;
- **plain semantic HTML/SVG** for forms, route cards, and simple diagrams.

Render canonical SVG plus robust PNG fallbacks. Keep chart specifications and
derived-data scripts outside the reader document; never print source code blocks.
Use `src/visualizations/theme.json` for chart-wide typography and axis defaults.
Individual specifications must not duplicate the shared theme or bake the
document title and interpretive note into the image.

### 9.3 Source tree

```text
src/visualizations/specs/
src/visualizations/diagrams/
src/data/raw/
src/data/derived/
src/data/visualization_catalog.json
build/diagrams/svg/
build/diagrams/png/
build/diagrams/tables/
build/qa/visualizations/
```

Raw data are immutable snapshots with source metadata. Derived tables are built
by scripts and carry hashes. The chart renderer consumes only reviewed derived
data.

## 10. Visualization linting and QA

Add `bin/validate_visualizations.py` and renderer-based tests.

### Catalog checks

- unique figure ID;
- valid subguide membership;
- source IDs resolve;
- question, takeaway, evidence class, denominator, and limit present;
- alt text and long description present;
- table fallback exists for essential quantitative graphics;
- declared monochrome encoding uses more than colour;
- generated files and data hashes match the catalog.

### Design checks

- minimum text size by output format;
- no label clipping or collision;
- no missing direct labels where required;
- bar axes begin at zero;
- small multiples share scales unless a visible exception is documented;
- required graphical objects meet non-text contrast or have contrasting borders;
- patterns remain visible in grayscale and photocopy simulation;
- annotations fit and remain near their referents;
- legends do not depend on hue alone;
- color/mono outputs have equivalent information.

### Review artifacts

Generate:

- all-figure contact sheets by subguide;
- monochrome and simulated colour-vision-deficiency sheets;
- chart metadata report;
- figure/source coverage matrix;
- page-density report before and after each visualization batch;
- extracted alt/long-description review document.

## 11. Delivery phases

### V0 — inventory and standards

- [x] define the visual grammar and candidate inventory;
- [ ] inventory every current figure and every prose passage that would benefit
  from visual explanation;
- [x] create the visualization catalog schema and initial eight-entry catalog;
- [ ] assign every planned visual a subguide, question, source class, and priority;
- [x] implement the first eight offline Vega-Lite figures with derived data and fallbacks.

### V1 — accessible design system

- [ ] define chart typography and spacing tokens for A4, A4/2, large print, and
  responsive HTML;
- [ ] define colour, pattern, shape, and line-style scales;
- [ ] add contrast and monochrome tests;
- [ ] define title, subtitle, annotation, source, and limit templates;
- [ ] prototype one chart from each figure family;
- [x] prototype quantitative-evidence, planning-model, mathematical-model, and architecture-explanation families.

### V2 — first 24-figure expansion

- [ ] prioritize O, B, C, H, and Z;
- [ ] add 12 mechanism/routing visuals;
- [ ] add 8 quantitative/evidence visuals;
- [ ] add 4 observation/handoff visuals;
- [ ] review page growth after every four figures.

### V3 — full subguide coverage

- [ ] reach at least four reviewed visuals per core subguide where appropriate;
- [ ] add local graph and final-handoff visuals;
- [ ] add source/provenance figures to R;
- [ ] generate standalone and master contact sheets.

### V4 — interactive HTML layer

- [ ] add interaction only where filtering, comparison, or inspection has a
  demonstrated benefit;
- [ ] preserve a complete static figure and table fallback;
- [ ] support keyboard, touch, zoom, and reduced motion;
- [ ] avoid hover-only values and inaccessible canvas-only output.

### V5 — continuous evidence maintenance

- [ ] link source freshness to affected figures;
- [ ] flag charts whose source or denominator changed;
- [ ] regenerate and visually diff figures in CI;
- [ ] retire figures that no longer clarify a useful question.

## 12. Acceptance criteria

- Every visualization has a declared question and takeaway.
- Every quantitative visual has source, denominator, scope, uncertainty policy,
  and practical limit.
- Every essential visual has equivalent text and data access.
- No figure relies on colour alone.
- Color and monochrome versions communicate the same relationships.
- No chart uses 3D or an unexplained dual axis.
- All chart specifications and derived datasets rebuild offline.
- Figure growth does not create blank pages, clipping, or unreadable labels.
- A visual review can trace any plotted mark back to data and source.
