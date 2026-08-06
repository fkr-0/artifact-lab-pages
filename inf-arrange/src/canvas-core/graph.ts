import type { CanvasDocument, CanvasDocumentItem } from "./document";

export interface CanvasDocumentStats {
  itemCount: number;
  relationCount: number;
  typeCounts: Record<string, number>;
  totalArea: number;
  zMin: number;
  zMax: number;
}

export function countItemsByType(items: CanvasDocumentItem[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) counts[item.type] = (counts[item.type] ?? 0) + 1;
  return counts;
}

export function documentStats(document: CanvasDocument): CanvasDocumentStats {
  let totalArea = 0;
  let zMin = Number.POSITIVE_INFINITY;
  let zMax = Number.NEGATIVE_INFINITY;
  for (const item of document.items) {
    totalArea += item.frame.width * item.frame.height;
    const z = item.frame.zIndex ?? 0;
    zMin = Math.min(zMin, z);
    zMax = Math.max(zMax, z);
  }
  return {
    itemCount: document.items.length,
    relationCount: document.relations?.length ?? 0,
    typeCounts: countItemsByType(document.items),
    totalArea,
    zMin: Number.isFinite(zMin) ? zMin : 0,
    zMax: Number.isFinite(zMax) ? zMax : 0,
  };
}

export function relatedItems(document: CanvasDocument, itemId: string): CanvasDocumentItem[] {
  const relatedIds = new Set<string>();
  for (const relation of document.relations ?? []) {
    if (relation.sourceId === itemId) relatedIds.add(relation.targetId);
    if (relation.targetId === itemId) relatedIds.add(relation.sourceId);
  }
  return document.items.filter((item) => relatedIds.has(item.id));
}

export interface CanvasMediaStats {
  mediaItemCount: number;
  totalDurationMs: number;
  missingSourceRefs: string[];
  duplicateSourceRefs: string[];
}

function numberData(item: CanvasDocumentItem, key: string): number | undefined {
  const value = item.data[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function stringData(item: CanvasDocumentItem, key: string): string | undefined {
  const value = item.data[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function isMediaItem(item: CanvasDocumentItem): boolean {
  return item.type === "audio" || item.type === "video" || typeof item.data.durationMs === "number";
}

export function mediaStats(document: CanvasDocument): CanvasMediaStats {
  let mediaItemCount = 0;
  let totalDurationMs = 0;
  const missingSourceRefs: string[] = [];
  const sourceCounts = new Map<string, number>();

  for (const item of document.items) {
    if (!isMediaItem(item)) continue;
    mediaItemCount += 1;
    totalDurationMs += numberData(item, "durationMs") ?? 0;
    const sourceRef = stringData(item, "sourceRef");
    if (!sourceRef) {
      missingSourceRefs.push(item.id);
      continue;
    }
    sourceCounts.set(sourceRef, (sourceCounts.get(sourceRef) ?? 0) + 1);
  }

  return {
    mediaItemCount,
    totalDurationMs,
    missingSourceRefs,
    duplicateSourceRefs: [...sourceCounts.entries()]
      .filter(([, count]) => count > 1)
      .map(([sourceRef]) => sourceRef),
  };
}

function sequenceRelationTargets(document: CanvasDocument): Map<string, string> {
  const targets = new Map<string, string>();
  for (const relation of document.relations ?? []) {
    if (relation.type !== "sequence-next" && relation.type !== "plays-after") continue;
    if (relation.type === "sequence-next") targets.set(relation.sourceId, relation.targetId);
    else targets.set(relation.targetId, relation.sourceId);
  }
  return targets;
}

function inferSequenceStart(nextById: Map<string, string>): string | undefined {
  const targets = new Set(nextById.values());
  for (const sourceId of nextById.keys()) {
    if (!targets.has(sourceId)) return sourceId;
  }
  return nextById.keys().next().value;
}

export function playlistSequence(document: CanvasDocument, startId?: string): CanvasDocumentItem[] {
  const itemsById = new Map(document.items.map((item) => [item.id, item]));
  const nextById = sequenceRelationTargets(document);
  const firstId = startId ?? inferSequenceStart(nextById);
  if (!firstId) return [];

  const sequence: CanvasDocumentItem[] = [];
  const seen = new Set<string>();
  let cursor: string | undefined = firstId;
  while (cursor && !seen.has(cursor)) {
    seen.add(cursor);
    const item = itemsById.get(cursor);
    if (!item) break;
    sequence.push(item);
    cursor = nextById.get(cursor);
  }
  return sequence;
}

export interface CanvasRelationSegment {
  relationId: string;
  type: string;
  sourceId: string;
  targetId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
}

export function relationSegments(document: CanvasDocument): CanvasRelationSegment[] {
  const itemsById = new Map(document.items.map((item) => [item.id, item]));
  const segments: CanvasRelationSegment[] = [];
  for (const relation of document.relations ?? []) {
    const source = itemsById.get(relation.sourceId);
    const target = itemsById.get(relation.targetId);
    if (!source || !target) continue;
    segments.push({
      relationId: relation.id,
      type: relation.type ?? "custom",
      sourceId: relation.sourceId,
      targetId: relation.targetId,
      x1: source.frame.x + source.frame.width / 2,
      y1: source.frame.y + source.frame.height / 2,
      x2: target.frame.x + target.frame.width / 2,
      y2: target.frame.y + target.frame.height / 2,
      label: relation.label,
    });
  }
  return segments;
}
