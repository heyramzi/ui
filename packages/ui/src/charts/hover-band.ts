/** How far the hover band reaches each side of the point, as a share of the gap to its neighbour. */
export const HOVER_BAND_REACH = 0.8;

/**
 * The hovered segment's clip, centered on the point at `xs[i]`.
 * Both sides take the shorter neighbour gap, so the dot always sits in the middle.
 */
export function hoverBand(
  xs: number[],
  i: number,
  width: number,
  reach = HOVER_BAND_REACH,
): { x: number; width: number } | null {
  if (i < 0 || i >= xs.length) return null;
  const at = xs[i];
  const before = i > 0 ? at - xs[i - 1] : Infinity;
  const after = i < xs.length - 1 ? xs[i + 1] - at : Infinity;
  const gap = Math.min(before, after);
  const half = (Number.isFinite(gap) ? gap : width) * reach;
  return { x: at - half, width: half * 2 };
}
