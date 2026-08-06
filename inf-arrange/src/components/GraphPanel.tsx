import {
  type CanvasRelation,
  EDGE_SEMANTICS,
  createCanvasDocument,
  documentStats,
  mediaStats,
  parseGraphEdgeLanguageToRelations,
  playlistSequence,
} from "@/canvas-core";
import { useCanvasStore } from "@/store/canvas";
import {
  Alert,
  Badge,
  Button,
  Drawer,
  Group,
  ScrollArea,
  Stack,
  Table,
  Text,
  Textarea,
} from "@mantine/core";
import { useEffect, useMemo, useState } from "react";

interface Props {
  opened: boolean;
  onClose: () => void;
}

const OPERATOR_BY_TYPE: Record<string, string> = {
  references: "->",
  "depends-on": "=>",
  "derives-from": "~>",
  "sequence-next": "|>",
  supports: "+>",
  contradicts: "!>",
  annotates: "@>",
  "plays-after": ">>",
};

function relationToEdgeLine(relation: CanvasRelation): string {
  const op = OPERATOR_BY_TYPE[relation.type ?? "references"] ?? "->";
  const label = relation.label ? ` : ${relation.label}` : "";
  return `${relation.sourceId} ${op} ${relation.targetId}${label}`;
}

function relationsToEdgeLanguage(relations: CanvasRelation[]): string {
  return relations.map(relationToEdgeLine).join("\n");
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function GraphPanel({ opened, onClose }: Props) {
  const items = useCanvasStore((s) => s.items);
  const relations = useCanvasStore((s) => s.relations);
  const setRelations = useCanvasStore((s) => s.setRelations);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!opened) return;
    setDraft(relationsToEdgeLanguage(relations));
    setError(null);
  }, [opened, relations]);

  const document = useMemo(
    () => createCanvasDocument(items, { relations, createdAt: "", updatedAt: "" }),
    [items, relations],
  );
  const stats = useMemo(() => documentStats(document), [document]);
  const media = useMemo(() => mediaStats(document), [document]);
  const sequence = useMemo(() => playlistSequence(document).map((item) => item.id), [document]);
  const relationTypes = useMemo(() => {
    const counts = new Map<string, number>();
    for (const relation of relations) {
      const type = relation.type ?? "custom";
      counts.set(type, (counts.get(type) ?? 0) + 1);
    }
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [relations]);

  const applyDraft = () => {
    try {
      const next = parseGraphEdgeLanguageToRelations(draft, { idPrefix: "edge" });
      const itemIds = new Set(items.map((item) => item.id));
      const dangling = next.filter(
        (relation) => !itemIds.has(relation.sourceId) || !itemIds.has(relation.targetId),
      );
      if (dangling.length > 0) {
        setError(
          `Dangling edge endpoint(s): ${dangling
            .map((relation) => `${relation.sourceId} -> ${relation.targetId}`)
            .join(", ")}`,
        );
        return;
      }
      setRelations(next);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <Drawer opened={opened} onClose={onClose} title="Graph + stats" position="right" size="lg">
      <Stack gap="sm">
        <Group gap="xs">
          <Badge variant="light">{stats.itemCount} items</Badge>
          <Badge variant="light">{stats.relationCount} edges</Badge>
          <Badge variant="light">{media.mediaItemCount} media</Badge>
          <Badge variant="light">{formatDuration(media.totalDurationMs)} media duration</Badge>
        </Group>

        <Textarea
          label="Edge language"
          description="source operator target : optional label — e.g. intro |> verse : next"
          autosize
          minRows={8}
          maxRows={16}
          value={draft}
          onChange={(event) => setDraft(event.currentTarget.value)}
          styles={{ input: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" } }}
        />
        <Group justify="space-between">
          <Button
            size="xs"
            variant="light"
            onClick={() => setDraft(relationsToEdgeLanguage(relations))}
          >
            Reset draft
          </Button>
          <Button size="xs" onClick={applyDraft}>
            Apply relations
          </Button>
        </Group>
        {error && (
          <Alert color="red" variant="light">
            {error}
          </Alert>
        )}

        <Text size="sm" fw={600}>
          Relation types
        </Text>
        <Group gap="xs">
          {relationTypes.length === 0 ? (
            <Text size="xs" c="dimmed">
              No graph edges yet.
            </Text>
          ) : (
            relationTypes.map(([type, count]) => (
              <Badge key={type} variant="outline">
                {type}: {count}
              </Badge>
            ))
          )}
        </Group>

        <Text size="sm" fw={600}>
          Sequence preview
        </Text>
        <Text size="xs" c="dimmed">
          {sequence.length > 0
            ? sequence.join(" → ")
            : "No sequence-next / plays-after chain found."}
        </Text>

        <Text size="sm" fw={600}>
          Edge operators
        </Text>
        <ScrollArea h={220} offsetScrollbars>
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Meaning</Table.Th>
                <Table.Th>Direction</Table.Th>
                <Table.Th>Tool behavior</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {Object.values(EDGE_SEMANTICS).map((semantic) => (
                <Table.Tr key={semantic.meaning}>
                  <Table.Td>{semantic.meaning}</Table.Td>
                  <Table.Td>{semantic.direction}</Table.Td>
                  <Table.Td>{semantic.toolBehavior}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Stack>
    </Drawer>
  );
}
