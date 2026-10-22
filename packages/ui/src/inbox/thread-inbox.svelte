<script lang="ts">
	import { tick, type Snippet } from "svelte";
	import { ArrowSquareOut, BellSlash, Circle, Envelope, EnvelopeOpen } from "phosphor-svelte";
	import { AgentAvatar } from "#src/agents/index.js";
	import DetailHeader from "#src/components/list-page/detail-header.svelte";
	import DetailPanel from "#src/components/list-page/detail-panel.svelte";
	import FilterItem from "#src/components/list-page/filter-item.svelte";
	import FilterPopover from "#src/components/list-page/filter-popover.svelte";
	import MasterDetail from "#src/components/list-page/master-detail.svelte";
	import RailBody from "#src/components/list-page/rail-body.svelte";
	import RailEmpty from "#src/components/list-page/rail-empty.svelte";
	import RailHead from "#src/components/list-page/rail-head.svelte";
	import RailRow from "#src/components/list-page/rail-row.svelte";
	import { filterSectionClass } from "#src/components/list-page/filter-section.js";
	import { queueRailClass, queueRailWidth } from "#src/components/list-page/queue-rail.js";
	import SegmentedFilter from "#src/components/segmented/segmented-filter.svelte";
	import { Button } from "#src/shadcn/button/index.js";
	import { Kbd, KbdGroup } from "#src/shadcn/kbd/index.js";
	import { cn } from "#src/lib/utils.js";
	import { TONE_CLASS } from "#src/lib/tone.js";
	import InboxCard from "#src/tasks/inbox/inbox-card.svelte";
	import type { InboxItem, InboxVerdict } from "#src/tasks/inbox/inbox-types.js";
	import {
		NO_FILTER,
		actorNames,
		entryLine,
		filterThreads,
		inboxKeyOf,
		resolveInboxLabels,
		snoozeChoices,
		subjectTypes,
		threadsOf,
	} from "#src/inbox/logic.js";
	import {
		ALL,
		type InboxActor,
		type InboxEntry,
		type InboxFilter,
		type InboxLabels,
		type InboxSnooze,
		type InboxSubject,
		type InboxThread,
	} from "#src/inbox/types.js";

	interface Props {
		entries: InboxEntry[];
		/** The key of the open thread. Without a match the first thread opens. */
		selected?: string;
		/** Threads with unread entries come first. */
		unreadFirst?: boolean;
		labels?: Partial<InboxLabels>;
		/** Display names for subject types, such as `{ task: "Tasks" }`. A missing type shows as written. */
		typeLabels?: Record<string, string>;
		/** Replaces the default avatar for a person or an agent, drawn in a 24px slot. */
		avatar?: Snippet<[InboxActor]>;
		/** A badge for the subject's status, drawn by the host with its own status map. */
		status?: Snippet<[InboxSubject]>;
		/** Replaces a pinned proposal's summary lines. */
		renderProposal?: Snippet<[InboxItem]>;
		/** How a timestamp reads. Defaults to a short date and time. */
		when?: (at: string) => string;
		onSelect?: (thread: InboxThread) => void;
		/** `read` is true when the thread had unread entries, so the host marks them all read. */
		onRead?: (thread: InboxThread, read: boolean) => void;
		onSnooze?: (request: InboxSnooze) => void;
		onDecide?: (verdict: InboxVerdict, thread: InboxThread) => void;
		class?: string;
	}

	let {
		entries,
		selected = $bindable(),
		unreadFirst = false,
		labels: labelOverrides,
		typeLabels = {},
		avatar,
		status,
		renderProposal,
		when = (at) => {
			const date = new Date(at);
			return Number.isNaN(date.getTime())
				? ""
				: date.toLocaleString(undefined, {
						month: "short",
						day: "numeric",
						hour: "numeric",
						minute: "2-digit",
					});
		},
		onSelect,
		onRead,
		onSnooze,
		onDecide,
		class: className,
	}: Props = $props();

	const NEEDS_YOU = "needs-you";

	let labels = $derived(resolveInboxLabels(labelOverrides));
	let filter = $state<InboxFilter>({ ...NO_FILTER });
	let snoozing = $state(false);
	let pane = $state<"rail" | "detail">("rail");
	let root = $state<HTMLDivElement>();
	let cards = $state<Record<string, ReturnType<typeof InboxCard> | null>>({});

	let all = $derived(threadsOf(entries, { unreadFirst }));
	let visible = $derived(filterThreads(all, filter));
	let types = $derived(subjectTypes(all));
	let people = $derived(actorNames(all));
	let current = $derived(visible.find((thread) => thread.key === selected) ?? visible[0]);
	let needsYouCount = $derived(all.filter((thread) => thread.pending.length > 0).length);
	let filtered = $derived(filter.type !== ALL || filter.who !== ALL || filter.needsYou);
	let narrowed = $derived(Number(filter.type !== ALL) + Number(filter.who !== ALL));
	let views = $derived([
		{ value: ALL, label: labels.all, count: all.length },
		{ value: NEEDS_YOU, label: labels.needsYou, count: needsYouCount },
	]);
	let pinned = $derived(current?.pending[0]);
	let timeline = $derived(
		current?.entries.filter((entry) => !current.pending.includes(entry)) ?? [],
	);

	function open(thread: InboxThread): void {
		selected = thread.key;
		snoozing = false;
		onSelect?.(thread);
	}

	async function move(step: number): Promise<void> {
		if (!visible.length) return;
		const from = current ? visible.indexOf(current) : -1;
		open(visible[Math.max(0, Math.min(visible.length - 1, from + step))]);
		await tick();
		root?.querySelector<HTMLElement>('.md-rail [aria-current="page"]')?.focus();
	}

	function toggleRead(): void {
		if (current) onRead?.(current, current.unread > 0);
	}

	function snooze(until: Date): void {
		if (current) onSnooze?.({ thread: current, until });
		snoozing = false;
	}

	function onkeydown(event: KeyboardEvent): void {
		if (snoozing && !event.defaultPrevented && !event.metaKey && !event.ctrlKey && !event.altKey) {
			const choice = snoozeChoices(new Date())[Number(event.key) - 1];
			if (choice) {
				event.preventDefault();
				snooze(choice.until);
				return;
			}
			if (event.key === "Escape") {
				snoozing = false;
				return;
			}
		}
		const key = inboxKeyOf(event);
		if (!key) return;
		const card = pinned ? cards[pinned.id] : null;
		const actions = {
			next: () => move(1),
			previous: () => move(-1),
			toggleRead,
			snooze: () => (snoozing = !snoozing),
			approve: () => card?.approve(),
			decline: () => card?.decline(),
			steer: () => card?.steer(),
			edit: () => card?.edit(),
		};
		event.preventDefault();
		actions[key]();
	}

	function snoozeLabel(id: string): string {
		return id === "later"
			? labels.snoozeLater
			: id === "tomorrow"
				? labels.snoozeTomorrow
				: labels.snoozeNextWeek;
	}

	function initial(name: string): string {
		return name.trim().charAt(0).toLocaleUpperCase() || "?";
	}

	function lastEntry(thread: InboxThread): InboxEntry {
		return thread.entries[thread.entries.length - 1];
	}
