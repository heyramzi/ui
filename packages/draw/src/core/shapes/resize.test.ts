import { describe, it, expect } from "vitest";
import { resizeShapeBox, boxPatch, scalePoints } from "./resize";
import { make } from "./test-fixtures";
import { rectUtil } from "./rect";
import { boxCenter } from "../math/box";
import { rotate } from "../math/vec";

const shape = make(rectUtil, { x: 0, y: 0, w: 100, h: 100, rotation: 0 });

describe("resizeShapeBox", () => {
  it("drags a corner and keeps the opposite one fixed", () => {
    expect(resizeShapeBox(shape, "se", { x: 0, y: 0, w: 50, h: 40 })).toEqual({
      x: 0,
      y: 0,
      w: 50,
      h: 40,
    });
    expect(resizeShapeBox(shape, "nw", { x: 10, y: 20, w: 50, h: 40 })).toEqual({
      x: 50,
      y: 60,
      w: 50,
      h: 40,
    });
  });

  it("drags an edge and leaves the other axis alone", () => {
    expect(resizeShapeBox(shape, "e", { x: 0, y: 0, w: 50, h: 999 })).toEqual({
      x: 0,
      y: 0,
      w: 50,
      h: 100,
    });
    expect(resizeShapeBox(shape, "n", { x: 999, y: 10, w: 999, h: 40 })).toEqual({
      x: 0,
      y: 60,
      w: 100,
      h: 40,
    });
  });

  it("keeps the opposite corner in page space when rotated", () => {
    const turned = make(rectUtil, { x: 5, y: 7, w: 80, h: 40, rotation: Math.PI / 3 });
    const before = rotate({ x: turned.x, y: turned.y }, boxCenter(turned), turned.rotation);
    const patch = resizeShapeBox(turned, "se", { x: 0, y: 0, w: 200, h: 100 });
    const after = { ...turned, ...patch };
    const afterAnchor = rotate({ x: after.x, y: after.y }, boxCenter(after), after.rotation);
    expect(afterAnchor.x).toBeCloseTo(before.x, 9);
    expect(afterAnchor.y).toBeCloseTo(before.y, 9);
  });
});

describe("boxPatch", () => {
  it("returns only the changed fields", () => {
    expect(boxPatch(shape, { x: 0, y: 0, w: 100, h: 40 })).toEqual({ h: 40 });
    expect(boxPatch(shape, { x: 1, y: 2, w: 100, h: 100 })).toEqual({ x: 1, y: 2 });
    expect(boxPatch(shape, { x: 0, y: 0, w: 100, h: 100 })).toEqual({});
  });
});

describe("scalePoints", () => {
  it("scales x and y independently", () => {
    expect(scalePoints([{ x: 2, y: 3 }], { w: 10, h: 10 }, { w: 20, h: 30 })).toEqual([
      { x: 4, y: 9 },
    ]);
  });

  it("leaves a zero-width axis alone", () => {
    expect(scalePoints([{ x: 2, y: 3 }], { w: 0, h: 10 }, { w: 20, h: 10 })).toEqual([
      { x: 2, y: 3 },
    ]);
  });
});
