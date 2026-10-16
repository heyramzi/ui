const KEY = "editor-os.theme";

export type Theme = "dark" | "light";

/** The choice the person made, else what the page already wears, else dark. */
function read(): Theme {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // Storage can be blocked; fall through to the page's own value.
  }
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

/** Dark or light, remembered per browser and painted through `data-theme` on the page root. */
export function useTheme() {
  let theme = $state<Theme>(read());

  $effect(() => {
    document.documentElement.dataset.theme = theme;
  });

  $effect(() => {
    const follow = (event: StorageEvent) => {
      if (event.key === KEY && (event.newValue === "light" || event.newValue === "dark")) {
        theme = event.newValue;
      }
    };
    window.addEventListener("storage", follow);
    return () => window.removeEventListener("storage", follow);
  });

  return {
    get theme() {
      return theme;
    },
    /** Flip the theme. With a point, the new theme opens as a circle out of it; without one it just flips. */
    toggle(from?: { x: number; y: number }) {
      const next: Theme = theme === "dark" ? "light" : "dark";
      const apply = () => {
        theme = next;
        document.documentElement.dataset.theme = next;
      };
      try {
        localStorage.setItem(KEY, next);
      } catch {
        // The switch still works for this visit.
      }
      const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!from || still || !document.startViewTransition) return apply();

      const root = document.documentElement;
      const style = getComputedStyle(root);
      const raw = style.getPropertyValue("--duration-slow").trim();
      // WHY: the built stylesheet is minified, so 400ms can come back as .4s.
      const duration = raw.endsWith("ms") ? parseFloat(raw) : parseFloat(raw) * 1000 || 400;
      const easing = style.getPropertyValue("--ease-smooth-out").trim() || "ease-out";
      const reach = Math.hypot(
        Math.max(from.x, innerWidth - from.x),
        Math.max(from.y, innerHeight - from.y),
      );
      const shot = document.startViewTransition(apply);
      void shot.ready.then(() =>
        root.animate(
          {
            clipPath: [
              `circle(0px at ${from.x}px ${from.y}px)`,
              `circle(${reach}px at ${from.x}px ${from.y}px)`,
            ],
          },
          { duration, easing, pseudoElement: "::view-transition-new(root)" },
        ),
      );
    },
  };
}
