/** What a screen reader gets from a chart: the hidden table's rows and a one-line summary of them. */
export type ChartTable = {
  xLabel: string;
  columns: string[];
  rows: { x: string; cells: string[] }[];
  summary: string;
};

/** One series. `format` overrides the chart's formatter for this column. */
type Column<T> = { label: string; value: (d: T) => unknown; format?: (v: number) => string };

/** Builds the table and summary every cartesian chart hands to ChartPlot. A missing value reads `empty`. */
export function chartTable<T>(
  data: T[],
  x: (d: T) => string,
  series: Column<T>[],
  format: (v: number) => string,
  { xLabel = "", empty = "No data" }: { xLabel?: string; empty?: string } = {},
): ChartTable {
  const xs = data.map(x);
  const rows = data.map((d, i) => ({
    x: xs[i],
    cells: series.map((s) => {
      const n = numeric(s.value(d));
      return n == null ? empty : (s.format ?? format)(n);
    }),
  }));
  const lines = series.map((s) =>
    seriesLine(
      s.label,
      data.map((d) => numeric(s.value(d))),
      s.format ?? format,
    ),
  );
  const range = xs.length === 0 ? "No data" : xs.length === 1 ? xs[0] : `${xs[0]} to ${xs.at(-1)}`;
  return {
    xLabel,
    columns: series.map((s) => s.label),
    rows,
    summary: xs.length === 0 ? "No data." : [`${range}.`, ...lines].join(" "),
  };
}

function numeric(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function seriesLine(label: string, values: (number | null)[], format: (v: number) => string) {
  const nums = values.filter((n): n is number => n != null);
  if (nums.length === 0) return `${label}: no data.`;
  let low = nums[0];
  let high = nums[0];
  for (const n of nums) {
    if (n < low) low = n;
    if (n > high) high = n;
  }
  const ends = `first ${format(nums[0])}, last ${format(nums[nums.length - 1])}`;
  return `${label}: ${ends}, low ${format(low)}, high ${format(high)}.`;
}

/** What one row reads as when the arrow keys land on it, like "Mar: Revenue $4,100, Cost $2,100". */
export function rowSummary(table: ChartTable, i: number): string {
  const row = table.rows[i];
  if (!row) return "";
  return `${row.x}: ${table.columns.map((c, j) => `${c} ${row.cells[j]}`).join(", ")}`;
}

/**
 * The point a key moves to from `at`, where -1 is none yet. `undefined` means the key isn't the
 * plot's, and `null` means Escape cleared the point.
 */
export function nextPoint(key: string, at: number, count: number): number | null | undefined {
  if (count === 0) return undefined;
  switch (key) {
    case "ArrowRight":
    case "ArrowDown":
      return at < 0 ? 0 : Math.min(at + 1, count - 1);
    case "ArrowLeft":
    case "ArrowUp":
      return at < 0 ? count - 1 : Math.max(at - 1, 0);
    case "Home":
      return 0;
    case "End":
      return count - 1;
    case "Escape":
      return at < 0 ? undefined : null;
    default:
      return undefined;
  }
}
