// A frame from the frame tool: a titled box that adopts the cards it covers.
// A group (Cmd+G) is the same box untitled.

import type { CanvasOp } from "#src/canvas/ops/ops.js";

export interface FrameRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

type Boxed = {
  id: string;
  position: { x: number; y: number };
  measured?: { width?: number; height?: number };
  width?: number | null;
  height?: number | null;
  parentId?: string;
  type?: string;
};

/** A drag shorter than this on both sides was a click. */
const CLICK_DRAG = 8;
const DEFAULT_FRAME = { width: 480, height: 300 } as const;
const MIN_FRAME = { width: 80, height: 60 } as const;

/** The box a drag from one corner to the other covers, or the default size for a click. */
export function frameRect(from: { x: number; y: number }, to: { x: number; y: number }): FrameRect {
  const width = Math.abs(to.x - from.x);
  const height = Math.abs(to.y - from.y);
  if (width < CLICK_DRAG && height < CLICK_DRAG) {
    return { x: Math.round(from.x), y: Math.round(from.y), ...DEFAULT_FRAME };
  }
  return {
    x: Math.round(Math.min(from.x, to.x)),
    y: Math.round(Math.min(from.y, to.y)),
    width: Math.round(Math.max(width, MIN_FRAME.width)),
    height: Math.round(Math.max(height, MIN_FRAME.height)),
  };
}

function sizeOf(node: Boxed): { width: number; height: number } | null {
  const width = node.measured?.width ?? node.width;
  const height = node.measured?.height ?? node.height;
  return width && height ? { width, height } : null;
}

export interface FrameOptions {
  /** The node type of the frame, the host's group type. */
  type: string;
  title: string;
  /** Extra `data` on the frame beside its title. */
  data?: Record<string, unknown>;
}

/** The op list for one frame, and the id it was given. Top-level cards wholly inside the box become its children. */
export function frameOps(
  rect: FrameRect,
  nodes: readonly Boxed[],
  { type, title, data = {} }: FrameOptions,
): { id: string; ops: CanvasOp[] } {
  const id = crypto.randomUUID();
  const inside = nodes.filter((node) => {
    const size = sizeOf(node);
    if (!size || node.parentId || node.type === type) return false;
    const { x, y } = node.position;
    return (
      x >= rect.x &&
      y >= rect.y &&
      x + size.width <= rect.x + rect.width &&
      y + size.height <= rect.y + rect.height
    );
  });
  const ops: CanvasOp[] = [
    {
      kind: "addNode",
      node: {
        id,
        type,
        position: { x: rect.x, y: rect.y },
        data: { ...data, label: title, frame: true },
        width: rect.width,
        height: rect.height,
        style: { width: rect.width, height: rect.height },
      },
    },
    ...inside.flatMap((node): CanvasOp[] => [
      { kind: "setParent", nodeId: node.id, parentId: id, extent: "parent" },
      {
        kind: "moveNode",
        nodeId: node.id,
        position: { x: node.position.x - rect.x, y: node.position.y - rect.y },
      },
    ]),
  ];
  return { id, ops };
}
