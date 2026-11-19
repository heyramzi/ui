import { mount, tick, unmount, type ComponentProps } from "svelte";
import { afterEach, describe, expect, it } from "vite-plus/test";
import Folded from "#src/components/segmented/segmented-folded.test.svelte";

let target: HTMLElement;
let app: Record<string, unknown> | undefined;

async function triggerName(props: ComponentProps<typeof Folded>) {
  target = document.createElement("div");
  document.body.append(target);
  app = mount(Folded, { target, props }) as Record<string, unknown>;
  await tick();
  return target.querySelector("button")?.getAttribute("aria-label");
}

afterEach(() => {
  if (app) void unmount(app);
  target?.remove();
  app = undefined;
});

describe("SegmentedFilter folded into a picker", () => {
  // axe's label-content-name-mismatch failed the Toolbar page when the name left out "24".
  it("names the trigger with every word it shows, the count included", async () => {
    const name = await triggerName({
      options: [
        { value: "all", label: "All", count: 24 },
        { value: "open", label: "Open", count: 9 },
      ],
      value: "all",
      ariaLabel: "Show",
    });
    expect(name).toBe("Show: All 24");
  });

  it("leaves the count out when the option has none", async () => {
    const name = await triggerName({
      options: [
        { value: "list", label: "List" },
        { value: "grid", label: "Grid" },
      ],
      value: "list",
      ariaLabel: "View",
    });
    expect(name).toBe("View: List");
  });
});
