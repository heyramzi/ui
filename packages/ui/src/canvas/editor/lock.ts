// A locked card can be selected, copied and connected, and nothing else. `data.locked` saves,
// rebases and undoes with the card.

import type { Node } from "@xyflow/svelte";
import type { OpLike } from "#src/canvas/plugin.js";

export function isLocked(node: { data?: unknown } | null | undefined): boolean {
  const data = node?.data as Record<string, unknown> | undefined;
  return data?.locked === true;
}

/** What xyflow needs to hold a locked card still. */
export const LOCK_FLAGS = { draggable: false, deletable: false } as const;

/** The card with its flow flags matching `data.locked`. A synced copy keeps its own flags. */
export function withLockFlags<N extends Node>(node: N): N {
  if ((node.data as Record<string, unknown> | undefined)?.syncedCopy) return node;
  if (isLocked(node)) return { ...node, ...LOCK_FLAGS };
  if (node.draggable !== false && node.deletable !== false) return node;
  const { draggable: _drag, deletable: _delete, ...rest } = node;
  return rest as N;
}

/** `locked` alone is the one data change a locked card takes: it is how it comes unlocked. */
function onlyUnlocks(op: OpLike): boolean {
  if (op.kind !== "patchNode") return false;
  const patch = op as {
    data?: Record<string, unknown>;
    style?: unknown;
    width?: unknown;
    height?: unknown;
  };
  return (
    patch.data !== undefined &&
    patch.style === undefined &&
    patch.width === undefined &&
    patch.height === undefined &&
    Object.keys(patch.data).every((key) => key === "locked")
  );
}

/**
 * The one gate every dispatched edit passes: ops that don't reach a locked card. An op on an
 * arrow, or a card not on the board, passes.
 */
export function refuseLockedOps<Op extends OpLike>(
  nodes: readonly Node[],
  ops: readonly Op[],
): Op[] {
  const locked = new Set(nodes.filter(isLocked).map((node) => node.id));
  if (locked.size === 0) return [...ops];
  return ops.filter((op) => {
    const nodeId = (op as { nodeId?: unknown }).nodeId;
    return typeof nodeId !== "string" || !locked.has(nodeId) || onlyUnlocks(op);
  });
}

/** Of these ids, the ones a delete may take: not locked, and not a group holding something locked. */
export function deletableIds(nodes: readonly Node[], ids: readonly string[]): string[] {
  const parentOf = new Map(nodes.map((node) => [node.id, node.parentId]));
  const holdsLocked = new Set<string>();
  for (const node of nodes) {
    if (!isLocked(node)) continue;
    for (let up = node.parentId; up; up = parentOf.get(up)) holdsLocked.add(up);
  }
  const byId = new Map(nodes.map((node) => [node.id, node]));
  return ids.filter((id) => !isLocked(byId.get(id)) && !holdsLocked.has(id));
}

/** The board with the picked cards locked, or all unlocked when every one of them already was locked. */
export function toggleLock(
  nodes: readonly Node[],
  picked: ReadonlySet<string>,
): { nodes: Node[]; locked: boolean } | null {
  const targets = nodes.filter(
    (node) => picked.has(node.id) && !(node.data as { syncedCopy?: unknown }).syncedCopy,
  );
  if (targets.length === 0) return null;
  const locked = !targets.every(isLocked);
  const ids = new Set(targets.map((node) => node.id));
  return {
    locked,
    nodes: nodes.map((node) =>
      ids.has(node.id) ? withLockFlags({ ...node, data: { ...node.data, locked } }) : node,
    ),
  };
}
