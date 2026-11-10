<script lang="ts" generics="TData extends Record<string, unknown>">
	// =========================
	// IMPORTS
	// =========================
	import "#src/charts/chart-tokens.css";
	import "#src/charts/area-chart.css";
	import {
		Area,
		Axis,
		Chart,
		Highlight,
		LinearGradient,
		Spline,
		Svg,
		Tooltip,
		type ChartState,
	} from "layerchart";
	import { curveMonotoneX } from "d3-shape";
	import { chartTable } from "#src/charts/chart-a11y.js";
	import ChartPlot from "#src/charts/chart-plot.svelte";
	import Crosshair from "#src/charts/crosshair.svelte";
	import EdgeFade from "#src/charts/edge-fade.svelte";
	import { resolveEdgeFade } from "#src/charts/edge-fade.js";
	import Figure from "#src/charts/figure.svelte";
	import HoverFocus from "#src/charts/hover-focus.svelte";
	import { dualAxis } from "#src/charts/dual-axis.js";
	import { DOMAIN_MOTION, TOOLTIP_GAP, TOOLTIP_TOP } from "#src/charts/motion.js";
	import { valueTick } from "#src/charts/primitives/chart-utils.js";
	import Reveal from "#src/charts/reveal.svelte";
	import ReferenceLine, { type ChartReference } from "#src/charts/reference-line.svelte";
	import {
		NO_DATA,
		averageLabel as averageName,
		averageTo,
		smoothSeries,
		weekOf,
		ticksForWidth,
		type Smoothing,
	} from "#src/charts/smoothing.js";

	// =========================
	// TYPES
	// =========================
	type Series = {
		key: keyof TData & string;
		label?: string;
		color?: string;
		/**
		 * `"right"` plots the series on a second value axis with its own scale, for a measure in a
		 * different unit or about 10x larger than the rest. It draws as a line, without the fill.
		 */
		axis?: "left" | "right";
	};

	interface Props {
		data: TData[];
		xKey: keyof TData & string;
		yKey?: keyof TData & string;
		series?: Series[];
		color?: string;
		height?: number;
		stacked?: boolean;
		smooth?: boolean;
		/**
		 * Softens the left and right ends of the filled area instead of cutting them off at the plot edge.
		 */

		/*
		 * `true` fades 8% of the width per side, a number sets the fraction (0-0.45), `false` keeps the hard edges.
		 */
		edgeFade?: boolean | number;
		formatValue?: (v: number) => string;
		formatX?: (v: unknown) => string;
		xTicks?: number;
		/** A target drawn across the plot, like the deal a cost runs up to. */
		reference?: ChartReference;
		/**
		 * The headline while no point is hovered, like a period total. Defaults to the last point.
		 * `values`, keyed by series, shows one figure per series side by side in its colour, so it also reads as the legend.
		 */
		resting?: {
			value?: number;
			values?: Partial<Record<keyof TData & string, number>>;
			label: string;
		};
		/** Smooths the drawn line by the window shown; the resting figure stays the caller's total. */
		smoothing?: Smoothing;
		/** The chart's accessible name. Its data range and values are read after it. */
		label?: string;
		class?: string;
	}

	// =========================
	// PROPS
	// =========================
	let {
		data: input,
		xKey,
		yKey,
		series: seriesInput,
		color = "var(--chart-series-1)",
		height = 240,
		stacked = false,
		smooth = true,
		edgeFade = true,
		formatValue = (v) => v.toLocaleString(),
		formatX = (v) => String(v),
		xTicks = 6,
		reference,
		resting,
		smoothing,
		label = "Area chart",
		class: className,
	}: Props = $props();

	// =========================
	// STATE
	// =========================
	let active = $state<TData | null>(null);
	let context = $state<ChartState<TData>>();

	// ========================= FUNCTIONS ========================= WHY: called from the tooltip header's value expression so it re-runs on every active-point change; an unread {@const} side effect only evaluates once.

	// The microtask defers the state write out of template evaluation.
	function trackActive(d: TData): string {
		queueMicrotask(() => {
			active = d;
		});
		return pointLabel(d);
	}

	/** What a drawn point is: a day, the week it opens, or the end of a 7 or 28-day average. */
	function pointLabel(d: TData): string {
		const x = formatX(d[xKey]);
		return mode === "weekly" ? weekOf(x) : mode === "rolling" ? averageTo(x, smoothed.window) : x;
	}

	/** A missing point reads "No data", never the 0 Number(null) would claim. */
	function shown(value: unknown): string {
		return value == null ? NO_DATA : formatValue(Number(value));
	}

	function step(i: number | null) {
		if (i === null) {
			context?.tooltip.hide();
			active = null;
			return;
		}
		context?.tooltip.show({ data: data[i] });
	}

	// =========================
	// DERIVED
	// =========================
	const uid = `hr-area-${Math.random().toString(36).slice(2, 8)}`;
	const series = $derived(
		seriesInput && seriesInput.length > 0
			? seriesInput.map((s, i) => ({
					key: s.key,
					label: s.label ?? s.key,
					color: s.color ?? `var(--chart-series-${(i % 6) + 1})`,
					axis: s.axis === "right" ? ("right" as const) : ("left" as const),
				}))
			: yKey
				? [{ key: yKey, label: yKey, color, axis: "left" as const }]
				: [],
	);
	const leftSeries = $derived(series.filter((s) => s.axis === "left"));
	const rightSeries = $derived(series.filter((s) => s.axis === "right"));
	const smoothed = $derived(
		smoothing
			? smoothSeries(
					input,
					xKey,
					series.map((s) => s.key),
					smoothing,
				)
			: { points: input, mode: "raw" as const, window: 1 },
	);
	const data = $derived(smoothed.points);
	const mode = $derived(smoothed.mode);
	// The series label in the readout, unless the point is an average of the days before it.
	const averageLabel = $derived(mode === "rolling" ? averageName(smoothed.window) : null);
	const dataMax = $derived.by(() => {
		if (stacked) {
			return Math.max(
				0,
				...data.map((d) => leftSeries.reduce((s, k) => s + Number(d[k.key] ?? 0), 0)),
			);
		}
		return Math.max(0, ...data.flatMap((d) => leftSeries.map((s) => Number(d[s.key] ?? 0))));
	});
	// A target above every point would sit off the plot.
	const yMax = $derived(Math.max(dataMax, reference?.value ?? 0));
	// A right-axis series lives on the chart's one y scale, rescaled so its domain fills the same
	// height; the right axis labels that height in the series' own unit.
	const axes = $derived.by(() => {
		if (rightSeries.length === 0) return null;
		const rightMax = Math.max(
			0,
			...data.flatMap((d) => rightSeries.map((s) => Number(d[s.key] ?? 0))),
		);
		return dualAxis(yMax, rightMax);
	});
	const plotKey = (s: { key: string; axis: "left" | "right" }) =>
		s.axis === "right" ? `__hr_right_${s.key}` : s.key;
	const plotData = $derived.by((): TData[] => {
		if (!axes) return data;
		const factor = axes.left.max / axes.right.max;
		return data.map((d) => {
			const row: Record<string, unknown> = { ...d };
			// A gap stays a gap: null times a factor would draw a 0.
			for (const s of rightSeries)
				row[plotKey(s)] = d[s.key] == null ? null : Number(d[s.key]) * factor;
			return row as TData;
		});
	});
	// An axis takes its series' colour only when one series owns it; with two on a side the colour would name one of them.
	const leftTone = $derived(axes && leftSeries.length === 1 ? leftSeries[0].color : undefined);
	const rightTone = $derived(rightSeries.length === 1 ? rightSeries[0].color : undefined);
	const curve = $derived(smooth ? curveMonotoneX : undefined);
	const fade = $derived(resolveEdgeFade(edgeFade));
	const fadeMask = $derived(fade > 0 ? `url(#${uid}-fade)` : undefined);
	const fallback = $derived(data.length > 0 ? data[data.length - 1] : null);
	const display = $derived(active ?? fallback);

	const tick = $derived(valueTick(formatValue));
	const figureRows = $derived(
		display
			? series.map((s) => ({
					value: Number(display[s.key]),
					label: averageLabel ?? s.label,
					color: s.color,
				}))
			: null,
	);
	const table = $derived(
		chartTable(
			data,
			pointLabel,
			series.map((s) => ({ label: averageLabel ?? s.label, value: (d: TData) => d[s.key] })),
			formatValue,
			{ xLabel: xKey, empty: NO_DATA },
		),
	);
