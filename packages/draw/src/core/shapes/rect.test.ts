import { describe, it, expect } from "vitest";
import { rectUtil, type RectShape } from "./rect";
import { rotatedBoxBounds } from "../math/box";
import { rotate } from "../math/vec";
import { boxCenter } from "../math/box";
import { make } from "./test-fixtures";

const box = (overrides: Partial<Omit<RectShape, "id" | "index">> = {}) => make(rectUtil, overrides);

describe("rect bounds", () => {
  it("is the shape box when straight", () => {
    expect(rectUtil.bounds(box())).toEqual({ x: 0, y: 0, w: 160, h: 100 });
  });

  it("swaps extents at a quarter turn", () => {
    const shape = box({ rotation: Math.PI / 2 });
    expect(rectUtil.bounds(shape)).toEqual(rotatedBoxBounds(shape, shape.rotation));
    expect(rectUtil.bounds(shape).w).toBeCloseTo(100, 10);
    expect(rectUtil.bounds(shape).h).toBeCloseTo(160, 10);
  });
});

describe("rect hitTest", () => {
  it("outline hits on the edge, not the middle", () => {
    expect(rectUtil.hitTest(box(), { x: 0, y: 50 }, 1)).toBe(true);
    expect(rectUtil.hitTest(box(), { x: 80, y: 50 }, 1)).toBe(false);
    expect(rectUtil.hitTest(box(), { x: 300, y: 50 }, 1)).toBe(false);
  });

  it("filled hits inside and on the edge", () => {
    const shape = box({ props: { accent: "ink", fill: true, radius: 0 } });
    expect(rectUtil.hitTest(shape, { x: 80, y: 50 }, 0)).toBe(true);
    expect(rectUtil.hitTest(shape, { x: 0, y: 0 }, 0)).toBe(true);
    expect(rectUtil.hitTest(shape, { x: 200, y: 50 }, 0)).toBe(false);
  });

  it("accounts for rotation", () => {
    const shape = box({
      w: 100,
      h: 20,
      rotation: Math.PI / 2,
      props: { accent: "ink", fill: true, radius: 0 },
    });
    expect(rectUtil.hitTest(shape, { x: 50, y: -30 }, 0.5)).toBe(true);
    expect(rectUtil.hitTest(shape, { x: 10, y: 10 }, 0.5)).toBe(false);
  });
});

describe("rect resize", () => {
  it("returns only the changed size fields for a corner drag", () => {
    const shape = box();
    expect(rectUtil.resize(shape, "se", { x: 0, y: 0, w: 200, h: 150 })).toEqual({
      w: 200,
      h: 150,
    });
  });

  it("keeps the opposite corner fixed when unrotated", () => {
    const shape = box();
    const patch = rectUtil.resize(shape, "nw", { x: 20, y: 30, w: 100, h: 50 });
    const resized = { ...shape, ...patch };
    expect(resized.x + resized.w).toBe(shape.x + shape.w);
    expect(resized.y + resized.h).toBe(shape.y + shape.h);
    expect(resized.w).toBe(100);
    expect(resized.h).toBe(50);
  });

  it("keeps the far corner fixed in page space when rotated", () => {
    const shape = box({ x: 10, y: 20, w: 120, h: 60, rotation: Math.PI / 6 });
    const anchorBefore = rotate({ x: shape.x, y: shape.y }, boxCenter(shape), shape.rotation);

    const patch = rectUtil.resize(shape, "se", { x: 0, y: 0, w: 220, h: 140 });
    const resized = { ...shape, ...patch };
    const anchorAfter = rotate(
      { x: resized.x, y: resized.y },
      boxCenter(resized),
      resized.rotation
    );

    expect(anchorAfter.x).toBeCloseTo(anchorBefore.x, 9);
    expect(anchorAfter.y).toBeCloseTo(anchorBefore.y, 9);
  });

  it("keeps the opposite edge midpoint fixed for an edge handle", () => {
    const shape = box({ x: 10, y: 20, w: 120, h: 60, rotation: Math.PI / 3 });
    const midpointBefore = rotate(
      { x: shape.x, y: shape.y + shape.h / 2 },
      boxCenter(shape),
      shape.rotation
    );
    const patch = rectUtil.resize(shape, "e", { x: 10, y: 20, w: 200, h: 60 });
    const resized = { ...shape, ...patch };
    const midpointAfter = rotate(
      { x: resized.x, y: resized.y + resized.h / 2 },
      boxCenter(resized),
      resized.rotation
    );
    expect(midpointAfter.x).toBeCloseTo(midpointBefore.x, 9);
    expect(midpointAfter.y).toBeCloseTo(midpointBefore.y, 9);
  });
});

describe("rect toSvg", () => {
  it("draws a clean rectangle", () => {
    const svg = rectUtil.toSvg(box(), { dark: false, style: "clean" });
    expect(svg).toContain("<rect");
  });
});
