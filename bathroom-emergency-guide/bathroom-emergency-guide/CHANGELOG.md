# Changelog

## 4.14.0-alt.2 — 2026-08-06

### Changed

- repaired the figure and template layout grammar so each resource is one visual group rather than a heading, image, route dashboard, and reference card competing for attention;
- reduced the public resource model to **Figure · Read only** and **Template · Write**;
- reclassified eight deployer-completed local reference sheets as figures, bringing the public inventory to 49 figures and 10 templates;
- added a title, stable reference, and short description to every figure and template;
- separated the Grey Book contents into local reference figures and reusable templates and generated matching Copper Book catalogues;
- preserved former form references for the eight local figures as legacy anchors rather than silently recycling them;
- updated README, deployment instructions, roadmap, in-guide history, landing metrics, downloads, and feedback wording to the same model;
- linked the landing and download pages directly to `[BEG:T:F:005] Feedback and field-note sheet`;
- made clean standalone builds remove stale pre-Grey-Book output aliases before rendering;
- made selected guide builds regenerate diagrams and reference inventories before rendering so stale depictions cannot survive behind current prose.

### Compatibility

- active stable references retain their assigned meaning;
- the eight migrated local sheets have new canonical G references while their former F references remain reserved and resolve through legacy HTML anchors;
- historical changelog and release-plan terminology remains unchanged where it accurately describes an older release.

### Verification

- the complete six-edition master matrix and all 66 standalone PDF editions build from one source tree;
- reference, migration, layout, density, accessibility, overflow, browser, site, and build-matrix gates pass;
- site metadata distinguishes 49 public figures from 41 authored visual depictions;
- local build and tagging do not push, publish, deploy, or run the Pages deployment workflow.

## 4.14.0-alt.1 — 2026-08-06

### Changed

- integrated the 4.x-alt editorial and visual direction into the mature main-line build;
- replaced the ten-node naming layer with eleven memorable colour books while preserving stable route IDs;
- made the Green Body Owner’s Manual, Purple Social Field Guide, and Orange Natural Disasters book canonical;
- shortened the opening into an adult, practical book map and moved graph/provenance material behind the content;
- retained jokes and direct address while removing repetitive safety-preface language;
- rebuilt unsafe alternate overclaims about disaster shelter, emergency water, medication, fainting, and body interpretation;
- replaced dense governance-first standalone wrappers with reader questions and compact handoffs;
- expanded the standalone matrix from 60 to 66 tagged PDF editions.

### Verification

- all eleven books build from canonical chapters with one cover emergency gate each;
- source, route, accessibility, stable-reference, layout, and colour/monochrome contracts remain active across the expanded matrix.

## 4.13.1 — 2026-08-02

### Made offline rendering deterministic and quiet

- Added a project-local Fontconfig profile for Vega text measurement and SVG to
  PNG rasterization instead of inheriting unrelated host desktop fragments.
- Replaced unsupported Matplotlib `black` weight requests with the available
  bold weight used by the rest of the diagram system.
- Made successful child-renderer stderr visible so a future warning cannot be
  silently discarded.

### Added a render-tooling regression gate

- Added a validator that parses the local Fontconfig profile, rejects unsupported
  diagram weights, smoke-renders all eight Vega-Lite figures, checks the exact
  SVG/PNG output set, and fails on any stderr.
- Kept all ten standalone families, 60 standalone PDFs, route identities,
  evidence claims, forms, sources, and public references otherwise unchanged.
- Preserved the publication boundary: no push, publication, deployment, or
  Pages workflow is performed by the local release build.

## 4.13.0 — 2026-08-02

### Released Responsibility and Care as the tenth standalone family

- Detached A from the canonical responsibility and care chapter without copying
  reader prose into a parallel source.
- Released A4, A4/2, and large-print colour/monochrome editions with five local
  sources, five owned reader visuals, seven linked Blue Book forms, complete
  graph handoffs, and generated Sources and limits.
- Expanded the graph hub, download catalogue, Pages package, release manifest,
  coverage report, migration checks, and complete matrix from 54 to 60
  standalone PDF editions.

### Made responsibility operational before it becomes moral analysis

- Added a four-clock route that separates live harm, continuing effects, repair,
  and ongoing care so immediate safety outranks blame or explanation.
- Clarified the stop–stabilize–tell–repair–follow-up sequence and made explicit
  that apology, acceptance, forgiveness, liability, and completed repair are
  different claims.
- Added a consent/capacity/authority boundary that preserves agency while keeping
  a genuine immediate danger on the emergency route.
- Added a care-continuity loop for essentials, warning signs, owner, backup, and
  next review.

### Closed the graph without weakening its boundaries

- Linked A to the canonical emergency, location/access, professional-contact,
  values, essential-care, household-continuity, and handoff forms instead of
  creating a second worksheet family.
- Added stable figure cards and route/form/support metadata for all five A
  visuals while preserving every existing public reference.
