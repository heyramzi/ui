import type { BindingRecord, Id, ShapeRecord, Vec } from "../types";
import { boxCenter } from "../math/box";
import { rotate } from "../math/vec";
import type { ArrowShape } from "../shapes/arrow";
import { anchorPagePoint } from "./anchor";

export type ArrowEnds = { start: Vec; end: Vec };
export type GetShape = (id: Id) => ShapeRecord | undefined;

/** A stored, box-relative endpoint lifted into page space, rotation included. */
function freeEnd(arrow: ArrowShape, prop: Vec): Vec {
  const local = { x: arrow.x + prop.x, y: arrow.y + prop.y };
  return rotate(local, boxCenter(arrow), arrow.rotation);
}

/**
 * Where a segment first meets the box boundary, in the box's own frame, or null
 * when the segment never crosses (it starts and stays inside).
 */
function crossBox(
  from: Vec,
  to: Vec,
  box: { x: number; y: number; w: number; h: number },
): Vec | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  let enter = 0;
  let exit = 1;

  const slab = (start: number, delta: number, min: number, max: number): boolean => {
    if (delta === 0) return start >= min && start <= max;
    let a = (min - start) / delta;
    let b = (max - start) / delta;
    if (a > b) [a, b] = [b, a];
    enter = Math.max(enter, a);
    exit = Math.min(exit, b);
    return enter <= exit;
  };

  if (!slab(from.x, dx, box.x, box.x + box.w)) return null;
  if (!slab(from.y, dy, box.y, box.y + box.h)) return null;

  if (enter > 0) return { x: from.x + dx * enter, y: from.y + dy * enter };
  if (exit < 1) return { x: from.x + dx * exit, y: from.y + dy * exit };
  return null;
}

/** The point on the target's edge where the line from `from` to `to` crosses in. */
export function edgeCrossing(from: Vec, to: Vec, target: ShapeRecord): Vec | null {
  const center = boxCenter(target);
  const localFrom = rotate(from, center, -target.rotation);
  const localTo = rotate(to, center, -target.rotation);
  const hit = crossBox(localFrom, localTo, target);
  return hit ? rotate(hit, center, target.rotation) : null;
}

/** The page position of each arrow end: a bound end sits on its target's edge, on the line toward the stored anchor, which the other end also feeds. */
export function resolveArrowEnds(
  arrow: ArrowShape,
  bindings: BindingRecord[],
  getShape: GetShape,
): ArrowEnds {
  const startBinding = bindings.find((b) => b.arrowId === arrow.id && b.terminal === "start");
  const endBinding = bindings.find((b) => b.arrowId === arrow.id && b.terminal === "end");
  const startTarget = startBinding ? getShape(startBinding.targetId) : undefined;
  const endTarget = endBinding ? getShape(endBinding.targetId) : undefined;

  const freeStart = freeEnd(arrow, arrow.props.start);
  const freeEndPoint = freeEnd(arrow, arrow.props.end);

  const startRef =
    startTarget && startBinding ? anchorPagePoint(startTarget, startBinding.anchor) : freeStart;
  const endRef =
    endTarget && endBinding ? anchorPagePoint(endTarget, endBinding.anchor) : freeEndPoint;

  const start = startTarget ? (edgeCrossing(endRef, startRef, startTarget) ?? startRef) : freeStart;
  const end = endTarget ? (edgeCrossing(startRef, endRef, endTarget) ?? endRef) : freeEndPoint;

  return { start, end };
}
