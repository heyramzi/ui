<script lang="ts">
	import KanbanBoard from "./kanban-board.svelte";
	import TaskList from "./task-list.svelte";
	import TaskGantt from "./task-gantt.svelte";
	import TaskViewSwitch from "./task-view-switch.svelte";
	import StatusBadge from "./status-badge.svelte";
	import StatusDot from "./status-dot.svelte";
	import BoardIcon from "./icons/board-icon.svelte";
	import ListIcon from "./icons/list-icon.svelte";
	import GanttIcon from "./icons/gantt-icon.svelte";
	import { defineStatuses } from "./define-statuses.js";
	import { addDays, dayNumber, todayIso } from "./dates.js";
	import { salesStatuses } from "./presets/sales.js";
	import type { KanbanMove } from "./kanban-types.js";
	import type { GanttChange } from "./task-types.js";
	import TimeTracker from "./time/time-tracker.svelte";
	import TimeChip from "./time/time-chip.svelte";
	import type { TimeLogInput, TimeStopInfo } from "./time/time-types.js";

	type Priority = "low" | "medium" | "high";

	type Task = {
		id: string;
		status: string;
		title: string;
		assignee: string;
		priority: Priority;
		boardOrder: string;
		start: string;
		end: string;
		dependsOn?: string[];
	};

	const statuses = defineStatuses({
		todo: { label: "To do", tone: "neutral", variant: "open" },
		doing: { label: "In progress", tone: "info", variant: "progress", progress: 0.5 },
		review: { label: "Review", tone: "warning", variant: "progress", progress: 0.75 },
		done: { label: "Done", tone: "success", variant: "completed" },
	});

	const columns = [
		{ id: "todo", label: "To do", hue: "var(--color-muted-foreground)" },
		{ id: "doing", label: "In progress", hue: "var(--color-info)" },
		{ id: "review", label: "Review", hue: "var(--color-warning)" },
		{ id: "done", label: "Done", hue: "var(--color-success)" },
	];

	const progressByStatus: Record<string, number> = { todo: 0, doing: 0.45, review: 0.8, done: 1 };

	// Dates hang off today, so the timeline always opens on live work.
	const today = todayIso();
	const on = (days: number) => addDays(today, days);

	let tasks = $state<Task[]>([
		{ id: "t1", status: "done", title: "Set up analytics", assignee: "Bo", priority: "low", boardOrder: "a0", start: on(-12), end: on(-8) },
		{ id: "t2", status: "done", title: "Interview five customers", assignee: "Cleo", priority: "medium", boardOrder: "a1", start: on(-10), end: on(-4) },
		{ id: "t3", status: "review", title: "Write the pricing page", assignee: "Ada", priority: "high", boardOrder: "a0", start: on(-5), end: on(1), dependsOn: ["t2"] },
		{ id: "t4", status: "doing", title: "Build the onboarding flow", assignee: "Dana", priority: "high", boardOrder: "a0", start: on(-3), end: on(5), dependsOn: ["t1"] },
		{ id: "t5", status: "doing", title: "Draft the launch email", assignee: "Bo", priority: "medium", boardOrder: "a1", start: on(0), end: on(3), dependsOn: ["t3"] },
		{ id: "t6", status: "todo", title: "Record the demo video", assignee: "Cleo", priority: "medium", boardOrder: "a0", start: on(4), end: on(8), dependsOn: ["t4"] },
		{ id: "t7", status: "todo", title: "Pick a shipping date", assignee: "Ada", priority: "low", boardOrder: "a1", start: on(6), end: on(6) },
		{ id: "t8", status: "todo", title: "Launch on Product Hunt", assignee: "Dana", priority: "high", boardOrder: "a2", start: on(10), end: on(11), dependsOn: ["t5", "t6"] },
	]);

	const views = [
		{ id: "board", label: "Board", icon: BoardIcon },
		{ id: "list", label: "List", icon: ListIcon },
		{ id: "gantt", label: "Gantt", icon: GanttIcon },
	];

	let view = $state("board");
	let sortKey = $state("manual");
	let scale = $state<"days" | "weeks">("days");

	const sortKeys = [
		{ id: "title", label: "Title", compare: (a: Task, b: Task) => a.title.localeCompare(b.title) },
		{ id: "assignee", label: "Assignee", compare: (a: Task, b: Task) => a.assignee.localeCompare(b.assignee) },
		{ id: "due", label: "Due date", compare: (a: Task, b: Task) => a.end.localeCompare(b.end) },
	];

	const priorityClass: Record<Priority, string> = {
		low: "bg-muted text-muted-foreground",
		medium: "bg-warning/15 text-warning-700 dark:text-warning-400",
		high: "bg-destructive/15 text-destructive",
	};

	const people: Record<string, string> = {
		Ada: "oklch(0.72 0.12 280)",
		Bo: "oklch(0.74 0.12 160)",
		Cleo: "oklch(0.76 0.12 60)",
		Dana: "oklch(0.72 0.13 20)",
	};

	const dueFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

	function due(task: Task): { label: string; late: boolean } {
		const late = task.status !== "done" && dayNumber(task.end) < dayNumber(today);
		return { label: dueFormat.format(new Date(`${task.end}T00:00:00Z`)), late };
	}

	function onMove(id: string, move: KanbanMove) {
		tasks = tasks.map((task) =>
			task.id === id
				? { ...task, status: move.columnId, boardOrder: move.boardOrder ?? task.boardOrder }
				: task,
		);
	}

	function onChange(id: string, change: GanttChange) {
		tasks = tasks.map((task) => (task.id === id ? { ...task, ...change } : task));
	}

	// ---- time tracking, an option the host turns on
	type Entry = { id: string; taskId: string; person: string; day: string; minutes: number; note?: string };

	const estimates: Record<string, number> = { t3: 360, t4: 480, t5: 180, t6: 240 };

	let tracking = $state(true);
	let timeTaskId = $state("t4");
	let nextEntry = 100;
	let entries = $state<Entry[]>([
		{ id: "e1", taskId: "t4", person: "Dana", day: on(-3), minutes: 150, note: "Signup and email step" },
		{ id: "e2", taskId: "t4", person: "Ada", day: on(-2), minutes: 95, note: "Copy for the welcome screen" },
		{ id: "e3", taskId: "t4", person: "Dana", day: on(-2), minutes: 125, note: "Progress bar and empty states" },
		{ id: "e4", taskId: "t4", person: "Dana", day: on(-1), minutes: 80 },
		{ id: "e5", taskId: "t3", person: "Ada", day: on(-5), minutes: 210, note: "First draft" },
		{ id: "e6", taskId: "t3", person: "Bo", day: on(-3), minutes: 95, note: "Pricing table" },
		{ id: "e7", taskId: "t3", person: "Ada", day: on(-1), minutes: 85, note: "Review changes" },
		{ id: "e8", taskId: "t5", person: "Bo", day: on(0), minutes: 40 },
		{ id: "e9", taskId: "t1", person: "Bo", day: on(-12), minutes: 60 },
	]);
	// The host keeps the running timer. A reload would read it back from storage.
	let timer = $state<{ taskId: string; startedAt: number } | null>({
		taskId: "t4",
		startedAt: Date.now() - (12 * 60 + 41) * 1000,
	});

	let minutesByTask = $derived.by(() => {
		const totals: Record<string, number> = {};
		for (const entry of entries) totals[entry.taskId] = (totals[entry.taskId] ?? 0) + entry.minutes;
		return totals;
	});
	let timeEntries = $derived(entries.filter((entry) => entry.taskId === timeTaskId));
	let timeRunning = $derived(timer?.taskId === timeTaskId ? { startedAt: timer.startedAt } : null);

	function addEntry(taskId: string, day: string, minutes: number, note?: string) {
		entries = [{ id: `e${nextEntry++}`, taskId, person: "Dana", day, minutes, note }, ...entries];
	}

	function onLog(input: TimeLogInput) {
		addEntry(timeTaskId, input.day, input.minutes, input.note);
	}

	function onStop(info: TimeStopInfo) {
		if (timer) addEntry(timer.taskId, info.day, info.minutes);
		timer = null;
	}

	const listGrid = "grid grid-cols-[minmax(0,1fr)_7rem_5.5rem_4.5rem] items-center gap-3 max-sm:grid-cols-[minmax(0,1fr)_4.5rem]";
