import { createRawSnippet, flushSync, mount, tick, unmount } from "svelte";
import { describe, expect, it } from "vite-plus/test";
import TaskList from "#src/work/task-list.svelte";
import type { KanbanMove } from "#src/work/kanban-types.js";

type Task = { id: string; groupId: string; title: string; boardOrder: string };

const groups = [
  { id: "todo", label: "To do" },
  { id: "doing", label: "In progress" },
  { id: "done", label: "Done" },
];

const renderRow = createRawSnippet((task: () => Task) => ({
  render: () => `<p>${task().title}</p>`,
}));

function render(collapsed: string[] = []) {
  const props = $state({
    groups,
    collapsed,
    items: [
      { id: "t1", groupId: "todo", title: "Draft notes", boardOrder: "a0" },
      { id: "t2", groupId: "doing", title: "Ship flow", boardOrder: "a0" },
      { id: "t3", groupId: "done", title: "Close out", boardOrder: "a0" },
    ] as Task[],
    getId: (t: Task) => t.id,
    getGroup: (t: Task) => t.groupId,
    boardOrder: (t: Task) => t.boardOrder,
    renderRow,
    onMove: (id: string, move: KanbanMove) => {
      props.items = props.items.map((t) =>
        t.id === id ? { ...t, groupId: move.columnId, boardOrder: move.boardOrder ?? "" } : t,
      );
    },
  });
  const target = document.createElement("div");
  document.body.appendChild(target);
  const app = mount(TaskList<Task>, { target, props });
  flushSync();
  return {
    target,
    row: (id: string) => target.querySelector<HTMLElement>(`[data-task-row="${id}"]`),
    done: () => {
      void unmount(app);
      target.remove();
    },
  };
}

// Waits out the list's await of onMove and its tick, then Svelte's flush.
async function settle() {
  for (let i = 0; i < 4; i++) await tick();
  flushSync();
}

// Svelte sets inert as a property, and jsdom doesn't reflect it to the attribute.
function insideInert(el: HTMLElement | null): boolean {
  for (let node = el; node; node = node.parentElement) if (node.inert) return true;
  return false;
}

function pressAltDown(el: HTMLElement | null) {
  el?.dispatchEvent(
    new KeyboardEvent("keydown", { key: "ArrowDown", altKey: true, bubbles: true }),
  );
}

describe("TaskList keyboard move", () => {
  it("keeps focus on the moved row in its new group and announces the move", async () => {
    const { target, row, done } = render();
    row("t1")?.focus();
    pressAltDown(row("t1"));
    await settle();

    const moved = row("t1");
    expect(moved?.closest('section[aria-label="In progress"]')).not.toBeNull();
    expect(document.activeElement).toBe(moved);
    expect(target.querySelector('[role="status"]')?.textContent).toBe("Moved to In progress");
    done();
  });

  it("opens a folded group a row moves into, so the row keeps focus", async () => {
    const { row, done } = render(["doing"]);
    row("t1")?.focus();
    pressAltDown(row("t1"));
    await settle();

    const moved = row("t1");
    expect(insideInert(moved)).toBe(false);
    expect(document.activeElement).toBe(moved);
    done();
  });
});

describe("TaskList folds and names", () => {
  it("makes a folded group's rows inert, so Tab skips them", () => {
    const { row, done } = render(["done"]);
    expect(insideInert(row("t3"))).toBe(true);
    expect(insideInert(row("t1"))).toBe(false);
    done();
  });

  it("names a row by its own text and describes it with the move hint", () => {
    const { row, done } = render();
    const el = row("t1");
    expect(el?.hasAttribute("aria-label")).toBe(false);
    expect(el?.getAttribute("aria-labelledby")).toBe(el?.id);
    const hint = document.getElementById(el?.getAttribute("aria-describedby") ?? "");
    expect(hint?.textContent).toBe("Press Alt plus Up or Down arrow to move between groups.");
    done();
  });
});
