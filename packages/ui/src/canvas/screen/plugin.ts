// The Screen card's kind and its add op, with no DOM, so the CLI can put a screen on a board.
// ui.ts adds the renderer.

import { z } from "zod";
import { CanvasOpError } from "#src/canvas/ops/ops.js";
import { definePlugin, type NodeKind, type OpState } from "#src/canvas/plugin.js";
import { buildScreenNode } from "#src/canvas/screen/parts.js";
import {
  MAX_LABEL,
  MAX_LIST_ITEMS,
  MAX_PARTS,
  PART_KINDS,
  SCREEN_MODES,
  SCREEN_NODE,
  SCREEN_WIDTH,
} from "#src/canvas/screen/types.js";

const partSchema = z.object({
  kind: z.enum(PART_KINDS),
  label: z.string().max(MAX_LABEL).optional(),
  items: z.array(z.string().max(MAX_LABEL)).max(MAX_LIST_ITEMS).optional(),
  text: z.string().max(MAX_LABEL).optional(),
  variant: z.enum(["primary", "secondary"]).optional(),
});

const addScreenOp = z.object({
  kind: z.literal("addScreen"),
  id: z.string().min(1).optional(),
  at: z.object({ x: z.number(), y: z.number() }),
  label: z.string().max(MAX_LABEL).optional(),
  mode: z.enum(SCREEN_MODES).optional(),
  parts: z.array(partSchema).max(MAX_PARTS).optional(),
  width: z.number().positive().optional(),
});

type AddScreen = z.infer<typeof addScreenOp>;

function applyAddScreen(state: OpState, op: AddScreen, opIndex: number): void {
  const id = op.id ?? crypto.randomUUID();
  if (state.nodes.some((node) => node.id === id)) {
    throw new CanvasOpError(`Node id already exists: ${id}`, opIndex);
  }
  const node = buildScreenNode({
    id,
    position: op.at,
    label: op.label,
    mode: op.mode,
    parts: op.parts,
    width: op.width,
  });
  state.nodes = [...state.nodes, node];
}

/** Content-sized: the parts decide the height, so a layout never pins a stale one. */
export const screenKind: NodeKind = {
  type: SCREEN_NODE,
  label: "Screen",
  sizing: "content-sized",
  size: { width: SCREEN_WIDTH },
  createData: () => ({ label: "", mode: "wireframe", parts: [] }),
};

export const screenPlugin = definePlugin({
  id: "screen",
  nodes: [screenKind],
  ops: [{ kind: "addScreen", schema: addScreenOp, apply: applyAddScreen }],
});