- Kept liability, diagnosis, capacity findings, consent, forgiveness, service
  availability, and real-world repair outside the claims of the build evidence.
- Preserved the publication boundary: no push, publication, deployment, or
  Pages workflow is performed by the local release build.

## 4.12.0 — 2026-08-02

### Made standalone editions explicit field objects

- Added an edition contract to every released route: inside scope, deliberate
  boundary, canonical aliases, exit rule, and a local resource map.
- Added figure, form, support, and route references to standalone manifests so
  encapsulation is validated rather than inferred from a cover.
- Kept all nine released families on one canonical source tree and retained the
  existing 54-PDF layout/mode matrix.

### Joined figures, forms, support, and route identities

- Added generated figure cards carrying stable addresses, owning route,
  pattern, glyph, reader question, and paired Blue Book forms.
- Added an eighteen-form route-band system with privacy class, operational route
  chips, related figures, and professional-support references.
- Rebuilt Reference indexes around route identity, illustration/form pairing,
  and service-to-handoff relationships instead of duplicated prose tables.
- Added a support handoff map that distinguishes reaching a service from
  confirming an outcome, backup, owner, and review time.

### Improved writing without breaking public addresses

- Rewrote Professional Support around the concrete change each system can make
  and clarified the minimum operational handoff.
- Clarified how eight legacy situation doors map into ten maintained route
  identities and moved writable local facts back to their canonical T forms.
- Preserved the prior stable references for five rewritten headings; no active
  resource was retired merely because its wording improved.
- Preserved the publication boundary: no push, publication, deployment, or
  Pages workflow is performed by the local release build.

## 4.11.0 — 2026-08-02

### Released Outage and Continuity as a standalone family

- Detached Z from the canonical outage, disaster, and continuity chapter
  without creating a parallel source or copying unrelated master-guide prose.
- Released A4, A4/2, and large-print colour/monochrome editions with four local
  sources, seven owned reader visuals, complete graph handoffs, and generated
  Sources and limits.
- Required the warning-verification route, household continuity board, water
  planning, essential-treatment continuity, communication scaling, first-
  meeting roles, evacuation list, and preparedness checklist to remain present
  across every edition.

### Strengthened warning-channel provenance

- Added a local BBK source for NINA and Cell Broadcast beside the instruction
  to verify official warnings before optimising supplies or forwarding claims.
- Kept the warning mix explicit: short direct alerts and fuller information
  channels complement rather than replace one another.

### Expanded the release matrix to nine route families

- Expanded the graph hub, download catalogue, Pages package, release manifest,
  coverage report, migration checks, and complete build matrix from 48 to 54
  standalone PDF editions.
- Kept A — Responsibility and Care inside the master guide until it gains an
  equivalent visual set and standalone review.
- Preserved the publication boundary: local builds and tags do not push,
  publish, deploy, or run the prepared Pages workflow.

## 4.10.0 — 2026-08-01

### Released the Small-Room Observatory as a standalone family

- Detached O from the canonical Observatory chapter without copying the master
  cover or creating a second emergency gate.
- Released A4, A4/2, and large-print colour/monochrome editions with eleven
  local sources, four owned reader visuals, graph handoffs, and local Sources
  and limits.
- Required the route-choice table, first-90-seconds scan, interoception loop,
  signal/story/question sequence, and bounded observation contract to remain
  present across every edition.

### Released Threat and Safe Place as a standalone family

- Detached the D-owned threat-clock section and the complete canonical
  safe-place chapter without duplicating reader prose.
- Released six D editions with eight operational sources and four owned reader
  visuals covering routing, confirmation, communication access, and remaining
  reserve.
- Added release checks for the safe-place handoff, G1/G3 routes, one emergency
  gate, foreign-section exclusion, tagged PDFs, geometry, and semantic parity.

### Expanded the release matrix to eight route families

- Expanded the graph hub, download catalogue, Pages package, release manifest,
  coverage report, migration checks, and complete build matrix from 36 to 48
  standalone PDF editions.
- Kept A — Responsibility and Care and Z — Outage and Continuity inside the
  master guide until their visual and standalone review work is complete.
- Preserved the publication boundary: local builds and tags do not push,
  publish, deploy, or run the prepared Pages workflow.

## 4.9.0 — 2026-08-01

### Made the opening route operational before it becomes explanatory

- Added a first-90-seconds scan that separates body, room, and attention before
  the reader chooses a route or attempts a diagnosis.
- Clarified that the three-minute experiment is bounded observation rather than
  mandatory delay, and that no improvement is itself a route-changing result.
- Tightened the signal/story/question language so curiosity can revise a
  hypothesis without implying that a vivid symptom is harmless or “only
  anxiety.”

### Added a four-figure Small-Room Observatory visual set

- Added an observatory scan, interoception loop, signal/story/question sequence,
  and bounded three-minute timeline.
- Kept every image redundant with complete adjacent prose, direct labels,
  numbered order, monochrome-safe structure, and explicit stop conditions.
