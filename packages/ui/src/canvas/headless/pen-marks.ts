// Pen marks written as JSON, built into the same nodes the pen tool draws,
// so a CLI can import a whole drawing in one call.

import { z } from "zod";
import { buildStrokeNode } from "#src/canvas/pen/geometry.js";
import { buildShapeNode, buildTextNode } from "#src/canvas/pen/shapes.js";
import { PEN_COLORS, SHAPE_KINDS, type PenNodeInput } from "#src/canvas/pen/types.js";
import type { CanvasNode } from "#src/canvas/types.js";

// =========================
// SCHEMAS
// =========================

const colorSchema = z.enum(PEN_COLORS);
const pointSchema = z.tuple([z.number(), z.number()]);

/** One stroke past this is a scribble pasted from a file, not a drawing. */
const MAX_POINTS = 5000;

/** The frame this mark sits in: its id, with the mark's coordinates still on the page. */
const inFrame = z.string().min(1).optional();

const strokeMark = z.object({
  kind: z.literal("stroke"),
  id: z.string().min(1).optional(),
  in: inFrame,
  /** Flow coordinates: x, y, then an optional 0 to 1 pressure. Simplified on the way in. */
  points: z
    .array(z.tuple([z.number(), z.number()]).rest(z.number()))
    .min(1)
    .max(MAX_POINTS),
  color: colorSchema.optional(),
  size: z.number().positive().optional(),
  tool: z.enum(["pen", "highlighter"]).optional(),
});

const textMark = z.object({
  kind: z.literal("text"),
  id: z.string().min(1).optional(),
  in: inFrame,
  /** Top-left of the first line, as [x, y]. */
  at: pointSchema,
  text: z.string().min(1),
  color: colorSchema.optional(),
  fontSize: z.number().positive().optional(),
});

const shapeMark = z.object({
  kind: z.literal("shape"),
  id: z.string().min(1).optional(),
  in: inFrame,
  shape: z.enum(SHAPE_KINDS),
  /** [x, y, width, height]. */
  box: z.tuple([z.number(), z.number(), z.number().nonnegative(), z.number().nonnegative()]),
  color: colorSchema.optional(),
  filled: z.boolean().optional(),
  label: z.string().optional(),
});

export const penMarkSchema = z.discriminatedUnion("kind", [strokeMark, textMark, shapeMark]);

export type PenMark = z.infer<typeof penMarkSchema>;

// =========================
// COMPILE
// =========================

/** Where each frame sits on the page, by id. A node inside one stores its place relative to it. */
export type FramePositions = ReadonlyMap<string, { x: number; y: number }>;

/** An unknown frame throws, so a typo in `in` stops the import instead of misplacing the mark. */
export function placeInFrame<N extends CanvasNode>(
  node: N,
  frameId: string,
  frames: FramePositions,
  where: string,
): N {
  const frame = frames.get(frameId);
  if (!frame) throw new Error(`${where}: no frame "${frameId}" to put it in`);
  return {
    ...node,
    parentId: frameId,
    extent: "parent",
    position: { x: node.position.x - frame.x, y: node.position.y - frame.y },
  };
}

function toNode(node: PenNodeInput<Record<string, unknown>>, id: string): CanvasNode {
  return {
    id,
    type: node.type,
    position: node.position,
    data: node.data,
    width: node.width,
    height: node.height,
  };
}

/**
 * Builds the node for one mark. A mark with no id gets `pen-<n>` from its place in the list,
 * so a rerun of the same file writes the same ids.
 */
export function compilePenMark(mark: PenMark, index: number, frames: FramePositions): CanvasNode {
  const where = `marks[${index}]`;
  const id = mark.id ?? `pen-${index + 1}`;
  let node: CanvasNode;
  if (mark.kind === "stroke") {
    const built = buildStrokeNode(mark.points, {
      color: mark.color,
      size: mark.size,
      tool: mark.tool,
    });
    if (!built) throw new Error(`${where}: a stroke needs at least one point`);
    node = toNode(built, id);
  } else if (mark.kind === "text") {
    const [x, y] = mark.at;
    node = toNode(
      buildTextNode({ x, y }, { text: mark.text, color: mark.color, fontSize: mark.fontSize }),
      id,
    );
  } else {
    const [x, y, width, height] = mark.box;
    node = toNode(
      buildShapeNode(
        mark.shape,
        { x, y, width, height },
        { color: mark.color, filled: mark.filled, label: mark.label },
      ),
      id,
    );
  }
  return mark.in ? placeInFrame(node, mark.in, frames, where) : node;
}
