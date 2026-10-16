<script lang="ts" generics="TData extends Record<string, unknown>">
	// =========================
	// IMPORTS
	// =========================
	import "./sparkline.css";
	import { Area, Chart, Highlight, LinearGradient, Points, Spline, Svg, Tooltip } from "layerchart";
	import { curveMonotoneX } from "d3-shape";
	import Reveal from "./reveal.svelte";

	// =========================
	// TYPES
	// =========================
	type Props = {
		data: TData[];
		xKey: keyof TData & string;
		yKey: keyof TData & string;
		color?: string;
		height?: number;
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
		class?: string;
	};

	// =========================
	// PROPS
	// =========================
	let {
		data,
		xKey,
		yKey,
		color = "var(--chart-1)",
		height = 44,
		smooth = true,
		endCap = true,
		showLast = false,
		bare = false,
		formatValue = (v) => v.toLocaleString(),
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
		return String(d[xKey]);
	}

	// =========================
	// DERIVED
	// =========================
	const uid = `hr-spark-${Math.random().toString(36).slice(2, 8)}`;
	const curve = $derived(smooth ? curveMonotoneX : undefined);
	const last = $derived(data.length > 0 ? data[data.length - 1] : null);
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
<div
	class="hr-sparkline {className ?? ''}"
	role={bare ? undefined : "img"}
	aria-label={bare ? undefined : "Sparkline"}
	aria-hidden={bare ? "true" : undefined}
	data-bare={bare ? "" : undefined}
	onpointerleave={() => (active = null)}
>
	{#if data.length > 0}
		<div class="hr-sparkline-chart" style:height="{height}px">
			<Chart {data} x={xKey} y={yKey} {padding} tooltipContext={{ mode: "bisect-x" }}>
				<Svg>
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
								<Tooltip.Item label={String(yKey)} value={formatValue(Number(d[yKey]))} />
							</Tooltip.List>
						{/snippet}
					</Tooltip.Root>
				{/if}
			</Chart>
		</div>
		{#if showLast && display}
			<span class="hr-sparkline-value" style:color>
				{formatValue(Number(display[yKey]))}
			</span>
		{/if}
	{/if}
</div>
