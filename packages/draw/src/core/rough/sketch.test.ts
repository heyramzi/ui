import { describe, expect, it } from "vitest";
import {
  isSketchAccent,
  registerAccent,
  roughArrow,
  roughCard,
  roughEllipse,
  roughRect,
  roughUnderline,
  seedFrom,
  sketchColors,
  SKETCH_ACCENTS,
} from "./sketch";

describe("sketch palette", () => {
  it("falls back to ink for an unknown or missing accent", () => {
    expect(sketchColors("chartreuse")).toEqual(sketchColors("ink"));
    expect(sketchColors(undefined)).toEqual(sketchColors("ink"));
  });

  it("recognises only the accents it can paint", () => {
    expect(isSketchAccent("red")).toBe(true);
    expect(isSketchAccent("puce")).toBe(false);
    expect(isSketchAccent(7)).toBe(false);
  });

  it("ships exactly the built-in accents", () => {
    expect(SKETCH_ACCENTS).toEqual(["ink", "red", "green", "blue", "violet", "amber", "teal"]);
  });
});

describe("registerAccent", () => {
  const light = { stroke: "#111111", fill: "#eeeeee", heading: "#111111", body: "#222222" };
  const dark = { stroke: "#ffffff", fill: "#000000", heading: "#ffffff", body: "#cccccc" };

  it("makes a new accent paintable in both palettes", () => {
    registerAccent("graphite", light, dark);
    expect(isSketchAccent("graphite")).toBe(true);
    expect(sketchColors("graphite")).toEqual(light);
    expect(sketchColors("graphite", true)).toEqual(dark);
  });

  it("uses the light colors for the dark palette when none are given", () => {
    registerAccent("slate", light);
    expect(sketchColors("slate", true)).toEqual(light);
  });

  it("keeps a copy, so a later mutation of the passed object does not leak in", () => {
    const mutable = { ...light };
    registerAccent("cobalt", mutable);
    mutable.stroke = "#ff0000";
    expect(sketchColors("cobalt").stroke).toBe("#111111");
  });
});

describe("seedFrom", () => {
  it("is stable for the same id", () => {
    expect(seedFrom("rung-install")).toBe(seedFrom("rung-install"));
  });

  it("separates ids that differ by one character", () => {
    expect(seedFrom("card-1")).not.toBe(seedFrom("card-2"));
  });

  it("stays a non-negative 31-bit integer, including for an empty id", () => {
    for (const id of ["", "a", "a very long shape id ".repeat(20)]) {
      const seed = seedFrom(id);
      expect(Number.isInteger(seed)).toBe(true);
      expect(seed).toBeGreaterThanOrEqual(0);
      expect(seed).toBeLessThan(2147483647);
    }
  });
});

describe("rough geometry", () => {
  const colors = sketchColors("red");

  // The whole reason seeds exist: a card that redraws on every render visibly
  // shimmers on a canvas that streams in from a server.
  it("draws the identical card for the same seed", () => {
    expect(roughCard(300, 120, { seed: 42, colors })).toEqual(
      roughCard(300, 120, { seed: 42, colors }),
    );
  });

  it("draws a different card for a different seed", () => {
    expect(roughCard(300, 120, { seed: 42, colors })).not.toEqual(
      roughCard(300, 120, { seed: 43, colors }),
    );
  });

  it("fills a card and leaves an annotation hollow", () => {
    const card = roughCard(300, 120, { seed: 1, colors });
    const ellipse = roughEllipse(300, 120, { seed: 1, colors });
    expect(card.some((p) => p.fill !== "none")).toBe(true);
    expect(ellipse.every((p) => p.fill === "none")).toBe(true);
  });

  it("never emits an undefined fill, which renders as black", () => {
    for (const path of [
      ...roughCard(200, 80, { seed: 3, colors }),
      ...roughEllipse(200, 80, { seed: 3, colors }),
      ...roughRect(200, 80, { seed: 3, colors }, { filled: true }),
    ]) {
      expect(typeof path.fill).toBe("string");
      expect(path.d.length).toBeGreaterThan(0);
    }
  });

  it("survives a card smaller than its own corner radius", () => {
    expect(() => roughCard(4, 4, { seed: 1, colors })).not.toThrow();
    expect(roughCard(4, 4, { seed: 1, colors }).length).toBeGreaterThan(0);
  });

  it("gives an arrow a shaft and two head strokes", () => {
    const paths = roughArrow({ x: 0, y: 0 }, { x: 100, y: 40 }, { seed: 9, colors });
    expect(paths.length).toBeGreaterThanOrEqual(3);
  });

  it("draws a rule and a plain box", () => {
    expect(roughUnderline(120, { seed: 2, colors }).length).toBeGreaterThan(0);
    expect(roughRect(120, 60, { seed: 2, colors }).length).toBeGreaterThan(0);
  });

  it("takes the hand out under the formal style", () => {
    const drawn = roughCard(300, 120, { seed: 5, colors });
    const formal = roughCard(300, 120, { seed: 5, colors }, { formal: true });
    expect(formal).not.toEqual(drawn);
  });
});
