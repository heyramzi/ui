/** Which side of each box an edge leaves from and arrives at. Sides are xyflow `Position` values. */

export type Side = "top" | "right" | "bottom" | "left";
export type Rect = { x: number; y: number; width: number; height: number };
export type Anchor = { x: number; y: number; side: Side };

function center(rect: Rect) {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

function anchorOn(rect: Rect, side: Side): Anchor {
  const c = center(rect);
  switch (side) {
    case "top":
      return { x: c.x, y: rect.y, side };
    case "bottom":
      return { x: c.x, y: rect.y + rect.height, side };
    case "left":
      return { x: rect.x, y: c.y, side };
    case "right":
      return { x: rect.x + rect.width, y: c.y, side };
  }
}

/** The side a stored handle id names, or null for an id that isn't one of the four. */
export function sideFromHandle(id: string | null | undefined): Side | null {
  return id === "top" || id === "right" || id === "bottom" || id === "left" ? id : null;
}

/** The side of `rect` that looks at `point`: the wider pull, scaled by the box's own shape, wins. */
function sideFacing(rect: Rect, point: { x: number; y: number }): Side {
  const c = center(rect);
  const dx = (point.x - c.x) / rect.width;
  const dy = (point.y - c.y) / rect.height;
  if (Math.abs(dx) > Math.abs(dy)) return dx >= 0 ? "right" : "left";
  return dy >= 0 ? "bottom" : "top";
}

type Pins = { source?: Side | null; target?: Side | null };

/** The anchors when the author pinned an end, or null for a link with no pin. */
function pinnedAnchors(
  source: Rect,
  target: Rect,
  pins: Pins,
): { source: Anchor; target: Anchor } | null {
  if (pins.source && pins.target) {
    return { source: anchorOn(source, pins.source), target: anchorOn(target, pins.target) };
  }
  if (pins.source) {
    const from = anchorOn(source, pins.source);
    return { source: from, target: anchorOn(target, sideFacing(target, from)) };
  }
  if (pins.target) {
    const to = anchorOn(target, pins.target);
    return { source: anchorOn(source, sideFacing(source, to)), target: to };
  }
  return null;
}

/** The sides that face each other. A pin is the dot the author dragged from: it wins, and the free end faces it. */
export function bestAnchors(
  source: Rect,
  target: Rect,
  pins: Pins = {},
): { source: Anchor; target: Anchor } {
  const pinned = pinnedAnchors(source, target, pins);
  if (pinned) return pinned;

  const gapX = Math.max(target.x - (source.x + source.width), source.x - (target.x + target.width));
  const gapY = Math.max(
    target.y - (source.y + source.height),
    source.y - (target.y + target.height),
  );

  if (gapX <= 0 && gapY <= 0) {
    const side = detourSide(source, target);
    return { source: anchorOn(source, side), target: anchorOn(target, side) };
  }

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

// Which side an overlapping pair travels on: the wider overhang wins, ties go right.
function detourSide(source: Rect, target: Rect): "right" | "left" {
  const sL = source.x;
  const sR = source.x + source.width;
  const tL = target.x;
  const tR = target.x + target.width;
  if (sL <= tL && sR >= tR) {
    return sR - tR >= tL - sL ? "right" : "left";
  }
  if (tL <= sL && tR >= sR) {
    return tR - sR >= sL - tL ? "right" : "left";
  }
  return "right";
}

/** The x (left, right) or y (top, bottom) a same-side path runs along: one margin past the further box edge. */
export function sideDetour(anchors: { source: Anchor; target: Anchor }, margin = 40): number {
  const { source, target } = anchors;
  switch (source.side) {
    case "left":
      return Math.min(source.x, target.x) - margin;
    case "right":
      return Math.max(source.x, target.x) + margin;
    case "top":
      return Math.min(source.y, target.y) - margin;
    case "bottom":
      return Math.max(source.y, target.y) + margin;
  }
}

/** The outline an arrow binds to: a box, or the ellipse drawn round it at `rx`, `ry`. */
export type Outline = { cx: number; cy: number; rx: number; ry: number; round: boolean };

/** Where the line from this outline's centre toward `toward` crosses the outline, `gap` further out. */
export function outlinePoint(o: Outline, toward: { x: number; y: number }, gap = 0) {
  const dx = toward.x - o.cx;
  const dy = toward.y - o.cy;
  const len = Math.hypot(dx, dy);
  if (len === 0) return { x: o.cx, y: o.cy };
  const t = o.round
    ? 1 / Math.hypot(dx / o.rx, dy / o.ry)
    : Math.min(
        dx === 0 ? Infinity : o.rx / Math.abs(dx),
        dy === 0 ? Infinity : o.ry / Math.abs(dy),
      );
  const reach = t * len + gap;
  return { x: o.cx + (dx / len) * reach, y: o.cy + (dy / len) * reach };
}
