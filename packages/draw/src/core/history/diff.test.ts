import { describe, expect, it } from "vitest";
import type { BindingRecord, Diff, ShapeRecord, Tables } from "../types";
import {
  applyDiff,
  diffRecords,
  diffTable,
  invertDiff,
  isEmptyDiff,
  mergeDiffs,
} from "./diff";

function shape(id: string, overrides: Partial<ShapeRecord> = {}): ShapeRecord {
  return {
    id,
    type: "rect",
    x: 0,
    y: 0,
    w: 100,
    h: 40,
    rotation: 0,
    parentId: null,
    index: "a0",
    props: {},
    ...overrides,
  };
}

function binding(id: string, overrides: Partial<BindingRecord> = {}): BindingRecord {
  return { id, arrowId: "arrow", targetId: "box", terminal: "end", anchor: { x: 0.5, y: 0 }, ...overrides };
}

function records(shapes: ShapeRecord[], bindings: BindingRecord[] = []): Tables {
  const shapeMap: Record<string, ShapeRecord> = {};
  for (const s of shapes) shapeMap[s.id] = s;
  const bindingMap: Record<string, BindingRecord> = {};
  for (const b of bindings) bindingMap[b.id] = b;
  return { shapes: shapeMap, bindings: bindingMap };
}

describe("diffTable", () => {
  it("is empty when nothing changed", () => {
    expect(diffTable(records([shape("a")]).shapes, records([shape("a")]).shapes)).toEqual({
      added: {},
      updated: {},
      removed: {},
    });
  });

  it("ignores volatile fields: a selection is not a change", () => {
    const base = { a: { id: "a", selected: false } };
    const current = { a: { id: "a", selected: true } };
    expect(diffTable(base, current).updated).toEqual({});
  });

  it("captures only the touched records", () => {
    const base = records([shape("keep"), shape("move")]).shapes;
    const current = records([shape("keep"), shape("move", { x: 100 })]).shapes;
    const diff = diffTable(base, current);
    expect(Object.keys(diff.updated)).toEqual(["move"]);
    expect(diff.updated.move[0].x).toBe(0);
    expect(diff.updated.move[1].x).toBe(100);
  });

  it("captures additions and removals", () => {
    const diff = diffTable(records([shape("gone")]).shapes, records([shape("fresh")]).shapes);
    expect(Object.keys(diff.added)).toEqual(["fresh"]);
    expect(Object.keys(diff.removed)).toEqual(["gone"]);
  });
});

describe("diffRecords", () => {
  it("returns null when the document round-trips unchanged", () => {
    const a = records([shape("a")], [binding("b")]);
    const b = records([shape("a")], [binding("b")]);
    expect(diffRecords(a, b)).toBeNull();
  });

  it("returns null for a selection-only change, since selection is not a record field", () => {
    const a = records([shape("a")]);
    const selected = records([{ ...shape("a"), selected: true } as unknown as ShapeRecord]);
    expect(diffRecords(a, selected)).toBeNull();
  });

  it("keys a change under the table it belongs to", () => {
    const diff = diffRecords(records([shape("a")]), records([shape("a", { x: 5 })]))!;
    expect(Object.keys(diff)).toEqual(["shapes"]);
    expect(Object.keys(diff.shapes!.updated)).toEqual(["a"]);
  });

  it("diffs both tables at once", () => {
    const diff = diffRecords(
      records([shape("a")], [binding("b")]),
      records([shape("a", { x: 5 })], [binding("b", { terminal: "start" })]),
    )!;
    expect(Object.keys(diff.shapes!.updated)).toEqual(["a"]);
    expect(Object.keys(diff.bindings!.updated)).toEqual(["b"]);
  });
});

describe("isEmptyDiff", () => {
  it("treats null, undefined and an entry-free diff as empty", () => {
    expect(isEmptyDiff(null)).toBe(true);
    expect(isEmptyDiff(undefined)).toBe(true);
    expect(isEmptyDiff({})).toBe(true);
    expect(isEmptyDiff({ shapes: { added: {}, updated: {}, removed: {} } })).toBe(true);
  });

  it("is false as soon as anything changed", () => {
    expect(isEmptyDiff(diffRecords(records([]), records([shape("a")]))!)).toBe(false);
  });
});

