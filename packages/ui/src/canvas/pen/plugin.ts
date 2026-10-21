// The pen's node kinds and ops, with no DOM, so the CLI can add strokes.
// ui.ts adds the renderers.

import { z } from "zod";
import { CanvasOpError } from "#src/canvas/ops/ops.js";
import { definePlugin, type OpState } from "#src/canvas/plugin.js";
import { buildStrokeNode } from "#src/canvas/pen/geometry.js";
import { buildShapeNode, buildTextNode } from "#src/canvas/pen/shapes.js";
import {
  PEN_COLORS,
  SHAPE_KINDS,
  SHAPE_NODE,
  STROKE_NODE,
  TEXT_NODE,
  type PenNodeInput,
} from "#src/canvas/pen/types.js";

// =========================
// SCHEMAS
// =========================

const colorSchema = z.enum(PEN_COLORS);
const pointSchema = z.object({ x: z.number(), y: z.number() });

/** A board holds a few thousand strokes at most, and one stroke past this is a scribble pasted from a file. */
const MAX_POINTS = 5000;

const addStrokeOp = z.object({
  kind: z.literal("addStroke"),
  id: z.string().min(1).optional(),
  /** Flow coordinates, x then y then an optional 0 to 1 pressure. Simplified on the way in. */
  points: z
    .array(z.tuple([z.number(), z.number()]).rest(z.number()))
    .min(1)
    .max(MAX_POINTS),
  color: colorSchema.optional(),
  size: z.number().positive().optional(),
  tool: z.enum(["pen", "highlighter"]).optional(),
});

const addTextOp = z.object({
  kind: z.literal("addText"),
  id: z.string().min(1).optional(),
  at: pointSchema,
  text: z.string(),
  color: colorSchema.optional(),
  fontSize: z.number().positive().optional(),
});

const addShapeOp = z.object({
  kind: z.literal("addShape"),
  id: z.string().min(1).optional(),
  shape: z.enum(SHAPE_KINDS),
  box: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number().nonnegative(),
    height: z.number().nonnegative(),
  }),
  color: colorSchema.optional(),
  filled: z.boolean().optional(),
  label: z.string().optional(),
});

type AddStroke = z.infer<typeof addStrokeOp>;
type AddText = z.infer<typeof addTextOp>;
type AddShape = z.infer<typeof addShapeOp>;

// =========================
// HANDLERS
// =========================

function appendNode(
  state: OpState,
  node: PenNodeInput<Record<string, unknown>>,
  opIndex: number,
): void {
  const id = node.id ?? crypto.randomUUID();
  if (state.nodes.some((existing) => existing.id === id)) {
    throw new CanvasOpError(`Node id already exists: ${id}`, opIndex);
  }
  state.nodes = [...state.nodes, { ...node, id }];
}

function applyAddStroke(state: OpState, op: AddStroke, opIndex: number): void {
  const node = buildStrokeNode(op.points, {
    id: op.id,
    color: op.color,
    size: op.size,
    tool: op.tool,
  });
  if (!node) throw new CanvasOpError("addStroke needs at least one point", opIndex);
  appendNode(state, node, opIndex);
}

function applyAddText(state: OpState, op: AddText, opIndex: number): void {
  appendNode(
    state,
    buildTextNode(op.at, { id: op.id, text: op.text, color: op.color, fontSize: op.fontSize }),
    opIndex,
  );
}

function applyAddShape(state: OpState, op: AddShape, opIndex: number): void {
  appendNode(
    state,
    buildShapeNode(op.shape, op.box, {
      id: op.id,
      color: op.color,
      filled: op.filled,
      label: op.label,
    }),
    opIndex,
  );
}

// =========================
// PLUGIN
// =========================

/** No `palette` on any kind: the tool bar's pen tools create these, not the card palette. */
export const penPlugin = definePlugin({
  id: "pen",
  nodes: [
    { type: STROKE_NODE, label: "Stroke" },
    {
      type: TEXT_NODE,
      label: "Text",
      sizing: "content-sized",
      size: { width: 120 },
    },
    { type: SHAPE_NODE, label: "Shape", size: { width: 160, height: 100 } },
  ],
  ops: [
    { kind: "addStroke", schema: addStrokeOp, apply: applyAddStroke },
    { kind: "addText", schema: addTextOp, apply: applyAddText },
    { kind: "addShape", schema: addShapeOp, apply: applyAddShape },
  ],
});
