import { it, expect, describe } from "vitest";
import type { BindingRecord, ShapeRecord, Snapshot } from "../types";
import { validate } from "./validate";

const camera = { x: 0, y: 0, zoom: 1 };

function shape(id: string, over: Partial<ShapeRecord> = {}): ShapeRecord {
  return {
    id,
    type: "rect",
    x: 0,
    y: 0,
    w: 10,
    h: 10,
    rotation: 0,
    parentId: null,
    index: "a0",
    props: {},
    ...over,
  };
}

function binding(id: string, arrowId: string, targetId: string): BindingRecord {
  return { id, arrowId, targetId, terminal: "end", anchor: { x: 0.5, y: 0.5 } };
}

function snap(shapes: ShapeRecord[], bindings: BindingRecord[] = []): Snapshot {
  const shapeMap: Record<string, ShapeRecord> = {};
  for (const record of shapes) {
    shapeMap[record.id] = record;
  }
  const bindingMap: Record<string, BindingRecord> = {};
  for (const record of bindings) {
    bindingMap[record.id] = record;
  }
  return { schema: 1, shapes: shapeMap, bindings: bindingMap, camera };
}

describe("validate", () => {
  it("is empty for a clean snapshot", () => {
    expect(validate(snap([shape("a")], [binding("b", "a", "a")]))).toEqual([]);
  });

  it("flags an orphan binding", () => {
    const problems = validate(snap([shape("a")], [binding("b", "a", "missing")]));
    expect(problems.some((problem) => problem.includes("orphan binding"))).toBe(true);
  });

  it("flags a parent loop", () => {
    const problems = validate(snap([shape("a", { parentId: "b" }), shape("b", { parentId: "a" })]));
    expect(problems.some((problem) => problem.includes("parent loop"))).toBe(true);
  });

  it("flags a duplicate id across tables", () => {
    const problems = validate(snap([shape("a")], [binding("a", "a", "a")]));
    expect(problems.some((problem) => problem.includes("duplicate id"))).toBe(true);
  });

  it("flags a key that does not match its id", () => {
    const snapshot = snap([shape("a")]);
    delete snapshot.shapes.a;
    snapshot.shapes.z = shape("a");
    const problems = validate(snapshot);
    expect(problems.some((problem) => problem.includes('key "z"'))).toBe(true);
  });

  it("flags a missing parent", () => {
    const problems = validate(snap([shape("a", { parentId: "ghost" })]));
    expect(problems.some((problem) => problem.includes("missing parent"))).toBe(true);
  });
});
