import type { ShapeRecord, Vec } from "../types";
import { boxCenter } from "../math/box";
import { rotate } from "../math/vec";

/** tldraw's center-snap: a point this close to the middle sticks dead center. */
const MIN_CENTER_SNAP = 4;
const MAX_CENTER_SNAP = 16;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** The page point an anchor (0 to 1 across the box) lands on, rotation included. */
export function anchorPagePoint(target: ShapeRecord, anchor: Vec): Vec {
  const local = { x: target.x + anchor.x * target.w, y: target.y + anchor.y * target.h };
  return rotate(local, boxCenter(target), target.rotation);
}

/**
 * The 0 to 1 anchor a page point maps to. Near the middle it snaps to center,
 * the way tldraw's arc arrows do, and it never leaves the box.
 */
export function anchorFromPoint(target: ShapeRecord, point: Vec): Vec {
  const center = boxCenter(target);
  const local = rotate(point, center, -target.rotation);
  const nx = target.w === 0 ? 0.5 : (local.x - target.x) / target.w;
  const ny = target.h === 0 ? 0.5 : (local.y - target.y) / target.h;

  const snap = Math.min(
    Math.max(Math.min(target.w, target.h) * 0.15, MIN_CENTER_SNAP),
    MAX_CENTER_SNAP
  );
  if (Math.hypot(local.x - center.x, local.y - center.y) < snap) {
    return { x: 0.5, y: 0.5 };
  }
  return { x: clamp01(nx), y: clamp01(ny) };
}
