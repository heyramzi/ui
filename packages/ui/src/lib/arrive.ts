import type { Action } from "svelte/action";

/**
 * Replays `.t-enter` whenever the value handed in changes, so a panel that swaps
 * its record reads as a new one arriving. `<div use:arrive={selectedId}>`
 */

// Prefer it to `{#key}`, which rebuilds the subtree and loses scroll, focus and
// open disclosures. `use:` works on elements only, so a component still needs `{#key}`.
export const arrive: Action<HTMLElement, unknown> = (node, value) => {
  let previous = value;
  // The first paint is the mount, which already animates on its own class.
  node.classList.add("t-enter");

  return {
    update(next: unknown) {
      if (next === previous) return;
      previous = next;
      // Remove, force a reflow, re-add. A CSS animation runs once per element,
      // and only a reflow between the two writes makes the browser replay it.
      node.classList.remove("t-enter");
      void node.offsetWidth;
      node.classList.add("t-enter");
    },
  };
};
