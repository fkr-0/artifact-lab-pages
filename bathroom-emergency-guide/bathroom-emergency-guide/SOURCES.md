# Bathroom Emergency Guide — Source Register

The canonical annotated source register is
[src/chapters/10-sources.md](src/chapters/10-sources.md).

## Release policy

For each release:

1. Verify German service numbers against gesund.bund.de and the named service.
2. Check whether ERC, DRK, WHO, BBK, or other cited authorities issued newer
   guidance.
3. Record exactly which claim each source supports.
4. Store plotted numeric inputs in `src/data/evidence_facts.json` with evidence
   class, denominator, scope, uncertainty, and practical limit.
5. Remove claims that exceed the source, even when they sound usefully
   scientific.
6. Keep emergency instructions short enough to execute.
7. Rebuild and validate color and monochrome A4 and A4/2 outputs.

## Operational route sources

Version 4.5.0 separates operational routing from explanatory evidence:

- `src/data/route_catalog.json` stores pass-1 overrides, pass-2 needs,
  dependency modifiers, destinations, and reviewed source IDs;
- `src/data/locales/de-DE.json` stores national service scopes, poison centres,
  warning channels, and values that must be supplied locally;
- `bin/validate_routes.py` rejects missing destinations, missing or outdated source records,
  unsafe wording regressions, incomplete poison-centre coverage, and diagrams
  without chapter routes.

Operational source order is: current public authority or emergency service;
current technical safety authority; product- or substance-specific professional
advice; explanatory literature. A study never outranks a fire brigade, poison
centre, dispatcher, warning authority, or approved device emergency plan.

### Freshness and locality

Each operational source stores a review date and maximum review age. Validation
uses the current date by default and accepts `GUIDE_AS_OF=YYYY-MM-DD` for a
reproducible future-date test. Near-expiry records warn; stale records fail.

National services and local services must not be blurred:

- a published nationwide number may be printed with its scope and availability;
- municipal accommodation, after-hours offices, accessible rooms, transport,
  powered destinations, youth emergency services, and pet-compatible places
  remain empty local fields until confirmed;
- 115 may identify a responsible authority during its published hours but is
  not labelled an emergency or guaranteed-accommodation line;
- a directory entry is not treated as a confirmed place.


### Household continuity sources

`src/data/continuity_catalog.json` is a structured view of existing operational
sources, not a new evidence hierarchy. It links household functions to current
warning, fire, outage, emergency, gas, accessibility, and preparedness records
already owned by the route registry. `bin/validate_continuity.py` rejects unknown
source IDs, missing owners/backups, broken dependencies, absent text equivalents,
and denied alternate-source claims.

### Visualization provenance

`src/data/visualization_catalog.json` binds each Vega-Lite figure to a reviewed
question, derived table, specification, source IDs, evidence class, denominator
or scope, uncertainty policy, practical limit, alt text, long description, and
non-colour encoding. Derived tables are rebuilt from the evidence or continuity
registries; the renderer consumes no remote data. SVG is canonical and PNG is
the print/document fallback.

The first eight-chart batch re-expresses six reviewed evidence figures and adds
two deterministic structural models. It introduces no new medical threshold or
personal risk estimate.

### Accessibility sources

`src/data/accessibility_profiles.json` stores barriers, adaptations, handoffs,
and failure-escalation conditions. WCAG supports document and interface
structure; service providers support the exact communication channels they
publish. Neither source permits assumptions about an individual person’s
capacity or preferred assistance. Ask the person whenever possible.

## Subguide-local source rendering

The global source chapter remains the complete R-node reference for 4.5.0. The
canonical registry view in `src/data/source_inventory.json` resolves 52 chapter
footnotes, inventories 75 global source-note sections, and reports no unresolved
references. The B and H vertical slices generate local **Sources and limits**
blocks in their standalone editions and the master while the global reference
remains available for parity checking. The migration plan in
`docs/plans/subguide-source-localization.md` continues toward:

- citation markers beside claims;
- a generated **Sources and limits** section at the end of each subguide;
- one canonical structured source registry;
- explicit source ownership, claim, figure, route, and freshness links;
- a deduplicated R index and provenance view rather than a second competing
  bibliography.

The first released pair combines B, which is research-heavy, with H, which is
operational-source-heavy. Their generated end matter is source-ID-stable across
A4, A4/2, large-print, color, and monochrome editions. The global source chapter
remains until every node has equivalent local coverage and parity is proven.

## Evidence order

The source choice depends on the question:

1. current public authority or guideline body for operational protocols;
2. systematic review or guideline synthesis for broad effect or accuracy claims;
3. primary peer-reviewed study when the design itself is the notable finding;
4. high-quality public medical information for accessible explanation;
5. secondary explanation only when clearly labelled.

A newer synthesis may legitimately differ from a famous development study. Both
may be shown when the difference teaches calibration rather than confusion.

Access and core emergency-route review date: **2026-07-23**.
