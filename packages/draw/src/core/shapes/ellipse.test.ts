import { describe, it, expect } from "vitest";
import { ellipseUtil, type EllipseShape } from "./ellipse";
import { rotatedBoxBounds, boxCenter } from "../math/box";
import { rotate } from "../math/vec";
import { make } from "./test-fixtures";

const el = (overrides: Partial<Omit<EllipseShape, "id" | "index">> = {}) =>
  make(ellipseUtil, overrides);

describe("ellipse bounds", () => {
  it("is the box when straight and the rotated box otherwise", () => {
    expect(ellipseUtil.bounds(el())).toEqual({ x: 0, y: 0, w: 160, h: 100 });
    const turned = el({ rotation: Math.PI / 2 });
    expect(ellipseUtil.bounds(turned)).toEqual(rotatedBoxBounds(turned, turned.rotation));
  });
});

describe("ellipse hitTest", () => {
  it("outline hits on the rim, not the middle", () => {
    expect(ellipseUtil.hitTest(el(), { x: 160, y: 50 }, 1)).toBe(true);
    expect(ellipseUtil.hitTest(el(), { x: 80, y: 50 }, 1)).toBe(false);
    expect(ellipseUtil.hitTest(el(), { x: 300, y: 50 }, 1)).toBe(false);
  });

  it("filled hits inside", () => {
    const shape = el({ props: { accent: "ink", fill: true } });
    expect(ellipseUtil.hitTest(shape, { x: 80, y: 50 }, 0)).toBe(true);
    expect(ellipseUtil.hitTest(shape, { x: 200, y: 50 }, 0)).toBe(false);
  });

  it("accounts for rotation", () => {
    const shape = el({ rotation: Math.PI / 2 });
    const rim = rotate({ x: 160, y: 50 }, boxCenter(shape), shape.rotation);
    expect(ellipseUtil.hitTest(shape, rim, 1)).toBe(true);
    expect(ellipseUtil.hitTest(shape, { x: 160, y: 50 }, 1)).toBe(false);
  });
});

describe("ellipse resize", () => {
  it("resizes the box and keeps far corner when rotated", () => {
    const shape = el({ x: 0, y: 0, w: 100, h: 100, rotation: Math.PI / 5 });
    const anchorBefore = rotate({ x: shape.x, y: shape.y }, boxCenter(shape), shape.rotation);
    const patch = ellipseUtil.resize(shape, "se", { x: 0, y: 0, w: 200, h: 160 });
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
