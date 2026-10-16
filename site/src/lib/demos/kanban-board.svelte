<script lang="ts">
  import { KanbanBoard, type KanbanMove } from "@heyramzi/board";

  type Task = { id: string; columnId: string; title: string; owner: string; boardOrder: string };

  const columns = [
    { id: "todo", label: "To do", hue: "var(--color-muted-foreground)" },
    { id: "doing", label: "In progress", hue: "var(--color-info)" },
    { id: "done", label: "Done", hue: "var(--color-success)" },
  ];

  let tasks = $state<Task[]>([
    { id: "k1", columnId: "todo", title: "Draft the release notes", owner: "Ada", boardOrder: "a0" },
    { id: "k2", columnId: "todo", title: "Review the pricing page", owner: "Bo", boardOrder: "a1" },
    { id: "k3", columnId: "doing", title: "Ship the onboarding flow", owner: "Cleo", boardOrder: "a0" },
    { id: "k4", columnId: "done", title: "Publish the changelog", owner: "Dana", boardOrder: "a0" },
  ]);

  function onMove(id: string, move: KanbanMove) {
    tasks = tasks.map((t) => t.id === id ? { ...t, columnId: move.columnId, boardOrder: move.boardOrder ?? t.boardOrder } : t);
  }
</script>

<div class="flex h-105 w-full flex-col gap-2">
  <KanbanBoard {columns} items={tasks} getId={(t) => t.id} getColumn={(t) => t.columnId} boardOrder={(t) => t.boardOrder} {onMove}>
    {#snippet renderCard(task)}
      <article class="rounded-xl border border-border bg-card p-2.5 shadow-sm">
        <p class="text-sm leading-snug">{task.title}</p>
        <p class="mt-1.5 text-xs text-muted-foreground">{task.owner}</p>
      </article>
    {/snippet}
  </KanbanBoard>
</div>
