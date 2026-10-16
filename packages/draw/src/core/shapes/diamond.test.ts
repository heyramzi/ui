import { describe, it, expect } from "vitest";
import { diamondUtil, type DiamondShape } from "./diamond";
import { rotatedBoxBounds, boxCenter } from "../math/box";
import { rotate } from "../math/vec";
import { make } from "./test-fixtures";

const di = (overrides: Partial<Omit<DiamondShape, "id" | "index">> = {}) =>
  make(diamondUtil, overrides);

describe("diamond bounds", () => {
  it("is the box when straight and the rotated box otherwise", () => {
    expect(diamondUtil.bounds(di())).toEqual({ x: 0, y: 0, w: 160, h: 100 });
    const turned = di({ rotation: Math.PI / 3 });
    expect(diamondUtil.bounds(turned)).toEqual(rotatedBoxBounds(turned, turned.rotation));
  });
});

describe("diamond hitTest", () => {
  it("outline hits on the edge, not the middle", () => {
    expect(diamondUtil.hitTest(di(), { x: 80, y: 0 }, 1)).toBe(true);
    expect(diamondUtil.hitTest(di(), { x: 80, y: 50 }, 1)).toBe(false);
    expect(diamondUtil.hitTest(di(), { x: 0, y: 0 }, 1)).toBe(false);
  });

  it("filled hits inside and on the edge", () => {
    const shape = di({ props: { accent: "ink", fill: true } });
    expect(diamondUtil.hitTest(shape, { x: 80, y: 50 }, 0)).toBe(true);
    expect(diamondUtil.hitTest(shape, { x: 0, y: 0 }, 0)).toBe(false);
  });

  it("accounts for rotation", () => {
    const shape = di({ rotation: Math.PI / 2 });
    const top = rotate({ x: 80, y: 0 }, boxCenter(shape), shape.rotation);
    expect(diamondUtil.hitTest(shape, top, 1)).toBe(true);
    expect(diamondUtil.hitTest(shape, { x: 80, y: 0 }, 1)).toBe(false);
  });
});

describe("diamond resize", () => {
  it("returns only changed fields and keeps the far corner fixed", () => {
    const shape = di({ x: 5, y: 8, w: 120, h: 90, rotation: Math.PI / 4 });
    const anchorBefore = rotate({ x: shape.x, y: shape.y }, boxCenter(shape), shape.rotation);
    const patch = diamondUtil.resize(shape, "se", { x: 0, y: 0, w: 220, h: 200 });
    const resized = { ...shape, ...patch };
    const anchorAfter = rotate(
      { x: resized.x, y: resized.y },
      boxCenter(resized),
      resized.rotation
    );
    expect(anchorAfter.x).toBeCloseTo(anchorBefore.x, 9);
    expect(anchorAfter.y).toBeCloseTo(anchorBefore.y, 9);
  });
});
