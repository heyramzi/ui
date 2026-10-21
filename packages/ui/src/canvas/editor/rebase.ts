// Conflict rebase for the autosave PUT. On a 409, local changes since the last
// save replay as ops on the server document, instead of overwriting the other writer.

import { tryCatch } from "#src/lib/result.js";
import { applyOps, type CanvasOp } from "#src/canvas/ops/ops.js";
import type { RawCanvasData } from "#src/canvas/types.js";
import { sortParentsFirst } from "#src/canvas/headless/canvas-cleanup.js";

type DocNode = Record<string, unknown> & {
  id: string;
  position?: { x: number; y: number };
  parentId?: string;
  data?: Record<string, unknown>;
  style?: unknown;
  width?: unknown;
  height?: unknown;
  type?: unknown;
};
type DocEdge = Record<string, unknown> & { id: string };
export type DiagramDoc = { nodes: DocNode[]; edges: DocEdge[] };

const EDGE_PATCH_FIELDS = [
  "source",
  "target",
  "label",
  "animated",
  "type",
  "style",
  "sourceHandle",
  "targetHandle",
] as const;

function json(value: unknown): string {
  return JSON.stringify(value ?? null);
}

type SizePatch = { style?: Record<string, unknown>; width?: number; height?: number };

function objectStyle(node: DocNode): Record<string, unknown> | undefined {
  return node.style && typeof node.style === "object"
    ? (node.style as Record<string, unknown>)
    : undefined;
}

function numberOrUndefined(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function addNodeOp(node: DocNode): CanvasOp {
  const style = objectStyle(node);
  const width = numberOrUndefined(node.width);
  const height = numberOrUndefined(node.height);
  return {
    kind: "addNode",
    node: {
      id: node.id,
      type: String(node.type ?? "node"),
      position: node.position ?? { x: 0, y: 0 },
      data: node.data ?? {},
      ...(style ? { style } : {}),
      ...(width !== undefined ? { width } : {}),
      ...(height !== undefined ? { height } : {}),
      ...(node.parentId ? { parentId: node.parentId } : {}),
    },
  };
}

function sizePatchOf(before: DocNode, node: DocNode): SizePatch {
  const patch: SizePatch = {};
  const style = objectStyle(node);
  if (style && json(before.style) !== json(node.style)) patch.style = style;
  const width = numberOrUndefined(node.width);
  if (width !== undefined && before.width !== node.width) patch.width = width;
  const height = numberOrUndefined(node.height);
  if (height !== undefined && before.height !== node.height) patch.height = height;
  return patch;
}

/** Only the top-level keys local changed, so a key the server edited alone keeps its value. */
function changedData(
  before: Record<string, unknown> | undefined,
  data: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!data) return undefined;
  const changed = Object.entries(data).filter(
    ([key, value]) => json(before?.[key]) !== json(value),
  );
  return changed.length > 0 ? Object.fromEntries(changed) : undefined;
}

function changedNodeOps(before: DocNode, node: DocNode): CanvasOp[] {
  const ops: CanvasOp[] = [];
  if (node.position && json(before.position) !== json(node.position)) {
    ops.push({ kind: "moveNode", nodeId: node.id, position: node.position });
  }
  const parentId = node.parentId ?? null;
  if ((before.parentId ?? null) !== parentId) {
    ops.push({ kind: "setParent", nodeId: node.id, parentId });
  }
  const data = changedData(before.data, node.data);
  if (data) ops.push({ kind: "patchNode", nodeId: node.id, data });
  const sizePatch = sizePatchOf(before, node);
  if (Object.keys(sizePatch).length > 0) {
    ops.push({ kind: "patchNode", nodeId: node.id, ...sizePatch });
  }
  return ops;
}

function nodeOps(base: DiagramDoc, current: DiagramDoc): CanvasOp[] {
  const baseNodes = new Map(base.nodes.map((n) => [n.id, n]));
  const currentIds = new Set(current.nodes.map((n) => n.id));
  const removed: CanvasOp[] = base.nodes
    .filter((n) => !currentIds.has(n.id))
    .map((n) => ({ kind: "removeNode", nodeId: n.id }));

  // WHY parents first: an added child references its added parent in the same
  // batch, and applyOps validates parent existence at each step.
  const added = sortParentsFirst(current.nodes.filter((n) => !baseNodes.has(n.id))).map(addNodeOp);

  const changed = current.nodes.flatMap((node) => {
    const before = baseNodes.get(node.id);
    return before ? changedNodeOps(before, node) : [];
  });
  return [...removed, ...added, ...changed];
}

function addEdgeOp(edge: DocEdge): CanvasOp {
  const optional = (key: "sourceHandle" | "targetHandle" | "type" | "label") =>
    typeof edge[key] === "string" ? { [key]: edge[key] } : {};
  const record = (key: "style" | "data") => {
    const value = edge[key];
    return value && typeof value === "object" && !Array.isArray(value)
      ? { [key]: value as Record<string, unknown> }
      : {};
  };
  return {
    kind: "addEdge",
    edge: {
      id: edge.id,
      source: String(edge.source),
      target: String(edge.target),
      ...optional("sourceHandle"),
      ...optional("targetHandle"),
      ...optional("type"),
      ...optional("label"),
      ...(typeof edge.animated === "boolean" ? { animated: edge.animated } : {}),
      ...record("style"),
      ...record("data"),
    },
  };
}

