# Visual Design System — Charts, Illustrations, and Page Composition

Status: 4.4.2 implementation baseline
Prepared: 22 July 2026

## 1. Purpose

The guide needs several visual languages, not one universal renderer. A chart,
a route map, a body or room illustration, and a writable form solve different
reader problems. They should share typography, spacing, accessibility, and
source discipline while retaining forms appropriate to their jobs.

The design system therefore separates:

1. **quantitative charts** — measured comparisons, trends, intervals, and
   deterministic numeric models;
2. **route and topology diagrams** — choices, dependencies, handoffs, and graph
   neighbourhoods;
3. **scientific and spatial illustrations** — mechanisms, rooms, bodies,
   objects, exposure paths, and annotated cutaways;
4. **operational forms** — checklists, logs, message anatomy, writable fields,
   and continuity boards;
5. **orientation and identity graphics** — subguide code, pattern, glyph,
   breadcrumb, and neighbourhood map.

The shared goal is not visual sameness. It is predictable hierarchy and a clear
answer to: **what should the reader notice, and what should they do with it?**

## 2. Why Vega-Lite

Vega-Lite is the default for ordinary quantitative charts because it stores a
chart as a declarative, reviewable specification rather than imperative drawing
code. The specification names fields, transforms, scales, axes, marks, and
encodings. This gives the project several practical advantages:

- data and visual encodings can be reviewed separately;
- the same reviewed table can render deterministic SVG and PNG outputs;
- chart-wide rules can be enforced through one shared theme;
- validators can reject network data, unreviewed sources, duplicated titles,
  missing fallbacks, and colour-only distinctions;
- bars, dots, intervals, lines, and small multiples can be changed without
  rewriting low-level drawing code;
- canonical SVG remains inspectable and receives embedded title and description
  metadata;
- derived data, specification, source IDs, limits, and rendered artifacts remain
  traceable through the visualization catalog.

Vega-Lite is **not** the default for every visual. It should not be forced onto
irregular room cutaways, body diagrams, electrical paths, decision trees, or
complex graph topology. Those belong to generated SVG, Graphviz, semantic HTML,
or deliberately authored illustration.

## 3. Renderer decision matrix

| Reader question | Preferred form | Preferred renderer |
|---|---|---|
| Which value is larger, and by how much? | ranked bars or dots | Vega-Lite |
| How did a measure change over ordered time? | line or small multiples | Vega-Lite |
| What range or uncertainty surrounds an estimate? | dot-and-interval plot | Vega-Lite |
| What depends on what? | directed graph or layered dependency map | Graphviz or generated SVG |
| Which route applies? | decision structure, route matrix, state transition | generated SVG or semantic HTML |
| How does a room, object, body, or exposure path work? | annotated cutaway or mechanism schematic | authored/generated SVG |
| What must be written, checked, or handed over? | semantic table, form, or checklist | HTML/CSS with print adaptation |
| Where am I in the guide family? | local graph, breadcrumb, code/pattern/glyph | generated SVG plus HTML text |

A renderer may be rejected even when technically capable. The selection test is
whether it produces the clearest, most maintainable, most accessible explanation.

## 4. Quantitative-chart contract

### 4.1 Ownership

The **document** owns:

- figure title;
- takeaway;
- practical limit;
- surrounding explanation and table fallback;
- source citation in prose or local end matter;
- placement in the page hierarchy.

The **Vega-Lite specification** owns:

- marks;
- scales;
- axes;
- sorting;
- transformations;
- direct labels;
- uncertainty encodings;
- shape, line, and position distinctions.

The chart image must not bake in a second page title or explanatory paragraph.
Catalog macros produce one consistent figure caption plus a visible “What to
notice / Limit” note in every output format.

### 4.2 Graphic defaults

- Start bar-length scales at zero.
- Prefer dots and intervals when a zero baseline is not the question.
- Sort categories by value or a meaningful natural sequence.
- Use direct labels when they reduce eye travel.
- Keep gridlines light and purposeful; remove decorative axis domains.
- Avoid dual axes, 3D, perspective, gradients, pictorial bars, and exploded pies.
- Use small multiples instead of overlapping many lines.
- Keep comparable panels on comparable scales.
- Show uncertainty where it changes interpretation.
- Put units in axes, labels, or captions rather than expecting inference.
- Use sentence case and concise labels.
- Do not rely on hover, colour, or a legend as the only decoding route.

### 4.3 Accessibility

Every reader-facing chart requires:

