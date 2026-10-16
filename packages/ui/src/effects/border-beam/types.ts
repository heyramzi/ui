import type { HTMLAttributes } from "svelte/elements";
import type { Snippet } from "svelte";
import type {
  BorderBeamColorVariant,
  BorderBeamSize,
  BorderBeamTheme,
} from "#src/effects/border-beam/presets.js";

export interface BorderBeamProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  children: Snippet;
  size?: BorderBeamSize;
  colorVariant?: BorderBeamColorVariant;
  theme?: BorderBeamTheme;
  staticColors?: boolean;
  /** Seconds for one lap. Default 1.96s, or 2.4s at size="line". */
  duration?: number;
  active?: boolean;
  borderRadius?: number;
  brightness?: number;
  saturation?: number;
  hueRange?: number;
  strength?: number;
  // WHY: caller-supplied palette overrides the colorVariant preset. Each
  // preset stop is mapped by index (cycling if shorter) so layout/timing
  // stay identical, only hues swap. Accepts hex (#rrggbb), rgb(), rgba().
  colors?: string[];
  // WHY: the bloom layer is the single most expensive part of the beam — a blurred conic-gradient re-rasterized every frame.

  // Opt-out gives a 2-3x perf win for callers who only need the stroke and inner shimmer.
  bloom?: boolean;
  // WHY: pause beam animation while the host is off-screen (IntersectionObserver) or the document is hidden.

  // Default true; opt-out for callers that mount outside the viewport but still want the beam ticking.
  pauseWhenOffscreen?: boolean;
  class?: string;
  onActivate?: () => void;
  onDeactivate?: () => void;
}