</script>

<!-- =========================== -->
<!-- AREA CHART -->
<!-- =========================== -->
<!-- WHY: leaving only resets the hover readout; the keyboard path is ChartPlot's. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="hr-area-chart {className ?? ''}" onpointerleave={() => (active = null)}>
	{#if resting?.values && !active}
		<Figure
			series={series
				.filter((s) => resting.values?.[s.key] != null)
				.map((s) => ({ value: Number(resting.values?.[s.key]), label: s.label, color: s.color }))}
			eyebrow={resting.label}
			format={formatValue}
			size="md"
		/>
	{:else if resting && resting.value != null && !active && series[0]}
		<Figure
			series={[{ value: resting.value, label: series[0].label, color: series[0].color }]}
			eyebrow={resting.label}
			format={formatValue}
			size="md"
		/>
	{:else if display && series.every((s) => display[s.key] == null)}
		<Figure value={NO_DATA} eyebrow={pointLabel(display)} size="md" />
	{:else if figureRows && display}
		<Figure series={figureRows} eyebrow={pointLabel(display)} format={formatValue} size="md" />
	{:else}
		<Figure value="—" eyebrow="Latest" size="md" />
	{/if}

	<ChartPlot class="hr-chart-body" height="{height}px" {label} {table} onStep={step}>
		{#if data.length === 0}
			<div class="empty"><p>No data</p></div>
		{:else}
			<Chart
				data={plotData}
				x={xKey}
				y={series[0] ? plotKey(series[0]) : undefined}
				yDomain={[0, axes ? axes.left.max : yMax || 1]}
				yNice={!axes}
				padding={{ left: 48, bottom: 28, top: 8, right: axes ? 48 : 12 }}
				tooltipContext={{ mode: "quadtree-x" }}
				motion={DOMAIN_MOTION}
				bind:context
			>
				<Svg aria-hidden="true">
					<g class="hr-axis-tone" style:--hr-axis-tone={leftTone}>
						<Axis
							placement="left"
							format={(v) => tick(Number(v))}
							ticks={axes ? axes.left.ticks : 4}
						/>
					</g>
					{#if axes}
						<g class="hr-axis-tone" style:--hr-axis-tone={rightTone}>
							<Axis
								placement="right"
								domain={[0, axes.right.max]}
								format={(v) => tick(Number(v))}
								ticks={axes.right.ticks}
							/>
						</g>
					{/if}
					<Axis placement="bottom" format={(v) => formatX(v)} ticks={ticksForWidth(xTicks)} />
					<g class="hr-area-grid">
						<Axis
							placement="left"
							grid
							rule={false}
							ticks={axes ? axes.left.ticks : 4}
							format={() => ""}
						/>
					</g>
					{#if fade > 0}
						<EdgeFade id="{uid}-fade" amount={fade} />
					{/if}
					<Crosshair id="{uid}-cross" />
					{#if reference}
						<ReferenceLine {reference} />
					{/if}
					<HoverFocus>
						<Reveal>
							{#each series as s, i (s.key)}
								<LinearGradient id="{uid}-{i}" vertical>
									{#snippet stopsContent()}
										<stop offset="0%" stop-color={s.color} stop-opacity="0.45" />
										<stop offset="100%" stop-color={s.color} stop-opacity="0.04" />
									{/snippet}
								</LinearGradient>
								<!-- WHY `y1` and not `y`: layerchart's Area has no `y` prop, so every
							     series drew the first series' shape and the gradients stacked on
							     one path. See `Area.shared.svelte.js`. -->
								{#if s.axis === "left"}
									<Area y1={s.key} {curve} fill="url(#{uid}-{i})" mask={fadeMask} />
								{/if}
								<Spline
									y={plotKey(s)}
									{curve}
									style="stroke: {s.color}; fill: none"
									stroke-width="2"
								/>
							{/each}
						</Reveal>
						{#snippet segment()}
							{#each series as s (s.key)}
								<Spline
									y={plotKey(s)}
									{curve}
									style="stroke: {s.color}; fill: none"
									stroke-width="2"
								/>
							{/each}
						{/snippet}
					</HoverFocus>
					{#if axes}
						<!-- WHY `data`: without it Highlight places dots from the tooltip's raw values, off the rescaled right series. -->
						<Highlight lines={{ style: `stroke: url(#${uid}-cross)` }} />
						{#if context?.tooltip.data}
							{#each series as s (s.key)}
								<Highlight data={context.tooltip.data} y={plotKey(s)} points={{ fill: s.color }} />
							{/each}
						{/if}
					{:else}
						<Highlight points lines={{ style: `stroke: url(#${uid}-cross)` }} />
					{/if}
				</Svg>
				<Tooltip.Root x="data" y={TOOLTIP_TOP} xOffset={TOOLTIP_GAP}>
					{#snippet children({ data: d })}
						<Tooltip.Header value={trackActive(d as TData)} />
						<Tooltip.List>
							{#each series as s (s.key)}
								<Tooltip.Item
									label={averageLabel ?? s.label}
									value={shown(d[s.key])}
									color={s.color}
								/>
							{/each}
						</Tooltip.List>
					{/snippet}
				</Tooltip.Root>
			</Chart>
		{/if}
	</ChartPlot>
</div>
