import type { CanvasNode } from "#src/canvas/types.js";

/**
 * Align nodes horizontally (same row): set all to the topmost Y.
 */
export function alignNodesHorizontally(nodes: CanvasNode[]): void {
  if (nodes.length < 2) return;
  const targetY = Math.min(...nodes.map((n) => n.position.y));
  for (const node of nodes) {
    node.position = { ...node.position, y: targetY };
  }
}

/**
 * Align nodes vertically (same column): set all to the leftmost X.
 */
export function alignNodesVertically(nodes: CanvasNode[]): void {
  if (nodes.length < 2) return;
  const targetX = Math.min(...nodes.map((n) => n.position.x));
  for (const node of nodes) {
    node.position = { ...node.position, x: targetX };
  }
}
