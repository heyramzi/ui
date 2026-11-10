<script lang="ts">
	import { Button } from "#src/shadcn/button/index.js";
	import { Input } from "#src/shadcn/input/index.js";
	import { cn } from "#src/lib/utils.js";
	import { focusAfterRender } from "#src/lib/focus.js";
	import { DEFAULT_TRIAGE_PLAN_LABELS, type TriagePlanLabels } from "#src/triage/types.js";

	interface Props {
		/** Who sent the email. */
		sender: string;
		subject: string;
		/** The first lines of the body. */
		snippet?: string;
		/** When it arrived, as text the host already formatted. */
		received?: string | null;
		/** The ISO time behind `received`, for the `time` element. */
		receivedAt?: string | null;
		/** What the plan will do, as one sentence. Without it the card only offers to dismiss. */
		plan?: string | null;
		/** Why the model wasn't sure. */
		reason?: string | null;
		/** A failed attempt, shown on the card. */
		error?: string | null;
		labels?: Partial<TriagePlanLabels>;
		/** Run the plan. The buttons stay unavailable until it settles. */
		onApprove: () => void | Promise<void>;
		/** Run a task the person typed instead of the plan. */
		onPick: (task: string) => void | Promise<void>;
		onDismiss: () => void | Promise<void>;
		class?: string;
	}

	let {
		sender,
		subject,
		snippet,
		received,
		receivedAt,
		plan = null,
		reason,
		error,
		labels,
		onApprove,
		onPick,
		onDismiss,
		class: className,
	}: Props = $props();

	const id = $props.id();
	let words = $derived({ ...DEFAULT_TRIAGE_PLAN_LABELS, ...labels });
	let picking = $state(false);
	let busy = $state(false);
	let task = $state("");
	let card: HTMLElement | undefined = $state();

	// aria-disabled, not disabled, while busy: a disabled button drops focus to the page.
	const busyLook = "aria-disabled:pointer-events-none aria-disabled:opacity-50";

	async function run(job: () => void | Promise<void>) {
		if (busy) return;
		busy = true;
		try {
			await job();
		} finally {
			busy = false;
		}
	}

	async function setPicking(on: boolean) {
		picking = on;
		await focusAfterRender(card, on ? `[id="${id}-task"]` : "[data-triage-pick]");
	}
</script>

<article
	bind:this={card}
	tabindex="-1"
	aria-labelledby="{id}-heading"
	class={cn(
		"bg-card border-border rounded-xl border p-5 outline-none focus-visible:shadow-(--ring-focus)",
		className,
	)}
>
	<div class="flex items-start justify-between gap-3">
		<h2
			id="{id}-heading"
			class="text-foreground min-w-0 text-sm font-semibold [overflow-wrap:anywhere]"
		>
			{sender}: “{subject}”
		</h2>
		{#if received}
			<time class="text-muted-foreground shrink-0 text-xs" datetime={receivedAt ?? undefined}>
				{received}
			</time>
		{/if}
	</div>

	{#if snippet}
		<p class="text-muted-foreground mt-2 line-clamp-2 text-sm [overflow-wrap:anywhere]">
			{snippet}
		</p>
	{/if}

	{#if plan}
		<p
			class="bg-primary/10 text-primary mt-4 inline-block max-w-full rounded-md px-2.5 py-1 text-xs font-medium [overflow-wrap:anywhere]"
		>
			{plan}
		</p>
	{/if}
	{#if reason}
		<p class="text-muted-foreground mt-2 text-xs [overflow-wrap:anywhere]">{reason}</p>
	{/if}

	{#if error}
		<p
			class="bg-destructive/10 text-destructive-ink mt-3 rounded-lg px-3 py-2 text-sm [overflow-wrap:anywhere]"
			role="alert"
		>
			{error}
		</p>
	{/if}

	{#if picking}
		<!-- WHY: Esc from any control in the form cancels, so one listener sits on the form. -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<form
			class="mt-4 space-y-2"
			onsubmit={(event) => {
				event.preventDefault();
				run(() => onPick(task.trim()));
			}}
			onkeydown={(event) => {
				if (event.key !== "Escape") return;
				event.preventDefault();
				void setPicking(false);
			}}
		>
			<label for="{id}-task" class="text-foreground block text-sm font-medium">
				{words.taskLabel}
			</label>
			<Input id="{id}-task" bind:value={task} required autocomplete="off" />
			<div class="flex flex-wrap gap-2">
				<Button type="submit" aria-disabled={busy} class={busyLook}>{words.useTask}</Button>
				<Button type="button" variant="outline" onclick={() => setPicking(false)}>
					{words.cancel}
				</Button>
			</div>
		</form>
	{:else}
		<div class="mt-4 flex flex-wrap gap-2">
			{#if plan}
				<Button aria-disabled={busy} class={busyLook} onclick={() => run(onApprove)}>
					{words.approve}
				</Button>
				<Button variant="outline" data-triage-pick onclick={() => setPicking(true)}>
					{words.pick}
				</Button>
			{/if}
			<Button variant="ghost" aria-disabled={busy} class={busyLook} onclick={() => run(onDismiss)}>
				{words.dismiss}
			</Button>
		</div>
	{/if}
</article>
