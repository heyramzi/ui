import { revealTheme } from "@heyramzi/ui/lib/theme-transition.js";

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
    /** Flip the theme. The new theme opens as a circle out of the clicked control. */
    toggle(event: MouseEvent) {
      const next: Theme = theme === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(KEY, next);
      } catch {
        // The switch still works for this visit.
      }
      const style = getComputedStyle(document.documentElement);
      const raw = style.getPropertyValue("--duration-slow").trim();
      // WHY: the built stylesheet is minified, so 300ms can come back as .3s.
      const duration = raw.endsWith("ms") ? parseFloat(raw) : parseFloat(raw) * 1000 || 300;
      const easing = style.getPropertyValue("--ease-smooth-out").trim() || "ease-out";
      revealTheme(
        event,
        () => {
          theme = next;
          document.documentElement.dataset.theme = next;
        },
        { duration, easing },
      );
    },
  };
}
