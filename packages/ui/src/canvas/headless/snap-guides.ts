// Figma-style alignment magnetism: snap a dragged rect onto the nearest edge or
// centre of another card, and report the lines. Drawn by snap-guides.svelte.

export type SnapRect = { x: number; y: number; width: number; height: number };

/** A line to draw, in flow coordinates. `axis: "x"` is a vertical line. */
export type SnapGuide = {
  axis: "x" | "y";
  /** The coordinate the line sits on: x for a vertical line, y for a horizontal one. */
  position: number;
  /** The extent the line is drawn over, so it visibly joins the cards it aligns. */
  start: number;
  end: number;
};

export type SnapResult = {
  x: number;
  y: number;
  guides: SnapGuide[];
};

/** Default pull, in flow units. Callers divide by zoom to hold it on screen. */
export const SNAP_THRESHOLD = 6;

type Axis = "x" | "y";

const SIZE_KEY: Record<Axis, "width" | "height"> = { x: "width", y: "height" };
const CROSS: Record<Axis, Axis> = { x: "y", y: "x" };

/** The three lines a rect offers on one axis: its two edges and its centre. */
function linesOf(rect: SnapRect, axis: Axis): [number, number, number] {
  const start = rect[axis];
  const size = rect[SIZE_KEY[axis]];
  return [start, start + size / 2, start + size];
}

function snapAxis(
  dragged: SnapRect,
  others: SnapRect[],
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

/** Every other rect that sits on `position`, so the guide spans all of them. */
function guideFor(snapped: SnapRect, others: SnapRect[], axis: Axis, position: number): SnapGuide {
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
  dragged: SnapRect,
  others: SnapRect[],
  threshold: number = SNAP_THRESHOLD,
): SnapResult {
  if (others.length === 0) return { x: dragged.x, y: dragged.y, guides: [] };

  const horizontal = snapAxis(dragged, others, "x", threshold);
  const vertical = snapAxis(dragged, others, "y", threshold);

  const snapped: SnapRect = {
    ...dragged,
    x: dragged.x + horizontal.delta,
    y: dragged.y + vertical.delta,
  };

  const guides: SnapGuide[] = [];
  if (horizontal.position !== null) {
    guides.push(guideFor(snapped, others, "x", horizontal.position));
  }
  if (vertical.position !== null) {
    guides.push(guideFor(snapped, others, "y", vertical.position));
  }

  return { x: snapped.x, y: snapped.y, guides };
}

/**
 * The editor's seam. Pull a held free node onto the others and report the
 * lines. A node in a container is not a candidate.
 */
// The correction goes back into the returned nodes, which is what makes it
// magnetism and not a hint. xyflow recomputes from the drag origin, so it
// never stacks.
export function snapDraggedNode<
  T extends {
    id: string;
    position: { x: number; y: number };
    parentId?: string;
    hidden?: boolean;
    measured?: { width?: number; height?: number };
  },
>(nodes: T[], held: T | null, zoom: number): { nodes: T[]; guides: SnapGuide[] } {
  const rect = freeNodeRect(held);
  if (!held || !rect) return { nodes, guides: [] };

  const others = nodes
    .filter((n) => n.id !== held.id)
    .map(freeNodeRect)
    .filter((r): r is SnapRect => r !== null);

  // The threshold is in flow units, so the pull is the same few pixels on
  // screen whether the board is zoomed to a wall or to one card.
  const snap = computeSnap(rect, others, SNAP_THRESHOLD / (zoom || 1));
  const moved = snap.x !== held.position.x || snap.y !== held.position.y;
  const next = moved
    ? nodes.map((n) => (n.id === held.id ? { ...n, position: { x: snap.x, y: snap.y } } : n))
    : nodes;
  return { nodes: next, guides: snap.guides };
}

/** A candidate rect, or null for a node a container positions or hides. */
function freeNodeRect(
  node: {
    position: { x: number; y: number };
    parentId?: string;
    hidden?: boolean;
    measured?: { width?: number; height?: number };
  } | null,
): SnapRect | null {
  if (!node || node.parentId || node.hidden) return null;
  const { width, height } = node.measured ?? {};
  if (!width || !height) return null;
  return { x: node.position.x, y: node.position.y, width, height };
}
