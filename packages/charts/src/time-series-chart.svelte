<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import "./time-series-chart.css";
	import { scaleTime } from "d3-scale";
	import { curveMonotoneX } from "d3-shape";
	import {
		Area,
		Axis,
		Chart,
		Grid,
		Highlight,
		LinearGradient,
		Spline,
		Svg,
		Tooltip,
	} from "layerchart";
	import Crosshair from "./crosshair.svelte";
	import EdgeFade from "./edge-fade.svelte";
	import { resolveEdgeFade } from "./edge-fade.js";
	import { DOMAIN_MOTION } from "./motion.js";
	import Reveal from "./reveal.svelte";

	// =========================
	// TYPES
	// =========================
	interface DataPoint {
		date: string;
		value: number;
		value2?: number;
	}

	interface Props {
		data: DataPoint[];
		label?: string;
		label2?: string;
		color?: string;
		color2?: string;
		formatValue?: (v: number) => string;
		formatValue2?: (v: number) => string;
		height?: number;
		/** Clamp Y-axis to 95th percentile so outlier spikes don't flatten normal data */
		softMax?: boolean;
		/** Y-axis floor. Raise above 0 to frame variation around a baseline. */
		yMin?: number;
		/**
		 * Softens the left and right ends of the filled area instead of cutting them off at the plot edge.
		 */

		/*
		 * `true` fades 8% of the width per side, a number sets the fraction (0-0.45), `false` keeps the hard edges.
		 */
		edgeFade?: boolean | number;
	}

	// =========================
	// PROPS
	// =========================
	let {
		data,
		label = "Value",
		label2,
		color = "var(--chart-1)",
		color2 = "var(--muted-foreground)",
		formatValue = (v) => v.toLocaleString(),
		formatValue2,
		height = 280,
		softMax = false,
		yMin = 0,
		edgeFade = true,
	}: Props = $props();

	// =========================
	// DERIVED
	// =========================
	const gradientId = $derived(
		`time-series-gradient-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
	);
	const fade = $derived(resolveEdgeFade(edgeFade));
	const fadeMask = $derived(fade > 0 ? `url(#${gradientId}-fade)` : undefined);

	let chartData = $derived(
		data.map((d) => ({
			...d,
			dateObj: new Date(d.date),
		})),
	);

	let yMax = $derived.by(() => {
		const allValues = [
			...data.map((d) => d.value),
			...data.flatMap((d) => (d.value2 == null ? [] : [d.value2])),
		];
		const absMax = Math.max(...allValues);

		if (!softMax || allValues.length < 10) return absMax;

		const sorted = allValues.filter((v) => v > 0).toSorted((a, b) => a - b);
		if (sorted.length === 0) return absMax;

		const p95 = sorted[Math.floor(sorted.length * 0.95)];
		// Only clamp if the max is significantly larger than p95 (2x+)
		if (absMax > p95 * 2) return p95 * 1.3;
		return absMax;
	});
</script>

<!-- =========================== -->
<!-- TIME SERIES CHART -->
<!-- =========================== -->
<div class="hr-ts-chart" style="height: {height}px">
	{#if chartData.length === 0}
		<div class="empty"><p>No historical data yet</p></div>
	{:else}
		<Chart
			data={chartData}
			x="dateObj"
			xScale={scaleTime()}
			y="value"
			yDomain={[yMin, yMax]}
			yNice
			padding={{ left: 56, bottom: 36, top: 12, right: 16 }}
			tooltipContext={{ mode: "bisect-x" }}
			motion={DOMAIN_MOTION}
		>
			<Svg>
				<Axis placement="left" format={(v) => formatValue(v)} ticks={6} />
				<Axis
					placement="bottom"
					format={(d) => {
						const date = d instanceof Date ? d : new Date(d);
						return date.toLocaleDateString("en", { month: "short", day: "numeric" });
					}}
				/>
				<Grid y class="hr-ts-grid" />
				<LinearGradient id={gradientId} vertical>
					{#snippet stopsContent()}
						<stop offset="0%" stop-color={color} stop-opacity="0.35" />
						<stop offset="100%" stop-color={color} stop-opacity="0.02" />
					{/snippet}
				</LinearGradient>
				{#if fade > 0}
					<EdgeFade id="{gradientId}-fade" amount={fade} />
				{/if}
				<Crosshair id="{gradientId}-cross" />
				<Reveal>
					<Area curve={curveMonotoneX} fill="url(#{gradientId})" mask={fadeMask} />
					<Spline curve={curveMonotoneX} style="stroke: {color}; fill: none" stroke-width="1.5" />
					{#if label2}
						<Spline
							y="value2"
							curve={curveMonotoneX}
							style="stroke: {color2}; stroke-dasharray: 4 4; stroke-width: 1; fill: none"
						/>
					{/if}
				</Reveal>
				<Highlight points lines={{ style: `stroke: url(#${gradientId}-cross)` }} />
			</Svg>
			<Tooltip.Root>
				{#snippet children({ data: d })}
					<Tooltip.Header
						value={d.dateObj.toLocaleDateString("en", {
							month: "short",
							day: "numeric",
							year: "numeric",
						})}
					/>
					<Tooltip.List>
						<Tooltip.Item {label} value={formatValue(d.value)} />
						{#if label2 && d.value2 !== undefined}
							<Tooltip.Item label={label2} value={(formatValue2 ?? formatValue)(d.value2)} />
						{/if}
					</Tooltip.List>
				{/snippet}
			</Tooltip.Root>
		</Chart>
	{/if}
</div>
