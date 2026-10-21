import type { CanvasOp } from "#src/canvas/ops/ops.js";
import type { CanvasNode } from "#src/canvas/types.js";
import { alignNodesHorizontally, alignNodesVertically } from "#src/canvas/headless/alignment.js";

/** The smallest a group frame gets. An app passes its own to `tidyGroup`. */
const DEFAULT_GROUP_MIN = { width: 250, height: 150 } as const;

type AlignDirection = "left" | "right" | "top" | "bottom" | "center-h" | "center-v";

type Positioned = { id: string; position: { x: number; y: number } };

function setX(nodes: Positioned[], x: number): void {
  for (const n of nodes) n.position.x = x;
}

function setY(nodes: Positioned[], y: number): void {
  for (const n of nodes) n.position.y = y;
}

const ALIGNERS: Record<AlignDirection, (nodes: Positioned[]) => void> = {
  left: (nodes) => setX(nodes, Math.min(...nodes.map((n) => n.position.x))),
  right: (nodes) => setX(nodes, Math.max(...nodes.map((n) => n.position.x))),
  top: (nodes) => alignNodesHorizontally(nodes as CanvasNode[]),
  bottom: (nodes) => setY(nodes, Math.max(...nodes.map((n) => n.position.y))),
  "center-h": (nodes) => alignNodesVertically(nodes as CanvasNode[]),
  "center-v": (nodes) =>
    setY(nodes, nodes.reduce((sum, n) => sum + n.position.y, 0) / nodes.length),
};

/**
 * Compute new positions for the given nodes based on alignment direction.
 * Returns a Map of nodeId to new position.
 */
export function alignNodes(
  selected: Positioned[],
  direction: AlignDirection,
): Map<string, { x: number; y: number }> {
  if (selected.length < 2) return new Map();

  const mutableNodes = selected.map((n) => ({
    id: n.id,
    position: { ...n.position },
  }));
  ALIGNERS[direction](mutableNodes);

  return new Map(mutableNodes.map((n) => [n.id, n.position]));
}

const TIDY_GAP = 40;

/**
 * Distribute selected nodes evenly along their dominant axis.
 * Detects whether nodes are mostly horizontal or vertical and
 * equalizes gaps while preserving the cross-axis positions.
 */
export function tidySelectedNodes(
  selected: Array<{
    id: string;
    position: { x: number; y: number };
    measured?: { width?: number; height?: number };
    width?: number;
    height?: number;
  }>,
): Map<string, { x: number; y: number }> {
  if (selected.length < 2) return new Map();

  const xs = selected.map((n) => n.position.x);
  const ys = selected.map((n) => n.position.y);
  const xSpread = Math.max(...xs) - Math.min(...xs);
  const ySpread = Math.max(...ys) - Math.min(...ys);

  const horizontal = xSpread >= ySpread;

  const sorted = [...selected].sort((a, b) =>
    horizontal ? a.position.x - b.position.x : a.position.y - b.position.y,
  );

  return horizontal ? stackAlongX(sorted) : stackAlongY(sorted);
}

type Tidyable = Parameters<typeof tidySelectedNodes>[0][number];

function stackAlongX(sorted: Tidyable[]): Map<string, { x: number; y: number }> {
  const result = new Map<string, { x: number; y: number }>();
  let cursorX = sorted[0].position.x;
  for (const node of sorted) {
    result.set(node.id, { x: cursorX, y: node.position.y });
    cursorX += (node.measured?.width ?? node.width ?? 200) + TIDY_GAP;
  }
  return result;
}

function stackAlongY(sorted: Tidyable[]): Map<string, { x: number; y: number }> {
  const result = new Map<string, { x: number; y: number }>();
  let cursorY = sorted[0].position.y;
  for (const node of sorted) {
    result.set(node.id, { x: node.position.x, y: cursorY });
    cursorY += (node.measured?.height ?? node.height ?? 100) + TIDY_GAP;
  }
  return result;
}

// A group box drawn around a selection: the padding on every side, plus the
// room the container's own title row takes at the top.
const GROUP_PADDING = 32;
const GROUP_HEADER = 36;

