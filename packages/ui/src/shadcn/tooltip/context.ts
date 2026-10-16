import { getContext, hasContext, setContext } from "svelte";

const KEY = Symbol.for("upsys.tooltip.provider");

/** Marks the subtree as already inside a Tooltip.Provider. */
export function markTooltipProvider(): void {
  setContext(KEY, true);
}

/**
 * bits-ui keeps the delay and the skip window on the provider, so tooltips share
 * a group only when they share one. The root used to mount its own every time.
 */
export function hasTooltipProvider(): boolean {
  return hasContext(KEY) && getContext(KEY) === true;
}
