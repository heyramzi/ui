<script lang="ts">
	import { cn } from "../lib/cn.js";
	import { TONE_CLASS, TONE_TEXT } from "../tone.js";
	import { budgetTone, formatMinutes } from "./duration.js";
	import TimeDot from "./time-dot.svelte";
	import TimeRing from "./time-ring.svelte";

	type Props = {
		/** Minutes logged on the task. */
		minutes: number;
		/** Minutes budgeted. Draws a small ring and tints the chip as the budget runs out. */
		estimate?: number;
		/** A timer is running on the task. */
		running?: boolean;
		/** Replaces the spoken name. Defaults to a sentence built from the numbers. */
		label?: string;
		class?: string;
	};

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

{#if visible}
	<span
		role="img"
		aria-label={spoken}
		class={cn(
			"inline-flex h-5 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-1.5 text-xs font-medium tabular-nums",
			running
				? TONE_CLASS.accent
				: tone === "neutral"
					? "border-transparent text-muted-foreground"
					: TONE_CLASS[tone],
			className,
		)}
	>
		{#if running}
			<TimeDot running size={6} />
		{:else if estimate}
			<TimeRing value={minutes} max={estimate} size={12} stroke={6} />
		{:else}
			<svg viewBox="0 0 16 16" class="size-3 shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<circle cx="8" cy="8" r="6" />
				<path d="M8 4.75V8l2.25 1.5" />
			</svg>
		{/if}
		<span aria-hidden="true">
			{formatMinutes(minutes)}{#if estimate}<span class={cn("font-normal", tone === "neutral" ? "text-muted-foreground/70" : TONE_TEXT[tone])}> / {formatMinutes(estimate)}</span>{/if}
		</span>
	</span>
{/if}
