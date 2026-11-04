<script lang="ts">
	import type { Snippet } from "svelte";
	import { PencilSimple, Trash } from "phosphor-svelte";
	import { initial } from "#src/lib/initials.js";
	import { AgentAvatar } from "#src/agents/index.js";
	import { Skeleton } from "#src/shadcn/skeleton/index.js";
	import { Button } from "#src/shadcn/button/index.js";
	import { Textarea } from "#src/shadcn/textarea/index.js";
	import * as Avatar from "#src/shadcn/avatar/index.js";
	import {
		DEFAULT_TASK_DETAIL_LABELS,
		type TaskComment,
		type TaskDetailLabels,
	} from "#src/work/detail/detail-types.js";

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
		/** The locale the default times read in. */
		locale?: string;
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
		locale = "en-GB",
		when = (comment) =>
			new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(
				new Date(comment.createdAt),
			),
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
				<li class="group hover-row relative flex gap-3">
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
							<Avatar.Root class="size-6" aria-hidden="true">
								<Avatar.Fallback class="text-xs font-medium"
									>{initial(comment.author)}</Avatar.Fallback
								>
							</Avatar.Root>
						{/if}
					</span>

					<div class="min-w-0 flex-1">
						<div class="flex h-6 items-center gap-2">
							<span class="truncate text-(length:--text-control) font-medium">{comment.author}</span
							>
							{#if comment.agent}
								<span class="sr-only">{labels.ai}</span>
							{/if}
							<span class="text-xs text-muted-foreground tabular-nums">{when(comment)}</span>
							{#if comment.edited}
								<span class="text-xs text-muted-foreground">{labels.commentEdited}</span>
							{/if}
							{#if canEdit(comment) && editingId !== comment.id}
								<span class="row-action ms-auto flex gap-0.5">
									{#if onEdit}
										<Button
											variant="ghost"
											size="sm"
											icon
											class="text-muted-foreground"
											aria-label={labels.commentEdit}
											onclick={() => startEdit(comment)}
										>
											<PencilSimple aria-hidden="true" />
										</Button>
									{/if}
									{#if onDelete}
										<Button
											variant="ghost"
											size="sm"
											icon
											class="text-muted-foreground"
											aria-label={labels.commentDelete}
											onclick={() => onDelete?.(comment)}
										>
											<Trash aria-hidden="true" />
										</Button>
									{/if}
								</span>
							{/if}
						</div>

						{#if editingId === comment.id}
							<Textarea
								bind:value={editDraft}
								rows={3}
								aria-label={labels.comments}
								class="mt-1 resize-y leading-relaxed"
							/>
							<div class="mt-2 flex justify-end gap-1.5">
								<Button variant="ghost" size="sm" onclick={() => (editingId = null)}
									>{labels.cancel}</Button
								>
								<Button size="sm" onclick={() => saveEdit(comment)}>{labels.save}</Button>
							</div>
						{:else}
							<p class="text-sm leading-relaxed whitespace-pre-wrap text-pretty">{comment.body}</p>
						{/if}
					</div>
				</li>
			{/each}
		</ol>
	{:else if !onSend}
		<p class="text-(length:--text-control) text-muted-foreground">{labels.commentsEmpty}</p>
	{/if}

	{#if onSend}
		<!-- The send button sits inside the field's bottom edge, so the composer reads as one box. -->
		<div class="relative">
			<Textarea
				bind:value={draft}
				onkeydown={onComposerKeydown}
				rows={2}
				placeholder={labels.commentPlaceholder}
				aria-label={labels.commentPlaceholder}
				class="max-h-60 resize-none px-3 pb-11 leading-relaxed"
			/>
			<!-- An empty draft reads as an outlined button, not a faded fill. -->
			<Button
				size="sm"
				variant={canSend ? "default" : "outline"}
				class="absolute end-2 bottom-2 disabled:opacity-100"
				onclick={send}
				disabled={!canSend}
			>
				{sending ? labels.saving : labels.commentSend}
			</Button>
		</div>
	{/if}
</section>