- Raised O from zero to four owned reader visuals while retaining its eleven
  existing source records.

### Reworked safe-place routing around confirmation and remaining reserve

- Replaced dense safe-place and communication graphics with shorter operational
  labels while preserving the full text routes and accessibility table.
- Added a six-field confirmation packet covering destination, availability,
  access, arrival instruction, backup, and escalation.
- Added a reserve-clock route for access, medication, power, caregiver, and
  transport failures without inventing generic runtime constants.
- Raised D from two to four owned reader visuals. O and D now cross the numeric
  standalone-candidate screen but remain master-guide routes pending equivalent
  standalone layout, accessibility, and real-user review.

### Strengthened release gates

- Expanded the illustration inventory to 29 current non-Vega figures plus three
  retained migration records and the total reader-facing visual set to 37.
- Added required-figure, fallback, provenance, owner-count, and O/D candidate
  assertions to the guide, illustration, and coverage validators.
- Rebuilt every master and B/C/H/P/T/R standalone edition without publishing,
  pushing, or deploying the prepared Pages package.

## 4.8.0 — 2026-07-27

### Rebuilt the project landing experience

- Replaced the compact inline landing document with a responsive project site
  built from local CSS, JavaScript, SVG, route metadata, and release registries.
- Added a high-contrast field-instrument interface with editorial typography,
  emergency separation, ten route cards, release metrics, evidence boundaries,
  participation guidance, dark/light/automatic themes, and mobile navigation.
- Added a complete download catalogue for master A4, A4/2, large-print, colour,
  monochrome, and six standalone route families.

### Added a deployment planner rather than another prose link

- Added a six-step local-only deployment checklist with progress, reset,
  clipboard summary, and browser-local persistence.
- Added format-selection, privacy-classification, physical mounting, maintenance,
  operator, local-preview, and GitHub Pages guidance in the UI.
- Kept sensitive facts out of the web form contract: only generic completion
  keys are stored, and the page explicitly rejects addresses, codes, medical
  details, and safe-place locations.

### Prepared an explicit Pages publication path

- Packaged landing, planner, downloads, guide, route hub, standalone families,
  PDFs, documentation, offline assets, 404 handling, web manifest, and release
  metadata under `build/site`.
- Added a dedicated GitHub Pages workflow that rebuilds and validates the entire
  project before uploading the static package; custom-domain output is generated
  only from the optional reviewed `PAGES_CUSTOM_DOMAIN` variable.
- Added structural and browser-level site gates, six desktop/mobile review
  captures, interaction tests, no-horizontal-overflow checks, and a zero-external-
  runtime-request contract.
- Kept workflow availability separate from deployment evidence: local build and
  release metadata continue to report publication and deployment as false.

## 4.7.0 — 2026-07-26

### Released Body and First Aid as a standalone family

- Detached C from its owned pain route in the mixed situations chapter plus the
  complete canonical first-aid chapter; no reader prose was copied into a
  parallel source file.
- Released A4, A4/2, and large-print color/monochrome C editions with local
  Sources and limits, graph handoffs, one emergency gate, tagged PDFs, and
  cross-edition semantic parity.
- Required seven local sources and five owned reader visuals for the C release
  slice, including CPR, AED, recovery-position, triage, and stroke-time models.

### Released Professional Support as a standalone family

- Added a six-field professional call packet, a four-layer support-system map,
  and a named-problem-to-service route selector.
- Kept every new visual redundant with complete adjacent prose or tables and
  registered exact operational source IDs, monochrome encodings, questions,
  review actions, and text fallbacks.
- Released A4, A4/2, and large-print color/monochrome P editions with five local
  operational sources and four owned reader visuals.

### Expanded the release matrix

- Expanded the standalone set from B/H/T/R to B/C/H/P/T/R and the tagged PDF
  matrix from 24 to 36 editions.
- Updated the graph hub, landing page, deployment documentation, coverage
  matrix, migration gates, illustration inventory, and complete build-matrix
  validator for the six-family release.
- Kept actual instructor/novice first-aid testing and real wet-room deployment
  testing as outstanding evidence rather than silently equating build success
  with field validation.

## 4.6.1 — 2026-07-26

### Added field-test forms

- Added an installation and wet-room audit for glare, reach, moisture, page
  turning, stability, privacy, supplies, and revision visibility.
- Added a calm-time route-drill log that records finding, routing, factual-card,
  backup, and handoff friction without using private crisis details.
- Added a first-aid figure review sheet for CPR, AED, recovery-position, and
  triage comprehension, including unintended inferences and monochrome/text
  fallback checks.
- Added a maintenance and replacement inspection with immediate triggers for
  stale routes, exposed private information, unreadable damage, or failed
  workflows.

### Added cross-guide provenance

- Added `src/data/coverage_matrix.json` and a generated Reference-edition report
  covering all ten nodes, owned sections, local sources by class, owned/shared
  visuals, source-basis coverage, standalone state, and candidate readiness.
