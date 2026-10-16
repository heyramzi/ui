import { describe, expect, it } from "vitest";
import type { Box } from "../types";
import { alignBoxesHorizontally, alignBoxesVertically } from "./alignment";

function box(x: number, y: number): Box {
  return { x, y, w: 100, h: 40 };
}

describe("alignBoxesHorizontally", () => {
  it("sets all boxes to the topmost y", () => {
    const boxes = [box(0, 100), box(50, 50), box(100, 200)];
    alignBoxesHorizontally(boxes);
    expect(boxes.map((b) => b.y)).toEqual([50, 50, 50]);
  });

  it("preserves x positions", () => {
    const boxes = [box(10, 100), box(200, 50)];
    alignBoxesHorizontally(boxes);
    expect(boxes[0].x).toBe(10);
    expect(boxes[1].x).toBe(200);
  });

  it("does nothing for fewer than 2 boxes", () => {
    const single = [box(5, 99)];
    alignBoxesHorizontally(single);
    expect(single[0].y).toBe(99);
  });
});

describe("alignBoxesVertically", () => {
  it("sets all boxes to the leftmost x", () => {
    const boxes = [box(100, 0), box(50, 50), box(200, 100)];
    alignBoxesVertically(boxes);
    expect(boxes.map((b) => b.x)).toEqual([50, 50, 50]);
  });

  it("preserves y positions", () => {
    const boxes = [box(100, 10), box(50, 200)];
    alignBoxesVertically(boxes);
    expect(boxes[0].y).toBe(10);
    expect(boxes[1].y).toBe(200);
  });

  it("does nothing for fewer than 2 boxes", () => {
    const single = [box(99, 5)];
    alignBoxesVertically(single);
    expect(single[0].x).toBe(99);
  });
});
