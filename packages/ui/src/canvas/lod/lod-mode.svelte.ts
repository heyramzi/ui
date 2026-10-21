import { untrack } from "svelte";

// One flag per canvas: a card reading it re-renders when it flips, not on every zoom frame.

/** Below this zoom a card is a box. */
export const LOW_BELOW = 0.4;
/** Back to the full card above this. The gap stops a zoom held at the line from swapping every card each frame. */
export const FULL_ABOVE = 0.46;

type ZoomSource = { viewport: { zoom: number } };

const modes = new WeakMap<object, { low: boolean }>();

/** The shared flag for one canvas's store. The first card to ask starts the one effect that keeps it. */
export function lodMode(store: ZoomSource): { readonly low: boolean } {
  const known = modes.get(store);
  if (known) return known;
  const mode = $state({ low: store.viewport.zoom < LOW_BELOW });
  modes.set(store, mode);
  $effect.root(() => {
    $effect(() => {
      const zoom = store.viewport.zoom;
      untrack(() => {
        if (mode.low && zoom > FULL_ABOVE) mode.low = false;
        else if (!mode.low && zoom < LOW_BELOW) mode.low = true;
      });
    });
  });
  return mode;
}
