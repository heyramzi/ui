/**
 * Two value axes that share one set of grid lines.
 *
 * A right axis with its own nice ticks lands its labels between the left axis's grid lines, so a
 * reader can't trace either. Both axes here get the same number of intervals: the left picks a nice
 * step for its data, and the right picks the smallest nice step that fits its data in that many.
 */

export type AxisScale = { max: number; ticks: number[] };

const NICE = [1, 2, 2.5, 5, 10];

/** The smallest 1, 2, 2.5 or 5 times a power of ten that is at least `raw`. */
export function niceStep(raw: number): number {
  if (!(raw > 0) || !Number.isFinite(raw)) return 1;
  const power = 10 ** Math.floor(Math.log10(raw));
  // WHY the epsilon: 0.3 / 0.1 is 2.9999999999999996, which would skip 3 x 0.1 for the next step.
  const multiple = NICE.find((m) => m * power >= raw * (1 - 1e-9)) ?? 10;
  return multiple * power;
}

function ticksOf(step: number, count: number): number[] {
  // Rounded so 0.1 x 3 reads 0.3 on the axis, not 0.30000000000000004.
  return Array.from({ length: count + 1 }, (_, i) => Number((i * step).toPrecision(12)));
}

/**
 * Left and right domains from 0, with the same tick count so both axes sit on one grid.
 * `target` is the number of intervals wanted; the left data may round it to one more or less.
 */
export function dualAxis(
  leftMax: number,
  rightMax: number,
  target = 4,
): { left: AxisScale; right: AxisScale } {
  const leftStep = niceStep(Math.max(0, leftMax) / target);
  const count = Math.max(1, Math.ceil(Math.max(0, leftMax) / leftStep - 1e-9));
  const rightStep = niceStep(Math.max(0, rightMax) / count);
  return {
    left: { max: leftStep * count, ticks: ticksOf(leftStep, count) },
    right: { max: rightStep * count, ticks: ticksOf(rightStep, count) },
  };
}
