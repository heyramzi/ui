import type { CanvasNode } from "#src/canvas/types.js";

/** A node for tests. Overrides win. */
export function makeNode(overrides: Partial<CanvasNode> = {}): CanvasNode {
  return {
    id: overrides.id ?? `node-${Math.random().toString(36).slice(2, 8)}`,
    type: "node",
    position: { x: 0, y: 0 },
    data: { label: "Test Node" },
    ...overrides,
  };
}

/** Narrows a lookup in a test so a miss fails with a name, not a TypeError. */
export function expectDefined<T>(value: T | null | undefined, what = "value"): T {
  if (value === null || value === undefined) throw new Error(`Expected ${what} to be defined`);
  return value;
}
