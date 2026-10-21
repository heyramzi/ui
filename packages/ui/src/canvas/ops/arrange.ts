// Align, distribute and stack as pure maths, so the editor and the CLI place
// nodes the same way.

export interface ArrangeItem {
  id: string;
  position: { x: number; y: number };
  width: number;
  height: number;
}

export type Axis = "horizontal" | "vertical";

export type Positions = Map<string, { x: number; y: number }>;

export const ALIGNMENTS = [
  "left",
  "right",
  "top",
  "bottom",
  "center-horizontal",
  "center-vertical",
] as const;

export type Alignment = (typeof ALIGNMENTS)[number];

// =========================
// ALIGN
// =========================

/** "center-horizontal" puts the centres on one vertical axis, as tldraw named it. */
export function alignPositions(items: readonly ArrangeItem[], alignment: Alignment): Positions {
  const moved: Positions = new Map();
  if (items.length < 2) return moved;
  const left = Math.min(...items.map((item) => item.position.x));
  const top = Math.min(...items.map((item) => item.position.y));
  const right = Math.max(...items.map((item) => item.position.x + item.width));
  const bottom = Math.max(...items.map((item) => item.position.y + item.height));

  for (const item of items) {
    const { x, y } = item.position;
    const next = { x, y };
    if (alignment === "left") next.x = left;
    else if (alignment === "right") next.x = right - item.width;
    else if (alignment === "top") next.y = top;
    else if (alignment === "bottom") next.y = bottom - item.height;
    else if (alignment === "center-horizontal") next.x = (left + right) / 2 - item.width / 2;
    else next.y = (top + bottom) / 2 - item.height / 2;
    if (next.x !== x || next.y !== y) moved.set(item.id, next);
  }
  return moved;
}

// =========================
// DISTRIBUTE AND STACK
// =========================

function along(axis: Axis) {
  const horizontal = axis === "horizontal";
  return {
    start: (item: ArrangeItem) => (horizontal ? item.position.x : item.position.y),
    size: (item: ArrangeItem) => (horizontal ? item.width : item.height),
    place: (item: ArrangeItem, at: number) =>
      horizontal ? { x: at, y: item.position.y } : { x: item.position.x, y: at },
  };
}

function inOrder(items: readonly ArrangeItem[], axis: Axis): ArrangeItem[] {
  const { start } = along(axis);
  return [...items].sort((a, b) => start(a) - start(b));
}

/** Space the boxes so every gap matches. The first and last stay where they are. */
export function distributePositions(items: readonly ArrangeItem[], axis: Axis): Positions {
  const moved: Positions = new Map();
  if (items.length < 3) return moved;
  const { start, size, place } = along(axis);
  const sorted = inOrder(items, axis);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (!first || !last) return moved;
  const span = start(last) + size(last) - start(first);
  const used = sorted.reduce((sum, item) => sum + size(item), 0);
  const gap = (span - used) / (sorted.length - 1);

  let cursor = start(first);
  for (const item of sorted) {
    if (cursor !== start(item)) moved.set(item.id, place(item, cursor));
    cursor += size(item) + gap;
  }
  return moved;
}

/** Put the boxes in a row or a column, `gap` apart, in the order they sit now. The first stays put. */
export function stackPositions(items: readonly ArrangeItem[], axis: Axis, gap: number): Positions {
  const moved: Positions = new Map();
  if (items.length < 2) return moved;
  const { start, size, place } = along(axis);
  const sorted = inOrder(items, axis);
  const first = sorted[0];
  if (!first) return moved;

  let cursor = start(first);
  for (const item of sorted) {
    if (cursor !== start(item)) moved.set(item.id, place(item, cursor));
    cursor += size(item) + gap;
  }
  return moved;
}
