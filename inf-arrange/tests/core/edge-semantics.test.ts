import {
  EDGE_SEMANTICS,
  describeEdgeForTool,
  parseGraphEdgeLanguage,
  parseGraphEdgeLanguageToRelations,
} from "../../src/canvas-core";
import { assertDeepEqual, assertEqual } from "./assertions";

export function testGraphEdgeLanguageParsesToolSemanticOperators(): void {
  const edges = parseGraphEdgeLanguage(`
    # comments ignored
    note-1 -> link-1 : cites
    track-1 |> track-2 : next song
    claim !> counter-claim
    clip => source
  `);

  assertEqual(edges.length, 4);
  assertDeepEqual(
    edges.map((edge) => edge.meaning),
    ["references", "sequence-next", "contradicts", "depends-on"],
  );
  assertEqual(EDGE_SEMANTICS["sequence-next"].direction, "directed");
}

export function testGraphEdgeLanguageCanMaterializeCanvasRelations(): void {
  const relations = parseGraphEdgeLanguageToRelations("a |> b : next", { idPrefix: "seq" });

  assertDeepEqual(relations, [
    {
      id: "seq-1",
      type: "sequence-next",
      sourceId: "a",
      targetId: "b",
      label: "next",
      metadata: { language: "canvas-edge-v1" },
    },
  ]);
  assertEqual(describeEdgeForTool("depends-on").includes("schedule"), true);
}
