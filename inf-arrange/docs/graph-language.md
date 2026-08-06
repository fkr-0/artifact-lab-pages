# Canvas Graph Language and Edge Semantics

Canvas relations are typed edges between item IDs. They allow tools to reason about a canvas as more than geometry: a playlist, argument map, dependency graph, storyboard, provenance graph or nested document.

## Mini language

Each non-empty non-comment line has this shape:

```text
source operator target : optional label
```

Supported operators:

| Operator | Meaning | Tool interpretation |
| --- | --- | --- |
| `->` | `references` | Source cites target. Delete should not cascade. |
| `=>` | `depends-on` | Target should be scheduled before source. |
| `~>` | `derives-from` | Source was generated from target. |
| `|>` | `sequence-next` | Source is followed by target. |
| `+>` | `supports` | Source provides evidence for target. |
| `!>` | `contradicts` | Items are in conflict. |
| `@>` | `annotates` | Source comments on target. |
| `>>` | `plays-after` | Source media plays after target. |

Example:

```text
intro |> verse : next section
mixdown ~> stems : rendered from stems
claim +> thesis
counter !> claim
track-b >> track-a
```

## Semantics for tools

Edges are not just labels. They define expected behavior:

- `contains`: grouping, collapse and export should include contained targets.
- `references`: backlink/search tools traverse both ways; deletion does not cascade.
- `depends-on`: build/run/order tools schedule target before source.
- `derives-from`: provenance/regeneration tools trace ancestry.
- `sequence-next`: playlist, slideshow and story tools traverse forward.
- `annotates`: inspectors can display source as comment on target.
- `contradicts`: reasoning tools treat this as a conflict edge.
- `supports`: reasoning tools aggregate support chains.
- `transcludes`: exporters/renderers may inline target content.
- `plays-after`: media tools order target before source.
- `custom`: preserved for host/plugin interpretation.

## Implementation notes

The parser lives in `src/canvas-core/edge-semantics.ts`. It can return parsed edge statements or materialized `CanvasRelation` objects with stable IDs. Higher-level graph operations live in `src/canvas-core/graph.ts`.

## Canvas overlay

Runtime relations are now visible on the canvas as curved directed edges. The overlay is intentionally read-only for now: editing still happens through the Graph panel's edge-language text area so the model stays explicit and easy to serialize. Future work should add direct edge handles for drawing and retargeting edges.
