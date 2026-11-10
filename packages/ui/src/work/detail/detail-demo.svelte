<script lang="ts">
	import {
		CalendarBlank,
		CircleDashed,
		CircleHalf,
		Flag,
		Folder,
		Timer,
		User,
		UserCircle,
	} from "phosphor-svelte";
	import { Button } from "#src/shadcn/button/index.js";
	import { Card } from "#src/shadcn/card/index.js";
	import * as Avatar from "#src/shadcn/avatar/index.js";
	import TaskDetail from "#src/work/detail/task-detail.svelte";
	import PropertyRow from "#src/components/work-parts/property-row.svelte";
	import TaskChip from "#src/work/detail/task-chip.svelte";
	import TimeTracker from "#src/work/time/time-tracker.svelte";
	import StatusDot from "#src/status/status-dot.svelte";
	import { defineStatuses } from "#src/status/define-statuses.js";
	import type { ThreadComment, ThreadPost } from "#src/thread/types.js";
	import type { TimeLogInput, TimeStopInfo } from "#src/work/time/time-types.js";

	type Scenario =
		| "default"
		| "long"
		| "emptyDescription"
		| "unassigned"
		| "running"
		| "busy"
		| "closed"
		| "loading";

	const statuses = defineStatuses({
		todo: { label: "To do", tone: "neutral", variant: "open" },
		doing: { label: "In progress", tone: "info", variant: "progress", progress: 0.5 },
		done: { label: "Done", tone: "success", variant: "completed" },
	});

	const scenarios: { id: Scenario; label: string }[] = [
		{ id: "default", label: "Default" },
		{ id: "long", label: "Long title" },
		{ id: "emptyDescription", label: "Empty description" },
		{ id: "unassigned", label: "No assignee" },
		{ id: "running", label: "Running timer" },
		{ id: "busy", label: "24 comments" },
		{ id: "closed", label: "Closed" },
		{ id: "loading", label: "Loading" },
	];

	const people = ["Ada Lovelace", "Bo Chen", "Cy Park"];
	const now = Date.now();
	const hour = 3_600_000;
	const stamp = (agoHours: number) => new Date(now - agoHours * hour).toISOString();

	const person = (name: string) => ({ name, kind: "user" as const });
	const planner = { name: "Planner", kind: "agent" as const };

	const seed: ThreadComment[] = [
		{
			id: "c1",
			author: person("Ada Lovelace"),
			body: "Calls with Yoan: the format that sold the template was simple. A board on why, then the system, then the demo.",
			createdAt: stamp(30),
		},
		{
			id: "c2",
			author: planner,
			body: "Reused that shape for the outline. Three sections, the demo last, one call to action at the end.",
			createdAt: stamp(26),
		},
		{
			id: "c3",
			author: person("Bo Chen"),
			body: "Looks right. I'll record Thursday.",
			createdAt: stamp(5),
			edited: true,
		},
	];
	const crowd: ThreadComment[] = Array.from({ length: 24 }, (_, i) => ({
		id: `b${i}`,
		author: i % 4 === 1 ? planner : person(people[i % people.length] ?? "Ada Lovelace"),
		body:
			i % 5 === 0
				? "Pushed the second cut. The intro runs 40 seconds, so I trimmed the first example and kept the one with numbers."
				: "Noted, moving on to the next step.",
		createdAt: stamp(60 - i * 2),
	}));

	const longTitle =
		"Run one awareness-only live session for an entrepreneur group, record it, and hand the raw take to the editor with a thumbnail brief";
	const brief =
		"Record the video about how the notebook is orchestrated.\n\nSteps: pick the angle from the notebook's own list, record, drop the raw take in the drive, and open one task per handoff (editor cut, thumbnail, storage link).\n\nDone when the raw take is in the drive and the three handoff tasks exist.";

	let scenario = $state<Scenario>("default");
	let narrow = $state(false);
	let title = $state("Record the video and hand it off");
	let description = $state<string | null>(brief);
	let thread = $state<ThreadComment[]>([...seed]);
	let done = $state(false);
	let timer = $state<{ startedAt: number } | null>(null);
	let entries = $state([
		{
			id: "e1",
			minutes: 90,
			day: new Date(now - 24 * hour).toISOString().slice(0, 10),
			person: "Ada Lovelace",
			note: "Outline",
		},
	]);

	$effect(() => {
		const s = scenario;
		title = s === "long" ? longTitle : "Record the video and hand it off";
		description = s === "emptyDescription" ? null : brief;
		thread = s === "busy" ? [...crowd] : s === "loading" ? [] : [...seed];
		done = s === "closed";
		timer = s === "running" ? { startedAt: Date.now() - 754_000 } : null;
	});

	let assignee = $derived(scenario === "unassigned" ? null : "Ada Lovelace");
	let status = $derived(done ? "done" : scenario === "running" ? "doing" : "todo");
	let statusLabel = $derived(statuses.label(status));

	function onLog(input: TimeLogInput) {
		entries = [
			{
				id: `e${entries.length + 1}`,
				minutes: input.minutes,
				day: input.day,
				person: "Ada Lovelace",
				note: input.note ?? "",
			},
			...entries,
		];
		return true;
	}

	function onStop(info: TimeStopInfo) {
		onLog({ minutes: info.minutes, day: info.day });
		timer = null;
	}

	function onPostComment({ body, parentId }: ThreadPost) {
		thread = [
			...thread,
			{
				id: `n${thread.length}`,
				author: person("Ada Lovelace"),
				body,
				parentId,
				createdAt: new Date().toISOString(),
			},
		];
	}
