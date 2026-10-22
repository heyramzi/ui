<script lang="ts">
	import { dayX, type Arrow, type GanttDay, type Layout } from "#src/tasks/gantt/logic.js";

	interface Props {
		layout: Layout;
		days: GanttDay[];
		arrows: Arrow[];
		rowCount: number;
		/** The row id the pointer is over, so its arrows light up. */
		hoveredId: string | null;
		/** The id being dragged. */
		draggingId: string | null;
	}

	let { layout, days, arrows, rowCount, hoveredId, draggingId }: Props = $props();
</script>

<!-- The layer behind every row: weekends, week lines, the today line and arrows. -->
<div
	class="pointer-events-none absolute inset-y-0 left-(--g-label)"
	style:width="{layout.timelineWidth}px"
	aria-hidden="true"
>
	{#each days as d (d.day)}
		{#if d.weekend}
			<div
				class="absolute inset-y-0 bg-foreground/[0.025]"
				style:left="{d.i * layout.dayWidth}px"
				style:width="{layout.dayWidth}px"
			></div>
		{/if}
		{#if d.wd === 1}
			<div
				class="absolute inset-y-0 w-px bg-border/70"
				style:left="{d.i * layout.dayWidth}px"
			></div>
		{/if}
	{/each}
	{#if layout.todayDay >= layout.first && layout.todayDay <= layout.last}
		<div
			class="g-today absolute inset-y-0 w-px bg-primary"
			style:left="{dayX(layout, layout.todayDay) + layout.dayWidth / 2}px"
		>
			<span class="absolute -top-1 -left-[3px] size-[7px] rounded-full bg-primary"></span>
		</div>
	{/if}
	<svg
		class="absolute inset-0 overflow-visible"
		width={layout.timelineWidth}
		height={rowCount * layout.rowHeight}
	>
		{#each arrows as arrow (arrow.key)}
			{@const lit =
				hoveredId === arrow.from ||
				hoveredId === arrow.to ||
				draggingId === arrow.from ||
				draggingId === arrow.to}
			<g class="g-arrow" class:g-arrow-lit={lit}>
				<path d={arrow.d} pathLength="1" fill="none" stroke-width="1.5" class="g-arrow-line"></path>
				<path
					d={arrow.head}
					fill="none"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="g-arrow-head"
				></path>
			</g>
		{/each}
	</svg>
</div>

<style>
	.g-today {
		transform-origin: top;
		animation: g-today-in var(--duration-very-slow, 500ms)
			var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1)) backwards;
	}

	.g-arrow {
		stroke: color-mix(in oklab, var(--color-muted-foreground, gray) 55%, transparent);
		transition: stroke var(--duration-quick, 150ms) var(--ease-smooth-out, ease-out);
	}

	.g-arrow-lit {
		stroke: var(--color-foreground, currentColor);
	}

	.g-arrow-line {
		stroke-dasharray: 1;
		stroke-dashoffset: 0;
		animation: g-draw var(--duration-very-slow, 500ms)
			var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1)) 300ms backwards;
	}

	.g-arrow-head {
		animation: g-fade var(--duration-quick, 150ms) var(--ease-smooth-out, ease-out) 700ms backwards;
	}

	@keyframes g-today-in {
		from {
			transform: scaleY(0);
		}
	}

	@keyframes g-draw {
		from {
			stroke-dashoffset: 1;
		}
	}

	@keyframes g-fade {
		from {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.g-today,
		.g-arrow-line,
		.g-arrow-head {
			animation: none;
		}
	}
</style>
