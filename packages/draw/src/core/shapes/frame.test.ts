import { describe, it, expect } from "vitest";
import { frameUtil, type FrameShape } from "./frame";
import { rotatedBoxBounds, boxCenter } from "../math/box";
import { rotate } from "../math/vec";
import { make } from "./test-fixtures";

const fr = (overrides: Partial<Omit<FrameShape, "id" | "index">> = {}) => make(frameUtil, overrides);

describe("frame bounds", () => {
  it("is the box when straight and the rotated box otherwise", () => {
    expect(frameUtil.bounds(fr())).toEqual({ x: 0, y: 0, w: 240, h: 180 });
    const turned = fr({ rotation: Math.PI / 2 });
    expect(frameUtil.bounds(turned)).toEqual(rotatedBoxBounds(turned, turned.rotation));
  });
});

describe("frame hitTest", () => {
  it("hits the outline, never the inside", () => {
    expect(frameUtil.hitTest(fr(), { x: 120, y: 0 }, 1)).toBe(true);
    expect(frameUtil.hitTest(fr(), { x: 120, y: 90 }, 1)).toBe(false);
    expect(frameUtil.hitTest(fr(), { x: 400, y: 90 }, 1)).toBe(false);
  });

  it("accounts for rotation", () => {
    const shape = fr({ rotation: Math.PI / 2 });
    const onEdge = rotate({ x: 120, y: 0 }, boxCenter(shape), shape.rotation);
    expect(frameUtil.hitTest(shape, onEdge, 1)).toBe(true);
    expect(frameUtil.hitTest(shape, { x: 120, y: 0 }, 1)).toBe(false);
  });
});

describe("frame resize", () => {
  it("returns only the changed size fields", () => {
    expect(frameUtil.resize(fr(), "se", { x: 0, y: 0, w: 300, h: 200 })).toEqual({
      w: 300,
      h: 200,
    });
  });
});
