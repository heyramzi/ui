<script lang="ts" generics="TData extends Record<string, unknown>">
	// =========================
	// IMPORTS
	// =========================
	import "#src/charts/chart-tokens.css";
	import "#src/charts/sparkline.css";
	import {
		Area,
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
	import Reveal from "#src/charts/reveal.svelte";
	import {
		NO_DATA,
		averageLabel,
		averageTo,
		smoothSeries,
		weekOf,
		type Smoothing,
	} from "#src/charts/smoothing.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		data: TData[];
		xKey: keyof TData & string;
		yKey: keyof TData & string;
		color?: string;
		/** Pixels, or any CSS length such as `calc(30px * var(--scale))`. */
		height?: number | string;
		smooth?: boolean;
		/** Show a dot at the latest point */
		endCap?: boolean;
		/** Show the latest value as inline text */
		showLast?: boolean;
		/**
		 * Ornament mode: no tooltip, no highlight, no end cap, and the plot runs to the edges of its box.
		 */

		/*
		 * For a line inside a control that already states the number and owns the pointer, such as a stat card that links.
		 */
		bare?: boolean;
		formatValue?: (v: number) => string;
		/** The tooltip's date. */
		formatX?: (v: unknown) => string;
		/** Smooths the drawn line by the window shown, so a year doesn't draw as a barcode. */
		smoothing?: Smoothing;
		/** The accessible name. Its range and values are read after it. Unused when bare. */
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
		color = "var(--chart-series-1)",
		height = 44,
		smooth = true,
		endCap = true,
		showLast = false,
		bare = false,
		formatValue = (v) => v.toLocaleString(),
		formatX = (v) => String(v),
		smoothing,
		label = "Sparkline",
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

	function pointLabel(d: TData): string {
		const x = formatX(d[xKey]);
		return mode === "weekly" ? weekOf(x) : mode === "rolling" ? averageTo(x, smoothed.window) : x;
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
	const uid = `hr-spark-${Math.random().toString(36).slice(2, 8)}`;
	const smoothed = $derived(
		smoothing
			? smoothSeries(input, xKey, [yKey], smoothing)
			: { points: input, mode: "raw" as const, window: 1 },
	);
	const data = $derived(smoothed.points);
	const mode = $derived(smoothed.mode);
	const valueLabel = $derived(mode === "rolling" ? averageLabel(smoothed.window) : String(yKey));
	const table = $derived(
		chartTable(
			data,
			pointLabel,
			[{ label: valueLabel, value: (d: TData) => d[yKey] }],
			formatValue,
			{
				xLabel: xKey,
				empty: NO_DATA,
			},
		),
	);
	const curve = $derived(smooth ? curveMonotoneX : undefined);
	// The newest measured point: a gap at the end has no height for the dot to sit at.
	const last = $derived(data.findLast((d) => d[yKey] != null) ?? null);
	const display = $derived(active ?? last);
	const dot = $derived(endCap && !bare);
	// Bare runs to the edges: the fill reaches the bottom of the box and the line keeps three pixels of head so its stroke is not cut at the series

	// maximum.
	const padding = $derived(
		bare
			? { top: 3, bottom: 0, left: 0, right: 0 }
			: { top: 4, bottom: 4, left: 0, right: dot ? 6 : 0 },
	);
</script>

<!-- =========================== -->
<!-- SPARKLINE -->
<!-- =========================== -->
<!-- WHY: leaving only resets the hover readout; the keyboard path is ChartPlot's. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="hr-sparkline {className ?? ''}"
	aria-hidden={bare ? "true" : undefined}
	data-bare={bare ? "" : undefined}
	onpointerleave={() => (active = null)}
>
	{#if data.length > 0}
		<ChartPlot
			class="hr-sparkline-chart"
			height={typeof height === "number" ? `${height}px` : height}
			{label}
			{table}
			onstep={bare ? undefined : step}
		>
			<Chart {data} x={xKey} y={yKey} {padding} tooltipContext={{ mode: "bisect-x" }} bind:context>
				<Svg aria-hidden="true">
					<LinearGradient id={uid} vertical>
						{#snippet stopsContent()}
							<stop offset="0%" stop-color={color} stop-opacity="0.38" />
							<stop offset="100%" stop-color={color} stop-opacity="0" />
						{/snippet}
					</LinearGradient>
					<Reveal bleed={3}>
						<!-- WHY no `y0`: it defaults to the bottom of the plot, which is what
						     a fill under a sparkline wants whatever its domain is. -->
						<Area y1={yKey} {curve} fill="url(#{uid})" />
						<Spline {curve} style="stroke: {color}; fill: none" stroke-width="1.5" />
					</Reveal>
					{#if dot && last}
						<!-- WHY: Points resolves its own data and hands the inner circle pixel coords; Circle's data mode clobbers the sibling Spline's data in -->
						<!-- this layerchart prerelease (and a bare object left the dot at the chart origin). -->
						<Points data={[last]} r={3} fill={color} class="hr-sparkline-end" />
					{/if}
					{#if !bare}
						<Highlight points lines={false} />
					{/if}
				</Svg>
				{#if !bare}
					<Tooltip.Root>
						{#snippet children({ data: d })}
							<Tooltip.Header value={trackActive(d as TData)} />
							<Tooltip.List>
								<Tooltip.Item
									label={valueLabel}
									value={d[yKey] == null ? NO_DATA : formatValue(Number(d[yKey]))}
								/>
							</Tooltip.List>
						{/snippet}
					</Tooltip.Root>
				{/if}
			</Chart>
		</ChartPlot>
		{#if showLast && display}
			<span class="hr-sparkline-value" style:color>
				{formatValue(Number(display[yKey]))}
			</span>
		{/if}
	{/if}
</div>
