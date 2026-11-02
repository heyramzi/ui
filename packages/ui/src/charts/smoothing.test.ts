import { describe, expect, it } from "vite-plus/test";
import { averageTo, smoothSeries } from "#src/charts/smoothing.js";

type Row = { date: string; value: number | null };

/** `values.length` days ending 2026-10-31, oldest first. */
function days(values: (number | null)[]): Row[] {
  const end = Date.UTC(2026, 9, 31);
  return values.map((value, i) => ({
    date: new Date(end - (values.length - 1 - i) * 86_400_000).toISOString().slice(0, 10),
    value,
  }));
}

const smooth = (rows: Row[], rangeDays: number, kind: "count" | "level" = "count") =>
  smoothSeries(rows, "date", ["value"], { rangeDays, kind });

describe("smoothSeries, a missing day", () => {
  it("is left out of the 7-day average, not counted as 0", () => {
    const rows = days([10, 10, 10, 10, null, 10, 10, 10, 10, 10]);
    const values = smooth(rows, 90).points.map((p) => p.value);
    expect(values.every((v) => v === 10)).toBe(true);
  });

  it("draws a gap where most of the window was never measured", () => {
    // A 12-day outage, then one partial day: the partial day alone is not a week's average.
    const rows = days([100, 100, 100, 100, 100, 100, 100, ...Array(12).fill(null), 5, 100, 100]);
    const values = smooth(rows, 90).points.map((p) => p.value);
    expect(values.slice(12, 19)).toEqual(Array(7).fill(null));
    expect(values.some((v) => v === 0)).toBe(false);
  });

  it("before a series' first measured day is a gap that drags nothing down", () => {
    const rows = days([null, null, null, null, null, 40, 40, 40, 40, 40]);
    const values = smooth(rows, 90).points.map((p) => p.value);
    expect(values.slice(0, 5)).toEqual([null, null, null, null, null]);
    expect(values.slice(5)).toEqual([40, 40, 40, 40, 40]);
  });

  it("still counts a row absent from a sparse series as 0", () => {
    const rows = days(Array(20).fill(7)).filter((_, i) => i % 2 === 0);
    const tail = smooth(rows, 90).points.at(-1)?.value;
    // Four sales of 7 in the 7 days to the last row: 28 over 7 days, not over the 4 rows.
    expect(tail).toBe(4);
  });

  it("is a gap in a level's weekly reading, never a 0", () => {
    const rows = days([...Array(14).fill(500), ...Array(7).fill(null)]);
    const values = smooth(rows, 365, "level").points.map((p) => p.value);
    expect(values).toEqual([500, 500, null]);
  });
});

describe("smoothSeries over a year", () => {
  it("draws a 28-day average per day, one point a week ending on the last day", () => {
    const rows = days(Array(70).fill(50));
    const { points, mode, window } = smooth(rows, 365);
    expect(mode).toBe("rolling");
    expect(window).toBe(28);
    expect(points.at(-1)?.date).toBe("2026-10-31");
    expect(points.map((p) => p.date)).toHaveLength(10);
    expect(points.every((p) => p.value === 50)).toBe(true);
  });

  it("flattens a one-day spike into a small bump", () => {
    // The 2 Mar 2026 shape: 1,225 visitors on a day that ran about 60.
    const rows = days([...Array(40).fill(60), 1225, ...Array(29).fill(60)]);
    const peak = Math.max(...smooth(rows, 365).points.map((p) => Number(p.value)));
    expect(peak).toBeLessThan(60 + (1225 - 60) / 28 + 1);
  });

  it("keeps a real climb", () => {
    const climb = Array.from({ length: 112 }, (_, i) => 100 + i * 2);
    const values = smooth(days(climb), 365).points.map((p) => Number(p.value));
    for (let i = 1; i < values.length; i++) expect(values[i]).toBeGreaterThan(values[i - 1]);
  });

  it("names a point by its window", () => {
    expect(averageTo("Oct 31", 28)).toBe("28-day average to Oct 31");
    expect(averageTo("Oct 31")).toBe("7-day average to Oct 31");
  });
});
