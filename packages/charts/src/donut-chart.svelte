<script lang="ts" generics="TData extends Record<string, unknown>">
	// =========================
	// IMPORTS
	// =========================
	import "./donut-chart.css";
	import { Arc, Chart, Group, Pie, Svg, Text } from "layerchart";
	import { scaleOrdinal } from "d3-scale";
	import { expoInOut } from "svelte/easing";
	import { prefersReducedMotion, Tween } from "svelte/motion";
	import { REVEAL_MS } from "./motion.js";

	// =========================
	// TYPES
	// =========================
	type Props = {
		data: TData[];
		valueKey: keyof TData & string;
		labelKey: keyof TData & string;
		colorKey?: keyof TData & string;
		height?: number;
		innerRadius?: number;
		outerRadius?: number;
		/** Center label shown when nothing is hovered */
		centerLabel?: string;
		/** Format the center value */
		formatValue?: (v: number) => string;
		class?: string;
	};

	// =========================
	// PROPS
	// =========================
	let {
		data,
		valueKey,
		labelKey,
		colorKey,
		height = 240,
		innerRadius = 60,
		outerRadius = 100,
		centerLabel,
		formatValue = (v) => v.toLocaleString(),
		class: className,
	}: Props = $props();

	// =========================
	// STATE
	// =========================
	let hovered = $state<string | null>(null);
	// Milliseconds into the entrance; each slice sweeps on its own offset.
	const clock = new Tween(0);
	let swept = $state(false);
	let started = false;

	// =========================
	// FUNCTIONS
	// =========================
	const SLICE_DELAY = 100;
	const SLICE_STEP = 80;
	const HOVER_OFFSET = 6;

	function sweep(i: number): number {
		if (swept) return 1;
		const t = (clock.current - SLICE_DELAY - i * SLICE_STEP) / REVEAL_MS;
		return expoInOut(Math.min(1, Math.max(0, t)));
	}

	// =========================
	// EFFECTS
	// =========================
	$effect(() => {
		if (started || filtered.length === 0) return;
		started = true;
		const end = SLICE_DELAY + (filtered.length - 1) * SLICE_STEP + REVEAL_MS;
		const duration = prefersReducedMotion.current ? 0 : end;
		clock.set(end, { duration }).then(() => (swept = true));
	});

	// =========================
	// DERIVED
	// =========================
	const filtered = $derived(data.filter((d) => Number(d[valueKey] ?? 0) > 0));
	const total = $derived(filtered.reduce((sum, d) => sum + Number(d[valueKey] ?? 0), 0));
	const idAccessor = $derived((d: TData) => String(d[labelKey] ?? ""));
	const colorRange = $derived(colorKey ? filtered.map((d) => String(d[colorKey] ?? "")) : []);
	const colorDomain = $derived(filtered.map(idAccessor));
	const hoveredItem = $derived(filtered.find((d) => idAccessor(d) === hovered) ?? null);
</script>

<!-- =========================== -->
<!-- DONUT CHART -->
<!-- =========================== -->
<div
	class="hr-donut-chart {className ?? ''}"
	style:height="{height}px"
	role="img"
	aria-label="{centerLabel ?? 'Donut chart'}: {formatValue(total)} total"
>
	{#if filtered.length === 0}
		<div class="empty">
			<p>No data</p>
		</div>
	{:else}
		<Chart
			data={filtered}
			x={valueKey}
			c={colorKey ? idAccessor : undefined}
			cScale={scaleOrdinal()}
			cDomain={colorDomain}
			cRange={colorRange}
		>
			<Svg>
				<Group center>
					<Pie {innerRadius} {outerRadius} cornerRadius={3} padAngle={0.02} sort={null}>
						{#snippet children({ arcs })}
							{#each arcs as arc, i (i)}
								{@const id = idAccessor(arc.data as TData)}
								{@const isHovered = hovered === id}
								{@const dimmed = hovered !== null && !isHovered}
								{@const mid = (arc.startAngle + arc.endAngle) / 2}
								{@const dx = isHovered ? Math.sin(mid) * HOVER_OFFSET : 0}
								{@const dy = isHovered ? -Math.cos(mid) * HOVER_OFFSET : 0}
								<Arc
									startAngle={arc.startAngle}
									endAngle={arc.startAngle + (arc.endAngle - arc.startAngle) * sweep(i)}
									padAngle={arc.padAngle}
									{innerRadius}
									{outerRadius}
									cornerRadius={3}
									fill={colorKey
										? String((arc.data as TData)[colorKey])
										: `var(--chart-${(i % 5) + 1})`}
									class="hr-donut-arc"
									data-hovered={isHovered ? "" : undefined}
									style="opacity: {dimmed ? 0.4 : 1}; translate: {dx}px {dy}px"
									onmouseenter={() => (hovered = id)}
									onmouseleave={() => (hovered = null)}
								/>
							{/each}
						{/snippet}
					</Pie>
					<Text
						value={hoveredItem ? formatValue(Number(hoveredItem[valueKey])) : formatValue(total)}
						textAnchor="middle"
						dy={-4}
						class="hr-donut-center-value"
					/>
					<Text
						value={hoveredItem ? String(hoveredItem[labelKey]) : (centerLabel ?? "Total")}
						textAnchor="middle"
						dy={14}
						class="hr-donut-center-label"
					/>
				</Group>
			</Svg>
		</Chart>
	{/if}
</div>
