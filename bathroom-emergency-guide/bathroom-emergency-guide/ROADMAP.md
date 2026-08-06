# Bathroom Emergency Guide — Roadmap

The guide is now broad enough that “add more chapters” is not a strategy. Future
work should improve **routing coverage**, **local usefulness**, and **evidence
quality** without turning the first minute into a literature review.

## Current release state

The active experimental line is **4.14.0-alt.2**. It has eleven standalone
colour books, 49 figures, 10 templates, 66 standalone PDF editions, and one
shared stable-reference registry. The current release work is no longer about
adding another top-level book. It is about reader review, field testing,
documentation accuracy, and making local deployment evidence as inspectable as
the build evidence.

Immediate open work:

- review representative master and standalone contact sheets with readers;
- test figures and templates in actual wet-room installations;
- test first-aid depictions with trained instructors and novice readers;
- verify that the feedback mailbox and response workflow work operationally;
- promote or retire the experimental `alt` line only after that evidence exists.

## Design invariants

Every extension must preserve these rules:

1. **Red flags dominate.** No score, chart, home measurement, or reassuring
   percentage may cancel emergency routing.
2. **One route, one action.** The first screen/page supplies one next action, one
   backup, one escalation condition, and one destination.
3. **Scope travels with the number.** Numeric claims need evidence class,
   population or model scope, denominator, uncertainty where available, source,
   and practical limit.
4. **Text remains complete.** Diagrams help; they never become the only usable
   route.
5. **Local details are data.** Service numbers, language, legal routes, and
   regional hazards should be configurable rather than buried in prose.
6. **Humour follows safety.** A joke may sit beside explanation, never between a
   danger sign and the action.

## Review findings from 4.1.1–4.1.2

### Strong foundations

- The red-flag override and four destination guides remain a sound top-level
  architecture.
- The A–G entry doors cover emotional, bodily, responsibility, danger,
  congestion, household-hazard, and no-place states in plain language.
- The long text tree provides a robust non-visual fallback.
- Evidence labels and the new fact registry make bounded quantitative material
  reviewable and reproducible.
- The color and monochrome A4 and A4/2 pipelines support offline use and two
  distinct reading rhythms without duplicating content.

### Remaining structural gaps

- Environmental hazards are distributed across smell, first aid, and disaster
  chapters rather than represented by one explicit hazard gate.
- Vulnerability modifiers—infant, pregnancy, disability, medication dependence,
  language/access needs, animal care—appear in chapters but do not yet alter the
  main route visibly.
- “No safe place” combines housing loss, violence, exposure, social overload,
  and internal crisis; these need a clearer second-level split.
- Local services are fillable prose, not validated locale data.
- The guide handles outages better than short evacuations, floods, heat waves,
  smoke/CO, and loss of essential medical equipment.
- The evidence registry validates shape and values but not automatic source
  freshness or claim-to-figure consistency.

## Main flowgraph evolution

### Proposed two-pass topology

Keep the first pass short:

```text
PASS 1 — OVERRIDE
  life/medical danger?              -> 112
  active violence/crime?            -> safer place -> 110 / 112
  fire/smoke/gas/chemical/electric? -> leave/isolate if safe -> 112/utility

PASS 2 — NEED
  body / alarm / threat-duty / outage-place
      -> apply modifiers
      -> one action + backup + escalation + destination
```

Then apply visible modifiers without creating dozens of top-level doors:

```text
M = {alone, child/infant, pregnancy/postpartum, disability,
     medication/power dependence, language/access need, animal,
     unsafe home/device, no transport}
```

A modifier changes instructions, not urgency. For example, a power-dependent
medical device adds an early backup-power/service route; it does not invent a
new diagnosis.

### Flowgraph extensions by priority

