import { createRawSnippet, flushSync, mount, tick, unmount } from "svelte";
import { describe, expect, it } from "vite-plus/test";
import KanbanBoard from "#src/work/kanban-board.svelte";
import type { KanbanMove } from "#src/work/kanban-types.js";

type Task = { id: string; columnId: string; title: string; boardOrder: string };

const columns = [
  { id: "todo", label: "To do" },
  { id: "doing", label: "In progress" },
  { id: "done", label: "Done" },
];

const renderCard = createRawSnippet((task: () => Task) => ({
  render: () => `<p>${task().title}</p>`,
}));

function render() {
  const props = $state({
    columns,
    items: [
      { id: "k1", columnId: "todo", title: "Draft notes", boardOrder: "a0" },
      { id: "k2", columnId: "doing", title: "Ship flow", boardOrder: "a0" },
    ] as Task[],
    getId: (t: Task) => t.id,
    getColumn: (t: Task) => t.columnId,
    boardOrder: (t: Task) => t.boardOrder,
    renderCard,
    onMove: (id: string, move: KanbanMove) => {
      props.items = props.items.map((t) =>
        t.id === id ? { ...t, columnId: move.columnId, boardOrder: move.boardOrder ?? "" } : t,
      );
    },
  });
  const target = document.createElement("div");
  document.body.appendChild(target);
  const app = mount(KanbanBoard<Task>, { target, props });
  flushSync();
  return {
    target,
    card: (id: string) => target.querySelector<HTMLElement>(`[data-kanban-card="${id}"]`),
    done: () => {
      void unmount(app);
      target.remove();
    },
  };
}

// Waits out the board's await of onMove and its tick, then Svelte's flush.
async function settle() {
  for (let i = 0; i < 4; i++) await tick();
  flushSync();
}

describe("KanbanBoard keyboard move", () => {
  it("keeps focus on the moved card in its new column and announces the move", async () => {
    const { target, card, done } = render();
    const before = card("k1");
    before?.focus();
    before?.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", altKey: true, bubbles: true }),
    );
    await settle();

    const moved = card("k1");
    expect(moved?.closest('[aria-label="In progress"]')).not.toBeNull();
    expect(document.activeElement).toBe(moved);
    expect(target.querySelector('[role="status"]')?.textContent).toBe("Moved to In progress");
    done();
  });

  it("puts every card inside a list", () => {
    const { target, done } = render();
    for (const item of target.querySelectorAll('[role="listitem"]')) {
      expect(item.parentElement?.getAttribute("role")).toBe("list");
    }
    done();
  });
});
