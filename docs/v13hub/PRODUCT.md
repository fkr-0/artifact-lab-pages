# V13Hub product brief

## Product thesis

Artifact Lab has accumulated experiments, applications, documents, projects, release receipts, and legacy compatibility records. A conventional launcher hides the most important questions: **what is this, where did it come from, what evidence exists that it is publishable, and what have I chosen to keep track of?**

V13Hub treats the collection as an observatory rather than a desktop of anonymous icons. Discovery remains fast, but provenance and uncertainty stay first-class.

## Primary jobs

1. **Discover** — find an artifact by title, description, tag, product shape, source shape, or evidence state.
2. **Evaluate** — distinguish receipt-backed releases, provisional records, source-only work, and external links without pretending those states are equivalent.
3. **Trace** — inspect source kind, Git ownership/date basis/revision, receipt metadata, and changed date.
4. **Collect** — keep a deliberately local shortlist without creating an account or sending telemetry.
5. **Launch safely** — open same-origin staged releases; require an explicit review step before crossing to external content.
6. **Observe peer health safely** — expose real peer health when a host provides it, without letting a network transport become the catalog authority.

## Visual language

The implemented product uses an “archival instrument” language: black-green ground, restrained mint evidence accents, dense monospaced microcopy for provenance, large editorial typography for orientation, and a quiet grid that reads like laboratory paper rather than a neon cyberpunk dashboard. Cards are deliberately information-dense but have one primary action: metadata preview.

The design avoids external fonts and images, so the hub's own presentation is deterministic and does not introduce a remote dependency before the user has interacted with any artifact.

## Core interaction decisions

- Search is immediate and token-based across descriptive fields plus publication/provenance evidence such as build mode, source path, Git revision, and receipt version.
- Facets use the catalog's actual values instead of a hard-coded taxonomy.
- “Health” is evidence-language, not an uptime claim.
- Receipt-backed health is derived from the shared evidence contract rather than inferred from a badge or availability string alone.
- Collection starts disabled. Enabling it is an explicit local-storage permission decision.
- The collection stores only stable IDs; metadata remains catalog-owned.
- Preview renders catalog metadata only.
- Preview separates health evidence, provenance, and publication authority so those concepts are not collapsed into one status block.
- Catalog loading, empty results, and authoritative-load failures remain explicit states; repeated filtering reuses stable card nodes so keyboard focus is not discarded by unrelated state renders.
- External destinations are not embedded, prefetched, or exposed as direct preview links.
- Peer state starts “Disabled by default.” A host adapter can prove connectivity; the hub never guesses.

## Representative catalog integration

The publication build uses native repository manifests and existing `artifactctl` receipts. This means the UI can simultaneously show, for example, staged native releases such as QR Studio, source-only/compile-mode projects, provisional submodule references, inline notes, and deliberately external repository links. The exact set remains a build result rather than being duplicated in UI source.

## Accessibility and responsive contract

- Semantic headings, form labels, status regions, a skip link, and a modal `dialog` provide navigable structure.
- Focus is visually explicit for keyboard users.
- Closing the inspector restores focus to the control that opened it, including Escape and backdrop-close workflows.
- Collection buttons are disabled until permission is granted rather than silently failing.
- The interface collapses from a 12-column artifact field to one-column cards on small screens.
- Reduced-motion preference disables meaningful transitions and hover movement.
- Metadata is never encoded by color alone; every evidence state has text.
- Meaningful dim text meets WCAG AA contrast against the V13 ground, panel, and raised-panel surfaces.

## Product authority boundaries

- Installing or caching artifact binaries.
- Mirroring external resources.
- Declaring remote URLs healthy.
- Starting PeerJS/Peernet automatically.
- Accepting remote artifact metadata into the authoritative catalog.
- User accounts, cloud sync, likes, ratings, or social ranking.
- Screenshot generation or executable inline previews.

Those remain intentionally outside V13Hub's current authority boundary because each needs a stronger trust, storage, or publication contract first.
