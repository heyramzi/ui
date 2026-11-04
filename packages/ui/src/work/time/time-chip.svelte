<script lang="ts">
	import { cn } from "#src/lib/utils.js";
	import { TONE_TEXT } from "#src/lib/tone.js";
	import StatusPill from "#src/status/status-pill.svelte";
	import { budgetTone, formatMinutes } from "#src/work/time/duration.js";
	import TimeDot from "#src/work/time/time-dot.svelte";
	import TimeRing from "#src/work/time/time-ring.svelte";
	import { Clock } from "phosphor-svelte";

	interface Props {
		/** Minutes logged on the task. */
		minutes: number;
		/** Minutes budgeted. Draws a small ring and tints the chip as the budget runs out. */
		estimate?: number;
		/** A timer is running on the task. */
		running?: boolean;
		/** Replaces the spoken name. Defaults to a sentence built from the numbers. */
		label?: string;
		class?: string;
	}

	let { minutes, estimate, running = false, label, class: className }: Props = $props();

	let tone = $derived(budgetTone(minutes, estimate));
	let visible = $derived(minutes > 0 || running || !!estimate);
	let spoken = $derived(
		label ??
			[
				`${formatMinutes(minutes)} logged`,
				estimate ? `of ${formatMinutes(estimate)}` : "",
				running ? "timer running" : "",
			]
				.filter(Boolean)
				.join(", "),
	);
</script>

<!-- Logged time is a status of the task's budget, so it's a StatusPill: the icon sits in the tint. -->
{#if visible}
	<StatusPill
		role="img"
		aria-label={spoken}
		tone={running ? "accent" : tone}
		class={cn("tabular-nums", className)}
	>
		{#snippet icon()}
			{#if running}
				<TimeDot running size={6} />
			{:else if estimate}
				<TimeRing value={minutes} max={estimate} size={12} stroke={6} />
			{:else}
				<Clock aria-hidden="true" />
			{/if}
		{/snippet}
		<span aria-hidden="true">
			{formatMinutes(minutes)}{#if estimate}<span
					class={cn(
						"font-normal",
						tone === "neutral" ? "text-muted-foreground/70" : TONE_TEXT[tone],
					)}
				>
					/ {formatMinutes(estimate)}</span
				>{/if}
		</span>
	</StatusPill>
{/if}
