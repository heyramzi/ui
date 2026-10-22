<script lang="ts" generics="T">
	import type { Snippet } from "svelte";
	import { cn } from "#src/lib/utils.js";
	import { dayNumber, isoFromDay, todayIso } from "#src/tasks/dates.js";
	import GanttGrid from "#src/tasks/gantt/gantt-grid.svelte";
	import GanttGroupRow from "#src/tasks/gantt/gantt-group-row.svelte";
	import GanttHeader from "#src/tasks/gantt/gantt-header.svelte";
	import GanttTaskRow from "#src/tasks/gantt/gantt-task-row.svelte";
	import {
		buildArrows,
		buildDays,
		buildMonths,
		buildRows,
		dayX,
		rangeLabel,
		rangeOf,
		type Drag,
		type Layout,
		type Span,
	} from "#src/tasks/gantt/logic.js";
	import type { KanbanColumn as KanbanColumnDef } from "#src/tasks/kanban-types.js";
	import type { GanttChange, GanttLabelContext } from "#src/tasks/task-types.js";

	interface Props<T> {
		items: T[];
		getId: (item: T) => string;
		getTitle: (item: T) => string;
		/**
		 * ISO date, inclusive. Null or empty means undated: with an end date alone the task
		 * starts the same day, and with neither it has no bar of its own.
		 */
		getStart: (item: T) => string | null | undefined;
		/** ISO date, inclusive. See `getStart`. */
		getEnd: (item: T) => string | null | undefined;
		/**
		 * The id of the task this one sits under. Children nest under their parent, indented
		 * and foldable. A parent with no dates of its own draws the span of what is below it.
		 */
		getParent?: (item: T) => string | null | undefined;
		/** Draws a flag at the end date instead of a bar. Milestones are not draggable. */
		isMilestone?: (item: T) => boolean;
		/** Parent ids that start folded. */
		collapsed?: string[];
		/** Shown in place of a bar for an undated task. */
		noDatesLabel?: string;
		/** Any CSS color for the bar. Falls back to the group hue, then the primary color. */
		getHue?: (item: T) => string | undefined;
		/** 0 to 1. Fills the bar from the left. */
		getProgress?: (item: T) => number | undefined;
		/** Ids this task waits on. Draws an arrow from each one's end to this one's start. */
		getDependsOn?: (item: T) => string[] | undefined;
		/** Group rows under a header, in the order given. Same shape as board columns. */
		groups?: KanbanColumnDef[];
		getGroup?: (item: T) => string;
		/** Called after a bar is dragged, resized or nudged. Leave it out for a read-only chart. */
		onChange?: (id: string, change: GanttChange) => void | Promise<void>;
		/** Called on a click or Enter that did not move the bar. */
		onSelect?: (id: string) => void;
		/** The left column for a row. Defaults to the title. */
		renderLabel?: Snippet<[T, GanttLabelContext]>;
		/** First and last day shown. Default: the tasks' span, padded, starting on a Monday. */
		from?: string;
		to?: string;
		/** The day the today line marks. Defaults to the viewer's today. */
		today?: string;
		dayWidth?: number;
		rowHeight?: number;
		/** Width of the task column in px. It never takes more than 40% of a narrow screen. */
		labelWidth?: number;
		labelHeading?: string;
		locale?: string;
		/** Drops the card chrome (border, radius, fill) so the chart sits flat on the page. */
		flat?: boolean;
		class?: string;
	}

	let {
		items,
		getId,
		getTitle,
		getStart,
		getEnd,
		getParent,
		isMilestone,
		collapsed = [],
		noDatesLabel = "No dates",
		getHue,
		getProgress,
		getDependsOn,
		groups,
		getGroup,
		onChange,
		onSelect,
		renderLabel,
		from,
		to,
		today = todayIso(),
		dayWidth = 32,
		rowHeight = 40,
		labelWidth = 240,
		labelHeading = "Task",
		locale = "en-US",
		flat = false,
		class: className,
	}: Props<T> = $props();

	// Bars past this row enter together, so a long chart never waits on its stagger.
	const STAGGER_CAP = 10;
	// A bar narrower than this shows its title outside, to the right.
	const INLINE_TITLE_MIN = 72;
	const INDENT = 14;

	let scroller = $state<HTMLDivElement>();
	let corner = $state<HTMLDivElement>();
	let drag = $state<Drag | null>(null);
	let hoveredId = $state<string | null>(null);
	let scrolledToToday = false;
	// svelte-ignore state_referenced_locally
	let folded = $state(new Set(collapsed));

	let todayDay = $derived(dayNumber(today));
	let range = $derived(rangeOf(items, { getStart, getEnd }, todayDay, from, to));
	let dayCount = $derived(range.last - range.first + 1);
	let layout = $derived<Layout>({
		first: range.first,
		last: range.last,
		dayWidth,
		rowHeight,
		// Under 18px a day is too narrow for a gap either side of a bar.
		inset: dayWidth >= 18 ? 3 : 0,
		timelineWidth: dayCount * dayWidth,
		todayDay,
	});

	let days = $derived(buildDays(range.first, dayCount));
	let monthFormat = $derived(
		new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }),
	);
	let dayFormat = $derived(
		new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" }),
	);
	let months = $derived(buildMonths(days, monthFormat));
	let rows = $derived(
		buildRows(items, { getId, getStart, getEnd, getParent, groups, getGroup, folded, drag }),
	);
	let arrows = $derived(getDependsOn ? buildArrows(rows, layout, getDependsOn) : []);
	let groupHue = $derived(new Map((groups ?? []).map((g) => [g.id, g.hue])));

	function toggle(id: string): void {
		const next = new Set(folded);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		folded = next;
	}

	function hueOf(item: T): string {
		return (
			getHue?.(item) ??
			(getGroup ? groupHue.get(getGroup(item)) : undefined) ??
			"var(--color-primary)"
		);
	}

	function hover(id: string, on: boolean): void {
		if (on) hoveredId = id;
		else if (hoveredId === id) hoveredId = null;
	}

	function describe(span: Span): string {
		return rangeLabel(span, dayFormat);
	}

	// Open on today, a third of the way in, so past work and what's next both show.
	$effect(() => {
		if (!scroller || scrolledToToday) return;
		scrolledToToday = true;
		const label = corner?.offsetWidth ?? 0;
		scroller.scrollLeft = Math.max(0, dayX(layout, todayDay) - (scroller.clientWidth - label) / 3);
	});

	/** Scroll the today line into view. */
	export function scrollToToday(): void {
		if (!scroller) return;
		const label = corner?.offsetWidth ?? 0;
		scroller.scrollTo({
			left: Math.max(0, dayX(layout, todayDay) - (scroller.clientWidth - label) / 3),
			behavior: "smooth",
		});
	}
