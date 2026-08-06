export type CanvasEdgeMeaning =
  | "contains"
  | "references"
  | "depends-on"
  | "derives-from"
  | "sequence-next"
  | "annotates"
  | "contradicts"
  | "supports"
  | "transcludes"
  | "plays-after"
  | "custom";

export interface EdgeSemanticDefinition {
  meaning: CanvasEdgeMeaning;
  direction: "directed" | "undirected";
  description: string;
  toolBehavior: string;
}

export const EDGE_SEMANTICS: Record<CanvasEdgeMeaning, EdgeSemanticDefinition> = {
  contains: {
    meaning: "contains",
    direction: "directed",
    description: "Source item spatially or conceptually contains target item.",
    toolBehavior: "Group, export and collapse operations should include contained targets.",
  },
  references: {
    meaning: "references",
    direction: "directed",
    description: "Source item cites or links to target item without ownership.",
    toolBehavior:
      "Backlink/search tools can traverse both directions; deletion should not cascade.",
  },
  "depends-on": {
    meaning: "depends-on",
    direction: "directed",
    description: "Source item requires target item to be valid or executable.",
    toolBehavior: "Build/run/sort tools should schedule the target before the source.",
  },
  "derives-from": {
    meaning: "derives-from",
    direction: "directed",
    description: "Source item was generated from target item.",
    toolBehavior: "Regeneration/provenance tools can trace source ancestry.",
  },
  "sequence-next": {
    meaning: "sequence-next",
    direction: "directed",
    description: "Source item is followed by target item in an ordered sequence.",
    toolBehavior: "Playlist, slideshow and story tools should traverse in edge order.",
  },
  annotates: {
    meaning: "annotates",
    direction: "directed",
    description: "Source item comments on target item.",
    toolBehavior: "Inspectors can show annotations beside the annotated target.",
  },
  contradicts: {
    meaning: "contradicts",
    direction: "undirected",
    description: "Items express incompatible claims or alternatives.",
    toolBehavior: "Reasoning tools should treat this as a conflict edge.",
  },
  supports: {
    meaning: "supports",
    direction: "directed",
    description: "Source item provides evidence for target item.",
    toolBehavior: "Reasoning tools can aggregate support chains.",
  },
  transcludes: {
    meaning: "transcludes",
    direction: "directed",
    description: "Source item embeds target item content by reference.",
    toolBehavior: "Export/render tools should inline or preview target content.",
  },
  "plays-after": {
    meaning: "plays-after",
    direction: "directed",
    description: "Source media item should play after target item.",
    toolBehavior: "Media tools should order target before source.",
  },
  custom: {
    meaning: "custom",
    direction: "directed",
    description: "Host-defined edge semantics.",
    toolBehavior: "Core preserves the edge; host plugins define behavior.",
  },
};

export interface ParsedGraphEdgeStatement {
  sourceId: string;
  targetId: string;
  meaning: CanvasEdgeMeaning;
  label?: string;
}

const OPERATOR_MEANINGS: Record<string, CanvasEdgeMeaning> = {
  "->": "references",
  "=>": "depends-on",
  "~>": "derives-from",
  "|>": "sequence-next",
  "+>": "supports",
  "!>": "contradicts",
  "@>": "annotates",
  ">>": "plays-after",
};

export function parseGraphEdgeStatement(line: string): ParsedGraphEdgeStatement | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  const match = /^(\S+)\s*(->|=>|~>|\|>|\+>|!>|@>|>>)\s*(\S+)(?:\s*:\s*(.+))?$/.exec(trimmed);
  if (!match) return null;
  return {
    sourceId: match[1],
    targetId: match[3],
    meaning: OPERATOR_MEANINGS[match[2]],
    label: match[4],
  };
}

export function parseGraphEdgeLanguage(source: string): ParsedGraphEdgeStatement[] {
  return source
    .split(/\r?\n/g)
    .map(parseGraphEdgeStatement)
    .filter((edge): edge is ParsedGraphEdgeStatement => !!edge);
}

export interface EdgeLanguageRelationOptions {
  idPrefix?: string;
}

export function graphEdgeStatementToRelation(
  edge: ParsedGraphEdgeStatement,
  index = 0,
  options: EdgeLanguageRelationOptions = {},
) {
  return {
    id: `${options.idPrefix ?? "edge"}-${index + 1}`,
    type: edge.meaning,
    sourceId: edge.sourceId,
    targetId: edge.targetId,
    label: edge.label,
    metadata: { language: "canvas-edge-v1" },
  };
}

export function parseGraphEdgeLanguageToRelations(
  source: string,
  options: EdgeLanguageRelationOptions = {},
) {
  return parseGraphEdgeLanguage(source).map((edge, index) =>
    graphEdgeStatementToRelation(edge, index, options),
  );
}

export function describeEdgeForTool(meaning: CanvasEdgeMeaning): string {
  return EDGE_SEMANTICS[meaning]?.toolBehavior ?? EDGE_SEMANTICS.custom.toolBehavior;
}
