import { describe, it, expect } from "vitest";
import { lineUtil, type LineShape } from "./line";
import { rotatedBoxBounds, boxCenter } from "../math/box";
import { rotate } from "../math/vec";
import { make } from "./test-fixtures";

const points = [
  { x: 0, y: 0 },
  { x: 160, y: 100 },
];
const ln = (overrides: Partial<Omit<LineShape, "id" | "index">> = {}) =>
  make(lineUtil, { props: { accent: "ink", points }, ...overrides });

describe("line bounds", () => {
  it("is the box when straight and the rotated box otherwise", () => {
    expect(lineUtil.bounds(ln())).toEqual({ x: 0, y: 0, w: 160, h: 100 });
    const turned = ln({ rotation: Math.PI / 2 });
    expect(lineUtil.bounds(turned)).toEqual(rotatedBoxBounds(turned, turned.rotation));
  });
});

describe("line hitTest", () => {
  it("hits on the stroke, not beside it", () => {
    expect(lineUtil.hitTest(ln(), { x: 80, y: 50 }, 1)).toBe(true);
    expect(lineUtil.hitTest(ln(), { x: 0, y: 0 }, 1)).toBe(true);
    expect(lineUtil.hitTest(ln(), { x: 80, y: 20 }, 1)).toBe(false);
    expect(lineUtil.hitTest(ln(), { x: 300, y: 50 }, 1)).toBe(false);
  });

  it("accounts for rotation", () => {
    const shape = ln({ rotation: Math.PI / 2 });
    const onLine = rotate({ x: 40, y: 25 }, boxCenter(shape), shape.rotation);
    expect(lineUtil.hitTest(shape, onLine, 1)).toBe(true);
    expect(lineUtil.hitTest(shape, { x: 40, y: 25 }, 1)).toBe(false);
  });
});

describe("line resize", () => {
  it("scales the points with the box", () => {
    const shape = ln();
    const patch = lineUtil.resize(shape, "se", { x: 0, y: 0, w: 320, h: 200 });
    expect(patch.props?.points).toEqual([
      { x: 0, y: 0 },
      { x: 320, y: 200 },
    ]);
    expect(patch.w).toBe(320);
    expect(patch.h).toBe(200);
  });

  it("keeps the far corner fixed when rotated", () => {
    const shape = ln({ x: 10, y: 10, w: 100, h: 60, rotation: Math.PI / 8 });
    const anchorBefore = rotate({ x: shape.x, y: shape.y }, boxCenter(shape), shape.rotation);
    const patch = lineUtil.resize(shape, "se", { x: 0, y: 0, w: 200, h: 120 });
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
