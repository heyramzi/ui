/** `true` fades this much of the width at each side. */
export const EDGE_FADE_DEFAULT = 0.08;

/**
 * Turns an `edgeFade` prop into the fraction of the width to fade at each side.
 * `false` (or 0) means no mask is rendered at all.
 */
export function resolveEdgeFade(
  value: boolean | number | undefined,
  fallback = EDGE_FADE_DEFAULT,
): number {
  if (value === false) return 0;
  if (value === true || value == null) return fallback;
  if (!Number.isFinite(value)) return 0;
  return Math.min(0.45, Math.max(0, value));
}