- Added deterministic generator and validator commands and wired them into the
  full build, independent test command, and CI generated-file check.
- Expanded the stable reference registry from 303 to 308 active resources for
  the four new detachable forms and the new release-history section without
  reusing the retired key.

### Hardened deployment documentation

- Made the actual-room installation audit part of the minimum deployment gate.
- Added explicit route-drill and figure-review steps to the maintenance cycle.
- Kept field testing separate from certification: forms capture observations;
  they do not claim that usability testing has already happened.

## 4.6.0 — 2026-07-26

### Added the Blue Book template subguide

- Added **T — Templates: The Blue Book** as a canonical chapter and released
  standalone A4, A4/2, and large-print color/monochrome family.
- Added detachable deployment, location, emergency-call, local-contact,
  comfort, five-minute-values, observation, safe-place, care-continuity,
  household, feedback, remarks, and quiet-activity sheets.
- Clarified responsibilities: authors maintain generic truth; deployers verify
  and maintain local facts; readers choose useful resources; helpers support
  without silently taking over agency.
- Resolved comfort-inventory ownership by separating deployer preparation from
  reader choice.
- Added explicit privacy classes so customization does not publish medical,
  credential, hidden-key, shelter, or violence-safety information by accident.
- Added the field-feedback route `bathroom_emergency@fkr.dev` and a restrained
  Badger box explaining that forms are handles rather than obedience tests.

### Added stable global references and a complete Reference edition

- Expanded the graph from nine to ten identities by adding T with a redundant
  code, blue blueprint-corners pattern, glyph, color, title, and reciprocal
  handoffs.
- Added stable typed public addresses such as `[BEG:T:F:003]` and matching HTML
  anchors; hierarchical/page numbers remain non-canonical navigation aids.
- Added append-only ID allocation with retired-key preservation so insertions
  do not silently rename later resources and removed IDs cannot be recycled for
  a different meaning.
- Added machine-readable indexes for sections, forms, diagrams, contacts,
  deployment fields, and glossary terms.
- Released **R — Reference and Appendix** as a standalone family containing the
  generated global index, diagram/figure index, professional contact index,
  deployment customization index, glossary, source notes, and version history.
- Added validators for ID format, uniqueness, stability, active/retired
  separation, generated-fragment freshness, and six-kind coverage.

### Added deployment and project-facing documentation

- Added `DEPLOYMENT.md` with role boundaries, minimum installation gate,
  customizable-field index, safe-destination tests, privacy guidance, mounting
  concepts, additional physical supplies, source-build instructions,
  maintenance cadence, feedback, and upstream participation.
- Added machine-readable `forms.json`, `deployment_fields.json`, and
  `glossary.json` registries.
- Added a generated landing package with purpose, design ideas, feedback and
  participation, deployment summary, build instructions, sources,
  disclaimers, domain roles, and links to the complete HTML guide and graph hub.
- Packaged README, deployment instructions, and changelog beside the landing
  page so the artifact remains useful outside a repository checkout.
- Documented `bathroom-emergency.fkr.dev` as the intended project landing
  domain and `be.fkr.dev` as the intended enhanced guide/download domain without
  falsely claiming either was deployed.

### Hardened first-aid explanations and orientation

- Reworked the first-aid first-minute diagram so **Call 112** is a distinct
  action box rather than one instruction bundled with later tasks.
- Added mini-whys for scene safety, response, speakerphone, breathing, direct
  pressure, wound cleaning, shock support, cooling, fracture support, and
  spine/neck/pelvic immobility.
- Wrote out **cardiopulmonary resuscitation (CPR)** and **automated external
  defibrillator (AED)** and removed the inaccurate “reboot” metaphor.
- Added adult chest-location, AED-action, and recovery-position orientation
  diagrams with complete nearby text routes and monochrome encodings.
- Explained why rescuers switch, what 30 compressions and two breaths support,
  why an AED shocks only selected rhythms, and why the recovery position keeps
  the airway open and allows drainage.
- Clarified that effective coughing is useful airway clearance and deliberately
  declined to ship unreviewed self-thrust/furniture choking manoeuvres.
- Linked vital-sign observation to the detachable Blue Book log while retaining
  the rule that reassuring devices do not clear emergency red flags.
- Added an operational comparison of 112 and 116 117, including their distinct
  purposes and infrastructures.

### Improved navigation, voice, and page identity

- Added a ten-guide picker explaining which node to choose and preserving the
  invariant: one guide, one action, one reassessment.
- Added mini contents to released standalone editions and stable heading
  anchors to the master and standalone HTML.
- Strengthened selected high-value sentences without turning every paragraph
  into typographic shouting.
- Added heading accents, subguide-specific patterns in the complete guide, and
  revision furniture carrying project/subguide version, layout, mode, commit,
  build date, and `be.fkr.dev`.
- Rasterized the visible print revision strip while retaining equivalent HTML
  metadata and manifest provenance, preventing repeated footer text from being
  injected between wrapped headings in tagged-PDF reading order.
