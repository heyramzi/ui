// Pure diff/apply core for diagram history. Each entry holds only the touched
// nodes and edges, so ops, layouts and xyflow's own writes share one mechanism.

import type { Node, Edge } from "@xyflow/svelte";
import { sortParentsFirst } from "#src/canvas/headless/canvas-cleanup.js";

export type FlowState = { nodes: Node[]; edges: Edge[] };

/** Each side's id sequence, kept only when the step changed it. */
export type IdOrder = { before: string[]; after: string[] };

export type HistoryEntry = {
  nodesBefore: Node[];
  nodesAfter: Node[];
  edgesBefore: Edge[];
  edgesAfter: Edge[];
  // WHY: array order is data. Node order is stacking, edge order is mind map child order.
  nodeOrder?: IdOrder;
  edgeOrder?: IdOrder;
};

// Fields that churn without changing the document. Stripped, so selecting isn't
// an undo step and undo doesn't restore a stale selection.
const VOLATILE_NODE_FIELDS = new Set(["selected", "dragging", "measured", "resizing"]);
const VOLATILE_EDGE_FIELDS = new Set(["selected"]);

function stripVolatile<T extends Record<string, unknown>>(record: T, volatile: Set<string>): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (volatile.has(key) || value === undefined) continue;
    out[key] = value;
  }
  return out as T;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function signature(record: Record<string, unknown>, volatile: Set<string>): string {
  return JSON.stringify(stripVolatile(record, volatile));
}

/** True when two versions of a card differ only in fields that churn without changing the document. */
export function isSameNode(a: Node, b: Node): boolean {
  return (
    a === b ||
    signature(a as Record<string, unknown>, VOLATILE_NODE_FIELDS) ===
      signature(b as Record<string, unknown>, VOLATILE_NODE_FIELDS)
  );
}

export function isSameEdge(a: Edge, b: Edge): boolean {
  return (
    a === b ||
    signature(a as Record<string, unknown>, VOLATILE_EDGE_FIELDS) ===
      signature(b as Record<string, unknown>, VOLATILE_EDGE_FIELDS)
  );
}

function diffOrder(base: { id: string }[], current: { id: string }[]): IdOrder | undefined {
  const before = base.map((item) => item.id);
  const after = current.map((item) => item.id);
  const same = before.length === after.length && before.every((id, i) => id === after[i]);
  return same ? undefined : { before, after };
}

function diffCollection<T extends { id: string }>(
  base: T[],
  current: T[],
  volatile: Set<string>,
): { before: T[]; after: T[] } {
  const baseById = new Map(base.map((item) => [item.id, item]));
  const currentById = new Map(current.map((item) => [item.id, item]));
  const before: T[] = [];
  const after: T[] = [];

  for (const item of base) {
    const counterpart = currentById.get(item.id);
    if (!counterpart) {
      before.push(clone(stripVolatile(item as Record<string, unknown>, volatile) as T));
      continue;
    }
    // The same object is the same card: an untouched card costs nothing, however big the board.
    if (
      item !== counterpart &&
      signature(item as Record<string, unknown>, volatile) !==
        signature(counterpart as Record<string, unknown>, volatile)
    ) {
      before.push(clone(stripVolatile(item as Record<string, unknown>, volatile) as T));
      after.push(clone(stripVolatile(counterpart as Record<string, unknown>, volatile) as T));
    }
  }
  for (const item of current) {
    if (!baseById.has(item.id)) {
      after.push(clone(stripVolatile(item as Record<string, unknown>, volatile) as T));
    }
  }
  return { before, after };
}

/**
 * Diff two flow states into a history entry, or null when nothing changed. An order change
 * alone is no step, so a bare reshuffle adds no undo entry.
 */
export function diffFlowState(base: FlowState, current: FlowState): HistoryEntry | null {
  const nodes = diffCollection(base.nodes, current.nodes, VOLATILE_NODE_FIELDS);
  const edges = diffCollection(base.edges, current.edges, VOLATILE_EDGE_FIELDS);
  if (
    nodes.before.length === 0 &&
    nodes.after.length === 0 &&
    edges.before.length === 0 &&
    edges.after.length === 0
  ) {
    return null;
  }
  const nodeOrder = diffOrder(base.nodes, current.nodes);
  const edgeOrder = diffOrder(base.edges, current.edges);
  return {
    nodesBefore: nodes.before,
    nodesAfter: nodes.after,
    edgesBefore: edges.before,
    edgesAfter: edges.after,
    ...(nodeOrder && { nodeOrder }),
    ...(edgeOrder && { edgeOrder }),
  };
}

