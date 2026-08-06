# Bathroom Emergency Guide — Divergence Review and Integration Plan

**Review date:** 2026-08-06
**Scope:** read-only investigation of both sibling repositories; this document is the only file added to the shared base directory.
**Repositories reviewed:**

- `bathroom-emergency-guide-4.x-alt/`
  - branch: `rescue/bathroom-guide-alt-20260806`
  - reviewed HEAD: `e19763de3047aa2d83cb9c032f8abea9835ff4b2`
  - reader-facing revision family: `4.0.0-alt`
  - working tree during review: clean
- `bathroom-emergency-guide/`
  - branch: `main`
  - reviewed HEAD: `42eb11490941f3c367da4644aa2c0c69375ab8f7`
  - release: `4.13.1`
  - working tree before and after review: 14 pre-existing unstaged deletions under tracked `src-alt/`; no main-repository files were changed by this review

The two Git object databases do not know one another's current HEAD commits. They are independent histories, not two branches with a usable merge base, so integration cannot be a normal Git merge. There is nevertheless direct content provenance: main HEAD contains a tracked `src-alt/` snapshot, currently deleted in the working tree, from which much of the sibling alternate repository was modularized and extended.

---

## 1. Executive conclusion

The repositories are not competing implementations of equal maturity.

- **`bathroom-emergency-guide/` is the correct technical, safety, data, accessibility, and release chassis.** It has the stronger route model, source provenance, stable references, standalone encapsulation, forms system, visualization catalog, output matrix, CI/release machinery, and validation suite.
- **`bathroom-emergency-guide-4.x-alt/` is the stronger editorial and product-design source.** It is often warmer, stranger, more memorable, more visibly modular, and more willing to let the bathroom premise become a real narrative and visual identity rather than merely a delivery context.
- **The main repository has already performed a first synthesis of the alternate line.** Its `4.4.1` and `4.4.2` planning records explicitly imported selected continuity, ownership, voice, hub, pattern, and booklet ideas while rejecting duplicated bibliographies, repeated emergency gates, unsupported survival guidance, premature subject expansion, and immediate source-tree upheaval.
- **The next integration should not repeat that first synthesis.** It should identify what remains editorially valuable in the alternate line, import it through the main line's registries and review gates, and preserve the alternate repository as provenance.

### Recommended merge policy

> **Main is canonical. Alt is a reviewed source library. Import concepts, passages, and visual motifs through explicit crosswalk records; do not overlay directories, merge unrelated histories, or copy whole chapters.**

The target is not “main with alt pasted on top.” It is a later main-line release whose:

1. safety and provenance remain at least as strong as `4.13.1`;
2. voice is recognizably closer to `4.x-alt` in non-urgent passages;
3. visual identity becomes more expressive without sacrificing code/pattern/glyph redundancy;
4. content remains generated from one canonical source and route system;
5. alternate-only topics graduate only after source, scope, route, and depiction review.

---

## 2. Repository snapshots

Counts below exclude `.git`, dependency caches, and generated dependency directories unless stated otherwise. They describe the reviewed workspaces, not immutable release statistics.

| Dimension | `4.x-alt` | Main `4.13.1` | Interpretation |
|---|---:|---:|---|
| Non-generated files inspected | 112 | 138 | Similar source-tree scale, radically different composition |
| Markdown files | 61 | 37 | Alt physically splits booklets, source pages, version pages, and design records |
| Python files | 17 | 37 | Main contains much more build, derivation, indexing, and validation machinery |
| Structured data files | 3 | 48 | The largest architectural difference |
| Approx. Markdown words | 55,021 | 57,999 | Neither repository is merely a sketch; both contain substantial prose |
| Markdown headings | 642 | 894 | Main is denser and more explicitly structured within canonical chapters |
| Current figure/diagram files in build tree | 34 PNG | 93 diagram files, including PNG/SVG | Main has broader renderer and provenance coverage |
| Existing build-tree files | 262 | 693 | Main produces a much larger release and site matrix |
| Primary test shape | 25 pytest tests | 15 Python validators plus browser/layout checks | Alt tests construction; main tests publication contracts |
| Test result on review date | 25 passed | full `npm test` passed | Both are internally healthy at reviewed HEAD |
| Working-tree status | clean | 14 pre-existing deleted tracked `src-alt/` files | Start integration in a fresh worktree or resolve this deletion separately |

### Build and test observations

The alternate test suite verifies:

- manifest completeness;
- chapter/source assembly;
- emergency-gate inclusion;
- combined and standalone Markdown builds;
- pattern distinction;
- mascot generation;
- palette integrity;
- hub diagram generation.

The main test suite verifies materially more:

- pass-1 emergency overrides and pass-2 routes;
- continuity systems and ownership;
- 335 stable active public references;
- graph-node coverage and reciprocal identities;
- render tooling and local fonts;
- eight offline Vega-Lite figures with source, limits, fallbacks, contrast, and non-colour encodings;
- illustration inventory and migration state;
- standalone encapsulation and 60 tagged standalone PDF editions;
- chapter, fact, route, form, accessibility, MathML, and output completeness;
- PDF density and text parity;
- six accessibility profiles;
- browser overflow, responsive site behaviour, offline assets, planner persistence, and download filters;
- six master editions, editable formats, release manifest, and the full standalone build matrix.

This gap is decisive: the alternate line can contribute product quality, but it must enter through the main line's validation perimeter.

---

## 3. What is genuinely shared

Despite separate Git histories and almost no identical current paths, the repositories have direct textual lineage as well as a shared conceptual guide.

### Tracked `src-alt/` provenance inside main

Main HEAD tracks fourteen alternate-input files under `src-alt/`; all fourteen were already deleted from the reviewed working tree. A blob comparison against the sibling alternate repository establishes that the sibling is an evolved modularization of this snapshot, not an unrelated rewrite:

