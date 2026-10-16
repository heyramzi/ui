<script lang="ts" generics="TData extends Record<string, unknown>">
	// =========================
	// IMPORTS
	// =========================
	import "#src/charts/bar-chart.css";
	import { Axis, Bars, Chart, Highlight, Svg, Tooltip } from "layerchart";
	import { scaleBand } from "d3-scale";
	import Figure from "#src/charts/figure.svelte";
	import { TOOLTIP_GAP, TOOLTIP_TOP } from "#src/charts/motion.js";

	// =========================
	// TYPES
	// =========================
	type Series = { key: keyof TData & string; label: string; color: string };

	type Props = {
		data: TData[];
		xKey: keyof TData & string;
		/** The bar's value. Required unless `series` is set. */
		yKey?: keyof TData & string;
		/** Stacks these keys into one bar per row; the bar's value is their sum. */
		series?: Series[];
		color?: string;
		/** A fill per bar, for bands whose meaning changes along the axis. */
		colorOf?: (d: TData) => string;
		/** Body height in px, or "fill" to grow to the parent's height (parent must
		 * be a flex column that gives the chart a determinate height). Default 240. */
		height?: number | "fill";
		orientation?: "vertical" | "horizontal";
		/** Left padding for horizontal charts (label space). Default 80. */
		leftPadding?: number;
		formatValue?: (v: number) => string;
		formatX?: (v: unknown) => string;
		/** Axis tick label. Return "" to skip a tick. Defaults to formatX. */
		formatTick?: (v: unknown) => string;
		/** Screen-reader summary; also renders an sr-only data table when set. */
		label?: string;
		/** Column header for the x values in the sr-only table. */
		xLabel?: string;
		/** Column header for the y values in the sr-only table, and the tooltip's label. */
		yLabel?: string;
		/** Show the value/label figure above the chart. */
		showFigure?: boolean;
		class?: string;
	};

	// =========================
	// PROPS
	// =========================
	let {
		data,
		xKey,
		yKey,
		series,
		color = "var(--chart-1)",
		colorOf,
		height = 240,
		orientation = "vertical",
		leftPadding = 80,
		formatValue = (v) => v.toLocaleString(),
		formatX = (v) => String(v),
		formatTick,
		label,
		xLabel,
		yLabel,
		showFigure = true,
		class: className,
	}: Props = $props();

	// =========================
	// STATE
	// =========================
	let active = $state<TData | null>(null);

	// ========================= FUNCTIONS ========================= WHY: called from the tooltip header's value expression so it re-runs on every active-band change; an unread {@const} side effect only evaluates once.

	// The microtask defers the state write out of template evaluation.
	function trackActive(d: TData): string {
		queueMicrotask(() => {
			active = d;
		});
		return formatX(d[xKey]);
	}

	function valueOf(d: TData): number {
		if (series) return series.reduce((sum, s) => sum + Number(d[s.key] ?? 0), 0);
		return Number(yKey ? (d[yKey] ?? 0) : 0);
	}

	/** Where one series' segment starts and ends inside its stacked bar. */
	function span(d: TData, key: string): [number, number] {
		let at = 0;
		for (const s of series ?? []) {
			const next = at + Number(d[s.key] ?? 0);
			if (s.key === key) return [at, next];
			at = next;
		}
		return [0, 0];
	}

	// =========================
	// DERIVED
	// =========================
	const yMax = $derived(Math.max(0, ...data.map(valueOf)));
	const total = $derived(data.reduce((sum, d) => sum + valueOf(d), 0));
	const valueLabel = $derived(yLabel ?? String(yKey ?? "value"));
	const fill = $derived(height === "fill");
	const horizontal = $derived(orientation === "horizontal");
	const radius = $derived(horizontal ? "right" : "top");
	// One Bars layer per fill: a stacked series, a colorOf group, or the single color.
	const layers = $derived.by(() => {
		if (series) {
			return series.map((s) => ({
				key: s.key,
				color: s.color,
				rows: data,
				at: (d: TData) => span(d, s.key),
			}));
		}
		const groups = new Map<string, TData[]>();
		for (const d of data) {
			const c = colorOf?.(d) ?? color;
			groups.set(c, [...(groups.get(c) ?? []), d]);
		}
		return [...groups].map(([c, rows]) => ({ key: c, color: c, rows, at: undefined }));
	});
	const activeColor = $derived(active && colorOf ? colorOf(active) : color);
</script>

