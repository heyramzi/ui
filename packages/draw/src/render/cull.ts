// Viewport culling and z-order: the renderer hands the camera group only shapes
// a viewport could show, parents before their children.

import {
  boxIntersects,
  rotatedBoxBounds,
  type Box,
  type Camera,
  type EditorApi,
  type ShapeRecord,
} from "../core";

/** The page-space box a screen-sized viewport covers at the camera's zoom. */
export function pageViewport(camera: Camera, size: { w: number; h: number }): Box {
  const zoom = camera.zoom || 1;
  return { x: camera.x, y: camera.y, w: size.w / zoom, h: size.h / zoom };
}

/** True when `bounds` touches the viewport, grown by `margin` page units. */
export function isShapeVisible(bounds: Box, viewport: Box, margin = 0): boolean {
  const grown: Box = {
    x: viewport.x - margin,
    y: viewport.y - margin,
    w: viewport.w + margin * 2,
    h: viewport.h + margin * 2,
  };
  return boxIntersects(bounds, grown);
}

/** A shape's page bounds, falling back to its own box when its type is unregistered. */
export function shapeBounds(editor: EditorApi, shape: ShapeRecord): Box {
  try {
    return editor.getPageBounds(shape.id);
  } catch {
    return rotatedBoxBounds(shape, shape.rotation);
  }
}

/** The cull step: only shapes a viewport could show, in the order given, dropping any outside it grown by `margin` page units. */
export function cullShapes(
  editor: EditorApi,
  shapes: ShapeRecord[],
  viewport: Box,
  margin = 0,
): ShapeRecord[] {
  return shapes.filter((shape) => isShapeVisible(shapeBounds(editor, shape), viewport, margin));
}

function byIndex(a: ShapeRecord, b: ShapeRecord): number {
  if (a.index < b.index) return -1;
  if (a.index > b.index) return 1;
  return 0;
}

/**
 * Back to front, a parent ahead of its children. Index orders siblings; a child
 * follows the shape it belongs to even when its index sorts among the cousins.
 */
export function zOrdered(shapes: ShapeRecord[]): ShapeRecord[] {
  const byParent = new Map<string | null, ShapeRecord[]>();
  for (const shape of shapes) {
    const key = shape.parentId ?? null;
    const list = byParent.get(key);
    if (list) list.push(shape);
    else byParent.set(key, [shape]);
  }
  for (const list of byParent.values()) list.sort(byIndex);

  const out: ShapeRecord[] = [];
  const seen = new Set<string>();
  const walk = (parentId: string | null): void => {
    for (const shape of byParent.get(parentId) ?? []) {
      if (seen.has(shape.id)) continue;
      seen.add(shape.id);
      out.push(shape);
      walk(shape.id);
    }
  };
  walk(null);
  // A shape whose parent is missing still has to draw.
  for (const shape of shapes) {
    if (!seen.has(shape.id)) {
      seen.add(shape.id);
      out.push(shape);
    }
  }
  return out;
}
