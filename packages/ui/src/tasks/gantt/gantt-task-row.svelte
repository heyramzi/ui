<script lang="ts" generics="T">
	import type { Snippet } from "svelte";
	import { CaretRight, FlagPennant } from "phosphor-svelte";
	import type { GanttChange, GanttLabelContext } from "#src/tasks/task-types.js";
	import GanttBar from "#src/tasks/gantt/gantt-bar.svelte";
	import { barWidth, dayX, type Drag, type Layout, type Span, type TaskRow } from "#src/tasks/gantt/logic.js";
	import "#src/tasks/gantt/gantt.css";

	interface Props<T> {
		row: TaskRow<T>;
		layout: Layout;
		title: string;
		hue: string;
		progress: number;
		milestone: boolean;
		/** Set when tasks nest: the label column indents and shows a fold button. */
		nested: boolean;
		indent: number;
		staggerCap: number;
		inlineTitleMin: number;
		noDatesLabel: string;
		hovered: boolean;
		tipBelow: boolean;
		drag: Drag | null;
		setDrag: (drag: Drag | null) => void;
		onhover: (id: string, on: boolean) => void;
		onToggle: (id: string) => void;
		onChange?: (id: string, change: GanttChange) => void | Promise<void>;
		onSelect?: (id: string) => void;
		renderLabel?: Snippet<[T, GanttLabelContext]>;
		describe: (span: Span) => string;
	}

	let {
		row,
		layout,
		title,
		hue,
		progress,
		milestone,
		nested,
		indent,
		staggerCap,
		inlineTitleMin,
		noDatesLabel,
		hovered,
		tipBelow,
		drag,
		setDrag,
		onhover,
		onToggle,
		onChange,
		onSelect,
		renderLabel,
		describe,
	}: Props<T> = $props();

	let ctx = $derived({ depth: row.depth, hasChildren: row.hasChildren, open: row.open });
	let span = $derived(row.span);
	let hot = $derived(hovered || drag?.id === row.id);
</script>

<div role="listitem" class="g-row relative flex border-b border-border/40 last:border-b-0" class:g-row-hot={hot} style:height="{layout.rowHeight}px">
	<div
		class="sticky left-0 z-10 flex w-(--g-label) shrink-0 items-center gap-2 border-r border-border bg-card px-3 text-sm"
		style:padding-inline-start={nested ? `${row.depth * indent + 12}px` : undefined}
	>
		{#if nested}
			{#if row.hasChildren}
				<button
					type="button"
					aria-expanded={row.open}
					aria-label="{row.open ? 'Fold' : 'Unfold'} {title}"
					onclick={() => onToggle(row.id)}
					class="-ml-1 grid size-5 shrink-0 place-items-center rounded-md text-muted-foreground outline-none transition-colors duration-[var(--duration-quick,150ms)] hover:bg-foreground/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
				>
					<span class="g-chevron size-3.5 [&>svg]:size-full" class:g-chevron-open={row.open} aria-hidden="true">
						<CaretRight weight="bold" />
					</span>
				</button>
			{:else}
				<span class="-ml-1 size-5 shrink-0" aria-hidden="true"></span>
			{/if}
		{/if}
		{#if renderLabel}
			{@render renderLabel(row.item, ctx)}
		{:else}
			<span class="truncate text-foreground">{title}</span>
		{/if}
	</div>
	<div class="relative shrink-0" style:width="{layout.timelineWidth}px">
		{#if !span}
			<span
				class="pointer-events-none absolute top-1/2 -translate-y-1/2 text-xs whitespace-nowrap text-muted-foreground/70"
				style:left="{Math.max(dayX(layout, layout.todayDay) - 40, 0) + 8}px"
			>
				{noDatesLabel}
			</span>
		{:else if milestone && row.own}
			<button
				type="button"
				aria-label="{title}, {describe(span)}"
				title="{title}, {describe(span)}"
				class="g-flag absolute top-1/2 grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
				style:--g-hue={hue}
				style:left="{dayX(layout, span.end) + layout.dayWidth / 2}px"
				onclick={() => onSelect?.(row.id)}
				onpointerenter={() => onhover(row.id, true)}
				onpointerleave={() => onhover(row.id, false)}
			>
				<span class="size-5 [&>svg]:size-full" aria-hidden="true"><FlagPennant weight="fill" /></span>
			</button>
		{:else if !row.own}
			<!-- A parent with no dates of its own: the span of what is below it. Not draggable. -->
			<div
				role="button"
				tabindex="0"
				aria-label="{title}, {describe(span)}"
				title="{title}, {describe(span)}"
				class="g-derived g-enter absolute top-1/2 -translate-y-1/2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
				style:--g-hue={hue}
				style:--g-i={Math.min(row.order, staggerCap)}
				style:left="{dayX(layout, span.start) + layout.inset}px"
				style:width="{barWidth(span, layout)}px"
				style:height="{Math.max(layout.rowHeight - 24, 10)}px"
				onclick={() => onSelect?.(row.id)}
				onkeydown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect?.(row.id))}
				onpointerenter={() => onhover(row.id, true)}
				onpointerleave={() => onhover(row.id, false)}
			></div>
		{:else}
			<GanttBar
				id={row.id}
				{title}
				{span}
				{hue}
				{progress}
				order={row.order}
				{layout}
				{staggerCap}
				{inlineTitleMin}
				{tipBelow}
				{drag}
				{setDrag}
				{onhover}
				{onChange}
				{onSelect}
				{describe}
			/>
		{/if}
	</div>
</div>

<style>
	.g-row {
		transition: background-color var(--duration-quick, 150ms) var(--ease-smooth-out, ease-out);
	}

	.g-row-hot {
		background: color-mix(in oklab, var(--color-foreground, currentColor) 3%, transparent);
	}

	.g-chevron {
		transition: rotate var(--duration-fast, 250ms) var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1));
	}

	.g-chevron-open {
		rotate: 90deg;
	}

	/* A summary of what is below: an outline, so it never reads as a task you can drag. */
	.g-derived {
		background: color-mix(in oklab, var(--g-hue) 10%, transparent);
		box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--g-hue) 45%, transparent);
	}

	.g-flag {
		color: var(--g-hue);
	}

	@media (prefers-reduced-motion: reduce) {
		.g-chevron {
			transition: none;
		}
	}
</style>
