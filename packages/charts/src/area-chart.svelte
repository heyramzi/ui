<script lang="ts" generics="TData extends Record<string, unknown>">
	// =========================
	// IMPORTS
	// =========================
	import "#src/area-chart.css";
	import { Area, Axis, Chart, Highlight, LinearGradient, Spline, Svg, Tooltip } from "layerchart";
	import { curveMonotoneX } from "d3-shape";
	import Crosshair from "#src/crosshair.svelte";
	import EdgeFade from "#src/edge-fade.svelte";
	import { resolveEdgeFade } from "#src/edge-fade.js";
	import Figure from "#src/figure.svelte";
	import HoverFocus from "#src/hover-focus.svelte";
	import { DOMAIN_MOTION, TOOLTIP_GAP, TOOLTIP_TOP } from "#src/motion.js";
	import Reveal from "#src/reveal.svelte";

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
		class?: string;
	};

	// =========================
	// PROPS
	// =========================
	let {
		data,
		xKey,
		yKey,
		series: seriesInput,
		color = "var(--chart-1)",
		height = 240,
		stacked = false,
		smooth = true,
		edgeFade = true,
		formatValue = (v) => v.toLocaleString(),
		formatX = (v) => String(v),
		xTicks = 6,
		class: className,
	}: Props = $props();

	// =========================
	// STATE
	// =========================
	let active = $state<TData | null>(null);

	// ========================= FUNCTIONS ========================= WHY: called from the tooltip header's value expression so it re-runs on every active-point change; an unread {@const} side effect only evaluates once.

	// The microtask defers the state write out of template evaluation.
	function trackActive(d: TData): string {
		queueMicrotask(() => {
			active = d;
		});
		return formatX(d[xKey]);
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
					color: s.color ?? `var(--chart-${(i % 5) + 1})`,
				}))
			: yKey
				? [{ key: yKey, label: yKey, color }]
				: [],
	);
	const yMax = $derived.by(() => {
		if (stacked) {
			return Math.max(0, ...data.map((d) => series.reduce((s, k) => s + Number(d[k.key] ?? 0), 0)));
		}
		return Math.max(0, ...data.flatMap((d) => series.map((s) => Number(d[s.key] ?? 0))));
	});
	const curve = $derived(smooth ? curveMonotoneX : undefined);
	const fade = $derived(resolveEdgeFade(edgeFade));
	const fadeMask = $derived(fade > 0 ? `url(#${uid}-fade)` : undefined);
	const fallback = $derived(data.length > 0 ? data[data.length - 1] : null);
	const display = $derived(active ?? fallback);
	const figureRows = $derived(
		display
			? series.map((s) => ({ value: Number(display[s.key]), label: s.label, color: s.color }))
			: null,
	);
</script>

<!-- =========================== -->
<!-- AREA CHART -->
<!-- =========================== -->
<div
	class="hr-area-chart {className ?? ''}"
	role="img"
	aria-label="Area chart"
	onpointerleave={() => (active = null)}
>
	{#if figureRows && display}
		<Figure series={figureRows} eyebrow={formatX(display[xKey])} format={formatValue} size="md" />
	{:else}
		<Figure value="—" eyebrow="Latest" size="md" />
	{/if}

	<div class="hr-chart-body" style:height="{height}px">
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
				tooltipContext={{ mode: "quadtree-x" }}
				motion={DOMAIN_MOTION}
			>
				<Svg>
					<Axis placement="left" format={(v) => formatValue(Number(v))} ticks={4} />
					<Axis placement="bottom" format={(v) => formatX(v)} ticks={xTicks} />
					<g class="hr-area-grid">
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
										<stop offset="0%" stop-color={s.color} stop-opacity="0.45" />
										<stop offset="100%" stop-color={s.color} stop-opacity="0.04" />
									{/snippet}
								</LinearGradient>
								<!-- WHY `y1` and not `y`: layerchart's Area has no `y` prop, so every
							     series drew the first series' shape and the gradients stacked on
							     one path. See `Area.shared.svelte.js`. -->
								<Area y1={s.key} {curve} fill="url(#{uid}-{i})" mask={fadeMask} />
								<Spline y={s.key} {curve} style="stroke: {s.color}; fill: none" stroke-width="2" />
							{/each}
						</Reveal>
						{#snippet segment()}
							{#each series as s (s.key)}
								<Spline y={s.key} {curve} style="stroke: {s.color}; fill: none" stroke-width="2" />
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
	</div>
</div>
