export interface RevealThemeOptions {
  /** Apply the change without the wipe, for a swap that paints the same theme. */
  skip?: boolean;
  /** Wipe length in ms. */
  duration?: number;
  /** Wipe easing, any CSS easing value. */
  easing?: string;
}

/** Where the wipe grows from: a click, an element, or a point in the viewport. */
export type RevealOrigin = MouseEvent | Element | { x: number; y: number };

const DEFAULT_DURATION = 400;
const STYLE_ID = "heyramzi-reveal-theme";

/**
 * Run `apply` inside a circular wipe from the clicked element or a point, falling back to
 * plain `apply()` without view transitions, under reduced motion, or with `skip`.
 */
export function revealTheme(
  origin: RevealOrigin,
  apply: () => void,
  options: RevealThemeOptions = {},
): void {
  const { skip = false, duration = DEFAULT_DURATION, easing = "ease-in-out" } = options;
  const point = resolveOrigin(origin);

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (skip || prefersReduced || !document.startViewTransition || !point) {
    apply();
    return;
  }

  const { x, y } = point;
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  ensureStyles();

  const transition = document.startViewTransition(() => {
    apply();
  });

  transition.ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
      { duration, easing, pseudoElement: "::view-transition-new(root)" },
    );
  });
}

function centreOf(element: Element): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

// A click on a child still wipes from the control that owns the handler.
function resolveOrigin(origin: RevealOrigin): { x: number; y: number } | null {
  if (origin instanceof Element) return centreOf(origin);
  if (origin instanceof MouseEvent) {
    return origin.currentTarget instanceof Element
      ? centreOf(origin.currentTarget)
      : { x: origin.clientX, y: origin.clientY };
  }
  return origin;
}

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal;}`;
  document.head.appendChild(style);
}