- a concise document caption;
- catalog alt text and long description;
- a table or prose fallback;
- at least two non-colour encodings when series must be distinguished;
- sufficient contrast for marks and essential boundaries;
- embedded `<title>` and `<desc>` metadata in canonical SVG;
- useful interpretation without interaction or animation;
- monochrome review in the actual print layout.

## 5. Illustration contract

Illustrations must explain a spatial, causal, or operational relationship that
prose alone makes slow or error-prone. Each illustration begins with a one-line
visual thesis.

### 5.1 Preferred illustration forms

- **Annotated cutaway:** room, plumbing, ventilation, current path, storage, or
  shelter geometry.
- **Mechanism strip:** three to six stages with one visual variable changing.
- **Before / change / compare:** safe observation and mini-experiment figures.
- **Layered system:** physical layer, information layer, and action layer kept
  visibly distinct.
- **Object anatomy:** device, form, emergency card, container, or message with
  callouts.
- **Scenario pair:** safe/unsafe or weak/strong examples with identical framing.

### 5.2 Illustration rules

- Use one dominant reading direction.
- Keep callouts adjacent to the feature they describe.
- Use numbered steps only when order matters.
- Maintain consistent scale across comparison panels.
- Avoid decorative people, mascots, or textures that compete with safety cues.
- Use simplified geometry but never simplify away the action-critical relation.
- Distinguish observed fact, conceptual model, and hypothetical example.
- Design monochrome structure first; add colour as redundant emphasis.
- Provide a complete text route for complex figures.

## 6. Page composition

The page is a sequence of reading decisions, not a container to fill.

### 6.1 Hierarchy

A typical explanatory unit should read:

1. section heading;
2. one-sentence framing or question;
3. figure caption;
4. visual;
5. takeaway and limit;
6. evidence, action, or table fallback.

Do not repeat the same title in the heading, image, caption, and following prose.
Quantitative figures receive a quiet editorial card; route maps and operational
illustrations may use stronger framing where the boundary supports scanning.

### 6.2 Rhythm and density

- Prefer one substantial visual per page region over several competing panels.
- Keep figures close to the paragraph that introduces them.
- Avoid stranded headings and isolated one-line chart notes.
- Preserve writable space as functional content.
- Treat intentional chapter boundaries differently from accidental blank space.
- Review A4, A4/2, large print, colour, and monochrome after each small batch.
- Page growth is accepted only when a visual replaces cognitive work that prose
  or a table previously imposed on the reader.

### 6.3 Typography

- Use a restrained sans-serif chart face compatible with the document face.
- Keep chart labels large enough after final PDF scaling, not merely at source
  canvas size.
- Prefer sentence case and short noun phrases.
- Avoid all-caps body labels and excessive letter spacing.
- Use tabular numerals where aligned quantities benefit.
- Keep captions visually stronger than source/limit notes but weaker than section
  headings.

## 7. 4.4.2 implementation

The initial implementation establishes:

- `src/visualizations/theme.json` as the shared chart theme;
- document-owned chart titles;
- catalog macros for all five reader-facing Vega-Lite figures;
- automatic visible takeaway and practical-limit notes;
- embedded title/description metadata in canonical SVG;
- a clean quantitative-figure page treatment distinct from route/illustration
  cards;
- validation against local duplicated themes, baked-in titles, missing macros,
  missing SVG metadata, output-count drift, excessive automatic tick density,
  essential-mark contrast below 3:1, theme text below 4.5:1, and rendered chart
  text below 11 px before document scaling.

## 8. Next illustration and layout milestones

1. Inventory every non-Vega figure by family, question, renderer, text fallback,
   monochrome strategy, and replacement priority.
2. Redesign the first route-map family with one topology grammar and one symbol
   key.
3. Produce two authored SVG pilots: a small-room air/exposure cutaway and a
   first-aid observation handoff anatomy.
4. Add source/limit rendering from the canonical source registry when subguide
   localization begins.
5. Add automated chart-label clipping, minimum text-size, and contrast checks.
6. Review figure placement in page contact sheets after every four additions or
   redesigns.
7. Test the B and H standalone pilots with the same visual system before moving
   canonical chapter files.

## 9. Acceptance questions

A figure is ready only when reviewers can answer yes to all of these:

- Is its question apparent before reading the surrounding paragraph?
- Is the intended comparison visually dominant?
- Can it be understood in monochrome?
- Are uncertainty and limitations visible where relevant?
- Does it remain legible at actual A4/2 print size?
- Is there a complete non-visual route?
- Is the renderer appropriate to the visual problem?
- Does the figure reduce cognitive work enough to justify its page area?
