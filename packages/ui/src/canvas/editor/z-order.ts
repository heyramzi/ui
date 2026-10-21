// Stacking order for cards: pure functions over nodes. A card's place is its `zIndex` (missing
// is 0), and array order breaks a tie, as xyflow paints equal layers.

import type { Node } from "@xyflow/svelte";

export type StackMove = "forward" | "backward" | "front" | "back";

/** Ink is an annotation layer pinned above every card by pen.css, so it has no place in a stack. */
export const INK_TYPES: ReadonlySet<string> = new Set(["stroke", "text", "shape"]);

type Slot = { node: Node; index: number };

function layerOf(node: Node): number {
  return typeof node.zIndex === "number" ? node.zIndex : 0;
}

/** Cards stack among their siblings: a child never leaves its group's own stack. */
function stacks(nodes: readonly Node[]): Map<string, Slot[]> {
  const byParent = new Map<string, Slot[]>();
  nodes.forEach((node, index) => {
    if (INK_TYPES.has(node.type ?? "")) return;
    const key = node.parentId ?? "";
    const stack = byParent.get(key) ?? [];
    stack.push({ node, index });
    byParent.set(key, stack);
  });
  for (const stack of byParent.values()) {
    stack.sort((a, b) => layerOf(a.node) - layerOf(b.node) || a.index - b.index);
  }
  return byParent;
}

/** One stack after a move, bottom first. Selected cards keep their order among themselves. */
function moved(stack: Slot[], picked: ReadonlySet<string>, move: StackMove): Slot[] {
  const isPicked = (slot: Slot) => picked.has(slot.node.id);
  if (move === "front") return [...stack.filter((s) => !isPicked(s)), ...stack.filter(isPicked)];
  if (move === "back") return [...stack.filter(isPicked), ...stack.filter((s) => !isPicked(s))];
  const next = [...stack];
  // One step: each picked card trades places with the unpicked card beside it.
  if (move === "forward") {
    for (let i = next.length - 2; i >= 0; i--) {
      if (isPicked(next[i]) && !isPicked(next[i + 1]))
        [next[i], next[i + 1]] = [next[i + 1], next[i]];
    }
  } else {
    for (let i = 1; i < next.length; i++) {
      if (isPicked(next[i]) && !isPicked(next[i - 1]))
        [next[i], next[i - 1]] = [next[i - 1], next[i]];
    }
  }
  return next;
}

/**
 * The board after a stacking move, or null when nothing changes. Only a stack holding a
 * picked card is touched, and only cards whose layer changed are rewritten.
 */
export function reorderStack(
  nodes: readonly Node[],
  picked: ReadonlySet<string>,
  move: StackMove,
): Node[] | null {
  const layers = new Map<string, number>();
  for (const stack of stacks(nodes).values()) {
    if (!stack.some((slot) => picked.has(slot.node.id))) continue;
    const next = moved(stack, picked, move);
    if (next.every((slot, i) => slot === stack[i])) continue;
    next.forEach((slot, rank) => {
      if (layerOf(slot.node) !== rank) layers.set(slot.node.id, rank);
    });
  }
  if (layers.size === 0) return null;
  return nodes.map((node) => {
    const layer = layers.get(node.id);
    return layer === undefined ? node : { ...node, zIndex: layer };
  });
}

/** The layer a new card needs to land on top of its siblings, or undefined while no card has been raised. */
export function topLayer(nodes: readonly Node[], parentId?: string): number | undefined {
  let top = 0;
  for (const node of nodes) {
    if (INK_TYPES.has(node.type ?? "") || (node.parentId ?? "") !== (parentId ?? "")) continue;
    top = Math.max(top, layerOf(node));
  }
  return top > 0 ? top + 1 : undefined;
}
