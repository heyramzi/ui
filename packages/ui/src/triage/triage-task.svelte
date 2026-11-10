<script lang="ts">
	import { Button } from "#src/shadcn/button/index.js";
	import StatusBadge from "#src/status/status-badge.svelte";
	import { cn } from "#src/lib/utils.js";
	import {
		DEFAULT_TRIAGE_TASK_LABELS,
		type TriageOutcome,
		type TriageTaskLabels,
		type TriageTaskLink,
	} from "#src/triage/types.js";

	interface Props {
		sender: string;
		subject: string;
		/** What happened to the email. */
		outcome: TriageOutcome;
		/** The task it became. */
		task?: TriageTaskLink | null;
		/** When it settled, as text the host already formatted. */
		when: string;
		whenAt?: string | null;
		/** Why it failed. */
		detail?: string | null;
		error?: string | null;
		labels?: Partial<TriageTaskLabels>;
		/** Takes the change back. The button shows only when this is passed. */
		onUndo?: () => void | Promise<void>;
		class?: string;
	}

	let {
		sender,
		subject,
		outcome,
		task,
		when,
		whenAt,
		detail,
		error,
		labels,
		onUndo,
		class: className,
	}: Props = $props();

	let words = $derived({ ...DEFAULT_TRIAGE_TASK_LABELS, ...labels });
	let busy = $state(false);

	async function undo() {
		busy = true;
		try {
			await onUndo?.();
		} finally {
			busy = false;
		}
	}
</script>

<li
	class={cn(
		"flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
		className,
	)}
>
	<div class="min-w-0 space-y-1">
		<p class="text-foreground text-sm font-medium [overflow-wrap:anywhere]">
			{sender}: {subject}
		</p>
		<div class="flex flex-wrap items-center gap-x-3 gap-y-1">
			<StatusBadge tone={outcome.tone} capitalize={false}>{outcome.label}</StatusBadge>
			{#if task}
				<a
					href={task.url}
					target="_blank"
					rel="noreferrer"
					class="text-primary min-w-0 text-xs [overflow-wrap:anywhere] hover:underline"
				>
					{task.name ?? words.openTask}
				</a>
			{/if}
			<time class="text-muted-foreground text-xs" datetime={whenAt ?? undefined}>{when}</time>
		</div>
		{#if detail}
			<p class="text-muted-foreground text-xs [overflow-wrap:anywhere]">{detail}</p>
		{/if}
		{#if error}
			<p class="text-destructive-ink text-xs [overflow-wrap:anywhere]" role="alert">{error}</p>
		{/if}
	</div>

	{#if onUndo}
		<Button variant="outline" class="shrink-0" disabled={busy} onclick={undo}>
			{words.undo}
		</Button>
	{/if}
</li>
