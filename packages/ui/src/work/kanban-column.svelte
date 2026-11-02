<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { cn } from "#src/lib/utils.js";

	interface Props extends HTMLAttributes<HTMLDivElement> {
		/** Any CSS color. Only shows while a card is held over the column. */
		hue?: string;
		active?: boolean;
		collapsing?: boolean;
		expanding?: boolean;
		ariaLabel?: string;
		header: Snippet;
		children: Snippet;
		ondragover?: (e: DragEvent) => void;
		ondragleave?: (e: DragEvent) => void;
		ondrop?: (e: DragEvent) => void;
		class?: string;
		bodyClass?: string;
	}

	let {
		hue,
		active = false,
		collapsing = false,
		expanding = false,
		ariaLabel,
		header,
		children,
		ondragover,
		ondragleave,
		ondrop,
		class: className,
		bodyClass,
		...restProps
	}: Props = $props();

	// A column rests neutral. Its hue shows only while a card is held over it.
	let style = $derived(
		hue && active
			? `background: color-mix(in oklch, ${hue} 8%, var(--color-muted, transparent)); outline: 1px solid color-mix(in oklch, ${hue} 30%, transparent);`
			: undefined,
	);
</script>

<div
	{...restProps}
	class={cn(
		"kanban-column flex flex-col gap-2",
		collapsing && "kanban-column-collapsing",
		expanding && "kanban-column-expanding",
		"min-h-0",
		className,
	)}
>
	<div
		role="region"
		aria-label={ariaLabel}
		class={cn(
			"flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overflow-x-hidden rounded-xl bg-muted/50 p-1.5 outline-offset-[-1px] transition-[background-color,outline-color] duration-[var(--duration-quick,120ms)] ease-[var(--ease-smooth-out,ease-out)] dark:bg-muted/30",
			bodyClass,
		)}
		{style}
		{ondragover}
		{ondragleave}
		{ondrop}
	>
		<div class="flex h-8 min-w-0 shrink-0 items-center gap-2 px-1.5">
			{@render header()}
		</div>
		{@render children()}
	</div>
</div>

<style>
	/* Columns split the board's width equally, never under 280px (the board scrolls instead)
	   nor over 420px (a 2-line card title stays near 55 characters a line). */
	.kanban-column {
		flex: 1 1 0;
		min-width: var(--kanban-column-min, 280px);
		max-width: var(--kanban-column-max, 420px);
		transition: opacity var(--duration-quick, 120ms) var(--ease-smooth-out, ease-out);
	}

	/* A board under 40rem wide (a phone, a side panel) shows one column and a peek of the next, as 82vw did on a phone. */
	@container kanban-board (width < 40rem) {
		.kanban-column {
			flex: 0 0 88cqw;
			min-width: 0;
			max-width: 88cqw;
			scroll-snap-align: start;
		}
	}

	.kanban-column-collapsing,
	.kanban-column-expanding {
		will-change: opacity;
		overflow: hidden;
	}

	.kanban-column-collapsing {
		pointer-events: none;
		animation: column-fold var(--duration-slow) var(--ease-smooth-out) forwards;
	}

	.kanban-column-expanding {
		animation: column-unfold var(--duration-slow) var(--ease-smooth-out) both;
	}

	/* One end only: the other is the column's resting width, whatever the container gave it.
	   The negative margin takes the board's gap-4 with it, so no gap is left behind. */
	@keyframes column-fold {
		to {
			opacity: 0;
			flex-grow: 0;
			flex-basis: 0;
			min-width: 0;
			max-width: 0;
			margin-inline-end: -1rem;
		}
	}

	@keyframes column-unfold {
		from {
			opacity: 0;
			flex-grow: 0;
			flex-basis: 0;
			min-width: 0;
			max-width: 0;
			margin-inline-end: -1rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.kanban-column-expanding {
			animation: none;
		}

		.kanban-column-collapsing {
			animation: none;
			opacity: 0;
			flex: 0 0 0;
			min-width: 0;
			max-width: 0;
			margin-inline-end: -1rem;
		}
	}
</style>
