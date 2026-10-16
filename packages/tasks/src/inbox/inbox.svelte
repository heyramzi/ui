<script lang="ts">
	import { tick, type Snippet } from "svelte";
	import { Badge } from "@heyramzi/ui/shadcn/badge";
	import { Button } from "@heyramzi/ui/shadcn/button";
	import * as Empty from "@heyramzi/ui/shadcn/empty";
	import { Kbd, KbdGroup } from "@heyramzi/ui/shadcn/kbd";
	import { Tabs, TabsList, TabsTrigger } from "@heyramzi/ui/shadcn/tabs";
	import { ToggleGroup, ToggleGroupItem } from "@heyramzi/ui/shadcn/toggle-group";
	import { cn } from "@heyramzi/utils";
	import StatusDot from "../status-dot.svelte";
	import InboxCard from "./inbox-card.svelte";
	import { flatten, groupByProject, inLane, isTyping, laneOf } from "./inbox-logic.js";
	import { inboxKinds, inboxStates } from "./inbox-statuses.js";
	import type {
		InboxItem,
		InboxKindFilter,
		InboxLane,
		InboxProject,
		InboxVerdict,
	} from "./inbox-types.js";

	type Props = {
		items: InboxItem[];
		/** The host applies the verdict and passes the updated items back. */
		onverdict: (verdict: InboxVerdict) => void;
		/** Replaces an item's summary lines. */
		renderProposal?: Snippet<[InboxItem]>;
		/** Trailing content in a project's header, such as a link to its timeline. */
		renderGroupAction?: Snippet<[InboxProject]>;
		class?: string;
	};

	let { items, onverdict, renderProposal, renderGroupAction, class: className }: Props = $props();

	const LANES: { id: InboxLane; label: string }[] = [
		{ id: "needs", label: "Needs you" },
		{ id: "auto", label: "Done by the agent" },
		{ id: "decided", label: "Decided" },
	];

	let lane = $state<InboxLane>("needs");
	let kind = $state<InboxKindFilter>("all");
	let cursor = $state(0);
	let cards = $state<Record<string, ReturnType<typeof InboxCard> | null>>({});

	let counts = $derived(
		Object.fromEntries(LANES.map((l) => [l.id, items.filter((i) => laneOf(i) === l.id).length])) as Record<
			InboxLane,
			number
		>,
	);
	let groups = $derived(groupByProject(inLane(items, lane, kind)));
	let visible = $derived(flatten(groups));
	// WHY an index and not an id: when a verdict removes the item under the cursor,
	// the same index lands on the next one, so triage keeps moving down the queue.
	let selected = $derived(visible[Math.min(cursor, visible.length - 1)]);

	async function move(step: number) {
		if (!visible.length) return;
		cursor = Math.max(0, Math.min(visible.length - 1, cursor + step));
		await tick();
		document.querySelector<HTMLElement>(`[data-inbox-item="${CSS.escape(visible[cursor].id)}"]`)?.focus();
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
		if (isTyping(event.target)) return;
		const card = selected ? cards[selected.id] : null;
		const actions: Record<string, (() => void) | undefined> = {
			j: () => move(1),
			k: () => move(-1),
			a: () => card?.approve(),
			d: () => card?.decline(),
			s: () => card?.steer(),
			e: () => card?.edit(),
			u: () => card?.undo(),
		};
		const run = actions[event.key];
		if (!run) return;
		event.preventDefault();
		run();
	}

	function setLane(next: string) {
		lane = next as InboxLane;
		cursor = 0;
	}

	function setKind(next: string | undefined) {
		kind = (next || "all") as InboxKindFilter;
		cursor = 0;
	}
</script>

<!-- WHY the key handler sits on the region: the shortcuts work wherever focus is inside the inbox and nowhere else on the page. -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	role="region"
	aria-label="Inbox"
	class={cn("flex h-full min-h-0 flex-col gap-3", className)}
	{onkeydown}
