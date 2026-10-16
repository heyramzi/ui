import { describe, it, expect } from "vitest";
import { nodeUtil, type NodeShape } from "./node";
import { boxCenter, rotatedBoxBounds } from "../math/box";
import { rotate } from "../math/vec";
import { make } from "./test-fixtures";

const box = (overrides: Partial<Omit<NodeShape, "id" | "index">> = {}) =>
  make(nodeUtil, overrides);

const props = (overrides: Partial<NodeShape["props"]> = {}) => ({
  kind: "card",
  data: {},
  accent: "ink",
  ...overrides,
});

describe("node defaults", () => {
  it("is a 200 by 120 box with a kind and empty data", () => {
    const shape = nodeUtil.defaults();
    expect(shape.w).toBe(200);
    expect(shape.h).toBe(120);
    expect(shape.props).toEqual({ kind: "node", data: {}, accent: "ink" });
  });
});

describe("node bounds", () => {
  it("is the shape box when straight", () => {
    expect(nodeUtil.bounds(box())).toEqual({ x: 0, y: 0, w: 200, h: 120 });
  });

  it("swaps extents at a quarter turn", () => {
    const shape = box({ rotation: Math.PI / 2 });
    expect(nodeUtil.bounds(shape)).toEqual(rotatedBoxBounds(shape, shape.rotation));
    expect(nodeUtil.bounds(shape).w).toBeCloseTo(120, 10);
    expect(nodeUtil.bounds(shape).h).toBeCloseTo(200, 10);
  });
});

describe("node hitTest", () => {
  it("hits inside and on the edge, not outside", () => {
    expect(nodeUtil.hitTest(box(), { x: 100, y: 60 }, 0)).toBe(true);
    expect(nodeUtil.hitTest(box(), { x: 0, y: 0 }, 0)).toBe(true);
    expect(nodeUtil.hitTest(box(), { x: 200, y: 60 }, 0)).toBe(true);
    expect(nodeUtil.hitTest(box(), { x: 240, y: 60 }, 0)).toBe(false);
  });

  it("grows with the margin", () => {
    expect(nodeUtil.hitTest(box(), { x: 210, y: 60 }, 0)).toBe(false);
    expect(nodeUtil.hitTest(box(), { x: 210, y: 60 }, 12)).toBe(true);
  });

  it("accounts for rotation", () => {
    const shape = box({ w: 200, h: 40, rotation: Math.PI / 2, props: props() });
    expect(nodeUtil.hitTest(shape, { x: 100, y: 100 }, 0.5)).toBe(true);
    expect(nodeUtil.hitTest(shape, { x: 300, y: 20 }, 0.5)).toBe(false);
  });
});

describe("node resize", () => {
  it("returns only the changed size fields for a corner drag", () => {
    const shape = box();
    expect(nodeUtil.resize(shape, "se", { x: 0, y: 0, w: 300, h: 200 })).toEqual({
      w: 300,
      h: 200,
    });
  });

  it("keeps the opposite corner fixed when unrotated", () => {
    const shape = box();
    const patch = nodeUtil.resize(shape, "nw", { x: 20, y: 30, w: 100, h: 50 });
    const resized = { ...shape, ...patch };
    expect(resized.x + resized.w).toBe(shape.x + shape.w);
    expect(resized.y + resized.h).toBe(shape.y + shape.h);
  });

  it("keeps the far corner fixed in page space when rotated", () => {
    const shape = box({ x: 10, y: 20, w: 200, h: 120, rotation: Math.PI / 6 });
    const anchorBefore = rotate({ x: shape.x, y: shape.y }, boxCenter(shape), shape.rotation);
    const patch = nodeUtil.resize(shape, "se", { x: 0, y: 0, w: 320, h: 240 });
    const resized = { ...shape, ...patch };
    const anchorAfter = rotate(
      { x: resized.x, y: resized.y },
      boxCenter(resized),
      resized.rotation
    );
    expect(anchorAfter.x).toBeCloseTo(anchorBefore.x, 9);
    expect(anchorAfter.y).toBeCloseTo(anchorBefore.y, 9);
  });
});

describe("node toSvg", () => {
  it("draws a rounded rect with the kind as a centered label", () => {
    const svg = nodeUtil.toSvg(box({ props: props({ kind: "stat" }) }), {
      dark: false,
      style: "clean",
    });
    expect(svg).toContain("<rect");
    expect(svg).toContain('rx="8"');
    expect(svg).toContain(">stat</text>");
  });

  it("escapes the kind so a server export stays valid", () => {
    const svg = nodeUtil.toSvg(box({ props: props({ kind: "a & b" }) }), {
      dark: false,
      style: "hand",
    });
    expect(svg).toContain(">a &amp; b</text>");
  });
});
