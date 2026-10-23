<script lang="ts">
	import type { Snippet } from "svelte";
	import { ArrowBendDownRight, Check, MapPin, PencilSimple, Trash } from "phosphor-svelte";
	import { cn } from "#src/lib/utils.js";
	import { initial } from "#src/lib/initials.js";
	import { AgentAvatar } from "#src/agents/index.js";
	import RichRenderer from "#src/editor/renderer.svelte";
	import { Skeleton } from "#src/shadcn/skeleton/index.js";
	import ThreadBody from "#src/thread/thread-body.svelte";
	import ThreadEvents from "#src/thread/thread-events.svelte";
	import {
		buildThread,
		fillCount,
		interleave,
		resolveThreadLabels,
		resolvedCount,
	} from "#src/thread/logic.js";
	import type { ThreadComment, ThreadEvent, ThreadLabels, ThreadPost } from "#src/thread/types.js";

	interface Props {
		comments: ThreadComment[];
		/** Status moves, assignments and the like, one quiet line each between the comments. */
		events?: ThreadEvent[];
		/** Rows still on their way. Draws skeleton rows in place of the thread. */
		loading?: boolean;
		labels?: Partial<ThreadLabels>;
		/** Replaces the default avatar for a person or an agent, drawn in a 24px slot. */
		avatar?: Snippet<[ThreadComment]>;
		/** Content under a comment's body, such as files. */
		attachments?: Snippet<[ThreadComment]>;
		/** Replaces the default "Pinned" chip on a comment that has an anchor. */
		anchorChip?: Snippet<[ThreadComment]>;
		/** How a timestamp reads. Defaults to a short date. */
		when?: (comment: ThreadComment) => string;
		/** How an event's time reads. Defaults to a short date. */
		whenEvent?: (event: ThreadEvent) => string;
		/** The locale the default times read in. */
		locale?: string;
		/** Returns false to keep the draft. Without it no composer shows. */
		onPost?: (post: ThreadPost) => void | boolean | Promise<void | boolean>;
		onEdit?: (comment: ThreadComment, body: string) => void | Promise<void>;
		onDelete?: (comment: ThreadComment) => void | Promise<void>;
		/** Without it a root has no resolve button. */
		onResolve?: (comment: ThreadComment, resolved: boolean) => void | Promise<void>;
		/** A click on a pinned comment's chip, to move a canvas to its node. */
		onAnchor?: (comment: ThreadComment) => void;
		/** Whose comments carry the edit and delete buttons. A rich comment can't be edited here. */
		canEdit?: (comment: ThreadComment) => boolean;
		class?: string;
	}

	let {
		comments,
		events = [],
		locale = "en-GB",
		loading = false,
		labels: labelOverrides,
		avatar,
		attachments,
		anchorChip,
		when = (comment) => shortDate(comment.createdAt),
		whenEvent = (event) => shortDate(event.at),
		onPost,
		onEdit,
		onDelete,
		onResolve,
		onAnchor,
		canEdit = () => false,
		class: className,
	}: Props = $props();

	let labels = $derived(resolveThreadLabels(labelOverrides));
	let nodes = $derived(buildThread(comments));
	let resolved = $derived(resolvedCount(nodes));
	let showResolved = $state(false);
	let shown = $derived(showResolved ? nodes : nodes.filter((node) => !node.comment.resolved));
	let items = $derived(interleave(shown, events));

	function shortDate(at: string): string {
		return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(new Date(at));
	}

	let draft = $state("");
	let replyTo = $state<string | null>(null);
	let replyDraft = $state("");
	let sending = $state(false);
	let editingId = $state<string | null>(null);
	let editDraft = $state("");

	async function post(body: string, parentId: string | null): Promise<boolean> {
		const text = body.trim();
		if (!text || sending || !onPost) return false;
		sending = true;
		try {
			return (await onPost({ body: text, parentId })) !== false;
		} finally {
			sending = false;
		}
	}

	async function sendRoot(): Promise<void> {
		if (await post(draft, null)) draft = "";
	}

	async function sendReply(): Promise<void> {
		if (await post(replyDraft, replyTo)) {
			replyDraft = "";
			replyTo = null;
		}
	}

	function submitOnModEnter(event: KeyboardEvent, send: () => Promise<void>): void {
		if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			void send();
		}
	}

	async function saveEdit(comment: ThreadComment): Promise<void> {
		const body = editDraft.trim();
		editingId = null;
		if (!body || body === comment.body) return;
		await onEdit?.(comment, body);
	}
</script>

