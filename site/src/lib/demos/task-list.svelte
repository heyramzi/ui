<script lang="ts">
  import { TaskList, type KanbanMove } from "@heyramzi/ui/tasks";

  type Task = { id: string; status: string; title: string; owner: string; boardOrder: string };

  const groups = [
    { id: "todo", label: "To do", hue: "var(--color-muted-foreground)" },
    { id: "doing", label: "In progress", hue: "var(--color-info)" },
    { id: "done", label: "Done", hue: "var(--color-success)" },
  ];

  let tasks = $state<Task[]>([
    { id: "l1", status: "todo", title: "Draft the release notes", owner: "Ada", boardOrder: "a0" },
    { id: "l2", status: "todo", title: "Review the pricing page", owner: "Bo", boardOrder: "a1" },
    { id: "l3", status: "doing", title: "Ship the onboarding flow", owner: "Cleo", boardOrder: "a0" },
    { id: "l4", status: "done", title: "Publish the changelog", owner: "Dana", boardOrder: "a0" },
  ]);

  function onMove(id: string, move: KanbanMove) {
    tasks = tasks.map((t) => t.id === id ? { ...t, status: move.columnId, boardOrder: move.boardOrder ?? t.boardOrder } : t);
  }
</script>

<div class="flex h-105 w-full flex-col">
  <TaskList {groups} items={tasks} getId={(t) => t.id} getGroup={(t) => t.status} boardOrder={(t) => t.boardOrder} {onMove}>
    {#snippet renderRow(task)}
      <div class="flex h-10 items-center gap-3 px-2 text-sm">
        <span class="min-w-0 flex-1 truncate">{task.title}</span>
        <span class="text-xs text-muted-foreground">{task.owner}</span>
      </div>
    {/snippet}
  </TaskList>
</div>
