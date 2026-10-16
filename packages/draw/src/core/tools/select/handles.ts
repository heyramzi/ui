// Where the selection grips sit. The renderer draws from here and the
// pointing_handle state hit-tests against it, so both agree on one layout.

import type { Box, EditorApi, Handle, ShapeRecord, Vec } from "../../types";
import { boxCenter } from "../../math/box";
import { dist, rotate } from "../../math/vec";

/** A resize grip, one per side and corner of the selection box. */
export type ResizeHandle = { handle: Handle; point: Vec };

/** A rotate zone, sitting just outside a corner so a grab there never resizes. */
export type RotateHandle = { corner: Handle; point: Vec };

export type SelectionHandles = {
  /** The box the grips are laid out on: the shape's own box for one shape, the union for many. */
  bounds: Box;
  /** Radians, about the box centre. Zero for a multi-shape selection. */
  rotation: number;
  resize: ResizeHandle[];
  rotate: RotateHandle[];
};

export type HandleHit =
  | { kind: "resize"; handle: Handle }
  | { kind: "rotate"; corner: Handle };

/** How far outside a corner the rotate zone sits, in screen pixels. */
export const ROTATE_OFFSET = 18;

/** How close a pointer must be to land on a grip, in screen pixels. */
export const HANDLE_HIT = 8;

/** The resize grips, in draw order around the box. */
const RESIZE_ORDER: Handle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

/** The four corners and the outward diagonal each rotate zone follows. */
const CORNERS: { corner: Handle; dx: -1 | 1; dy: -1 | 1 }[] = [
  { corner: "nw", dx: -1, dy: -1 },
  { corner: "ne", dx: 1, dy: -1 },
  { corner: "se", dx: 1, dy: 1 },
  { corner: "sw", dx: -1, dy: 1 },
];

const CURSORS: Record<Handle, string> = {
  nw: "nwse-resize",
  se: "nwse-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
};

/** The grip point on an unrotated box, before the box's own rotation is applied. */
function localHandlePoint(box: Box, handle: Handle): Vec {
  const { x, y, w, h } = box;
  switch (handle) {
    case "nw":
      return { x, y };
    case "n":
      return { x: x + w / 2, y };
    case "ne":
      return { x: x + w, y };
    case "e":
      return { x: x + w, y: y + h / 2 };
    case "se":
      return { x: x + w, y: y + h };
    case "s":
      return { x: x + w / 2, y: y + h };
    case "sw":
      return { x, y: y + h };
    case "w":
      return { x, y: y + h / 2 };
  }
}

/** The selected shapes, in selection order, skipping any that just vanished. */
export function selectedShapes(editor: EditorApi): ShapeRecord[] {
  const out: ShapeRecord[] = [];
  for (const id of editor.getSelectedIds()) {
    const shape = editor.getShape(id);
    if (shape) out.push(shape);
  }
  return out;
}

/**
 * The box the handles wrap. One shape keeps its own box and rotation, so its
 * handles turn with it; many shapes fall back to the axis-aligned union.
 */
export function getSelectionBox(editor: EditorApi): {
  box: Box;
  rotation: number;
  single: ShapeRecord | null;
  shapes: ShapeRecord[];
} {
  const shapes = selectedShapes(editor);
  if (shapes.length === 0) {
    return { box: { x: 0, y: 0, w: 0, h: 0 }, rotation: 0, single: null, shapes };
  }
  if (shapes.length === 1) {
    const shape = shapes[0];
    return {
      box: { x: shape.x, y: shape.y, w: shape.w, h: shape.h },
      rotation: shape.rotation,
      single: shape,
      shapes,
    };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const shape of shapes) {
    const bounds = editor.getPageBounds(shape.id);
    minX = Math.min(minX, bounds.x);
    minY = Math.min(minY, bounds.y);
    maxX = Math.max(maxX, bounds.x + bounds.w);
    maxY = Math.max(maxY, bounds.y + bounds.h);
  }
  return {
    box: { x: minX, y: minY, w: maxX - minX, h: maxY - minY },
    rotation: 0,
    single: null,
    shapes,
  };
}

/** Handle positions for the current selection, in page space. */
export function getSelectionHandles(editor: EditorApi): SelectionHandles {
  const { box, rotation } = getSelectionBox(editor);
  const center = boxCenter(box);
  const zoom = editor.getCamera().zoom || 1;
  const offset = ROTATE_OFFSET / zoom;

  const resize = RESIZE_ORDER.map((handle) => ({
    handle,
    point: rotate(localHandlePoint(box, handle), center, rotation),
  }));

  const rotateZones = CORNERS.map(({ corner, dx, dy }) => {
    const local = localHandlePoint(box, corner);
    const outside = { x: local.x + dx * offset, y: local.y + dy * offset };
    return { corner, point: rotate(outside, center, rotation) };
  });

  return { bounds: box, rotation, resize, rotate: rotateZones };
}

/**
 * Which grip a page point lands on, if any. Rotate zones win because they sit
 * outside the corners the resize grips already occupy.
 */
export function findHandleAt(
  editor: EditorApi,
  point: Vec,
  marginPx: number = HANDLE_HIT,
): HandleHit | null {
  const handles = getSelectionHandles(editor);
  const zoom = editor.getCamera().zoom || 1;
  const margin = marginPx / zoom;
  for (const zone of handles.rotate) {
    if (dist(point, zone.point) <= margin) return { kind: "rotate", corner: zone.corner };
  }
  for (const grip of handles.resize) {
    if (dist(point, grip.point) <= margin) return { kind: "resize", handle: grip.handle };
  }
  return null;
}

/** The browser cursor for a resize grip. */
export function handleCursor(handle: Handle): string {
  return CURSORS[handle];
}
