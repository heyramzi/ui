import { describe, it, expect } from "vitest";
import { shapeColors, DEFAULT_ACCENT } from "./style";

describe("shapeColors", () => {
  it("returns the accent's colours", () => {
    expect(shapeColors("blue", false).stroke).toBe("#1971c2");
  });

  it("falls back to ink for a missing or unknown accent", () => {
    expect(shapeColors(undefined, false)).toEqual(shapeColors(DEFAULT_ACCENT, false));
    expect(shapeColors("nope", false)).toEqual(shapeColors(DEFAULT_ACCENT, false));
  });

  it("lifts the palette for dark", () => {
    expect(shapeColors("ink", true).stroke).toBe("#e9ecef");
  });
});
