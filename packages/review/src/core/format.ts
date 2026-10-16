/** "0:18" or "1:02:05" from seconds. */
export function clock(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** "0:18.4" for the player, tenths included. */
export function clockTenths(seconds: number): string {
  const safe = Math.max(0, seconds);
  const tenths = Math.floor((safe * 10) % 10);
  return `${clock(Math.floor(safe))}.${tenths}`;
}

/** Seconds from a clock label like "0:18" or "1:02:05". NaN when it isn't one. */
export function clockToSeconds(label: string): number {
  const parts = label.split(":").map(Number);
  if (parts.length === 0 || parts.some((n) => !Number.isFinite(n))) return Number.NaN;
  return parts.reduce((total, n) => total * 60 + n, 0);
}

/** "just now", "3m ago", "2h ago", "4d ago". */
export function ago(iso: string, now: number): string {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return "";
  const s = Math.max(0, Math.round((now - then) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export const plural = (n: number, one: string, many = `${one}s`): string =>
  `${n} ${n === 1 ? one : many}`;

export const percent = (n: number): number => Math.round(n * 100);