| Priority | Extension | Why it belongs in the main graph | Definition of done |
|---|---|---|---|
| P0 | fire, smoke, carbon monoxide, gas, chemical, electrical hazard gate | these hazards require leaving before ordinary troubleshooting | one compact override branch, official actions, text fallback, no switch/flame errors |
| P0 | vulnerable-person modifier strip | current route may change when an infant, pregnant/postpartum person, dependent adult, disabled person, or animal is present | modifiers appear after override and point to chapter-specific adaptations |
| P0 | essential medication / powered-device failure | outages can become medical emergencies quickly | route covers backup power, supplier, 116 117/112 escalation, and written device plan |
| P1 | “no place” second-level split | housing, violence, exposure, and internal crisis require different services | four explicit subroutes with one-hour action and local destination |
| P1 | evacuate versus shelter decision | current disaster chapter explains both but the main graph does not choose | official-warning dominance, immediate-hazard exception, go-bag and accessibility branch |
| P1 | poisoning/substance exposure route | currently divided between smells and first aid | product/substance identification, fresh-air/rinse limits, poison centre versus 112 |
| P2 | information reliability gate | outages and conflict invite rumours and malicious instructions | verify source/time/location, two-channel confirmation, no delay of immediate safety action |
| P2 | recovery/aftercare loop | the current loop ends after escalation or improvement | documentation, follow-up, restocking, repair, and delayed-symptom route |

## Chapter extension candidates

### Ch.1 — Start Here

- Add the two-pass flowgraph and modifier strip.
- Add a one-page “what this guide cannot decide” boundary map.
- Add accessibility instructions for low vision, screen readers, cognitive
  overload, and limited German.
- Future visualization: route-coverage matrix showing that every entry reaches
  action, backup, escalation, and destination.

### Ch.2 — Responsibility and dependants

- Expand medication-dependent, mobility-dependent, and communication-dependent
  care plans.
- Add a brief safeguarding route for children and dependent adults without
  encouraging amateur investigation.
- Add pet evacuation, transport, heat, and medication planning.
- Add grief and ambiguous-loss support without stage models or mandatory
  emotional sequences.
- Candidate evidence: respite-care access, medication reconciliation, and
  continuity-plan research—only where denominators and intervention scope are
  clear.

### Ch.3 — Situations B–F and the Situation G handoff

- Separate panic, dissociation, intoxication/withdrawal, delirium, and psychosis
  by observable red flags rather than self-diagnosis.
- Add heat, cold, dehydration, and sleep-loss modifiers to overload.
- Expand smell into a compact household-hazard classifier: gas, CO/smoke,
  electrical, chemical, sewage, damp/mould, ordinary hygiene.
- Expand “no place” into physical shelter, violence escape, social overload,
  and internal crisis.
- Candidate visualizations: symptom-overlap caution map; source-to-action hazard
  matrix; decision-quality versus repeated sleep restriction only when primary
  data can be plotted faithfully.

### Ch.4 — Calm Guide

- Add sensory-access alternatives for readers who cannot use visual grounding,
  breath focus, or body scans.
- Add co-regulation scripts for children, dementia, autism, and acute grief,
  reviewed for respectful language and evidence limits.
- Add a short section on when breathing focus worsens panic and how to switch to
  external orientation.
- Candidate evidence: systematic reviews of brief grounding and paced breathing;
  avoid device-derived HRV promises and universal vagal explanations.

### Ch.5 — First Aid

- Add official carbon-monoxide/smoke inhalation, heat illness, cold injury,
  drowning/near-drowning, and chemical-eye exposure routes.
- Add medication error and overdose routing with poison-centre boundaries.
- Add “waiting for help with accessibility needs” instructions: door access,
  communication cards, service animals, mobility equipment.
- Add delayed-symptom and follow-up prompts after head injury, burns, electrical
  injury, and inhalation exposure, based on current official guidance.
- Candidate visualizations: FAST timeline model already present; next figures
  should favour protocol sequences over unsupported severity scales.

### Ch.6 — Outage and disaster

- Add heat wave, winter outage, flood, wildfire/smoke, contaminated water,
  evacuation, and shelter-in-place modules.
- Add refrigeration and temperature-sensitive medication planning.
- Add sanitation/WASH for apartments and short disruptions without importing
  humanitarian-camp quantities into household advice.
- Add analogue information and neighbourhood check-in plans.
- Candidate visualizations: battery/runtime budget, food-refrigeration decision
  tree, evacuation load by mobility constraint, and communication-network
  resilience under node failure.

### Ch.7 — Professional support

- Convert German service information into a locale registry with reviewed date,
  language availability, opening hours, and escalation boundary.
