import type { Box, Handle, ShapeRecord } from "../types";
import { boxCenter } from "../math/box";
import { rotate } from "../math/vec";

export type BoxPatch = { x: number; y: number; w: number; h: number };

/** Which axes a handle drags: -1 is the low edge, 1 the high edge, 0 neither. */
const MOVES: Record<Handle, { x: -1 | 0 | 1; y: -1 | 0 | 1 }> = {
  nw: { x: -1, y: -1 },
  n: { x: 0, y: -1 },
  ne: { x: 1, y: -1 },
  e: { x: 1, y: 0 },
  se: { x: 1, y: 1 },
  s: { x: 0, y: 1 },
  sw: { x: -1, y: 1 },
  w: { x: -1, y: 0 },
};

/** The new box for a resize drag to the unrotated box `to`; the opposite corner or edge midpoint keeps its page position, so a rotated shape grows, not slides. */
export function resizeShapeBox(shape: ShapeRecord, handle: Handle, to: Box): BoxPatch {
  const moves = MOVES[handle];
  const w = moves.x !== 0 ? to.w : shape.w;
  const h = moves.y !== 0 ? to.h : shape.h;
  const x = moves.x === -1 ? to.x : shape.x;
  const y = moves.y === -1 ? to.y : shape.y;

  const anchorX =
    moves.x === 1 ? shape.x : moves.x === -1 ? shape.x + shape.w : shape.x + shape.w / 2;
  const anchorY =
    moves.y === 1 ? shape.y : moves.y === -1 ? shape.y + shape.h : shape.y + shape.h / 2;
  const anchorPage = rotate({ x: anchorX, y: anchorY }, boxCenter(shape), shape.rotation);

  const candidate = { x, y, w, h };
  const candidateAnchorX = moves.x === 1 ? x : moves.x === -1 ? x + w : x + w / 2;
  const candidateAnchorY = moves.y === 1 ? y : moves.y === -1 ? y + h : y + h / 2;
  const candidatePage = rotate(
    { x: candidateAnchorX, y: candidateAnchorY },
    boxCenter(candidate),
    shape.rotation,
  );

  return {
    x: x + (anchorPage.x - candidatePage.x),
    y: y + (anchorPage.y - candidatePage.y),
    w,
    h,
  };
}

/** The changed box fields only, so the caller writes a minimal patch. */
export function boxPatch<S extends ShapeRecord>(shape: S, patch: BoxPatch): Partial<S> {
  const out: Partial<S> = {};
  if (patch.x !== shape.x) out.x = patch.x;
  if (patch.y !== shape.y) out.y = patch.y;
  if (patch.w !== shape.w) out.w = patch.w;
  if (patch.h !== shape.h) out.h = patch.h;
  return out;
}

/** Scale box-relative points from one box size to another. */
export function scalePoints<T extends { x: number; y: number }>(
  points: T[],
  from: { w: number; h: number },
  to: { w: number; h: number },
): T[] {
  const sx = from.w === 0 ? 1 : to.w / from.w;
  const sy = from.h === 0 ? 1 : to.h / from.h;
  return points.map((point) => ({ ...point, x: point.x * sx, y: point.y * sy }));
}
