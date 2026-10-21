import { expectDefined } from "#src/canvas/test-utils.js";
import { describe, expect, it } from "vite-plus/test";
import { applyOps } from "#src/canvas/ops/ops.js";
import { diffToOps, rebaseDiagram, type DiagramDoc } from "#src/canvas/editor/rebase.js";

function doc(nodes: DiagramDoc["nodes"], edges: DiagramDoc["edges"] = []): DiagramDoc {
  return { nodes, edges };
}

function n(id: string, overrides: Record<string, unknown> = {}): DiagramDoc["nodes"][number] {
  return { id, type: "node", position: { x: 0, y: 0 }, data: { label: id }, ...overrides };
}

describe("diffToOps", () => {
  it("returns no ops for identical docs", () => {
    expect(diffToOps(doc([n("a")]), doc([n("a")]))).toEqual([]);
  });

  it("replaying the diff on the base reproduces the current doc", () => {
    const base = doc(
      [n("stay"), n("move"), n("gone"), n("container", { type: "space" })],
      [{ id: "e1", source: "stay", target: "move" }],
    );
    const current = doc(
      [
        n("stay"),
        n("move", { position: { x: 120, y: 80 }, data: { label: "renamed" } }),
        n("container", { type: "space", style: { width: 400, height: 300 } }),
        n("child", { parentId: "container", position: { x: 20, y: 60 } }),
      ],
      [
        { id: "e1", source: "stay", target: "move", label: "flows" },
        { id: "e2", source: "stay", target: "child" },
      ],
    );

    const ops = diffToOps(base, current);
    const replayed = applyOps({ nodes: base.nodes, edges: base.edges }, ops);

    const byId = new Map(replayed.nodes.map((node) => [node.id, node]));
    expect(byId.has("gone")).toBe(false);
    expect(byId.get("move")?.position).toEqual({ x: 120, y: 80 });
    expect(
      (expectDefined(byId.get("move"), "entry move").data as Record<string, unknown>).label,
    ).toBe("renamed");
    expect(byId.get("container")?.style).toEqual({ width: 400, height: 300 });
    expect(byId.get("child")?.parentId).toBe("container");
    // parentId implies extent at the op seam
    expect(byId.get("child")?.extent).toBe("parent");
    const edgeById = new Map(replayed.edges.map((edge) => [edge.id, edge]));
    expect(edgeById.get("e1")?.label).toBe("flows");
    expect(edgeById.has("e2")).toBe(true);
  });

  it("orders added parents before added children", () => {
    const base = doc([]);
    const current = doc([
      n("child", { parentId: "parent", position: { x: 10, y: 10 } }),
      n("parent", { type: "space" }),
    ]);
    // Would throw "Unknown parentId" if the child op ran first.
    const replayed = applyOps({ nodes: [], edges: [] }, diffToOps(base, current));
    expect(replayed.nodes).toHaveLength(2);
  });
});

