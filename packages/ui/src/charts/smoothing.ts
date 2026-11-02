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

/** Raw days, a trailing average, or a level read once a week. */
export type SmoothMode = "raw" | "rolling" | "weekly";

export interface Smoothed<TData> {
  points: TData[];
  mode: SmoothMode;
  /** How many days a rolling point averages: 7 up to a quarter, 28 past it. */
  window: number;
}

/** The tooltip's name for a drawn point, beside its date. */
export const averageLabel = (days: number) => `${days}-day average`;
export const ROLLING_LABEL = averageLabel(7);
export const weekOf = (start: string) => `Week of ${start}`;
export const averageTo = (end: string, days = 7) => `${averageLabel(days)} to ${end}`;
/** What a point the collector never measured reads as, where a number would claim a 0. */
export const NO_DATA = "No data";

const DAY = 86_400_000;
const WEEK = 7;
/** A year at 7 days still drew one-day spikes as humps; 28 days keeps the growth and drops the spikes. */
const LONG_WINDOW = 28;

// =========================
// FUNCTIONS
// =========================
/** About 30 to 60 marks across a chart: raw to a fortnight, a daily average to a quarter, weekly past it. */
export function smoothMode(rangeDays: number): SmoothMode {
  if (rangeDays <= 14) return "raw";
  if (rangeDays <= 120) return "rolling";
  return "weekly";
}

function timeOf(value: unknown): number {
  return value instanceof Date ? value.getTime() : new Date(String(value)).getTime();
}

/** Null, undefined or not a number: a day nobody measured. An absent row still counts as 0. */
function measured(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** The bucket's start in the same form the series uses, so the axis and the formatter see no change. */
function sameForm(sample: unknown, time: number): unknown {
  if (sample instanceof Date) return new Date(time);
  const iso = new Date(time).toISOString();
  return String(sample).length === 10 ? iso.slice(0, 10) : iso;
}

const daysBetween = (from: number, to: number) => Math.round((to - from) / DAY);

/**
 * A trailing mean over `window` days, drawn on the days `keep` picks.
 *
 * A missing value is skipped, never averaged in as 0, and a window with fewer measured days than
 * missing ones draws a gap: one partial day after a 12-day outage is not a week. Days before a
 * series' first measured value are not tracked yet, so they neither draw nor count as missing.
 */
function trailingMean<TData extends Record<string, unknown>>(
  data: TData[],
  times: number[],
  yKeys: string[],
  window: number,
  keep: (i: number) => boolean,
): TData[] {
  const firstSeen = Object.fromEntries(
    yKeys.map((k) => [k, times[data.findIndex((d) => measured(d[k]) !== null)] ?? Infinity]),
  );
  const out: TData[] = [];
  data.forEach((d, i) => {
    if (!keep(i)) return;
    const row: Record<string, unknown> = { ...d };
    for (const k of yKeys) {
      if (times[i] < firstSeen[k]) {
        row[k] = null;
        continue;
      }
      let sum = 0;
      let missing = 0;
      for (let j = i; j >= 0 && times[i] - times[j] < window * DAY; j--) {
        const value = measured(data[j][k]);
        if (value === null) missing += times[j] >= firstSeen[k] ? 1 : 0;
        else sum += value;
      }
      // Divided by the tracked days in the window, so a row absent from a sparse series counts as 0.
      const days = Math.min(window, daysBetween(Math.max(times[0], firstSeen[k]), times[i]) + 1);
      const seen = days - missing;
      row[k] = seen > 0 && seen * 2 >= days ? sum / seen : null;
    }
    out.push(row as TData);
  });
  return out;
}

/**
 * The line a chart draws. Up to a quarter, a trailing 7-day mean per day. Past it, a trailing
 * 28-day mean read once a week from the last day, so the axis stays in per-day units at every
 * range; a level reads its last value each week instead. A missing value (null) is a gap in the
 * line, never a 0. Totals stay the caller's raw sums; this only moves the drawn points.
 */
export function smoothSeries<TData extends Record<string, unknown>>(
  data: TData[],
  xKey: keyof TData & string,
  yKeys: (keyof TData & string)[],
  { rangeDays, kind = "count" }: Smoothing,
): Smoothed<TData> {
  const mode = smoothMode(rangeDays);
  if (mode === "raw" || data.length < WEEK) return { points: data, mode: "raw", window: 1 };
  const times = data.map((d) => timeOf(d[xKey]));
  const last = times[times.length - 1];

  if (kind === "count") {
    const window = mode === "rolling" ? WEEK : LONG_WINDOW;
    const keep =
      mode === "rolling" ? () => true : (i: number) => daysBetween(times[i], last) % WEEK === 0;
    return { points: trailingMean(data, times, yKeys, window, keep), mode: "rolling", window };
  }

  // A level has no daily noise to average, and a mean draws slopes between its steps.
  if (mode === "rolling") return { points: data, mode: "raw", window: 1 };

  // Weeks end on the last day, so only the oldest can be partial, and a partial week is dropped.
  const buckets = new Map<number, TData[]>();
  data.forEach((d, i) => {
    const index = Math.floor(daysBetween(times[i], last) / WEEK);
    buckets.set(index, [...(buckets.get(index) ?? []), d]);
  });
  const oldest = Math.max(...buckets.keys());
  const oldestStart = last - (oldest * WEEK + WEEK - 1) * DAY;
  if (times[0] > oldestStart && buckets.size > 1) buckets.delete(oldest);

  const points = [...buckets.entries()]
    .toSorted(([a], [b]) => b - a)
    .map(([index, rows]) => {
      const row: Record<string, unknown> = { ...rows[rows.length - 1] };
      row[xKey] = sameForm(data[0][xKey], last - (index * WEEK + WEEK - 1) * DAY);
      for (const k of yKeys) {
        const readings = rows.map((r) => measured(r[k])).filter((v) => v !== null);
        row[k] = readings.length > 0 ? readings[readings.length - 1] : null;
      }
      return row as TData;
    });
  return { points, mode, window: WEEK };
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
