export interface ImageRevealProps {
  /** Image(s) to reveal. An array picks one at random per cycle, never the previous one. */
  src: string | string[];
  /** Run the auto loop: shimmer -> reveal -> hold -> hide -> repeat. */
  autoReveal?: boolean;
  /** Seconds of shimmer between reveals when auto-revealing. */
  revealDelayRange?: [number, number];
  /** Milliseconds the image stays fully visible before it hides. */
  revealHoldMs?: number;
  /** Milliseconds of the dissolve-in reveal animation. */
  revealDurationMs?: number;
  /** Milliseconds of the cross-fade back to the shimmer. */
  revealFadeOutMs?: number;
  /** Mosaic cell size in CSS pixels. */
  cell?: number;
  /** Corner radius in CSS pixels. Auto-detected from the wrapper when omitted. */
  borderRadius?: number;
  /** Freeze the shimmer and the scheduler. */
  paused?: boolean;
  /** 0..1 opacity multiplier for the whole effect. */
  strength?: number;
  /** Forwarded class on the wrapper element. */
  class?: string;
  /** Forwarded inline style on the wrapper element. */
  style?: string;
}

export interface ImageRevealHandle {
  /** Run one reveal now. `hold: 'manual'` stays visible until `triggerHide()`. */
  triggerReveal: (opts?: { hold?: "auto" | "manual" }) => void;
  /** Fade the current image back to the shimmer. */
  triggerHide: () => void;
  /** True while an image is showing (reveal / visible / hide phases). */
  isImageActive: () => boolean;
}
