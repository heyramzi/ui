import type { Vec } from "../types";

/** Shortest distance from `point` to the segment `a` to `b`, clamped to the ends. */
export function pointToSegmentDistance(point: Vec, a: Vec, b: Vec): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const lengthSq = abx * abx + aby * aby;
  if (lengthSq === 0) return Math.hypot(point.x - a.x, point.y - a.y);
  let t = ((point.x - a.x) * abx + (point.y - a.y) * aby) / lengthSq;
  if (t < 0) t = 0;
  if (t > 1) t = 1;
  const projX = a.x + t * abx;
  const projY = a.y + t * aby;
  return Math.hypot(point.x - projX, point.y - projY);
}
