export interface RevealThemeOptions {
  /** Apply the change without the wipe, for a swap that paints the same theme. */
  skip?: boolean;
  /** Wipe length in ms. */
  duration?: number;
}

const DEFAULT_DURATION = 400;

/**
 * Run `apply` inside a circular wipe that grows from the centre of the clicked
 * element. Falls back to a plain `apply()` when the browser has no view
 * transitions, the user prefers reduced motion, or `skip` is set.
 *
 * The page also needs `::view-transition-old(root)` and `::view-transition-new(root)`
 * set to `animation: none`. `ThemeToggle` ships that CSS; a bare caller adds its own.
 */
export function revealTheme(
  event: MouseEvent,
  apply: () => void,
  options: RevealThemeOptions = {},
): void {
  const { skip = false, duration = DEFAULT_DURATION } = options;
  const origin = event.currentTarget;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (skip || prefersReduced || !document.startViewTransition || !(origin instanceof Element)) {
    apply();
    return;
  }

  const rect = origin.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  const transition = document.startViewTransition(() => {
    apply();
  });

  transition.ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
      { duration, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" },
    );
  });
}
