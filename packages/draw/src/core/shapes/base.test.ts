import { describe, it, expect } from "vitest";
import { make } from "./test-fixtures";
import { rectUtil } from "./rect";
import {
  boundsOf,
  localPoint,
  distanceToBoxPerimeter,
  hitsFilledBox,
  hitsBoxOutline,
  hitsFilledPolygon,
  toPageLocal,
} from "./base";
import { boxCenter } from "../math/box";
import { rotate } from "../math/vec";

const box = { x: 0, y: 0, w: 100, h: 50 };

describe("localPoint", () => {
  it("undoes the shape rotation", () => {
    const shape = make(rectUtil, { ...box, rotation: Math.PI / 3 });
    const target = { x: 20, y: 30 };
    const page = rotate(target, boxCenter(shape), shape.rotation);
    const local = localPoint(shape, page);
    expect(local.x).toBeCloseTo(target.x, 9);
    expect(local.y).toBeCloseTo(target.y, 9);
  });

  it("is the identity when straight", () => {
    const shape = make(rectUtil, box);
    expect(localPoint(shape, { x: 5, y: 6 })).toEqual({ x: 5, y: 6 });
  });
});

describe("boundsOf", () => {
  it("is the box when straight", () => {
    expect(boundsOf(make(rectUtil, box))).toEqual(box);
  });

  it("grows with rotation", () => {
    const shape = make(rectUtil, { ...box, rotation: Math.PI / 2 });
    expect(boundsOf(shape).w).toBeCloseTo(50, 9);
    expect(boundsOf(shape).h).toBeCloseTo(100, 9);
  });
});

describe("distanceToBoxPerimeter", () => {
  it("is zero on the edge and grows inward", () => {
    expect(distanceToBoxPerimeter({ x: 50, y: 0 }, box)).toBe(0);
    expect(distanceToBoxPerimeter({ x: 50, y: 25 }, box)).toBe(25);
    expect(distanceToBoxPerimeter({ x: 110, y: 25 }, box)).toBe(10);
  });
});

describe("box hits", () => {
  it("filled hits inside and respects the margin", () => {
    const shape = make(rectUtil, box);
    expect(hitsFilledBox(shape, { x: 50, y: 25 }, 0)).toBe(true);
    expect(hitsFilledBox(shape, { x: 105, y: 25 }, 0)).toBe(false);
    expect(hitsFilledBox(shape, { x: 105, y: 25 }, 10)).toBe(true);
  });

  it("outline hits the edge only", () => {
    const shape = make(rectUtil, box);
    expect(hitsBoxOutline(shape, { x: 0, y: 25 }, 0.5)).toBe(true);
    expect(hitsBoxOutline(shape, { x: 50, y: 25 }, 0.5)).toBe(false);
  });
});

describe("hitsFilledPolygon", () => {
  it("uses the polygon, not the box", () => {
    const shape = make(rectUtil, box);
    const triangle = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 0, y: 50 },
    ];
    expect(hitsFilledPolygon(shape, { x: 10, y: 10 }, triangle)).toBe(true);
    expect(hitsFilledPolygon(shape, { x: 90, y: 40 }, triangle)).toBe(false);
  });
});

describe("toPageLocal", () => {
  it("offsets box-relative points by the shape position", () => {
    const shape = make(rectUtil, { x: 10, y: 20 });
    expect(toPageLocal(shape, [{ x: 1, y: 2 }])).toEqual([{ x: 11, y: 22 }]);
  });
});
