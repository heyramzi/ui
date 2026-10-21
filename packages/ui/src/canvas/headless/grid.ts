// The magnets: the grid the editor snaps cards to. A write that isn't a drag snaps through here.

import { STROKE_NODE } from "#src/canvas/pen/types.js";

/** Flow units between two dots at the finest level. */
export const GRID_SIZE = 20;

/** The value xyflow's `snapGrid` prop takes. */
export const SNAP_GRID: [number, number] = [GRID_SIZE, GRID_SIZE];

/** Node types that keep their exact points. A stroke's origin is its bounding box, so moving it shifts the drawing. */
export const FREEHAND_NODE_TYPES: ReadonlySet<string> = new Set([STROKE_NODE]);

/** The nearest dot on one axis, rounded the way xyflow rounds a drag. */
export function snapToGrid(value: number): number {
  return GRID_SIZE * Math.round(value / GRID_SIZE);
}

type RawNode = Record<string, unknown>;
type Point = { x: number; y: number };

function pointOf(value: unknown): Point | null {
  if (typeof value !== "object" || value === null) return null;
  const { x, y } = value as Record<string, unknown>;
  return typeof x === "number" && typeof y === "number" && Number.isFinite(x) && Number.isFinite(y)
    ? { x, y }
    : null;
}

function stringOf(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/** Snaps the nodes a write created or moved and leaves the rest. A child snaps on the page, then goes back to relative. */
export function snapWrittenNodes<N extends RawNode>(
  before: readonly RawNode[],
  after: readonly N[],
  exempt: ReadonlySet<string> = FREEHAND_NODE_TYPES,
): N[] {
  const prior = new Map<string, { at: Point | null; parent?: string }>();
  for (const node of before) {
    const id = stringOf(node.id);
    if (id) prior.set(id, { at: pointOf(node.position), parent: stringOf(node.parentId) });
  }
  const byId = new Map<string, N>();
  for (const node of after) {
    const id = stringOf(node.id);
    if (id) byId.set(id, node);
  }

  const written = (node: N): boolean => {
    const was = prior.get(String(node.id));
    const at = pointOf(node.position);
    const type = stringOf(node.type);
    if (!at || (type !== undefined && exempt.has(type))) return false;
    if (!was?.at) return true;
    return was.at.x !== at.x || was.at.y !== at.y || was.parent !== stringOf(node.parentId);
  };

  // Parents settle first, because a child's page position rides on its parent's.
  const settled = new Map<string, { local: Point; page: Point }>();
  const visiting = new Set<string>();

  const settle = (node: N): { local: Point; page: Point } => {
    const id = String(node.id);
    const done = settled.get(id);
    if (done) return done;
    const local = pointOf(node.position) ?? { x: 0, y: 0 };
    const parentId = stringOf(node.parentId);
    const parent = parentId ? byId.get(parentId) : undefined;
    let origin: Point = { x: 0, y: 0 };
    if (parent && !visiting.has(id)) {
      visiting.add(id);
      origin = settle(parent).page;
      visiting.delete(id);
    }
    const page = { x: origin.x + local.x, y: origin.y + local.y };
    const result = written(node)
      ? {
          local: { x: snapToGrid(page.x) - origin.x, y: snapToGrid(page.y) - origin.y },
          page: { x: snapToGrid(page.x), y: snapToGrid(page.y) },
        }
      : { local, page };
    settled.set(id, result);
    return result;
  };

  return after.map((node) => {
    if (!stringOf(node.id)) return node;
    const at = pointOf(node.position);
    const next = settle(node).local;
    return at && (next.x !== at.x || next.y !== at.y) ? { ...node, position: next } : node;
  });
}
