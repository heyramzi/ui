// The date strings the library shows, through Intl so a locale and a zone are all a caller passes.

type At = Date | string | number;

export type ShortDateOptions = {
  locale?: string;
  timeZone?: string;
  /** Adds the year: "Oct 23, 2025". */
  year?: boolean;
};

/** "Oct 23" in the caller's locale. */
export function shortDate(at: At, { locale, timeZone, year }: ShortDateOptions = {}): string {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: year ? "numeric" : undefined,
    timeZone,
  }).format(new Date(at));
}

const UNITS: [number, Intl.RelativeTimeFormatUnit][] = [
  [31_536_000, "year"],
  [2_592_000, "month"],
  [604_800, "week"],
  [86_400, "day"],
  [3_600, "hour"],
  [60, "minute"],
];

export type RelativeTimeOptions = {
  locale?: string;
  /** `long` says "3 hours ago", `short` "3 hr ago". */
  style?: Intl.RelativeTimeFormatStyle;
};

/** "3 days ago", "in 2 weeks", "now": the largest whole unit between `at` and `now`. */
export function relativeTime(
  at: At,
  now: At = Date.now(),
  { locale, style = "long" }: RelativeTimeOptions = {},
): string {
  const seconds = Math.round((new Date(at).getTime() - new Date(now).getTime()) / 1000);
  const age = Math.abs(seconds);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style });
  for (const [size, unit] of UNITS) {
    if (age >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return rtf.format(0, "second");
}

/** The calendar day of a moment as `YYYY-MM-DD`, in the given zone or the viewer's own. Today by default. */
export function localDay(at: At = new Date(), timeZone?: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).formatToParts(new Date(at));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}