describe("rebaseDiagram", () => {
  const lastSaved = doc([n("a"), n("b")]);

  it("replays local changes on top of the server doc", () => {
    // Server: an agent added "agent-node". Local: the user renamed "a".
    const serverDoc = doc([n("a"), n("b"), n("agent-node")]);
    const local = doc([n("a", { data: { label: "renamed" } }), n("b")]);

    const rebased = expectDefined(rebaseDiagram(serverDoc, lastSaved, local), "rebased doc");
    const byId = new Map(rebased.nodes.map((node) => [node.id, node]));
    expect(byId.has("agent-node")).toBe(true);
    expect((expectDefined(byId.get("a"), "entry a").data as Record<string, unknown>).label).toBe(
      "renamed",
    );
  });

  it("returns the server doc unchanged when there are no local changes", () => {
    const serverDoc = doc([n("a"), n("b"), n("agent-node")]);
    const rebased = expectDefined(rebaseDiagram(serverDoc, lastSaved, lastSaved), "rebased doc");
    expect(rebased.nodes.map((node) => node.id)).toEqual(["a", "b", "agent-node"]);
  });

  it("keeps a locally re-pointed edge endpoint and handles", () => {
    const base = doc([n("a"), n("b"), n("c")], [{ id: "e1", source: "a", target: "b" }]);
    const server = doc(
      [n("a"), n("b"), n("c"), n("agent")],
      [{ id: "e1", source: "a", target: "b" }],
    );
    const local = doc(
      [n("a"), n("b"), n("c")],
      [{ id: "e1", source: "a", target: "c", targetHandle: "left" }],
    );

    const rebased = expectDefined(rebaseDiagram(server, base, local), "rebased doc");
    expect(rebased.edges).toEqual([{ id: "e1", source: "a", target: "c", targetHandle: "left" }]);
  });

  it("returns null when a re-pointed edge's new endpoint was deleted on the server", () => {
    const base = doc([n("a"), n("b"), n("c")], [{ id: "e1", source: "a", target: "b" }]);
    const server = doc([n("a"), n("b")], [{ id: "e1", source: "a", target: "b" }]);
    const local = doc([n("a"), n("b"), n("c")], [{ id: "e1", source: "a", target: "c" }]);

    expect(rebaseDiagram(server, base, local)).toBeNull();
  });

  it("patches zIndex and type changes, and a removed zIndex", () => {
    const base = doc([n("a", { zIndex: 1 }), n("b"), n("c", { zIndex: 4 })]);
    const server = doc([n("a", { zIndex: 1 }), n("b"), n("c", { zIndex: 4 }), n("agent")]);
    const local = doc([n("a", { zIndex: 9 }), n("b", { type: "sticky" }), n("c")]);

    const rebased = expectDefined(rebaseDiagram(server, base, local), "rebased doc");
    const byId = new Map(rebased.nodes.map((node) => [node.id, node]));
    expect(byId.get("a")?.zIndex).toBe(9);
    expect(byId.get("b")?.type).toBe("sticky");
    expect(byId.get("c")).not.toHaveProperty("zIndex");
    expect(byId.has("agent")).toBe(true);
  });

  it("keeps both sides' edits to different data keys of the same node", () => {
    const base = doc([n("a", { data: { label: "a", note: "old" } })]);
    const server = doc([n("a", { data: { label: "a", note: "server note" } })]);
    const local = doc([n("a", { data: { label: "local label", note: "old" } })]);

    const rebased = expectDefined(rebaseDiagram(server, base, local), "rebased doc");
    expect(rebased.nodes[0].data).toEqual({ label: "local label", note: "server note" });
  });

  it("lets local win when both sides edit the same data key", () => {
    const base = doc([n("a", { data: { label: "a" } })]);
    const server = doc([n("a", { data: { label: "server" } })]);
    const local = doc([n("a", { data: { label: "local" } })]);

    const rebased = expectDefined(rebaseDiagram(server, base, local), "rebased doc");
    expect(rebased.nodes[0].data).toEqual({ label: "local" });
  });

  it("replaces a changed top-level data key whole, without merging inside it", () => {
    const base = doc([n("a", { data: { shape: { kind: "box", fill: "red" } } })]);
    const server = doc([n("a", { data: { shape: { kind: "box", fill: "red", ring: 2 } } })]);
    const local = doc([n("a", { data: { shape: { kind: "box", fill: "blue" } } })]);

    const rebased = expectDefined(rebaseDiagram(server, base, local), "rebased doc");
    expect(rebased.nodes[0].data).toEqual({ shape: { kind: "box", fill: "blue" } });
  });

  it("removes a data key the local side deleted, and keeps the server's other keys", () => {
    const base = doc([n("a", { data: { label: "a", icon: "x", note: "old" } })]);
    const server = doc([n("a", { data: { label: "a", icon: "x", note: "server note" } })]);
    const local = doc([n("a", { data: { label: "a", note: "old" } })]);

    const rebased = expectDefined(rebaseDiagram(server, base, local), "rebased doc");
    expect(rebased.nodes[0].data).toEqual({ label: "a", note: "server note" });
    expect(rebased.nodes[0].data).not.toHaveProperty("icon");
  });

  it("returns null when a field-only change hits a node the server deleted", () => {
    const base = doc([n("a"), n("b")]);
    const server = doc([n("a")]);
    const local = doc([n("a"), n("b", { zIndex: 3 })]);

    expect(rebaseDiagram(server, base, local)).toBeNull();
  });

  it("keeps parents before children when a local reparent targets a later server node", () => {
    const base = doc([n("child"), n("box", { type: "space" })]);
    const server = doc([n("child"), n("box", { type: "space" })]);
    const local = doc([
      n("box", { type: "space" }),
      n("child", { parentId: "box", position: { x: 10, y: 10 } }),
    ]);

    const rebased = expectDefined(rebaseDiagram(server, base, local), "rebased doc");
    const ids = rebased.nodes.map((node) => node.id);
    expect(ids.indexOf("box")).toBeLessThan(ids.indexOf("child"));
  });

  it("returns null when the replay is impossible", () => {
    // Server deleted "b"; local patched it. patchNode on a missing node throws.
    const serverDoc = doc([n("a")]);
    const local = doc([n("a"), n("b", { data: { label: "edited" } })]);
    expect(rebaseDiagram(serverDoc, lastSaved, local)).toBeNull();
  });
});

describe("a new edge keeps everything it was drawn with", () => {
  it("carries label, animated, style and data through a rebase", () => {
    const base = doc([n("a"), n("b")]);
    const styled = {
      id: "e9",
      source: "a",
      target: "b",
      type: "smoothstep",
      label: "pays",
      animated: true,
      style: { stroke: "#f00", strokeWidth: 3 },
      data: { dash: "dotted", arrow: "both" },
    };
    const local = doc([n("a"), n("b")], [styled]);
    const rebased = rebaseDiagram(doc([n("a"), n("b"), n("c")]), base, local);
    expect(rebased?.edges).toEqual([styled]);
  });
});
