# Subguide-Local Sources and Limits

Status: architecture and migration plan
Target: registry preparation in 4.4, subguide rendering in 4.5
Prepared: 22 July 2026

## 1. Decision

Attach the sources used by each subguide to the end of that subguide.

This is a good fit for the new architecture because a reader should not need to
jump to the final pages of a long master volume to answer:

- Where did this claim come from?
- When was this service route reviewed?
- What population or model does this number describe?
- What does the source not establish?

The implementation must not copy and hand-maintain separate bibliographies.
Claims, citations, and end matter should all be generated from one canonical
source registry.

## 2. Reader-facing form

Each subguide ends with:

```text
Sources and limits
  Operational routes
  Research and evidence
  Models, formulas, and explanatory diagrams
  Reused sources from neighbouring subguides
  Review date and freshness notes
```

Footnote or citation markers stay beside the relevant claims. The end section
contains the full filtered references and their practical limits.

### Operational source entry

```text
DE-BBK-FIRE — BBK fire guidance
Reviewed: 22 July 2026
Scope: Germany; public fire-safety action
Used for: smoke-free exit, closed-door fallback, call from safety
Freshness: operational; review every 180 days
Limit: local fire-service instructions and the actual scene override general prose
```

### Research source entry

```text
VAN-DONGEN-2003 — Chronic sleep restriction study
Evidence class: controlled laboratory study
Population: 48 healthy adults
Used for: cumulative performance effects and subjective/objective divergence
Limit: not a personal impairment calculator and not an emergency triage rule
```

## 3. Master and standalone behavior

| Output | Source behavior |
|---|---|
| Master guide | each subguide ends with its own filtered sources and limits; R contains a global source index and provenance map, not a second full bibliography |
| Standalone subguide | contains the same filtered source block as the master region |
| A4/2 | compact entries may use stable IDs plus short source lines; full entries remain available in HTML and standard A4 |
| Large print | same entries with large-print layout; do not replace with QR-only access |
| HTML | source IDs link claim → local entry → global registry details; optional expand/collapse is progressive enhancement |

A source reused by three standalone guides appears in all three detached outputs
because each must remain self-contained. In the master it may appear in each
local source block as a concise full entry, while R provides one deduplicated
index showing every place it is used.

## 4. Canonical data model

Introduce `src/data/sources.json` as the canonical registry after auditing the
current source chapter and footnotes.

```json
{
  "id": "van-dongen-2003",
  "kind": "research",
  "title": "The cumulative cost of additional wakefulness",
  "authors": ["Van Dongen HPA", "..."],
  "published": "2003",
  "url": "https://doi.org/10.1093/sleep/26.2.117",
  "evidence_class": "controlled laboratory study",
  "population": "48 healthy adults",
  "denominator": "48",
  "scope": "14-day chronic sleep restriction and 3-day total deprivation comparator",
  "limit": "Not a personal impairment calculator",
  "reviewed_on": "2026-07-22",
  "freshness_days": null,
  "subguides": ["B"],
  "claims": ["sleep-restriction-objective-deficit"],
  "figures": ["sleep-restriction-small-multiples"]
}
```

Operational entries additionally require:

- locale and geographic scope;
- service owner;
- channel and availability;
- last verified date;
- warning and hard-expiry windows;
- replacement/supersession relation when withdrawn.

## 5. Stable citation identity

Use stable source IDs rather than global sequential numbering as the canonical
identity.

- Source IDs survive chapter reordering and standalone extraction.
- Printed subguides may display local numbers for readability, but the stable ID
  remains visible in small type or metadata.
- Figure catalogs, route registries, and claims all point to the same IDs.
- A source title or URL change does not change its ID unless it becomes a
  materially different source.

Suggested source-ID families:

```text
DE-BBK-*       German civil-protection operations
DE-GESUND-*   gesund.bund.de operational/medical routes
ERC-*         resuscitation guidance
WHO-*         international health guidance
STUDY-*       primary research where no memorable author key is suitable
REVIEW-*      systematic reviews/meta-analyses
LAW-DE-*      German legal source
LOCAL-*       municipality/provider-owned values
```

Human-readable author-year IDs remain acceptable for research sources when
unique and stable.

## 6. Ownership and reuse

Every source declares:

- one **primary owning subguide**;
- zero or more secondary subguides;
- exact claims and figures it supports;
- whether it is operational, explanatory, or both.

Ownership controls where the full source note is edited. It does not prevent
reuse.

Examples:

- a CO source is primarily H and secondarily Z;
- a cognitive-load paper is primarily B and secondarily O;
- a German service number is primarily P but may be rendered in D or C when the
  route is directly used there;
- source-method policy belongs to R and is not repeated as an essay in every
  subguide.

