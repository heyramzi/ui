// Display formatting through Intl, so a locale string is all a host passes.
// A date-only value ("2026-10-26") is a calendar day, read in UTC so no zone shifts it.

import { relativeTime } from "#src/lib/dates.js";

const DAY_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function parse(iso: string): { date: Date; timeZone?: string } {
  return DAY_ONLY.test(iso)
    ? { date: new Date(`${iso}T00:00:00Z`), timeZone: "UTC" }
    : { date: new Date(iso) };
}

/** "Mon 26 Oct". */
export function formatDay(iso: string, locale = "en-GB"): string {
  const { date, timeZone } = parse(iso);
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone,
  }).format(date);
}

/** "Sat 24 to Sun 25 Oct" in one month, two full days across months, one day when the ends match. */
export function formatRange(
  start: string,
  end: string | null | undefined,
  locale = "en-GB",
): string {
  if (!end || end.slice(0, 10) === start.slice(0, 10)) return formatDay(start, locale);
  const a = parse(start);
  const b = parse(end);
  const sameMonth =
    a.date.getUTCFullYear() === b.date.getUTCFullYear() &&
    a.date.getUTCMonth() === b.date.getUTCMonth();
  if (!sameMonth) return `${formatDay(start, locale)} to ${formatDay(end, locale)}`;
  const part = (d: Date) =>
    new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", timeZone: "UTC" }).format(
      d,
    );
  const month = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(b.date);
  return `${part(a.date)} to ${part(b.date)} ${month}`;
}

/** "Oct 21" without a weekday, for a timeline day header. */
export function formatDayHeader(day: string, locale = "en-GB"): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${day}T00:00:00Z`));
}

/** "14:30" in the viewer's zone, or the given one. */
export function formatTime(iso: string, locale = "en-GB", timeZone?: string): string {
  return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", timeZone }).format(
    new Date(iso),
  );
}

/** "3 days ago", "in 2 weeks", "now". */
export function formatAge(iso: string, now: Date | number = Date.now(), locale = "en-GB"): string {
  return relativeTime(iso, now, { locale });
}

/** "€12,000". `compact` gives "€12K". */
export function formatMoney(
  amount: number,
  currency = "EUR",
  locale = "en-GB",
  compact = false,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: compact || Number.isInteger(amount) ? 0 : 2,
    notation: compact ? "compact" : "standard",
  }).format(amount);
}
