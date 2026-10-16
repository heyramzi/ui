import { describe, it, expect } from "vitest";
import { installArrowSideEffects } from "./side-effects";
import { arrowUtil, type ArrowShape } from "../shapes/arrow";
import { rectUtil, type RectShape } from "../shapes/rect";
import { make } from "../shapes/test-fixtures";
import type { BindingRecord, Diff, EditorApi, Id, ShapeRecord, Vec } from "../types";

function fakeEditor(initialShapes: ShapeRecord[], initialBindings: BindingRecord[]) {
  const shapes = new Map<Id, ShapeRecord>(initialShapes.map((s) => [s.id, s]));
  const bindings = new Map<Id, BindingRecord>(initialBindings.map((b) => [b.id, b]));
  const listeners = new Set<(diff: Diff) => void>();

  const editor = {
    getShape: (id: Id) => shapes.get(id),
    getBindingsFor: (id: Id) =>
      [...bindings.values()].filter((b) => b.arrowId === id || b.targetId === id),
    updateShapes: (patches: (Partial<ShapeRecord> & { id: Id })[]) => {
      const updated: Record<Id, [ShapeRecord, ShapeRecord]> = {};
      for (const patch of patches) {
        const before = shapes.get(patch.id);
        if (!before) continue;
        const after = { ...before, ...patch, id: patch.id } as ShapeRecord;
        shapes.set(patch.id, after);
        updated[patch.id] = [before, after];
      }
      const diff: Diff = { shapes: { added: {}, updated, removed: {} } };
      for (const listener of [...listeners]) listener(diff);
    },
    onDiff: (listener: (diff: Diff) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  } as unknown as EditorApi;

  return { editor, shapes, bindings, emit: (diff: Diff) => listeners.forEach((l) => l(diff)) };
}

const arrow = (overrides: Partial<Omit<ArrowShape, "id" | "index">> = {}) =>
  make(arrowUtil, {
    id: "arrow-1",
    x: 10,
    y: 10,
    w: 100,
    h: 0,
    props: {
      start: { x: 0, y: 0 },
      end: { x: 100, y: 0 },
      bend: 0,
      startHead: "none",
      endHead: "arrow",
      color: "ink",
    },
    ...overrides,
  });

const box = (id: string, overrides: Partial<Omit<RectShape, "id" | "index">> = {}) =>
  make(rectUtil, { id, x: 200, y: 0, w: 100, h: 100, ...overrides });

const binding = (overrides: Partial<BindingRecord> = {}): BindingRecord => ({
  id: "b-1",
  arrowId: "arrow-1",
  targetId: "target-1",
  terminal: "end",
  anchor: { x: 0, y: 0.5 },
  ...overrides,
});

const pageEnd = (shape: ArrowShape): Vec => ({
  x: shape.x + shape.props.end.x,
  y: shape.y + shape.props.end.y,
});
const pageStart = (shape: ArrowShape): Vec => ({
  x: shape.x + shape.props.start.x,
  y: shape.y + shape.props.start.y,
});

describe("installArrowSideEffects", () => {
  it("re-fits a bound arrow when its target moves", () => {
    const target = box("target-1");
    const { editor, shapes } = fakeEditor([arrow(), target], [binding()]);
    installArrowSideEffects(editor);

    editor.updateShapes([{ id: "target-1", x: 400 }]);

    const end = pageEnd(shapes.get("arrow-1") as ArrowShape);
    expect(end.x).toBeCloseTo(400, 6);
    expect(end.y).toBeCloseTo(50, 6);
  });

  it("keeps a free end put when the target moves", () => {
    const target = box("target-1");
    const { editor, shapes } = fakeEditor([arrow(), target], [binding()]);
    installArrowSideEffects(editor);

    editor.updateShapes([{ id: "target-1", x: 400 }]);

    expect(pageStart(shapes.get("arrow-1") as ArrowShape)).toEqual({ x: 10, y: 10 });
  });

  it("leaves the arrow alone when its target is deleted", () => {
    const target = box("target-1");
    const { editor, shapes, emit } = fakeEditor([arrow(), target], [binding()]);
    installArrowSideEffects(editor);
    const before = shapes.get("arrow-1");

    emit({ shapes: { added: {}, updated: {}, removed: { "target-1": target } } });

    expect(shapes.get("arrow-1")).toBe(before);
  });

  it("ignores its own arrow updates", () => {
    const target = box("target-1");
    const { editor, shapes } = fakeEditor([arrow(), target], [binding()]);
    installArrowSideEffects(editor);

    editor.updateShapes([{ id: "target-1", x: 400 }]);
    const once = pageEnd(shapes.get("arrow-1") as ArrowShape);

    editor.updateShapes([{ id: "target-1", x: 400 }]);
    expect(pageEnd(shapes.get("arrow-1") as ArrowShape)).toEqual(once);
  });
});
