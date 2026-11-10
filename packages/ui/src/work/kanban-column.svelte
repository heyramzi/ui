<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { cn } from "#src/lib/utils.js";
	import WorkWell from "#src/components/work-parts/work-well.svelte";

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
	<WorkWell
		role="region"
		aria-label={ariaLabel}
		{hue}
		{active}
		class={cn("flex-1", bodyClass)}
		{ondragover}
		{ondragleave}
		{ondrop}
	>
		<div class="flex h-8 min-w-0 shrink-0 items-center gap-2 px-1.5">
			{@render header()}
		</div>
		{@render children()}
	</WorkWell>
</div>

<style>
	@layer theme, base, components, utilities;

	@layer components {
		/* Columns split the board's width equally, never under 240px (the board scrolls instead)
		   nor over 420px (a 2-line card title stays near 55 characters a line). At 280px four
		   columns needed 1168px, so a docs page at 1440 cut the Done column off; 240px fits four
		   in the 1008px a 1440 page leaves, and a card's meta row still fits on one line. */
		.kanban-column {
			flex: 1 1 0;
			min-width: var(--kanban-column-min, 240px);
			max-width: var(--kanban-column-max, 420px);
			transition: opacity var(--duration-quick) var(--ease-smooth-out);
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
</style>
