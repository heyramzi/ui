<script lang="ts">
	import { tick, type Snippet } from "svelte";
	import {
		ArrowRight,
		ArrowSquareOut,
		Bell,
		BellSlash,
		Check,
		Checks,
		Circle,
		Envelope,
		EnvelopeOpen,
		EyeSlash,
		Sparkle,
		UserPlus,
	} from "phosphor-svelte";
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
	import ActorFace from "#src/inbox/actor-face.svelte";
	import EntryBody from "#src/inbox/entry-body.svelte";
	import InboxCard from "#src/work/inbox/inbox-card.svelte";
	import { whenOf } from "#src/work/inbox/inbox-logic.js";
	import type { InboxItem, InboxVerdict } from "#src/work/inbox/inbox-types.js";
	import {
		NO_FILTER,
		actorNames,
		entryLine,
		sentenceOf,
		timelineOf,
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
		/** Content under an entry's text, such as links to what it mentions. */
		attachments?: Snippet<[InboxEntry]>;
		/** How a timestamp reads. Defaults to a relative time. */
		when?: (at: string) => string;
		onSelect?: (thread: InboxThread) => void;
		/** `read` is true when the thread had unread entries, so the host marks them all read. */
		onRead?: (thread: InboxThread, read: boolean) => void;
		/** Alt+U: mark every thread read. */
		onReadAll?: () => void;
		onSnooze?: (request: InboxSnooze) => void;
		/** The host is passing snoozed threads too, each with `subject.snoozedUntil`. */
		showSnoozed?: boolean;
		/** Adds "Show snoozed" to the filter. The host passes the snoozed entries or stops. */
		onShowSnoozed?: (show: boolean) => void;
		/** `h` on a snoozed thread brings it back now. */
		onUnsnooze?: (thread: InboxThread) => void;
		/** Shift+S on a thread whose `subject.followed` is set. */
		onUnfollow?: (thread: InboxThread) => void;
		/**
		 * Backspace: take the thread out of the inbox. The host stops passing its entries, and new
		 * activity can bring it back. A thread holding a pending proposal can't be cleared.
		 */
		onClear?: (thread: InboxThread) => void;
		/** Shift+Backspace: clear every thread with nothing unread and no pending proposal. */
		onClearRead?: (threads: InboxThread[]) => void;
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
		attachments,
		when = (at) => whenOf(at),
		onSelect,
		onRead,
		onReadAll,
		onSnooze,
		showSnoozed = false,
		onShowSnoozed,
		onUnsnooze,
		onUnfollow,
		onClear,
		onClearRead,
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
	let narrowed = $derived(
		Number(filter.type !== ALL) + Number(filter.who !== ALL) + Number(showSnoozed),
	);
	let anyUnread = $derived(all.some((thread) => thread.unread > 0));
	let views = $derived([
		{ value: ALL, label: labels.all, count: all.length },
		{ value: NEEDS_YOU, label: labels.needsYou, count: needsYouCount },
	]);
	let readThreads = $derived(
		all.filter((thread) => thread.unread === 0 && thread.pending.length === 0),
	);
	let pinned = $derived(current?.pending[0]);
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

	/** A snoozed thread comes back at once. Any other opens the snooze row. */
	function snoozeKey(): void {
		if (current?.subject.snoozedUntil && onUnsnooze) onUnsnooze(current);
		else snoozing = !snoozing;
	}

	function unfollow(): void {
		if (current?.subject.followed) onUnfollow?.(current);
	}

	function readAll(): void {
		if (anyUnread) onReadAll?.();
	}

	/** Clears the open thread and opens the one below it, or above it at the end of the list. */
	function clear(): void {
		if (!current || !onClear || current.pending.length > 0) return;
		const gone = current;
		const index = visible.indexOf(gone);
		const next = visible[index + 1] ?? visible[index - 1];
		if (next) selected = next.key;
		snoozing = false;
		onClear(gone);
	}

	function clearRead(): void {
		if (onClearRead && readThreads.length > 0) onClearRead(readThreads);
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
			readAll,
			snooze: snoozeKey,
			unfollow,
			clear,
			clearRead,
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

	function lastEntry(thread: InboxThread): InboxEntry {
		return thread.entries[thread.entries.length - 1];
	}
</script>

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
	<!-- WHY *:shrink-0: the header and panels clip their overflow, so they squashed to a sliver
	     when an expanded card filled the pane. Now the pane scrolls. -->
	<MasterDetail
		bind:pane
		railWidth={queueRailWidth}
		railClass={queueRailClass}
		detailClass="flex flex-col gap-4 overflow-y-auto *:shrink-0"
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
						onClear={() => {
							filter = { ...NO_FILTER, needsYou: filter.needsYou };
							if (showSnoozed) onShowSnoozed?.(false);
						}}
						clearLabel={labels.clearFilters}
					>
						{#if onShowSnoozed}
							<FilterItem checked={showSnoozed} onclick={() => onShowSnoozed(!showSnoozed)}>
								{labels.showSnoozed}
							</FilterItem>
						{/if}
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
					{#if onReadAll && anyUnread}
						<Button
							size="sm"
							variant="ghost"
							icon
							onclick={readAll}
							aria-label={labels.markAllRead}
							title={labels.markAllRead}
							aria-keyshortcuts="Alt+U"
						>
							<EnvelopeOpen aria-hidden="true" />
						</Button>
					{/if}
					{#if onClearRead && readThreads.length > 0}
						<Button
							size="sm"
							variant="ghost"
							icon
							onclick={clearRead}
							aria-label={labels.clearRead}
							title={labels.clearRead}
							aria-keyshortcuts="Shift+Backspace"
						>
							<Checks aria-hidden="true" />
						</Button>
					{/if}
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
								preview={sentenceOf(last, labels)}
								meta={[
									thread.subject.ref,
									thread.subject.snoozedUntil
										? `${labels.snoozed} ${when(thread.subject.snoozedUntil)}`
										: when(thread.latestAt),
								]}
								metaTruncate="last"
							>
								{#snippet trailing()}
									{#if thread.subject.snoozedUntil}
										<BellSlash class="size-3.5 text-muted-foreground" aria-label={labels.snoozed} />
									{:else if thread.pending.length > 0}
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
						{#if current.subject.snoozedUntil && onUnsnooze}
							<Button size="sm" variant="ghost" onclick={snoozeKey} aria-keyshortcuts="h">
								<Bell aria-hidden="true" />{labels.unsnooze}
							</Button>
						{:else}
							<Button
								size="sm"
								variant="ghost"
								onclick={snoozeKey}
								aria-expanded={snoozing}
								aria-keyshortcuts="h"
							>
								<BellSlash aria-hidden="true" />{labels.snooze}
							</Button>
						{/if}
						{#if onUnfollow && current.subject.followed}
							<Button size="sm" variant="ghost" onclick={unfollow} aria-keyshortcuts="Shift+S">
								<EyeSlash aria-hidden="true" />{labels.unfollow}
							</Button>
						{/if}
						{#if onClear && current.pending.length === 0}
							<Button size="sm" variant="ghost" onclick={clear} aria-keyshortcuts="Backspace">
								<Check aria-hidden="true" />{labels.clear}
							</Button>
						{/if}
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
						when={(at) => when(at)}
					/>
				{/each}

				{#if timeline.length > 0}
					<DetailPanel>
						<ol class="flex flex-col gap-4">
							{#each timeline as block (block.key)}
								{#if block.type === "message"}
									{@const entry = block.entry}
									<li class="flex gap-3">
										<ActorFace actor={entry.actor} {avatar} />
										<div class="min-w-0 flex-1">
											<div class="flex min-h-6 flex-wrap items-center gap-x-2 text-[13px]">
												<span class="truncate font-medium">{entry.actor.name}</span>
												{#if entry.actor.kind === "agent"}<span class="sr-only">{labels.agent}</span
													>{/if}
												{#if entry.kind === "mention"}
													<span class="text-muted-foreground">{entryLine(entry, labels)}</span>
												{/if}
												<time
													class="text-xs text-muted-foreground tabular-nums"
													datetime={entry.at}
													title={full(entry.at)}>{when(entry.at)}</time
												>
												{#if !entry.read}
													<Circle
														weight="fill"
														class="size-1.5 text-primary"
														aria-label={labels.unread}
													/>
												{/if}
											</div>
											{#if entry.body}
												<EntryBody
													text={entry.body}
													more={labels.showMore}
													less={labels.showLess}
												/>
											{/if}
											{@render attachments?.(entry)}
										</div>
									</li>
								{:else}
									<li class="flex flex-col gap-1">
										{#each block.entries as entry, i (entry.id)}
											<div class="flex items-start gap-2 text-xs text-muted-foreground">
												<span class="grid size-6 shrink-0 place-items-center" aria-hidden="true">
													{#if entry.kind === "status"}
														<ArrowRight size={14} />
													{:else if entry.kind === "assigned"}
														<UserPlus size={14} />
													{:else}
														<Sparkle size={14} />
													{/if}
												</span>
												<!-- Wraps, not truncates: a status name can be a sentence, and a touch screen has no hover title. -->
												<p class="min-w-0 flex-1 py-1 text-pretty [overflow-wrap:anywhere]">
													{i === 0 || !entry.actor.name
														? sentenceOf(entry, labels)
														: entryLine(entry, labels)}
												</p>
												<time
													class="shrink-0 py-1 tabular-nums"
													datetime={entry.at}
													title={full(entry.at)}>{when(entry.at)}</time
												>
											</div>
										{/each}
									</li>
								{/if}
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
		{#if onReadAll}
			<span class="inline-flex items-center gap-1.5"
				><KbdGroup><Kbd>⌥</Kbd><Kbd>u</Kbd></KbdGroup> {labels.hintReadAll}</span
			>
		{/if}
		<span class="inline-flex items-center gap-1.5"><Kbd>h</Kbd> {labels.hintSnooze}</span>
		{#if onClear}
			<span class="inline-flex items-center gap-1.5"><Kbd>⌫</Kbd> {labels.hintClear}</span>
		{/if}
		<span class="inline-flex items-center gap-1.5"
			><KbdGroup><Kbd>a</Kbd><Kbd>d</Kbd><Kbd>s</Kbd><Kbd>e</Kbd></KbdGroup> {labels.hintAct}</span
		>
	</footer>
</div>
