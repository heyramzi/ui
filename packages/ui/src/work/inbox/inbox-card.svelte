<script lang="ts">
	import { untrack, type Snippet } from "svelte";
	import { AgentAvatar } from "#src/agents/index.js";
	import { PixelLoader } from "#src/ai/loading-state/index.js";
	import { Button } from "#src/shadcn/button/index.js";
	import { Textarea } from "#src/shadcn/textarea/index.js";
	import { cn } from "#src/lib/utils.js";
	import StatusBadge from "#src/status/status-badge.svelte";
	import StatusDot from "#src/status/status-dot.svelte";
	import { TONE_TEXT } from "#src/lib/tone.js";
	import InboxDraftEditor from "#src/work/inbox/inbox-draft.svelte";
	import {
		canUndo,
		cardFacts,
		freshReasoning,
		isOpen,
		startDraft,
		whenOf,
	} from "#src/work/inbox/inbox-logic.js";
	import {
		SOURCE_ICON,
		SOURCE_LABEL,
		confidenceLevel,
		inboxConfidence,
		inboxKinds,
		inboxStates,
	} from "#src/work/inbox/inbox-statuses.js";
	import InboxTraceView from "#src/work/inbox/inbox-trace.svelte";
	import type { InboxDraftEdits, InboxItem, InboxVerdict } from "#src/work/inbox/inbox-types.js";

	interface Props {
		item: InboxItem;
		/** The keyboard cursor is on this card. */
		selected?: boolean;
		onselect?: () => void;
		onverdict: (verdict: InboxVerdict) => void;
		/** Replaces the summary lines, for a host that renders its own proposal. */
		renderProposal?: Snippet<[InboxItem]>;
		/** How the source time reads. Defaults to a relative time, never a raw ISO string. */
		when?: (at: string) => string;
	}

	const FACT =
		"relative inline-flex items-center ps-3 before:absolute before:start-1 before:opacity-40 before:content-['·']";

	let {
		item,
		selected = false,
		onselect,
		onverdict,
		renderProposal,
		when = whenOf,
	}: Props = $props();

	let drafts = $derived(item.proposal.drafts ?? []);
	let open = $derived(isOpen(item));
	let level = $derived(confidenceLevel(item.confidence.score));
	let tone = $derived(inboxConfidence.tone(level));
	let SourceIcon = $derived(SOURCE_ICON[item.trace.source.type]);
	let facts = $derived(cardFacts(item));
	let time = $derived(when(item.trace.source.at));
	let why = $derived(freshReasoning(item, facts));
	// WHY not the source link alone: a trace holding only "Open source" was a disclosure to open
	// for a link the host already shows.
	let hasTrace = $derived(item.trace.evidence.length > 0 || !!why);
	let expanded = $state(false);
	let longCommand = $derived(
		!!facts.command &&
			(facts.command.text.length > 240 || facts.command.text.split("\n").length > 3),
	);

	let pickedDraft = $state<string>();
	let edits = $state<InboxDraftEdits>({});
	let bodyEl = $state<HTMLTextAreaElement | null>(null);
	let steering = $state(false);
	let note = $state("");
	let noteEl = $state<HTMLTextAreaElement | null>(null);
	let copied = $state(false);

	// WHY the selection is derived from the pick: a revised proposal brings new
	// drafts, and the old pick may not exist in them. The agent's choice wins then.
	let selectedDraft = $derived(
		drafts.find((d) => d.templateId === pickedDraft) ??
			startDraft(drafts, item.proposal.recommended),
	);

	// WHY: when the agent hands back a new set of drafts, the person's old edits
	// belong to text that no longer exists.
	let seenDrafts = untrack(() => item.proposal.drafts);
	$effect.pre(() => {
		if (item.proposal.drafts === seenDrafts) return;
		seenDrafts = item.proposal.drafts;
		edits = {};
		pickedDraft = undefined;
	});

	function current() {
		if (!selectedDraft) return undefined;
		const text = edits[selectedDraft.templateId] ?? selectedDraft;
		return { templateId: selectedDraft.templateId, subject: text.subject, body: text.body };
	}

	export function approve() {
		if (!open) return;
		// Sending the decline template closes the item as declined, whichever button sent it.
		const type = selectedDraft?.outcome === "decline" ? "decline" : "approve";
		onverdict({ type, id: item.id, draft: current() });
	}

	export function decline() {
		if (!open) return;
		const template = drafts.find((d) => d.outcome === "decline");
		// With a decline template, the shortcut loads it for editing. Sending stays an explicit Send.
		if (template) {
			pickedDraft = template.templateId;
			edit();
			return;
		}
		onverdict({ type: "decline", id: item.id });
	}

	export function steer() {
		if (!open) return;
		steering = true;
		queueMicrotask(() => noteEl?.focus());
	}

	export function edit() {
		if (!open || !drafts.length) return;
		queueMicrotask(() => bodyEl?.focus());
	}

	export function undo() {
		if (canUndo(item)) onverdict({ type: "undo", id: item.id });
	}

	function submitSteer() {
		const text = note.trim();
		if (!text) return;
		onverdict({ type: "steer", id: item.id, note: text });
		steering = false;
		note = "";
	}

	function onNoteKeydown(event: KeyboardEvent) {
		if (event.key === "Escape") {
			steering = false;
			event.stopPropagation();
		} else if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			submitSteer();
		}
	}

	async function copy() {
		const draft = current();
		if (!draft) return;
		try {
			await navigator.clipboard.writeText(`${draft.subject}\n\n${draft.body}`);
			copied = true;
			setTimeout(() => (copied = false), 1600);
		} catch {
			copied = false;
		}
	}

	let sendLabel = $derived(
		drafts.length > 1 && selectedDraft
			? `Send ${selectedDraft.label.toLowerCase()}`
			: drafts.length
				? "Approve and send"
				: "Approve",
	);