- Preserved one-column print, color/monochrome information parity, and text
  fallbacks for every new figure.

### Completed build, CI, and release provenance

- Added shared package-derived release metadata and deterministic
  `SOURCE_DATE_EPOCH` / `GUIDE_REVISION` handling.
- Added a release manifest with toolchain information, artifact sizes and
  SHA-256 hashes, and explicit false publish/deploy flags.
- Expanded the build to six master HTML/PDF editions, Markdown, DOCX, LaTeX,
  graph hub, 24 B/H/T/R standalone editions, landing package, generated
  indexes, and release manifest.
- Added build-matrix and landing/deployment validators.
- Added GitHub Actions CI that installs the locked document/browser toolchain,
  builds and independently validates the complete matrix, verifies generated
  registries, and uploads release artifacts without deploying them.
- Added a detailed 4.6 release architecture record and updated README, roadmap,
  in-guide history, and changelog contracts.

## 4.5.0 — 2026-07-26

### Shipped the first graph-oriented subguide family

- Froze nine reciprocal graph nodes with distinct code, title, colour, pattern,
  and glyph identities generated from one manifest.
- Added a responsive graph hub with an orientation overview, nine identity-rich
  route cards, and direct links to the released B and H vertical slices.
- Added local position maps, version/source metadata, handoffs, and generated
  source-complete end matter without duplicating canonical chapter prose.
- Built B and H in A4, 105 × 297 mm A4/2, and A4 large-print layouts, each in
  color and monochrome: 12 tagged PDFs with semantic text, page-count, geometry,
  and hash validation.
- Fixed the shared screen shell so a document without a generated contents rail
  uses the full reading measure and hides the inactive Contents control.

### Extended the scientific and operational visual set

- B now has four canonical visuals, adding a four-channel alarm decomposition and
  a clearly labelled conceptual load/headroom model alongside the breathwork
  mechanism and study-design figures.
- H now has four operational visuals, adding source-location routing and a
  five-field dispatcher/poison-centre handoff card.
- Added text-complete fallbacks, non-colour encodings, source ownership, and
  review metadata for every new visual.
- Generated identity and grouping contact sheets and selected the quieter
  nine-node grouping over a noisier split-route prototype.

### Canonicalized source and migration contracts

- Promoted the 52-footnote/75-source-note inventory to the canonical source
  registry view used by local B/H Sources and limits.
- Added exact section/figure ownership, reciprocal-edge, pattern, print-layout,
  source-parity, semantic-text, PDF-tagging, and reproducible-hash gates.

### Adapted the alternate modular specification

- Reviewed `src-alt/expansion-design.md` as an implementation proposal rather
  than a source of trusted claims.
- Accepted a manifest-driven graph, redundant code/pattern/glyph identity,
  staged standalone outputs, generated local sources, and offline visual builds.
- Deferred immediate source-tree relocation, ten simultaneous output families,
  duplicated source files, mascot requirements, and unsourced new medical or
  disaster modules.
- Added a detailed feasibility record and a gated 4.5 roadmap with measurable
  entry and exit criteria.

### Began the Vega-Lite visual evidence layer

- Added an offline Vega/Vega-Lite toolchain, canonical visualization catalog,
  deterministic derived datasets, SVG and PNG rendering, and validation.
- Added eight Vega-Lite figures: GAD-7 accuracy, household water stock,
  social-connection associations, communication-channel growth, continuity
  dependency structure, stroke urgency model, sleep-study design, and
  reproductive-health denominators.
- Replaced three matplotlib evidence figures with Vega-Lite equivalents and
  added two new reader-facing charts with complete prose/table fallbacks.
- Added a shared chart theme and removed duplicated title/theme blocks from
  individual specifications.
- Made the document own chart captions, takeaways, and practical limits through
  catalog macros, while Vega-Lite owns marks, scales, labels, and encodings.
- Embedded accessible title and description metadata in canonical SVG output.
- Introduced a quieter editorial layout for quantitative figures, distinct from
  the stronger card treatment used by route maps and operational illustrations.
- Added `docs/plans/visual-design-system.md` with renderer-selection, chart,
  illustration, typography, page-composition, and QA rules.
- Added `src/data/illustration_catalog.json` and validation for the seventeen
  current reader-facing non-Vega figures, creating a concrete redesign queue
  after six quantitative charts migrated away from matplotlib.
- Constrained quantitative axes to two through eight intentional major ticks
  and added automated minimum chart-label-size and contrast checks.

### Began graph-subguide implementation

- Added a validated nine-node prototype subguide manifest without moving the
  canonical chapter files, plus generated ownership inventories for 186
  level-1/2 sections and 28 current or migrated figure records.
- Added the canonical source-registry view covering 52 chapter footnotes and 75
  global source-note sections with no unresolved references.
- Built standalone B and H vertical slices with one emergency gate, canonical
  section extraction, handoffs, and generated local Sources and limits; final
  A4 color/mono editions render at 17 and 12 pages respectively.
