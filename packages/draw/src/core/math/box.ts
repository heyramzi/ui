import type { Box, Vec } from "../types";
import { rotate } from "./vec";

/** The point at the middle of a box. */
export function boxCenter(box: Box): Vec {
  return { x: box.x + box.w / 2, y: box.y + box.h / 2 };
}

/** The four corners, clockwise from the top-left, before rotation. */
export function boxCorners(box: Box): [Vec, Vec, Vec, Vec] {
  return [
    { x: box.x, y: box.y },
    { x: box.x + box.w, y: box.y },
    { x: box.x + box.w, y: box.y + box.h },
    { x: box.x, y: box.y + box.h },
  ];
}

/** True when `point` sits on or inside `box`. */
export function boxContains(box: Box, point: Vec): boolean {
  return (
    point.x >= box.x &&
    point.x <= box.x + box.w &&
    point.y >= box.y &&
    point.y <= box.y + box.h
  );
}

/** True when two axis-aligned boxes share any area, edges included. */
export function boxIntersects(a: Box, b: Box): boolean {
  return (
    a.x <= b.x + b.w &&
    b.x <= a.x + a.w &&
    a.y <= b.y + b.h &&
    b.y <= a.y + a.h
  );
}

/** The tight axis-aligned box around `box` once it turns `rotation` radians about its centre. */
export function rotatedBoxBounds(box: Box, rotation: number): Box {
  if (rotation === 0) return { x: box.x, y: box.y, w: box.w, h: box.h };
  const center = boxCenter(box);
  const corners = boxCorners(box).map((corner) => rotate(corner, center, rotation));
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const corner of corners) {
    if (corner.x < minX) minX = corner.x;
    if (corner.y < minY) minY = corner.y;
    if (corner.x > maxX) maxX = corner.x;
    if (corner.y > maxY) maxY = corner.y;
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}
