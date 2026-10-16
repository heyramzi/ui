export type ViewTransitionRevealOrigin = MouseEvent | { x: number; y: number } | HTMLElement;

export type ViewTransitionRevealOptions = {
  duration?: number;
  easing?: string;
};

const STYLE_ID = "heyramzi-view-transition-reveal";

export function viewTransitionReveal(
  origin: ViewTransitionRevealOrigin,
  apply: () => void,
  options?: ViewTransitionRevealOptions,
): void {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // WHY: feature-detect both API presence and reduced-motion to keep callers
  // from having to branch.
  if (typeof document === "undefined" || !document.startViewTransition || prefersReduced) {
    apply();
    return;
  }

  const { x, y } = resolveOrigin(origin);
  const duration = options?.duration ?? 400;
  const easing = options?.easing ?? "ease-in-out";
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
      {
        clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`],
      },
      {
        duration,
        easing,
        pseudoElement: "::view-transition-new(root)",
      },
    );
  });
}

function resolveOrigin(origin: ViewTransitionRevealOrigin): { x: number; y: number } {
  if (origin instanceof HTMLElement) {
    const rect = origin.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }
  if (typeof MouseEvent !== "undefined" && origin instanceof MouseEvent) {
    const target = origin.currentTarget instanceof HTMLElement ? origin.currentTarget : null;
    if (target) {
      const rect = target.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    return { x: origin.clientX, y: origin.clientY };
  }
  return { x: origin.x, y: origin.y };
}

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal;}`;
  document.head.appendChild(style);
}