- Add routes for disability advice, migration/language support, debt, tenant
  emergencies, addiction, sexual violence, LGBTQIA+ crisis support, and animal
  emergencies.
- Add “how to prepare for a first appointment” templates without collecting
  secrets in shared printouts.
- Candidate evidence: access barriers and service-navigation studies; avoid
  generic therapy success percentages.

### Ch.8 — Appendix

- Add a claim ledger mapping each numeric sentence to registry key, source, figure,
  and chapter.
- Add printable household profiles as optional separate pages, not part of a
  shared default print.
- Add change-log tables for revised estimates and withdrawn claims.
- Add machine-readable JSON schema for evidence and locale data.

## Research and visualization backlog

A candidate only graduates into the guide when the exact figure can be defended.

| Candidate | Useful question | Preferred evidence | Main trap |
|---|---|---|---|
| carbon-monoxide exposure | which observable signs and actions require immediate exit/112? | fire service/public-health protocol | symptom concentration thresholds used for self-clearance |
| heat illness | what separates cooling/monitoring from emergency signs? | current guideline/systematic review | universal temperature cut-offs without measurement context |
| household refrigeration | when should food be discarded during outage? | public food-safety authority | one time limit applied to every appliance/food |
| medication continuity | how long can specific products tolerate temperature excursion? | product/authority data | generic medication rules |
| evacuation mobility | how do time and load change with stairs, aids, children, animals? | civil-protection guidance and measured drills | invented speed constants |
| crisis communication | which message structures improve handoff accuracy? | dispatch/human-factors studies | turning mnemonics into outcome guarantees |
| bystander support | what forms of contact improve engagement or help-seeking? | randomized/systematic evidence | mortality associations presented as intervention effects |
| flood and sewage | which contact and contamination actions are safe? | public-health/civil-protection protocols | household bleach recipes without concentration authority |
| misinformation | which verification steps reduce forwarding of false alerts? | behavioural experiments/systematic reviews | assuming one literacy trick works in acute danger |

## Engineering roadmap

### 4.2.0 — Routing and hazard architecture — released

- [x] execute the core of the two-track content plan;
- [x] implement the two-pass flowgraph and structured route registry;
- [x] add fire/smoke/CO/gas/chemical/electrical Situation H override;
- [x] add modifier strip and essential medication/powered-device route;
- [x] make the existing smell route subordinate to the hazard gate;
- [x] add data-driven route, hazard, and continuity visualizations;
- [x] preserve complete text and A4/A4/2 monochrome parity;
- [ ] split “no place” into four fully localized service subroutes—carried into
  4.3.0 because the destinations depend on locale data and accessibility.

### 4.3.0 — Locale, accessibility, and safe-place routing — implemented candidate

- [x] split Situation G into four service-specific routes;
- [x] extend `src/data/locales/de-DE.json` with scoped national services,
  access channels, and explicit local-only destinations;
- [x] add source freshness windows, warnings, failures, and deterministic
  `GUIDE_AS_OF` validation;
- [x] add six communication/access profiles, minimal written cards, and
  alternate non-breath-focused adaptations;
- [x] add safe-place and communication-access visualizations;
- [x] add color and monochrome A4 large-print editions;
- [x] test image alternatives, heading order, tagging, blank pages, geometry,
  page growth, and color/mono text parity;
- [ ] add further locales only with a local reviewer and authoritative service
  sources; translation without route ownership remains out of scope.

### 4.3.1 — Navigation and release polish — released

Tracked in `docs/plans/4.3.1-polish-plan.md`.

- [x] correct the B–F identity and preserve a named Situation G handoff;
- [x] restore and validate executable command-line script modes;
- [x] align standalone cover language and validation output with the reader voice;
- [x] bump current source, registry, and renderer metadata to 4.3.1;
- [x] review the seven sparsest A4 pages and retain each as functional writable
  space, safety buffer, opener, handoff, or reference boundary;
- [x] document the decisions in `docs/qa/4.3.1-sparse-page-review.md`;
- [x] rerender and approve the six-edition 88/87/139 page-count and density
  matrix;
- [x] commit and tag `v4.3.1` after patch approval.

### 4.4.1 — Household continuity and common-source synthesis — released

