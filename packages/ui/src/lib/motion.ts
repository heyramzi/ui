/**
 * Motion tokens for code that needs a number: a Svelte `flip`, `slide` or `fade`, a timer. The
 * CSS in `tokens/craft.css` owns the values; these mirror it for the server render and for a
 * page that never loaded the tokens.
 */
export const DURATION_MS = {
  quick: 150,
  fast: 250,
  slow: 300,
} as const;

export type DurationToken = keyof typeof DURATION_MS;

/** A duration token in ms, read off a mounted element; both `ms` and `s` parse. */
export function tokenMs(el: Element, name: string, fallback: number): number {
  const raw = getComputedStyle(el).getPropertyValue(name).trim();
  const n = Number.parseFloat(raw);
  if (Number.isNaN(n)) return fallback;
  return raw.endsWith("ms") ? n : n * 1000;
}

/** `--duration-<token>` in ms off the root, so a token edit retimes the JS motion too. */
export function durationMs(token: DurationToken): number {
  if (typeof document === "undefined") return DURATION_MS[token];
  return tokenMs(document.documentElement, `--duration-${token}`, DURATION_MS[token]);
}
