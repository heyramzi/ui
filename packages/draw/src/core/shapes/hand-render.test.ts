import { describe, it, expect } from "vitest";
import type { ShapeRecord, ShapeUtil } from "../types";
import {
  rectUtil,
  ellipseUtil,
  diamondUtil,
  lineUtil,
  textUtil,
  noteUtil,
  frameUtil,
  imageUtil,
  freehandUtil,
} from "./index";
import { make } from "./test-fixtures";

const utils: ShapeUtil[] = [
  rectUtil,
  ellipseUtil,
  diamondUtil,
  lineUtil,
  textUtil,
  noteUtil,
  frameUtil,
  imageUtil,
  freehandUtil,
];

function handShape(util: ShapeUtil): ShapeRecord {
  const shape = make(util);
  if (util.type === "freehand") {
    return {
      ...shape,
      w: 50,
      h: 30,
      props: {
        accent: "ink",
        size: 4,
        points: [
          { x: 0, y: 0, pressure: 0.5 },
          { x: 50, y: 30, pressure: 0.5 },
        ],
      },
    };
  }
  if (util.type === "text") {
    return { ...shape, props: { ...shape.props, text: "hello" } };
  }
  return shape;
}

describe("hand style rendering", () => {
  it("produces markup for every built-in shape", () => {
    for (const util of utils) {
      const svg = util.toSvg(handShape(util), { dark: false, style: "hand" });
      expect(svg.length, `${util.type} hand svg`).toBeGreaterThan(0);
    }
  });

  it("draws a rect through the rough module in hand style", () => {
    const hand = rectUtil.toSvg(make(rectUtil), { dark: false, style: "hand" });
    const clean = rectUtil.toSvg(make(rectUtil), { dark: false, style: "clean" });
    expect(hand).toContain("<path");
    expect(clean).toContain("<rect");
    expect(clean).not.toContain("<path");
  });

  it("keeps the wobble stable for one shape id", () => {
    const shape = make(rectUtil);
    expect(rectUtil.toSvg(shape, { dark: false, style: "hand" })).toBe(
      rectUtil.toSvg(shape, { dark: false, style: "hand" })
    );
  });
});
