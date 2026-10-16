import type { Vec } from "../types";

/** Component-wise sum. */
export function add(a: Vec, b: Vec): Vec {
  return { x: a.x + b.x, y: a.y + b.y };
}

/** Component-wise difference, `a` minus `b`. */
export function sub(a: Vec, b: Vec): Vec {
  return { x: a.x - b.x, y: a.y - b.y };
}

/** Multiply both components by `factor`. */
export function scale(v: Vec, factor: number): Vec {
  return { x: v.x * factor, y: v.y * factor };
}

/** Straight-line distance between two points. */
export function dist(a: Vec, b: Vec): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Rotate a point `radians` clockwise around `center`, in screen coordinates. */
export function rotate(point: Vec, center: Vec, radians: number): Vec {
  if (radians === 0) return { x: point.x, y: point.y };
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}
