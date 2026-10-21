import type { Edge } from "@xyflow/svelte";
import type { CanvasEdge } from "#src/canvas/types.js";

export function serializeFlowEdge(edge: Edge): CanvasEdge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    ...(edge.type && { type: edge.type }),
    ...(edge.label && { label: edge.label }),
    ...(edge.animated && { animated: edge.animated }),
    ...(edge.sourceHandle && {
      sourceHandle: edge.sourceHandle,
    }),
    ...(edge.targetHandle && {
      targetHandle: edge.targetHandle,
    }),
    ...(edge.style && {
      // WHY: xyflow types `Edge["style"]` as a CSS-properties object (or a
      // string, in older shapes); the persisted `CanvasEdge` just wants the
      // properties bag. Narrowed once here.
      style: edge.style as unknown as Record<string, unknown>,
    }),
    ...(edge.data && {
      data: edge.data,
    }),
  };
}

export function serializeFlowEdges(edges: Edge[]): CanvasEdge[] {
  return edges.map(serializeFlowEdge);
}
