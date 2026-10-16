// Which side of each box an arrow leaves from and arrives at. The arrow picks
// the pair, not the author.

import type { Box, Vec } from "../types";

export type Side = "top" | "right" | "bottom" | "left";

/** A point on a box side, plus where on the box it sits from 0 to 1. The
 *  relative position is what a binding stores, so it survives a resize. */
export type Anchor = {
  /** Absolute page point on the box edge. */
  point: Vec;
  /** Relative to the box, 0 to 1 on each axis. */
  position: Vec;
  side: Side;
};

function center(box: Box): Vec {
  return { x: box.x + box.w / 2, y: box.y + box.h / 2 };
}

function anchorOn(box: Box, side: Side): Anchor {
  const c = center(box);
  switch (side) {
    case "top":
      return { point: { x: c.x, y: box.y }, position: { x: 0.5, y: 0 }, side };
    case "bottom":
      return { point: { x: c.x, y: box.y + box.h }, position: { x: 0.5, y: 1 }, side };
    case "left":
      return { point: { x: box.x, y: c.y }, position: { x: 0, y: 0.5 }, side };
    case "right":
      return { point: { x: box.x + box.w, y: c.y }, position: { x: 1, y: 0.5 }, side };
  }
}

/** The pair of sides that face each other. Boxes that overlap horizontally get
 *  the same vertical side, so the arrow runs past them, never through them. */
export function bestAnchors(source: Box, target: Box): { source: Anchor; target: Anchor } {
  const gapX = Math.max(target.x - (source.x + source.w), source.x - (target.x + target.w));

  if (gapX <= 0) {
    const side = detourSide(source, target);
    return { source: anchorOn(source, side), target: anchorOn(target, side) };
  }

  const gapY = Math.max(target.y - (source.y + source.h), source.y - (target.y + target.h));

  if (gapX > gapY) {
    const targetIsRight = center(target).x >= center(source).x;
    return {
      source: anchorOn(source, targetIsRight ? "right" : "left"),
      target: anchorOn(target, targetIsRight ? "left" : "right"),
    };
  }

  const targetIsBelow = center(target).y >= center(source).y;
  return {
    source: anchorOn(source, targetIsBelow ? "bottom" : "top"),
    target: anchorOn(target, targetIsBelow ? "top" : "bottom"),
  };
}

// Which side a same-side pair travels on: the wider overhang wins, ties go right.
function detourSide(source: Box, target: Box): "right" | "left" {
  const sL = source.x;
  const sR = source.x + source.w;
  const tL = target.x;
  const tR = target.x + target.w;
  if (sL <= tL && sR >= tR) return sR - tR >= tL - sL ? "right" : "left";
  if (tL <= sL && tR >= sR) return tR - sR >= sL - tL ? "right" : "left";
  return "right";
}

/** The x a same-side path travels along outside both boxes. Both anchors carry
 *  the box edge on their side, so the detour is one margin past the further one. */
export function sideDetour(anchors: { source: Anchor; target: Anchor }, margin = 40): number {
  const side = anchors.source.side;
  if (side === "left") return Math.min(anchors.source.point.x, anchors.target.point.x) - margin;
  return Math.max(anchors.source.point.x, anchors.target.point.x) + margin;
}

/** The outline an arrow binds to: a box, or the ellipse drawn round it. */
export type Outline = { cx: number; cy: number; rx: number; ry: number; round: boolean };

/** Where the line from this outline's centre toward `toward` crosses the
 *  outline, `gap` further out. */
export function outlinePoint(o: Outline, toward: Vec, gap = 0): Vec {
  const dx = toward.x - o.cx;
  const dy = toward.y - o.cy;
  const len = Math.hypot(dx, dy);
  if (len === 0) return { x: o.cx, y: o.cy };
  const t = o.round
    ? 1 / Math.hypot(dx / o.rx, dy / o.ry)
    : Math.min(dx === 0 ? Infinity : o.rx / Math.abs(dx), dy === 0 ? Infinity : o.ry / Math.abs(dy));
  const reach = t * len + gap;
  return { x: o.cx + (dx / len) * reach, y: o.cy + (dy / len) * reach };
}
