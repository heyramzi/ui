<script lang="ts">
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
			<span class="size-2 shrink-0 rounded-full" style:background={hue}></span>
			<span class="truncate text-sm font-medium text-foreground">{row.group.label}</span>
			<span
				class="grid h-5 min-w-5 place-items-center rounded-sm bg-foreground/5 px-1 text-xs font-medium text-muted-foreground tabular-nums"
			>
				{row.count.toLocaleString()}
			</span>
		</div>
	</div>
	<div class="relative shrink-0" style:width="{layout.timelineWidth}px">
		{#if row.span}
			<div
				class="g-summary g-enter absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full"
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
			left var(--duration-quick, 150ms) var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1)),
			width var(--duration-quick, 150ms) var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1));
	}

	@media (prefers-reduced-motion: reduce) {
		.g-summary {
			transition: none;
		}
	}
</style>
