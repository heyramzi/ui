import { mount, tick, unmount } from "svelte";
import { afterEach, describe, expect, it } from "vite-plus/test";
import TaskGantt from "#src/work/task-gantt.svelte";
import type { GanttChange } from "#src/work/task-types.js";

type Task = { id: string; title: string; start?: string; end?: string; parent?: string };
const items: Task[] = [
  { id: "a", title: "Design", start: "2026-10-05", end: "2026-10-09" },
  { id: "p", title: "Parent", parent: undefined },
  { id: "c", title: "Child", start: "2026-10-14", end: "2026-10-15", parent: "p" },
];

let target: HTMLElement;
let app: Record<string, unknown> | undefined;

function render(extra: Record<string, unknown> = {}) {
  target = document.createElement("div");
  document.body.append(target);
  app = mount(TaskGantt<Task>, {
    target,
    props: {
      items,
      getId: (t: Task) => t.id,
      getTitle: (t: Task) => t.title,
      getStart: (t: Task) => t.start,
      getEnd: (t: Task) => t.end,
      today: "2026-10-16",
      ...extra,
    },
  }) as Record<string, unknown>;
  return target;
}

afterEach(() => {
  if (app) void unmount(app);
  target?.remove();
  app = undefined;
});

describe("TaskGantt", () => {
  it("draws a bar per dated task with its dates in the label", () => {
    const root = render();
    const bars = root.querySelectorAll("[data-bar]");
    expect(bars).toHaveLength(2);
    expect(bars[0]?.getAttribute("aria-label")).toContain("Oct 5 to Oct 9, 5 days");
  });

  it("moves a bar a day on an arrow key, and grows it on shift plus arrow", async () => {
    const changes: GanttChange[] = [];
    const root = render({ onChange: (_id: string, change: GanttChange) => changes.push(change) });
    const bar = root.querySelector("[data-bar]");
    bar?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    bar?.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", shiftKey: true, bubbles: true }),
    );
    await tick();
    expect(changes).toEqual([
      { start: "2026-10-06", end: "2026-10-10" },
      { start: "2026-10-05", end: "2026-10-10" },
    ]);
  });

  it("selects on Enter and stays read-only without onChange", async () => {
    const picked: string[] = [];
    const root = render({ onSelect: (id: string) => picked.push(id) });
    const bar = root.querySelector("[data-bar]");
    bar?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    bar?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await tick();
    expect(picked).toEqual(["a"]);
    expect(root.querySelectorAll(".g-handle")).toHaveLength(0);
  });

  it("hides a folded parent's children", () => {
    const nested = render({ getParent: (t: Task) => t.parent, collapsed: ["p"] });
    expect(nested.querySelectorAll('[role="listitem"]')).toHaveLength(2);
    expect(nested.querySelector('button[aria-expanded="false"]')).not.toBeNull();
  });
});
