import { describe, expect, it } from "vitest";
import type { ShapeRecord, Tables } from "../types";
import { applyDiff, diffRecords } from "./diff";
import { createHistory } from "./history";

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

function records(shapes: ShapeRecord[]): Tables {
  const map: Record<string, ShapeRecord> = {};
  for (const s of shapes) map[s.id] = s;
  return { shapes: map, bindings: {} };
}

describe("createHistory", () => {
  it("starts with nothing to undo or redo", () => {
    const history = createHistory();
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
    expect(history.undo()).toBeNull();
    expect(history.redo()).toBeNull();
  });

  it("ignores an empty diff, so a selection change never creates a step", () => {
    const history = createHistory();
    const before = records([shape("a")]);
    const selected = records([{ ...shape("a"), selected: true } as unknown as ShapeRecord]);
    const diff = diffRecords(before, selected);
    if (diff) history.push(diff);
    history.push({});
    expect(history.canUndo()).toBe(false);
  });

  it("undo returns the inverted diff and redo the original", () => {
    const history = createHistory();
    const before = records([shape("a", { x: 0 })]);
    const after = records([shape("a", { x: 30 })]);
    const diff = diffRecords(before, after)!;
    history.push(diff);

    const undone = history.undo()!;
    expect(applyDiff(after, undone, "forward")).toEqual(before);
    expect(history.canRedo()).toBe(true);

    const redone = history.redo()!;
    expect(redone).toEqual(diff);
  });

  it("walks a two-step document back and forward", () => {
    const history = createHistory();
    const s0 = records([shape("a", { x: 0 })]);
    const s1 = records([shape("a", { x: 10 })]);
    const s2 = records([shape("a", { x: 20 })]);
    history.push(diffRecords(s0, s1)!);
    history.push(diffRecords(s1, s2)!);

    const stepBack = history.undo()!;
    const backToOne = applyDiff(s2, stepBack, "forward");
    expect(backToOne).toEqual(s1);

    const stepBackAgain = history.undo()!;
    expect(applyDiff(backToOne, stepBackAgain, "forward")).toEqual(s0);
    expect(history.canUndo()).toBe(false);
  });

  it("drops the redone future when a new step is pushed", () => {
    const history = createHistory();
    const s0 = records([shape("a", { x: 0 })]);
    const s1 = records([shape("a", { x: 10 })]);
    const s2 = records([shape("a", { x: 20 })]);
    history.push(diffRecords(s0, s1)!);
    history.undo();
    expect(history.canRedo()).toBe(true);
    history.push(diffRecords(s0, s2)!);
    expect(history.canRedo()).toBe(false);
  });

  it("squashes every step since a mark into one", () => {
    const history = createHistory();
    const s0 = records([shape("a", { x: 0 })]);
    const s1 = records([shape("a", { x: 10 })]);
    const s2 = records([shape("a", { x: 20 })]);
    history.mark();
    history.push(diffRecords(s0, s1)!);
    history.push(diffRecords(s1, s2)!);
    const merged = history.squashToMark()!;

    expect(merged.shapes!.updated.a).toEqual([shape("a", { x: 0 }), shape("a", { x: 20 })]);
    // One undo now returns straight to the pre-gesture state.
    const undone = history.undo()!;
    expect(applyDiff(s2, undone, "forward")).toEqual(s0);
    expect(history.canUndo()).toBe(false);
  });

  it("leaves no step when a marked gesture nets to nothing", () => {
    const history = createHistory();
    const s0 = records([]);
    const s1 = records([shape("a")]);
    history.mark();
    history.push(diffRecords(s0, s1)!);
    history.push(diffRecords(s1, s0)!);
    expect(history.squashToMark()).toBeNull();
    expect(history.canUndo()).toBe(false);
  });

  it("returns null from squashToMark when nothing was pushed since the mark", () => {
    const history = createHistory();
    history.mark();
    expect(history.squashToMark()).toBeNull();
  });

  it("keeps the redo stack across a mark, since only a new step clears it", () => {
    const history = createHistory();
    const s0 = records([shape("a", { x: 0 })]);
    const s1 = records([shape("a", { x: 10 })]);
    const diff = diffRecords(s0, s1)!;
    history.push(diff);
    history.undo();
    history.mark();
    expect(history.canRedo()).toBe(true);
    expect(history.redo()).toEqual(diff);
  });
});
