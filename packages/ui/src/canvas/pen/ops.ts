// The two ops the pen layer emits. They match the editor's addNode and removeNode
// ops, so a stroke goes through applyOps like any card and the history sees it.

import type { PenNodeInput } from "#src/canvas/pen/types.js";

export type PenOp =
  | { kind: "addNode"; node: PenNodeInput<Record<string, unknown>> }
  | { kind: "removeNode"; nodeId: string };

export function addPenNode(node: PenNodeInput<Record<string, unknown>>): PenOp {
  return { kind: "addNode", node: { ...node, id: node.id ?? crypto.randomUUID() } };
}

export function removePenNode(nodeId: string): PenOp {
  return { kind: "removeNode", nodeId };
}