</script>

<div class="flex flex-col gap-3">
	<div class="flex flex-wrap items-center gap-1.5" role="group" aria-label="Scenario">
		{#each scenarios as item (item.id)}
			<Button
				size="sm"
				variant={scenario === item.id ? "default" : "outline"}
				aria-pressed={scenario === item.id}
				onclick={() => (scenario = item.id)}
			>
				{item.label}
			</Button>
		{/each}
		<Button
			size="sm"
			variant={narrow ? "default" : "outline"}
			class="ms-auto"
			aria-pressed={narrow}
			onclick={() => (narrow = !narrow)}
		>
			390 wide
		</Button>
	</div>

	<Card class="mx-auto w-full gap-0 py-0" style="max-width: {narrow ? '390px' : 'none'}">
		<TaskDetail
			{title}
			onTitleChange={(next) => {
				title = next;
			}}
			{done}
			closed={done}
			onToggleDone={() => (done = !done)}
			{description}
			onDescriptionChange={(next) => {
				description = next;
			}}
			comments={thread}
			loadingComments={scenario === "loading"}
			{onPostComment}
			onDeleteComment={(comment) => {
				thread = thread.filter((row) => row.id !== comment.id);
			}}
			canEditComment={(comment) =>
				comment.author.kind === "user" && comment.author.name === "Ada Lovelace"}
		>
			{#snippet meta()}
				<span>From a call</span>
				<span class="tabular-nums">Created Sep 9, 2026</span>
			{/snippet}
			{#snippet properties()}
				<PropertyRow label="Status" icon={CircleHalf} layout="responsive">
					<TaskChip aria-label="Status: {statusLabel}"
						><StatusDot {statuses} {status} size={14} animate={false} />{statusLabel}</TaskChip
					>
				</PropertyRow>
				<PropertyRow label="Priority" icon={Flag} layout="responsive">
					<TaskChip><Flag weight="fill" class="text-destructive" aria-hidden="true" />High</TaskChip
					>
				</PropertyRow>
				<PropertyRow label="Assignee" icon={UserCircle} layout="responsive">
					{#if assignee}
						<TaskChip>
							<Avatar.Root class="size-4" aria-hidden="true">
								<Avatar.Fallback><User aria-hidden="true" class="size-3" /></Avatar.Fallback>
							</Avatar.Root>
							{assignee}
						</TaskChip>
					{:else}
						<TaskChip empty><CircleDashed aria-hidden="true" />Assign</TaskChip>
					{/if}
				</PropertyRow>
				<PropertyRow label="Due date" icon={CalendarBlank} layout="responsive">
					<TaskChip><CalendarBlank aria-hidden="true" />Oct 9, 2026</TaskChip>
				</PropertyRow>
				<PropertyRow label="Project" icon={Folder} layout="responsive">
					<TaskChip><Folder aria-hidden="true" />Agency OS</TaskChip>
				</PropertyRow>
				<PropertyRow label="Time" icon={Timer} layout="responsive">
					<TimeTracker
						{entries}
						running={timer}
						estimate={240}
						getId={(entry) => entry.id}
						getMinutes={(entry) => entry.minutes}
						getDay={(entry) => entry.day}
						getPerson={(entry) => entry.person}
						getNote={(entry) => entry.note}
						onStart={() => {
							timer = { startedAt: Date.now() };
						}}
						{onStop}
						{onLog}
						onDelete={(entry) => {
							entries = entries.filter((row) => row.id !== entry.id);
						}}
					/>
				</PropertyRow>
			{/snippet}
		</TaskDetail>
	</Card>
</div>
