<script lang="ts">
	import type { Snippet } from "svelte";
	import { cn } from "@heyramzi/utils";
	import { TONE_TEXT } from "@heyramzi/ui/lib/tone.js";
	import { budgetTone } from "./duration.js";

	interface Props {
		/** Minutes logged. */
		value: number;
		/** Minutes budgeted. The ring turns warning at 90% and destructive past 100%. */
		max: number;
		/** Pixels. */
		size?: number;
		/** Stroke width in a 36 unit box. */
		stroke?: number;
		label?: string;
		/** Rendered in the middle, e.g. the percentage. */
		children?: Snippet;
		class?: string;
	};

	let { value, max, size = 56, stroke = 4, label, children, class: className }: Props = $props();

	const R = 16;
	let tone = $derived(budgetTone(value, max));
	let fraction = $derived(max > 0 ? Math.min(1, Math.max(0, value / max)) : 0);
	let colorClass = $derived(tone === "neutral" ? TONE_TEXT.accent : TONE_TEXT[tone]);
</script>

<span
	class={cn("relative inline-grid shrink-0 place-items-center", className)}
	style:width="{size}px"
	style:height="{size}px"
	role={label ? "img" : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : "true"}
>
	<svg viewBox="0 0 36 36" class="size-full -rotate-90" fill="none" aria-hidden="true">
		<circle cx="18" cy="18" r={R} stroke="currentColor" stroke-width={stroke} class="text-foreground/10" />
		<circle
			cx="18"
			cy="18"
			r={R}
			pathLength="100"
			stroke="currentColor"
			stroke-width={stroke}
			stroke-linecap="round"
			stroke-dasharray="{fraction * 100} 100"
			class={cn("time-ring-arc", colorClass)}
			class:is-empty={fraction === 0}
		/>
	</svg>
	{#if children}
		<span class="absolute inset-0 grid place-items-center">{@render children()}</span>
	{/if}
</span>

<style>
	.time-ring-arc {
		transition:
			stroke-dasharray var(--duration-slow, 400ms) var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1)),
			color var(--duration-fast, 250ms) var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1));
	}

	.time-ring-arc.is-empty {
		opacity: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.time-ring-arc {
			transition: none;
		}
	}
</style>
