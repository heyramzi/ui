import { expectDefined } from "#src/canvas/test-utils.js";
import { describe, expect, it } from "vite-plus/test";
import type { Node, Edge } from "@xyflow/svelte";
import {
  applyHistoryEntry,
  diffFlowState,
  mergeHistoryEntries,
  type FlowState,
} from "#src/canvas/editor/history-core.js";

function assertNever(): never {
  throw new Error("an unchanged card was serialised");
}

function node(id: string, overrides: Partial<Node> = {}): Node {
  return {
    id,
    type: "node",
    position: { x: 0, y: 0 },
    data: { label: id },
    ...overrides,
  } as Node;
}

function edge(id: string, source: string, target: string, overrides: Partial<Edge> = {}): Edge {
  return { id, source, target, ...overrides } as Edge;
}

function state(nodes: Node[], edges: Edge[] = []): FlowState {
  return { nodes, edges };
}

describe("diffFlowState", () => {
  it("returns null when nothing changed", () => {
    const a = state([node("a")], [edge("e", "a", "a")]);
    const b = state([node("a")], [edge("e", "a", "a")]);
    expect(diffFlowState(a, b)).toBeNull();
  });

  it("ignores volatile fields: selection is not an undo step", () => {
    const a = state([node("a")]);
    const b = state([node("a", { selected: true, dragging: true } as Partial<Node>)]);
    expect(diffFlowState(a, b)).toBeNull();
  });

  it("captures only affected items, not the whole document", () => {
    const untouched = node("keep");
    const a = state([untouched, node("move")]);
    const b = state([untouched, node("move", { position: { x: 100, y: 50 } })]);
    const entry = expectDefined(diffFlowState(a, b), "diff entry");
    expect(entry.nodesBefore.map((n) => n.id)).toEqual(["move"]);
    expect(entry.nodesAfter.map((n) => n.id)).toEqual(["move"]);
  });

  it("never reads a card that is the same object on both sides", () => {
    const untouched = { ...node("big"), toJSON: () => assertNever() };
    const base = state([untouched, node("a")]);
    const current = state([untouched, node("a", { position: { x: 5, y: 0 } })]);
    const entry = expectDefined(diffFlowState(base, current));
    expect(entry.nodesBefore.map((n) => n.id)).toEqual(["a"]);
  });

  it("still sees a card that was replaced by an equal-looking copy as unchanged", () => {
    const base = state([node("a")]);
    const current = state([{ ...node("a"), selected: true }]);
    expect(diffFlowState(base, current)).toBeNull();
  });

  it("captures additions and removals", () => {
    const a = state([node("a")], [edge("e1", "a", "a")]);
    const b = state([node("b")], []);
    const entry = expectDefined(diffFlowState(a, b), "diff entry");
    expect(entry.nodesBefore.map((n) => n.id)).toEqual(["a"]);
    expect(entry.nodesAfter.map((n) => n.id)).toEqual(["b"]);
    expect(entry.edgesBefore.map((e) => e.id)).toEqual(["e1"]);
    expect(entry.edgesAfter).toEqual([]);
  });
});

