import { describe, expect, it } from "vite-plus/test";
import type { Node } from "@xyflow/svelte";
import { reorderStack, topLayer } from "#src/canvas/editor/z-order.js";

function card(id: string, extra: Partial<Node> = {}): Node {
  return { id, type: "note", position: { x: 0, y: 0 }, data: {}, ...extra };
}

/** Ids bottom to top, as the canvas paints them. */
function stack(nodes: Node[], parentId?: string): string[] {
  return nodes
    .map((node, index) => ({ node, index }))
    .filter(({ node }) => (node.parentId ?? "") === (parentId ?? ""))
    .sort((a, b) => (a.node.zIndex ?? 0) - (b.node.zIndex ?? 0) || a.index - b.index)
    .map(({ node }) => node.id);
}

describe("reorderStack", () => {
  const board = [card("a"), card("b"), card("c"), card("d")];

  it("brings one card to the front and sends one to the back", () => {
    expect(stack(reorderStack(board, new Set(["a"]), "front") ?? board)).toEqual([
      "b",
      "c",
      "d",
      "a",
    ]);
    expect(stack(reorderStack(board, new Set(["d"]), "back") ?? board)).toEqual([
      "d",
      "a",
      "b",
      "c",
    ]);
  });

  it("moves one step and keeps picked cards in their order", () => {
    const up = reorderStack(board, new Set(["a", "c"]), "forward") ?? board;
    expect(stack(up)).toEqual(["b", "a", "d", "c"]);
    const down = reorderStack(board, new Set(["b", "d"]), "backward") ?? board;
    expect(stack(down)).toEqual(["b", "a", "d", "c"]);
  });

  it("returns null when nothing would change", () => {
    expect(reorderStack(board, new Set(["d"]), "front")).toBeNull();
    expect(reorderStack(board, new Set(["a"]), "back")).toBeNull();
    expect(reorderStack(board, new Set(["d"]), "forward")).toBeNull();
  });

  it("writes only the layers that changed", () => {
    const next = reorderStack(board, new Set(["a"]), "front") ?? board;
    expect(next.find((n) => n.id === "b")?.zIndex).toBeUndefined();
    expect(next.find((n) => n.id === "a")?.zIndex).toBe(3);
  });

  it("stacks children inside their own group and leaves ink out", () => {
    const nodes = [
      card("g", { type: "wrapper" }),
      card("x", { parentId: "g" }),
      card("y", { parentId: "g" }),
      card("ink", { type: "stroke" }),
    ];
    const next = reorderStack(nodes, new Set(["x"]), "front") ?? nodes;
    expect(stack(next, "g")).toEqual(["y", "x"]);
    expect(next.find((n) => n.id === "g")?.zIndex).toBeUndefined();
    expect(reorderStack(nodes, new Set(["ink"]), "front")).toBeNull();
  });
});

describe("topLayer", () => {
  it("is undefined until a card has been raised, then one above the top", () => {
    expect(topLayer([card("a"), card("b")])).toBeUndefined();
    expect(topLayer([card("a", { zIndex: 4 }), card("b")])).toBe(5);
    expect(topLayer([card("g"), card("x", { parentId: "g", zIndex: 9 })])).toBeUndefined();
  });
});
