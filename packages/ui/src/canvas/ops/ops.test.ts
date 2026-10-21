import { describe, expect, it } from "vite-plus/test";
import { z } from "zod";
import type { OpDefinition } from "#src/canvas/plugin.js";
import { CanvasOpError, applyOps, canvasOpSchema } from "#src/canvas/ops/ops.js";

const board = () => ({
  nodes: [
    { id: "a", type: "box", position: { x: 0, y: 0 }, data: { label: "A" } },
    { id: "b", type: "box", position: { x: 10, y: 10 }, data: { label: "B" } },
  ],
  edges: [],
});

describe("applyOps", () => {
  it("adds a parented node with its extent and rejects a duplicate id", () => {
    const next = applyOps(board(), [
      { kind: "addNode", node: { id: "c", type: "box", data: {}, parentId: "a" } },
    ]);
    expect(next.nodes.at(-1)).toMatchObject({ id: "c", parentId: "a", extent: "parent" });
    expect(() =>
      applyOps(board(), [{ kind: "addNode", node: { id: "a", type: "box", data: {} } }]),
    ).toThrow(CanvasOpError);
  });

  it("merges a data patch and keeps the other fields", () => {
    const next = applyOps(board(), [{ kind: "patchNode", nodeId: "a", data: { note: "x" } }]);
    expect(next.nodes[0].data).toEqual({ label: "A", note: "x" });
  });

  it("removes a node with its edges", () => {
    const withEdge = {
      ...board(),
      edges: [{ id: "e", source: "a", target: "b" }],
    };
    const next = applyOps(withEdge, [{ kind: "removeNode", nodeId: "a" }]);
    expect(next.nodes.map((n) => n.id)).toEqual(["b"]);
    expect(next.edges).toEqual([]);
  });

  it("re-points an edge with patchEdge and rejects a missing endpoint", () => {
    const withEdge = { ...board(), edges: [{ id: "e", source: "a", target: "b" }] };
    const next = applyOps(withEdge, [{ kind: "patchEdge", edgeId: "e", patch: { target: "a" } }]);
    expect(next.edges[0]).toMatchObject({ id: "e", source: "a", target: "a" });
    expect(() =>
      applyOps(withEdge, [{ kind: "patchEdge", edgeId: "e", patch: { target: "gone" } }]),
    ).toThrow(CanvasOpError);
    expect(() =>
      applyOps(withEdge, [{ kind: "patchEdge", edgeId: "e", patch: { source: "gone" } }]),
    ).toThrow(CanvasOpError);
  });

  it("detaches a node with setParent null", () => {
    const next = applyOps(board(), [
      { kind: "setParent", nodeId: "b", parentId: "a" },
      { kind: "setParent", nodeId: "b", parentId: null },
    ]);
    expect(next.nodes[1]).not.toHaveProperty("parentId");
  });

  it("names the op index on an error", () => {
    try {
      applyOps(board(), [
        { kind: "moveNode", nodeId: "a", position: { x: 1, y: 1 } },
        { kind: "removeNode", nodeId: "zzz" },
      ]);
      expect.unreachable();
    } catch (e) {
      expect((e as CanvasOpError).opIndex).toBe(1);
    }
  });

  it("throws on a kind nobody registered", () => {
    expect(() => applyOps(board(), [{ kind: "nope" }])).toThrow(/Unknown op kind/);
  });

  it("runs a plugin op beside the core ones", () => {
    const rename = z.object({ kind: z.literal("rename"), nodeId: z.string(), label: z.string() });
    const def: OpDefinition<z.infer<typeof rename>> = {
      kind: "rename",
      schema: rename,
      apply: (state, op) => {
        state.nodes = state.nodes.map((n) =>
          n.id === op.nodeId ? { ...n, data: { ...(n.data as object), label: op.label } } : n,
        );
      },
    };
    const next = applyOps(board(), [{ kind: "rename", nodeId: "b", label: "Beta" }], [def]);
    expect(next.nodes[1].data).toEqual({ label: "Beta" });
  });
});

describe("canvasOpSchema", () => {
  it("rejects an empty edge patch", () => {
    expect(canvasOpSchema.safeParse({ kind: "patchEdge", edgeId: "e", patch: {} }).success).toBe(
      false,
    );
  });
});
