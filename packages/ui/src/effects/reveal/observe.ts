import type { Action } from "svelte/action";
import type { InViewActionOptions, RevealViewOptions } from "#src/effects/reveal/types.js";

/**
 * Runs `onChange` when `el` enters or leaves the viewport. Returns the teardown.
 * Shared by InView, AnimatedGroup and TextEffect so there is one observer contract.
 */
export function observeInView(
  el: Element,
  options: RevealViewOptions,
  onChange: (inView: boolean) => void,
): () => void {
  // WHY: no IntersectionObserver means SSR or an ancient engine; reveal the
  // content rather than leaving it stuck at the hidden keyframe.
  if (typeof IntersectionObserver === "undefined") {
    onChange(true);
    return () => {};
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        onChange(true);
        if (options.once !== false) observer.disconnect();
        return;
      }
      if (options.once === false) onChange(false);
    },
    { threshold: options.amount ?? 0, rootMargin: options.margin ?? "0px" },
  );

  observer.observe(el);
  return () => observer.disconnect();
}

/**
 * Svelte action that calls back when the node enters or leaves the viewport.
 * Options are read at call time, so a `use:onInView={...}` update swaps the callbacks.
 */
export const onInView: Action<HTMLElement, InViewActionOptions | undefined> = (node, initial) => {
  let options = initial ?? {};
  let entered = false;

  const { amount = 0.1, margin, once } = options;

  const stop = observeInView(node, { amount, margin, once }, (inView) => {
    if (inView && !entered) {
      entered = true;
      options.onEnter?.();
    } else if (!inView && entered) {
      entered = false;
      options.onLeave?.();
    }
  });

  return {
    update(next) {
      options = next ?? {};
    },
    destroy: stop,
  };
};
