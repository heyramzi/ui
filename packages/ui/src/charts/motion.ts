import { cubicInOut } from "svelte/easing";

/** Mirrors `--chart-motion-reveal` in charts.css, for when no element is mounted to read it from. */
export const REVEAL_MS = 1100;

/** Rescales the axes when the data changes; the first render never animates. */
export const DOMAIN_MOTION = { type: "tween", duration: 500, easing: cubicInOut } as const;

/** The tooltip sits beside the hovered point at the top of the plot, so it never chases the cursor. */
export const TOOLTIP_TOP = 8;
export const TOOLTIP_GAP = 16;

/** A chart duration token in ms, read off a mounted element; both `ms` and `s` parse. */
export function tokenMs(el: Element, name: string, fallback: number): number {
  const raw = getComputedStyle(el).getPropertyValue(name).trim();
  const n = Number.parseFloat(raw);
  if (Number.isNaN(n)) return fallback;
  return raw.endsWith("ms") ? n : n * 1000;
}
