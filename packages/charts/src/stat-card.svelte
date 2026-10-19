<script lang="ts" generics="TData extends Record<string, unknown>">
	// =========================
	// IMPORTS
	// =========================
	import "#src/stat-card.css";
	import { Area, Bars, Chart, Highlight, LinearGradient, Spline, Svg, Tooltip } from "layerchart";
	import { scaleBand } from "d3-scale";
	import { curveBasis, curveCardinal } from "d3-shape";
	import type { Snippet } from "svelte";
	import Crosshair from "#src/crosshair.svelte";
	import EdgeFade from "#src/edge-fade.svelte";
	import Reveal from "#src/reveal.svelte";
	import { resolveEdgeFade } from "#src/edge-fade.js";
	import Figure from "#src/figure.svelte";
	import GaugeChart from "#src/gauge-chart.svelte";

	// =========================
	// TYPES
	// =========================
	type Variant = "line" | "area" | "bar" | "gauge";
	type Trend = "up" | "down" | "neutral";

	interface Props {
		/** Series for the line/area/bar variants. Unused by the gauge variant. */
		data?: TData[];
		xKey?: keyof TData & string;
		yKey?: keyof TData & string;
		/** Chart kind. "gauge" puts a radial gauge to the right of the figure. */
		variant?: Variant;
		/** Arc fill 0-100 for variant="gauge". Falls back to `value` when numeric. */
		gaugeValue?: number;
		/** Label under the gauge percentage. */
		gaugeLabel?: string;
		/** Metric name shown top-left. Omit (or set `figureOnly`) for a bare chart. */
		label?: string;
		/** Headline number; counts up on mount. */
		value?: number;
		/** Percentage change. Its sign drives the trend color/arrow unless `trend` is set. */
		delta?: number;
		/** Force the trend direction independent of `delta`'s sign. */
		trend?: Trend;
		/** Caption under the value, e.g. "Avg" or "vs last month". */
		caption?: string;
		/** Render only the edge-to-edge chart, no header/value/caption. */
		figureOnly?: boolean;
		color?: string;
		/** Chart height in px. */
		height?: number;
		smooth?: boolean;
		/**
		 * Softens the left and right ends of the line and the area fill instead of cutting them off at the card edge.
		 */

		/*
		 * `true` fades 8% of the width per side, a number sets the fraction (0-0.45), `false` keeps the hard edges.
		 */
		edgeFade?: boolean | number;
		/** Format for the headline value. */
		formatValue?: (v: number) => string;
		/** Format for the x value shown as the tooltip header (e.g. a date/period). */
		formatX?: (v: unknown) => string;
		/** Leading icon next to the label. */
		icon?: Snippet;
		class?: string;
	};

	// =========================
	// PROPS
	// =========================
	let {
		data = [],
		xKey,
		yKey,
		variant = "area",
		gaugeValue,
		gaugeLabel,
		label,
		value,
		delta,
		trend,
		caption,
		figureOnly = false,
		color = "var(--chart-1)",
		height = 150,
		smooth = true,
		edgeFade = true,
		formatValue = (v) => v.toLocaleString(),
		formatX = (v) => String(v),
		icon,
		class: className,
	}: Props = $props();

	// =========================
	// DERIVED
	// =========================
	const uid = `hr-stat-${Math.random().toString(36).slice(2, 8)}`;
	// WHY: match bklit's stat-card curves per variant. The area card uses cardinal

	// at 0.65 tension; the line card uses curveBasis (a smoother, approximating spline) so the line flows instead of kinking through every point.
	const areaCurve = $derived(smooth ? curveCardinal.tension(0.65) : undefined);
	const lineCurve = $derived(smooth ? curveBasis : undefined);
	const yMax = $derived(yKey ? Math.max(0, ...data.map((d) => Number(d[yKey] ?? 0))) : 0);
	const arcValue = $derived(gaugeValue ?? (typeof value === "number" ? value : 0));
	// WHY: one prop drives both ends. The stroke ramp is half the fill's so the

	// line still spans nearly the full width (8% fill fade -> the 4% stroke fade this card has always used) instead of reading as side padding.
	const fade = $derived(resolveEdgeFade(edgeFade));
	const strokePct = $derived(Math.round(fade * 50 * 1000) / 1000);
	const strokeStop = $derived(`${strokePct}%`);
	const strokeEnd = $derived(`${100 - strokePct}%`);
	const fadeMask = $derived(fade > 0 ? `url(#${uid}-fade)` : undefined);
</script>

<!-- =========================== -->
<!-- STAT CARD -->
<!-- =========================== -->
<div
	class="hr-stat-card {className ?? ''}"
	class:hr-stat-figure-only={figureOnly}
	class:hr-stat-has-gauge={variant === "gauge"}
