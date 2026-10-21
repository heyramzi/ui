import { describe, expect, it } from "vite-plus/test";
import { alignNodesHorizontally, alignNodesVertically } from "#src/canvas/headless/alignment.js";
import { makeNode } from "#src/canvas/test-utils.js";

describe("alignNodesHorizontally", () => {
  it("sets all nodes to the topmost Y", () => {
    const nodes = [
      makeNode({ id: "a", position: { x: 0, y: 100 } }),
      makeNode({ id: "b", position: { x: 50, y: 50 } }),
      makeNode({ id: "c", position: { x: 100, y: 200 } }),
    ];
    alignNodesHorizontally(nodes);
    expect(nodes.map((n) => n.position.y)).toEqual([50, 50, 50]);
  });

  it("preserves X positions", () => {
    const nodes = [
      makeNode({ id: "a", position: { x: 10, y: 100 } }),
      makeNode({ id: "b", position: { x: 200, y: 50 } }),
    ];
    alignNodesHorizontally(nodes);
    expect(nodes[0].position.x).toBe(10);
    expect(nodes[1].position.x).toBe(200);
  });

  it("does nothing for fewer than 2 nodes", () => {
    const single = [makeNode({ id: "a", position: { x: 5, y: 99 } })];
    alignNodesHorizontally(single);
    expect(single[0].position.y).toBe(99);
  });
});

describe("alignNodesVertically", () => {
  it("sets all nodes to the leftmost X", () => {
    const nodes = [
      makeNode({ id: "a", position: { x: 100, y: 0 } }),
      makeNode({ id: "b", position: { x: 50, y: 50 } }),
      makeNode({ id: "c", position: { x: 200, y: 100 } }),
    ];
    alignNodesVertically(nodes);
    expect(nodes.map((n) => n.position.x)).toEqual([50, 50, 50]);
  });

  it("preserves Y positions", () => {
    const nodes = [
      makeNode({ id: "a", position: { x: 100, y: 10 } }),
      makeNode({ id: "b", position: { x: 50, y: 200 } }),
    ];
    alignNodesVertically(nodes);
    expect(nodes[0].position.y).toBe(10);
    expect(nodes[1].position.y).toBe(200);
  });

  it("does nothing for fewer than 2 nodes", () => {
    const single = [makeNode({ id: "a", position: { x: 99, y: 5 } })];
    alignNodesVertically(single);
    expect(single[0].position.x).toBe(99);
  });
});
