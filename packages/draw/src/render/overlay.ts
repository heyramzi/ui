// Overlay geometry, taken into screen space so grips and guides stay the same
// size at every zoom. The Draw component only maps these to SVG elements.

import {
  boxCenter,
  getSelectionHandles,
  pageToScreen,
  rotate,
  type Box,
  type Camera,
  type EditorApi,
  type Guide,
  type Handle,
  type Vec,
} from "../core";

/** A page point in screen space. */
export function screenPoint(point: Vec, camera: Camera): Vec {
  return pageToScreen(camera, point);
}

/** A page box in screen space. */
export function screenRect(box: Box, camera: Camera): Box {
  const origin = pageToScreen(camera, { x: box.x, y: box.y });
  return { x: origin.x, y: origin.y, w: box.w * camera.zoom, h: box.h * camera.zoom };
}

export type ScreenHandle = { handle: Handle; point: Vec };
export type ScreenRotateHandle = { corner: Handle; point: Vec };

export type ScreenSelection = {
  /** The four corners of the box, in draw order. */
  corners: Vec[];
  resize: ScreenHandle[];
  rotate: ScreenRotateHandle[];
};

/** The selection box and its grips in screen space, or null with nothing selected. */
export function selectionScreen(editor: EditorApi): ScreenSelection | null {
  if (editor.getSelectedIds().length === 0) return null;
  const handles = getSelectionHandles(editor);
  const camera = editor.getCamera();
  const corners: Vec[] = [];
  for (const corner of ["nw", "ne", "se", "sw"]) {
    const grip = handles.resize.find((handle) => handle.handle === corner);
    if (grip) corners.push(screenPoint(grip.point, camera));
  }
  return {
    corners,
    resize: handles.resize.map((grip) => ({
      handle: grip.handle,
      point: screenPoint(grip.point, camera),
    })),
    rotate: handles.rotate.map((zone) => ({
      corner: zone.corner,
      point: screenPoint(zone.point, camera),
    })),
  };
}

/** A snap guide as the two screen points its line runs between. */
export function guideScreen(guide: Guide, camera: Camera): { from: Vec; to: Vec } {
  const a = guide.axis === "x" ? { x: guide.at, y: guide.from } : { x: guide.from, y: guide.at };
  const b = guide.axis === "x" ? { x: guide.at, y: guide.to } : { x: guide.to, y: guide.at };
  return { from: screenPoint(a, camera), to: screenPoint(b, camera) };
}

/** SVG `points` for a polygon through the screen points. */
export function polygonPoints(points: Vec[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

/**
 * The corners of a box, turned about its centre and dropped onto the screen.
 * Used for an outline that follows a rotated shape, where `screenRect` can't.
 */
export function rotatedScreenCorners(box: Box, rotation: number, camera: Camera): Vec[] {
  const center = boxCenter(box);
  const local: Vec[] = [
    { x: box.x, y: box.y },
    { x: box.x + box.w, y: box.y },
    { x: box.x + box.w, y: box.y + box.h },
    { x: box.x, y: box.y + box.h },
  ];
  return local.map((corner) => screenPoint(rotate(corner, center, rotation), camera));
}
