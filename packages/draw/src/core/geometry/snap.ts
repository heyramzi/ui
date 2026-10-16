// Alignment magnetism: snap a dragged box onto the nearest edge or centre of
// another box, and report the lines to draw.

import type { Box, Id } from "../types";

/** A line to draw. `axis: "x"` is a vertical line. */
export type SnapGuide = {
  axis: "x" | "y";
  /** The coordinate the line sits on: x for a vertical line, y for a horizontal one. */
  position: number;
  /** The extent the line is drawn over, so it visibly joins the boxes it aligns. */
  start: number;
  end: number;
};

export type SnapResult = {
  x: number;
  y: number;
  guides: SnapGuide[];
};

/** Default pull, in page units. Callers divide by zoom to hold it on screen. */
export const SNAP_THRESHOLD = 6;

type Axis = "x" | "y";

const SIZE_KEY: Record<Axis, "w" | "h"> = { x: "w", y: "h" };
const CROSS: Record<Axis, Axis> = { x: "y", y: "x" };

/** The three lines a box offers on one axis: its two edges and its centre. */
function linesOf(box: Box, axis: Axis): [number, number, number] {
  const start = box[axis];
  const size = box[SIZE_KEY[axis]];
  return [start, start + size / 2, start + size];
}

function snapAxis(
  dragged: Box,
  others: Box[],
  axis: Axis,
  threshold: number,
): { delta: number; position: number | null } {
  const mine = linesOf(dragged, axis);
  // Flat rather than nested: every pairing of one of our lines with one of
  // theirs, then the nearest pairing inside the threshold.
  const pairings = others.flatMap((other) =>
    linesOf(other, axis).flatMap((theirs) =>
      mine.map((own) => ({ delta: theirs - own, position: theirs })),
    ),
  );
  const inRange = pairings.filter((pair) => Math.abs(pair.delta) <= threshold);
  if (inRange.length === 0) return { delta: 0, position: null };
  return inRange.reduce((a, b) => (Math.abs(b.delta) < Math.abs(a.delta) ? b : a));
}

/** Every other box that sits on `position`, so the guide spans all of them. */
function guideFor(snapped: Box, others: Box[], axis: Axis, position: number): SnapGuide {
  const cross = CROSS[axis];
  const size = SIZE_KEY[cross];
  const onLine = others.filter((other) =>
    linesOf(other, axis).some((line) => Math.abs(line - position) < 0.5),
  );
  return {
    axis,
    position,
    start: Math.min(snapped[cross], ...onLine.map((o) => o[cross])),
    end: Math.max(snapped[cross] + snapped[size], ...onLine.map((o) => o[cross] + o[size])),
  };
}

/** Pull `dragged` onto the nearest line of `others`, one axis at a time. */
export function computeSnap(
  dragged: Box,
  others: Box[],
  threshold: number = SNAP_THRESHOLD,
): SnapResult {
  if (others.length === 0) return { x: dragged.x, y: dragged.y, guides: [] };

  const horizontal = snapAxis(dragged, others, "x", threshold);
  const vertical = snapAxis(dragged, others, "y", threshold);

  const snapped: Box = {
    ...dragged,
    x: dragged.x + horizontal.delta,
    y: dragged.y + vertical.delta,
  };

  const guides: SnapGuide[] = [];
  if (horizontal.position !== null)
    guides.push(guideFor(snapped, others, "x", horizontal.position));
  if (vertical.position !== null) guides.push(guideFor(snapped, others, "y", vertical.position));

  return { x: snapped.x, y: snapped.y, guides };
}

/** A box a dragged shape can snap to. A child of a container is not a candidate,
 *  since its coordinates are relative to the parent. */
export type SnapShape = {
  id: Id;
  x: number;
  y: number;
  w: number;
  h: number;
  parentId?: Id | null;
};

/** The editor's seam: pull a held top-level shape onto the others and report the lines, writing the correction into the returned shapes so it is magnetism, not a hint. */
export function snapShape<T extends SnapShape>(
  shapes: T[],
  held: T | null,
  zoom: number,
): { shapes: T[]; guides: SnapGuide[] } {
  if (!held || held.parentId) return { shapes, guides: [] };

  const others = shapes.filter((s) => s.id !== held.id && !s.parentId);
  // The threshold is in page units, so the pull is the same few pixels on screen
  // whether the board is zoomed to a wall or to one card.
  const snap = computeSnap(held, others, SNAP_THRESHOLD / (zoom || 1));
  const moved = snap.x !== held.x || snap.y !== held.y;
  const next = moved
    ? shapes.map((s) => (s.id === held.id ? { ...s, x: snap.x, y: snap.y } : s))
    : shapes;
  return { shapes: next, guides: snap.guides };
}
