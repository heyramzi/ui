<script lang="ts">
  import { TaskGantt, addDays, todayIso, type GanttChange } from "@heyramzi/ui/tasks";

  type Task = { id: string; title: string; start: string; end: string; progress: number; dependsOn?: string[] };

  const today = todayIso();

  let tasks = $state<Task[]>([
    { id: "g1", title: "Research", start: addDays(today, -6), end: addDays(today, -2), progress: 1 },
    { id: "g2", title: "Design", start: addDays(today, -1), end: addDays(today, 3), progress: 0.4, dependsOn: ["g1"] },
    { id: "g3", title: "Build", start: addDays(today, 4), end: addDays(today, 10), progress: 0, dependsOn: ["g2"] },
    { id: "g4", title: "Launch", start: addDays(today, 11), end: addDays(today, 11), progress: 0, dependsOn: ["g3"] },
  ]);

  function onChange(id: string, change: GanttChange) {
    tasks = tasks.map((t) => (t.id === id ? { ...t, ...change } : t));
  }
</script>

<div class="flex h-105 w-full flex-col">
  <TaskGantt
    items={tasks}
    getId={(t) => t.id}
    getTitle={(t) => t.title}
    getStart={(t) => t.start}
    getEnd={(t) => t.end}
    getProgress={(t) => t.progress}
    getDependsOn={(t) => t.dependsOn}
    {today}
    labelWidth={140}
    {onChange}
  />
</div>
