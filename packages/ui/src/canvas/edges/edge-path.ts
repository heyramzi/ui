// The path and arrowhead placement for one link, chosen by its route. Pure, so the choice is testable.

import { getBezierPath, getSmoothStepPath, getStraightPath, Position } from "@xyflow/svelte";
import {
  bestAnchors,
  sideDetour,
  sideFromHandle,
  type Anchor,
  type Side,
} from "#src/canvas/headless/edge-anchors.js";
import { parseBox } from "#src/canvas/headless/edge-memo.js";

export type EdgeRoute = "elbow" | "curved" | "straight";

export type EdgeGeometry = {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
};

export type Anchors = { source: Anchor; target: Anchor };
export type Point = { x: number; y: number };
export type ArrowTip = Point & { angle: number };

/** The movable run of an elbow: it slides along `axis` from `base` within `min` and `max`; `x`, `y` is its middle. */
export type BendHandle = Point & { axis: "x" | "y"; base: number; min: number; max: number };
export type RoutedPath = { path: string; labelX: number; labelY: number; bend: BendHandle | null };

/** The corner radius a stepped link shares with the cards it joins. */
const CORNER = 8;
/** How far a same-side link runs past the cards, and the least it keeps once bent. */
const DETOUR = 40;
const DETOUR_FLOOR = 8;

const OUT: Record<Side, Point> = {
  top: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};

/** The bend an edge stores in its data: pixels the movable run sits off its unbent place. */
export function readBend(data: unknown): number {
  const raw = data && typeof data === "object" ? (data as Record<string, unknown>).bend : null;
  return typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
}

/** The bend that puts a handle's run under the pointer, kept inside the handle's limits. */
export function bendFromPointer(handle: BendHandle, pointer: Point): number {
  const at = handle.axis === "x" ? pointer.x : pointer.y;
  return Math.round(Math.min(handle.max, Math.max(handle.min, at)) - handle.base);
}

function mid(a: number, b: number): number {
  return (a + b) / 2;
}

function clamp(value: number, a: number, b: number): number {
  return Math.min(Math.max(a, b), Math.max(Math.min(a, b), value));
}

type Elbow = { points: Point[]; handle: BendHandle | null };

/** Out from `s` to the run at `at`, across it, then in to `t`. */
function runPoints(s: Anchor, t: Anchor, horizontal: boolean, at: number): Point[] {
  return horizontal
    ? [s, { x: at, y: s.y }, { x: at, y: t.y }, t]
    : [s, { x: s.x, y: at }, { x: t.x, y: at }, t];
}

/** The handle on the run at `at`, or none when the two ends line up and there is nothing to slide. */
function runHandle(
  { source: s, target: t }: Anchors,
  horizontal: boolean,
  at: number,
  limits: { base: number; min: number; max: number },
): BendHandle | null {
  const span = horizontal ? t.y - s.y : t.x - s.x;
  if (!(Math.abs(span) > 1)) return null;
  return {
    axis: horizontal ? "x" : "y",
    x: horizontal ? at : mid(s.x, t.x),
    y: horizontal ? mid(s.y, t.y) : at,
    ...limits,
  };
}

/** Same side: out past both cards, along, back in. The run keeps a margin outside them. */
function sameSideElbow(anchors: Anchors, bend: number): Elbow {
  const { source: s, target: t } = anchors;
  const out = OUT[s.side];
  const horizontal = out.x !== 0;
  const base = sideDetour(anchors, DETOUR);
  const edge = sideDetour(anchors, 0);
  const outward = horizontal ? out.x : out.y;
  const at = clamp(base + bend, edge + outward * DETOUR_FLOOR, outward > 0 ? Infinity : -Infinity);
  const handle = runHandle(anchors, horizontal, at, {
    base,
    min: outward > 0 ? edge + DETOUR_FLOOR : -Infinity,
    max: outward > 0 ? Infinity : edge - DETOUR_FLOOR,
  });
  return { points: runPoints(s, t, horizontal, at), handle };
}

/** Opposite sides: out, across at the middle, in. The across run is what a bend moves. */
function acrossElbow(anchors: Anchors, bend: number): Elbow {
  const { source: s, target: t } = anchors;
  const horizontal = OUT[s.side].x !== 0;
  const base = horizontal ? mid(s.x, t.x) : mid(s.y, t.y);
  const lo = horizontal ? Math.min(s.x, t.x) : Math.min(s.y, t.y);
  const hi = horizontal ? Math.max(s.x, t.x) : Math.max(s.y, t.y);
  const at = clamp(base + bend, lo, hi);
  const handle = runHandle(anchors, horizontal, at, { base, min: lo, max: hi });
  return { points: runPoints(s, t, horizontal, at), handle };
}

/** Square sides: one corner, when both ends are on the way there. */
function cornerElbow(anchors: Anchors): Elbow | null {
  const { source: s, target: t } = anchors;
  const inward = OUT[t.side];
  const horizontalOut = OUT[s.side].x !== 0;
  if (horizontalOut === (inward.x !== 0)) return null;
  const corner = horizontalOut ? { x: t.x, y: s.y } : { x: s.x, y: t.y };
  const arriving = horizontalOut ? Math.sign(t.y - s.y) : Math.sign(t.x - s.x);
  const wanted = horizontalOut ? -inward.y : -inward.x;
  return arriving === wanted ? { points: [s, corner, t], handle: null } : null;
}

