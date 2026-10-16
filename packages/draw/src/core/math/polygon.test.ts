import { describe, it, expect } from "vitest";
import { pointInPolygon, distanceToPolyline, simplifyPolyline } from "./polygon";

const square = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 },
];

describe("pointInPolygon", () => {
  it("accepts inside and edge points", () => {
    expect(pointInPolygon({ x: 5, y: 5 }, square)).toBe(true);
    expect(pointInPolygon({ x: 0, y: 5 }, square)).toBe(true);
    expect(pointInPolygon({ x: 10, y: 10 }, square)).toBe(true);
  });

  it("rejects outside points", () => {
    expect(pointInPolygon({ x: 11, y: 5 }, square)).toBe(false);
    expect(pointInPolygon({ x: 5, y: -1 }, square)).toBe(false);
  });

  it("treats a degenerate polygon as empty", () => {
    expect(pointInPolygon({ x: 0, y: 0 }, [{ x: 0, y: 0 }, { x: 1, y: 1 }])).toBe(false);
  });
});

describe("distanceToPolyline", () => {
  it("measures to the nearest segment", () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ];
    expect(distanceToPolyline({ x: 5, y: 2 }, pts)).toBeCloseTo(2, 12);
    expect(distanceToPolyline({ x: 12, y: 5 }, pts)).toBeCloseTo(2, 12);
  });

  it("handles a single point and an empty list", () => {
    expect(distanceToPolyline({ x: 3, y: 4 }, [{ x: 0, y: 0 }])).toBe(5);
    expect(distanceToPolyline({ x: 3, y: 4 }, [])).toBe(Infinity);
  });
});

describe("simplifyPolyline", () => {
  it("keeps the ends and drops near-collinear noise", () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 1, y: 0.1 },
      { x: 2, y: 0 },
      { x: 3, y: 0.05 },
      { x: 10, y: 0 },
    ];
    expect(simplifyPolyline(pts, 0.5)).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ]);
  });

  it("keeps a corner that breaks the tolerance", () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 5, y: 8 },
      { x: 10, y: 0 },
    ];
    expect(simplifyPolyline(pts, 1)).toEqual(pts);
  });

  it("leaves short lists alone", () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ];
    expect(simplifyPolyline(pts, 5)).toEqual(pts);
  });
});