</script>

<!-- WHY a bordered card only while it waits: a decided or automatic item is a
     line in a log, so it loses the border and the queue stays scannable. -->
<!-- WHY a focusable article: j and k move focus card to card, and a screen reader
     reads the card as one labelled unit. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<article
	data-inbox-item={item.id}
	data-selected={selected || undefined}
	aria-label={item.title}
	tabindex={selected ? 0 : -1}
	onfocusin={onselect}
	onpointerdown={onselect}
	class={cn(
		"flex flex-col gap-3 rounded-xl p-3 outline-none transition-[background-color,border-color,box-shadow] duration-[var(--duration-quick,120ms)] ease-[var(--ease-smooth-out,ease-out)]",
		"focus-visible:ring-ring/50 focus-visible:ring-3",
		open
			? "border-border bg-card border shadow-[var(--elev-card,none)]"
			: "bg-muted/30 border border-transparent",
		selected && open && "border-ring",
	)}
>
	<header class="flex items-start gap-2.5">
		<StatusDot statuses={inboxStates} status={item.state} class="mt-0.5" />
		<span class="sr-only">{inboxStates.label(item.state)}.</span>
		<div class="flex min-w-0 flex-1 flex-col gap-2">
			<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
				<h3 class="text-sm leading-5 font-medium text-balance">{item.title}</h3>
				{#if item.kind !== "action"}
					<StatusBadge statuses={inboxKinds} status={item.kind} />
				{/if}
				{#if !open}
					<StatusBadge statuses={inboxStates} status={item.state} />
				{/if}
			</div>

			{#if renderProposal}
				{@render renderProposal(item)}
			{:else}
				{#if facts.command}
					<div class="flex flex-col items-start gap-1">
						<!-- The padding sits on a wrapper: on the clamped box itself, the 4th line showed through it. -->
						<div class="bg-muted/50 w-full rounded-md px-2.5 py-2">
							<pre
								class={cn(
									"text-foreground font-mono text-xs leading-5 break-words whitespace-pre-wrap",
									!expanded && "line-clamp-3",
								)}><span class="text-muted-foreground select-none"
									>{facts.command.tool} </span>{facts.command.text}</pre>
						</div>
						{#if longCommand}
							<button
								type="button"
								class="text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline"
								aria-expanded={expanded}
								onclick={() => (expanded = !expanded)}
							>
								{expanded ? "Show less" : "Show all"}
							</button>
						{/if}
					</div>
				{/if}
				{#each facts.lines as line, i (i)}
					<p class="text-muted-foreground text-sm text-pretty">{line}</p>
				{/each}
			{/if}

			<!-- Each dot hangs off the fact it leads, in a gutter the wrapper clips, so a wrapped line
			     never starts with a dot. The same pattern as DetailHeader's meta line. -->
			<div class="overflow-hidden">
				<p class="text-muted-foreground -ms-3 flex flex-wrap items-center gap-y-1 text-xs">
					{#if item.agent}
						<span class={cn(FACT, "gap-1.5")}>
							<AgentAvatar
								name={item.agent.name}
								shape={item.agent.shape}
								color={item.agent.color}
								state={item.state === "working" ? "working" : "default"}
								size={16}
								paused={item.state !== "working"}
								interactive={false}
								aria-hidden
							/>
							{item.agent.name}
						</span>
					{:else}
						<span class={cn(FACT, "gap-1.5")}>
							<SourceIcon size={14} aria-hidden="true" />
							{SOURCE_LABEL[item.trace.source.type]}
						</span>
					{/if}
					{#if time}
						<span class={cn(FACT, "tabular-nums")}>{time}</span>
					{/if}
					{#if level !== "high"}
						<span class={cn(FACT, "gap-1.5 tabular-nums", TONE_TEXT[tone])}>
							<StatusDot
								statuses={inboxConfidence}
								status={level}
								progress={item.confidence.score}
								size={12}
								animate={false}
							/>
							{Math.round(item.confidence.score * 100)}% sure
						</span>
					{/if}
				</p>
			</div>

			{#if item.confidence.missing && level !== "high" && open}
				<p class={cn("text-sm", TONE_TEXT[tone])}>Missing: {item.confidence.missing}</p>
			{/if}

			{#if hasTrace}
				<InboxTraceView trace={item.trace} reasoning={why} agent={item.agent?.name} />
			{/if}
		</div>
	</header>

	{#if item.state === "working"}
		<div class="flex flex-col gap-1.5 pl-6">
			<PixelLoader label="Agent is re-running with your note" />
			{#if item.steer}
				<p class="text-muted-foreground border-border border-l-2 pl-3 text-sm">
					&ldquo;{item.steer}&rdquo;
				</p>
			{/if}
		</div>
	{/if}

	{#if open && drafts.length && selectedDraft}
		<div class="pl-6">
			<InboxDraftEditor
				{drafts}
				recommended={item.proposal.recommended}
				selected={selectedDraft.templateId}
				bind:edits
				bind:bodyEl
				onpick={(id) => (pickedDraft = id)}
			/>
		</div>
	{/if}

	{#if open && steering}
		<div class="flex flex-col gap-2 pl-6">
			<Textarea
				bind:ref={noteEl}
				bind:value={note}
				onkeydown={onNoteKeydown}
				placeholder="Tell the agent what to do instead"
				aria-label="Note for the agent"
				class="bg-background min-h-20 text-sm"
			/>
			<div class="flex flex-wrap items-center gap-2">
				<Button size="sm" onclick={submitSteer} disabled={!note.trim()}>Send to agent</Button>
				<Button size="sm" variant="ghost" onclick={() => (steering = false)}>Cancel</Button>
				<span class="text-muted-foreground text-xs max-sm:hidden"
					>The agent retries with your note.</span
				>
			</div>
		</div>
	{:else if open}
		<div class="flex flex-wrap items-center gap-2 pl-6">
			<Button size="sm" onclick={approve} aria-keyshortcuts="a">{sendLabel}</Button>
			{#if !drafts.some((d) => d.outcome === "decline")}
				<Button size="sm" variant="ghost" onclick={decline} aria-keyshortcuts="d">Decline</Button>
			{/if}
			<Button size="sm" variant="ghost" onclick={steer} aria-keyshortcuts="s">Steer</Button>
			{#if drafts.length}
				<Button size="sm" variant="ghost" onclick={copy} class="ml-auto" aria-live="polite">
					{copied ? "Copied" : "Copy"}
				</Button>
			{/if}
		</div>
	{:else if canUndo(item)}
		<div class="pl-6">
			<Button size="sm" variant="outline" onclick={undo} aria-keyshortcuts="u">Undo</Button>
		</div>
	{/if}
</article>
