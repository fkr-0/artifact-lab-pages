import { type CanvasRelation, createCanvasDocument, relationSegments } from "@/canvas-core";
import type { CanvasItem } from "@/types";
import { useMemo } from "react";

interface Props {
  items: CanvasItem[];
  relations: CanvasRelation[];
}

const COLOUR_BY_TYPE: Record<string, string> = {
  contains: "#ffd43b",
  references: "#74c0fc",
  "depends-on": "#ff922b",
  "derives-from": "#b197fc",
  "sequence-next": "#63e6be",
  annotates: "#ffa8a8",
  contradicts: "#ff6b6b",
  supports: "#8ce99a",
  transcludes: "#91a7ff",
  "plays-after": "#66d9e8",
  custom: "#adb5bd",
};

function colourForType(type: string): string {
  return COLOUR_BY_TYPE[type] ?? COLOUR_BY_TYPE.custom;
}

export function RelationOverlay({ items, relations }: Props) {
  const segments = useMemo(
    () => relationSegments(createCanvasDocument(items, { relations })),
    [items, relations],
  );

  if (segments.length === 0) return null;

  return (
    <svg className="cs-relation-overlay" aria-hidden="true">
      <defs>
        {Object.entries(COLOUR_BY_TYPE).map(([type, colour]) => (
          <marker
            key={type}
            id={`cs-arrow-${type}`}
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="5"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={colour} opacity="0.78" />
          </marker>
        ))}
      </defs>
      {segments.map((segment) => {
        const colour = colourForType(segment.type);
        const dx = segment.x2 - segment.x1;
        const dy = segment.y2 - segment.y1;
        const length = Math.hypot(dx, dy) || 1;
        const nx = (-dy / length) * 18;
        const ny = (dx / length) * 18;
        const cx = (segment.x1 + segment.x2) / 2 + nx;
        const cy = (segment.y1 + segment.y2) / 2 + ny;
        const path = `M ${segment.x1} ${segment.y1} Q ${cx} ${cy} ${segment.x2} ${segment.y2}`;
        return (
          <g key={segment.relationId} className="cs-relation-edge">
            <path
              d={path}
              fill="none"
              stroke={colour}
              strokeWidth="2"
              strokeOpacity="0.72"
              vectorEffect="non-scaling-stroke"
              markerEnd={`url(#cs-arrow-${segment.type in COLOUR_BY_TYPE ? segment.type : "custom"})`}
            />
            <circle
              cx={segment.x1}
              cy={segment.y1}
              r="4"
              fill={colour}
              opacity="0.82"
              vectorEffect="non-scaling-stroke"
            />
            {segment.label && (
              <text
                x={cx}
                y={cy - 6}
                className="cs-relation-label"
                fill={colour}
                textAnchor="middle"
                vectorEffect="non-scaling-stroke"
              >
                {segment.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
