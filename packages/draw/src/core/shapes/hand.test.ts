import { describe, it, expect } from "vitest";
import { penFor, pathsToSvg, localGroup } from "./hand";
import { seedFrom } from "../rough";
import { make } from "./test-fixtures";
import { rectUtil } from "./rect";

describe("penFor", () => {
  it("seeds from the shape id and uses the drawn palette", () => {
    const shape = make(rectUtil, { props: { accent: "green", fill: false, radius: 0 } });
    const pen = penFor(shape, { dark: false, style: "hand" });
    expect(pen.seed).toBe(seedFrom(shape.id));
    expect(pen.colors.stroke).toBe("#2f9e44");
  });
});

describe("pathsToSvg", () => {
  it("renders each path as a path element", () => {
    const svg = pathsToSvg([{ d: "M 0 0 L 1 1", stroke: "#000", fill: "none", strokeWidth: 2 }]);
    expect(svg).toBe(
      '<path d="M 0 0 L 1 1" stroke="#000" fill="none" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>'
    );
  });
});

describe("localGroup", () => {
  it("translates box-local markup onto the page", () => {
    const shape = make(rectUtil, { x: 12, y: 34 });
    expect(localGroup(shape, "<x/>")).toBe('<g transform="translate(12 34)"><x/></g>');
  });
});