| Main HEAD provenance file | Sibling alternate counterpart | Relationship |
|---|---|---|
| `src-alt/expansion-design.md` | `docs/specs/2026-07-22-v4alt-modular-visual-expansion-design.md` | byte-identical |
| `03h-environmental-hazards.md` | Safety environmental chapter | byte-identical |
| `06-zombie-guide.md` | Zombie chapter | byte-identical |
| `07-professional-support.md` | Support chapter | byte-identical |
| `08-appendix.md` | Appendix chapter | byte-identical |
| Situation A, B/E, and safe-place chapters | corresponding modular chapters | effectively identical apart from tiny wrapper/newline changes |
| Calm and Self Ambulance | corresponding modular chapters | substantially extended in sibling alt |
| cover | hub cover | lightly revised |
| original how-to-use | hub map | structurally replaced during modularization |
| expansion design | modular design spec | preserved exactly |

This explains why the main line could perform its first synthesis without sharing Git history with the sibling repository. It also changes the housekeeping recommendation: do not casually restore, delete, or recommit `src-alt/` while performing the editorial merge. First preserve the sibling repository, decide whether the tracked snapshot remains useful as in-tree provenance, and resolve those fourteen deletions in a separate, explicit change.

### Shared product assumptions

Both treat the guide as:

- a print-first, offline-capable decision aid;
- a mixture of emergency routing, body observation, anxiety management, first aid, responsibility, safe-place access, professional support, infrastructure failure, and intentionally absurd edge cases;
- a Markdown-to-HTML/PDF publication system using Python, Pandoc, CSS, and Playwright/Chromium;
- a family of independently useful guide regions rather than one linear essay;
- a document whose humour must coexist with actual emergency information;
- a visual work with generated diagrams, not only formatted prose.

### Shared chapter ancestry

A five-token-shingle comparison found the following strongest correspondences. Scores are only a rough measure of retained phrasing and sequence; they are useful for locating ancestry, not judging quality.

| Alternate source | Main counterpart | Similarity |
|---|---|---:|
| `ambulance/01-first-response.md` | `05-self-ambulance.md` | 0.485 |
| `responsibility/01-situation-a.md` | `02-situation-a.md` | 0.407 |
| `calm/00-situations-b-e.md` | `03-situations-b-g.md` | 0.337 |
| `calm/01-calm-guide.md` | `04-calm-guide.md` | 0.181 |
| `safety/01-no-safe-place.md` | `03g-safe-place-routing.md` | 0.774 |
| `safety/02-environmental.md` | `03h-environmental-hazards.md` | 0.852 |
| `zombie/01-zombie-guide.md` | `06-zombie-guide.md` | 0.454 |
| `support/01-professional.md` | `07-professional-support.md` | 0.655 |
| `appendix/01-reference.md` | `08-appendix.md` | 0.320 |

The high safety/environment/support scores show that much of the alternate wording is already present in the main line. The lower Calm, Responsibility, and Zombie scores identify the areas where later editorial and evidential revisions changed the experience most.

### Shared source base

The alternate Markdown contains 92 resolved citation keys and 128 distinct URLs. The main Markdown contains 54 referenced keys, 55 definitions, and 77 distinct URLs; its broader generated registries contain substantially more machine-readable provenance than the Markdown count suggests. Across all inspected text/data files, 59 URLs appear in both repositories.

The alternate line therefore does contain research worth auditing. It does **not** follow that its 69 alt-only URLs should be bulk-imported. Some support abandoned claims, some are superseded, some are malformed/truncated in text extraction, and some are foreign operational guidance that may not fit the Germany edition.

---

## 4. The first synthesis has already happened

The main repository's own records are crucial because they prevent an accidental regression disguised as reconciliation.

### What `4.4.1` already accepted from the alternate line

The released common synthesis records acceptance of:

- named owners and backups instead of anonymous tasks;
- first-meeting roles, short briefings, task ownership, and review times;
- continuity expressed as functions such as information, air, care/power, water, shelter, sanitation, and access;
- practical language around uncertainty, dissent, confidence, and competence;
- destigmatizing safe-place wording;
- selected voice improvements;
- the hub/booklet idea where compatible with the graph architecture.

These ideas are visible in the main Zombie/continuity material and its registries.

### What `4.4.1` and `4.4.2` deliberately rejected or deferred

The records explicitly rejected or deferred:

- duplicated, manually maintained source files per subguide;
- repeated emergency gates throughout the master volume;
- unsupported survival claims and improvised techniques;
- immediate reorganization of canonical chapter files;
- ten equally loud colour-named entry books;
- mascots as a release dependency;
- one rendering tool forced onto every visual type;
- immediate release of Body, Social, and Natural Disaster books before route/source ownership review.

The current review agrees with those decisions. The merge plan should build on them, not reopen them without new evidence.

---

## 5. Layer-by-layer comparison and merge decision

## 5.1 Product topology and navigation

### Alternate strengths

- The **hub triptych** is easy to understand as a product: orientation, map, directory.
- Booklets have immediately legible names, colours, patterns, mascots, taglines, and covers.
- The physical source tree mirrors the reader's mental model.
- “Start with the booklet that matches the situation” is accessible product language.

### Main strengths

- The guide is modeled as a **graph**, not a shelf of equal pamphlets.
- Stable route codes `O/A/B/C/D/H/Z/P/T/R` survive title and layout changes.
- Incoming/outgoing edges, aliases, questions, scope, outside-scope, local maps, handoffs, and standalone contracts are explicit.
- Core routes remain visible without letting optional topics become eleven competing emergency doors.
- The master and standalone forms have different emergency-gate behaviour for good reasons.

### Merge decision

Keep the main graph and stable codes as canonical. Import the alternate hub's **clarity and theatre**, not its identity model.

Recommended presentation:

- code and operational title remain primary;
- a warmer “book” title may appear as a display alias or cover subtitle;
- colour remains supplementary;
- pattern, glyph, code, and written title remain redundant identifiers;
- optional satellites appear as a second layer, not peers in the emergency entry graph.

