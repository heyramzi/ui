import { describe, it, expect } from "vitest";
import { boxCenter, boxCorners, boxContains, boxIntersects, rotatedBoxBounds } from "./box";

describe("box", () => {
  it("finds the centre", () => {
    expect(boxCenter({ x: 10, y: 20, w: 40, h: 100 })).toEqual({ x: 30, y: 70 });
  });

  it("lists corners clockwise from the top-left", () => {
    expect(boxCorners({ x: 0, y: 0, w: 2, h: 1 })).toEqual([
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 0, y: 1 },
    ]);
  });

  it("contains points inside and on the edge, not outside", () => {
    const box = { x: 0, y: 0, w: 10, h: 10 };
    expect(boxContains(box, { x: 5, y: 5 })).toBe(true);
    expect(boxContains(box, { x: 10, y: 10 })).toBe(true);
    expect(boxContains(box, { x: 5, y: 11 })).toBe(false);
    expect(boxContains(box, { x: -1, y: 5 })).toBe(false);
  });

  it("intersects when areas overlap or touch", () => {
    const a = { x: 0, y: 0, w: 10, h: 10 };
    expect(boxIntersects(a, { x: 5, y: 5, w: 10, h: 10 })).toBe(true);
    expect(boxIntersects(a, { x: 10, y: 0, w: 5, h: 5 })).toBe(true);
    expect(boxIntersects(a, { x: 11, y: 0, w: 5, h: 5 })).toBe(false);
  });

  it("returns the same box for no rotation", () => {
    const box = { x: 3, y: 4, w: 5, h: 6 };
    expect(rotatedBoxBounds(box, 0)).toEqual(box);
  });

  it("grows the bounds a quarter turn swaps width and height", () => {
    const box = { x: 0, y: 0, w: 100, h: 20 };
    const turned = rotatedBoxBounds(box, Math.PI / 2);
    expect(turned.w).toBeCloseTo(20, 10);
    expect(turned.h).toBeCloseTo(100, 10);
    expect(turned.x).toBeCloseTo(40, 10);
    expect(turned.y).toBeCloseTo(-40, 10);
  });

  it("is symmetric about the centre", () => {
    const box = { x: 10, y: 10, w: 100, h: 20 };
    const turned = rotatedBoxBounds(box, Math.PI / 2);
    const center = boxCenter(box);
    expect(turned.x + turned.w / 2).toBeCloseTo(center.x, 10);
    expect(turned.y + turned.h / 2).toBeCloseTo(center.y, 10);
  });
});
