// The eraser hits whole strokes only, so a swipe across a big shape never wipes it.

import { distanceToStroke, type Pt } from "#src/canvas/pen/geometry.js";
import { STROKE_NODE, type StrokeData } from "#src/canvas/pen/types.js";

export interface ErasableNode {
  id: string;
  type?: string;
  position: Pt;
  data: Record<string, unknown>;
}

function isStrokeData(data: Record<string, unknown>): data is StrokeData {
  return Array.isArray(data.points) && typeof data.size === "number";
}

/** Ids of the strokes whose line passes within `radius` of `at`, a flow-space point. */
export function strokesUnder(nodes: readonly ErasableNode[], at: Pt, radius: number): string[] {
  const hits: string[] = [];
  for (const node of nodes) {
    if (node.type !== STROKE_NODE || !isStrokeData(node.data)) continue;
    const local = { x: at.x - node.position.x, y: at.y - node.position.y };
    if (distanceToStroke(node.data.points, local) <= radius + node.data.size / 2) {
      hits.push(node.id);
    }
  }
  return hits;
}

/** The same test along a swipe, so a fast pointer can't skip over a thin line. */
export function strokesAlong(
  nodes: readonly ErasableNode[],
  from: Pt,
  to: Pt,
  radius: number,
): string[] {
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(1, Math.ceil(length / Math.max(radius / 2, 1)));
  const hits = new Set<string>();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const at = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
    for (const id of strokesUnder(nodes, at, radius)) hits.add(id);
  }
  return [...hits];
}
