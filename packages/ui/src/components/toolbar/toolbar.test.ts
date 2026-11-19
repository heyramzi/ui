import { mount, tick, unmount } from "svelte";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { List, SquaresFour } from "phosphor-svelte";
import Toolbar from "#src/components/toolbar/toolbar.svelte";

const tabs = [
  { value: "all", label: "All", count: 12 },
  { value: "open", label: "Open", count: 4 },
];
const views = [
  { value: "list", label: "List", icon: List },
  { value: "grid", label: "Grid", icon: SquaresFour },
];

let target: HTMLElement;
let app: Record<string, unknown> | undefined;

function render(props: Record<string, unknown>) {
  target = document.createElement("div");
  document.body.append(target);
  app = mount(Toolbar, { target, props }) as Record<string, unknown>;
  return target;
}

afterEach(() => {
  if (app) void unmount(app);
  target?.remove();
  app = undefined;
});

describe("Toolbar", () => {
  // It draws ListPageShell's row (TSK-2309), so both fold the same way.
  it("is the list-page row: one line that never wraps, with a fold level", () => {
    const root = render({ search: "", tabs, tab: "all", views, view: "list" });
    const row = root.querySelector("[data-fold]");
    expect(row?.getAttribute("data-fold")).toBe("0");
    expect(row?.classList.contains("flex-nowrap")).toBe(true);
    expect(row?.classList.contains("flex-wrap")).toBe(false);
  });

  it("draws search, tabs and view once, wide, and names each", () => {
    const root = render({
      search: "",
      tabs,
      tab: "all",
      views,
      view: "list",
      searchLabel: "Find",
      tabsLabel: "Status",
      viewLabel: "Layout",
    });
    expect(root.querySelectorAll('input[aria-label="Find"]').length).toBe(1);
    expect(root.querySelector('[aria-label="Status"]')).not.toBeNull();
    expect(root.querySelector('[aria-label="Layout"]')).not.toBeNull();
  });

  it("marks the current tab and view as on", async () => {
    const root = render({ tabs, tab: "open", views, view: "grid" });
    await tick();
    const on = [...root.querySelectorAll('[data-state="on"]')].map((el) => el.textContent?.trim());
    expect(on.some((text) => text?.startsWith("Open"))).toBe(true);
    expect(on.some((text) => text?.startsWith("Grid"))).toBe(true);
  });

  it("leaves out what it isn't given", () => {
    const root = render({ tabs, tab: "all" });
    expect(root.querySelector("input")).toBeNull();
    expect(root.querySelector('[aria-label="View"]')).toBeNull();
    expect(root.querySelector('[aria-label="Show"]')).not.toBeNull();
  });
});
