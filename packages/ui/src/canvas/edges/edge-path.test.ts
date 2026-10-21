import { describe, expect, it } from "vite-plus/test";
import { Position } from "@xyflow/svelte";
import { arrowTips, routeEdgePath } from "#src/canvas/edges/edge-path.js";

const geometry = {
  sourceX: 0,
  sourceY: 0,
  targetX: 200,
  targetY: 100,
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
};

describe("routeEdgePath", () => {
  it("draws a straight link as one segment", () => {
    expect(routeEdgePath("straight", geometry, null).path).toBe("M 0,0L 200,100");
  });

  it("draws a curve with a cubic", () => {
    expect(routeEdgePath("curved", geometry, null).path).toContain("C");
  });

  it("draws an elbow with right angles", () => {
    const { path } = routeEdgePath("elbow", geometry, null);
    expect(path).toContain("L");
    expect(path).not.toContain("C");
  });

  it("detours a same-side pair past both cards", () => {
    const anchors = {
      source: { x: 100, y: 0, side: "right" as const },
      target: { x: 100, y: 120, side: "right" as const },
    };
    const { path, labelX } = routeEdgePath(
      "elbow",
      { ...geometry, sourceX: 100, targetX: 100, targetY: 120 },
      anchors,
    );
    expect(labelX).toBe(140);
    expect(path.startsWith("M 100 0")).toBe(true);
  });
});

describe("arrowTips", () => {
  it("points a straight link's heads along the line", () => {
    const tips = arrowTips("straight", { ...geometry, targetY: 0 }, null);
    expect(tips.end.angle).toBeCloseTo(0);
    expect(tips.start.angle).toBeCloseTo(Math.PI);
  });

  it("meets a box square on", () => {
    const anchors = {
      source: { x: 0, y: 0, side: "right" as const },
      target: { x: 200, y: 100, side: "top" as const },
    };
    expect(arrowTips("elbow", geometry, anchors).end.angle).toBeCloseTo(Math.PI / 2);
  });
});
