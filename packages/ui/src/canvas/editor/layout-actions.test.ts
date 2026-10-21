import { expectDefined } from "#src/canvas/test-utils.js";
import { describe, it, expect } from "vite-plus/test";
import { alignNodes, groupSelectionOps, tidyGroup } from "#src/canvas/editor/layout-actions.js";

function pos(id: string, x: number, y: number) {
  return { id, position: { x, y } };
}

describe("alignNodes", () => {
  it("returns empty map for fewer than 2 nodes", () => {
    const result = alignNodes([pos("a", 10, 20)], "left");
    expect(result.size).toBe(0);
  });

  it("aligns left to minimum x", () => {
    const result = alignNodes([pos("a", 100, 0), pos("b", 200, 0), pos("c", 50, 0)], "left");
    expect(expectDefined(result.get("a"), "entry a").x).toBe(50);
    expect(expectDefined(result.get("b"), "entry b").x).toBe(50);
    expect(expectDefined(result.get("c"), "entry c").x).toBe(50);
  });

  it("aligns right to maximum x", () => {
    const result = alignNodes([pos("a", 100, 0), pos("b", 200, 0)], "right");
    expect(expectDefined(result.get("a"), "entry a").x).toBe(200);
    expect(expectDefined(result.get("b"), "entry b").x).toBe(200);
  });

  it("aligns top to minimum y", () => {
    const result = alignNodes([pos("a", 0, 100), pos("b", 0, 50)], "top");
    expect(expectDefined(result.get("a"), "entry a").y).toBe(50);
    expect(expectDefined(result.get("b"), "entry b").y).toBe(50);
  });

  it("aligns bottom to maximum y", () => {
    const result = alignNodes([pos("a", 0, 100), pos("b", 0, 200)], "bottom");
    expect(expectDefined(result.get("a"), "entry a").y).toBe(200);
    expect(expectDefined(result.get("b"), "entry b").y).toBe(200);
  });

  it("center-h aligns to minimum x (vertical center)", () => {
    const result = alignNodes([pos("a", 100, 0), pos("b", 200, 0)], "center-h");
    // alignNodesVertically sets all to min x
    expect(expectDefined(result.get("a"), "entry a").x).toBe(100);
    expect(expectDefined(result.get("b"), "entry b").x).toBe(100);
  });

  it("center-v aligns to average y", () => {
    const result = alignNodes([pos("a", 0, 100), pos("b", 0, 200), pos("c", 0, 300)], "center-v");
    expect(expectDefined(result.get("a"), "entry a").y).toBe(200);
    expect(expectDefined(result.get("b"), "entry b").y).toBe(200);
    expect(expectDefined(result.get("c"), "entry c").y).toBe(200);
  });

  it("does not mutate input positions", () => {
    const nodes = [pos("a", 100, 0), pos("b", 200, 0)];
    alignNodes(nodes, "left");
    expect(nodes[0].position.x).toBe(100);
    expect(nodes[1].position.x).toBe(200);
  });
});

describe("groupSelectionOps", () => {
  const box = (id: string, x: number, y: number, parentId?: string) => ({
    id,
    position: { x, y },
    measured: { width: 100, height: 50 },
    ...(parentId ? { parentId } : {}),
  });

  it("refuses to group fewer than two nodes", () => {
    expect(groupSelectionOps([box("a", 0, 0)], "Group")).toEqual([]);
  });

  it("draws the box around the selection and re-parents every member", () => {
    const ops = groupSelectionOps([box("a", 100, 100), box("b", 300, 200)], "Group");
    const [add, ...rest] = ops;

    expect(add).toMatchObject({
      kind: "addNode",
      node: {
        type: "group",
        // 32 of padding on every side, plus 36 of title row above.
        position: { x: 68, y: 32 },
        width: 364,
        height: 250,
      },
    });

    const groupId = (add as { node: { id: string } }).node.id;
    expect(rest).toEqual([
      { kind: "setParent", nodeId: "a", parentId: groupId, extent: "parent" },
      { kind: "moveNode", nodeId: "a", position: { x: 32, y: 68 } },
      { kind: "setParent", nodeId: "b", parentId: groupId, extent: "parent" },
      { kind: "moveNode", nodeId: "b", position: { x: 232, y: 168 } },
    ]);
  });

  it("takes only the members sharing the first one's parent, and joins it", () => {
    const ops = groupSelectionOps(
      [box("a", 0, 0, "p1"), box("b", 100, 0, "p1"), box("loose", 900, 900)],
      "Group",
    );
    expect(ops).toHaveLength(5);
    expect(ops[0]).toMatchObject({ kind: "addNode", node: { parentId: "p1" } });
    expect(ops.some((op) => "nodeId" in op && op.nodeId === "loose")).toBe(false);
  });
});

describe("tidyGroup", () => {
  const box = (id: string, x: number, y: number, width: number, height: number) => ({
    id,
    position: { x, y },
    measured: { width, height },
  });

  it("has nothing to tidy in an empty group", () => {
    expect(tidyGroup([])).toBeNull();
  });

  it("keeps side-by-side cards in one row, stacks the rest, and fits the box", () => {
    const result = expectDefined(
      tidyGroup([
        box("card2", 800, 110, 640, 220),
        box("title", 0, 10, 200, 30),
        box("card1", 5, 120, 750, 500),
        box("subtitle", 5, 70, 600, 20),
      ]),
      "tidy result",
    );

    // 32 of padding, 36 of title row, 24 between rows and between cards.
    expect(Object.fromEntries(result.positions)).toEqual({
      title: { x: 32, y: 68 },
      subtitle: { x: 32, y: 122 },
      card1: { x: 32, y: 166 },
      card2: { x: 806, y: 166 },
    });
    expect(result.size).toEqual({ width: 1478, height: 698 });
  });

  it("pulls overlapping nodes apart along their row", () => {
    const result = expectDefined(
      tidyGroup([box("b", 10, 5, 100, 50), box("a", 0, 0, 100, 50)]),
      "tidy result",
    );
    expect(result.positions.get("a")).toEqual({ x: 32, y: 68 });
    expect(result.positions.get("b")).toEqual({ x: 156, y: 68 });
  });

  it("never shrinks the box below the container minimum", () => {
    expect(expectDefined(tidyGroup([box("a", 400, 400, 10, 10)]), "tidy result").size).toEqual({
      width: 250,
      height: 150,
    });
  });
});