<!-- =========================== -->
<!-- BAR CHART -->
<!-- =========================== -->
<div
	class="hr-bar-chart {className ?? ''}"
	class:hr-bar-horizontal={horizontal}
	class:hr-bar-fill={fill}
	class:hr-bar-has-active={active !== null && !series}
	role="img"
	aria-label={label ?? "Bar chart"}
	onpointerleave={() => (active = null)}
>
	{#if showFigure}
		<Figure
			value={active ? valueOf(active) : total}
			color="var(--chart-1)"
			eyebrow={active ? formatX(active[xKey]) : "Total"}
			format={formatValue}
			size="md"
		/>
	{/if}

	<div class="hr-chart-body" style:height={fill ? null : `${height}px`}>
		{#if data.length === 0}
			<div class="empty"><p>No data</p></div>
		{:else}
			<Chart
				{data}
				x={horizontal ? valueOf : xKey}
				y={horizontal ? xKey : valueOf}
				xScale={horizontal ? undefined : scaleBand().padding(0.3)}
				yScale={horizontal ? scaleBand().padding(0.3) : undefined}
				xDomain={horizontal ? [0, yMax || 1] : undefined}
				yDomain={horizontal ? undefined : [0, yMax || 1]}
				xNice={horizontal}
				yNice={!horizontal}
				padding={{ left: horizontal ? leftPadding : 48, bottom: 28, top: 8, right: 12 }}
				tooltipContext={{ mode: "band" }}
			>
				<Svg>
					{#if horizontal}
						<Axis placement="left" format={(v) => (formatTick ?? formatX)(v)} />
						<Axis placement="bottom" format={(v) => formatValue(Number(v))} ticks={4} />
						<g class="hr-bar-grid">
							<Axis placement="bottom" grid rule={false} ticks={4} format={() => ""} />
						</g>
					{:else}
						<Axis placement="left" format={(v) => formatValue(Number(v))} ticks={4} />
						<Axis placement="bottom" format={(v) => (formatTick ?? formatX)(v)} />
						<g class="hr-bar-grid">
							<Axis placement="left" grid rule={false} ticks={4} format={() => ""} />
						</g>
					{/if}
					{#each layers as layer (layer.key)}
						{#if layer.at && horizontal}
							<Bars x={layer.at} style="fill: {layer.color}" class="hr-bar-bars" />
						{:else if layer.at}
							<Bars y={layer.at} style="fill: {layer.color}" class="hr-bar-bars" />
						{:else}
							<Bars
								data={layer.rows}
								rounded={radius}
								radius={4}
								style="fill: {layer.color}"
								class="hr-bar-bars"
							/>
						{/if}
					{/each}
					<!-- WHY: the band tooltip layer eats pointer events, so bar :hover never
				     fires. The active bar is a Highlight copy; motion "none" keeps it from
				     sliding between bands. -->
					{#if !series}
						<Highlight
							motion="none"
							bar={{ rounded: radius, radius: 4, fill: activeColor, class: "hr-bar-active" }}
						/>
					{/if}
				</Svg>
				<Tooltip.Root
					x={horizontal ? "pointer" : "data"}
					y={horizontal ? "data" : TOOLTIP_TOP}
					xOffset={TOOLTIP_GAP}
				>
					{#snippet children({ data: d })}
						<Tooltip.Header value={trackActive(d as TData)} />
						<Tooltip.List>
							{#if series}
								{#each series as s (s.key)}
									<Tooltip.Item
										label={s.label}
										value={formatValue(Number(d[s.key] ?? 0))}
										color={s.color}
									/>
								{/each}
							{:else}
								<Tooltip.Item
									label={valueLabel}
									value={formatValue(valueOf(d as TData))}
									color={colorOf ? colorOf(d as TData) : color}
								/>
							{/if}
						</Tooltip.List>
					{/snippet}
				</Tooltip.Root>
			</Chart>
		{/if}
	</div>

	{#if label && data.length > 0}
		<table class="hr-sr-only">
			<caption>{label}</caption>
			<thead>
				<tr>
					<th scope="col">{xLabel}</th>
					{#if series}
						{#each series as s (s.key)}
							<th scope="col">{s.label}</th>
						{/each}
					{:else}
						<th scope="col">{yLabel}</th>
					{/if}
				</tr>
			</thead>
			<tbody>
				{#each data as d, i (i)}
					<tr>
						<th scope="row">{formatX(d[xKey])}</th>
						{#if series}
							{#each series as s (s.key)}
								<td>{formatValue(Number(d[s.key] ?? 0))}</td>
							{/each}
						{:else}
							<td>{formatValue(valueOf(d))}</td>
						{/if}
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>
