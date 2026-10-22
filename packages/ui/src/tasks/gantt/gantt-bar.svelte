<script lang="ts">
	import { cn } from "#src/lib/utils.js";
	import { isoFromDay } from "#src/tasks/dates.js";
	import type { GanttChange } from "#src/tasks/task-types.js";
	import { barWidth, dayX, type Drag, type Layout, type Span } from "#src/tasks/gantt/logic.js";
	import "#src/tasks/gantt/gantt.css";

	interface Props {
		id: string;
		title: string;
		/** The task's own dates, with a live drag applied. */
		span: Span;
		hue: string;
		progress: number;
		order: number;
		layout: Layout;
		staggerCap: number;
		/** A bar narrower than this shows its title outside, to the right. */
		inlineTitleMin: number;
		/** The first row has no room above it, so its drag tip opens below. */
		tipBelow: boolean;
		drag: Drag | null;
		setDrag: (drag: Drag | null) => void;
		onhover: (id: string, on: boolean) => void;
		onChange?: (id: string, change: GanttChange) => void | Promise<void>;
		onSelect?: (id: string) => void;
		describe: (span: Span) => string;
	}

	let {
		id,
		title,
		span,
		hue,
		progress,
		order,
		layout,
		staggerCap,
		inlineTitleMin,
		tipBelow,
		drag,
		setDrag,
		onhover,
		onChange,
		onSelect,
		describe,
	}: Props = $props();

	let editable = $derived(!!onChange);
	let dragging = $derived(drag?.id === id);
	let width = $derived(barWidth(span, layout));
	let left = $derived(dayX(layout, span.start) + layout.inset);

	function onPointerDown(e: PointerEvent, mode: Drag["mode"]): void {
		if (!editable || e.button !== 0) return;
		e.stopPropagation();
		(e.currentTarget as HTMLElement)
			.closest<HTMLElement>("[data-bar]")
			?.setPointerCapture(e.pointerId);
		setDrag({ id, mode, originX: e.clientX, dx: 0 });
	}

	function onPointerMove(e: PointerEvent): void {
		if (!drag) return;
		const dx = Math.round((e.clientX - drag.originX) / layout.dayWidth);
		if (dx !== drag.dx) setDrag({ ...drag, dx });
	}

	function onPointerUp(): void {
		if (!drag || drag.id !== id) return;
		const moved = drag.dx !== 0;
		setDrag(null);
		if (moved) void onChange?.(id, { start: isoFromDay(span.start), end: isoFromDay(span.end) });
		else onSelect?.(id);
	}

	/** Arrow keys move a bar a day. Shift plus an arrow moves its end, so the task grows or shrinks. */
	function onKeyDown(e: KeyboardEvent): void {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			onSelect?.(id);
			return;
		}
		if (!editable || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
		e.preventDefault();
		const step = e.key === "ArrowRight" ? 1 : -1;
		const next = e.shiftKey
			? { start: span.start, end: Math.max(span.start, span.end + step) }
			: { start: span.start + step, end: span.end + step };
		if (next.start === span.start && next.end === span.end) return;
		void onChange?.(id, { start: isoFromDay(next.start), end: isoFromDay(next.end) });
	}
</script>

<div
	data-bar
	role="button"
	tabindex="0"
	aria-roledescription="task bar"
	aria-label="{title}, {describe(span)}.{editable
		? ' Arrow keys move it a day, Shift plus arrow keys change its end.'
		: ''}"
	class={cn(
		"g-bar g-enter absolute top-1/2 flex -translate-y-1/2 items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
		editable && "cursor-grab",
		dragging && "g-bar-dragging cursor-grabbing",
	)}
	style:--g-hue={hue}
	style:--g-i={Math.min(order, staggerCap)}
	style:left="{left}px"
	style:width="{width}px"
	style:height="{layout.rowHeight - 14}px"
	onpointerdown={(e) => onPointerDown(e, "move")}
	onpointermove={onPointerMove}
	onpointerup={onPointerUp}
	onpointercancel={() => setDrag(null)}
	onpointerenter={() => onhover(id, true)}
	onpointerleave={() => onhover(id, false)}
	onkeydown={onKeyDown}
>
	{#if progress > 0}
		<!-- The clip keeps the bar's rounded corners while the fill scales. -->
		<span class="absolute inset-0 overflow-hidden rounded-lg" aria-hidden="true">
			<span class="g-progress absolute inset-0 origin-left" style:transform="scaleX({progress})"
			></span>
		</span>
	{/if}
	{#if width >= inlineTitleMin}
		<span class="relative truncate px-2.5 text-xs font-medium text-foreground">{title}</span>
	{/if}
	{#if editable}
		<span
			class="g-handle left-0"
			aria-hidden="true"
			onpointerdown={(e) => onPointerDown(e, "start")}
		></span>
		<span class="g-handle right-0" aria-hidden="true" onpointerdown={(e) => onPointerDown(e, "end")}
		></span>
	{/if}
	{#if dragging && drag && drag.dx !== 0}
		<span
			class={cn(
				"g-tip pointer-events-none absolute left-0 z-20 rounded-md bg-foreground px-2 py-1 text-[11px] font-medium whitespace-nowrap text-background tabular-nums shadow-md",
				tipBelow ? "top-full mt-1.5" : "bottom-full mb-1.5",
			)}
		>
			{describe(span)}
		</span>
	{/if}
</div>
{#if width < inlineTitleMin}
	<span
		class="pointer-events-none absolute top-1/2 -translate-y-1/2 truncate rounded-sm bg-card/90 px-1 text-xs text-muted-foreground"
		style:left="{dayX(layout, span.end + 1) + 16}px"
		style:max-width="200px"
	>
		{title}
	</span>
{/if}

<style>
	.g-bar {
		touch-action: pan-y;
		background: color-mix(in oklab, var(--g-hue) 16%, var(--color-card, white));
		box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--g-hue) 34%, transparent);
		/* Snapping to whole days reads as a glide, not a jump. */
		transition:
			left var(--duration-quick, 150ms) var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1)),
			width var(--duration-quick, 150ms) var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1)),
			box-shadow var(--duration-quick, 150ms) var(--ease-smooth-out, ease-out);
	}

	@media (hover: hover) and (pointer: fine) {
		.g-bar:hover {
			box-shadow:
				inset 0 0 0 1px color-mix(in oklab, var(--g-hue) 55%, transparent),
				0 1px 2px rgb(0 0 0 / 0.06),
				0 4px 12px color-mix(in oklab, var(--g-hue) 18%, transparent);
		}
	}

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
		transition: transform var(--duration-fast, 250ms)
			var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1));
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

	@media (hover: hover) and (pointer: fine) {
		.g-bar:hover .g-handle::after {
			opacity: 0.6;
		}
	}

	.g-bar:focus-visible .g-handle::after,
	.g-bar-dragging .g-handle::after {
		opacity: 0.6;
	}

	.g-tip {
		animation: g-tip-in var(--duration-quick, 150ms) var(--ease-smooth-out, ease-out) both;
	}

	@keyframes g-tip-in {
		from {
			opacity: 0;
			translate: 0 var(--distance-micro, 4px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.g-tip {
			animation: none;
		}
		.g-bar,
		.g-progress {
			transition: none;
		}
	}
</style>
