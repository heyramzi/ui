import { describe, expect, it } from "vitest";
import { peaksOf } from "#src/ui/peaks.js";

describe("peaksOf", () => {
  it("makes 100 peaks a second and keeps the loudest sample of each slice", () => {
    const data = new Float32Array(4000);
    data[8] = 0.5;
    data[3988] = -0.9;
    const peaks = peaksOf(data, 2);
    expect(peaks).toHaveLength(200);
    expect(Math.max(...peaks)).toBeCloseTo(0.9);
    expect(peaks[0]).toBeGreaterThan(0);
  });
  it("copes with silence and tiny clips", () => {
    expect(peaksOf(new Float32Array(10), 0.001)).toHaveLength(1);
  });
});