- Added generated B/H Sources and limits sections to the master guide while
  retaining the global source chapter during parity review.

## 4.4.1 — 2026-07-22

### Synthesized canonical and alternate source trees

- Kept the 4.3.1 Small-Room Observatory, safety routing, evidence limits,
  accessibility, source freshness, and six-edition print architecture.
- Reviewed the untracked `src-alt/` tree section by section and accepted only
  compatible continuity, ownership, handoff, and human-factors material.
- Documented accepted, rejected, and deferred alternate material in
  `docs/plans/4.4.1-common-synthesis.md`.

### Added structured household continuity

- Added `src/data/continuity_catalog.json` with eight household systems and five
  first-meeting coordination roles.
- Added generated household-continuity and first-meeting-role figures.
- Added continuity validation for system ownership, dependencies, source IDs,
  text equivalents, figures, and denied alternate-source claims.
- Expanded the outage guide with a continuity board, capability inventory,
  named roles, task ownership, review times, backups, and dissent routes.

### Integrated compatible voice and access improvements

- Added pattern-versus-episode framing to anxiety and a working-memory-oriented
  overload reboot.
- Added non-stigmatizing language for loss of shelter and inaccessible
  destinations, plus a calm-time local preparation note.
- Clarified that an emergency hazard call needs useful fields, not polished
  prose.

## 4.3.1 — 2026-07-22

### Navigation and release hygiene

- Corrected the mixed-situations label from B–G to B–F now that Situation G is
  a dedicated subguide, while retaining an explicit handoff to it.
- Restored executable modes for command-line validators and added a regression
  check for script permissions.
- Replaced the remaining validator phrase “v3.3 breadth markers” with
  reader-oriented “subject-breadth markers.”
- Updated the standalone HTML cover language to match the curiosity-first
  opening instead of the retired routing slogan.
- Added a tracked 4.3.1 polish plan with bounded patch acceptance criteria.

### Completed density and future-architecture review

- Reviewed the seven sparsest standard-A4 pages and retained each as functional
  writable space, safety buffer, chapter opener, graph handoff, or reference
  boundary; documented the decisions in
  `docs/qa/4.3.1-sparse-page-review.md`.
- Shortened one crowded B–F pain-escalation label while preserving the 88/87/139
  page-count envelope across A4, A4/2, and large print.
- Expanded the 4.5 architecture from a fixed nine-guide list into a nine-node
  core plus candidate satellite modules for small-room physics, decision
  science, sensors, sleep, medicines, sanitation, human factors, mutual aid,
  evidence literacy, locality, and field experiments.
- Added `docs/plans/visualization-program.md`, targeting approximately 48–60
  reviewed visuals with question-first chart design, reproducible data/specs,
  uncertainty, accessible text equivalents, pattern/shape redundancy, and
  renderer QA.
- Added `docs/plans/subguide-source-localization.md`, specifying filtered
  **Sources and limits** at the end of every subguide while citations remain
  beside claims and one canonical registry generates local and global views.

## 4.3.0 — 2026-07-22

### Rebuilt the reader-facing opening

- Replaced the former routing and release-architecture preamble with a dense
  small-room observatory covering interoception, gut–brain motor effects,
  bathroom acoustics, anxiety and time perception, acute-stress working-memory
  effects, affect labeling, cold-face physiology, situational syncope, olfactory
  habituation, and a three-minute observation experiment.
- Reduced the opening to one compact actual-emergency gate, including another
  person, first aid, speakerphone, safe door access, and the appropriate German
  emergency route.
- Moved notation, topology, flowchart legends, evidence instructions, and the
  complete decision tree into the appendix.
- Removed release history, “restoration,” and implementation narration from the
  reader-facing chapters.
- Reduced standard and A4/2 typography, tightened spacing, protected card and
  table wrapping, and added automated overflow checks across all editions.

### Extended the curiosity-first rewrite

- Reframed responsibility around four clocks—live harm, continuing effects,
  repair, and ongoing care—rather than opening with repeated emergency prose.
- Reworked the mixed-situations chapter around six distinct forms of “too
  much”: alarm, pain, threat, overload, smell, and loss of place.
- Added subject-first models for pain geometry, the three clocks of threat,
  overload as a queueing failure, and smell as vivid but poorly calibrated
  evidence.
- Rewrote the Calm, First Aid, Outage, and Professional Support openings around
  bandwidth, biological time management, infrastructure dependencies, and
  specialized service interfaces.
- Expanded validation so release archaeology and chapter-description filler
  cannot return to reader-facing chapters unnoticed.

### Increased information density without shrinking body type

- Reduced print margins, paragraph rhythm, heading gaps, card padding, figure
  bands, table spacing, and footnote spacing while preserving the 9.3 pt A4,
  8.35 pt A4/2, and 13.25 pt large-print body sizes.
