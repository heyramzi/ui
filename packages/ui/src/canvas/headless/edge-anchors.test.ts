import { describe, expect, it } from "vite-plus/test";
import { bestAnchors, sideDetour, type Rect } from "#src/canvas/headless/edge-anchors.js";

const box = (x: number, y: number): Rect => ({ x, y, width: 200, height: 80 });

describe("bestAnchors", () => {
  it("joins a box to the one below it, bottom to top, never round the side", () => {
    const { source, target } = bestAnchors(box(0, 0), box(20, 300));
    expect([source.side, target.side]).toEqual(["bottom", "top"]);
    expect(source).toMatchObject({ x: 100, y: 80 });
    expect(target).toMatchObject({ x: 120, y: 300 });
  });

  it("joins a box to the one above it, top to bottom", () => {
    const { source, target } = bestAnchors(box(0, 300), box(0, 0));
    expect([source.side, target.side]).toEqual(["top", "bottom"]);
    const partial = bestAnchors(box(100, 300), box(0, 0));
    expect([partial.source.side, partial.target.side]).toEqual(["top", "bottom"]);
  });

  it("meets right to left when the target is beside it", () => {
    const { source, target } = bestAnchors(box(0, 0), box(500, 30));
    expect([source.side, target.side]).toEqual(["right", "left"]);
    expect(source.x).toBe(200);
    expect(source.y).toBe(40);
    expect(target.x).toBe(500);
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
  const at = (
    side: "left" | "right" | "top" | "bottom",
    a: [number, number],
    b: [number, number],
  ) => ({
    source: { x: a[0], y: a[1], side },
    target: { x: b[0], y: b[1], side },
  });

  it("runs past the further right edge, plus the margin", () => {
    const anchors = at("right", [200, 40], [220, 340]);
    expect(sideDetour(anchors)).toBe(260);
    expect(sideDetour(anchors, 10)).toBe(230);
  });

  it("runs past the further left edge, minus the margin", () => {
    expect(sideDetour(at("left", [0, 40], [200, 340]))).toBe(-40);
  });

  it("runs past the higher top or lower bottom edge", () => {
    expect(sideDetour(at("top", [100, 50], [300, 20]))).toBe(-20);
    expect(sideDetour(at("bottom", [100, 50], [300, 20]))).toBe(90);
  });
});
