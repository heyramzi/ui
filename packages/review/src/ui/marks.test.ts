import StatusDot from "@heyramzi/tasks/status-dot";
import { flushSync, mount, unmount } from "svelte";
import { afterEach, describe, expect, it } from "vitest";
import { MARKS, type Mark } from "#src/ui/marks.js";

let app: ReturnType<typeof mount> | undefined;
afterEach(() => {
  if (app) void unmount(app);
  app = undefined;
  document.body.innerHTML = "";
});

function draw(mark: Mark): SVGElement {
  app = mount(StatusDot, {
    target: document.body,
    props: { statuses: MARKS, status: mark, animate: false },
  });
  flushSync();
  return document.body.querySelector("svg")!;
}

describe("the review marks on the shared status dot", () => {
  it("draws All as a dashed ring with no slice", () => {
    const svg = draw("all");
    expect(svg.querySelectorAll("circle")).toHaveLength(1);
    expect(svg.querySelector("circle")?.getAttribute("class")).toContain("sd-dashed");
  });

  it("fills a quarter for Needs you and half for Agents", () => {
    const quarter = draw("needs").querySelectorAll("circle")[1]?.getAttribute("stroke-dasharray");
    void unmount(app!);
    const half = draw("agents").querySelectorAll("circle")[1]?.getAttribute("stroke-dasharray");
    const share = (dash?: string | null) => {
      const [on, off] = (dash ?? "").split(" ").map(Number);
      return on! / (on! + off!);
    };
    expect(share(quarter)).toBeCloseTo(0.25);
    expect(share(half)).toBeCloseTo(0.5);
  });

  it("ticks Done and Kept, crosses Skipped, and leaves To do an empty ring", () => {
    expect(draw("done").querySelector("polyline")).not.toBeNull();
    void unmount(app!);
    expect(draw("kept").querySelector("polyline")).not.toBeNull();
    void unmount(app!);
    expect(draw("skipped").querySelectorAll("line")).toHaveLength(2);
    void unmount(app!);
    const todo = draw("todo");
    expect(todo.querySelectorAll("circle")).toHaveLength(1);
    expect(todo.querySelector("circle")?.getAttribute("stroke")).toBe("var(--warn-text)");
  });
});
