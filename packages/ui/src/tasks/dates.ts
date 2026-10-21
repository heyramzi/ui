// Dates are plain "YYYY-MM-DD" strings, counted as whole UTC days. A timeline
// only needs days, and day numbers dodge every timezone and DST edge.
const DAY_MS = 86_400_000;

/** Days since 1970-01-01 for an ISO date. Anything after the date part is ignored. */
export function dayNumber(iso: string): number {
  const [y = 1970, m = 1, d = 1] = iso.slice(0, 10).split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

/** The ISO date for a day number. */
export function isoFromDay(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

/** Shift an ISO date by whole days. */
export function addDays(iso: string, days: number): string {
  return isoFromDay(dayNumber(iso) + days);
}

/** Today in the viewer's own timezone, as an ISO date. */
export function todayIso(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

/** 0 is Sunday, as in `Date.getUTCDay`. */
export function weekday(day: number): number {
  return new Date(day * DAY_MS).getUTCDay();
}
