import { describe, expect, it } from "vite-plus/test";
import { GRID_SIZE, snapWrittenNodes } from "#src/canvas/headless/grid.js";

const node = (id: string, x: number, y: number, extra: Record<string, unknown> = {}) => ({
  id,
  type: "note",
  position: { x, y },
  data: {},
  ...extra,
});

// An agent wrote --x=103 --y=57 and the card sat between the dots.
describe("snapWrittenNodes", () => {
  it("snaps what a write created or moved and leaves the rest where it was", () => {
    const before = [node("old", 103, 57), node("moved", 0, 0), node("frame", 1003, 57)];
    const after = [
      node("old", 103, 57),
      node("moved", 117, 251),
      node("frame", 1003, 57),
      node("fresh", 103, 57),
      node("inside", 43.5, 17, { parentId: "frame", extent: "parent" }),
      node("pen", 103, 57, { type: "stroke" }),
    ];
    const byId = Object.fromEntries(snapWrittenNodes(before, after).map((n) => [n.id, n.position]));

    expect(GRID_SIZE).toBe(20);
    expect(byId.old).toEqual({ x: 103, y: 57 });
    expect(byId.moved).toEqual({ x: 120, y: 260 });
    expect(byId.fresh).toEqual({ x: 100, y: 60 });
    // A frame at 1003,57 isn't on a dot, so a child snaps on the page, where the dots are: 1046.5 becomes 1040.
    expect((byId.inside as { x: number }).x + 1003).toBe(1040);
    expect(byId.pen).toEqual({ x: 103, y: 57 });
  });
});