Example:

> **B — Alarm and Calm**
> *The Teal Book for when the alarm system has seized the control room*

The exact display wording should be reviewed; the important point is that “Teal Book” may enrich the surface without replacing `B` or destabilizing references.

## 5.2 Source-tree structure

### Alternate strengths

- `src/hub/` and `src/subguides/<name>/chapters/` are discoverable.
- Sources, version notes, chapters, styles, and themes sit close to their booklet.
- A developer can understand the intended product from the directory tree alone.

### Main strengths

- Canonical prose remains single-copy in `src/chapters/`.
- `subguides.json` composes graph regions without duplicating chapters.
- Stable references and generated indexes allow content to move or appear in several outputs.
- Shared source and figure ownership are expressed in registries.
- The existing tree supports master, standalone, site, editable, large-print, A4/2, colour, and mono forms without maintaining parallel prose.

### Merge decision

Do **not** reorganize the main source tree as an early merge step. Physical neatness is not worth destabilizing stable IDs, citations, figure ownership, or 60 standalone editions.

Use a two-stage structure improvement:

1. **Manifest-first:** add an explicit alt-to-main crosswalk and, where needed, editorial metadata around existing canonical chapters.
2. **Block migration later:** only after stable references and parity tests can prove that a physical move changes no public identity or output meaning.

A future content-block structure may be reasonable, but wrappers must reference canonical blocks rather than copy prose:

```text
src/content/<owner>/<stable-resource-key>.md
src/data/content_index.json
src/data/subguides.json
src/data/source_registry.json
src/data/figure_inventory.json
```

That is a later refactor, not the merge mechanism.

## 5.3 Build setup and dependency management

### Alternate strengths

- Compact and easy to follow.
- Per-subguide scripts are direct and readable.
- The build produces a broad matrix of standalone themed outputs.
- Pattern, mascot, and hub generation are first-class tasks.

### Main strengths

- One release pipeline rebuilds diagrams, inventories, references, coverage, master editions, standalone families, site, and release manifest.
- `package-lock.json`, CI, Pages deployment, deterministic metadata, and offline chart rendering are integrated.
- Output contracts are validated instead of inferred.
- Tool requirements and fallbacks are documented.

### Merge decision

Keep npm and the main lockfile/build pipeline canonical. Do not import the alternate `pnpm-lock.yaml` or create dual package-manager authority.

Recommended setup improvements during integration:

- retain main `package.json` scripts and validator chain;
- import an alternate generator only after it is registered in the main diagram/asset catalogs;
- add a Python environment declaration if not already present in a later setup task (`pyproject.toml` or a locked requirements workflow), because Python packages are currently part of the reproducible toolchain but less explicitly locked than Node dependencies;
- add a fast `test:integration-slice` for editorial/design pilots while preserving full `npm test` as the release gate;
- keep generated outputs ignored and reproducible.

## 5.4 Writing voice

### Alternate strengths

The alternate line is best when it does four things simultaneously:

1. speaks directly to the reader;
2. notices the absurd specificity of being in a bathroom;
3. converts shame or panic into a smaller technical problem;
4. gives the reader a line memorable enough to survive stress.

Representative strengths include:

- “You're in a bathroom. That's already a good start.”
- “Your brain is a body part. You are maintaining it.”
- “Guilt wants a trial, but emergencies need a sequence.”
- “ordinary rumour wearing tactical trousers”
- stacked-reasons-wearing-a-trench-coat imagery in the Social guide.

The line often feels authored rather than assembled.

### Main strengths

The main line is more disciplined about:

- uncertainty;
- false reassurance;
- denominator and scope;
- agency and consent;
- separating observation, interpretation, action, and escalation;
- keeping jokes out of the interval between a red flag and its action.

It still contains a strong voice—“the mirror ... is not currently required to have an opinion,” “the towels begin to form opinions,” “plant identification by vibes”—but the voice is less consistently foregrounded.

### Merge decision: adopt a three-lane voice contract

#### Lane 1 — emergency imperative

Use for immediate danger, emergency cards, and first-action sequences.

- action first;
- short sentences;
- explicit destination;
- no joke before the action is complete;
- no metaphor that could obscure the instruction;
- uncertainty escalates rather than reassures.

#### Lane 2 — operational companion

Use for first aid after the emergency gate, safe-place planning, calls, logs, continuity, and handoffs.

- warm direct address;
- one memorable line per meaningful unit;
- explain briefly why an instruction matters;
- humour may reduce shame but must not change urgency;
- preserve agency and practical limits.

#### Lane 3 — reflective/nerdy bathroom essay

Use for Observatory, Calm, evidence literacy, social re-entry, continuity thought experiments, and optional activities.

- strongest alternate voice allowed;
- computational metaphors, badger notes, philosophical asides, and absurd edge cases welcome;
- still label models as models and jokes as jokes;
- hand off cleanly when a real risk appears.

### Editorial tooling recommendation

Create a small reviewed “golden voice corpus,” not an automatic style score:

```text
docs/editorial/voice-contract.md
docs/editorial/golden-passages.md
src/data/editorial_segments.json   # optional, only if useful
```

For each pilot section record:

- urgency lane;
- strongest retained sentence;
- lines removed for overclaiming;
- required source/limit;
- humour distance from emergency action;
- reading-load target.

Automated lint can catch forbidden absolutes and missing emergency destinations, but it cannot determine whether a joke is humane. Human review remains required.

## 5.5 Visual design and page composition

### Alternate strengths

- Strongly differentiated booklet palettes.
- More prominent patterns.
- Mascots and pixel-art elements make the family feel collectible and personal.
- The hub is conceived as a visual object rather than a table of contents.
- The visual spec proposes many useful timeline, comparison, route, anatomy, and inventory forms.
- The design has a clearer sense of delight.