>
	<div class="flex flex-wrap items-center justify-between gap-2">
		<Tabs value={lane} onValueChange={setLane}>
			<TabsList>
				{#each LANES as l (l.id)}
					<TabsTrigger value={l.id} class="gap-2 px-3">
						{l.label}
						<span class="text-muted-foreground text-xs tabular-nums">{counts[l.id]}</span>
					</TabsTrigger>
				{/each}
			</TabsList>
		</Tabs>
		<ToggleGroup
			type="single"
			variant="outline"
			size="sm"
			value={kind}
			onValueChange={setKind}
			aria-label="Filter by kind"
		>
			<ToggleGroupItem value="all">All</ToggleGroupItem>
			{#each inboxKinds.ids as id (id)}
				<ToggleGroupItem value={id}>{inboxKinds.label(id)}</ToggleGroupItem>
			{/each}
		</ToggleGroup>
	</div>

	<div class="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 pb-1">
		{#if !visible.length}
			<Empty.Root class="h-full">
				<Empty.Header>
					<Empty.Media>
						<StatusDot statuses={inboxStates} status="approved" size={28} />
					</Empty.Media>
					{#if kind !== "all"}
						<Empty.Title>Nothing of this kind here</Empty.Title>
						<Empty.Description>Show every kind to see the rest of this lane.</Empty.Description>
					{:else if lane === "needs"}
						<Empty.Title>Queue clear</Empty.Title>
						<Empty.Description>The agent handled the rest, and nothing is waiting on you.</Empty.Description>
					{:else if lane === "auto"}
						<Empty.Title>The agent hasn't done anything on its own yet</Empty.Title>
						<Empty.Description>Safe work it finishes by itself lands here, with an undo.</Empty.Description>
					{:else}
						<Empty.Title>No verdicts yet</Empty.Title>
						<Empty.Description>What you approve or decline shows here and on the project timeline.</Empty.Description>
					{/if}
				</Empty.Header>
				<Empty.Content>
					{#if kind !== "all"}
						<Button size="sm" variant="outline" onclick={() => setKind("all")}>Show every kind</Button>
					{:else if lane === "needs" && counts.auto}
						<Button size="sm" variant="outline" onclick={() => setLane("auto")}>See what the agent did</Button>
					{:else if lane !== "needs" && counts.needs}
						<Button size="sm" variant="outline" onclick={() => setLane("needs")}>Go to the queue</Button>
					{/if}
				</Empty.Content>
			</Empty.Root>
		{:else}
			<div class="flex flex-col gap-5">
				{#each groups as group (group.project.id)}
					<section aria-label={group.project.name} class="flex flex-col gap-2">
						<header class="flex items-center gap-2 px-1">
							<h2 class="text-sm font-medium">{group.project.name}</h2>
							{#if group.project.client}
								<span class="text-muted-foreground text-sm">{group.project.client}</span>
							{/if}
							<Badge variant="outline" class="tabular-nums">{group.items.length}</Badge>
							<div class="ml-auto flex items-center gap-1">
								{#if group.project.href}
									<Button size="sm" variant="ghost" href={group.project.href}>Timeline</Button>
								{/if}
								{@render renderGroupAction?.(group.project)}
							</div>
						</header>
						<div class="flex flex-col gap-2">
							{#each group.items as item (item.id)}
								<InboxCard
									bind:this={cards[item.id]}
									{item}
									selected={selected?.id === item.id}
									onselect={() => (cursor = visible.findIndex((v) => v.id === item.id))}
									{onverdict}
									{renderProposal}
								/>
							{/each}
						</div>
					</section>
				{/each}
			</div>
		{/if}
	</div>

	<footer class="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs max-sm:hidden">
		<span class="inline-flex items-center gap-1.5"><KbdGroup><Kbd>j</Kbd><Kbd>k</Kbd></KbdGroup> move</span>
		<span class="inline-flex items-center gap-1.5"><Kbd>a</Kbd> approve</span>
		<span class="inline-flex items-center gap-1.5"><Kbd>d</Kbd> decline</span>
		<span class="inline-flex items-center gap-1.5"><Kbd>s</Kbd> steer</span>
		<span class="inline-flex items-center gap-1.5"><Kbd>e</Kbd> edit draft</span>
		<span class="inline-flex items-center gap-1.5"><Kbd>u</Kbd> undo</span>
	</footer>
</div>
