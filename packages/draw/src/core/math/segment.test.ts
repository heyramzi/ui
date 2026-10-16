import { describe, it, expect } from "vitest";
import { pointToSegmentDistance } from "./segment";

describe("pointToSegmentDistance", () => {
  const a = { x: 0, y: 0 };
  const b = { x: 10, y: 0 };

  it("measures the perpendicular drop onto the middle", () => {
    expect(pointToSegmentDistance({ x: 5, y: 3 }, a, b)).toBeCloseTo(3, 12);
  });

  it("clamps past an end", () => {
    expect(pointToSegmentDistance({ x: -4, y: 0 }, a, b)).toBeCloseTo(4, 12);
    expect(pointToSegmentDistance({ x: 14, y: 0 }, a, b)).toBeCloseTo(4, 12);
  });

  it("handles a zero-length segment", () => {
    expect(pointToSegmentDistance({ x: 3, y: 4 }, a, a)).toBe(5);
  });

  it("measures the diagonal", () => {
    const d = pointToSegmentDistance({ x: 0, y: 10 }, { x: 0, y: 0 }, { x: 10, y: 10 });
    expect(d).toBeCloseTo(5 * Math.SQRT2, 12);
  });
});
