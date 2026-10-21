// How an app adds cards, ops and layouts to the canvas. It imports Svelte types
// only, so the server can build a registry too.

import type { NodeTypes } from "@xyflow/svelte";
import { z } from "zod";
import type { CanvasData, CanvasEdge, CanvasNode } from "#src/canvas/types.js";

// =========================
// NODE KINDS
// =========================

export interface NodeKind {
  /** The value of `node.type`. Unique across every plugin. */
  type: string;
  label: string;
  /** The Svelte component xyflow renders for this type. Absent on the server. */
  component?: NodeTypes[string];
  /** Palette placement. Absent means the kind is created by code or an op, never from the palette. */
  palette?: { group: string; section?: string; order: number };
  /** Size a new node gets before any layout or measuring. */
  size?: { width: number; height?: number };
  /** Starting `data` for a new node. */
  createData?: () => Record<string, unknown>;
  /** Parent types this kind may sit in. Empty means top level only. Absent means any. */
  validParents?: readonly string[];
  /** "layout-owned": a layout pass sets the size. "content-sized": the DOM sets the height. */
  sizing?: "layout-owned" | "content-sized";
}

// =========================
// OPS
// =========================

/** The graph an op list rewrites, one op at a time. Handlers replace `nodes` and `edges`, never mutate them. */
export interface OpState {
  nodes: Record<string, unknown>[];
  edges: Record<string, unknown>[];
}

/** One op kind. `schema` checks the op's shape, `apply` rewrites the state or throws. */
export interface OpDefinition<Op extends OpLike = OpLike> {
  kind: Op["kind"];
  schema: z.ZodType<Op>;
  // A method, so a definition for one op shape fits a list of them.
  apply(state: OpState, op: Op, opIndex: number): void;
}

/** An op before its kind's schema has narrowed it: a kind plus whatever fields it carries. */
export type OpLike = { kind: string; [field: string]: unknown };

// =========================
// LAYOUTS
// =========================

export interface LayoutOptions {
  /** Which pass the caller asks for by name. Absent lets each pass's `matches` decide. */
  mode?: string;
  /** DOM-measured sizes, folded in as layout input. */
  measured?: ReadonlyMap<string, { width?: number; height?: number }>;
  /** A pass reads what it needs from here: sibling order, spacing, anything else the app passes. */
  extra?: Readonly<Record<string, unknown>>;
}

/** A layout pass. The first registered pass whose `matches` answers true runs. */
export interface LayoutPass {
  id: string;
  matches: (data: CanvasData, options: LayoutOptions) => boolean;
  run: (data: CanvasData, options: LayoutOptions) => { nodes: CanvasNode[]; edges: CanvasEdge[] };
}

// =========================
// PLUGIN
// =========================

export interface CanvasPlugin {
  /** A name for errors, like "pen" or "billing". Unique. */
  id: string;
  nodes?: readonly NodeKind[];
  ops?: readonly OpDefinition[];
  layouts?: readonly LayoutPass[];
}

/** Identity, so a plugin file gets its types checked where it is written. */
export function definePlugin(plugin: CanvasPlugin): CanvasPlugin {
  return plugin;
}

// =========================
// REGISTRY
// =========================

export interface CanvasRegistry {
  readonly plugins: readonly CanvasPlugin[];
  readonly nodes: ReadonlyMap<string, NodeKind>;
  readonly ops: ReadonlyMap<string, OpDefinition>;
  readonly layouts: readonly LayoutPass[];
  /** The `nodeTypes` map xyflow wants: type to component, for kinds that have one. */
  nodeTypes: () => NodeTypes;
  /** Types a layout leaves the height of to the DOM. */
  contentSizedTypes: () => ReadonlySet<string>;
  /** Types a layout sizes from their children. */
  layoutOwnedTypes: () => ReadonlySet<string>;
  /** Validates one op against its kind's schema. Throws a ZodError or an unknown-kind error. */
  parseOp: (input: unknown) => { kind: string };
  /** The first layout pass that matches, or null. */
  pickLayout: (data: CanvasData, options?: LayoutOptions) => LayoutPass | null;
}

/** Collects plugins into one lookup. A node type or op kind two plugins both claim is an error. */
export function createRegistry(plugins: readonly CanvasPlugin[]): CanvasRegistry {
  const nodes = new Map<string, NodeKind>();
  const ops = new Map<string, OpDefinition>();
  const layouts: LayoutPass[] = [];
  const owner = new Map<string, string>();

  const claim = (key: string, pluginId: string) => {
    const first = owner.get(key);
    if (first) throw new Error(`"${key}" is claimed by both "${first}" and "${pluginId}"`);
    owner.set(key, pluginId);
  };

  for (const plugin of plugins) {
    for (const kind of plugin.nodes ?? []) {
      claim(`node:${kind.type}`, plugin.id);
      nodes.set(kind.type, kind);
    }
    for (const op of plugin.ops ?? []) {
      claim(`op:${op.kind}`, plugin.id);
      ops.set(op.kind, op);
    }
    layouts.push(...(plugin.layouts ?? []));
  }

  const typesWhere = (sizing: NodeKind["sizing"]) =>
    new Set([...nodes.values()].filter((k) => k.sizing === sizing).map((k) => k.type));

  return {
    plugins,
    nodes,
    ops,
    layouts,
    nodeTypes() {
      const out: NodeTypes = {};
      for (const kind of nodes.values()) if (kind.component) out[kind.type] = kind.component;
      return out;
    },
    contentSizedTypes: () => typesWhere("content-sized"),
    layoutOwnedTypes: () => typesWhere("layout-owned"),
    parseOp(input) {
      const kind = (input as { kind?: unknown } | null)?.kind;
      const def = typeof kind === "string" ? ops.get(kind) : undefined;
      if (!def) throw new Error(`Unknown op kind: ${String(kind)}`);
      return def.schema.parse(input);
    },
    pickLayout(data, options = {}) {
      return layouts.find((pass) => pass.matches(data, options)) ?? null;
    },
  };
}
