/** Entrance geometry. Names match motion-primitives so a port reads the same. */
export type RevealPreset = "fade" | "slide" | "blur" | "blur-slide" | "scale" | "zoom";

/** How TextEffect cuts its string before staggering the pieces. */
export type RevealPer = "char" | "word" | "line";

export type RevealTiming = {
  /** Preset geometry. Default `fade`. */
  preset?: RevealPreset;
  /** Wait before the first item starts, in ms. */
  delay?: number;
  /** Gap between consecutive items, in ms. Defaults to `--duration-stagger`. */
  stagger?: number;
  /** One item's run time, in ms. Defaults to `--duration-slow`. */
  duration?: number;
};

export type RevealViewOptions = {
  /** Play once and stay revealed, instead of replaying on every re-entry. */
  once?: boolean;
  /** Fraction of the element that must be visible before it plays. */
  amount?: number;
  /** `rootMargin` for the observer, e.g. `"0px 0px -15% 0px"`. */
  margin?: string;
};

export type InViewActionOptions = RevealViewOptions & {
  /** Called when the node enters the viewport. */
  onEnter?: () => void;
  /** Called when the node leaves the viewport. Only fires when `once` is false. */
  onLeave?: () => void;
};
