<script lang="ts">
	import KanbanBoard from "./kanban-board.svelte";
	import StatusBadge from "./status-badge.svelte";
	import StatusDot from "./status-dot.svelte";
	import { salesStatuses } from "./presets/sales.js";
	import type { KanbanMove } from "./kanban-types.js";

	type Priority = "low" | "medium" | "high";

	type Task = {
		id: string;
		columnId: string;
		title: string;
		assignee: string;
		priority: Priority;
		boardOrder: string;
	};

	const columns = [
		{ id: "todo", label: "To do", hue: "var(--color-muted-foreground)" },
		{ id: "doing", label: "In progress", hue: "var(--color-info)" },
		{ id: "review", label: "Review", hue: "var(--color-warning)", droppable: false },
		{ id: "done", label: "Done", hue: "var(--color-success)" },
	];

	let tasks = $state<Task[]>([
		{ id: "t1", columnId: "todo", title: "Draft the launch checklist", assignee: "Ada", priority: "high", boardOrder: "a0" },
		{ id: "t2", columnId: "todo", title: "Collect customer quotes", assignee: "Bo", priority: "medium", boardOrder: "a1" },
		{ id: "t3", columnId: "todo", title: "Pick a shipping date", assignee: "Cleo", priority: "low", boardOrder: "a2" },
		{ id: "t4", columnId: "doing", title: "Build the pricing page", assignee: "Ada", priority: "high", boardOrder: "a0" },
		{ id: "t5", columnId: "doing", title: "Write onboarding email", assignee: "Dana", priority: "medium", boardOrder: "a1" },
		{ id: "t6", columnId: "done", title: "Set up analytics", assignee: "Bo", priority: "low", boardOrder: "a0" },
	]);

	let sortKey = $state("manual");

	const sortKeys = [
		{ id: "title", label: "Title", compare: (a: Task, b: Task) => a.title.localeCompare(b.title) },
		{ id: "assignee", label: "Assignee", compare: (a: Task, b: Task) => a.assignee.localeCompare(b.assignee) },
	];

	const priorityClass: Record<Priority, string> = {
		low: "bg-muted text-muted-foreground",
		medium: "bg-warning/15 text-warning-700 dark:text-warning-400",
		high: "bg-destructive/15 text-destructive",
	};

	function onMove(id: string, move: KanbanMove) {
		tasks = tasks.map((task) =>
			task.id === id
				? { ...task, columnId: move.columnId, boardOrder: move.boardOrder ?? task.boardOrder }
				: task,
		);
	}
</script>

<div class="flex flex-col gap-6 rounded-xl border border-border bg-background p-4">
	<div class="flex h-[560px] flex-col gap-3">
		<div class="flex items-center gap-2">
			<label for="board-sort" class="text-xs font-medium text-muted-foreground">Sort</label>
			<select
				id="board-sort"
				bind:value={sortKey}
				class="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
			>
				<option value="manual">Manual</option>
				{#each sortKeys as key (key.id)}
					<option value={key.id}>{key.label}</option>
				{/each}
			</select>
			<span class="text-xs text-muted-foreground/60">Drag a card between columns. Review is display only.</span>
		</div>

		<KanbanBoard
			{columns}
			items={tasks}
			getId={(task) => task.id}
			getColumn={(task) => task.columnId}
			{sortKey}
			{sortKeys}
			boardOrder={(task) => task.boardOrder}
			onMove={onMove}
		>
			{#snippet renderCard(task, ctx)}
				<article class="rounded-xl border border-border bg-card p-2.5 text-card-foreground shadow-sm">
					<p class="text-sm leading-snug">{task.title}</p>
					<div class="mt-2 flex items-center gap-2 text-xs">
						<span class="text-muted-foreground">{task.assignee}</span>
						<span class="ml-auto rounded-full px-1.5 py-0.5 font-medium capitalize {priorityClass[task.priority]}">
							{task.priority}
						</span>
					</div>
					<p class="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground/50">
						{ctx.columnId} · #{ctx.index + 1}
					</p>
				</article>
			{/snippet}
		</KanbanBoard>
	</div>

	<section class="flex flex-col gap-2 border-t border-border pt-4">
		<h3 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status badges</h3>
		<div class="flex flex-wrap items-center gap-2">
			{#each salesStatuses.ids as id (id)}
				<StatusBadge statuses={salesStatuses} status={id} />
			{/each}
		</div>
		<ul class="mt-1 flex flex-col gap-1.5">
			{#each salesStatuses.ids.slice(0, 3) as id (id)}
				<li class="flex items-center gap-3 text-sm">
					<StatusDot statuses={salesStatuses} status={id} />
					<span class="text-foreground">{salesStatuses.label(id)}</span>
				</li>
			{/each}
		</ul>
	</section>
</div>
