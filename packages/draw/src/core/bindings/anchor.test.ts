import { describe, it, expect } from "vitest";
import { anchorFromPoint, anchorPagePoint } from "./anchor";
import { rectUtil } from "../shapes/rect";
import { make } from "../shapes/test-fixtures";

const box = (overrides = {}) => make(rectUtil, { x: 0, y: 0, w: 100, h: 100, ...overrides });

describe("anchorFromPoint", () => {
  it("maps a corner and an edge to 0 to 1", () => {
    const target = box();
    expect(anchorFromPoint(target, { x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
    expect(anchorFromPoint(target, { x: 100, y: 50 })).toEqual({ x: 1, y: 0.5 });
  });

  it("snaps to center near the middle", () => {
    const target = box();
    expect(anchorFromPoint(target, { x: 52, y: 50 })).toEqual({ x: 0.5, y: 0.5 });
    expect(anchorFromPoint(target, { x: 50, y: 10 })).toEqual({ x: 0.5, y: 0.1 });
  });

  it("keeps the anchor on the box", () => {
    expect(anchorFromPoint(box(), { x: -20, y: 150 })).toEqual({ x: 0, y: 1 });
  });

  it("round-trips through a rotated box", () => {
    const target = box({ x: 40, y: -10, rotation: Math.PI / 5 });
    const point = { x: 70, y: 30 };
    const anchor = anchorFromPoint(target, point);
    const back = anchorPagePoint(target, anchor);
    expect(back.x).toBeCloseTo(point.x, 6);
    expect(back.y).toBeCloseTo(point.y, 6);
  });
});
