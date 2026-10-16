import { describe, it, expect } from "vitest";
import { add, sub, scale, dist, rotate } from "./vec";

describe("vec", () => {
  it("adds and subtracts component-wise", () => {
    expect(add({ x: 1, y: 2 }, { x: 3, y: 4 })).toEqual({ x: 4, y: 6 });
    expect(sub({ x: 3, y: 4 }, { x: 1, y: 2 })).toEqual({ x: 2, y: 2 });
  });

  it("scales both components", () => {
    expect(scale({ x: 2, y: -3 }, 2)).toEqual({ x: 4, y: -6 });
  });

  it("measures distance", () => {
    expect(dist({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it("rotates a right angle around the origin", () => {
    const p = rotate({ x: 1, y: 0 }, { x: 0, y: 0 }, Math.PI / 2);
    expect(p.x).toBeCloseTo(0, 12);
    expect(p.y).toBeCloseTo(1, 12);
  });

  it("rotates around a point that is not the origin", () => {
    const p = rotate({ x: 3, y: 1 }, { x: 1, y: 1 }, Math.PI);
    expect(p.x).toBeCloseTo(-1, 12);
    expect(p.y).toBeCloseTo(1, 12);
  });

  it("returns the same point for zero rotation", () => {
    expect(rotate({ x: 5, y: 7 }, { x: 1, y: 1 }, 0)).toEqual({ x: 5, y: 7 });
  });
});
