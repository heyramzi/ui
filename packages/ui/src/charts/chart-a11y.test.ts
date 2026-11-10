import { describe, expect, it } from "vite-plus/test";
import { chartTable, nextPoint, rowSummary } from "#src/charts/chart-a11y.js";

type Row = { month: string; revenue: number | null; cost: number };
const rows: Row[] = [
  { month: "Jan", revenue: null, cost: 1800 },
  { month: "Feb", revenue: 4100, cost: 2100 },
  { month: "Mar", revenue: 3800, cost: 2400 },
  { month: "Apr", revenue: 5300, cost: 1500 },
];
const money = (v: number) => `$${v.toLocaleString("en")}`;
const table = chartTable(
  rows,
  (d) => d.month,
  [
    { label: "Revenue", value: (d) => d.revenue },
    { label: "Cost", value: (d) => d.cost },
  ],
  money,
  { xLabel: "Month" },
);

describe("chartTable", () => {
  it("summarises the range and each series' first, last, low and high, skipping gaps", () => {
    expect(table.summary).toBe(
      "Jan to Apr. Revenue: first $4,100, last $5,300, low $3,800, high $5,300. " +
        "Cost: first $1,800, last $1,500, low $1,500, high $2,400.",
    );
  });

  it("writes a missing value as No data in the table and the spoken row", () => {
    expect(table.rows[0]).toEqual({ x: "Jan", cells: ["No data", "$1,800"] });
    expect(rowSummary(table, 0)).toBe("Jan: Revenue No data, Cost $1,800");
  });

  it("says No data when there are no rows", () => {
    expect(chartTable([], String, [], money).summary).toBe("No data.");
  });
});

describe("nextPoint", () => {
  it("starts at the first point on Right and the last on Left", () => {
    expect(nextPoint("ArrowRight", -1, 4)).toBe(0);
    expect(nextPoint("ArrowLeft", -1, 4)).toBe(3);
  });

  it("stops at the ends instead of wrapping", () => {
    expect(nextPoint("ArrowRight", 3, 4)).toBe(3);
    expect(nextPoint("ArrowUp", 0, 4)).toBe(0);
  });

  it("jumps with Home and End, clears with Escape, and leaves other keys alone", () => {
    expect(nextPoint("Home", 2, 4)).toBe(0);
    expect(nextPoint("End", 0, 4)).toBe(3);
    expect(nextPoint("Escape", 2, 4)).toBeNull();
    expect(nextPoint("Escape", -1, 4)).toBeUndefined();
    expect(nextPoint("Tab", 1, 4)).toBeUndefined();
  });
});