Tracked in `docs/plans/4.4.1-common-synthesis.md`.

- [x] compare the canonical and alternate source trees section by section;
- [x] preserve the canonical safety, evidence, accessibility, and print system;
- [x] reject unsupported alternate medical, survival, legal, and developmental
  claims;
- [x] add an eight-system household-continuity registry;
- [x] add five explicit first-meeting roles and an assignment invariant;
- [x] generate household-continuity and first-meeting-role visualizations;
- [x] add continuity validation and build integration;
- [x] integrate selected non-stigmatizing and human-factors prose;
- [x] render and review all six editions at 93 A4, 93 A4/2, and 144 large-print pages;
- [x] confirm the sparsest new page is functional writable/handoff space;
- [x] commit and tag `v4.4.1` after explicit approval.

Deferred to later releases:

- full heat/cold/flood/smoke standalone modules;
- optional household profile pages outside the shared default guide;
- the first 24-figure visualization expansion;
- remaining-node source migration beyond the B/H release-candidate pilot.

### 4.4.2 — Manifest and Vega foundation — completed into 4.5.0 candidate

Tracked in `docs/plans/4.4.2-alt-spec-feasibility-and-vega.md`.

- [x] review the alternate modular expansion specification as an architectural
  proposal and record accepted, modified, deferred, and rejected approaches;
- [x] add `docs/plans/4.5.0-roadmap-milestones.md` with M0–M7 entry/exit gates
  and explicit stop rules;
- [x] add a nine-node prototype subguide manifest without moving canonical prose;
- [x] add offline Vega/Vega-Lite dependencies, deterministic derivation, SVG/PNG
  rendering, and catalog validation;
- [x] add an eight-chart Vega-Lite batch and retire six superseded
  matplotlib outputs;
- [x] add two new reader-facing structure/model charts with adjacent prose or
  table fallbacks;
- [x] generate ownership inventories for 186 level-1/2 sections and 28 current
  or migrated figure records;
- [x] inventory 52 chapter footnotes and 75 global source-note sections with no
  unresolved references;
- [x] build B and H standalone color/mono pilots with canonical extraction,
  one emergency gate, handoffs, and generated local Sources and limits;
- [x] generate B/H Sources and limits sections inside the master guide while
  retaining the global source chapter for parity review;
- [x] add a shared Vega-Lite theme, catalog-driven figure macros, accessible SVG
  metadata, and a clean quantitative-chart page treatment;
- [x] document renderer boundaries and state-of-the-art chart, illustration,
  typography, and page-composition rules in `docs/plans/visual-design-system.md`;
- [x] inventory the seventeen current non-Vega figures by family, reader question,
  renderer, fallback, monochrome strategy, and redesign priority;
- [x] enforce intentional major-tick density, minimum rendered chart text, and
  text/essential-mark contrast in the visualization validator;
- [x] complete the six-edition build, visual review, and page-growth audit;
- [x] send the reviewed A4/2 candidate through the configured Dockerroutes
  Telegram delivery path;
- [x] commit and tag the validated release locally without pushing or deploying.

### 4.5.0 — Graph-oriented subguide editions — released

Tracked in `docs/plans/4.5.0-graph-subguide-architecture.md` and
`docs/plans/4.5.0-roadmap-milestones.md`.

- [x] define a proposed nine-subguide core family and graph identity;
- [x] define candidate satellite modules for small-room physics, decision
  science, sensors, sleep, medicines, sanitation, human factors, mutual aid,
  evidence literacy, locality, and field experiments;
- [x] specify cover, page-0 position/version, page-1 introduction/contents, and
  final handoff page grammar;
- [x] specify redundant code + pattern + glyph + colour identity;
- [x] distinguish master-guide and standalone emergency-gate behaviour;
- [x] define data, CSS, graph, build, validation, and editorial contracts;
- [x] specify local end-of-subguide Sources and limits with a deduplicated R
  index;
- [x] specify a 48–60-figure visualization program and reproducible chart
  pipeline;
