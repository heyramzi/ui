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
  it("is one row that never wraps", () => {
    const root = render({ search: "", tabs, tab: "all", views, view: "list" });
    const row = root.querySelector(".flex");
    expect(row?.classList.contains("flex-nowrap")).toBe(true);
    expect(row?.classList.contains("flex-wrap")).toBe(false);
  });

  it("draws search, tabs and view twice, one for each width, and queries pick one", () => {
    const root = render({ search: "", tabs, tab: "all", views, view: "list" });
    const wide = root.querySelectorAll(".\\@max-2xl\\/toolbar\\:hidden");
    const narrow = root.querySelectorAll(".\\@2xl\\/toolbar\\:hidden");
    expect(wide.length).toBe(3);
    expect(narrow.length).toBe(3);
  });

  it("names the narrow controls so a screen reader can find them", () => {
    const root = render({ search: "", tabs, tab: "all", views, view: "list", searchLabel: "Find", tabsLabel: "Status", viewLabel: "Layout" });
    for (const label of ["Find", "Status", "Layout"]) {
      expect(root.querySelector(`button[aria-label="${label}"]`), label).not.toBeNull();
    }
  });

  it("shows the current tab on the narrow menu trigger", async () => {
    const root = render({ search: "", tabs, tab: "open", views, view: "list" });
    await tick();
    expect(root.querySelector('button[aria-label="Show"]')?.textContent?.trim()).toBe("Open");
  });

  it("leaves out what it isn't given", () => {
    const root = render({ tabs, tab: "all" });
    expect(root.querySelector('button[aria-label="Search"]')).toBeNull();
    expect(root.querySelector('button[aria-label="View"]')).toBeNull();
    expect(root.querySelector('button[aria-label="Show"]')).not.toBeNull();
  });
});
