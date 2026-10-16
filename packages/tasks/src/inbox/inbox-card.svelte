<script lang="ts">
	import { untrack, type Snippet } from "svelte";
	import { AgentAvatar } from "@heyramzi/ui/agents";
	import { PixelLoader } from "@heyramzi/ui/ai/loading-state";
	import { Button } from "@heyramzi/ui/shadcn/button";
	import { Textarea } from "@heyramzi/ui/shadcn/textarea";
	import { cn } from "../lib/cn.js";
	import StatusBadge from "../status-badge.svelte";
	import StatusDot from "../status-dot.svelte";
	import { TONE_TEXT } from "../tone.js";
	import InboxDraftEditor from "./inbox-draft.svelte";
	import { canUndo, isOpen, startDraft } from "./inbox-logic.js";
	import {
		SOURCE_ICON,
		SOURCE_LABEL,
		confidenceLevel,
		inboxConfidence,
		inboxKinds,
		inboxStates,
	} from "./inbox-statuses.js";
	import InboxTraceView from "./inbox-trace.svelte";
	import type { InboxDraftEdits, InboxItem, InboxVerdict } from "./inbox-types.js";

	type Props = {
		item: InboxItem;
		/** The keyboard cursor is on this card. */
		selected?: boolean;
		onselect?: () => void;
		onverdict: (verdict: InboxVerdict) => void;
		/** Replaces the summary lines, for a host that renders its own proposal. */
		renderProposal?: Snippet<[InboxItem]>;
	};

	let { item, selected = false, onselect, onverdict, renderProposal }: Props = $props();

	let drafts = $derived(item.proposal.drafts ?? []);
	let open = $derived(isOpen(item));
	let level = $derived(confidenceLevel(item.confidence.score));
	let tone = $derived(inboxConfidence.tone(level));

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
		open ? "border-border bg-card border shadow-[var(--elev-card,none)]" : "bg-muted/30 border border-transparent",
		selected && open && "border-ring",
	)}
>
	<header class="flex items-start gap-2.5">
		<StatusDot statuses={inboxStates} status={item.state} class="mt-0.5" />
		<span class="sr-only">{inboxStates.label(item.state)}.</span>
		<div class="flex min-w-0 flex-1 flex-col gap-1">
			<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
				<h3 class="text-sm leading-5 font-medium text-balance">{item.title}</h3>
				<StatusBadge statuses={inboxKinds} status={item.kind} />
				{#if !open}
					<StatusBadge statuses={inboxStates} status={item.state} />
				{/if}
			</div>
			{#if renderProposal}
				{@render renderProposal(item)}
			{:else}
				<p class="text-muted-foreground text-sm text-pretty">{item.proposal.summary}</p>
				{#if item.proposal.detail}
					<p class="text-muted-foreground text-sm text-pretty">{item.proposal.detail}</p>
				{/if}
			{/if}
		</div>
	</header>

	<div class="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 pl-6 text-xs">
		<span class="inline-flex items-center gap-1.5">
			<span class="size-3.5 [&>svg]:size-full" aria-hidden="true">{@html SOURCE_ICON[item.trace.source.type]}</span>
			{SOURCE_LABEL[item.trace.source.type]}, {item.trace.source.at}
		</span>
		<span class={cn("inline-flex items-center gap-1.5 tabular-nums", TONE_TEXT[tone])}>
			<StatusDot
				statuses={inboxConfidence}
				status={level}
				progress={item.confidence.score}
				size={12}
				animate={false}
			/>
			{Math.round(item.confidence.score * 100)}% sure
		</span>
		{#if item.agent}
			<span class="inline-flex items-center gap-1.5">
				<AgentAvatar
					name={item.agent.name}
					shape={item.agent.shape}
					color={item.agent.color}
					state={item.state === "working" ? "working" : "default"}
					size={16}
				/>
				{item.agent.name}
			</span>
		{/if}
	</div>

	{#if item.confidence.missing && level !== "high" && open}
		<p class={cn("pl-6 text-sm", TONE_TEXT[tone])}>Missing: {item.confidence.missing}</p>
	{/if}

	<div class="pl-6">
		<InboxTraceView trace={item.trace} />
	</div>

	{#if item.state === "working"}
		<div class="flex flex-col gap-1.5 pl-6">
			<PixelLoader label="Agent is re-running with your note" />
			{#if item.steer}
				<p class="text-muted-foreground border-border border-l-2 pl-3 text-sm">&ldquo;{item.steer}&rdquo;</p>
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
				<span class="text-muted-foreground text-xs max-sm:hidden">The agent retries with your note.</span>
			</div>
		</div>
	{:else if open}
		<div class="flex flex-wrap items-center gap-2 pl-6">
			<Button size="sm" onclick={approve} aria-keyshortcuts="a">{sendLabel}</Button>
			{#if !drafts.some((d) => d.outcome === "decline")}
				<Button size="sm" variant="destructive" onclick={decline} aria-keyshortcuts="d">Decline</Button>
			{/if}
			<Button size="sm" variant="outline" onclick={steer} aria-keyshortcuts="s">Steer</Button>
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