- Allowed suitable explanatory cards to continue across pages instead of
  forcing large blank regions; safety-critical boxes remain indivisible.
- Compacted the local-contact worksheet into paired columns and removed blank
  shared-master notes sheets that belong more naturally in optional inserts.
- Reduced the rendered master from 101 to 88 A4 pages, the field strip from 98
  to 87 pages, and large print from 156 to 139 pages.
- Added standard-A4 renderer checks for blank pages, physical-edge contact,
  extreme packing, color/mono text parity, sparse/dense review pages, and
  contact-sheet generation.

### Specified graph-oriented subguide editions

- Added `docs/plans/4.5.0-graph-subguide-architecture.md` as the tracked design
  specification for a family of graph-linked standalone guides.
- Proposed nine subguide identities with redundant code, pattern, glyph, title,
  and colour channels so meaning never depends on colour alone.
- Defined cover, graph-position/version page, introduction/contents page,
  content-page furniture, and final handoff-page grammar.
- Distinguished master and standalone behaviour so the master keeps one global
  emergency gate while each detached subguide remains independently usable.
- Added phased data, pattern, graph, renderer, editorial, and acceptance tasks
  to the roadmap without prematurely duplicating canonical chapter prose.

### Split “no safe place” into real routes

- Added a dedicated **Situation G** chapter separating active violence, no roof
  tonight, inaccessible or medically unusable accommodation, and social or
  internal crisis.
- Added action, backup, escalation, destination, service keys, and reviewed
  sources for all four routes instead of sending every case to a generic list.
- Kept municipal emergency accommodation, accessible shelter, youth emergency,
  transport, and powered destinations visibly local rather than inventing a
  national directory that does not exist.

### Added communication and accessibility foundations

- Added six structured access profiles for vision, hearing, speech/language,
  cognitive load, mobility/fatigue/pain, and sensory/panic/neurodivergent needs.
- Added a minimal written emergency card, channel-specific handoffs, accessible
  service metadata, and two data-driven route/access visualizations.
- Added current de-DE routes for 115, 116 016, 116 111, the violence-against-men
  helpline, TelefonSeelsorge, and the nationwide women’s refuge search, with
  scope and availability limits kept attached.

### Added source freshness and large print

- Added per-source review windows plus deterministic `GUIDE_AS_OF` validation,
  including warning and hard-failure states for stale operational sources.
- Added color and monochrome A4 large-print editions with 13.25 pt root print
  type, single-column route cards, larger emergency numbers, and bounded tables,
  formulas, code, and figures.
- Added accessibility validation for image alternatives, heading order, blank
  pages, A4 geometry, tagging, page growth, required route markers, and
  color/monochrome text parity.

## 4.2.0 — 2026-07-22

### Added a real environmental-hazard branch

- Added **Situation H** for fire, smoke, carbon monoxide, gas release, chemical
  exposure, electrical danger, outdoor warning instructions, and safe handoff.
- Changed the main guide from seven to eight entry doors and implemented the
  planned two-pass architecture: danger overrides first, need-based routing
  second, dependency modifiers after the route.
- Made the existing smell branch explicitly post-override so drain and mould
  troubleshooting cannot sit above fire, gas, electricity, or fumes.

### Strengthened continuity guidance

- Added an essential-medication and powered-device failure route with action,
  approved backup, early escalation, powered destination, and handoff fields.
- Added dependency modifiers for children, pregnancy/postpartum, mobility and
  sensory access, medication, powered devices, animals, language, being alone,
  and transport.

### Added structured foundations and visualizations

- Added `src/data/route_catalog.json` as the canonical action/backup/escalation/
  destination registry and `src/data/locales/de-DE.json` for reviewed German
  services, poison centres, warning channels, and local fields.
- Added data-driven two-pass routing, environmental-hazard, and essential-care
  continuity diagrams.
- Added route and locale validation covering graph destinations, source IDs,
  unsafe wording regressions, official service numbers, all seven German poison
  centres, chapter coverage, and generated figures.

## 4.1.2 — 2026-07-22

### Added the A4/2 field-strip edition

- Added color and monochrome **105 × 297 mm** outputs, equivalent to cutting an
  A4 sheet lengthwise into two tall one-column pages.
- Added a dedicated narrow-layout stylesheet instead of shrinking the A4 design.
- Reworked headings, emergency-number blocks, figures, tables, formulas,
  footnotes, code blocks, and cover proportions for the narrow page.
- Added curiosity-oriented “FIELD NOTE” and “LOOK CLOSER” visual labels while
  keeping emergency actions visually dominant.

### Verified the rendered result

- Added renderer-based checks for exact page geometry, tagging, missing or blank
  pages, physical-edge collisions, required content markers, and representative
  contact sheets.
- Made the full build produce and validate standard A4 plus A4/2 color and
  monochrome editions from the same canonical chapters.

### Prepared 4.2.0

- Added a two-track content plan: an **improvement track** for clearer existing
  routes and a distinct **extension track** for new environmental-hazard,
  dependency, and “no safe place” branches.