### Main strengths

- Better screen application shell, responsive site, print variants, and layout QA.
- Code + pattern + glyph + title identity, not colour alone.
- Emergency red is treated semantically.
- Page composition rules distinguish quantitative evidence, route maps, spatial illustrations, forms, and identity graphics.
- Figures require a question, source or conceptual status, text equivalent, mono strategy, reproducible renderer, and practical limit.
- Typography and output are tested at actual A4, A4/2, large-print, colour, monochrome, and browser sizes.

### Merge decision

Use the main design system as the semantic foundation and increase its expressive range with selected alternate motifs.

Recommended changes:

- make subguide pattern bands, edge tabs, and cover fields more visible;
- retain main codes and glyphs in every identity-bearing element;
- allow a more expressive display face on non-urgent covers and pull quotes, while retaining the main hyperlegible sans-serif body for instructions and small formats;
- use mascots as optional orientation or authorial characters, never as the only route cue and never as a release gate;
- reserve badger/mascot boxes for personal notes, tiny “why” explanations, optional context, and morale—not red flags;
- avoid patterns behind body text;
- prototype the hub as a visually rich graph directory rather than copying the alternate flat booklet grid.

### Required design pilot

Produce one representative spread/page from each risk class:

1. `O` — reflective scientific orientation;
2. `B` — tone-rich calm material;
3. `C` — action-critical first aid;
4. `Z` — complex continuity with humour;
5. `T` — writable form;
6. hub/landing — family overview.

Render all six in:

- A4 colour;
- A4 monochrome;
- A4/2 colour;
- A4/2 monochrome;
- large print;
- responsive HTML at narrow and desktop widths.

Review contact sheets before applying the treatment globally.

## 5.6 Data model and stable references

### Alternate strengths

- `subguide_manifest.json` is simple and product-oriented.
- Palette, pattern, mascot, chapter, source, version, and tagline live in one understandable record.

### Main strengths

The main line already has machine-readable systems for:

- route policy and destinations;
- evidence facts and limits;
- continuity;
- stable references;
- content index;
- coverage matrix;
- source inventory;
- figures and illustrations;
- visualizations and derived data;
- forms and deployment fields;
- accessibility profiles and locale data;
- subguide graph identity and standalone contracts;
- release manifests.

Selected current sizes illustrate the difference:

| Registry | Approx. size / structural breadth |
|---|---:|
| `content_index.json` | 130 KB / 7,149 structural items |
| `source_inventory.json` | 84 KB generated source inventory |
| `reference_ids.json` | 23 KB / 335 validated active resources |
| `route_catalog.json` | 20 KB / pass-1, pass-2, modifier, service, and safe-place policy |
| `figure_inventory.json` | 44 figure records |
| `illustration_catalog.json` | 36 illustration/audit records |
| `visualization_catalog.json` | 8 canonical Vega-Lite records |
| `forms.json` | 18 forms |
| `subguides.json` | 10 frozen graph identities |

### Merge decision

Do not introduce a competing alternate manifest as another source of truth. Extend the main registries only where a genuine gap exists.

Add one integration-specific crosswalk, then retire it after migration:

```text
src/data/alt_import_crosswalk.json
```

Suggested record shape:

```json
{
  "alt_path": "src/subguides/calm/chapters/01-calm-guide.md",
  "alt_commit": "e19763de3047aa2d83cb9c032f8abea9835ff4b2",
  "main_owner": "B",
  "main_resources": ["BEG:B:S:..."],
  "status": "reviewed-partial-import",
  "imports": [
    {
      "kind": "voice",
      "description": "permission statement and bathroom-maintenance framing"
    }
  ],
  "rejected_claims": [
    "navy-seal-box-breathing-appeal",
    "comfort-threshold"
  ],
  "review_notes": "..."
}
```

The record should preserve provenance without making the alternate repository a runtime dependency.

## 5.7 Sources and citations

### Alternate strengths

- Per-guide source files make detached booklets visibly source-complete.
- The alternate line has a wider raw research bibliography in several topic areas.
- Sources are close to the prose they support.

### Main strengths

- Source views are generated and mapped to owners/uses.
- Operational sources have review/freshness semantics.
- Evidence facts carry class, denominator/scope, source, and practical limit.
- Figures and routes reference canonical source identifiers.
- Standalone source completeness is validated.
- The Reference route can deduplicate globally without forcing readers to chase a remote bibliography.

### Merge decision

Preserve the main policy: **one canonical source registry, generated local “Sources and limits” views.** Do not copy alternate `sources.md` files into canonical subguide folders.

Run every alt-only source through this import funnel:

1. normalize URL/DOI and detect malformed entries;
2. identify the exact claim it supports;
3. classify as operational, research, explanatory, model, or background;
4. assign owner and secondary routes;
5. record population/denominator/scope where relevant;
6. write a practical limit;
7. assign locale and freshness for operational guidance;
8. reject the source if the supported claim is not needed;
9. generate local source output from the canonical record.

The main source architecture plan already points toward a true `sources.json` registry. Completing that consolidation is preferable to adding more generated-from-footnote special cases during a large editorial merge.

## 5.8 Facts, safety, and conceptual models

This is the highest-risk merge layer.

### Claims that should remain quarantined or be rewritten

The alternate line contains memorable wording that crosses from voice into unsupported certainty. Examples found in current source include:

| Alternate claim or device | Decision | Reason |
|---|---|---|
| “Used by Navy SEALs” as support for box breathing | remove | authority/folklore appeal adds no useful evidence |
| physiological sigh as the “fastest known” method where “even one round works” | rewrite | cited study tested repeated daily practice over 28 days; main wording correctly limits inference |
| a three-item “comfort threshold” proving the reader is fine | remove | invented threshold can falsely reassure |
| “You die in 3 days without water” | remove | survival-rule folklore ignores conditions and distracts from BBK planning values |
| “roughly three weeks without food” | remove | same problem; not an actionable or individualized protocol |
| “Every container ... fill everything ... never too much water” | rewrite | container safety, weight, contamination, sanitation separation, and official instructions matter |
| eating unidentified insects | reject | unsafe and unnecessary in this guide's scope |
| scavenging abandoned stores | reject | unsafe, legally/contextually fraught, and not required for household continuity |
| toilet cistern water treated as universally clean and reliable | reject as universal guidance | tanks may contain cleaners, contamination, non-potable supply, or unknown materials |
| generic “bathtub protocol” for earthquakes | authoritative review required | must follow current location-specific earthquake guidance and actual room hazards |
| bathroom walls/plumbing stacks assumed to be structurally stronger | reject as general rule | building construction varies; false shelter confidence is dangerous |
| bathroom drains assumed to solve incoming water | reject | drains can backflow, block, or be irrelevant to floodwater |
| generic water-disinfection recipes or universal utility volumes | quarantine | product concentration, contamination type, building system, and official notices vary |

### Alternate-only modules need different treatment

#### Body Owner's Manual

The file is substantial—about 4,269 words and 33 headings—not a placeholder in content terms. It contains useful reader questions around body signals, GI distress, pain description, hydration, substances, fainting, and observation.

However, much of it overlaps existing `O`, `B`, and `C`, and some material risks becoming a generic symptom checker. Recommended treatment:

- import useful questions, descriptions, and bathroom-specific observation language into existing owners;
- map medication/substance material toward a future satellite only if it has a distinct route and sufficient source coverage;
- do not release a broad “is this normal?” guide until age, pregnancy, medication, and red-flag boundaries are modeled;
- avoid generic thresholds that invite diagnosis;
- keep recovery-position and fainting actions under `C`, with first-aid sources and diagrams.

#### Social Field Guide

The file is about 4,418 words and 35 headings. It offers the clearest genuinely new editorial territory: re-entry, absence management, communication templates, mirror/shame, social battery, boundaries, and context-specific scripts.

Recommended treatment:

- pilot as a satellite or themed insert attached to `B`, `D`, and `P`;
- separate ordinary awkwardness from actual threat at the architecture level, not only late in the prose;
- route violence/coercion to `D` immediately;
- route professional and crisis needs to `P`;
- treat scripts as editable examples, not guaranteed social outcomes;
- source psychological claims; leave pure etiquette clearly labeled as practical suggestion rather than evidence.

This is the strongest candidate for eventual new standalone material.

#### Natural Disasters

The file is about 4,754 words and 43 headings. It contains useful scenario imagination, but it overlaps `H`, `Z`, `C`, and `D` and currently contains several universalized building/water/shelter claims.

Recommended treatment:

- decompose it by owner rather than releasing it as-is;
- hazard detection and shelter/evacuation logic belong to `H` and official warnings;
- household continuity belongs to `Z`;
- injuries belong to `C`;
- blocked exits and unsafe places belong to `D`;
- only create a disaster satellite after it passes the main graduation gate: distinct question, 8–20 useful pages without duplication, at least two graph connections, complete sources, reviewed visuals, and no repeated generic emergency preamble.

#### Templates & Forms

The alternate file contains ten concise forms and good “write it down so your brain doesn't have to” framing. The main line now has 18 registered forms, privacy classes, stable references, route chips, related figures, deployment fields, and validation.

Recommended treatment:

- keep main `T` as canonical;
- import only superior instructions, labels, or tear-out language;
- crosswalk every alternate form to a main form before considering a new one;
- never duplicate form IDs or privacy semantics.

### Claim model recommendation

Every reader-facing claim should be classifiable as one of:

- emergency protocol;
- operational route;
- research finding;
- population estimate;
- diagnostic-accuracy result;
- mathematical or conceptual model;
- practical heuristic;
- hypothetical/joke.

The class should control required metadata. A joke needs no DOI but must not masquerade as a protocol. A model needs explicit non-predictive limits. A numeric finding needs denominator and scope. An operational route needs locale, owner, review date, and freshness.

## 5.9 Diagrams, depictions, and visualization

### Current scale

- Alt currently builds 34 PNG diagrams/assets and planned roughly 61 additional visual assets in its expansion specification.
- Main currently tracks 44 figure records, including eight canonical Vega-Lite figures, 36 illustration/audit records, and 93 diagram files in the build tree.
- Main figures already carry owner, question, source basis, replacement status, renderer, text fallback, and monochrome strategy.

### Merge decision

Do not copy rendered PNGs as the primary integration method. Import visual **questions and compositions**, then rebuild them through the main catalog.

Classify every alternate visual proposal into four buckets:

| Bucket | Meaning | Action |
|---|---|---|
| A — canonical concept | answers a missing high-value reader question | register, source, redesign, validate |
| B — better composition | duplicates a main figure but explains it better | redesign the canonical figure; retire old record with replacement link |
| C — identity/decorative | pattern, mascot, cover art, divider | optional asset with alt text and no safety role |
| D — unsafe/unsupported | encodes a questionable claim or false precision | reject or hold until evidence changes |

### Renderer policy

Retain the main renderer-by-question model:

- Vega-Lite for quantitative comparisons and intervals;
- generated SVG/Graphviz for graph topology and dependencies;
- authored/generated SVG or matplotlib for spatial/mechanism diagrams;
- semantic HTML/CSS for forms and simple route cards;
- Pillow/pixel art for decorative or identity assets, not evidence charts.

### High-value alternate visual ideas to reconsider

Likely A/B candidates include:

- a more legible hub graph and directory;
- grounding `5-4-3-2-1` as a compact attention card;
- five-step repair sequence treatment;
- first-aid sequence strips and body orientation;
- comfort inventory icon treatment;
- water-stock calculator composition, using main evidence data;
- group-role and ownership cards;
- call-script anatomy;
- social re-entry and boundary decision cards;
- optional quiet-activity/folding/graffiti pages as non-emergency extras, if they fit product scope.