function patchEdgeOps(before: DocEdge, edge: DocEdge): CanvasOp[] {
  const patch: Record<string, unknown> = {};
  for (const field of EDGE_PATCH_FIELDS) {
    if (edge[field] !== undefined && json(before[field]) !== json(edge[field])) {
      patch[field] = edge[field];
    }
  }
  if (Object.keys(patch).length === 0) return [];
  return [{ kind: "patchEdge", edgeId: edge.id, patch } as CanvasOp];
}

function edgeOps(base: DiagramDoc, current: DiagramDoc): CanvasOp[] {
  const baseEdges = new Map(base.edges.map((e) => [e.id, e]));
  const currentIds = new Set(current.edges.map((e) => e.id));
  const removed: CanvasOp[] = base.edges
    .filter((e) => !currentIds.has(e.id))
    .map((e) => ({ kind: "removeEdge", edgeId: e.id }));
  const upserted = current.edges.flatMap((edge) => {
    const before = baseEdges.get(edge.id);
    return before ? patchEdgeOps(before, edge) : [addEdgeOp(edge)];
  });
  return [...removed, ...upserted];
}

/**
 * Diff two persisted documents into ops. Data patches carry only changed keys. A deleted
 * data key, and a node's `type` or `zIndex`, have no op: `nodeFieldPatches` carries those.
 */
export function diffToOps(base: DiagramDoc, current: DiagramDoc): CanvasOp[] {
  return [...nodeOps(base, current), ...edgeOps(base, current)];
}

type NodeFieldPatch = {
  nodeId: string;
  set: Record<string, unknown>;
  unset: string[];
  unsetData: string[];
};

const NODE_FIELDS = ["type", "zIndex"] as const;

/** What changed on a node that `patchNode` can't say: `type`, `zIndex` and deleted data keys. */
function nodeFieldPatches(base: DiagramDoc, current: DiagramDoc): NodeFieldPatch[] {
  const baseNodes = new Map(base.nodes.map((n) => [n.id, n]));
  const patches: NodeFieldPatch[] = [];
  for (const node of current.nodes) {
    const before = baseNodes.get(node.id);
    if (!before) continue;
    const set: Record<string, unknown> = {};
    const unset: string[] = [];
    for (const field of NODE_FIELDS) {
      if (json(before[field]) === json(node[field])) continue;
      if (node[field] === undefined) unset.push(field);
      else set[field] = node[field];
    }
    const unsetData = Object.keys(before.data ?? {}).filter((key) => !(key in (node.data ?? {})));
    if (unset.length + unsetData.length + Object.keys(set).length > 0) {
      patches.push({ nodeId: node.id, set, unset, unsetData });
    }
  }
  return patches;
}

function withoutKeys(record: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).filter(([key]) => !keys.includes(key)));
}

/** Null when a patched node is gone, the same answer `applyOps` gives for an op on a missing node. */
function applyNodeFieldPatches(
  nodes: Record<string, unknown>[],
  patches: NodeFieldPatch[],
): Record<string, unknown>[] | null {
  const byId = new Map(patches.map((patch) => [patch.nodeId, patch]));
  const seen = new Set<string>();
  const next = nodes.map((node) => {
    const patch = typeof node.id === "string" ? byId.get(node.id) : undefined;
    if (!patch) return node;
    seen.add(patch.nodeId);
    const patched = withoutKeys({ ...node, ...patch.set }, patch.unset);
    if (patch.unsetData.length === 0 || typeof node.data !== "object" || node.data === null) {
      return patched;
    }
    return { ...patched, data: withoutKeys(node.data as Record<string, unknown>, patch.unsetData) };
  });
  return seen.size === byId.size ? next : null;
}

/** A local reparent can name a container that sits later in the server's order. */
function parentsFirst(nodes: Record<string, unknown>[]): Record<string, unknown>[] {
  const ids = new Set(nodes.map((node) => node.id));
  const seen = new Set<unknown>();
  const misordered = nodes.some((node) => {
    const early = ids.has(node.parentId) && !seen.has(node.parentId);
    seen.add(node.id);
    return early;
  });
  if (!misordered) return nodes;
  const wrapped = nodes.map((node) => ({
    id: String(node.id),
    parentId: typeof node.parentId === "string" ? node.parentId : undefined,
    node,
  }));
  return sortParentsFirst(wrapped).map(({ node }) => node);
}

/**
 * Replay local changes (lastSaved -> local) on the server document. Returns
 * null when impossible, like a patched node deleted, so the save error shows.
 */
export function rebaseDiagram(
  serverDoc: DiagramDoc,
  lastSaved: DiagramDoc,
  local: DiagramDoc,
): RawCanvasData | null {
  const ops = diffToOps(lastSaved, local);
  const res = tryCatch(() => applyOps({ nodes: serverDoc.nodes, edges: serverDoc.edges }, ops));
  if (!res.ok) return null;
  const nodes = applyNodeFieldPatches(res.value.nodes, nodeFieldPatches(lastSaved, local));
  return nodes ? { ...res.value, nodes: parentsFirst(nodes) } : null;
}
