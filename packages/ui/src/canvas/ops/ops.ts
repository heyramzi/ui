// Granular canvas mutations: pure functions over a board's nodes and edges. These are the
// ops every canvas has. A plugin adds its own kinds through `OpDefinition` (see plugin.ts).

import { z } from "zod";
import type { OpDefinition, OpLike, OpState } from "#src/canvas/plugin.js";
import type { RawCanvasData } from "#src/canvas/types.js";

// =========================
// SCHEMAS
// =========================

const positionSchema = z.object({ x: z.number(), y: z.number() });

export const addNodeOp = z.object({
  kind: z.literal("addNode"),
  node: z.object({
    id: z.string().min(1).optional(),
    type: z.string().min(1),
    position: positionSchema.optional(),
    data: z.record(z.string(), z.unknown()),
    // A container is created at its real size in one op, with no second
    // setParent op per child.
    style: z.record(z.string(), z.unknown()).optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    parentId: z.string().min(1).optional(),
  }),
});

export const removeNodeOp = z.object({
  kind: z.literal("removeNode"),
  nodeId: z.string().min(1),
});

export const patchNodeOp = z.object({
  kind: z.literal("patchNode"),
  nodeId: z.string().min(1),
  data: z.record(z.string(), z.unknown()).optional(),
  // Merged into the node's style object. A CSS-string style from an old save is replaced
  // wholesale (there is nothing sane to merge into).
  style: z.record(z.string(), z.unknown()).optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const moveNodeOp = z.object({
  kind: z.literal("moveNode"),
  nodeId: z.string().min(1),
  position: positionSchema,
});

export const setParentOp = z.object({
  kind: z.literal("setParent"),
  nodeId: z.string().min(1),
  // null detaches the node from its parent; "parent" extent confines it to the parent bounds.
  parentId: z.string().min(1).nullable(),
  extent: z.literal("parent").nullable().optional(),
});

export const addEdgeOp = z.object({
  kind: z.literal("addEdge"),
  edge: z.object({
    id: z.string().min(1).optional(),
    source: z.string().min(1),
    target: z.string().min(1),
    sourceHandle: z.string().optional(),
    targetHandle: z.string().optional(),
    type: z.string().optional(),
    label: z.string().optional(),
    animated: z.boolean().optional(),
    style: z.record(z.string(), z.unknown()).optional(),
    data: z.record(z.string(), z.unknown()).optional(),
  }),
});

export const removeEdgeOp = z.object({
  kind: z.literal("removeEdge"),
  edgeId: z.string().min(1),
});

export const patchEdgeOp = z.object({
  kind: z.literal("patchEdge"),
  edgeId: z.string().min(1),
  patch: z
    .object({
      label: z.string().optional(),
      animated: z.boolean().optional(),
      type: z.string().optional(),
      style: z.record(z.string(), z.unknown()).optional(),
      /** Replaces the edge's data whole: send every field it should keep. */
      data: z.record(z.string(), z.unknown()).optional(),
      sourceHandle: z.string().optional(),
      targetHandle: z.string().optional(),
      /** Re-point the edge. The new endpoint must be a node on the board. */
      source: z.string().min(1).optional(),
      target: z.string().min(1).optional(),
    })
    .refine((v) => Object.keys(v).length > 0, { message: "patch must include at least one field" }),
});

/** Every schema the canvas ships, for an app that builds its own discriminated union. */
export const CORE_OP_SCHEMAS = [
  addNodeOp,
  removeNodeOp,
  patchNodeOp,
  moveNodeOp,
  setParentOp,
  addEdgeOp,
  removeEdgeOp,
  patchEdgeOp,
] as const;

export const canvasOpSchema = z.discriminatedUnion("kind", [...CORE_OP_SCHEMAS]);

export type CanvasOp = z.infer<typeof canvasOpSchema>;

// =========================
// ERRORS AND HELPERS
// =========================

export type { OpLike };
export type GenericRecord = Record<string, unknown>;

export class CanvasOpError extends Error {
  constructor(
    message: string,
    readonly opIndex: number,
  ) {
    super(message);
    this.name = "CanvasOpError";
  }
}

export function randomId(): string {
  return crypto.randomUUID();
}

export function getNodeId(node: GenericRecord): string | undefined {
  return typeof node.id === "string" ? node.id : undefined;
}

export function getNodeData(node: GenericRecord): GenericRecord {
  return typeof node.data === "object" && node.data !== null ? (node.data as GenericRecord) : {};
}

export function hasNode(nodes: GenericRecord[], id: string): boolean {
  return nodes.some((n) => getNodeId(n) === id);
}

/** Every node-targeting op shares one find-map-or-throw, so each handler only states its transform. */
export function mapNodeOrThrow(
  nodes: GenericRecord[],
  nodeId: string,
  opIndex: number,
  transform: (node: GenericRecord) => GenericRecord,
): GenericRecord[] {
  let found = false;
  const next = nodes.map((n) => {
    if (getNodeId(n) !== nodeId) return n;
    found = true;
    return transform(n);
  });
  if (!found) throw new CanvasOpError(`Unknown nodeId: ${nodeId}`, opIndex);
  return next;
}

/** A copy of `list` with `item` inserted at `index`, clamped, or appended. */
export function insertAt<T>(list: T[], item: T, index: number | undefined): T[] {
  const next = [...list];
  next.splice(Math.min(index ?? next.length, next.length), 0, item);
  return next;
}

export function assertIndex(index: number, length: number, what: string, opIndex: number): void {
  if (index >= length) throw new CanvasOpError(`${what} index ${index} out of bounds`, opIndex);
}

/** Replace some of a node's data fields, throwing if `nodeId` is unknown. */
export function patchData(
  state: OpState,
  nodeId: string,
  opIndex: number,
  fields: (data: GenericRecord) => GenericRecord,
): void {
  state.nodes = mapNodeOrThrow(state.nodes, nodeId, opIndex, (n) => {
    const nodeData = getNodeData(n);
    return { ...n, data: { ...nodeData, ...fields(nodeData) } };
  });
}

type Op<K extends CanvasOp["kind"]> = Extract<CanvasOp, { kind: K }>;

// =========================
// NODE OPS
// =========================

function assertParentExists(nodes: GenericRecord[], nodeId: string, parentId: string, i: number) {
  if (parentId === nodeId) throw new CanvasOpError(`Node cannot be its own parent: ${nodeId}`, i);
  if (!hasNode(nodes, parentId)) throw new CanvasOpError(`Unknown parentId: ${parentId}`, i);
}

function addNode(state: OpState, op: Op<"addNode">, i: number): void {
  const { node } = op;
  const id = node.id ?? randomId();
  if (hasNode(state.nodes, id)) throw new CanvasOpError(`Node id already exists: ${id}`, i);
  if (node.parentId) assertParentExists(state.nodes, id, node.parentId, i);
  state.nodes = [
    ...state.nodes,
    {
      id,
      type: node.type,
      position: node.position ?? { x: 0, y: 0 },
      data: node.data,
      ...(node.style && { style: node.style }),
      ...(node.width != null && { width: node.width }),
      ...(node.height != null && { height: node.height }),
      // A parented node with no extent escapes its container in xyflow, so
      // parentId implies extent right here at creation.
      ...(node.parentId && { parentId: node.parentId, extent: "parent" }),
    },
  ];
}

function removeNode(state: OpState, op: Op<"removeNode">, i: number): void {
  if (!hasNode(state.nodes, op.nodeId)) {
    throw new CanvasOpError(`Unknown nodeId: ${op.nodeId}`, i);
  }
  state.nodes = state.nodes.filter((n) => getNodeId(n) !== op.nodeId);
  state.edges = state.edges.filter((e) => e.source !== op.nodeId && e.target !== op.nodeId);
}

function patchNodeRecord(n: GenericRecord, op: Op<"patchNode">): GenericRecord {
  const next: GenericRecord = { ...n };
  if (op.data) next.data = { ...getNodeData(n), ...op.data };
  if (op.style) {
    const existing =
      typeof n.style === "object" && n.style !== null ? (n.style as GenericRecord) : {};
    next.style = { ...existing, ...op.style };
  }
  if (op.width != null) next.width = op.width;
  if (op.height != null) next.height = op.height;
  return next;
}

function patchNode(state: OpState, op: Op<"patchNode">, i: number): void {
  if (!op.data && !op.style && op.width == null && op.height == null) {
    throw new CanvasOpError("patchNode requires data, style, width or height", i);
  }
  state.nodes = mapNodeOrThrow(state.nodes, op.nodeId, i, (n) => patchNodeRecord(n, op));
}

function moveNode(state: OpState, op: Op<"moveNode">, i: number): void {
  state.nodes = mapNodeOrThrow(state.nodes, op.nodeId, i, (n) => ({
    ...n,
    position: { x: op.position.x, y: op.position.y },
  }));
}

function setParent(state: OpState, op: Op<"setParent">, i: number): void {
  const { parentId } = op;
  if (parentId !== null) assertParentExists(state.nodes, op.nodeId, parentId, i);
  state.nodes = mapNodeOrThrow(state.nodes, op.nodeId, i, (n) => {
    const { parentId: _p, extent: _e, ...rest } = n;
    if (parentId === null) return rest;
    const extent = op.extent === null ? undefined : (op.extent ?? "parent");
    return extent ? { ...rest, parentId, extent } : { ...rest, parentId };
  });
}

// =========================
// EDGE OPS
// =========================

function addEdge(state: OpState, op: Op<"addEdge">, i: number): void {
  const id = op.edge.id ?? randomId();
  if (state.edges.some((e) => e.id === id)) {
    throw new CanvasOpError(`Edge id already exists: ${id}`, i);
  }
  if (!hasNode(state.nodes, op.edge.source)) {
    throw new CanvasOpError(`Edge source not found: ${op.edge.source}`, i);
  }
  if (!hasNode(state.nodes, op.edge.target)) {
    throw new CanvasOpError(`Edge target not found: ${op.edge.target}`, i);
  }
  state.edges = [...state.edges, { id, ...op.edge }];
}

function removeEdge(state: OpState, op: Op<"removeEdge">, i: number): void {
  if (!state.edges.some((e) => e.id === op.edgeId)) {
    throw new CanvasOpError(`Unknown edgeId: ${op.edgeId}`, i);
  }
  state.edges = state.edges.filter((e) => e.id !== op.edgeId);
}

function patchEdge(state: OpState, op: Op<"patchEdge">, i: number): void {
  const { source, target } = op.patch;
  if (source !== undefined && !hasNode(state.nodes, source)) {
    throw new CanvasOpError(`Edge source not found: ${source}`, i);
  }
  if (target !== undefined && !hasNode(state.nodes, target)) {
    throw new CanvasOpError(`Edge target not found: ${target}`, i);
  }
  let found = false;
  state.edges = state.edges.map((e) => {
    if (e.id !== op.edgeId) return e;
    found = true;
    return { ...e, ...op.patch };
  });
  if (!found) throw new CanvasOpError(`Unknown edgeId: ${op.edgeId}`, i);
}

// =========================
// APPLY
// =========================

const CORE_APPLY: Record<string, (state: OpState, op: never, i: number) => void> = {
  addNode,
  removeNode,
  patchNode,
  moveNode,
  setParent,
  addEdge,
  removeEdge,
  patchEdge,
};

/**
 * Apply `ops` in order and return the new board. `definitions` are the op kinds a plugin
 * adds. Unknown kinds throw, so a typo never passes as a no-op.
 */
export function applyOps(
  data: RawCanvasData,
  ops: readonly OpLike[],
  definitions: readonly OpDefinition[] = [],
): RawCanvasData {
  const state: OpState = { nodes: [...data.nodes], edges: [...data.edges] };
  const byKind = new Map(definitions.map((def) => [def.kind, def]));
  ops.forEach((op, i) => {
    const core = CORE_APPLY[op.kind];
    if (core) return core(state, op as never, i);
    const def = byKind.get(op.kind);
    if (!def) throw new CanvasOpError(`Unknown op kind: ${op.kind}`, i);
    def.apply(state, op, i);
  });
  const { nodes, edges } = state;
  return data.viewport ? { nodes, edges, viewport: data.viewport } : { nodes, edges };
}
