// =========================
// TYPES
// =========================
/** A count sums per bucket (visitors, clicks); a level is a reading at a moment (MRR), never summed. */
export type SeriesKind = "count" | "level";

export interface Smoothing {
  /** The window the chart shows, in days. It picks how much the line is smoothed. */
  rangeDays: number;
  kind?: SeriesKind;
}

export type SmoothMode = "raw" | "rolling" | "weekly";

/** The tooltip's name for a drawn point, beside its date. */
export const ROLLING_LABEL = "7-day average";
export const weekOf = (start: string) => `Week of ${start}`;
export const averageTo = (end: string) => `${ROLLING_LABEL} to ${end}`;

const DAY = 86_400_000;
const WINDOW = 7;

// =========================
// FUNCTIONS
// =========================
/** About 30 to 60 marks across a chart: raw to a week, a 7-day average to a quarter, whole weeks past it. */
export function smoothMode(rangeDays: number): SmoothMode {
  if (rangeDays <= 14) return "raw";
  if (rangeDays <= 120) return "rolling";
  return "weekly";
}

function timeOf(value: unknown): number {
  return value instanceof Date ? value.getTime() : new Date(String(value)).getTime();
}

/** The bucket's start in the same form the series uses, so the axis and the formatter see no change. */
function sameForm(sample: unknown, time: number): unknown {
  if (sample instanceof Date) return new Date(time);
  const iso = new Date(time).toISOString();
  return String(sample).length === 10 ? iso.slice(0, 10) : iso;
}

/**
 * The line a chart draws: a trailing 7-day mean, or 7-day buckets counted back from the last day.
 * Totals stay the caller's raw sums; this only moves the drawn points.
 */
export function smoothSeries<TData extends Record<string, unknown>>(
  data: TData[],
  xKey: keyof TData & string,
  yKeys: (keyof TData & string)[],
  { rangeDays, kind = "count" }: Smoothing,
): { points: TData[]; mode: SmoothMode } {
  const mode = smoothMode(rangeDays);
  if (mode === "raw" || data.length < WINDOW) return { points: data, mode: "raw" };
  const times = data.map((d) => timeOf(d[xKey]));

  if (mode === "rolling") {
    // A level has no daily noise to average, and a mean draws slopes between its steps.
    if (kind === "level") return { points: data, mode: "raw" };
    let from = 0;
    const sums = Object.fromEntries(yKeys.map((k) => [k, 0])) as Record<string, number>;
    const points = data.map((d, i) => {
      for (const k of yKeys) sums[k] += Number(d[k] ?? 0);
      while (times[i] - times[from] >= WINDOW * DAY) {
        for (const k of yKeys) sums[k] -= Number(data[from][k] ?? 0);
        from += 1;
      }
      // Divided by the days in the window, so a missing day counts as zero, not skipped.
      const days = Math.min(WINDOW, Math.round((times[i] - times[0]) / DAY) + 1);
      const row: Record<string, unknown> = { ...d };
      for (const k of yKeys) row[k] = sums[k] / days;
      return row as TData;
    });
    return { points, mode };
  }

  // Weeks end on the last day, so only the oldest can be partial, and a partial week is dropped:
  // a 3-day sum would draw a dip that never happened.
  const last = times[times.length - 1];
  const buckets = new Map<number, TData[]>();
  data.forEach((d, i) => {
    const index = Math.floor(Math.round((last - times[i]) / DAY) / WINDOW);
    buckets.set(index, [...(buckets.get(index) ?? []), d]);
  });
  const oldest = Math.max(...buckets.keys());
  const oldestStart = last - (oldest * WINDOW + WINDOW - 1) * DAY;
  if (times[0] > oldestStart && buckets.size > 1) buckets.delete(oldest);

  const points = [...buckets.entries()]
    .toSorted(([a], [b]) => b - a)
    .map(([index, rows]) => {
      const row: Record<string, unknown> = { ...rows[rows.length - 1] };
      row[xKey] = sameForm(data[0][xKey], last - (index * WINDOW + WINDOW - 1) * DAY);
      for (const k of yKeys) {
        row[k] =
          kind === "level"
            ? Number(rows[rows.length - 1][k] ?? 0)
            : rows.reduce((sum, r) => sum + Number(r[k] ?? 0), 0);
      }
      return row as TData;
    });
  return { points, mode };
}

/** Labels at least `spacing` pixels apart, the way a time axis reads at any width. */
export function ticksForWidth(max: number, spacing = 72) {
  return (scale: { range: () => number[]; ticks?: (count: number) => unknown[] }) => {
    const [start, end] = scale.range();
    const count = Math.max(2, Math.min(max, Math.floor(Math.abs(end - start) / spacing)));
    const ticks = scale.ticks?.(count) ?? [];
    const step = Math.ceil(ticks.length / count);
    return step > 1 ? ticks.filter((_, i) => i % step === 0) : ticks;
  };
}
