import { it, expect, describe } from "vitest";
import { SCHEMA_VERSION } from "../types";
import { migrate } from "./migrate";
import { validate } from "./validate";

const camera = { x: 0, y: 0, zoom: 1 };

function shape(id: string) {
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
  };
}

describe("migrate", () => {
  it("runs the v0 to v1 chain on a fake v0 file", () => {
    const v0 = {
      schema: 0,
      shapes: [shape("a"), { ...shape("b"), type: "ellipse" }],
      camera,
    };
    const snap = migrate(v0);
    expect(snap.schema).toBe(SCHEMA_VERSION);
    expect(Object.keys(snap.shapes)).toEqual(["a", "b"]);
    expect(snap.shapes.a.type).toBe("rect");
    expect(snap.shapes.b.type).toBe("ellipse");
    expect(snap.bindings).toEqual({});
    expect(validate(snap)).toEqual([]);
  });

  it("passes a current snapshot through", () => {
    const snap = migrate({ schema: SCHEMA_VERSION, shapes: { a: shape("a") }, bindings: {}, camera });
    expect(Object.keys(snap.shapes)).toEqual(["a"]);
  });

  it("rejects a newer version", () => {
    expect(() => migrate({ schema: SCHEMA_VERSION + 1 })).toThrow(/newer/);
  });

  it("rejects a missing version", () => {
    expect(() => migrate({ shapes: {} })).toThrow(/non-negative integer/);
  });

  it("rejects a bad shape", () => {
    expect(() =>
      migrate({ schema: SCHEMA_VERSION, shapes: { a: { id: "a" } }, bindings: {}, camera }),
    ).toThrow(/shape "a"/);
  });

  it("rejects a bad binding", () => {
    const bad = {
      schema: SCHEMA_VERSION,
      shapes: { a: shape("a") },
      bindings: {
        b: { id: "b", arrowId: "a", targetId: "a", terminal: "side", anchor: { x: 0, y: 0 } },
      },
      camera,
    };
    expect(() => migrate(bad)).toThrow(/terminal/);
  });

  it("rejects a bad camera", () => {
    expect(() =>
      migrate({ schema: SCHEMA_VERSION, shapes: {}, bindings: {}, camera: { x: 0, y: 0 } }),
    ).toThrow(/zoom/);
  });
});
