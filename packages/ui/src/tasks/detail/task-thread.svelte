<script lang="ts">
	import type { Snippet } from "svelte";
	import { PencilSimple, Trash } from "phosphor-svelte";
	import { cn } from "#src/lib/utils.js";
	import { AgentAvatar } from "#src/agents/index.js";
	import { TONE_CLASS } from "#src/lib/tone.js";
	import { Skeleton } from "#src/shadcn/skeleton/index.js";
	import {
		DEFAULT_TASK_DETAIL_LABELS,
		type TaskComment,
		type TaskDetailLabels,
	} from "#src/tasks/detail/detail-types.js";

	interface Props {
		comments: TaskComment[];
		/** Rows still on their way. Draws skeleton rows in place of the thread. */
		loading?: boolean;
		labels?: Partial<TaskDetailLabels>;
		/** Replaces the default agent avatar, drawn in a 24px slot. */
		agentAvatar?: Snippet<[TaskComment]>;
		/** Replaces the default initial for a person, drawn in a 24px slot. */
		avatar?: Snippet<[TaskComment]>;
		/** How a timestamp reads. Defaults to a short date. */
		when?: (comment: TaskComment) => string;
		/** Returns false to keep the draft. Without it the composer is hidden. */
		onSend?: (body: string) => void | boolean | Promise<void | boolean>;
		onEdit?: (comment: TaskComment, body: string) => void | Promise<void>;
		onDelete?: (comment: TaskComment) => void | Promise<void>;
		canEdit?: (comment: TaskComment) => boolean;
	}

	let {
		comments,
		loading = false,
		labels: labelOverrides,
		agentAvatar,
		avatar,
		when = (comment) =>
			new Date(comment.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
		onSend,
		onEdit,
		onDelete,
		canEdit = () => false,
	}: Props = $props();

	let labels = $derived({ ...DEFAULT_TASK_DETAIL_LABELS, ...labelOverrides });
	let draft = $state("");
	let sending = $state(false);
	let editingId = $state<string | null>(null);
	let editDraft = $state("");
	let canSend = $derived(draft.trim().length > 0 && !sending);

	async function send(): Promise<void> {
		if (!canSend || !onSend) return;
		sending = true;
		try {
			const result = await onSend(draft.trim());
			if (result !== false) draft = "";
		} finally {
			sending = false;
		}
	}

	function onComposerKeydown(event: KeyboardEvent): void {
		if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			void send();
		}
	}

	function startEdit(comment: TaskComment): void {
		editingId = comment.id;
		editDraft = comment.body;
	}

	async function saveEdit(comment: TaskComment): Promise<void> {
		const body = editDraft.trim();
		editingId = null;
		if (!body || body === comment.body) return;
		await onEdit?.(comment, body);
	}

	function initial(name: string): string {
		return name.trim().charAt(0).toLocaleUpperCase() || "?";
	}
</script>

<section aria-label={labels.comments} class="flex flex-col gap-3">
	<h2 class="flex h-7 items-center text-xs font-medium text-muted-foreground">{labels.comments}</h2>

	{#if loading}
		<ol class="flex flex-col gap-4" aria-busy="true">
			{#each [0, 1] as row (row)}
				<li class="flex gap-3">
					<Skeleton class="size-6 shrink-0 rounded-full" />
					<div class="flex flex-1 flex-col gap-2">
						<Skeleton class="h-3.5 w-28" />
						<Skeleton class="h-3.5 w-full" />
					</div>
				</li>
			{/each}
		</ol>
	{:else if comments.length > 0}
		<ol class="flex flex-col gap-4">
			{#each comments as comment (comment.id)}
				<li class="group relative flex gap-3">
					<!-- The rail that ties one avatar to the next, as in an activity feed. -->
					<span
						class="absolute start-[11.5px] top-8 -bottom-3 w-px bg-border group-last:hidden"
						aria-hidden="true"
					></span>
					<span class="relative size-6 shrink-0">
						{#if comment.agent}
							{#if agentAvatar}
								{@render agentAvatar(comment)}
							{:else}
								<AgentAvatar name={comment.author} size={24} paused interactive={false} />
							{/if}
						{:else if avatar}
							{@render avatar(comment)}
						{:else}
							<span
								class="grid size-6 place-items-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
								aria-hidden="true"
							>
								{initial(comment.author)}
							</span>
						{/if}
					</span>

					<div class="min-w-0 flex-1">
						<div class="flex h-6 items-center gap-2">
							<span class="truncate text-[13px] font-medium">{comment.author}</span>
							{#if comment.agent}
								<span
									class={cn(
										"inline-flex h-5 items-center rounded-sm border px-1.5 text-xs font-medium",
										TONE_CLASS.accent,
									)}
								>
									{labels.ai}
								</span>
							{/if}
							<span class="text-xs text-muted-foreground tabular-nums">{when(comment)}</span>
							{#if comment.edited}
								<span class="text-xs text-muted-foreground">{labels.commentEdited}</span>
							{/if}
							{#if canEdit(comment) && editingId !== comment.id}
								<span
									class="ms-auto flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100"
								>
									{#if onEdit}
										<button
											type="button"
											class="thread-icon"
											aria-label={labels.commentEdit}
											onclick={() => startEdit(comment)}
										>
											<PencilSimple class="size-3.5" aria-hidden="true" />
										</button>
									{/if}
									{#if onDelete}
										<button
											type="button"
											class="thread-icon"
											aria-label={labels.commentDelete}
											onclick={() => onDelete?.(comment)}
										>
											<Trash class="size-3.5" aria-hidden="true" />
										</button>
									{/if}
								</span>
							{/if}
						</div>

						{#if editingId === comment.id}
							<textarea
								bind:value={editDraft}
								rows={3}
								aria-label={labels.comments}
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
						{:else}
							<p class="text-sm leading-relaxed whitespace-pre-wrap text-pretty">{comment.body}</p>
						{/if}
					</div>
				</li>
			{/each}
		</ol>
	{:else if !onSend}
		<p class="text-[13px] text-muted-foreground">{labels.commentsEmpty}</p>
	{/if}

	{#if onSend}
		<div
			class="rounded-lg border border-input transition-shadow focus-within:ring-3 focus-within:ring-ring/50"
		>
			<textarea
				bind:value={draft}
				onkeydown={onComposerKeydown}
				rows={2}
				placeholder={labels.commentPlaceholder}
				aria-label={labels.commentPlaceholder}
				class="block max-h-60 min-h-16 w-full resize-none border-0 bg-transparent px-3 py-2 text-sm leading-relaxed outline-none [field-sizing:content] placeholder:text-muted-foreground"
			></textarea>
			<div class="flex justify-end px-2 pb-2">
				<button
					type="button"
					class="thread-button thread-primary"
					onclick={send}
					disabled={!canSend}
				>
					{sending ? labels.saving : labels.commentSend}
				</button>
			</div>
		</div>
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