## 7. Migration from the current source chapter

### Phase S0 — inventory

- [ ] assign a stable ID to every source in `src/chapters/10-sources.md`;
- [ ] inventory all inline footnotes in chapters;
- [ ] map each source to claims, figures, routes, and subguides;
- [ ] identify duplicate entries, dead URLs, superseded guidance, and sources
  that currently support no reader-facing claim;
- [ ] preserve source wording during the inventory; do not combine cleanup with
  semantic migration.

### Phase S1 — registry

- [ ] add `src/data/sources.json` and schema validation;
- [ ] move structured metadata into the registry while keeping the current
  source chapter generated or hand-maintained temporarily;
- [ ] connect route-catalog source IDs and evidence-fact source IDs to the new
  registry;
- [ ] add freshness validation for operational sources;
- [ ] add claim and figure back-references.

### Phase S2 — citation conversion

- [ ] replace ad-hoc chapter footnote definitions with stable citation keys;
- [ ] keep citation markers beside claims;
- [ ] generate a claim/source coverage report;
- [ ] reject unresolved citations and registry sources with no owner;
- [ ] reject numeric claims whose source lacks denominator/scope/limit metadata.

### Phase S3 — two-subguide pilot

Pilot on two deliberately different regions:

1. **B — Alarm and Calm**, dominated by research evidence and bounded models;
2. **H — Air, Smell, and Environment**, dominated by current operational
   guidance and source freshness.

For each pilot:

- [ ] render a local Sources and limits section in master and standalone form;
- [ ] compare page growth in A4, A4/2, and large print;
- [ ] verify source order follows first use or topic grouping consistently;
- [ ] test repeated sources and cross-subguide links;
- [ ] review whether full URLs, DOI display, and stable IDs remain readable.

### Phase S4 — all-subguide migration

Recommended order:

1. O Observatory;
2. C Body and First Aid;
3. D Threat and Safe Place;
4. A Responsibility and Care;
5. Z Outage and Continuity;
6. P Professional Support;
7. R Reference and global index.

At each step, keep the old global source chapter until parity is proven.

### Phase S5 — global source chapter replacement

After all subguides pass parity:

- [ ] replace the monolithic full bibliography in R with a deduplicated source
  index, freshness report, evidence-class summary, and provenance graph;
- [ ] retain a machine-readable export of the complete registry;
- [ ] retain source-method and editorial-policy notes in R;
- [ ] ensure the master contains no orphan global citations;
- [ ] ensure every standalone guide contains every source it needs.

## 8. Validation

Add `bin/validate_sources.py` with these invariants:

- every citation resolves;
- every source has at least one owner and one use, unless explicitly marked
  background-only;
- every claim and figure points back to a source or is labelled conceptual;
- operational sources are within freshness windows;
- URLs/DOIs are syntactically valid and duplicates are detected;
- every standalone source block equals the filtered registry set for that
  subguide;
- local and global source rendering preserve identical metadata;
- source order is deterministic;
- no bibliography is copied into a subguide source file by hand;
- removed claims do not leave silently orphaned source entries.

## 9. Page-design rules

- Use the subguide pattern in the running header or edge tab, not behind source
  text.
- Separate source classes with short headings.
- Keep title, source identity, scope, and limit visually distinct.
- Use hanging indents and avoid tiny all-caps URLs.
- Prefer DOI or stable official title over an enormous tracking URL.
- Allow URLs to wrap safely and provide accessible links in HTML.
- Operational review dates and warnings are more prominent than journal volume
  formatting.
- A source entry may split across pages only if the repeated source ID and class
  remain clear.

## 10. Risks and mitigations

| Risk | Mitigation |
|---|---|
| master page growth from repeated sources | concise local entries; global index deduplicates; measure each migration batch |
| divergence between local and global bibliography | generate both from one registry |
| citation renumbering after extraction | stable IDs; local numbers are presentation only |
| same source supports several guides | explicit primary/secondary ownership and deterministic reuse |
| operational source becomes stale | review windows and hard-failure validation |
| source appendix overwhelms a short guide | compact source class, short limit, optional full registry details in HTML—but never QR-only |
| reader cannot connect claim to source | citation remains beside claim and links to local end matter |

## 11. Acceptance criteria

- A reader can move from claim to source within the same subguide.
- Every standalone guide is source-complete offline.
- The master guide contains local source blocks plus one deduplicated global
  index, not two competing bibliographies.
- Sources are generated from one canonical registry.
- Operational freshness and research limits remain visible.
- Source migration does not alter claim wording or safety routes without a
  separate reviewed change.
- Color, monochrome, A4/2, and large-print outputs contain equivalent source
  information.
