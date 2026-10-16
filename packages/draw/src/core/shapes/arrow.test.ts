import { describe, it, expect } from "vitest";
import {
  arrowUtil,
  arrowCurve,
  arrowStrokes,
  fitArrowEnds,
  type ArrowProps,
  type ArrowShape,
} from "./arrow";
import { rotate } from "../math/vec";
import { boxCenter, rotatedBoxBounds } from "../math/box";
import { make } from "./test-fixtures";

const props = (overrides: Partial<ArrowProps> = {}): ArrowProps => ({
  start: { x: 0, y: 0 },
  end: { x: 100, y: 100 },
  bend: 0,
  startHead: "none",
  endHead: "arrow",
  color: "ink",
  ...overrides,
});

const arrow = (overrides: Partial<Omit<ArrowShape, "id" | "index">> = {}) =>
  make(arrowUtil, { w: 100, h: 100, props: props(), ...overrides });

describe("arrow curve", () => {
  it("is a straight pair of points when unbent", () => {
    expect(arrowCurve({ x: 0, y: 0 }, { x: 100, y: 0 }, 0)).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ]);
  });

  it("crosses the line by `bend` at its middle", () => {
    const curve = arrowCurve({ x: 0, y: 0 }, { x: 100, y: 0 }, 20, 2);
    expect(curve[1].x).toBeCloseTo(50, 9);
    expect(curve[1].y).toBeCloseTo(20, 9);
    expect(arrowCurve({ x: 0, y: 0 }, { x: 100, y: 0 }, -20, 2)[1].y).toBeCloseTo(-20, 9);
  });
});

describe("arrow bounds", () => {
  it("is the endpoint box, and the rotated box once turned", () => {
    const shape = arrow({ x: 10, y: 20 });
    expect(arrowUtil.bounds(shape)).toEqual({ x: 10, y: 20, w: 100, h: 100 });
    const turned = arrow({ rotation: Math.PI / 3 });
    expect(arrowUtil.bounds(turned)).toEqual(rotatedBoxBounds(turned, turned.rotation));
  });
});

describe("arrow hitTest", () => {
  it("hits on the shaft, not beside it", () => {
    const shape = arrow();
    expect(arrowUtil.hitTest(shape, { x: 50, y: 50 }, 1)).toBe(true);
    expect(arrowUtil.hitTest(shape, { x: 0, y: 0 }, 1)).toBe(true);
    expect(arrowUtil.hitTest(shape, { x: 80, y: 20 }, 1)).toBe(false);
  });

  it("follows the bow when bent", () => {
    const shape = arrow({ props: props({ bend: 40 }) });
    const middle = arrowCurve(shape.props.start, shape.props.end, 40)[12];
    expect(arrowUtil.hitTest(shape, { x: middle.x, y: middle.y }, 1)).toBe(true);
    expect(arrowUtil.hitTest(shape, { x: 50, y: 50 }, 1)).toBe(false);
  });

  it("accounts for rotation", () => {
    const shape = arrow({ rotation: Math.PI / 2 });
    const onLine = rotate({ x: 25, y: 25 }, boxCenter(shape), shape.rotation);
    expect(arrowUtil.hitTest(shape, onLine, 1)).toBe(true);
    expect(arrowUtil.hitTest(shape, { x: 25, y: 25 }, 1)).toBe(false);
  });
});

describe("arrow resize", () => {
  it("scales the endpoints and the bow with the box", () => {
    const shape = arrow({ props: props({ bend: 10 }) });
    const patch = arrowUtil.resize(shape, "se", { x: 0, y: 0, w: 200, h: 200 });
    expect(patch.w).toBe(200);
    expect(patch.h).toBe(200);
    expect(patch.props?.start).toEqual({ x: 0, y: 0 });
    expect(patch.props?.end).toEqual({ x: 200, y: 200 });
    expect(patch.props?.bend).toBe(20);
  });
});

describe("arrow strokes", () => {
  it("adds two head strokes when a head is drawn", () => {
    expect(arrowStrokes(arrow()).length).toBe(3);
    expect(arrowStrokes(arrow({ props: props({ endHead: "none" }) })).length).toBe(1);
    expect(arrowStrokes(arrow({ props: props({ startHead: "arrow" }) })).length).toBe(5);
  });
});

describe("arrow toSvg", () => {
  it("draws a path per stroke, with a head", () => {
    const svg = arrowUtil.toSvg(arrow(), { dark: false, style: "clean" });
    expect((svg.match(/M /g) ?? []).length).toBe(3);
    expect(svg).toContain("stroke-linejoin");
  });

  it("draws a bow when bent", () => {
    const straight = arrowUtil.toSvg(arrow(), { dark: false, style: "clean" });
    const bent = arrowUtil.toSvg(arrow({ props: props({ bend: 30 }) }), {
      dark: false,
      style: "clean",
    });
    expect(bent).not.toBe(straight);
    expect(bent.match(/L /g)?.length ?? 0).toBeGreaterThan(2);
  });

  it("wobbles the hand style apart from the clean one", () => {
    const shape = arrow();
    const clean = arrowUtil.toSvg(shape, { dark: false, style: "clean" });
    const hand = arrowUtil.toSvg(shape, { dark: false, style: "hand" });
    expect(hand).not.toBe(clean);
    expect(hand).toContain("<path");
  });
});

describe("fitArrowEnds", () => {
  it("puts the box around the two page endpoints", () => {
    const patch = fitArrowEnds(arrow(), { x: 100, y: 50 }, { x: 200, y: 150 });
    expect(patch.x).toBe(100);
    expect(patch.y).toBe(50);
    expect(patch.w).toBe(100);
    expect(patch.h).toBe(100);
    expect(patch.props?.start).toEqual({ x: 0, y: 0 });
    expect(patch.props?.end).toEqual({ x: 100, y: 100 });
  });
});