Every accepted figure still needs:

- one reader question;
- one intended inference;
- source or conceptual-model declaration;
- complete text fallback;
- alt and long description where complex;
- monochrome-safe encoding;
- legibility at final A4/2 size;
- no colour-only meaning;
- practical limit where interpretation could overreach.

## 5.10 Forms, deployment, and privacy

### Alternate strengths

- Clear distinction between author, deployer, and reader in notes.
- Strong instinct to externalize tasks into forms.
- Good ideas for local customization, remarks, feedback, and a deployment index.

### Main strengths

- Explicit author/deployer/reader/helper roles.
- Machine-readable deployment fields with requiredness and privacy class.
- Stable form references and detachable resources.
- Shared-wall privacy warnings.
- Deployment manual, planner, maintenance, feedback, audit, and route-drill forms.

### Merge decision

The main form/deployment system is canonical. Mine alternate notes for missing **experience design**, especially:

- making customization feel welcoming rather than administrative;
- clearer “before / during / after” form instructions;
- optional personality and art additions;
- a visible feedback invitation;
- author/deployer notes that explain why a local field matters.

Do not import local addresses, credentials, medical details, hidden-key locations, or violence-related safe places into shared output defaults.

---

## 6. Canonical source-of-truth matrix

| Layer | Canonical after merge | Alt contribution | Explicitly avoid |
|---|---|---|---|
| Git history | main `4.13.1` lineage | archived commit/bundle and crosswalk provenance | unrelated-history merge or synthetic graft |
| Public route identity | `O/A/B/C/D/H/Z/P/T/R` | display aliases, taglines, warmer descriptions | replacing codes with colour-book names |
| Emergency logic | `route_catalog.json` and locale/accessibility data | clearer phrasing after route parity review | prose-only routes or duplicated emergency logic |
| Canonical prose | main chapters/resources | reviewed sentence/section imports | whole-file replacement |
| Stable IDs | `reference_ids.json` / content index | provenance links to alt source | renumbering resources because files move |
| Sources | one canonical registry/inventory with generated local views | audited alt-only sources | hand-maintained per-book bibliography copies |
| Evidence facts | main fact registry pattern | new reviewed fact records | numeric claims embedded only in prose |
| Subguide graph | `subguides.json` | stronger surface identity and hub concepts | eleven equal top-level emergency entries |
| Forms | main `forms.json` and deployment fields | wording/layout improvements | duplicate forms without crosswalk/privacy class |
| Figures | main figure/illustration/visualization catalogs | visual question/composition imports | copying unregistered PNGs as canonical evidence |
| CSS/layout | main responsive and print system | stronger patterns, covers, optional display treatments | parallel theme stack with divergent semantics |
| Build/release | main npm pipeline, CI, manifest, validators | imported generators behind catalogs | second package manager or alternate release tree |
| Voice | new three-lane editorial contract | golden passages and humour | flattening all prose to clinical tone or importing overclaims |

---

## 7. Proposed integration architecture

The integration should add only a thin provenance and editorial layer to the existing main architecture.

### Temporary integration records

```text
src/data/alt_import_crosswalk.json
docs/integration/alt-source-audit.md
docs/integration/voice-pilots.md
docs/integration/design-pilots.md
```

### Durable additions only if they prove useful

```text
docs/editorial/voice-contract.md
docs/editorial/golden-passages.md
src/data/sources.json              # canonical source consolidation already anticipated
src/data/claims.json               # optional; introduce only if it reduces current fragmentation
```

Do not create `claims.json` merely for symmetry. First test whether existing route, evidence, source, figure, and content registries can express the needed ownership without duplication. A new registry is justified only if it becomes the single place connecting claim wording, class, source IDs, limits, owners, and dependent figures.

### Provenance preservation

Before editing:

1. create an annotated immutable tag in the alternate repository;
2. create a Git bundle or other hash-verified archive of all alternate refs;
3. record SHA-256, commit, branch, repository status, and the relationship to main HEAD's tracked `src-alt/` snapshot in the main integration record;
4. decide separately whether the fourteen currently deleted `src-alt/` files should be restored, intentionally removed, or replaced by a compact provenance record—do not mix that housekeeping decision with content imports;
5. optionally add the sibling as a read-only remote for `git show`, but never merge it;
6. create a clean integration worktree/branch from main HEAD rather than building the synthesis on top of the dirty checkout.

Suggested branch name:

```text
integration/v4-alt-editorial-synthesis
```

Do not choose the eventual release number until the imported scope is known. A prose/design release may remain a minor release; new public routes or materially changed architecture may justify a major boundary.

---

## 8. Content crosswalk

| Alternate region | Main owner(s) | Import posture |
|---|---|---|
| hub cover / map / directory | `O`, subguide hub, site | redesign surface; keep graph logic |
| Calm | `B`, with some Observatory material in `O` | high-priority voice pilot; claim-by-claim evidence check |
| Self Ambulance | `C` | selective language and depiction import; strict emergency lane |
| Responsibility | `A` | selective voice/sequence import; retain main consent/agency model |
| Safety / No Place | `D` | low structural priority because main is already very close; compare wording only |
| Environmental | `H` | low structural priority; retain main route/source freshness model |
| Zombie / survival | `Z`, `H`, `C`, `D` | import humour and continuity framing; reject folklore/survival improvisation |
| Professional support | `P` | wording and call-script composition; main service registry canonical |
| Appendix / glossary | `R` | main registry/index architecture canonical; import explanatory phrasing only |
| Templates | `T` | map every form; import superior instructions/layout only |
| Body Owner's Manual | `O`, `B`, `C`; possible future satellite | decompose and audit; no immediate standalone |
| Social Field Guide | `B`, `D`, `P`; likely satellite candidate | strongest new-module candidate; prototype after safety split |
| Natural Disasters | `H`, `Z`, `C`, `D`; possible future satellite | decompose; authoritative rebuild required |
| feedback/deployer notes | `T`, site, deployment docs | import experience-design ideas |
| mascots/patterns | identity assets | optional, cataloged, accessible, non-semantic |

