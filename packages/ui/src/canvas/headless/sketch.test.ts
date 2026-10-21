import { describe, expect, it } from "vite-plus/test";
import {
  isSketchAccent,
  roughArrow,
  roughHead,
  roughLine,
  roughCard,
  roughEllipse,
  seedFrom,
  sketchColors,
} from "#src/canvas/headless/sketch.js";

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
});

describe("seedFrom", () => {
  it("is stable for the same id", () => {
    expect(seedFrom("rung-install")).toBe(seedFrom("rung-install"));
  });

  it("separates ids that differ by one character", () => {
    expect(seedFrom("card-1")).not.toBe(seedFrom("card-2"));
  });

  it("stays a non-negative 31-bit integer, including for an empty id", () => {
    for (const id of ["", "a", "a very long node id ".repeat(20)]) {
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
  // shimmers on a canvas that streams in from the CLI.
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

  it("hands back the same drawing for the same geometry, and a new one when it moves", () => {
    const pen = { seed: 21, colors };
    const first = roughLine({ x: 0, y: 0 }, { x: 80, y: 30 }, pen);
    expect(roughLine({ x: 0, y: 0 }, { x: 80, y: 30 }, pen)).toBe(first);
    expect(roughLine({ x: 0, y: 0 }, { x: 80, y: 31 }, pen)).not.toBe(first);
    expect(roughLine({ x: 0, y: 0 }, { x: 80, y: 30 }, pen, { formal: true })).not.toBe(first);
    const head = roughHead({ x: 80, y: 30 }, 0.5, pen);
    expect(roughHead({ x: 80, y: 30 }, 0.5, pen)).toBe(head);
    expect(roughHead({ x: 80, y: 30 }, 0.6, pen)).not.toBe(head);
  });
});
