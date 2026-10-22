<script lang="ts">
	import { tick, type Snippet } from "svelte";
	import { ArrowLeft, BellSlash, Circle, Envelope, EnvelopeOpen } from "phosphor-svelte";
	import { AgentAvatar } from "#src/agents/index.js";
	import { Badge } from "#src/shadcn/badge/index.js";
	import { Button } from "#src/shadcn/button/index.js";
	import * as Empty from "#src/shadcn/empty/index.js";
	import { Kbd, KbdGroup } from "#src/shadcn/kbd/index.js";
	import { ToggleGroup, ToggleGroupItem } from "#src/shadcn/toggle-group/index.js";
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
				: date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
		},
		onSelect,
		onRead,
		onSnooze,
		onDecide,
		class: className,
	}: Props = $props();

	let labels = $derived(resolveInboxLabels(labelOverrides));
	let filter = $state<InboxFilter>({ ...NO_FILTER });
	let snoozing = $state(false);
	let detailOpen = $state(false);
	let cards = $state<Record<string, ReturnType<typeof InboxCard> | null>>({});

	let all = $derived(threadsOf(entries, { unreadFirst }));
	let visible = $derived(filterThreads(all, filter));
	let types = $derived(subjectTypes(all));
	let people = $derived(actorNames(all));
	let current = $derived(visible.find((thread) => thread.key === selected) ?? visible[0]);
	let needsYouCount = $derived(all.filter((thread) => thread.pending.length > 0).length);
	let filtered = $derived(filter.type !== ALL || filter.who !== ALL || filter.needsYou);
	let pinned = $derived(current?.pending[0]);
	let timeline = $derived(current?.entries.filter((entry) => !current.pending.includes(entry)) ?? []);

	function open(thread: InboxThread): void {
		selected = thread.key;
		snoozing = false;
		detailOpen = true;
		onSelect?.(thread);
	}

	async function move(step: number): Promise<void> {
		if (!visible.length) return;
		const from = current ? visible.indexOf(current) : -1;
		const next = visible[Math.max(0, Math.min(visible.length - 1, from + step))];
		open(next);
		detailOpen = false;
		await tick();
		document.querySelector<HTMLElement>(`[data-thread-key="${CSS.escape(next.key)}"]`)?.focus();
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

	function setType(next: string | undefined): void {
		filter = { ...filter, type: next || ALL };
	}

	function snoozeLabel(id: string): string {
		return id === "later" ? labels.snoozeLater : id === "tomorrow" ? labels.snoozeTomorrow : labels.snoozeNextWeek;
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
			<span class="grid size-6 place-items-center rounded-full bg-muted text-xs font-medium text-muted-foreground" aria-hidden="true">
				{initial(actor.name)}
			</span>
		{/if}
	</span>
{/snippet}

<!-- WHY the key handler sits on the region: the shortcuts work wherever focus is inside the inbox and nowhere else on the page. -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div role="region" aria-label={labels.title} class={cn("flex h-full min-h-0 flex-col gap-3", className)} {onkeydown}>
	<div class="flex flex-wrap items-center gap-2">
		<ToggleGroup type="single" variant="outline" size="sm" value={filter.type} onValueChange={setType} aria-label={labels.filterType}>
			<ToggleGroupItem value={ALL}>{labels.all}</ToggleGroupItem>
			{#each types as type (type)}
				<ToggleGroupItem value={type}>{typeLabels[type] ?? type}</ToggleGroupItem>
			{/each}
		</ToggleGroup>
		<select
			aria-label={labels.filterWho}
			value={filter.who}
			onchange={(event) => (filter = { ...filter, who: event.currentTarget.value })}
			class="h-7 rounded-lg border border-border bg-background px-2 text-[0.8rem] outline-none focus-visible:ring-3 focus-visible:ring-ring/50 any-pointer-coarse:h-10"
		>
			<option value={ALL}>{labels.anyone}</option>
			{#each people as name (name)}
				<option value={name}>{name}</option>
			{/each}
		</select>
		<Button
			size="sm"
			variant={filter.needsYou ? "default" : "outline"}
			aria-pressed={filter.needsYou}
			onclick={() => (filter = { ...filter, needsYou: !filter.needsYou })}
		>
			{labels.needsYou}
			<span class="tabular-nums opacity-70">{needsYouCount}</span>
		</Button>
	</div>

	<div class="grid min-h-0 flex-1 gap-3 md:grid-cols-[20rem_minmax(0,1fr)]">
		<ol class={cn("-mx-1 min-h-0 flex-col gap-1 overflow-y-auto px-1 pb-1", detailOpen ? "max-md:hidden md:flex" : "flex")} aria-label={labels.title}>
			{#each visible as thread (thread.key)}
				{@const last = lastEntry(thread)}
				<li>
					<button
						type="button"
						data-thread-key={thread.key}
						aria-current={current?.key === thread.key}
						onclick={() => open(thread)}
						class={cn(
							"flex w-full flex-col gap-1 rounded-lg border border-transparent p-2.5 text-start outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
							current?.key === thread.key ? "border-border bg-muted" : "hover:bg-muted/50",
						)}
					>
						<span class="flex items-center gap-2">
							{#if thread.unread > 0}
								<Circle weight="fill" class="size-2 shrink-0 text-primary" aria-hidden="true" />
							{/if}
							{#if thread.subject.ref}
								<span class="text-xs text-muted-foreground tabular-nums">{thread.subject.ref}</span>
							{/if}
							<span class={cn("truncate text-sm", thread.unread > 0 ? "font-medium" : "")}>{thread.subject.title}</span>
							<span class="ms-auto shrink-0 text-xs text-muted-foreground tabular-nums">{when(thread.latestAt)}</span>
						</span>
						<span class="flex items-center gap-2 ps-4 text-xs text-muted-foreground">
							<span class="truncate">{last.actor.name} {entryLine(last, labels)}</span>
							{#if thread.pending.length > 0}
								<span class={cn("ms-auto inline-flex h-5 shrink-0 items-center rounded-sm border px-1.5 font-medium", TONE_CLASS.warning)}>
									{labels.needsYou}
								</span>
							{:else if thread.unread > 0}
								<Badge variant="outline" class="ms-auto tabular-nums" aria-label="{thread.unread} {labels.unread}">{thread.unread}</Badge>
							{/if}
						</span>
					</button>
				</li>
			{:else}
				<li class="h-full">
					<Empty.Root class="h-full">
						<Empty.Header>
							<Empty.Title>
								{filtered ? (filter.needsYou ? labels.emptyNeedsYou : labels.emptyFiltered) : labels.empty}
							</Empty.Title>
						</Empty.Header>
						{#if filtered}
							<Empty.Content>
								<Button size="sm" variant="outline" onclick={() => (filter = { ...NO_FILTER })}>{labels.clearFilters}</Button>
							</Empty.Content>
						{/if}
					</Empty.Root>
				</li>
			{/each}
		</ol>

		<section
			class={cn("min-h-0 flex-col gap-4 overflow-y-auto rounded-xl border border-border p-4", detailOpen ? "flex" : "max-md:hidden md:flex")}
			aria-label={current?.subject.title ?? labels.selectThread}
		>
			{#if current}
				<header class="flex flex-wrap items-center gap-2">
					<Button size="sm" variant="ghost" class="md:hidden" onclick={() => (detailOpen = false)} aria-label={labels.title}>
						<ArrowLeft aria-hidden="true" />
					</Button>
					{#if current.subject.ref}
						<span class="text-xs text-muted-foreground tabular-nums">{current.subject.ref}</span>
					{/if}
					<h2 class="min-w-0 truncate text-sm font-medium">
						{#if current.subject.href}
							<a href={current.subject.href} class="hover:underline">{current.subject.title}</a>
						{:else}
							{current.subject.title}
						{/if}
					</h2>
					{@render status?.(current.subject)}
					<span class="ms-auto flex items-center gap-1">
						<Button size="sm" variant="ghost" onclick={toggleRead} aria-keyshortcuts="u">
							{#if current.unread > 0}
								<EnvelopeOpen aria-hidden="true" />{labels.markRead}
							{:else}
								<Envelope aria-hidden="true" />{labels.markUnread}
							{/if}
						</Button>
						<Button size="sm" variant="ghost" onclick={() => (snoozing = !snoozing)} aria-expanded={snoozing} aria-keyshortcuts="h">
							<BellSlash aria-hidden="true" />{labels.snooze}
						</Button>
					</span>
				</header>

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

				<ol class="flex flex-col gap-4">
					{#each timeline as entry (entry.id)}
						<li class={cn("flex gap-3", !entry.read && "font-medium")}>
							{@render face(entry.actor)}
							<div class="min-w-0 flex-1">
								<div class="flex flex-wrap items-center gap-x-2 text-[13px]">
									<span class="truncate font-medium">{entry.actor.name}</span>
									{#if entry.actor.kind === "agent"}
										<span class={cn("inline-flex h-5 items-center rounded-sm border px-1.5 text-xs font-medium", TONE_CLASS.accent)}>
											{labels.agent}
										</span>
									{/if}
									<span class="font-normal text-muted-foreground">{entryLine(entry, labels)}</span>
									<span class="ms-auto text-xs font-normal text-muted-foreground tabular-nums">{when(entry.at)}</span>
								</div>
								{#if entry.body}
									<p class="mt-1 text-sm leading-relaxed font-normal whitespace-pre-wrap text-pretty">{entry.body}</p>
								{/if}
							</div>
						</li>
					{/each}
				</ol>
			{:else}
				<p class="text-sm text-muted-foreground">{labels.selectThread}</p>
			{/if}
		</section>
	</div>

	<footer class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground max-sm:hidden">
		<span class="inline-flex items-center gap-1.5"><KbdGroup><Kbd>j</Kbd><Kbd>k</Kbd></KbdGroup> {labels.hintMove}</span>
		<span class="inline-flex items-center gap-1.5"><Kbd>u</Kbd> {labels.hintRead}</span>
		<span class="inline-flex items-center gap-1.5"><Kbd>h</Kbd> {labels.hintSnooze}</span>
		<span class="inline-flex items-center gap-1.5"><KbdGroup><Kbd>a</Kbd><Kbd>d</Kbd><Kbd>s</Kbd><Kbd>e</Kbd></KbdGroup> {labels.hintAct}</span>
	</footer>
</div>
