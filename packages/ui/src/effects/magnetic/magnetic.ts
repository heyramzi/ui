import type { Action } from "svelte/action";

export type MagneticOptions = {
  /** How far the element travels, as a fraction of the pointer offset. */
  intensity?: number;
  /** Radius the pointer has to be inside, in px. */
  range?: number;
  /** What arms the pull: the element itself, or its parent. */
  from?: "self" | "parent";
  /** Return time, in ms. */
  duration?: number;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Pulls an element toward the pointer while it is inside `range`.
 * Port of motion-primitives' `Magnetic` with a CSS transition instead of a spring.
 */
export const magnetic: Action<HTMLElement, MagneticOptions | undefined> = (node, options) => {
  let intensity = options?.intensity ?? 0.6;
  let range = options?.range ?? 100;
  let from = options?.from ?? "self";
  let duration = options?.duration ?? 350;
  let armed = false;

  // WHY: the pull is a hover affordance with no state behind it, so reduced-motion
  // gets a no-op rather than a shorter version of the same movement.
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  const zone = () => (from === "parent" ? (node.parentElement ?? node) : node);

  const reset = () => {
    node.style.transition = `translate ${duration}ms ${EASE}`;
    node.style.translate = "0px 0px";
  };

  const onMove = (event: PointerEvent) => {
    if (!armed || reduced.matches) return;
    const rect = node.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const distance = Math.hypot(dx, dy);
    if (distance > range) return reset();
    const falloff = intensity * (1 - distance / range);
    node.style.transition = "translate 0ms";
    node.style.translate = `${dx * falloff}px ${dy * falloff}px`;
  };

  const arm = () => (armed = true);
  const disarm = () => {
    armed = false;
    reset();
  };

  let target = zone();
  target.addEventListener("pointerenter", arm);
  target.addEventListener("pointerleave", disarm);
  document.addEventListener("pointermove", onMove);

  return {
    update(next) {
      intensity = next?.intensity ?? 0.6;
      range = next?.range ?? 100;
      duration = next?.duration ?? 350;
      const nextFrom = next?.from ?? "self";
      if (nextFrom === from) return;
      target.removeEventListener("pointerenter", arm);
      target.removeEventListener("pointerleave", disarm);
      from = nextFrom;
      target = zone();
      target.addEventListener("pointerenter", arm);
      target.addEventListener("pointerleave", disarm);
    },
    destroy() {
      target.removeEventListener("pointerenter", arm);
      target.removeEventListener("pointerleave", disarm);
      document.removeEventListener("pointermove", onMove);
    },
  };
};
