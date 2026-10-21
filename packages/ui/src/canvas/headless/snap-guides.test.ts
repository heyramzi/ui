import { describe, expect, it } from "vite-plus/test";
import { computeSnap, SNAP_THRESHOLD, type SnapRect } from "#src/canvas/headless/snap-guides.js";

const CARD: SnapRect = { x: 0, y: 0, width: 100, height: 40 };

describe("computeSnap", () => {
  it("leaves a lone card where it is", () => {
    const result = computeSnap({ ...CARD, x: 33, y: 71 }, []);
    expect(result).toEqual({ x: 33, y: 71, guides: [] });
  });

  it("pulls a left edge onto another card's left edge", () => {
    const other: SnapRect = { x: 200, y: 300, width: 100, height: 40 };
    const result = computeSnap({ ...CARD, x: 204, y: 0 }, [other]);
    expect(result.x).toBe(200);
    expect(result.guides.some((g) => g.axis === "x" && g.position === 200)).toBe(true);
  });

  it("pulls a centre onto another card's centre", () => {
    const other: SnapRect = { x: 200, y: 300, width: 100, height: 40 };
    // Centre at 253 wants 250: the dragged card's own centre is x + 50.
    const result = computeSnap({ ...CARD, x: 203, y: 0 }, [other]);
    expect(result.x + 50).toBe(250);
  });

  it("snaps both axes independently", () => {
    const other: SnapRect = { x: 200, y: 300, width: 100, height: 40 };
    const result = computeSnap({ ...CARD, x: 202, y: 298 }, [other]);
    expect(result).toMatchObject({ x: 200, y: 300 });
    expect(result.guides).toHaveLength(2);
  });

  it("ignores a candidate further away than the threshold", () => {
    const other: SnapRect = { x: 200, y: 300, width: 100, height: 40 };
    const away = SNAP_THRESHOLD + 1;
    const result = computeSnap({ ...CARD, x: 200 + away, y: 0 }, [other]);
    expect(result.x).toBe(200 + away);
    expect(result.guides.filter((g) => g.axis === "x")).toHaveLength(0);
  });

  it("takes the nearest line when several are in range", () => {
    const near: SnapRect = { x: 202, y: 300, width: 100, height: 40 };
    const far: SnapRect = { x: 205, y: 300, width: 100, height: 40 };
    const result = computeSnap({ ...CARD, x: 203, y: 0 }, [near, far]);
    expect(result.x).toBe(202);
  });

  it("spans the guide over every card on the same line", () => {
    const top: SnapRect = { x: 200, y: 0, width: 100, height: 40 };
    const bottom: SnapRect = { x: 200, y: 500, width: 100, height: 40 };
    const result = computeSnap({ ...CARD, x: 202, y: 200 }, [top, bottom]);
    const guide = result.guides.find((g) => g.axis === "x");
    expect(guide).toMatchObject({ start: 0, end: 540 });
  });

  it("honours a caller's threshold, so the pull is constant on screen at any zoom", () => {
    const other: SnapRect = { x: 200, y: 0, width: 100, height: 40 };
    const zoomedOut = computeSnap({ ...CARD, x: 220, y: 0 }, [other], 6 / 0.25);
    expect(zoomedOut.x).toBe(200);
  });
});
