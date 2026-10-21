// The pen layer, server-safe. Svelte parts are in ./ui.js.

export { PEN_HEX, penColorVar } from "#src/canvas/pen/colors.js";
export { strokesAlong, strokesUnder, type ErasableNode } from "#src/canvas/pen/eraser.js";
export {
  buildStrokeNode,
  distanceToStroke,
  pointsBounds,
  simplifyPoints,
  type Box,
  type BuildStrokeOptions,
  type Pt,
} from "#src/canvas/pen/geometry.js";
export { addPenNode, removePenNode, type PenOp } from "#src/canvas/pen/ops.js";
export {
  createPenSession,
  type PenHost,
  type PenPreview,
  type PenSettings,
} from "#src/canvas/pen/pen-session.js";
export { penPlugin } from "#src/canvas/pen/plugin.js";
export { buildShapeNode, buildTextNode, dragBox, shapeOutline } from "#src/canvas/pen/shapes.js";
export { outlineToPath, strokePath } from "#src/canvas/pen/stroke-path.js";
export {
  HIGHLIGHTER_OPACITY,
  PEN_COLORS,
  PEN_DEFAULTS,
  SHAPE_KINDS,
  SHAPE_NODE,
  STROKE_NODE,
  TEXT_NODE,
  type PenColor,
  type PenNodeInput,
  type PenTool,
  type ShapeData,
  type ShapeKind,
  type StrokeData,
  type StrokePoint,
  type TextData,
} from "#src/canvas/pen/types.js";
