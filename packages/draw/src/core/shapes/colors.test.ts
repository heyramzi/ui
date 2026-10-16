import { describe, it, expect } from "vitest";
import { accentOf, strokeColor, fillColor, textColor } from "./colors";
import { make } from "./test-fixtures";
import { rectUtil } from "./rect";
import { sketchColors } from "../rough";

describe("accentOf", () => {
  it("returns a string accent and undefined otherwise", () => {
    expect(accentOf(make(rectUtil, { props: { accent: "blue", fill: false, radius: 0 } }))).toBe(
      "blue"
    );
    expect(accentOf(make(rectUtil, { props: { fill: false, radius: 0 } }))).toBeUndefined();
  });
});

describe("style colours", () => {
  const shape = make(rectUtil, { props: { accent: "red", fill: true, radius: 0 } });

  it("uses the plain palette for clean", () => {
    expect(strokeColor(shape, { dark: false, style: "clean" })).toBe("#c92a2a");
    expect(fillColor(shape, { dark: false, style: "clean" })).toBe("#fff5f5");
  });

  it("uses the drawn palette for hand", () => {
    const drawn = sketchColors("red", false);
    expect(strokeColor(shape, { dark: false, style: "hand" })).toBe(drawn.stroke);
    expect(textColor(shape, { dark: false, style: "hand" })).toBe(drawn.heading);
  });

  it("lifts the palette for a dark canvas", () => {
    expect(strokeColor(shape, { dark: true, style: "clean" })).toBe("#ff8787");
  });
});