>
	{#if variant === "gauge"}
		<div class="hr-stat-gauge-row">
			{#if label != null || value != null || caption != null}
				<Figure
					{icon}
					title={label}
					{value}
					{delta}
					{trend}
					{caption}
					size="lg"
					format={formatValue}
					class="hr-stat-gauge-figure"
				/>
			{/if}
			<GaugeChart
				value={arcValue}
				{color}
				size={116}
				minWidth={0}
				suffix="%"
				showValue
				defaultLabel={gaugeLabel ?? ""}
				ariaLabel={label}
			/>
		</div>
	{:else}
		{#if !figureOnly && (label != null || value != null || caption != null)}
			<Figure
				{icon}
				title={label}
				{value}
				{delta}
				{trend}
				{caption}
				size="lg"
				format={formatValue}
			/>
		{/if}

		<div
			class="hr-stat-chart"
			style:height="{height}px"
			role="img"
			aria-label="{label ?? 'Value'} trend"
		>
			{#if data.length > 0 && xKey && yKey}
				{#if variant === "bar"}
					<Chart
						{data}
						x={xKey}
						xScale={scaleBand().padding(0.28)}
						y={yKey}
						yDomain={[0, yMax || 1]}
						padding={{ top: 6, bottom: 0, left: 0, right: 0 }}
						tooltipContext={{ mode: "band" }}
					>
						<Svg>
							<Bars rounded="top" radius={2} style="fill: {color}" class="hr-stat-bars" />
							<Highlight
								bar={{ rounded: "top", radius: 2, fill: color, class: "hr-stat-bar-active" }}
							/>
						</Svg>
						<Tooltip.Root>
							{#snippet children({ data: d })}
								<Tooltip.Header value={xKey ? formatX(d[xKey]) : ""} />
								<Tooltip.List>
									<Tooltip.Item label={String(yKey)} value={formatValue(Number(d[yKey]))} />
								</Tooltip.List>
							{/snippet}
						</Tooltip.Root>
					</Chart>
				{:else}
					<Chart
						{data}
						x={xKey}
						y={yKey}
						padding={{ top: 8, bottom: 0, left: 0, right: 0 }}
						tooltipContext={{ mode: "quadtree-x" }}
					>
						<Svg>
							<!-- WHY: bklit fades the stroke to transparent at both ends via a
						     horizontal gradient applied as the stroke paint; shared by the area
						     and line variants. -->
							<LinearGradient id="{uid}-stroke">
								{#snippet stopsContent()}
									<stop offset="0%" stop-color={color} stop-opacity={fade > 0 ? 0 : 1} />
									<stop offset={strokeStop} stop-color={color} stop-opacity="1" />
									<stop offset={strokeEnd} stop-color={color} stop-opacity="1" />
									<stop offset="100%" stop-color={color} stop-opacity={fade > 0 ? 0 : 1} />
								{/snippet}
							</LinearGradient>
							{#if fade > 0}
								<EdgeFade id="{uid}-fade" amount={fade} />
							{/if}
							<Crosshair id="{uid}-cross" />
							<Reveal bleed={3}>
								{#if variant === "area"}
									<LinearGradient id={uid} vertical>
										{#snippet stopsContent()}
											<stop offset="0%" stop-color={color} stop-opacity="0.45" />
											<stop offset="100%" stop-color={color} stop-opacity="0" />
										{/snippet}
									</LinearGradient>
									<Area
										y1={yKey}
										curve={areaCurve}
										fill="url(#{uid})"
										mask={fadeMask}
										line={false}
									/>
								{/if}
								<Spline
									y={yKey}
									curve={variant === "line" ? lineCurve : areaCurve}
									stroke="url(#{uid}-stroke)"
									fill="none"
									stroke-width={variant === "line" ? 2.5 : 2}
									stroke-linecap="round"
									class="hr-stat-spline"
								/>
							</Reveal>
							<!-- WHY: the crosshair line (not just the point dot) makes hover targeting legible on the edge-to-edge chart; quadtree-x snaps to the nearest -->
							<!-- point by cursor x (bisect-x mis-tracks a categorical x-axis), but without -->
							<!-- the line the selected point is easy to miss. Matches AreaChart's highlight. points fill is forced to the series color (else it -->
							<!-- falls back to layerchart's blue --color-primary); motion="none" drops the spring so the dot tracks the cursor instantly instead of lagging behind. -->
							<Highlight
								points={{ fill: color }}
								lines={{ style: `stroke: url(#${uid}-cross)` }}
								motion="none"
							/>
						</Svg>
						<Tooltip.Root>
							{#snippet children({ data: d })}
								<Tooltip.Header value={xKey ? formatX(d[xKey]) : ""} />
								<Tooltip.List>
									<Tooltip.Item label={String(yKey)} value={formatValue(Number(d[yKey]))} />
								</Tooltip.List>
							{/snippet}
						</Tooltip.Root>
					</Chart>
				{/if}
			{/if}
		</div>
	{/if}
</div>