</script>

{#snippet face(actor: InboxActor)}
	<span class="relative size-6 shrink-0">
		{#if avatar}
			{@render avatar(actor)}
		{:else if actor.kind === "agent"}
			<AgentAvatar name={actor.name} size={24} paused interactive={false} />
		{:else if actor.avatar}
			<img src={actor.avatar} alt="" class="size-6 rounded-full object-cover" />
		{:else}
			<span
				class="grid size-6 place-items-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
				aria-hidden="true"
			>
				{initial(actor.name)}
			</span>
		{/if}
	</span>
{/snippet}

{#snippet subjectStatus()}
	{#if current}{@render status?.(current.subject)}{/if}
{/snippet}

<!-- WHY the key handler sits on the region: the shortcuts work wherever focus is inside the inbox and nowhere else on the page. -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	role="region"
	aria-label={labels.title}
	bind:this={root}
	class={cn("flex h-full min-h-0 flex-col gap-3", className)}
	{onkeydown}
>
	<MasterDetail
		bind:pane
		railWidth={queueRailWidth}
		railClass={queueRailClass}
		detailClass="flex flex-col gap-4 overflow-y-auto"
		pad={false}
		backLabel={labels.title}
		class="min-h-0 flex-1"
	>
		{#snippet rail()}
			<RailHead>
				<div class="flex items-center gap-2">
					<SegmentedFilter
						options={views}
						value={filter.needsYou ? NEEDS_YOU : ALL}
						onValueChange={(view) => (filter = { ...filter, needsYou: view === NEEDS_YOU })}
						ariaLabel={labels.title}
						class="min-w-0 flex-1"
					/>
					<FilterPopover
						label={labels.filter}
						count={narrowed}
						align="end"
						onClear={() => (filter = { ...NO_FILTER, needsYou: filter.needsYou })}
						clearLabel={labels.clearFilters}
					>
						{#if types.length > 1}
							<p class={filterSectionClass()}>{labels.kind}</p>
							{#each [ALL, ...types] as type (type)}
								<FilterItem
									variant="radio"
									checked={filter.type === type}
									onclick={() => (filter = { ...filter, type })}
								>
									{type === ALL ? labels.all : (typeLabels[type] ?? type)}
								</FilterItem>
							{/each}
						{/if}
						<p class={filterSectionClass()}>{labels.from}</p>
						{#each [ALL, ...people] as who (who)}
							<FilterItem
								variant="radio"
								checked={filter.who === who}
								onclick={() => (filter = { ...filter, who })}
							>
								{who === ALL ? labels.anyone : who}
							</FilterItem>
						{/each}
					</FilterPopover>
				</div>
			</RailHead>
			<RailBody>
				<ol aria-label={labels.title}>
					{#each visible as thread (thread.key)}
						{@const last = lastEntry(thread)}
						<li>
							<RailRow
								title={thread.subject.title}
								titleLines={2}
								selected={current?.key === thread.key}
								onclick={() => open(thread)}
								preview="{last.actor.name} {entryLine(last, labels)}"
								meta={[thread.subject.ref, when(thread.latestAt)]}
								metaTruncate="last"
							>
								{#snippet trailing()}
									{#if thread.pending.length > 0}
										<span
											class={cn(
												"inline-flex h-5 items-center rounded-sm border px-1.5 font-medium",
												TONE_CLASS.warning,
											)}
										>
											{labels.needsYou}
										</span>
									{:else if thread.unread > 0}
										<Circle
											weight="fill"
											class="size-2 text-primary"
											aria-label="{thread.unread} {labels.unread}"
										/>
									{/if}
								{/snippet}
							</RailRow>
						</li>
					{:else}
						<li class="flex h-full flex-col items-center">
							<RailEmpty
								title={filtered
									? filter.needsYou
										? labels.emptyNeedsYou
										: labels.emptyFiltered
									: labels.empty}
							/>
							{#if filtered}
								<Button size="sm" variant="outline" onclick={() => (filter = { ...NO_FILTER })}
									>{labels.clearFilters}</Button
								>
							{/if}
						</li>
					{/each}
				</ol>
			</RailBody>
		{/snippet}

		{#snippet detail()}
			{#if current}
				<DetailHeader
					title={current.subject.title}
					meta={[current.subject.ref]}
					badge={status ? subjectStatus : undefined}
				>
					{#snippet actions()}
						<Button size="sm" variant="ghost" onclick={toggleRead} aria-keyshortcuts="u">
							{#if current.unread > 0}
								<EnvelopeOpen aria-hidden="true" />{labels.markRead}
							{:else}
								<Envelope aria-hidden="true" />{labels.markUnread}
							{/if}
						</Button>
						<Button
							size="sm"
							variant="ghost"
							onclick={() => (snoozing = !snoozing)}
							aria-expanded={snoozing}
							aria-keyshortcuts="h"
						>
							<BellSlash aria-hidden="true" />{labels.snooze}
						</Button>
						{#if current.subject.href}
							<Button size="sm" variant="ghost" href={current.subject.href}>
								<ArrowSquareOut aria-hidden="true" />{labels.open}
							</Button>
						{/if}
					{/snippet}
				</DetailHeader>

				{#if snoozing}
					<div class="flex flex-wrap gap-2" role="group" aria-label={labels.snooze}>
						{#each snoozeChoices(new Date()) as choice, index (choice.id)}
							<Button size="sm" variant="outline" onclick={() => snooze(choice.until)}>
								<Kbd>{index + 1}</Kbd>{snoozeLabel(choice.id)}
							</Button>
						{/each}
					</div>
				{/if}

				{#each current.pending as entry (entry.id)}
					<InboxCard
						bind:this={cards[entry.id]}
						item={entry.proposal!}
						selected={entry === pinned}
						onverdict={(verdict) => onDecide?.(verdict, current)}
						{renderProposal}
					/>
				{/each}

				{#if timeline.length > 0}
					<DetailPanel>
						<ol class="flex flex-col gap-4">
							{#each timeline as entry (entry.id)}
								<li class={cn("flex gap-3", !entry.read && "font-medium")}>
									{@render face(entry.actor)}
									<div class="min-w-0 flex-1">
										<div class="flex flex-wrap items-center gap-x-2 text-[13px]">
											<span class="truncate font-medium">{entry.actor.name}</span>
											{#if entry.actor.kind === "agent"}
												<span
													class={cn(
														"inline-flex h-5 items-center rounded-sm border px-1.5 text-xs font-medium",
														TONE_CLASS.accent,
													)}
												>
													{labels.agent}
												</span>
											{/if}
											<span class="font-normal text-muted-foreground"
												>{entryLine(entry, labels)}</span
											>
											<span class="ms-auto text-xs font-normal text-muted-foreground tabular-nums"
												>{when(entry.at)}</span
											>
										</div>
										{#if entry.body}
											<p
												class="mt-1 text-sm leading-relaxed font-normal whitespace-pre-wrap text-pretty"
											>
												{entry.body}
											</p>
										{/if}
									</div>
								</li>
							{/each}
						</ol>
					</DetailPanel>
				{/if}
			{:else}
				<RailEmpty title={labels.selectThread} />
			{/if}
		{/snippet}
	</MasterDetail>

	<footer
		class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground max-sm:hidden"
	>
		<span class="inline-flex items-center gap-1.5"
			><KbdGroup><Kbd>j</Kbd><Kbd>k</Kbd></KbdGroup> {labels.hintMove}</span
		>
		<span class="inline-flex items-center gap-1.5"><Kbd>u</Kbd> {labels.hintRead}</span>
		<span class="inline-flex items-center gap-1.5"><Kbd>h</Kbd> {labels.hintSnooze}</span>
		<span class="inline-flex items-center gap-1.5"
			><KbdGroup><Kbd>a</Kbd><Kbd>d</Kbd><Kbd>s</Kbd><Kbd>e</Kbd></KbdGroup> {labels.hintAct}</span
		>
	</footer>
</div>