- [x] add a validated nine-node prototype manifest over the current canonical chapters;
- [x] generate exact section and figure ownership inventories for migration;
- [x] build the B and H standalone pilots in color and monochrome;
- [x] pilot generated local Sources and limits in B/H standalone and master outputs;
- [x] bring both B and H to the planned minimum of four high-value canonical visuals;
- [x] prototype the graph and two competing subguide groupings on paper;
- [x] test monochrome/pattern recognition in A4 and A4/2;
- [x] freeze codes, patterns, and chapter assignments after visual review;
- [x] implement registry-driven A4, A4/2, and large-print colour/monochrome outputs;
- [x] migrate B and H as bounded slices without duplicating canonical prose;
- [x] generate each released subguide's source-complete end matter from one registry;
- [x] require orientation, mechanism/evidence, and handoff coverage in the B/H release gate;
- [ ] detach the remaining node after equivalent visual,
  source, layout, and accessibility review.

### 4.6.0 — Templates, stable references, and deployment — released

Tracked in `docs/plans/4.6.0-release-architecture.md`.

- [x] add T — Templates / The Blue Book as the tenth graph identity;
- [x] add detachable forms for local facts, observations, safe places,
  continuity, feedback, remarks, and low-demand activities;
- [x] define author, deployer, reader, and helper responsibilities;
- [x] add a privacy-aware machine-readable deployment-field index;
- [x] add stable typed public reference IDs and matching HTML anchors;
- [x] retain retired IDs and reject collisions/reuse;
- [x] generate the global content, form, deployment, contact, diagram, and
  glossary indexes into R — Reference;
- [x] release T and R in A4, A4/2, and large-print color/mono families;
- [x] add project landing and deployment documentation artifacts;
- [x] add revision metadata to HTML and print furniture;
- [x] harden CPR/AED/recovery-position/choking explanations and orientation;
- [x] add a complete CI/build/release-manifest matrix;
- [x] complete the deterministic release build and independent test pass at
  source revision `5f60f73cf1ff`;
- [x] record release evidence and tag `v4.6.0` locally without pushing,
  publishing, or deploying;
- [ ] usability-test the new first-aid diagrams with trained instructors and
  people who have not practised CPR;
- [ ] replace the provisional recovery-position figures with reviewed human-body
  illustrations after testing;
- [ ] add a tested, illustrated bird-folding insert rather than shipping an
  unverified text-only origami sequence;
- [ ] add separate printable graffiti, crossword, sudoku, and logic inserts
  only after licensing, difficulty, and accessibility review;
- [ ] prototype real bathroom installations and document water, mounting,
  reach, glare, page-turning, privacy, and replacement findings;
- [x] detach C and P next, because their action/contact structure now has the
  strongest supporting indexes, but only after equivalent visual and source
  review.

### 4.6.1 — Field-test and provenance hardening — released

- [x] add installation, route-drill, first-aid-figure-review, and maintenance
  sheets to the Blue Book;
- [x] add a deterministic ten-node source/section/visual/readiness matrix;
- [x] embed that matrix in R — Reference and validate generated-file freshness;
- [x] add the new forms and coverage gate to CI and the complete build pipeline;
- [x] complete the full render/test matrix and record release evidence;
- [x] tag `v4.6.1` locally without pushing, publishing, or deploying.

### 4.7.0 — First-aid and professional-support standalone editions — released

- [x] add three source-backed P visuals for call handoff, layered support, and
  system selection, each with complete adjacent text fallback;
- [x] detach C from its owned mixed-section route plus the full first-aid
  chapter without duplicating canonical prose;
- [x] detach P from the canonical professional-support chapter;
- [x] require C/P source, visual, tagging, semantic-parity, geometry, and
  color/monochrome gates across all six editions per node;
- [x] complete the full render/test matrix and record release evidence;
- [x] tag `v4.7.0` locally without pushing, publishing, or deploying.

### 4.8.0 — Modern project and deployment site — completed into 4.9.0

- [x] replace the single inline landing document with a responsive shared design
  system using local assets, system fonts, route colours, and dark/light modes;
- [x] add project, deployment-planner, download-catalogue, and 404 pages;
- [x] package the complete guide, route hub, standalone families, master PDFs,
  project docs, release metadata, manifest, and offline web assets under
  `build/site`;
- [x] keep the deployment planner local-only and explicitly prohibit sensitive
  facts in browser storage;
