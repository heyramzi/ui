import { describe, expect, it } from "vite-plus/test";
import { dualAxis, niceStep } from "#src/charts/dual-axis.js";

describe("niceStep", () => {
  it("rounds up to 1, 2, 2.5 or 5 times a power of ten", () => {
    expect(niceStep(40)).toBe(50);
    expect(niceStep(1500)).toBe(2000);
    expect(niceStep(2100)).toBe(2500);
    expect(niceStep(0.3)).toBeCloseTo(0.5);
    expect(niceStep(0)).toBe(1);
  });
});

describe("dualAxis", () => {
  it("gives clicks and impressions the same number of grid lines", () => {
    const { left, right } = dualAxis(160, 6000);
    expect(left).toEqual({ max: 200, ticks: [0, 50, 100, 150, 200] });
    expect(right).toEqual({ max: 8000, ticks: [0, 2000, 4000, 6000, 8000] });
  });

  it("keeps every point inside both domains", () => {
    for (const [l, r] of [
      [7, 9_999],
      [123_456, 3],
      [1, 1],
      [0.42, 87],
    ]) {
      const { left, right } = dualAxis(l, r);
      expect(left.max).toBeGreaterThanOrEqual(l);
      expect(right.max).toBeGreaterThanOrEqual(r);
      expect(left.ticks.length).toBe(right.ticks.length);
    }
  });

  it("draws one interval for an empty series instead of dividing by zero", () => {
    const { left, right } = dualAxis(0, 0);
    expect(left.ticks).toEqual([0, 1]);
    expect(right.ticks).toEqual([0, 1]);
  });
});
