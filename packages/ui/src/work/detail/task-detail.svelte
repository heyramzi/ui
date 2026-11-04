<script lang="ts">
	import type { Snippet } from "svelte";
	import { Circle, CheckCircle, PencilSimple } from "phosphor-svelte";
	import { cn } from "#src/lib/utils.js";
	import { Button } from "#src/shadcn/button/index.js";
	import { Textarea } from "#src/shadcn/textarea/index.js";
	import {
		DEFAULT_TASK_DETAIL_LABELS,
		type TaskComment,
		type TaskDetailLabels,
	} from "#src/work/detail/detail-types.js";
	import TaskThread from "#src/work/detail/task-thread.svelte";

	interface Props {
		title: string;
		/** Without it the title is read-only. */
		onTitleChange?: (next: string) => void | Promise<void>;
		done?: boolean;
		/** Closed covers done and dropped: the title mutes, never strikes through. */
		closed?: boolean;
		onToggleDone?: () => void;
		/** One 12px line under the title: origin, dates. */
		meta?: Snippet;
		/** The rail. A row of `TaskProperty` with a `TaskChip` or any picker trigger in each. */
		properties?: Snippet;
		/** Under the rail's rows: ids, shortcuts, anything quiet. */
		railFooter?: Snippet;
		description?: string | null;
		onDescriptionChange?: (next: string | null) => void | Promise<void>;
		comments?: TaskComment[];
		loadingComments?: boolean;
		agentAvatar?: Snippet<[TaskComment]>;
		avatar?: Snippet<[TaskComment]>;
		when?: (comment: TaskComment) => string;
		onSend?: (body: string) => void | boolean | Promise<void | boolean>;
		onEditComment?: (comment: TaskComment, body: string) => void | Promise<void>;
		onDeleteComment?: (comment: TaskComment) => void | Promise<void>;
		canEditComment?: (comment: TaskComment) => boolean;
		labels?: Partial<TaskDetailLabels>;
		class?: string;
	}

	let {
		title,
		onTitleChange,
		done = false,
		closed = false,
		onToggleDone,
		meta,
		properties,
		railFooter,
		description = null,
		onDescriptionChange,
		comments = [],
		loadingComments = false,
		agentAvatar,
		avatar,
		when,
		onSend,
		onEditComment,
		onDeleteComment,
		canEditComment,
		labels: labelOverrides,
		class: className,
	}: Props = $props();

	let labels = $derived({ ...DEFAULT_TASK_DETAIL_LABELS, ...labelOverrides });
	let editingTitle = $state(false);
	let titleDraft = $state("");
	let titleField = $state<HTMLTextAreaElement | null>(null);
	let editingDescription = $state(false);
	let descriptionDraft = $state("");
	let savingDescription = $state(false);

	function startTitle(): void {
		if (!onTitleChange) return;
		titleDraft = title;
		editingTitle = true;
		queueMicrotask(() => titleField?.focus());
	}

	function commitTitle(): void {
		const next = titleDraft.trim();
		editingTitle = false;
		if (next && next !== title) void onTitleChange?.(next);
	}

	function onTitleKeydown(event: KeyboardEvent): void {
		if (event.key === "Enter") {
			event.preventDefault();
			commitTitle();
		}
		if (event.key === "Escape") {
			event.preventDefault();
			event.stopPropagation();
			editingTitle = false;
		}
	}

	function startDescription(): void {
		if (!onDescriptionChange) return;
		descriptionDraft = description ?? "";
		editingDescription = true;
	}

	async function saveDescription(): Promise<void> {
		savingDescription = true;
		try {
			await onDescriptionChange?.(descriptionDraft.trim() || null);
		} finally {
			savingDescription = false;
			editingDescription = false;
		}
	}
</script>