- [x] add browser verification for desktop/mobile overflow, console errors,
  external runtime requests, themes, planner persistence, and filters;
- [x] add a GitHub Pages workflow with an optional reviewed custom-domain
  variable while keeping local builds non-publishing;
- [x] complete the full build/test matrix as the web baseline inherited by
  4.9.0;
- [x] keep 4.8.0 untagged and supersede it with the content-and-illustration
  release rather than creating two indistinguishable local release points.

### 4.9.0 — Observation and safe-place visual language — released

- [x] add a first-90-seconds body/room/attention scan and sharpen the bounded
  observation language;
- [x] add four source-backed O illustrations with complete adjacent text;
- [x] redesign the dense safe-place and communication graphics around short
  operational labels;
- [x] add destination-confirmation and remaining-reserve figures to D;
- [x] require four owned reader visuals and numeric candidate state for O and D;
- [x] keep both nodes master-only pending standalone layout, accessibility, and
  real-user review;
- [x] complete the exact-source build/test matrix and record 4.9.0 evidence;
- [x] tag `v4.9.0` locally without pushing, publishing, or deploying.

### 4.10.0 — Orientation and safe-place standalone editions — released

- [x] extract O from the canonical Observatory chapter without copying the
  master cover or duplicating the emergency gate;
- [x] extract D from its owned threat section and complete safe-place chapter;
- [x] require O eleven-source/four-visual and D eight-source/four-visual release
  thresholds;
- [x] add O and D to the graph hub, Pages package, download catalogue, coverage
  matrix, migration checks, and complete build matrix;
- [x] expand the standalone PDF matrix from 36 to 48 editions;
- [x] keep A and Z master-only pending equivalent visual and standalone review;
- [x] complete the exact-source build/test matrix and record 4.10.0 evidence;
- [x] tag `v4.10.0` locally without pushing, publishing, or deploying.

### 4.11.0 — Outage and continuity standalone edition — released

- [x] add a current local BBK warning-channel source for NINA and Cell
  Broadcast;
- [x] extract Z from the canonical outage and continuity chapter without
  duplicating reader prose;
- [x] require four local sources and seven owned reader visuals in the Z release
  gate;
- [x] add Z to the graph hub, Pages package, download catalogue, coverage
  matrix, migration checks, and complete build matrix;
- [x] expand the standalone PDF matrix from 48 to 54 editions;
- [x] keep A master-only pending an equivalent visual and standalone review;
- [x] complete the exact-source build/test matrix and record 4.11.0 evidence;
- [x] tag `v4.11.0` locally without pushing, publishing, or deploying.

### 4.12.0 — Encapsulation and cross-reference grammar — released

- [x] add scope, boundary, aliases, exit rule, and resource map to every
  released standalone family;
- [x] add stable figure cards joining illustrations to route identity, reader
  question, and paired Blue Book forms;
- [x] add privacy-aware route bands to all eighteen canonical forms;
- [x] add generated support-to-form-to-figure handoff mapping;
- [x] replace duplicate support and appendix tables with canonical form/index
  references;
- [x] preserve public reference IDs across planned heading rewrites;
- [x] retain the nine-family, 54-standalone-PDF release matrix;
- [x] complete exact-revision build/test evidence for 4.12.0;
- [x] tag `v4.12.0` locally without pushing, publishing, or deploying.

### 4.13.0 — Responsibility and Care standalone edition — released

- [x] rewrite A around four responsibility clocks and the
  stop–stabilize–tell–repair–follow-up sequence;
- [x] add explicit consent, capacity, authority, refusal, and immediate-danger
  boundaries;
- [x] add four operational A figures beside the existing denominator chart;
- [x] attach seven canonical Blue Book forms and professional-support routes;
- [x] extract A from its canonical chapter with one emergency gate, edition
  contract, resource map, handoffs, and local Sources and limits;
- [x] require five local sources and five owned reader visuals;
- [x] add A to the hub, site, release manifest, coverage matrix, migration
  checks, and complete build matrix;
- [x] expand the standalone PDF matrix from 54 to 60 editions and leave no
  master-only graph node;
- [x] complete exact-revision build/test evidence for 4.13.0;
- [x] tag `v4.13.0` locally without pushing, publishing, or deploying.

