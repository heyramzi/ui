/** The id `by` rows away from `current`, or null at either end or when `current` isn't listed. */
export function stepTo(
  ids: readonly string[],
  current: string | null | undefined,
  by: 1 | -1,
): string | null {
  const index = current ? ids.indexOf(current) : -1;
  if (index < 0) return null;
  return ids[index + by] ?? null;
}