<!-- A container query, not a viewport one, so the rail also collapses inside a pop-up. -->
<div class={cn("@container flex-1", className)}>
	<div class="grid grid-cols-1 @3xl:grid-cols-[minmax(0,1fr)_18rem] @3xl:grid-rows-[auto_1fr]">
		<header class="min-w-0 px-4 pt-6 @3xl:col-start-1 @3xl:px-8">
			<div class="mx-auto w-full max-w-184">
				<div class="flex items-start gap-2">
					<Button
						variant="ghost"
						size="sm"
						icon
						onclick={onToggleDone}
						disabled={!onToggleDone}
						aria-label={done ? labels.markIncomplete : labels.markComplete}
						class={cn(
							"mt-px disabled:opacity-100",
							done ? "text-success" : "text-muted-foreground/60 hover:text-foreground",
						)}
					>
						{#if done}
							<CheckCircle class="size-5" weight="fill" aria-hidden="true" />
						{:else}
							<Circle class="size-5" aria-hidden="true" />
						{/if}
					</Button>

					{#if editingTitle}
						<Textarea
							bind:ref={titleField}
							bind:value={titleDraft}
							onkeydown={onTitleKeydown}
							onblur={commitTitle}
							rows={2}
							aria-label={labels.editTitle}
							class="-mx-2 -my-1 min-h-0 min-w-0 flex-1 resize-none px-2 py-1 text-2xl leading-tight font-semibold tracking-tight md:text-2xl"
						/>
					{:else}
						<h1
							class="min-w-0 flex-1 text-2xl leading-tight font-semibold tracking-tight text-balance break-words"
						>
							<Button
								variant="text"
								onclick={startTitle}
								disabled={!onTitleChange}
								aria-label={labels.editTitle}
								class={cn(
									"group -mx-2 -my-1 px-2 py-1 text-2xl leading-tight font-semibold tracking-tight disabled:opacity-100",
									!onTitleChange && "hover:bg-transparent",
									closed && "text-muted-foreground",
								)}
							>
								{title}
								{#if onTitleChange}
									<PencilSimple
										class="ms-1.5 inline size-3.5 align-middle text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
										aria-hidden="true"
									/>
								{/if}
							</Button>
						</h1>
					{/if}
				</div>
				{#if meta}
					<div
						class="mt-2 flex min-h-5 flex-wrap items-center gap-x-3 gap-y-1 ps-9 text-xs text-muted-foreground"
					>
						{@render meta()}
					</div>
				{/if}
			</div>
		</header>

		<aside
			class="px-4 pt-3 @3xl:col-start-2 @3xl:row-span-2 @3xl:row-start-1 @3xl:border-s @3xl:border-border @3xl:px-5 @3xl:pt-6"
			aria-label={labels.properties}
		>
			<div
				class="flex flex-wrap items-center gap-1 @3xl:sticky @3xl:top-0 @3xl:flex-col @3xl:items-stretch @3xl:gap-0.5"
			>
				{@render properties?.()}
				{#if railFooter}
					<div class="mt-2 hidden w-full border-t border-border/60 pt-3 @3xl:block">
						{@render railFooter()}
					</div>
				{/if}
			</div>
		</aside>

		<section class="flex min-w-0 flex-col gap-8 px-4 pt-6 pb-16 @3xl:col-start-1 @3xl:px-8">
			<div class="mx-auto flex w-full max-w-184 flex-col gap-8 ps-0 @3xl:ps-9">
				<div class="flex flex-col gap-1">
					<div class="flex h-7 items-center justify-between">
						<h2 class="text-xs font-medium text-muted-foreground">{labels.description}</h2>
						{#if !editingDescription && description && onDescriptionChange}
							<Button
								variant="ghost"
								size="sm"
								icon
								class="text-muted-foreground"
								onclick={startDescription}
								aria-label={labels.editDescription}
							>
								<PencilSimple aria-hidden="true" />
							</Button>
						{/if}
					</div>

					{#if editingDescription}
						<Textarea
							bind:value={descriptionDraft}
							rows={8}
							placeholder={labels.addDescription}
							aria-label={labels.description}
							class="resize-y px-3 leading-relaxed"
						/>
						<div class="mt-1 flex justify-end gap-1.5">
							<Button variant="ghost" size="sm" onclick={() => (editingDescription = false)}
								>{labels.cancel}</Button
							>
							<Button size="sm" onclick={saveDescription} disabled={savingDescription}>
								{savingDescription ? labels.saving : labels.save}
							</Button>
						</div>
					{:else if description}
						<Button
							variant="text"
							onclick={startDescription}
							disabled={!onDescriptionChange}
							class={cn(
								"-mx-3 block w-[calc(100%+1.5rem)] px-3 py-1.5 leading-relaxed font-normal whitespace-pre-wrap text-pretty disabled:opacity-100",
								!onDescriptionChange && "hover:bg-transparent",
							)}
						>
							{description}
						</Button>
					{:else if onDescriptionChange}
						<Button
							variant="dashed"
							size="sm"
							onclick={startDescription}
							class="w-full justify-start text-(length:--text-control) font-normal"
						>
							{labels.addDescription}
						</Button>
					{/if}
				</div>

				<TaskThread
					{comments}
					loading={loadingComments}
					labels={labelOverrides}
					{agentAvatar}
					{avatar}
					{when}
					{onSend}
					onEdit={onEditComment}
					onDelete={onDeleteComment}
					canEdit={canEditComment}
				/>
			</div>
		</section>
	</div>
</div>
