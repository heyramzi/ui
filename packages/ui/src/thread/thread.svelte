<script lang="ts">
	import type { Snippet } from "svelte";
	import { Toggle } from "bits-ui";
	import { ArrowBendDownRight, Check, MapPin, PencilSimple, Trash } from "phosphor-svelte";
	import { cn } from "#src/lib/utils.js";
	import { focusAfterRender } from "#src/lib/focus.js";
	import { shortDate } from "#src/lib/dates.js";
	import { initial } from "#src/lib/initials.js";
	import { AgentAvatar } from "#src/agents/index.js";
	import RichRenderer from "#src/editor/renderer.svelte";
	import { Skeleton } from "#src/shadcn/skeleton/index.js";
	import { Button } from "#src/shadcn/button/index.js";
	import { TagChip } from "#src/components/chip/index.js";
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
		/** False hides the visible title, for a thread already named by its tab. Screen readers still get it. */
		heading?: boolean;
		/** Drawn above the composer, such as a question waiting on an answer. */
		footer?: Snippet;
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
		when = (comment) => shortDate(comment.createdAt, { locale }),
		whenEvent = (event) => shortDate(event.at, { locale }),
		onPost,
		onEdit,
		onDelete,
		onResolve,
		onAnchor,
		canEdit = () => false,
		heading = true,
		footer,
		class: className,
	}: Props = $props();

	let labels = $derived(resolveThreadLabels(labelOverrides));
	let nodes = $derived(buildThread(comments));
	let resolved = $derived(resolvedCount(nodes));
	let showResolved = $state(false);
	let shown = $derived(showResolved ? nodes : nodes.filter((node) => !node.comment.resolved));
	let items = $derived(interleave(shown, events));

	let draft = $state("");
	let replyTo = $state<string | null>(null);
	let replyDraft = $state("");
	let sending = $state(false);
	let editingId = $state<string | null>(null);
	let editDraft = $state("");
	let threadEl: HTMLElement | undefined = $state();

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
		// The emptied draft disables Send, which drops focus to the page.
		if (document.activeElement === document.body) {
			await focusAfterRender(threadEl, "[data-thread-composer]");
		}
	}

	async function sendReply(): Promise<void> {
		if (await post(replyDraft, replyTo)) closeReply();
	}

	function closeReply(): void {
		const parentId = replyTo;
		replyDraft = "";
		replyTo = null;
		void focusAfterRender(threadEl, `[data-thread-reply="${CSS.escape(parentId ?? "")}"]`);
	}

	function onComposerKey(event: KeyboardEvent, send: () => Promise<void>, isReply: boolean): void {
		if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			void send();
		} else if (event.key === "Escape" && isReply) {
			event.preventDefault();
			closeReply();
		}
	}

	function openEdit(comment: ThreadComment): void {
		editingId = comment.id;
		editDraft = comment.body;
		void focusAfterRender(threadEl, `[data-thread-edit-box="${CSS.escape(comment.id)}"]`);
	}

	function closeEdit(id: string): void {
		editingId = null;
		void focusAfterRender(threadEl, `[data-thread-edit="${CSS.escape(id)}"]`);
	}

	async function saveEdit(comment: ThreadComment): Promise<void> {
		const body = editDraft.trim();
		closeEdit(comment.id);
		if (!body || body === comment.body) return;
		await onEdit?.(comment, body);
	}

	// Focus lands on the next comment still shown, then the one before, the composer, the thread.
	async function remove(comment: ThreadComment): Promise<void> {
		const ids = [...(threadEl?.querySelectorAll<HTMLElement>("[data-comment]") ?? [])].map(
			(el) => el.dataset.comment ?? "",
		);
		const at = ids.indexOf(comment.id);
		const around = [...ids.slice(at + 1), ...ids.slice(0, at).reverse()];
		await onDelete?.(comment);
		await focusAfterRender(
			threadEl,
			...around.map((id) => `[data-comment="${CSS.escape(id)}"]`),
			"[data-thread-composer]",
			threadEl,
		);
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
			onkeydown={(event) => onComposerKey(event, onSend, isReply)}
			rows={2}
			{placeholder}
			aria-label={placeholder}
			autofocus={isReply}
			data-thread-composer={isReply ? undefined : ""}
			class="block max-h-60 min-h-16 w-full resize-none border-0 bg-transparent px-3 py-2 text-sm leading-relaxed outline-none [field-sizing:content] placeholder:text-muted-foreground"
		></textarea>
		<div class="flex justify-end px-2 pb-2">
			<Button size="sm" onclick={onSend} disabled={!value.trim() || sending}>
				{sending ? labels.sending : isReply ? labels.reply : labels.send}
			</Button>
		</div>
	</div>
{/snippet}

{#snippet row(comment: ThreadComment, isRoot: boolean)}
	<div
		data-comment={comment.id}
		tabindex="-1"
		class="group/row hover-row relative flex gap-3 rounded-md outline-none focus-visible:shadow-(--ring-focus)"
	>
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
				<span class="truncate text-(length:--text-control) font-medium">{comment.author.name}</span>
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
						<button
							type="button"
							class="rounded-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
							onclick={() => onAnchor(comment)}
							><TagChip
								>{#snippet icon()}<MapPin aria-hidden="true" />{/snippet}{labels.pinned}</TagChip
							></button
						>
					{:else}
						<TagChip
							>{#snippet icon()}<MapPin aria-hidden="true" />{/snippet}{labels.pinned}</TagChip
						>
					{/if}
				{/if}
				{#if editingId !== comment.id}
					<span class="row-action ms-auto flex gap-0.5">
						{#if isRoot && onResolve}
							<Button
								variant="ghost"
								size="sm"
								icon
								aria-label={comment.resolved ? labels.unresolve : labels.resolve}
								aria-pressed={comment.resolved ?? false}
								onclick={() => onResolve(comment, !comment.resolved)}
							>
								<Check class="size-3.5" aria-hidden="true" />
							</Button>
						{/if}
						{#if canEdit(comment)}
							{#if onEdit && !comment.content}
								<Button
									variant="ghost"
									size="sm"
									icon
									aria-label={labels.edit}
									data-thread-edit={comment.id}
									onclick={() => openEdit(comment)}
								>
									<PencilSimple class="size-3.5" aria-hidden="true" />
								</Button>
							{/if}
							{#if onDelete}
								<Button
									variant="ghost"
									size="sm"
									icon
									aria-label={labels.delete}
									onclick={() => remove(comment)}
								>
									<Trash class="size-3.5" aria-hidden="true" />
								</Button>
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
					data-thread-edit-box={comment.id}
					onkeydown={(event) => {
						if (event.key !== "Escape") return;
						event.preventDefault();
						closeEdit(comment.id);
					}}
					class="mt-1 w-full resize-y rounded-md border border-input bg-transparent px-2.5 py-2 text-sm leading-relaxed outline-none focus-visible:border-ring focus-visible:shadow-(--ring-focus)"
				></textarea>
				<div class="mt-2 flex justify-end gap-1.5">
					<Button variant="ghost" size="sm" onclick={() => closeEdit(comment.id)}
						>{labels.cancel}</Button
					>
					<Button size="sm" onclick={() => saveEdit(comment)}>{labels.save}</Button>
				</div>
			{:else if comment.content}
				<div
					class="text-sm leading-relaxed [--content-gap:0.5em] [--content-leading:1.625] [--content-size:var(--text-sm)]"
				>
					<RichRenderer content={comment.content} />
				</div>
			{:else}
				<ThreadBody text={comment.body} more={labels.showMore} less={labels.showLess} />
			{/if}

			{@render attachments?.(comment)}
		</div>
	</div>
{/snippet}

<section
	bind:this={threadEl}
	tabindex="-1"
	aria-label={labels.title}
	class={cn("flex flex-col gap-3 outline-none", className)}
>
	<div class={cn("flex h-7 items-center justify-between", !heading && resolved === 0 && "sr-only")}>
		<h2 class={cn("text-xs font-medium text-muted-foreground", !heading && "sr-only")}>
			{labels.title}
		</h2>
		{#if resolved > 0}
			<!-- A filter on the list, so it reports pressed, not expanded. The wash it had as an
			     expanded ghost button moves to aria-pressed. -->
			<Toggle.Root bind:pressed={showResolved}>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="ghost"
						size="sm"
						class="aria-pressed:bg-foreground/6 aria-pressed:text-foreground"
					>
						{showResolved ? labels.hideResolved : fillCount(labels.showResolved, resolved)}
					</Button>
				{/snippet}
			</Toggle.Root>
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
								<Button
									variant="ghost"
									size="sm"
									class="ms-9 w-fit"
									data-thread-reply={node.comment.id}
									onclick={() => {
										replyTo = node.comment.id;
										replyDraft = "";
									}}
								>
									<ArrowBendDownRight class="size-3.5" aria-hidden="true" />{labels.reply}
								</Button>
							{/if}
						{/if}
					</li>
				{/if}
			{/each}
		</ol>
	{:else if !onPost}
		<p class="text-(length:--text-control) text-muted-foreground">{labels.empty}</p>
	{/if}

	{@render footer?.()}

	{#if onPost}
		{@render composer(draft, labels.placeholder, sendRoot, (next) => (draft = next), false)}
	{/if}
</section>
