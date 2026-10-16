import { describe, it, expect } from "vitest";
import {
  freehandUtil,
  addPoint,
  finish,
  outline,
  type FreehandPoint,
  type FreehandShape,
} from "./freehand";
import { rotatedBoxBounds, boxCenter } from "../math/box";
import { rotate } from "../math/vec";
import { make } from "./test-fixtures";

const pts = (list: [number, number, number?][]): FreehandPoint[] =>
  list.map(([x, y, pressure = 0.5]) => ({ x, y, pressure }));

const fh = (points: FreehandPoint[], overrides: Partial<Omit<FreehandShape, "id" | "index">> = {}) =>
  make(freehandUtil, { props: { accent: "ink", points, size: 6 }, ...overrides });

const uShape: FreehandPoint[] = [
  { x: 0, y: 0, pressure: 0.5 },
  { x: 60, y: 80, pressure: 0.5 },
  { x: 120, y: 0, pressure: 0.5 },
];
const uBox = { w: 120, h: 80 };

describe("freehand bounds", () => {
  it("is the box when straight and the rotated box otherwise", () => {
    expect(freehandUtil.bounds(fh(uShape, uBox))).toEqual({ x: 0, y: 0, w: 120, h: 80 });
    const turned = fh(uShape, { ...uBox, rotation: Math.PI / 2 });
    expect(freehandUtil.bounds(turned)).toEqual(rotatedBoxBounds(turned, turned.rotation));
  });
});

describe("freehand hitTest", () => {
  it("hits the stroke but not the empty middle of the box", () => {
    const shape = fh(uShape, uBox);
    expect(freehandUtil.hitTest(shape, { x: 0, y: 0 }, 2)).toBe(true);
    expect(freehandUtil.hitTest(shape, { x: 60, y: 80 }, 2)).toBe(true);
    expect(freehandUtil.hitTest(shape, { x: 60, y: 10 }, 2)).toBe(false);
    expect(freehandUtil.hitTest(shape, { x: 300, y: 10 }, 2)).toBe(false);
  });

  it("accounts for rotation", () => {
    const shape = fh(uShape, { rotation: Math.PI / 2 });
    const onStroke = rotate({ x: 0, y: 0 }, boxCenter(shape), shape.rotation);
    expect(freehandUtil.hitTest(shape, onStroke, 2)).toBe(true);
    expect(freehandUtil.hitTest(shape, { x: 60, y: 10 }, 2)).toBe(false);
  });
});

describe("freehand resize", () => {
  it("scales the points with the box", () => {
    const shape = fh(
      [
        { x: 0, y: 0, pressure: 0.5 },
        { x: 120, y: 80, pressure: 0.5 },
      ],
      { w: 120, h: 80 }
    );
    const patch = freehandUtil.resize(shape, "se", { x: 0, y: 0, w: 240, h: 160 });
    expect(patch.props?.points).toEqual([
      { x: 0, y: 0, pressure: 0.5 },
      { x: 240, y: 160, pressure: 0.5 },
    ]);
  });
});

describe("freehand build", () => {
  it("grows the box as points are added, keeping them box-relative", () => {
    let shape = fh([]);
    shape = addPoint(shape, { x: 5, y: 5, pressure: 0.5 });
    expect({ x: shape.x, y: shape.y, w: shape.w, h: shape.h }).toEqual({ x: 5, y: 5, w: 0, h: 0 });
    shape = addPoint(shape, { x: 15, y: 5, pressure: 0.5 });
    expect({ x: shape.x, y: shape.y, w: shape.w, h: shape.h }).toEqual({
      x: 5,
      y: 5,
      w: 10,
      h: 0,
    });
    expect(shape.props.points).toEqual([
      { x: 0, y: 0, pressure: 0.5 },
      { x: 10, y: 0, pressure: 0.5 },
    ]);
  });

  it("simplifies and fits the box on finish", () => {
    const shape = fh(pts([[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]]));
    const done = finish(shape);
    expect(done.props.points.length).toBe(2);
    expect(done.w).toBe(5);
    expect(done.h).toBe(0);
  });
});

describe("freehand stroke width", () => {
  const heightOf = (points: number[][]) => {
    const ys = points.map((p) => p[1]);
    return Math.max(...ys) - Math.min(...ys);
  };
  const thicknessAt = (points: number[][], x: number) => {
    const ys = points.filter((p) => Math.abs(p[0] - x) <= 6).map((p) => p[1]);
    return Math.max(...ys) - Math.min(...ys);
  };

  it("keeps a constant-pressure stroke at a constant width", () => {
    const points = outline(fh(pts([[0, 0, 0.5], [50, 0, 0.5], [100, 0, 0.5]])));
    const at30 = thicknessAt(points, 30);
    const at70 = thicknessAt(points, 70);
    expect(Math.abs(at30 - at70)).toBeLessThan(1);
  });

  it("honours pressure when it changes", () => {
    const thin = outline(fh(pts([[0, 0, 0.1], [50, 0, 0.1], [100, 0, 0.1]])));
    const thick = outline(fh(pts([[0, 0, 1], [50, 0, 1], [100, 0, 1]])));
    expect(heightOf(thin)).toBeLessThan(heightOf(thick));
  });
});

describe("freehand toSvg", () => {
  it("draws the stroke outline as a filled path", () => {
    const svg = freehandUtil.toSvg(fh(uShape), { dark: false, style: "clean" });
    expect(svg).toContain("<path");
  });

  it("draws nothing for an empty stroke", () => {
    expect(freehandUtil.toSvg(fh([]), { dark: false, style: "clean" })).toBe("");
  });
});