type Measurable = {
  id: string;
  position: { x: number; y: number };
  measured?: { width?: number; height?: number };
  width?: number;
  height?: number;
  parentId?: string;
};

const GROUP_GAP = 24;
const ROW_TOLERANCE = 8;

/**
 * Tidy a group's direct children: rows by reading order, even gaps, then the
 * box fitted around them. Null when the group is empty.
 */
export function tidyGroup(
  children: Measurable[],
  min: { width: number; height: number } = DEFAULT_GROUP_MIN,
): {
  positions: Map<string, { x: number; y: number }>;
  size: { width: number; height: number };
} | null {
  if (children.length === 0) return null;
  const width = (n: Measurable) => n.measured?.width ?? n.width ?? 200;
  const height = (n: Measurable) => n.measured?.height ?? n.height ?? 100;

  // A node joins the current row when it overlaps it vertically by more than a hair.
  const rows: { bottom: number; items: Measurable[] }[] = [];
  for (const n of [...children].sort((a, b) => a.position.y - b.position.y)) {
    const row = rows.at(-1);
    if (row && n.position.y < row.bottom - ROW_TOLERANCE) {
      row.items.push(n);
      row.bottom = Math.max(row.bottom, n.position.y + height(n));
    } else {
      rows.push({ bottom: n.position.y + height(n), items: [n] });
    }
  }

  const positions = new Map<string, { x: number; y: number }>();
  let y = GROUP_PADDING + GROUP_HEADER;
  let right = 0;
  for (const row of rows) {
    let x = GROUP_PADDING;
    for (const n of row.items.sort((a, b) => a.position.x - b.position.x)) {
      positions.set(n.id, { x, y });
      x += width(n) + GROUP_GAP;
    }
    right = Math.max(right, x - GROUP_GAP);
    y += Math.max(...row.items.map(height)) + GROUP_GAP;
  }

  return {
    positions,
    size: {
      width: Math.max(min.width, right + GROUP_PADDING),
      height: Math.max(min.height, y - GROUP_GAP + GROUP_PADDING),
    },
  };
}

export type GroupOptions = {
  /** The node type of the frame. Defaults to "group". */
  type?: string;
  /** Extra `data` on the frame beside its label. */
  data?: Record<string, unknown>;
};

/** Wrap a selection in a frame node, or [] when there is nothing to group. */
export function groupSelectionOps(
  selected: Measurable[],
  groupLabel: string,
  { type = "group", data = {} }: GroupOptions = {},
): CanvasOp[] {
  if (selected.length < 2) return [];
  const parentId = selected[0].parentId;
  const members = selected.filter((n) => n.parentId === parentId);
  if (members.length < 2) return [];

  const width = (n: Measurable) => n.measured?.width ?? n.width ?? 200;
  const height = (n: Measurable) => n.measured?.height ?? n.height ?? 100;
  const minX = Math.min(...members.map((n) => n.position.x));
  const minY = Math.min(...members.map((n) => n.position.y));
  const maxX = Math.max(...members.map((n) => n.position.x + width(n)));
  const maxY = Math.max(...members.map((n) => n.position.y + height(n)));

  const origin = { x: minX - GROUP_PADDING, y: minY - GROUP_PADDING - GROUP_HEADER };
  const groupId = crypto.randomUUID();

  return [
    {
      kind: "addNode",
      node: {
        id: groupId,
        type,
        position: origin,
        data: { ...data, label: groupLabel },
        width: maxX - minX + GROUP_PADDING * 2,
        height: maxY - minY + GROUP_PADDING * 2 + GROUP_HEADER,
        ...(parentId ? { parentId } : {}),
      },
    },
    ...members.flatMap((n): CanvasOp[] => [
      { kind: "setParent", nodeId: n.id, parentId: groupId, extent: "parent" },
      {
        kind: "moveNode",
        nodeId: n.id,
        position: { x: n.position.x - origin.x, y: n.position.y - origin.y },
      },
    ]),
  ];
}
