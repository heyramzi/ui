<script lang="ts" generics="T">
	import type { Snippet } from "svelte";
	import { cn } from "./lib/cn.js";
	import { dayNumber, isoFromDay, todayIso, weekday } from "./dates.js";
	import type { KanbanColumn as KanbanColumnDef } from "./kanban-types.js";
	import type { GanttChange } from "./task-types.js";

	type Props<T> = {
		items: T[];
		getId: (item: T) => string;
		getTitle: (item: T) => string;
		/** ISO date, inclusive. */
		getStart: (item: T) => string;
		/** ISO date, inclusive. */
		getEnd: (item: T) => string;
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
		renderLabel?: Snippet<[T]>;
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
		class?: string;
	};

	let {
		items,
		getId,
		getTitle,
		getStart,
		getEnd,
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
		class: className,
	}: Props<T> = $props();

	type Span = { start: number; end: number };
	type Drag = { id: string; mode: "move" | "start" | "end"; originX: number; dx: number };
	type Row =
		| { kind: "group"; group: KanbanColumnDef; count: number; span: Span | null }
		| { kind: "task"; item: T; id: string; order: number };

	// Bars past this row enter together, so a long chart never waits on its stagger.
	const STAGGER_CAP = 10;
	// A bar narrower than this shows its title outside, to the right.
	const INLINE_TITLE_MIN = 72;
	const BAR_INSET = 3;

	let scroller = $state<HTMLDivElement>();
	let corner = $state<HTMLDivElement>();
	let drag = $state<Drag | null>(null);
	let hoveredId = $state<string | null>(null);
	let scrolledToToday = false;

	let todayDay = $derived(dayNumber(today));
	let editable = $derived(!!onChange);

	let range = $derived.by(() => {
		let lo = todayDay;
		let hi = todayDay;
		for (const item of items) {
			lo = Math.min(lo, dayNumber(getStart(item)));
			hi = Math.max(hi, dayNumber(getEnd(item)));
		}
		let first = from ? dayNumber(from) : lo - 7;
		// Day 0 was a Thursday. Step back to the Monday on or before `first`.
		if (!from) first -= (weekday(first) + 6) % 7;
		const last = to ? dayNumber(to) : hi + 21;
		return { first, last: Math.max(last, first) };
	});

	let dayCount = $derived(range.last - range.first + 1);
	let timelineWidth = $derived(dayCount * dayWidth);

	let days = $derived(
		Array.from({ length: dayCount }, (_, i) => {
			const day = range.first + i;
			const wd = weekday(day);
			return { day, i, date: Number(isoFromDay(day).slice(8, 10)), wd, weekend: wd === 0 || wd === 6 };
		}),
	);

	let monthFormat = $derived(new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }));
	let dayFormat = $derived(new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" }));
	let weekdayFormat = $derived(new Intl.DateTimeFormat(locale, { weekday: "narrow", timeZone: "UTC" }));

	let months = $derived.by(() => {
		const out: { key: string; label: string; i: number; length: number }[] = [];
		for (const d of days) {
			const key = isoFromDay(d.day).slice(0, 7);
			const last = out.at(-1);
			if (last?.key === key) last.length++;
			else out.push({ key, label: monthFormat.format(new Date(d.day * 86_400_000)), i: d.i, length: 1 });
		}
		return out;
	});

	function spanOf(item: T): Span {
		const start = dayNumber(getStart(item));
		return { start, end: Math.max(start, dayNumber(getEnd(item))) };
	}

	/** A bar's span, with the live drag applied. Resizes never cross the other edge. */
	function liveSpan(item: T, id: string): Span {
		const span = spanOf(item);
		if (drag?.id !== id || drag.dx === 0) return span;
		if (drag.mode === "move") return { start: span.start + drag.dx, end: span.end + drag.dx };
		if (drag.mode === "start") return { start: Math.min(span.start + drag.dx, span.end), end: span.end };
		return { start: span.start, end: Math.max(span.end + drag.dx, span.start) };
	}

	let rows = $derived.by(() => {
		const out: Row[] = [];
		let order = 0;
		const push = (item: T) => out.push({ kind: "task", item, id: getId(item), order: order++ });
		if (!groups || !getGroup) {
			items.forEach(push);
			return out;
		}
		for (const group of groups) {
			const members = items.filter((item) => getGroup(item) === group.id);
			let span: Span | null = null;
			for (const item of members) {
				const s = liveSpan(item, getId(item));
				span = span ? { start: Math.min(span.start, s.start), end: Math.max(span.end, s.end) } : s;
			}
			out.push({ kind: "group", group, count: members.length, span });
			members.forEach(push);
		}
		return out;
	});

	let groupHue = $derived(new Map((groups ?? []).map((g) => [g.id, g.hue])));

	function hueOf(item: T): string {
		return getHue?.(item) ?? (getGroup ? groupHue.get(getGroup(item)) : undefined) ?? "var(--color-primary)";
	}

	function x(day: number): number {
		return (day - range.first) * dayWidth;
	}

	/** A right-angled path through `points`, each corner rounded by up to `radius`. */
	function roundedPath(points: [number, number][], radius: number): string {
		let d = `M${points[0][0]},${points[0][1]}`;
		for (let i = 1; i < points.length - 1; i++) {
			const [px, py] = points[i - 1];
			const [cx, cy] = points[i];
			const [nx, ny] = points[i + 1];
			const r = Math.min(radius, Math.hypot(cx - px, cy - py) / 2, Math.hypot(nx - cx, ny - cy) / 2);
			const inX = cx - Math.sign(cx - px) * r;
			const inY = cy - Math.sign(cy - py) * r;
			const outX = cx + Math.sign(nx - cx) * r;
			const outY = cy + Math.sign(ny - cy) * r;
			d += ` L${inX},${inY} Q${cx},${cy} ${outX},${outY}`;
		}
		const [lx, ly] = points[points.length - 1];
		return `${d} L${lx},${ly}`;
	}

	// Each arrow runs from the end of the task waited on to the start of the one waiting.
	let arrows = $derived.by(() => {
		if (!getDependsOn) return [];
		const at = new Map<string, { row: number; span: Span }>();
		rows.forEach((row, index) => {
			if (row.kind === "task") at.set(row.id, { row: index, span: liveSpan(row.item, row.id) });
		});
		const out: { key: string; d: string; head: string; from: string; to: string }[] = [];
		for (const row of rows) {
			if (row.kind !== "task") continue;
			const target = at.get(row.id);
			if (!target) continue;
			for (const dep of getDependsOn(row.item) ?? []) {
				const source = at.get(dep);
				if (!source) continue;
				const x1 = x(source.span.end + 1) - BAR_INSET;
				const y1 = source.row * rowHeight + rowHeight / 2;
				const x2 = x(target.span.start) + BAR_INSET;
				const y2 = target.row * rowHeight + rowHeight / 2;
				// Room between the bars: one bend in the gap. No room: out, round the row gap, and back in.
				const points: [number, number][] =
					x2 - x1 >= 24
						? [[x1, y1], [x1 + 12, y1], [x1 + 12, y2], [x2, y2]]
						: [
								[x1, y1],
								[x1 + 10, y1],
								[x1 + 10, y1 + (y2 > y1 ? rowHeight / 2 : -rowHeight / 2)],
								[x2 - 12, y1 + (y2 > y1 ? rowHeight / 2 : -rowHeight / 2)],
								[x2 - 12, y2],
								[x2, y2],
							];
				out.push({
					key: `${dep}->${row.id}`,
					d: roundedPath(points, 6),
					head: `M${x2 - 5},${y2 - 3.5} L${x2},${y2} L${x2 - 5},${y2 + 3.5}`,
					from: dep,
					to: row.id,
				});
			}
		}
		return out;
	});

	// Open on today, a third of the way in, so past work and what's next both show.
	$effect(() => {
		if (!scroller || scrolledToToday) return;
		scrolledToToday = true;
		const label = corner?.offsetWidth ?? 0;
		scroller.scrollLeft = Math.max(0, x(todayDay) - (scroller.clientWidth - label) / 3);
	});

	/** Scroll the today line into view. */
	export function scrollToToday(): void {
		if (!scroller) return;
		const label = corner?.offsetWidth ?? 0;
		scroller.scrollTo({ left: Math.max(0, x(todayDay) - (scroller.clientWidth - label) / 3), behavior: "smooth" });
	}

	function onPointerDown(e: PointerEvent, id: string, mode: Drag["mode"]): void {
		if (!editable || e.button !== 0) return;
		e.stopPropagation();
		(e.currentTarget as HTMLElement).closest<HTMLElement>("[data-bar]")?.setPointerCapture(e.pointerId);
		drag = { id, mode, originX: e.clientX, dx: 0 };
	}

	function onPointerMove(e: PointerEvent): void {
		if (!drag) return;
		const dx = Math.round((e.clientX - drag.originX) / dayWidth);
		if (dx !== drag.dx) drag = { ...drag, dx };
	}

	function onPointerUp(item: T, id: string): void {
		if (!drag || drag.id !== id) return;
		const moved = drag.dx !== 0;
		const span = liveSpan(item, id);
		drag = null;
		if (moved) void onChange?.(id, { start: isoFromDay(span.start), end: isoFromDay(span.end) });
		else onSelect?.(id);
	}

	/** Arrow keys move a bar a day. Shift plus an arrow moves its end, so the task grows or shrinks. */
	function onBarKeyDown(e: KeyboardEvent, item: T, id: string): void {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			onSelect?.(id);
			return;
		}
		if (!editable || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
		e.preventDefault();
		const step = e.key === "ArrowRight" ? 1 : -1;
		const span = spanOf(item);
		const next = e.shiftKey
			? { start: span.start, end: Math.max(span.start, span.end + step) }
			: { start: span.start + step, end: span.end + step };
		if (next.start === span.start && next.end === span.end) return;
		void onChange?.(id, { start: isoFromDay(next.start), end: isoFromDay(next.end) });
	}

	function rangeLabel(span: Span): string {
		const length = span.end - span.start + 1;
		return `${dayFormat.format(new Date(span.start * 86_400_000))} to ${dayFormat.format(new Date(span.end * 86_400_000))}, ${length} ${length === 1 ? "day" : "days"}`;
	}
</script>

<div
	bind:this={scroller}
	class={cn(
		"task-gantt relative min-h-0 flex-1 overflow-auto overscroll-x-contain rounded-xl border border-border bg-card text-card-foreground",
		drag && "select-none",
		className,
	)}
	style:--g-label="min({labelWidth}px, 40vw)"
	style:--g-day="{dayWidth}px"
	style:--g-row="{rowHeight}px"
>
	<div class="relative" style:width="calc(var(--g-label) + {timelineWidth}px)">
		<!-- Header: months over days, pinned to the top. -->
		<div class="sticky top-0 z-30 flex border-b border-border bg-card/90 backdrop-blur-sm">
			<div
				bind:this={corner}
				class="sticky left-0 z-10 flex w-(--g-label) shrink-0 items-end border-r border-border bg-card px-3 pb-2 text-xs font-medium text-muted-foreground"
			>
				{labelHeading}
			</div>
			<div class="relative shrink-0" style:width="{timelineWidth}px">
				<div class="relative h-7 border-b border-border/60">
					{#each months as month (month.key)}
						<div
							class="absolute inset-y-0 border-l border-border/60 first:border-l-0"
							style:left="{month.i * dayWidth}px"
							style:width="{month.length * dayWidth}px"
						>
							<span
								class="sticky left-(--g-label) inline-block px-2 pt-1.5 text-xs font-medium whitespace-nowrap text-foreground"
							>
								{month.label}
							</span>
						</div>
					{/each}
				</div>
				<div class="flex h-8">
					{#each days as d (d.day)}
						{@const isToday = d.day === todayDay}
						{@const showNumber = dayWidth >= 18 || d.wd === 1}
						<div
							class={cn(
								"relative flex shrink-0 flex-col items-center justify-center text-[10px] leading-none tabular-nums",
								d.weekend ? "text-muted-foreground/50" : "text-muted-foreground",
								dayWidth < 18 && d.wd === 1 && "border-l border-border/60",
							)}
							style:width="{dayWidth}px"
						>
							{#if dayWidth >= 26}
								<span class="mb-0.5 opacity-70">{weekdayFormat.format(new Date(d.day * 86_400_000))}</span>
							{/if}
							{#if showNumber}
								<span
									class={cn(
										"grid h-4 min-w-4 place-items-center rounded-full px-1 font-medium",
										dayWidth < 18 && "absolute left-1 whitespace-nowrap",
										isToday && "bg-primary text-primary-foreground",
									)}
								>
									{d.date}
								</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Body. -->
		<div class="relative">
			<!-- The grid layer behind every row: weekends, week lines, the today line and arrows. -->
			<div class="pointer-events-none absolute inset-y-0 left-(--g-label)" style:width="{timelineWidth}px" aria-hidden="true">
				{#each days as d (d.day)}
					{#if d.weekend}
						<div class="absolute inset-y-0 bg-foreground/[0.025]" style:left="{d.i * dayWidth}px" style:width="{dayWidth}px"></div>
					{/if}
					{#if d.wd === 1}
						<div class="absolute inset-y-0 w-px bg-border/70" style:left="{d.i * dayWidth}px"></div>
					{/if}
				{/each}
				{#if todayDay >= range.first && todayDay <= range.last}
					<div class="g-today absolute inset-y-0 w-px bg-primary" style:left="{x(todayDay) + dayWidth / 2}px">
						<span class="absolute -top-1 -left-[3px] size-[7px] rounded-full bg-primary"></span>
					</div>
				{/if}
				<svg class="absolute inset-0 overflow-visible" width={timelineWidth} height={rows.length * rowHeight}>
					{#each arrows as arrow (arrow.key)}
						{@const lit = hoveredId === arrow.from || hoveredId === arrow.to || drag?.id === arrow.from || drag?.id === arrow.to}
						<g class="g-arrow" class:g-arrow-lit={lit}>
							<path d={arrow.d} pathLength="1" fill="none" stroke-width="1.5" class="g-arrow-line"></path>
							<path d={arrow.head} fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="g-arrow-head"></path>
						</g>
					{/each}
				</svg>
			</div>

			<div role="list" aria-label="Timeline">
			{#each rows as row, index (row.kind === "group" ? `g:${row.group.id}` : row.id)}
				{#if row.kind === "group"}
					{@const hue = row.group.hue ?? "var(--color-primary)"}
					<div role="listitem" class="relative flex border-b border-border/60 bg-muted/30" style:height="{rowHeight}px">
						<!-- Opaque card under the row's muted tint, so bars never show through the pinned column. -->
						<div class="sticky left-0 z-10 w-(--g-label) shrink-0 border-r border-border bg-card">
							<div class="flex h-full items-center gap-2 bg-muted/30 px-3">
								<span class="size-2 shrink-0 rounded-full" style:background={hue}></span>
								<span class="truncate text-sm font-medium text-foreground">{row.group.label}</span>
								<span class="grid h-5 min-w-5 place-items-center rounded-sm bg-foreground/5 px-1 text-xs font-medium text-muted-foreground tabular-nums">
									{row.count}
								</span>
							</div>
						</div>
						<div class="relative shrink-0" style:width="{timelineWidth}px">
							{#if row.span}
								<div
									class="g-summary absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full"
									style:--g-hue={hue}
									style:--g-i={Math.min(index, STAGGER_CAP)}
									style:left="{x(row.span.start) + BAR_INSET}px"
									style:width="{(row.span.end - row.span.start + 1) * dayWidth - BAR_INSET * 2}px"
								></div>
							{/if}
						</div>
					</div>
				{:else}
					{@const span = liveSpan(row.item, row.id)}
					{@const width = (span.end - span.start + 1) * dayWidth - BAR_INSET * 2}
					{@const progress = Math.max(0, Math.min(1, getProgress?.(row.item) ?? 0))}
					{@const title = getTitle(row.item)}
					{@const dragging = drag?.id === row.id}
					<div
						role="listitem"
						class="g-row relative flex border-b border-border/40 last:border-b-0"
						class:g-row-hot={hoveredId === row.id || dragging}
						style:height="{rowHeight}px"
					>
						<div class="sticky left-0 z-10 flex w-(--g-label) shrink-0 items-center gap-2 border-r border-border bg-card px-3 text-sm">
							{#if renderLabel}
								{@render renderLabel(row.item)}
							{:else}
								<span class="truncate text-foreground">{title}</span>
							{/if}
						</div>
						<div class="relative shrink-0" style:width="{timelineWidth}px">
							<div
								data-bar
								role="button"
								tabindex="0"
								aria-roledescription="task bar"
								aria-label="{title}, {rangeLabel(span)}.{editable ? ' Arrow keys move it a day, Shift plus arrow keys change its end.' : ''}"
								class={cn(
									"g-bar absolute top-1/2 flex -translate-y-1/2 items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
									editable && "cursor-grab",
									dragging && "g-bar-dragging cursor-grabbing",
								)}
								style:--g-hue={hueOf(row.item)}
								style:--g-i={Math.min(row.order, STAGGER_CAP)}
								style:left="{x(span.start) + BAR_INSET}px"
								style:width="{width}px"
								style:height="{rowHeight - 14}px"
								onpointerdown={(e) => onPointerDown(e, row.id, "move")}
								onpointermove={onPointerMove}
								onpointerup={() => onPointerUp(row.item, row.id)}
								onpointercancel={() => (drag = null)}
								onpointerenter={() => (hoveredId = row.id)}
								onpointerleave={() => (hoveredId = hoveredId === row.id ? null : hoveredId)}
								onkeydown={(e) => onBarKeyDown(e, row.item, row.id)}
							>
								{#if progress > 0}
									<span class="g-progress absolute inset-y-0 left-0 rounded-l-lg" class:rounded-r-lg={progress >= 1} style:width="{progress * 100}%"></span>
								{/if}
								{#if width >= INLINE_TITLE_MIN}
									<span class="relative truncate px-2.5 text-xs font-medium text-foreground">{title}</span>
								{/if}
								{#if editable}
									<span
										class="g-handle left-0"
										aria-hidden="true"
										onpointerdown={(e) => onPointerDown(e, row.id, "start")}
									></span>
									<span
										class="g-handle right-0"
										aria-hidden="true"
										onpointerdown={(e) => onPointerDown(e, row.id, "end")}
									></span>
								{/if}
								{#if dragging && drag && drag.dx !== 0}
									<span
										class={cn(
											"g-tip pointer-events-none absolute left-0 z-20 rounded-md bg-foreground px-2 py-1 text-[11px] font-medium whitespace-nowrap text-background tabular-nums shadow-md",
											row.order === 0 && !groups ? "top-full mt-1.5" : "bottom-full mb-1.5",
										)}
									>
										{rangeLabel(span)}
									</span>
								{/if}
							</div>
							{#if width < INLINE_TITLE_MIN}
								<span
									class="pointer-events-none absolute top-1/2 -translate-y-1/2 truncate rounded-sm bg-card/90 px-1 text-xs text-muted-foreground"
									style:left="{x(span.end + 1) + 16}px"
									style:max-width="200px"
								>
									{title}
								</span>
							{/if}
						</div>
					</div>
				{/if}
			{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.g-row {
		transition: background-color var(--duration-quick, 150ms) var(--ease-smooth-out, ease-out);
	}

	.g-row-hot {
		background: color-mix(in oklab, var(--color-foreground, currentColor) 3%, transparent);
	}

	.g-bar {
		touch-action: pan-y;
		background: color-mix(in oklab, var(--g-hue) 16%, var(--color-card, white));
		box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--g-hue) 34%, transparent);
		animation: g-bar-in var(--duration-slow, 400ms) var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1)) backwards;
		animation-delay: calc(var(--g-i, 0) * var(--duration-stagger, 40ms));
		/* Snapping to whole days reads as a glide, not a jump. */
		transition:
			left var(--duration-quick, 150ms) var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1)),
			width var(--duration-quick, 150ms) var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1)),
			box-shadow var(--duration-quick, 150ms) var(--ease-smooth-out, ease-out);
	}

	.g-bar:hover,
	.g-bar-dragging {
		box-shadow:
			inset 0 0 0 1px color-mix(in oklab, var(--g-hue) 55%, transparent),
			0 1px 2px rgb(0 0 0 / 0.06),
			0 4px 12px color-mix(in oklab, var(--g-hue) 18%, transparent);
	}

	.g-bar-dragging {
		z-index: 15;
	}

	.g-progress {
		background: color-mix(in oklab, var(--g-hue) 32%, var(--color-card, white));
		transition: width var(--duration-fast, 250ms) var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1));
	}

	/* Resize grips: a wide invisible hit area, a slim pill that shows on hover. */
	.g-handle {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 12px;
		cursor: ew-resize;
		touch-action: none;
	}

	.g-handle::after {
		content: "";
		position: absolute;
		top: 25%;
		bottom: 25%;
		left: 50%;
		width: 3px;
		translate: -50% 0;
		border-radius: 999px;
		background: color-mix(in oklab, var(--g-hue) 70%, var(--color-foreground, black));
		opacity: 0;
		transition: opacity var(--duration-quick, 150ms) var(--ease-smooth-out, ease-out);
	}

	.g-bar:hover .g-handle::after,
	.g-bar:focus-visible .g-handle::after,
	.g-bar-dragging .g-handle::after {
		opacity: 0.6;
	}

	.g-summary {
		background: color-mix(in oklab, var(--g-hue) 45%, transparent);
		animation: g-bar-in var(--duration-slow, 400ms) var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1)) backwards;
		animation-delay: calc(var(--g-i, 0) * var(--duration-stagger, 40ms));
		transition:
			left var(--duration-quick, 150ms) var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1)),
			width var(--duration-quick, 150ms) var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1));
	}

	.g-tip {
		animation: g-tip-in var(--duration-quick, 150ms) var(--ease-smooth-out, ease-out) both;
	}

	.g-today {
		transform-origin: top;
		animation: g-today-in var(--duration-very-slow, 500ms) var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1)) backwards;
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
		animation: g-draw var(--duration-very-slow, 500ms) var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1)) 300ms backwards;
	}

	.g-arrow-head {
		animation: g-fade var(--duration-quick, 150ms) var(--ease-smooth-out, ease-out) 700ms backwards;
	}

	@keyframes g-bar-in {
		from {
			opacity: 0;
			clip-path: inset(0 100% 0 0 round 8px);
		}
		to {
			opacity: 1;
			clip-path: inset(0 0 0 0 round 8px);
		}
	}

	@keyframes g-tip-in {
		from {
			opacity: 0;
			translate: 0 var(--distance-micro, 4px);
		}
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
		.g-bar,
		.g-summary,
		.g-tip,
		.g-today,
		.g-arrow-line,
		.g-arrow-head {
			animation: none;
		}
		.g-bar,
		.g-summary,
		.g-progress {
			transition: none;
		}
	}
</style>