### 4.13.1 — Deterministic render-tooling patch — released

- [x] add a project-local Fontconfig profile and declare it in the visualization
  catalog;
- [x] load the profile before Vega/native canvas initialization and propagate it
  to SVG rasterization;
- [x] replace unsupported Matplotlib `black` requests with supported bold
  weights;
- [x] surface successful child-renderer stderr instead of silently discarding
  warnings;
- [x] add a smoke validator for Fontconfig XML, diagram weights, eight Vega SVGs,
  eight Vega PNGs, exact output names, and zero stderr;
- [x] verify a complete diagram build emits zero stderr bytes;
- [x] complete exact-revision build/test and representative visual-inspection
  evidence for 4.13.1;
- [x] tag `v4.13.1` locally without pushing, publishing, or deploying.

### Cross-release visualization program

Tracked in `docs/plans/visualization-program.md`.

- [x] define figure families, chart-selection rules, accessibility standards,
  and a per-subguide candidate inventory;
- [x] set a reviewed target of approximately 48–60 master-guide visuals;
- [x] add `src/data/visualization_catalog.json` and the first eight offline Vega-Lite figures;
- [x] add SVG/PNG generation from Vega-Lite, generated SVG, and matplotlib as appropriate;
- [x] add alt text, long descriptions, table fallbacks, contrast checks, and
  color/mono information-parity tests;
- [x] generate figure contact sheets and colour/mono parity reports;
- [x] publish the consolidated full-program source-coverage and provenance matrix
  inside the generated Reference edition and tracked JSON registry.

### Subguide-local source migration

Tracked in `docs/plans/subguide-source-localization.md`.

- [x] agree on local Sources and limits at the end of every subguide;
- [x] retain citations beside claims and one canonical source registry;
- [x] define master versus standalone behavior and a B/H pilot;
- [x] inventory current Ch.10 entries and chapter footnotes;
- [x] add stable source IDs and B/H subguide ownership;
- [ ] enrich claim, route, and figure links across the remaining nodes;
- [ ] migrate subguides incrementally and replace the monolithic bibliography
  with an R source index only after parity is proven.

### Continuous quality work

- validate that every referenced figure exists and every figure key exists in
  the evidence registry;
- compare numeric prose against registry values where practical;
- fail builds on deprecated figure names or withdrawn claim fragments;
- record source review dates and flag stale operational sources;
- render representative PDF pages and inspect crop, contrast, captions, and
  monochrome legibility;
- add tests that every flowgraph destination has a text equivalent.

## Not planned without stronger evidence

- personal survival percentages;
- universal cortisol or “nervous-system reset” curves;
- therapy response promises detached from condition and comparator;
- home vital-sign thresholds that clear emergency symptoms;
- deterministic attachment, trauma, or developmental predictions;
- improvised chemical dosing;
- tactical violence advice;
- scores that claim to decide whether a person deserves urgent help.

Those topics may be scientifically interesting. They are not automatically good
bathroom furniture.

### 4.14.0-alt.1 — Eleven-book editorial synthesis — experimental

- [x] preserve 4.13.1 as the technical baseline;
- [x] import Green, Purple, and Orange as first-class canonical books;
- [x] apply colour-book titles and alt-derived adult humour across the shelf;
- [x] remove governance-first standalone wrappers and repetitive safety framing;
- [x] retain route, source, accessibility, stable-reference, and release contracts;
- [ ] complete reader review of all master and standalone contact sheets before promoting the experiment.

### 4.14.0-alt.2 — Resource grammar and release-documentation pass

- [x] classify every public resource as either **Figure · Read only** or
  **Template · Write**;
- [x] reclassify eight deployer-completed local sheets as figures while
  retaining their former stable references as legacy aliases;
- [x] require title, stable reference, and short description on all 49 figures
  and 10 templates;
- [x] update README, deployment instructions, roadmap, landing metrics, feedback
  wording, and generated catalogues to the same model;
- [x] remove stale pre-Grey-Book output aliases from clean standalone builds;
- [x] rebuild and validate all six master and 66 standalone editions;
- [ ] complete real-reader and real-installation review before promoting the
  experimental line.