</script>

<div
	bind:this={scroller}
	class={cn(
		"task-gantt relative min-h-0 flex-1 overflow-auto overscroll-x-contain",
		flat ? "bg-background" : "rounded-xl border border-border bg-card text-card-foreground",
		drag && "select-none",
		className,
	)}
	style:--g-label="min({labelWidth}px, 40vw)"
	style:--g-day="{dayWidth}px"
	style:--g-row="{rowHeight}px"
>
	<div class="relative" style:width="calc(var(--g-label) + {layout.timelineWidth}px)">
		<GanttHeader {layout} {days} {months} {labelHeading} {locale} bind:corner />

		<div class="relative">
			<GanttGrid
				{layout}
				{days}
				{arrows}
				rowCount={rows.length}
				{hoveredId}
				draggingId={drag?.id ?? null}
			/>

			<div role="list" aria-label="Timeline">
				{#each rows as row, index (row.kind === "group" ? `g:${row.group.id}` : row.id)}
					{#if row.kind === "group"}
						<GanttGroupRow {row} {index} {layout} staggerCap={STAGGER_CAP} />
					{:else}
						<GanttTaskRow
							{row}
							{layout}
							title={getTitle(row.item)}
							hue={hueOf(row.item)}
							progress={Math.max(0, Math.min(1, getProgress?.(row.item) ?? 0))}
							milestone={isMilestone?.(row.item) ?? false}
							nested={!!getParent}
							indent={INDENT}
							staggerCap={STAGGER_CAP}
							inlineTitleMin={INLINE_TITLE_MIN}
							{noDatesLabel}
							hovered={hoveredId === row.id}
							tipBelow={row.order === 0 && !groups}
							{drag}
							setDrag={(next) => (drag = next)}
							onhover={hover}
							onToggle={toggle}
							{onChange}
							{onSelect}
							{renderLabel}
							{describe}
						/>
					{/if}
				{/each}
			</div>
		</div>
	</div>
</div>
