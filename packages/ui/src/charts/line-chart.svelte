<script lang="ts" generics="TData extends Record<string, unknown>">
	// =========================
	// IMPORTS
	// =========================
	import "#src/charts/chart-tokens.css";
	import "#src/charts/line-chart.css";
	import {
		Area,
		Axis,
		Chart,
		Highlight,
		LinearGradient,
		Points,
		Spline,
		Svg,
		Tooltip,
		type ChartState,
	} from "layerchart";
	import { chartTable } from "#src/charts/chart-a11y.js";
	import ChartPlot from "#src/charts/chart-plot.svelte";
	import { curveMonotoneX } from "d3-shape";
	import Crosshair from "#src/charts/crosshair.svelte";
	import EdgeFade from "#src/charts/edge-fade.svelte";
	import { resolveEdgeFade } from "#src/charts/edge-fade.js";
	import Figure from "#src/charts/figure.svelte";
	import HoverFocus from "#src/charts/hover-focus.svelte";
	import { DOMAIN_MOTION, TOOLTIP_GAP, TOOLTIP_TOP } from "#src/charts/motion.js";
	import { valueTick } from "#src/charts/primitives/chart-utils.js";
	import Reveal from "#src/charts/reveal.svelte";

	// =========================
	// TYPES
	// =========================
	type Series = {
		key: keyof TData & string;
		label?: string;
		color?: string;
	};

	interface Props {
		data: TData[];
		xKey: keyof TData & string;
		yKey?: keyof TData & string;
		series?: Series[];
		color?: string;
		height?: number;
		smooth?: boolean;
		/**
		 * Softens the left and right ends of the gradient fill instead of cutting them off at the plot edge.
		 */

		/*
		 * `true` fades 8% of the width per side, a number sets the fraction (0-0.45), `false` keeps the hard edges.
		 */
		edgeFade?: boolean | number;
		/** Draw a ring marker at every data point. */
		showMarkers?: boolean;
		/** Inclusive index where a dashed "in progress" tail begins (e.g. the latest, still-open period). */
		dashFromIndex?: number;
		/** Dash pattern for the tail segment. */
		dashArray?: string;
		formatValue?: (v: number) => string;
		formatX?: (v: unknown) => string;
		/** The chart's accessible name. Its data range and values are read after it. */
		label?: string;
		class?: string;
	}

	// =========================
	// PROPS
	// =========================
	let {
		data,
		xKey,
		yKey,
		series: seriesInput,
		color = "var(--chart-series-1)",
		height = 240,
		smooth = true,
		edgeFade = true,
		showMarkers = false,
		dashFromIndex,
		dashArray = "5 4",
		formatValue = (v) => v.toLocaleString(),
		formatX = (v) => String(v),
		label = "Line chart",
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
		return formatX(d[xKey]);
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
	const uid = `hr-line-${Math.random().toString(36).slice(2, 8)}`;
	const series = $derived(
		seriesInput && seriesInput.length > 0
			? seriesInput.map((s, i) => ({
					key: s.key,
					label: s.label ?? s.key,
					color: s.color ?? `var(--chart-series-${(i % 6) + 1})`,
				}))
			: yKey
				? [{ key: yKey, label: yKey, color }]
				: [],
	);
	const yMax = $derived(
		Math.max(0, ...data.flatMap((d) => series.map((s) => Number(d[s.key] ?? 0)))),
	);
	const curve = $derived(smooth ? curveMonotoneX : undefined);
	const fade = $derived(resolveEdgeFade(edgeFade));
	const fadeMask = $derived(fade > 0 ? `url(#${uid}-fade)` : undefined);
	const fallback = $derived(data.length > 0 ? data[data.length - 1] : null);
	const display = $derived(active ?? fallback);

	const tick = $derived(valueTick(formatValue));
	// WHY: a dashed tail is two splines sharing the boundary point so the solid
	// and dashed segments meet without a gap.
	const hasTail = $derived(
		dashFromIndex != null && dashFromIndex >= 0 && dashFromIndex < data.length - 1,
	);
	const solidData = $derived(hasTail ? data.slice(0, (dashFromIndex as number) + 1) : data);
	const tailData = $derived(hasTail ? data.slice(dashFromIndex as number) : []);
	const figureRows = $derived(
		display
			? series.map((s) => ({ value: Number(display[s.key]), label: s.label, color: s.color }))
			: null,
	);
	const table = $derived(
		chartTable(
			data,
			(d) => formatX(d[xKey]),
			series.map((s) => ({ label: s.label, value: (d: TData) => d[s.key] })),
			formatValue,
			{ xLabel: xKey },
		),
	);
</script>

<!-- =========================== -->
<!-- LINE CHART -->
<!-- =========================== -->
<!-- WHY: leaving only resets the hover readout; the keyboard path is ChartPlot's. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="hr-line-chart {className ?? ''}" onpointerleave={() => (active = null)}>
	{#if figureRows && display}
		<Figure series={figureRows} eyebrow={formatX(display[xKey])} format={formatValue} size="md" />
	{:else}
		<Figure value="—" eyebrow="Latest" size="md" />
	{/if}

	{#snippet strokes(s: (typeof series)[number])}
		{#if hasTail}
			<Spline
				data={solidData}
				y={s.key}
				{curve}
				style="stroke: {s.color}; fill: none"
				stroke-width="2"
				stroke-linecap="round"
			/>
			<Spline
				data={tailData}
				y={s.key}
				{curve}
				style="stroke: {s.color}; fill: none"
				stroke-width="2"
				stroke-dasharray={dashArray}
			/>
		{:else}
			<Spline
				y={s.key}
				{curve}
				style="stroke: {s.color}; fill: none"
				stroke-width="2"
				stroke-linecap="round"
			/>
		{/if}
	{/snippet}

	<ChartPlot class="hr-chart-body" height="{height}px" {label} {table} onstep={step}>
		{#if data.length === 0}
			<div class="empty"><p>No data</p></div>
		{:else}
			<Chart
				{data}
				x={xKey}
				y={series[0]?.key}
				yDomain={[0, yMax || 1]}
				yNice
				padding={{ left: 48, bottom: 28, top: 8, right: 12 }}
				tooltipContext={{ mode: "bisect-x" }}
				motion={DOMAIN_MOTION}
				bind:context
			>
				<Svg aria-hidden="true">
					<Axis placement="left" format={(v) => tick(Number(v))} ticks={4} />
					<Axis placement="bottom" format={(v) => formatX(v)} />
					<g class="hr-line-grid">
						<Axis placement="left" grid rule={false} ticks={4} format={() => ""} />
					</g>
					{#if fade > 0}
						<EdgeFade id="{uid}-fade" amount={fade} />
					{/if}
					<Crosshair id="{uid}-cross" />
					<HoverFocus>
						<Reveal>
							{#each series as s, i (s.key)}
								<LinearGradient id="{uid}-{i}" vertical>
									{#snippet stopsContent()}
										<stop offset="0%" stop-color={s.color} stop-opacity="0.22" />
										<stop offset="100%" stop-color={s.color} stop-opacity="0.01" />
									{/snippet}
								</LinearGradient>
								<Area
									y1={s.key}
									{curve}
									fill="url(#{uid}-{i})"
									mask={fadeMask}
									line={false}
									class="hr-line-area"
								/>
								{@render strokes(s)}
								{#if showMarkers}
									<Points
										y={s.key}
										r={3}
										fill="var(--background, white)"
										stroke={s.color}
										stroke-width={2}
										class="hr-line-marker"
									/>
								{/if}
							{/each}
						</Reveal>
						{#snippet segment()}
							{#each series as s (s.key)}
								{@render strokes(s)}
							{/each}
						{/snippet}
					</HoverFocus>
					<Highlight points lines={{ style: `stroke: url(#${uid}-cross)` }} />
				</Svg>
				<Tooltip.Root x="data" y={TOOLTIP_TOP} xOffset={TOOLTIP_GAP}>
					{#snippet children({ data: d })}
						<Tooltip.Header value={trackActive(d as TData)} />
						<Tooltip.List>
							{#each series as s (s.key)}
								<Tooltip.Item
									label={s.label}
									value={formatValue(Number(d[s.key]))}
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
