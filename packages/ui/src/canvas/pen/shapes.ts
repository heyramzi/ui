// Shape and text nodes from a drag or a click. Pure, so the CLI can reuse it.

import type { Box, Pt } from "#src/canvas/pen/geometry.js";
import type { PenColor, PenNodeInput, ShapeData, ShapeKind, TextData } from "#src/canvas/pen/types.js";
import { PEN_DEFAULTS, SHAPE_NODE, TEXT_NODE } from "#src/canvas/pen/types.js";

/** A shape smaller than this on both sides was a click, so it gets the default size. */
const MIN_DRAG = 6;
const DEFAULT_SHAPE = { width: 160, height: 100 } as const;

/** The box a drag from `from` to `to` covers. Shift keeps it square. */
export function dragBox(from: Pt, to: Pt, square = false): Box {
  let dx = to.x - from.x;
  let dy = to.y - from.y;
  if (square) {
    const side = Math.max(Math.abs(dx), Math.abs(dy));
    dx = Math.sign(dx || 1) * side;
    dy = Math.sign(dy || 1) * side;
  }
  return {
    x: Math.min(from.x, from.x + dx),
    y: Math.min(from.y, from.y + dy),
    width: Math.abs(dx),
    height: Math.abs(dy),
  };
}

export interface BuildShapeOptions {
  color?: PenColor;
  filled?: boolean;
  label?: string;
  id?: string;
}

export function buildShapeNode(
  shape: ShapeKind,
  box: Box,
  options: BuildShapeOptions = {},
): PenNodeInput<ShapeData> {
  const click = box.width < MIN_DRAG && box.height < MIN_DRAG;
  const width = Math.round(click ? DEFAULT_SHAPE.width : Math.max(box.width, MIN_DRAG));
  const height = Math.round(click ? DEFAULT_SHAPE.height : Math.max(box.height, MIN_DRAG));
  // A click centres the default shape on the cursor.
  const x = click ? box.x - width / 2 : box.x;
  const y = click ? box.y - height / 2 : box.y;
  return {
    id: options.id,
    type: SHAPE_NODE,
    position: { x: Math.round(x), y: Math.round(y) },
    data: {
      shape,
      color: options.color ?? PEN_DEFAULTS.color,
      strokeWidth: PEN_DEFAULTS.strokeWidth,
      filled: options.filled ?? false,
      label: options.label ?? "",
    },
    width,
    height,
  };
}

export function buildTextNode(
  at: Pt,
  options: { text?: string; color?: PenColor; fontSize?: number; id?: string } = {},
): PenNodeInput<TextData> {
  return {
    id: options.id,
    type: TEXT_NODE,
    position: { x: Math.round(at.x), y: Math.round(at.y) },
    data: {
      text: options.text ?? "",
      color: options.color ?? PEN_DEFAULTS.color,
      fontSize: options.fontSize ?? PEN_DEFAULTS.fontSize,
    },
    // Text sizes itself to the words once it renders, so this is only the empty box.
    width: 120,
    height: Math.round((options.fontSize ?? PEN_DEFAULTS.fontSize) * 1.4),
  };
}

/** The outline of a shape inside a width by height box, as an SVG path. */
export function shapeOutline(
  shape: ShapeKind,
  width: number,
  height: number,
  inset: number,
): string {
  const left = inset;
  const top = inset;
  const right = Math.max(width - inset, left);
  const bottom = Math.max(height - inset, top);
  if (shape === "diamond") {
    const midX = (left + right) / 2;
    const midY = (top + bottom) / 2;
    return `M${midX},${top} L${right},${midY} L${midX},${bottom} L${left},${midY} Z`;
  }
  if (shape === "ellipse") {
    const rx = (right - left) / 2;
    const ry = (bottom - top) / 2;
    const cy = (top + bottom) / 2;
    return `M${left},${cy} a${rx},${ry} 0 1,0 ${rx * 2},0 a${rx},${ry} 0 1,0 ${-rx * 2},0 Z`;
  }
  return `M${left},${top} H${right} V${bottom} H${left} Z`;
}
