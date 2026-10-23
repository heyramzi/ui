/** Reads a numeric CSS custom property off the root, so the demo JS follows the same knobs as the CSS. */
export function cssNum(name: string, fallback: number) {
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
  return Number.isFinite(v) ? v : fallback;
}
