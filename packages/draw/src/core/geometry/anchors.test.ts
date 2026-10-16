import { describe, expect, it } from "vitest";
import type { Box } from "../types";
import { bestAnchors, outlinePoint, sideDetour } from "./anchors";

const box = (x: number, y: number): Box => ({ x, y, w: 200, h: 80 });

describe("bestAnchors", () => {
  it("joins stacked boxes down the right, never through the middle", () => {
    const { source, target } = bestAnchors(box(0, 0), box(20, 300));
    expect([source.side, target.side]).toEqual(["right", "right"]);
    expect(source.point.x).toBe(200);
    expect(source.point.y).toBe(40);
    expect(target.point.x).toBe(220);
    expect(target.point.y).toBe(340);
  });

  it("carries a 0 to 1 box position for a binding to store", () => {
    expect(bestAnchors(box(0, 0), box(500, 30)).source.position).toEqual({ x: 1, y: 0.5 });
    expect(bestAnchors(box(0, 0), box(0, 300)).source.position).toEqual({ x: 1, y: 0.5 });
  });

  it("joins stacked boxes down the left when the right margin is smaller", () => {
    const wide: Box = { x: 0, y: 0, w: 300, h: 80 };
    const narrow: Box = { x: 200, y: 300, w: 80, h: 80 };
    const { source, target } = bestAnchors(wide, narrow);
    expect([source.side, target.side]).toEqual(["left", "left"]);
    expect(source.point.x).toBe(0);
    expect(target.point.x).toBe(200);
  });

  it("stays right on ties and partial overlaps", () => {
    const tied = bestAnchors(box(0, 300), box(0, 0));
    expect([tied.source.side, tied.target.side]).toEqual(["right", "right"]);
    const partial = bestAnchors(box(0, 0), box(100, 300));
    expect([partial.source.side, partial.target.side]).toEqual(["right", "right"]);
  });

  it("meets right to left when the target is beside it", () => {
    const { source, target } = bestAnchors(box(0, 0), box(500, 30));
    expect([source.side, target.side]).toEqual(["right", "left"]);
    expect(source.point.x).toBe(200);
    expect(source.point.y).toBe(40);
    expect(target.point.x).toBe(500);
  });

  it("meets left to right when the target is to the left", () => {
    const { source, target } = bestAnchors(box(500, 0), box(0, 0));
    expect([source.side, target.side]).toEqual(["left", "right"]);
  });

  it("takes the axis with the wider gap, not the wider centre offset", () => {
    // 240px apart sideways, 400px apart vertically: the column wins.
    const { source } = bestAnchors(box(0, 0), box(440, 480));
    expect(source.side).toBe("bottom");
  });

  it("joins overlapping boxes by the side, not through the middle", () => {
    const { source, target } = bestAnchors(box(0, 0), box(10, 10));
    expect([source.side, target.side]).toEqual(["right", "right"]);
  });
});

describe("sideDetour", () => {
  it("runs past the further right edge, plus the margin", () => {
    const anchors = bestAnchors(box(0, 0), box(20, 300));
    expect(sideDetour(anchors)).toBe(260);
    expect(sideDetour(anchors, 10)).toBe(230);
  });

  it("runs past the further left edge, minus the margin", () => {
    const wide: Box = { x: 0, y: 0, w: 300, h: 80 };
    const narrow: Box = { x: 200, y: 300, w: 80, h: 80 };
    expect(sideDetour(bestAnchors(wide, narrow))).toBe(-40);
  });
});

describe("outlinePoint", () => {
  it("lands on the box edge toward the target", () => {
    const o = { cx: 0, cy: 0, rx: 100, ry: 50, round: false };
    expect(outlinePoint(o, { x: 1000, y: 0 })).toEqual({ x: 100, y: 0 });
    expect(outlinePoint(o, { x: 0, y: 1000 })).toEqual({ x: 0, y: 50 });
  });

  it("follows the ellipse when round is set", () => {
    const o = { cx: 0, cy: 0, rx: 100, ry: 50, round: true };
    const on = outlinePoint(o, { x: 100, y: 0 });
    expect(on.x).toBe(100);
    expect(on.y).toBeCloseTo(0);
  });

  it("pushes the point out by the gap", () => {
    const o = { cx: 0, cy: 0, rx: 100, ry: 50, round: false };
    expect(outlinePoint(o, { x: 1000, y: 0 }, 10).x).toBeCloseTo(110);
  });

  it("returns the centre when the target is the centre", () => {
    const o = { cx: 5, cy: 5, rx: 100, ry: 50, round: false };
    expect(outlinePoint(o, { x: 5, y: 5 })).toEqual({ x: 5, y: 5 });
  });
});