- Converted the broad roadmap into reviewable content packets with acceptance
  criteria, source requirements, and flowgraph effects.

## 4.1.1 — 2026-07-22

### Restored carefully

- Reintroduced useful quantitative context removed with the unsafe v3.3 claims,
  but only with named evidence class, denominator, scope, source, uncertainty,
  and practical limit.
- Added bounded findings on GAD-7 diagnostic accuracy, a 28-day breathwork
  trial, lifetime infertility prevalence, postpartum-psychosis incidence,
  stroke urgency modelling, household water planning, repeated sleep
  restriction, and social-connection associations.
- Kept emergency protocols dominant over every screen, estimate, association,
  and model.

### Visualized

- Added eight reproducible evidence diagrams: evidence labels, GAD-7 validation,
  breathwork design, reproductive-health denominators, stroke time model,
  household water planner, sleep-restriction design, and social-connection odds.
- Added `src/data/evidence_facts.json` as the reviewable source of plotted values
  and figure caveats.
- Replaced the legacy monolithic diagram generator; deprecated fictional or
  unsafe charts are removed during the canonical build.

### Extended

- Expanded scientific notation with a bounded stroke model and odds-ratio
  definition.
- Added `ROADMAP.md` covering main-flowgraph hazard gates, vulnerability
  modifiers, chapter extensions, locale/accessibility work, evidence candidates,
  and release sequencing through 4.4.1.
- Updated source policy, annotated bibliography, appendix diagram index, and
  release validation expectations.

## 4.0.1 — 2026-07-22

### Restored

- Brought the canonical v4 guide to full subject-matter parity with the
  extensive v3.3 edition while retaining v4's safer red-flag-first routing.
- Restored detailed navigation, responsibility and life-form branches, anxiety
  and pain context, comfort and exit scripts, first-aid reference material,
  disaster preparedness, group governance, professional support, legal and
  social navigation, fillable worksheets, complete text routing, and notes.
- Expanded the annotated source chapter across every major v3.3 topic area.

### Rewritten

- Reworked the restored material in the established concise, humane, mildly
  suspicious-of-nonsense voice.
- Separated urgent “do now” instructions from deeper “understand later”
  material so the long edition remains usable under stress.

### Kept safe

- Did not restore match flames, generic bleach dosing, unsafe foraging,
  fictional cortisol decay, pain/vital-sign self-clearance, tactical violence,
  deterministic attachment or development claims, therapy outcome promises,
  or personal survival percentages.
- Updated burns, fractures, hypothermia, postpartum support, legal aid, and BBK
  preparedness references against current authoritative material.

### Verified

- Added content-parity regression markers, source-volume checks, and dynamic
  revision validation tied to the package version.
- Rebuilt and validated the complete color and monochrome document pipeline.
- Removed the redundant blank page between the full-page cover and Chapter 1.

## 4.0.0 — 2026-07-17

### Rebuilt

- Unified cover, chapters, navigation, screen UI, and print output in one
  semantic document pipeline.
- Replaced remote MathJax and timed browser waits with Pandoc-native MathML.
- Added a responsive contents rail, mobile drawer, theme toggle, reading
  progress, print control, and a restrained bathroom-tile visual system.
- Enforced A4 single-column printing for both color and monochrome editions.
- Added Chrome and WeasyPrint PDF paths that consume the same HTML.
- Added build validation for structure, known safety regressions, MathML,
  image references, A4 geometry, and plausible page count.

### Reoriented

- Replaced the old broad fan-out with a portrait red-flag-first flowgraph.
- Added a four-route overview and explicit act/check/escalate loop.
- Established the red-flag dominance invariant: scoring and formulas cannot
  cancel emergency routing.

### Corrected

- Medical and unexpected-birth emergencies now route to 112, not police 110.
- Removed match-based smell advice, concentration-free bleach dosing, unsafe
  emergency foraging, pain “physiological correlates,” and a fictional
  cortisol-decay curve.
- Reframed GAD-7 and numerical pain scores as screening/communication tools.
- Updated CPR, bleeding, burns, stroke, anaphylaxis, poisoning, crisis,
  violence, pregnancy, water, outage, and caregiver guidance.
- Reworked every formula as a protocol, exact relation, conceptual model, or
  mnemonic and documented its limit.

### Sourced

- Updated to ERC Guidelines 2025 and the current 2025 BBK preparedness guide.
- Verified German 112, 110, 116 117, 116 123, 116 016, and 116 111 routes.
- Added direct authoritative and primary references with claim-specific notes.

## 3.4.0 — 2026-06-10

Experimental multi-backend PDF and two-column layout work.

## 3.2.0 — 2026-05-03

Scientific-diagram and formula expansion.

## 3.0.0 — 2026-05-01

Modular content and source chapter.

## 2.0.0 — 2026-04-29

Pixel assets and themed output.

## 1.0.0 — 2026-04-29

Initial guide.
