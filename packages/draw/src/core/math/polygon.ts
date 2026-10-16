import type { Vec } from "../types";
import { pointToSegmentDistance } from "./segment";

/** True when `point` is inside `polygon`, or on one of its edges. */
export function pointInPolygon(point: Vec, polygon: Vec[]): boolean {
  if (polygon.length < 3) return false;
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    if (pointToSegmentDistance(point, a, b) === 0) return true;
  }
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    const straddles = a.y > point.y !== b.y > point.y;
    if (!straddles) continue;
    const xAtY = ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;
    if (point.x < xAtY) inside = !inside;
  }
  return inside;
}

/** Shortest distance from `point` to the open polyline through `points`. */
export function distanceToPolyline(point: Vec, points: Vec[]): number {
  if (points.length === 0) return Infinity;
  if (points.length === 1) return Math.hypot(point.x - points[0].x, point.y - points[0].y);
  let closest = Infinity;
  for (let i = 0; i < points.length - 1; i += 1) {
    const d = pointToSegmentDistance(point, points[i], points[i + 1]);
    if (d < closest) closest = d;
  }
  return closest;
}

/** Ramer-Douglas-Peucker: keep the points that carry the shape, drop the rest. Ends always survive. */
export function simplifyPolyline<T extends Vec>(points: T[], tolerance: number): T[] {
  if (points.length <= 2) return points.slice();
  const first = points[0];
  const last = points[points.length - 1];
  let farthest = 0;
  let farthestDistance = 0;
  for (let i = 1; i < points.length - 1; i += 1) {
    const d = pointToSegmentDistance(points[i], first, last);
    if (d > farthestDistance) {
      farthestDistance = d;
      farthest = i;
    }
  }
  if (farthestDistance <= tolerance) return [first, last];
  const left = simplifyPolyline(points.slice(0, farthest + 1), tolerance);
  const right = simplifyPolyline(points.slice(farthest), tolerance);
  return left.slice(0, -1).concat(right);
}
