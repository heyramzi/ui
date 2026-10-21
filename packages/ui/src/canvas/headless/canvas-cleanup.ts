import type { CanvasEdge, CanvasNode } from "#src/canvas/types.js";

/**
 * Data fields that exist only at runtime and must never persist. The tree child
 * counts are recomputed on load; saved, they froze stale values.
 */
const RUNTIME_DATA_FIELDS = new Set([
  "leftChildCount",
  "rightChildCount",
  // Injected at render time by locale-aware hosts (deck slides); the persisted
  // document stays locale-neutral.
  "locale",
]);

function persistentData(source: CanvasNode["data"] | undefined): CanvasNode["data"] {
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source ?? {})) {
    if (RUNTIME_DATA_FIELDS.has(key)) continue;
    if (typeof value === "function" || value === undefined) continue;
    data[key] = value;
  }
  return data;
}

/** Strip runtime-only content from nodes for serialization. */
// Top-level fields are an allowlist, dropping SvelteFlow's runtime state. Data
// fields keep everything but functions and RUNTIME_DATA_FIELDS, so new fields survive saves.
export function stripCallbacks<N extends CanvasNode>(nodes: N[]): N[] {
  return nodes.map((n) => {
    // Rebuilt field-by-field; `N` is a subtype of the shape rebuilt here, so the
    // narrowing back to `N` is the one place the type can't follow.
    const result = {
      id: n.id,
      type: n.type,
      position: n.position,
      data: persistentData(n.data),
    } as N;
    if (n.parentId) result.parentId = n.parentId;
    if (n.extent) result.extent = n.extent;
    if (n.style) result.style = n.style;
    if (typeof n.width === "number") result.width = n.width;
    if (typeof n.height === "number") result.height = n.height;
    if (typeof n.zIndex === "number") result.zIndex = n.zIndex;
    return result;
  });
}

/**
 * Remove edges that reference nodes not present in the node list.
 */
export function removeOrphanedEdges<E extends CanvasEdge>(edges: E[], nodeIds: Set<string>): E[] {
  return edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));
}

/**
 * Parents before children, as SvelteFlow needs. Roots keep their order,
 * because array order is paint order and flipping it buries new ink.
 */
export function sortParentsFirst<T extends { id: string; parentId?: string }>(nodes: T[]): T[] {
  const idSet = new Set(nodes.map((n) => n.id));
  const roots: T[] = [];
  const childrenOf = new Map<string, T[]>();

  for (const n of nodes) {
    if (!n.parentId || !idSet.has(n.parentId)) {
      roots.push(n);
    } else {
      const siblings = childrenOf.get(n.parentId) ?? [];
      siblings.push(n);
      childrenOf.set(n.parentId, siblings);
    }
  }

  const sorted: T[] = [];
  const stack = roots.toReversed();
  for (let node = stack.pop(); node !== undefined; node = stack.pop()) {
    sorted.push(node);
    const children = childrenOf.get(node.id);
    if (children) {
      for (let i = children.length - 1; i >= 0; i--) {
        stack.push(children[i]);
      }
    }
  }

  return sorted;
}

/**
 * Fix broken parentId references by clearing parentId/extent
 * when the referenced parent no longer exists.
 */
export function fixBrokenParentIds<N extends CanvasNode>(nodes: N[]): N[] {
  const nodeIds = new Set(nodes.map((n) => n.id));
  return nodes.map((node) => {
    if (node.parentId && !nodeIds.has(node.parentId)) {
      const { parentId: _, extent: __, ...rest } = node;
      return rest as unknown as N;
    }
    return node;
  });
}