describe("applyHistoryEntry", () => {
  it("undo restores a data edit, redo reapplies it", () => {
    const before = state([node("a", { data: { label: "old" } })]);
    const after = state([node("a", { data: { label: "new" } })]);
    const entry = expectDefined(diffFlowState(before, after), "diff entry");

    const undone = applyHistoryEntry(after, entry, "undo");
    expect(undone.nodes[0].data.label).toBe("old");

    const redone = applyHistoryEntry(undone, entry, "redo");
    expect(redone.nodes[0].data.label).toBe("new");
  });

  it("undo of a delete restores the node and its edges", () => {
    const before = state([node("a"), node("b")], [edge("e", "a", "b")]);
    const after = state([node("a")], []);
    const entry = expectDefined(diffFlowState(before, after), "diff entry");

    const undone = applyHistoryEntry(after, entry, "undo");
    expect(undone.nodes.map((n) => n.id).sort()).toEqual(["a", "b"]);
    expect(undone.edges.map((e) => e.id)).toEqual(["e"]);
  });

  it("undo of an add removes the added node", () => {
    const before = state([node("a")]);
    const after = state([node("a"), node("b")]);
    const entry = expectDefined(diffFlowState(before, after), "diff entry");

    const undone = applyHistoryEntry(after, entry, "undo");
    expect(undone.nodes.map((n) => n.id)).toEqual(["a"]);
  });

  it("restores parents before children for SvelteFlow ordering", () => {
    const parent = node("parent");
    const child = node("child", { parentId: "parent" } as Partial<Node>);
    const before = state([parent, child]);
    const after = state([]);
    const entry = expectDefined(diffFlowState(before, after), "diff entry");

    const undone = applyHistoryEntry(after, entry, "undo");
    const ids = undone.nodes.map((n) => n.id);
    expect(ids.indexOf("parent")).toBeLessThan(ids.indexOf("child"));
  });

  // A mind map reads child order from edge order: on 12 Oct 2026 undoing a reparent
  // appended the restored edge, and the next relayout swapped Alpha's children.
  it("undo of a reparent puts the restored edge back at its index, redo too", () => {
    const nodes = [node("alpha"), node("gamma"), node("a1"), node("a2"), node("g1")];
    const before = state(nodes, [
      edge("e-alpha-a1", "alpha", "a1"),
      edge("e-alpha-a2", "alpha", "a2"),
      edge("e-gamma-g1", "gamma", "g1"),
    ]);
    const after = state(nodes, [
      edge("e-alpha-a2", "alpha", "a2"),
      edge("e-gamma-a1", "gamma", "a1"),
      edge("e-gamma-g1", "gamma", "g1"),
    ]);
    const entry = expectDefined(diffFlowState(before, after), "diff entry");

    const undone = applyHistoryEntry(after, entry, "undo");
    expect(undone.edges.map((e) => e.id)).toEqual(["e-alpha-a1", "e-alpha-a2", "e-gamma-g1"]);
    const redone = applyHistoryEntry(undone, entry, "redo");
    expect(redone.edges.map((e) => e.id)).toEqual(["e-alpha-a2", "e-gamma-a1", "e-gamma-g1"]);
  });

  // A reorder under the same parent keeps the edge's id and content, so only its index moved.
  it("undo of a sibling reorder restores the edge order", () => {
    const before = state(
      [node("a1"), node("a2", { position: { x: 0, y: 60 } })],
      [edge("e-alpha-a1", "alpha", "a1"), edge("e-alpha-a2", "alpha", "a2")],
    );
    const after = state(
      [node("a1", { position: { x: 0, y: 60 } }), node("a2")],
      [edge("e-alpha-a2", "alpha", "a2"), edge("e-alpha-a1", "alpha", "a1")],
    );
    const entry = expectDefined(diffFlowState(before, after), "diff entry");

    const undone = applyHistoryEntry(after, entry, "undo");
    expect(undone.edges.map((e) => e.id)).toEqual(["e-alpha-a1", "e-alpha-a2"]);
    const redone = applyHistoryEntry(undone, entry, "redo");
    expect(redone.edges.map((e) => e.id)).toEqual(["e-alpha-a2", "e-alpha-a1"]);
  });

  it("undo of a delete puts nodes back at their index, without regrouping a valid order", () => {
    const parent = node("parent");
    const before = state([parent, node("free"), node("child", { parentId: "parent" })]);
    const after = state([parent]);
    const entry = expectDefined(diffFlowState(before, after), "diff entry");

    const undone = applyHistoryEntry(after, entry, "undo");
    expect(undone.nodes.map((n) => n.id)).toEqual(["parent", "free", "child"]);
  });

  it("round-trips a compound change (move + edit + add + remove)", () => {
    const before = state(
      [node("stay"), node("move"), node("gone", { data: { label: "bye" } })],
      [edge("e1", "stay", "move")],
    );
    const after = state(
      [
        node("stay"),
        node("move", { position: { x: 40, y: 40 }, data: { label: "moved" } }),
        node("fresh"),
      ],
      [edge("e1", "stay", "move", { label: "renamed" } as Partial<Edge>)],
    );
    const entry = expectDefined(diffFlowState(before, after), "diff entry");

    const undone = applyHistoryEntry(after, entry, "undo");
    expect(diffFlowState(before, undone)).toBeNull();

    const redone = applyHistoryEntry(undone, entry, "redo");
    expect(diffFlowState(after, redone)).toBeNull();
  });
});

describe("mergeHistoryEntries", () => {
  it("keeps the earliest before and the latest after for a node both touched", () => {
    const s0 = state([node("a", { data: { label: "0" } })]);
    const s1 = state([node("a", { data: { label: "1" } })]);
    const s2 = state([node("a", { data: { label: "2" } })]);
    const merged = mergeHistoryEntries(
      expectDefined(diffFlowState(s0, s1), "first"),
      expectDefined(diffFlowState(s1, s2), "second"),
    );

    expect(applyHistoryEntry(s2, merged, "undo").nodes[0].data.label).toBe("0");
    expect(applyHistoryEntry(s0, merged, "redo").nodes[0].data.label).toBe("2");
  });

  it("merges different nodes, and a node added then edited has no before", () => {
    const s0 = state([node("a")]);
    const s1 = state([node("a"), node("b", { data: { label: "new" } })]);
    const s2 = state([
      node("a", { position: { x: 9, y: 9 } }),
      node("b", { data: { label: "newer" } }),
    ]);
    const merged = mergeHistoryEntries(
      expectDefined(diffFlowState(s0, s1), "first"),
      expectDefined(diffFlowState(s1, s2), "second"),
    );

    expect(merged.nodesBefore.map((n) => n.id)).toEqual(["a"]);
    expect(merged.nodesAfter.map((n) => n.id).sort()).toEqual(["a", "b"]);
    expect(applyHistoryEntry(s2, merged, "undo").nodes.map((n) => n.id)).toEqual(["a"]);
  });

  it("carries node order from the earliest before to the latest after", () => {
    const s0 = state([node("a"), node("b"), node("c")]);
    const s1 = state([node("b"), node("a", { position: { x: 5, y: 5 } }), node("c")]);
    const s2 = state([node("b"), node("c"), node("a", { position: { x: 1, y: 1 } })]);
    const merged = mergeHistoryEntries(
      expectDefined(diffFlowState(s0, s1), "first"),
      expectDefined(diffFlowState(s1, s2), "second"),
    );

    expect(merged.nodeOrder).toEqual({ before: ["a", "b", "c"], after: ["b", "c", "a"] });
  });
});