---

## 9. Staged implementation plan

### Phase 0 — Freeze, inventory, and protect

**Goal:** make the investigation reproducible before content changes.

Tasks:

- tag and bundle the alternate repository;
- record both reviewed commits and clean/dirty states;
- compare and document main HEAD's tracked `src-alt/` snapshot against the sibling alternate repository;
- resolve the existing fourteen `src-alt/` deletions in a separate housekeeping decision, or leave the current checkout untouched and open a clean worktree from main HEAD;
- create the integration branch in that clean worktree;
- generate path, heading, citation, URL, figure, and form inventories;
- create `alt_import_crosswalk.json` with one record per alternate reader-facing file;
- classify each record as `already-synthesized`, `candidate`, `superseded`, `quarantined`, or `archive-only`.

Acceptance:

- no canonical file changed yet;
- every alternate chapter has an owner/status;
- archive is hash-verifiable;
- full main `npm test` still passes.

### Phase 1 — Freeze the editorial contract

**Goal:** agree what “keep the alt tone” means operationally.

Tasks:

- write the three-lane voice contract;
- select 25–40 golden passages across Calm, Responsibility, Zombie, Social, and hub material;
- mark each passage as `verbatim-candidate`, `adapt`, `tone-reference`, or `reject-overclaim`;
- define emergency-language prohibitions and humour-distance rules;
- add a lightweight lint list for dangerous absolutes such as “always safe,” “you are fine,” “fastest known,” and survival-duration folklore.

Acceptance:

- two reviewers can apply the contract to the same page with similar decisions;
- golden passages include both playful and safety-constrained examples;
- the contract does not demand clinical flatness.

### Phase 2 — Editorial pilots

**Goal:** test the synthesis on representative material before repository-wide rewriting.

Recommended order:

1. **B — Alarm and Calm:** largest voice opportunity, moderate safety risk.
2. **C — Body and First Aid:** tests whether warmth can survive strict action constraints.
3. **Z — Outage and Continuity:** tests humour, systems thinking, and fact quarantine.
4. **A — Responsibility and Care:** tests agency, ethics, and memorable framing.
5. **O — Observatory:** unifies the opening voice and bathroom premise.

For each pilot:

- create a sentence/section diff against main;
- cite alt provenance in the integration record;
- preserve main stable IDs and references;
- run source and claim review;
- render all layouts/modes;
- review page density and contact sheets;
- keep a rejection log so removed overclaims do not return later.

Acceptance:

- route/action meaning unchanged unless separately approved;
- all citations resolve;
- no new numerical claim lacks class, scope, source, and limit;
- main test suite passes;
- user review confirms the voice moved in the intended direction.

### Phase 3 — Visual identity pilot

**Goal:** increase delight and recognizability without duplicating CSS systems.

Tasks:

- prototype more prominent pattern bands and covers using main tokens;
- test optional mascot/badger elements in O/B/Z and hub surfaces;
- redesign the hub with graph logic plus alternate visual energy;
- register every new asset or canonical replacement;
- produce colour, mono, A4, A4/2, large-print, and responsive review sheets;
- test whether cover display typography can differ from instruction typography.

Acceptance:

- code/pattern/glyph/title remain sufficient without colour;
- emergency red remains exclusive to urgency;
- no mascot carries required meaning;
- no pattern impairs body text;
- all browser and PDF checks pass.

### Phase 4 — Source and claim consolidation

**Goal:** make alternate-source imports auditable and reduce current source fragmentation.

Tasks:

- normalize the 69 alt-only URLs;
- map each to an accepted claim or discard it;
- complete the canonical source registry planned by main;
- connect route, evidence, figure, and chapter uses;
- add operational freshness and supersession;
- generate local Sources and limits views;
- remove the one currently orphaned main Markdown footnote definition if it remains genuinely unused after generation review.

Acceptance:

- every citation resolves;
- no source exists only because it was present in alt;
- every operational source has locale and review policy;
- every numeric claim has denominator/scope/limit;
- standalone outputs remain source-complete offline.

### Phase 5 — Remaining core routes

**Goal:** complete the voice/design pass without wasting effort where the repositories are already close.

Recommended order:

1. `P` — support scripts and humane handoff language;
2. `T` — form instructions and deployer experience;
3. `R` — explanatory voice around evidence and references;
4. `D` and `H` — only targeted wording/visual improvements because these chapters are already highly similar between repos.

Acceptance:

- no duplicated routes, forms, or source blocks;
- every imported passage has a crosswalk record;
- stable public references remain valid or are explicitly retired.

### Phase 6 — Alternate-only module graduation

**Goal:** decide module fate from reader questions, not attachment to existing chapters.

#### Social pilot first

Build a constrained satellite prototype containing:

- ordinary awkwardness and re-entry;
- communication templates;
- social battery and graceful exit;
- boundary scripts;
- immediate handoff to `D` for threat and `P` for support.

#### Body material second

Create a coverage map against O/B/C before writing anything new. Prefer filling existing route gaps over creating a generic symptom book.

#### Disaster material last

Rebuild from official hazard guidance and the main route catalog. Do not treat alternate prose as a safety baseline.

Graduation gate for any new standalone:

- distinct reader question;
- enough non-duplicative material for 8–20 useful pages;
- at least two graph connections;
- complete canonical sources and limits;
- at least two reviewed visuals;
- clear outside-scope;
- one standalone emergency gate only;
- all layout/accessibility/source/release tests pass.

### Phase 7 — Release hardening

**Goal:** prove that synthesis did not weaken the publication.

Run and retain evidence for:

- full `npm test`;
- visual contact-sheet review;
- text parity across colour/mono forms;
- A4, A4/2, and large-print density;
- keyboard/touch/narrow-screen browser checks;
- stable-reference diff;
- route/source/figure/form coverage diff;
- output manifest and hashes;
- alt-import crosswalk with no unresolved candidates;
- explicit list of rejected unsafe claims.

Only then retire the integration branch into the release line.

### Phase 8 — Archive and simplify

After release:

- keep the alternate bundle/tag and final crosswalk as provenance;
- mark the sibling repo read-only/archive-only;
- remove temporary import code and duplicate experimental assets;
- keep durable voice/design contracts and source records;
- document which alternate ideas remain intentionally deferred.

---

## 10. Recommended work packets

Keep implementation changes independently reviewable.

| Packet | Scope | Typical changed paths | Must not include |
|---|---|---|---|
| P0 provenance | tag/bundle/crosswalk skeleton | docs + one data file | prose changes |
| P1 voice contract | editorial docs/golden corpus | docs only | chapter rewrites |
| P2 Calm pilot | B prose + affected figures/sources | bounded B paths | global CSS rewrite |
| P3 First-aid pilot | C prose + one or two figures | bounded C paths | route changes without separate review |
| P4 visual tokens | subguide CSS/pattern prototype | CSS + asset catalog | content expansion |
| P5 hub prototype | hub generator/site presentation | hub/site paths | new public route IDs |
| P6 source registry | source migration and validators | data/build scripts | prose cleanup combined with metadata movement |
| P7 Z/A pilots | bounded prose/figures | Z/A paths | satellite modules |
| P8 Social satellite spec | scope, routes, sources, prototype | new spec/data only first | release declaration |
| P9 release hardening | validators/manifests/docs | release paths | new content |

This separation prevents a failed visual experiment from being entangled with medical wording or source migration.

---

## 11. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Voice import reintroduces false certainty | high | high | three-lane contract, claim review, rejection log |
| Directory overlay duplicates canonical prose | high | high | main-only canonical source; crosswalk imports |
| Stable references break during reorganization | medium | high | manifest-first; reference diff gate; defer physical moves |
| Per-guide sources drift | high | high | one canonical registry; generated local views |
| New colour-book names conflict with frozen identities | medium | medium | aliases only; code/pattern/glyph primary |
| Mascots become navigation dependencies | medium | medium | optional asset classification; no release gate |
| Diagram count grows faster than review capacity | high | medium | question-first catalog; A/B/C/D classification |
| Page count and density regress | high | medium | pilot batches, contact sheets, density gates |
| Operational sources become stale | medium | high | freshness windows and hard-fail policy |
| Social/Body/Disaster expansion duplicates core routes | high | medium | graduation gate and owner coverage map |
| Setup gains two package managers | medium | medium | npm remains canonical; discard alternate lockfile |
| Main scientific discipline flattens all personality | medium | high | golden corpus and user review as acceptance evidence |
| Alt visual energy is reduced to decorative badges | medium | medium | hub and representative page pilots, not token-only import |

---

## 12. Definition of done

The integration is complete only when all of the following are true:

### Architecture

- main remains the single canonical repository and release lineage;
- every alternate reader-facing file has a final crosswalk status;
- no canonical prose or bibliography is duplicated;
- public route codes and stable references remain valid or are explicitly retired.

### Writing

- the three-lane voice contract is documented and used;
- reviewed golden passages are visible in the released guide where appropriate;
- urgent passages remain direct and joke-free before action;
- no quarantined overclaim appears in reader-facing output.

### Data and sources

- every citation resolves;
- every operational route has owner, locale, review date, and freshness;
- every numeric fact has class, denominator/scope, source, and limit;
- every accepted alt-only source supports an accepted claim;
- local source sections are generated from one registry.

### Visuals

- every new/replaced figure has question, owner, source basis or conceptual label, text fallback, mono strategy, and review status;
- patterns, glyphs, codes, and titles preserve identity without colour;
- mascots remain optional and accessible;
- all final layouts remain legible at actual output size.

### Release quality

- full `npm test` passes;
- all master and standalone output contracts remain present;
- PDF density, edge safety, accessibility, text parity, overflow, and browser checks pass;
- the release manifest and artifact hashes are reproducible;
- the user has reviewed voice and design contact sheets, not only source diffs.

---

## 13. Immediate next actions

1. Freeze and bundle the alternate repository at `e19763de3047aa2d83cb9c032f8abea9835ff4b2`.
2. Record the sibling's relationship to the tracked-but-currently-deleted main `src-alt/` snapshot and resolve that dirty state separately.
3. Create a clean worktree and `integration/v4-alt-editorial-synthesis` branch from main `42eb11490941f3c367da4644aa2c0c69375ab8f7`.
4. Add the alt-import crosswalk and classify every alternate chapter.
5. Write the three-lane voice contract and select the golden corpus.
6. Implement only the B/Calm editorial pilot first.
7. Render the B pilot across every main output mode and review it before expanding scope.
8. Follow with one C/first-aid pilot to prove the safety boundary.
9. Begin source-registry consolidation before importing alt-only factual claims.
10. Prototype the richer hub/pattern treatment after the voice pilot, not simultaneously with it.
11. Treat Social as the first satellite candidate; keep Body decomposed and Disaster quarantined until authoritative reconstruction.

---

## Final recommendation

The best merged guide is not the midpoint between the two repositories.

It should have:

- **the main line's skeleton, nervous system, memory, and immune system;**
- **the alternate line's face, timing, mischief, and willingness to speak like a person;**
- **one canonical data and source model;**
- **one graph of responsibilities and handoffs;**
- **multiple visual languages chosen by the question;**
- **a strict boundary between memorable writing and unsafe certainty.**

That combination is achievable without destabilizing the current release. The key is to treat the alternate repository as curated provenance and to make every import earn its place through the mature main-line contracts.
