import { describe, expect, it } from "vitest";
import { hoverBand } from "#src/charts/hover-band.js";

const center = (b: { x: number; width: number } | null) => (b ? b.x + b.width / 2 : NaN);

describe("hoverBand", () => {
  it("centers on the point when the gaps are even", () => {
    expect(hoverBand([0, 100, 200], 1, 300)).toEqual({ x: 20, width: 160 });
  });

  it("stays centered when the gaps differ", () => {
    const b = hoverBand([0, 40, 200], 1, 300);
    expect(center(b)).toBe(40);
    expect(b?.width).toBe(64);
  });

  it("stays centered at either end of the line", () => {
    expect(center(hoverBand([0, 100, 200], 0, 300))).toBe(0);
    expect(center(hoverBand([0, 100, 200], 2, 300))).toBe(200);
  });

  it("falls back to the plot width for a single point", () => {
    expect(hoverBand([50], 0, 100)).toEqual({ x: -30, width: 160 });
  });

  it("returns null for an index off the data", () => {
    expect(hoverBand([0, 100], -1, 300)).toBeNull();
    expect(hoverBand([0, 100], 2, 300)).toBeNull();
  });
});
