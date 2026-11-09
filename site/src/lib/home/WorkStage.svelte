<script lang="ts">
	import { AnimatedTabs } from "@heyramzi/ui/components/segmented";
	import { CopyButton } from "@heyramzi/ui/components/copy";
	import LazyDemo from "#lib/home/LazyDemo.svelte";

	// The work kit as the first thing on the page: one set of tasks seen as a board, a list or
	// a timeline, each the real component at its real size. The import line follows the view.
	const views = {
		board: {
			label: "Board",
			part: "KanbanBoard",
			href: "/components/kanban-board",
			load: () => import("#lib/demos/kanban-board.svelte"),
		},
		list: {
			label: "List",
			part: "TaskList",
			href: "/components/task-list",
			load: () => import("#lib/demos/task-list.svelte"),
		},
		gantt: {
			label: "Gantt",
			part: "TaskGantt",
			href: "/components/task-gantt",
			load: () => import("#lib/demos/task-gantt.svelte"),
		},
	} as const;
	type View = keyof typeof views;

	const tabs = (Object.keys(views) as View[]).map((value) => ({
		value,
		label: views[value].label,
	}));
	let view = $state<View>("board");
	const current = $derived(views[view]);
	const line = $derived(`import { ${current.part} } from "@heyramzi/ui/work";`);
</script>

<section aria-label="Work kit" class="flex flex-col gap-3">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<AnimatedTabs {tabs} bind:value={view} ariaLabel="Work view" />
		<div class="flex min-w-0 items-center gap-1 rounded-(--radius-lg) bg-muted py-1 pl-3 pr-1">
			<code class="truncate font-mono text-xs text-muted-foreground">{line}</code>
			<CopyButton value={line} label="Copy the import" size="sm" />
		</div>
	</div>
	<div class="rounded-(--radius-xl) bg-card p-3 shadow-(--elev-card) sm:p-5">
		{#key view}
			<LazyDemo load={current.load} height={420} label={current.part} />
		{/key}
	</div>
	<p class="px-1 text-sm text-muted-foreground">
		Drag a card to another column, or a bar along the timeline.
		<a href={current.href} class="text-foreground underline-offset-4 hover:underline"
			>{current.part} docs</a
		>
	</p>
</section>