describe("invertDiff", () => {
  it("swaps added and removed and flips each updated pair", () => {
    const forward: Diff = {
      shapes: {
        added: { new: shape("new") },
        updated: { move: [shape("move", { x: 0 }), shape("move", { x: 10 })] },
        removed: { gone: shape("gone") },
      },
    };
    const inverted = invertDiff(forward);
    expect(inverted.shapes!.added).toEqual(forward.shapes!.removed);
    expect(inverted.shapes!.removed).toEqual(forward.shapes!.added);
    expect(inverted.shapes!.updated.move).toEqual([
      shape("move", { x: 10 }),
      shape("move", { x: 0 }),
    ]);
  });

  it("round-trips to the original", () => {
    const forward = diffRecords(records([shape("a")]), records([shape("a", { x: 3 })], [binding("b")]))!;
    expect(invertDiff(invertDiff(forward))).toEqual(forward);
  });
});

describe("mergeDiffs", () => {
  it("folds two sequential updates of one record into a single pair", () => {
    const first = diffRecords(records([shape("a")]), records([shape("a", { x: 10 })]))!;
    const second = diffRecords(records([shape("a", { x: 10 })]), records([shape("a", { x: 20 })]))!;
    const merged = mergeDiffs(first, second);
    expect(merged.shapes!.updated.a).toEqual([shape("a", { x: 0 }), shape("a", { x: 20 })]);
  });

  it("cancels an add that a later diff removes", () => {
    const added = diffRecords(records([]), records([shape("a")]))!;
    const removed = diffRecords(records([shape("a")]), records([]))!;
    expect(isEmptyDiff(mergeDiffs(added, removed))).toBe(true);
  });

  it("keeps a removal that only the later diff makes", () => {
    const first = diffRecords(records([shape("a"), shape("b"), shape("c")]), records([shape("a"), shape("c")]))!;
    const second = diffRecords(records([shape("a"), shape("c")]), records([shape("a")]))!;
    const merged = mergeDiffs(first, second);
    expect(Object.keys(merged.shapes!.removed).sort()).toEqual(["b", "c"]);
  });

  it("keeps a pure add as an add", () => {
    const first = diffRecords(records([]), records([shape("a")]))!;
    const second = diffRecords(records([shape("a")]), records([shape("a"), shape("b")]))!;
    const merged = mergeDiffs(first, second);
    expect(Object.keys(merged.shapes!.added).sort()).toEqual(["a", "b"]);
    expect(merged.shapes!.updated).toEqual({});
  });

  it("keeps both tables", () => {
    const first = diffRecords(records([shape("a")]), records([shape("a", { x: 1 })]))!;
    const second = diffRecords(records([shape("a", { x: 1 })], []), records([shape("a", { x: 1 })], [binding("b")]))!;
    const merged = mergeDiffs(first, second);
    expect(Object.keys(merged.shapes!.updated)).toEqual(["a"]);
    expect(Object.keys(merged.bindings!.added)).toEqual(["b"]);
  });
});

describe("applyDiff", () => {
  it("applies forward and backward back to the start", () => {
    const before = records([shape("stay"), shape("move")]);
    const after = records([shape("stay"), shape("move", { x: 40 }), shape("fresh")]);
    const diff = diffRecords(before, after)!;

    expect(applyDiff(before, diff, "forward")).toEqual(after);
    expect(applyDiff(after, diff, "backward")).toEqual(before);
  });

  it("re-adds a removed record on the backward pass", () => {
    const before = records([shape("a"), shape("b")], [binding("e")]);
    const after = records([shape("a")]);
    const diff = diffRecords(before, after)!;
    expect(applyDiff(after, diff, "backward")).toEqual(before);
  });

  it("leaves untouched tables alone", () => {
    const state = records([shape("a")], [binding("b")]);
    const diff = diffRecords(state, records([shape("a", { x: 9 })], [binding("b")]))!;
    expect(applyDiff(state, diff, "forward").bindings).toEqual(state.bindings);
  });
});