</script>

{#snippet avatar(name: string)}
	<span
		class="grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white"
		style:background={people[name] ?? "var(--color-muted-foreground)"}
		aria-hidden="true"
	>
		{name[0]}
	</span>
{/snippet}

<div class="flex flex-col gap-6 rounded-xl border border-border bg-background p-4">
	<div class="flex h-[600px] flex-col gap-3">
		<div class="flex flex-wrap items-center gap-2">
			<TaskViewSwitch {views} bind:value={view} label="Task view" />
			<div class="ml-auto flex items-center gap-3">
				<label class="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted-foreground">
					<input type="checkbox" bind:checked={tracking} class="size-3.5 accent-[var(--tone-accent,var(--color-primary))]" />
					Time tracking
				</label>
				{#if view === "gantt"}
					<TaskViewSwitch
						views={[
							{ id: "days", label: "Days" },
							{ id: "weeks", label: "Weeks" },
						]}
						bind:value={scale}
						label="Timeline scale"
					/>
				{:else}
					<label for="tasks-sort" class="text-xs font-medium text-muted-foreground">Sort</label>
					<select
						id="tasks-sort"
						bind:value={sortKey}
						class="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
					>
						<option value="manual">Manual</option>
						{#each sortKeys as key (key.id)}
							<option value={key.id}>{key.label}</option>
						{/each}
					</select>
				{/if}
			</div>
		</div>

		{#key view}
			<div class="tasks-view flex min-h-0 flex-1 flex-col">
				{#if view === "board"}
					<KanbanBoard
						{columns}
						items={tasks}
						getId={(task) => task.id}
						getColumn={(task) => task.status}
						{sortKey}
						{sortKeys}
						boardOrder={(task) => task.boardOrder}
						{onMove}
					>
						{#snippet renderCard(task)}
							{@const d = due(task)}
							<article class="rounded-xl border border-border bg-card p-2.5 text-card-foreground shadow-sm">
								<p class="text-sm leading-snug">{task.title}</p>
								<div class="mt-2.5 flex items-center gap-2 text-xs">
									{@render avatar(task.assignee)}
									<span class={d.late ? "font-medium text-destructive" : "text-muted-foreground"}>{d.label}</span>
									{#if tracking}
										<TimeChip minutes={minutesByTask[task.id] ?? 0} estimate={estimates[task.id]} running={timer?.taskId === task.id} />
									{/if}
									<span class="ml-auto rounded-full px-1.5 py-0.5 font-medium capitalize {priorityClass[task.priority]}">
										{task.priority}
									</span>
								</div>
							</article>
						{/snippet}
					</KanbanBoard>
				{:else if view === "list"}
					<TaskList
						groups={columns}
						items={tasks}
						getId={(task) => task.id}
						getGroup={(task) => task.status}
						{sortKey}
						{sortKeys}
						boardOrder={(task) => task.boardOrder}
						{onMove}
					>
						{#snippet head()}
							<div class="{listGrid} w-full px-3.5">
								<span class="pl-6">Task</span>
								<span class="max-sm:hidden">Assignee</span>
								<span class="max-sm:hidden">Priority</span>
								<span class="text-right">Due</span>
							</div>
						{/snippet}
						{#snippet renderRow(task)}
							{@const d = due(task)}
							<div class="{listGrid} h-10 px-2 text-sm">
								<span class="flex min-w-0 items-center gap-2.5">
									{#key task.status}
										<StatusDot statuses={statuses} status={task.status} />
									{/key}
									<span class="truncate" class:text-muted-foreground={task.status === "done"} class:line-through={task.status === "done"}>
										{task.title}
									</span>
									{#if tracking}
										<TimeChip minutes={minutesByTask[task.id] ?? 0} estimate={estimates[task.id]} running={timer?.taskId === task.id} />
									{/if}
								</span>
								<span class="flex min-w-0 items-center gap-2 text-muted-foreground max-sm:hidden">
									{@render avatar(task.assignee)}
									<span class="truncate">{task.assignee}</span>
								</span>
								<span class="max-sm:hidden">
									<span class="rounded-full px-1.5 py-0.5 text-xs font-medium capitalize {priorityClass[task.priority]}">
										{task.priority}
									</span>
								</span>
								<span class="text-right text-xs tabular-nums {d.late ? 'font-medium text-destructive' : 'text-muted-foreground'}">
									{d.label}
								</span>
							</div>
						{/snippet}
					</TaskList>
				{:else}
					<TaskGantt
						items={tasks}
						getId={(task) => task.id}
						getTitle={(task) => task.title}
						getStart={(task) => task.start}
						getEnd={(task) => task.end}
						getProgress={(task) => progressByStatus[task.status]}
						getDependsOn={(task) => task.dependsOn}
						groups={columns}
						getGroup={(task) => task.status}
						{today}
						dayWidth={scale === "days" ? 32 : 14}
						labelWidth={220}
						{onChange}
					>
						{#snippet renderLabel(task)}
							<StatusDot statuses={statuses} status={task.status} />
							<span class="min-w-0 flex-1 truncate">{task.title}</span>
							{@render avatar(task.assignee)}
						{/snippet}
					</TaskGantt>
				{/if}
			</div>
		{/key}

		<p class="text-xs text-muted-foreground/70">
			{#if view === "board"}
				Drag a card between columns, or focus one and press Alt plus Left or Right.
			{:else if view === "list"}
				Drag a row between groups, or focus one and press Alt plus Up or Down.
			{:else}
				Drag a bar to move it, or its edges to resize. Arrow keys nudge a focused bar a day.
			{/if}
		</p>
	</div>

	{#if tracking}
		<section class="flex flex-col gap-3 border-t border-border pt-4">
			<div class="flex items-center justify-between gap-3">
				<h3 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Task time</h3>
				<select
					bind:value={timeTaskId}
					aria-label="Task"
					class="h-8 max-w-[60%] rounded-md border border-border bg-background px-2 text-xs text-foreground"
				>
					{#each tasks as task (task.id)}
						<option value={task.id}>{task.title}</option>
					{/each}
				</select>
			</div>
			<TimeTracker
				class="mx-auto w-full max-w-xl"
				entries={timeEntries}
				getId={(entry) => entry.id}
				getMinutes={(entry) => entry.minutes}
				getDay={(entry) => entry.day}
				getPerson={(entry) => entry.person}
				getNote={(entry) => entry.note}
				estimate={estimates[timeTaskId]}
				running={timeRunning}
				onStart={() => {
					timer = { taskId: timeTaskId, startedAt: Date.now() };
				}}
				{onStop}
				{onLog}
				onDelete={(entry) => {
					entries = entries.filter((row) => row.id !== entry.id);
				}}
			/>
		</section>
	{/if}

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

<style>
	/* Switching views: the new one rises in with a touch of blur, the old one is gone at once. */
	.tasks-view {
		animation: tasks-view-in var(--duration-fast, 250ms) var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1)) backwards;
	}

	@keyframes tasks-view-in {
		from {
			opacity: 0;
			transform: translateY(var(--distance-base, 8px));
			filter: blur(var(--blur-small, 2px));
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.tasks-view {
			animation: none;
		}
	}
</style>
