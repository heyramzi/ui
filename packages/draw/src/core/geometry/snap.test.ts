import { describe, expect, it } from "vitest";
import type { Box } from "../types";
import { computeSnap, SNAP_THRESHOLD, snapShape } from "./snap";

const CARD: Box = { x: 0, y: 0, w: 100, h: 40 };

describe("computeSnap", () => {
  it("leaves a lone box where it is", () => {
    const result = computeSnap({ ...CARD, x: 33, y: 71 }, []);
    expect(result).toEqual({ x: 33, y: 71, guides: [] });
  });

  it("pulls a left edge onto another box's left edge", () => {
    const other: Box = { x: 200, y: 300, w: 100, h: 40 };
    const result = computeSnap({ ...CARD, x: 204, y: 0 }, [other]);
    expect(result.x).toBe(200);
    expect(result.guides.some((g) => g.axis === "x" && g.position === 200)).toBe(true);
  });

  it("pulls a centre onto another box's centre", () => {
    const other: Box = { x: 200, y: 300, w: 100, h: 40 };
    // Centre at 253 wants 250: the dragged box's own centre is x + 50.
    const result = computeSnap({ ...CARD, x: 203, y: 0 }, [other]);
    expect(result.x + 50).toBe(250);
  });

  it("snaps both axes independently", () => {
    const other: Box = { x: 200, y: 300, w: 100, h: 40 };
    const result = computeSnap({ ...CARD, x: 202, y: 298 }, [other]);
    expect(result).toMatchObject({ x: 200, y: 300 });
    expect(result.guides).toHaveLength(2);
  });

  it("ignores a candidate further away than the threshold", () => {
    const other: Box = { x: 200, y: 300, w: 100, h: 40 };
    const away = SNAP_THRESHOLD + 1;
    const result = computeSnap({ ...CARD, x: 200 + away, y: 0 }, [other]);
    expect(result.x).toBe(200 + away);
    expect(result.guides.filter((g) => g.axis === "x")).toHaveLength(0);
  });

  it("takes the nearest line when several are in range", () => {
    const near: Box = { x: 202, y: 300, w: 100, h: 40 };
    const far: Box = { x: 205, y: 300, w: 100, h: 40 };
    const result = computeSnap({ ...CARD, x: 203, y: 0 }, [near, far]);
    expect(result.x).toBe(202);
  });

  it("spans the guide over every box on the same line", () => {
    const top: Box = { x: 200, y: 0, w: 100, h: 40 };
    const bottom: Box = { x: 200, y: 500, w: 100, h: 40 };
    const result = computeSnap({ ...CARD, x: 202, y: 200 }, [top, bottom]);
    const guide = result.guides.find((g) => g.axis === "x");
    expect(guide).toMatchObject({ start: 0, end: 540 });
  });

  it("honours a caller's threshold, so the pull is constant on screen at any zoom", () => {
    const other: Box = { x: 200, y: 0, w: 100, h: 40 };
    const zoomedOut = computeSnap({ ...CARD, x: 220, y: 0 }, [other], 6 / 0.25);
    expect(zoomedOut.x).toBe(200);
  });

  it("keeps the first candidate on a tie, so a settled snap never flips", () => {
    // Two boxes two units either side of the dragged left edge: equal pull.
    const a: Box = { x: 98, y: 0, w: 100, h: 40 };
    const b: Box = { x: 102, y: 0, w: 100, h: 40 };
    expect(computeSnap({ ...CARD, x: 100, y: 300 }, [a, b]).x).toBe(98);
  });
});

describe("snapShape", () => {
  const held = { id: "held", x: 204, y: 0, w: 100, h: 40 };
  const other = { id: "other", x: 200, y: 300, w: 100, h: 40 };

  it("returns the shapes untouched when nothing is held", () => {
    expect(snapShape([other], null, 1)).toEqual({ shapes: [other], guides: [] });
  });

  it("moves the held shape onto its neighbour and reports the guide", () => {
    const { shapes, guides } = snapShape([held, other], held, 1);
    expect(shapes[0].x).toBe(200);
    expect(guides).toHaveLength(1);
    expect(guides[0].axis).toBe("x");
  });

  it("does not snap a shape that sits inside a container", () => {
    const child = { ...held, parentId: "frame" };
    const { shapes, guides } = snapShape([child, other], child, 1);
    expect(shapes[0].x).toBe(204);
    expect(guides).toEqual([]);
  });
});
