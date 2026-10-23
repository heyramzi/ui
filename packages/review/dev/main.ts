import { mountReview, type MountedReview } from "#src/index.js";
import { mountToolbar } from "#dev/toolbar.js";

const params = new URLSearchParams(location.search);
const id = params.get("id") ?? "a19-ai-project-manager";
const theme = params.get("theme");
if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
const radius = params.get("radius");
if (radius) document.documentElement.style.setProperty("--radius", radius);
if (params.get("brand") === "amber") {
  const root = document.documentElement.style;
  root.setProperty("--ground", "oklch(0.15 0.01 60)");
  root.setProperty("--surface", "oklch(0.19 0.012 60)");
  root.setProperty("--raised", "oklch(0.24 0.015 60)");
  root.setProperty("--line", "oklch(0.32 0.02 60)");
  root.setProperty("--line-soft", "oklch(0.26 0.015 60)");
  root.setProperty("--accent", "oklch(0.78 0.15 75)");
}

let mounted: MountedReview | undefined;
mounted = mountReview(document.getElementById("root") as HTMLElement, {
  base: "/review",
  id,
  backHref: "/",
});
if (params.get("toolbar") !== "0") mountToolbar(id);
void mounted;

// WHY: grab is a dev tool. A dynamic import in this file keeps it out of the library build.
if (import.meta.env.DEV && params.get("grab") !== "0")
  void import("@heyramzi/utils/grab").catch(() => undefined);