{#snippet composer(
	value: string,
	placeholder: string,
	onSend: () => Promise<void>,
	set: (next: string) => void,
	isReply: boolean,
)}
	<div
		class="rounded-lg border border-input transition-shadow focus-within:ring-3 focus-within:ring-ring/50"
	>
		<!-- svelte-ignore a11y_autofocus -->
		<textarea
			{value}
			oninput={(event) => set(event.currentTarget.value)}
			onkeydown={(event) => submitOnModEnter(event, onSend)}
			rows={2}
			{placeholder}
			aria-label={placeholder}
			autofocus={isReply}
			class="block max-h-60 min-h-16 w-full resize-none border-0 bg-transparent px-3 py-2 text-sm leading-relaxed outline-none [field-sizing:content] placeholder:text-muted-foreground"
		></textarea>
		<div class="flex justify-end px-2 pb-2">
			<button
				type="button"
				class="thread-button thread-primary"
				onclick={onSend}
				disabled={!value.trim() || sending}
			>
				{sending ? labels.sending : isReply ? labels.reply : labels.send}
			</button>
		</div>
	</div>
{/snippet}

{#snippet row(comment: ThreadComment, isRoot: boolean)}
	<div class="group/row relative flex gap-3">
		<span class="relative size-6 shrink-0">
			{#if avatar}
				{@render avatar(comment)}
			{:else if comment.author.kind === "agent"}
				<AgentAvatar name={comment.author.name} size={24} paused interactive={false} />
			{:else if comment.author.avatar}
				<img src={comment.author.avatar} alt="" class="size-6 rounded-full object-cover" />
			{:else}
				<span
					class="grid size-6 place-items-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
					aria-hidden="true"
				>
					{initial(comment.author.name)}
				</span>
			{/if}
		</span>

		<div class="min-w-0 flex-1">
			<div class="flex min-h-6 flex-wrap items-center gap-x-2">
				<span class="truncate text-[13px] font-medium">{comment.author.name}</span>
				{#if comment.author.kind === "agent"}
					<span class="sr-only">{labels.agent}</span>
				{/if}
				<span class="text-xs text-muted-foreground tabular-nums">{when(comment)}</span>
				{#if comment.edited}
					<span class="text-xs text-muted-foreground">{labels.edited}</span>
				{/if}
				{#if comment.anchor}
					{#if anchorChip}
						{@render anchorChip(comment)}
					{:else if onAnchor}
						<button type="button" class="thread-chip" onclick={() => onAnchor(comment)}>
							<MapPin class="size-3" aria-hidden="true" />{labels.pinned}
						</button>
					{:else}
						<span class="thread-chip"
							><MapPin class="size-3" aria-hidden="true" />{labels.pinned}</span
						>
					{/if}
				{/if}
				{#if editingId !== comment.id}
					<span
						class="ms-auto flex gap-0.5 opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100"
					>
						{#if isRoot && onResolve}
							<button
								type="button"
								class="thread-icon"
								aria-label={comment.resolved ? labels.unresolve : labels.resolve}
								aria-pressed={comment.resolved ?? false}
								onclick={() => onResolve(comment, !comment.resolved)}
							>
								<Check class="size-3.5" aria-hidden="true" />
							</button>
						{/if}
						{#if canEdit(comment)}
							{#if onEdit && !comment.content}
								<button
									type="button"
									class="thread-icon"
									aria-label={labels.edit}
									onclick={() => {
										editingId = comment.id;
										editDraft = comment.body;
									}}
								>
									<PencilSimple class="size-3.5" aria-hidden="true" />
								</button>
							{/if}
							{#if onDelete}
								<button
									type="button"
									class="thread-icon"
									aria-label={labels.delete}
									onclick={() => onDelete?.(comment)}
								>
									<Trash class="size-3.5" aria-hidden="true" />
								</button>
							{/if}
						{/if}
					</span>
				{/if}
			</div>

			{#if editingId === comment.id}
				<textarea
					bind:value={editDraft}
					rows={3}
					aria-label={labels.edit}
					class="mt-1 w-full resize-y rounded-md border border-input bg-transparent px-2.5 py-2 text-sm leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
				></textarea>
				<div class="mt-2 flex justify-end gap-1.5">
					<button type="button" class="thread-button" onclick={() => (editingId = null)}
						>{labels.cancel}</button
					>
					<button
						type="button"
						class="thread-button thread-primary"
						onclick={() => saveEdit(comment)}>{labels.save}</button
					>
				</div>
			{:else if comment.content}
				<div class="text-sm leading-relaxed"><RichRenderer content={comment.content} /></div>
			{:else}
				<ThreadBody text={comment.body} more={labels.showMore} less={labels.showLess} />
			{/if}

			{@render attachments?.(comment)}
		</div>
	</div>
{/snippet}

<section aria-label={labels.title} class={cn("flex flex-col gap-3", className)}>
	<div class="flex h-7 items-center justify-between">
		<h2 class="text-xs font-medium text-muted-foreground">{labels.title}</h2>
		{#if resolved > 0}
			<button
				type="button"
				class="thread-button"
				aria-expanded={showResolved}
				onclick={() => (showResolved = !showResolved)}
			>
				{showResolved ? labels.hideResolved : fillCount(labels.showResolved, resolved)}
			</button>
		{/if}
	</div>

	{#if loading}
		<ol class="flex flex-col gap-4" aria-busy="true">
			{#each [0, 1] as placeholder (placeholder)}
				<li class="flex gap-3">
					<Skeleton class="size-6 shrink-0 rounded-full" />
					<div class="flex flex-1 flex-col gap-2">
						<Skeleton class="h-3.5 w-28" />
						<Skeleton class="h-3.5 w-full" />
					</div>
				</li>
			{/each}
		</ol>
	{:else if items.length > 0}
		<ol class="flex flex-col gap-4">
			{#each items as item (item.key)}
				{#if item.type === "events"}
					<li><ThreadEvents events={item.events} when={whenEvent} /></li>
				{:else}
					{@const node = item.node}
					<li
						class={cn("flex flex-col gap-3", node.comment.resolved && "opacity-60")}
						data-resolved={node.comment.resolved || undefined}
					>
						{@render row(node.comment, true)}
						{#if node.comment.resolved}
							<span class="ms-9 text-xs text-muted-foreground">{labels.resolved}</span>
						{/if}
						{#if node.replies.length > 0}
							<ol class="ms-3 flex flex-col gap-3 border-s border-border ps-6">
								{#each node.replies as reply (reply.id)}
									<li>{@render row(reply, false)}</li>
								{/each}
							</ol>
						{/if}
						{#if onPost && !node.comment.resolved}
							{#if replyTo === node.comment.id}
								<div class="ms-9">
									{@render composer(
										replyDraft,
										labels.replyPlaceholder,
										sendReply,
										(next) => (replyDraft = next),
										true,
									)}
								</div>
							{:else}
								<button
									type="button"
									class="thread-button ms-9 flex w-fit items-center gap-1.5"
									onclick={() => {
										replyTo = node.comment.id;
										replyDraft = "";
									}}
								>
									<ArrowBendDownRight class="size-3.5" aria-hidden="true" />{labels.reply}
								</button>
							{/if}
						{/if}
					</li>
				{/if}
			{/each}
		</ol>
	{:else if !onPost}
		<p class="text-[13px] text-muted-foreground">{labels.empty}</p>
	{/if}

	{#if onPost}
		{@render composer(draft, labels.placeholder, sendRoot, (next) => (draft = next), false)}
	{/if}
</section>

<style>
	.thread-icon {
		display: grid;
		place-items: center;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: var(--radius-md, 0.5rem);
		color: var(--color-muted-foreground);
		outline: none;
		transition: background-color var(--duration-quick, 150ms) var(--ease-smooth-out, ease-out);
	}

	.thread-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		height: 1.25rem;
		padding-inline: 0.375rem;
		border-radius: var(--radius-sm, 0.25rem);
		background: var(--color-muted);
		color: var(--color-muted-foreground);
		font-size: 0.75rem;
		outline: none;
	}

	button.thread-chip:focus-visible {
		box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-ring) 50%, transparent);
	}

	@media (hover: hover) and (pointer: fine) {
		.thread-icon:hover {
			background: var(--color-muted);
			color: var(--color-foreground);
		}
	}

	.thread-icon:focus-visible,
	.thread-button:focus-visible {
		box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-ring) 50%, transparent);
	}

	.thread-button {
		height: 1.75rem;
		padding-inline: 0.75rem;
		border-radius: var(--radius-md, 0.5rem);
		font-size: 0.8125rem;
		font-weight: 500;
		outline: none;
		transition: background-color var(--duration-quick, 150ms) var(--ease-smooth-out, ease-out);
	}

	@media (hover: hover) and (pointer: fine) {
		.thread-button:hover:not(:disabled) {
			background: var(--color-muted);
		}
	}

	.thread-button:disabled {
		opacity: 0.5;
		pointer-events: none;
	}

	.thread-primary {
		background: var(--color-primary);
		color: var(--color-primary-foreground);
	}

	/* An empty draft reads as an outlined button, not a faded fill. */
	.thread-primary:disabled {
		opacity: 1;
		background: transparent;
		box-shadow: inset 0 0 0 1px var(--color-border);
		color: var(--color-muted-foreground);
	}

	@media (hover: hover) and (pointer: fine) {
		.thread-primary:hover:not(:disabled) {
			background: color-mix(in oklab, var(--color-primary) 90%, transparent);
		}
	}

	@media (any-pointer: coarse) {
		.thread-button {
			height: 2.5rem;
		}
	}
</style>