/** The corners of an elbow between two anchors and the run a bend moves. Null when it must turn back, which getSmoothStepPath routes. */
function elbowPoints(anchors: Anchors, bend: number): Elbow | null {
  const { source: s, target: t } = anchors;
  if (s.side === t.side) return sameSideElbow(anchors, bend);

  const out = OUT[s.side];
  const inward = OUT[t.side];
  const ahead = out.x * (t.x - s.x) + out.y * (t.y - s.y);
  if (ahead <= 0) return null;

  if (out.x === -inward.x && out.y === -inward.y) return acrossElbow(anchors, bend);
  return cornerElbow(anchors);
}

/** Corners drawn as the same quadratic arcs getSmoothStepPath draws, so the two routes match. */
function roundedPath(points: Point[]): string {
  const pts = points.filter(
    (p, i) => i === 0 || p.x !== points[i - 1].x || p.y !== points[i - 1].y,
  );
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const c = pts[i + 1];
    const r = Math.min(
      CORNER,
      Math.hypot(b.x - a.x, b.y - a.y) / 2,
      Math.hypot(c.x - b.x, c.y - b.y) / 2,
    );
    const collinear = (a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y);
    if (collinear || !(r > 0.5)) {
      d += ` L ${b.x} ${b.y}`;
      continue;
    }
    const before = { x: b.x - Math.sign(b.x - a.x) * r, y: b.y - Math.sign(b.y - a.y) * r };
    const after = { x: b.x + Math.sign(c.x - b.x) * r, y: b.y + Math.sign(c.y - b.y) * r };
    d += ` L ${before.x} ${before.y} Q ${b.x} ${b.y} ${after.x} ${after.y}`;
  }
  const last = pts[pts.length - 1];
  return `${d} L ${last.x} ${last.y}`;
}

/** The middle of the longest run, where a label sits when the link has no bend handle. */
function middleOf(points: Point[]): Point {
  let best = { length: -1, at: points[0] };
  for (let i = 1; i < points.length; i++) {
    const length = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    if (length > best.length)
      best = {
        length,
        at: { x: mid(points[i].x, points[i - 1].x), y: mid(points[i].y, points[i - 1].y) },
      };
  }
  return best.at;
}

/** The corners an elbow turns at, for a hand-ruled drawing to follow. Null for any other route. */
export function elbowCorners(route: EdgeRoute, anchors: Anchors | null, bend = 0): Point[] | null {
  if (route !== "elbow" || !anchors) return null;
  return elbowPoints(anchors, bend)?.points ?? null;
}

export function routeEdgePath(
  route: EdgeRoute,
  geometry: EdgeGeometry,
  anchors: Anchors | null,
  bend = 0,
): RoutedPath {
  if (route === "straight") {
    const [path, labelX, labelY] = getStraightPath(geometry);
    return { path, labelX, labelY, bend: null };
  }
  if (route === "curved") {
    const [path, labelX, labelY] = getBezierPath(geometry);
    return { path, labelX, labelY, bend: null };
  }
  const plan = anchors ? elbowPoints(anchors, bend) : null;
  if (plan) {
    const label = plan.handle ?? middleOf(plan.points);
    return { path: roundedPath(plan.points), labelX: label.x, labelY: label.y, bend: plan.handle };
  }
  const [path, labelX, labelY] = getSmoothStepPath({ ...geometry, borderRadius: CORNER });
  return { path, labelX, labelY, bend: null };
}

export type LinkInput = {
  route: EdgeRoute;
  bend: number;
  /** Each end's `boxKey`, "" until the card is measured. */
  fromBox: string;
  toBox: string;
  /** The edge's stored handle ids. */
  sourceHandle?: string | null;
  targetHandle?: string | null;
  /** The geometry xyflow measured, used until both cards have a size. */
  fallback: EdgeGeometry;
};

export type Link = RoutedPath & {
  anchors: Anchors | null;
  geometry: EdgeGeometry;
  tips: { start: ArrowTip; end: ArrowTip };
};

/** Everything one link draws: its sides, path, bend handle and arrowheads, from where its cards sit. */
export function planLink(input: LinkInput): Link {
  const from = parseBox(input.fromBox);
  const to = parseBox(input.toBox);
  let anchors: Anchors | null = null;
  let geometry = input.fallback;
  if (from && to) {
    anchors = bestAnchors(from, to, {
      source: sideFromHandle(input.sourceHandle),
      target: sideFromHandle(input.targetHandle),
    });
    geometry = {
      sourceX: anchors.source.x,
      sourceY: anchors.source.y,
      sourcePosition: anchors.source.side as Position,
      targetX: anchors.target.x,
      targetY: anchors.target.y,
      targetPosition: anchors.target.side as Position,
    };
  }
  return {
    ...routeEdgePath(input.route, geometry, anchors, input.bend),
    anchors,
    geometry,
    tips: arrowTips(input.route, geometry, anchors),
  };
}

/** The direction a link travels when it meets a box on `side`: straight into it. */
function into(side: Side): number {
  switch (side) {
    case "left":
      return 0;
    case "right":
      return Math.PI;
    case "top":
      return Math.PI / 2;
    case "bottom":
      return -Math.PI / 2;
  }
}

/** Where an arrowhead sits and points at each end: along a straight link's line, square on to the box otherwise. */
export function arrowTips(
  route: EdgeRoute,
  geometry: EdgeGeometry,
  anchors: Anchors | null,
): { start: ArrowTip; end: ArrowTip } {
  const { sourceX, sourceY, targetX, targetY } = geometry;
  const straight = Math.atan2(targetY - sourceY, targetX - sourceX);
  const startAngle =
    route === "straight" || !anchors ? straight + Math.PI : into(anchors.source.side);
  const endAngle = route === "straight" || !anchors ? straight : into(anchors.target.side);
  return {
    start: { x: sourceX, y: sourceY, angle: startAngle },
    end: { x: targetX, y: targetY, angle: endAngle },
  };
}
