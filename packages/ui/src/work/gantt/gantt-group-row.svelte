<script lang="ts">
	import { ganttLooks } from "#src/components/work-parts/looks.js";
	import { cn } from "#src/lib/utils.js";
	import GroupHead from "#src/components/work-parts/group-head.svelte";
	import { barWidth, dayX, type GroupRow, type Layout } from "#src/work/gantt/logic.js";
	import "#src/work/gantt/gantt.css";

	interface Props {
		row: GroupRow;
		/** The row's position, which sets how late its summary bar enters. */
		index: number;
		layout: Layout;
		staggerCap: number;
	}

	let { row, index, layout, staggerCap }: Props = $props();

	let hue = $derived(row.group.hue ?? "var(--color-primary)");
</script>

<div
	role="listitem"
	class="relative flex border-b border-border/60 bg-muted/30"
	style:height="{layout.rowHeight}px"
>
	<!-- Opaque card under the row's muted tint, so bars never show through the pinned column. -->
	<div class="sticky left-0 z-10 w-(--g-label) shrink-0 border-r border-border bg-card">
		<div class="flex h-full items-center gap-2 bg-muted/30 px-3">
			<GroupHead label={row.group.label} {hue} count={row.count} />
		</div>
	</div>
	<div class="relative shrink-0" style:width="{layout.timelineWidth}px">
		{#if row.span}
			<div
				class={cn("g-summary g-enter absolute top-1/2 h-1.5 -translate-y-1/2", ganttLooks.track)}
				style:--g-hue={hue}
				style:--g-i={Math.min(index, staggerCap)}
				style:left="{dayX(layout, row.span.start) + layout.inset}px"
				style:width="{barWidth(row.span, layout)}px"
			></div>
		{/if}
	</div>
</div>

<style>
	.g-summary {
		background: color-mix(in oklab, var(--g-hue) 45%, transparent);
		transition:
			left var(--duration-quick) var(--ease-smooth-out),
			width var(--duration-quick) var(--ease-smooth-out);
	}

	@media (prefers-reduced-motion: reduce) {
		.g-summary {
			transition: none;
		}
	}
</style>