/** Stable sort into `order`. An id the entry never saw keeps its place after the known ones. */
function sortByOrder<T extends { id: string }>(items: T[], order: string[] | undefined): T[] {
  if (!order) return items;
  const rank = new Map(order.map((id, index) => [id, index]));
  const at = (item: T) => rank.get(item.id) ?? order.length;
  return items.toSorted((a, b) => at(a) - at(b));
}

/** Only a child ahead of its parent breaks SvelteFlow, so a valid order is never regrouped. */
function parentsFirst(nodes: Node[]): Node[] {
  const seen = new Set<string>();
  const ids = new Set(nodes.map((node) => node.id));
  for (const node of nodes) {
    if (node.parentId && ids.has(node.parentId) && !seen.has(node.parentId)) {
      return sortParentsFirst(nodes);
    }
    seen.add(node.id);
  }
  return nodes;
}

function applyCollection<T extends { id: string }>(items: T[], restore: T[], discard: T[]): T[] {
  const restoreById = new Map(restore.map((item) => [item.id, item]));
  const discardIds = new Set(discard.map((item) => item.id));
  // Drop pure additions of the direction being reverted.
  let next = items.filter((item) => !(discardIds.has(item.id) && !restoreById.has(item.id)));
  // Restore changed items in place.
  const present = new Set(next.map((item) => item.id));
  next = next.map((item) => {
    const restored = restoreById.get(item.id);
    if (!restored) return item;
    // Selection is where you are, not what the document held, so an undo leaves it be.
    const selected = (item as { selected?: boolean }).selected;
    return { ...clone(restored), ...(selected !== undefined && { selected }) };
  });
  // Re-add items that were removed in the direction being reverted.
  for (const item of restore) {
    if (!present.has(item.id)) next.push(clone(item));
  }
  return next;
}

/** Apply a history entry to a state: "undo" restores the before side, "redo" the after side. */
export function applyHistoryEntry(
  state: FlowState,
  entry: HistoryEntry,
  direction: "undo" | "redo",
): FlowState {
  const [restoreNodes, discardNodes] =
    direction === "undo"
      ? [entry.nodesBefore, entry.nodesAfter]
      : [entry.nodesAfter, entry.nodesBefore];
  const [restoreEdges, discardEdges] =
    direction === "undo"
      ? [entry.edgesBefore, entry.edgesAfter]
      : [entry.edgesAfter, entry.edgesBefore];
  const side = direction === "undo" ? "before" : "after";

  return {
    // WHY parentsFirst: SvelteFlow requires parents before children; a
    // re-added container must land ahead of the children it re-adopts.
    nodes: parentsFirst(
      sortByOrder(
        applyCollection(state.nodes, restoreNodes, discardNodes),
        entry.nodeOrder?.[side],
      ),
    ),
    edges: sortByOrder(
      applyCollection(state.edges, restoreEdges, discardEdges),
      entry.edgeOrder?.[side],
    ),
  };
}

/** An id's earliest before and latest after, so a node touched by both steps keeps its outer states. */
function mergeSides<T extends { id: string }>(
  first: { before: T[]; after: T[] },
  second: { before: T[]; after: T[] },
): { before: T[]; after: T[] } {
  const firstTouched = new Set([...first.before, ...first.after].map((item) => item.id));
  const secondTouched = new Set([...second.before, ...second.after].map((item) => item.id));
  const before = [...first.before, ...second.before.filter((item) => !firstTouched.has(item.id))];
  const after = [...first.after.filter((item) => !secondTouched.has(item.id)), ...second.after];
  return { before, after };
}

function sameIds(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

/** No order change on one side means that step left the order alone, so the other side's end stands in. */
function mergeOrder(first: IdOrder | undefined, second: IdOrder | undefined): IdOrder | undefined {
  const before = first?.before ?? second?.before;
  const after = second?.after ?? first?.after;
  if (!before || !after) return undefined;
  return sameIds(before, after) ? undefined : { before, after };
}

/** Fold two consecutive steps into one: undoing it restores the state before `first`. */
export function mergeHistoryEntries(first: HistoryEntry, second: HistoryEntry): HistoryEntry {
  const nodes = mergeSides(
    { before: first.nodesBefore, after: first.nodesAfter },
    { before: second.nodesBefore, after: second.nodesAfter },
  );
  const edges = mergeSides(
    { before: first.edgesBefore, after: first.edgesAfter },
    { before: second.edgesBefore, after: second.edgesAfter },
  );
  const nodeOrder = mergeOrder(first.nodeOrder, second.nodeOrder);
  const edgeOrder = mergeOrder(first.edgeOrder, second.edgeOrder);
  return {
    nodesBefore: nodes.before,
    nodesAfter: nodes.after,
    edgesBefore: edges.before,
    edgesAfter: edges.after,
    ...(nodeOrder && { nodeOrder }),
    ...(edgeOrder && { edgeOrder }),
  };
}
