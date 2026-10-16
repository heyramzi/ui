<!-- ========================== -->
<!-- IMPORTS                    -->
<!-- ========================== -->
<script lang="ts">
	import {
		AreaChart,
		BarChart,
		DonutChart,
		GaugeChart,
		Legend,
		LineChart,
		NumberChart,
		RingChart,
		Sparkline,
		StatCard,
	} from "#src/charts/index.js";
	import ShowcaseStage from "#src/showcase/ShowcaseStage.svelte";
	import ShowcaseVariant from "#src/showcase/ShowcaseVariant.svelte";

	// =========================
	// STATE
	// =========================
	const monthly = [
		{ month: "Jan", revenue: 4200, costs: 2800 },
		{ month: "Feb", revenue: 5100, costs: 3100 },
		{ month: "Mar", revenue: 4800, costs: 2950 },
		{ month: "Apr", revenue: 6200, costs: 3400 },
		{ month: "May", revenue: 7100, costs: 3600 },
		{ month: "Jun", revenue: 6800, costs: 3500 },
	];

	const distribution = [
		{ label: "Search", users: 420, color: "var(--chart-1)" },
		{ label: "Direct", users: 310, color: "var(--chart-2)" },
		{ label: "Social", users: 180, color: "var(--chart-3)" },
		{ label: "Email", users: 90, color: "var(--chart-4)" },
	];

	const channels = [
		{ label: "Organic", value: 4250, maxValue: 5000, color: "var(--chart-1)" },
		{ label: "Paid", value: 3120, maxValue: 5000, color: "var(--chart-2)" },
		{ label: "Email", value: 2100, maxValue: 5000, color: "var(--chart-3)" },
		{ label: "Social", value: 1580, maxValue: 5000, color: "var(--chart-4)" },
	];
	let ringHover = $state<number | null>(null);

	const sparkSeries = Array.from({ length: 24 }, (_, i) => ({
		i,
		v: 50 + Math.sin(i / 2) * 20 + Math.random() * 10,
	}));

	// Rising 12-month series for the stat-card hero (bklit-style).
	const revenueTrend = [
		{ month: "Jan", revenue: 4700 },
		{ month: "Feb", revenue: 5200 },
		{ month: "Mar", revenue: 4950 },
		{ month: "Apr", revenue: 4780 },
		{ month: "May", revenue: 5600 },
		{ month: "Jun", revenue: 6100 },
		{ month: "Jul", revenue: 5900 },
		{ month: "Aug", revenue: 6400 },
		{ month: "Sep", revenue: 7200 },
		{ month: "Oct", revenue: 6950 },
		{ month: "Nov", revenue: 7600 },
		{ month: "Dec", revenue: 8200 },
	];

	// Smooth, gently rising session series for the line stat card (no noise so
	// curveBasis reads as flowing waves rather than spikes).
	const sessions = Array.from({ length: 16 }, (_, i) => ({
		i,
		v: 1080 + Math.sin(i / 2.1) * 110 + i * 16,
	}));
</script>

<!-- ========================== -->
<!-- MARKUP                     -->
<!-- ========================== -->
<header class="group-head">
	<h2 class="group-title">Charts</h2>
	<p class="group-note">Visualisation primitives. Drop into any layout.</p>
</header>
<div class="grid">
	<ShowcaseStage
		title="BarChart"
		note="single series, vertical"
		importPath={"import { BarChart } from '@heyramzi/ui/charts';"}
	>
		<div class="full">
			<BarChart data={monthly} xKey="month" yKey="revenue" color="var(--chart-1)" />
		</div>
	</ShowcaseStage>

	<ShowcaseStage
		title="AreaChart"
		note="multi-series stacked, distinct colors"
		importPath={"import { AreaChart } from '@heyramzi/ui/charts';"}
	>
		<div class="full">
			<AreaChart
				data={monthly}
				xKey="month"
				series={[
					{ key: "revenue", label: "Revenue", color: "var(--chart-1)" },
					{ key: "costs", label: "Costs", color: "var(--chart-2)" },
				]}
				stacked
			/>
		</div>
	</ShowcaseStage>

	<ShowcaseStage
		title="LineChart"
		note="gradient fill, point markers, dashed in-progress tail"
		importPath={"import { LineChart } from '@heyramzi/ui/charts';"}
	>
		<div class="full">
			<LineChart
				data={monthly}
				xKey="month"
				yKey="revenue"
				color="var(--chart-1)"
				showMarkers
				dashFromIndex={4}
			/>
		</div>
	</ShowcaseStage>

	<ShowcaseStage
		title="DonutChart"
		note="explicit colors per slice"
		importPath={"import { DonutChart } from '@heyramzi/ui/charts';"}
	>
		<div class="full">
			<DonutChart data={distribution} valueKey="users" labelKey="label" colorKey="color" />
		</div>
	</ShowcaseStage>

	<ShowcaseStage
		title="GaugeChart"
		note="notched radial meter, count-up center value, format options"
		importPath={"import { GaugeChart } from '@heyramzi/ui/charts';"}
	>
		<div class="gauge">
			<GaugeChart
				value={66}
				centerValue={428000}
				defaultLabel="ARR run rate"
				formatOptions={{ style: "currency", currency: "USD", notation: "compact" }}
			/>
		</div>
	</ShowcaseStage>

	<ShowcaseStage
		title="RingChart + Legend"
		note="concentric progress rings, hover-synced legend with progress bars"
		importPath={"import { RingChart, Legend } from '@heyramzi/ui/charts';"}
	>
		<div class="ring-row">
			<div class="ring-slot">
				<RingChart data={channels} bind:hoveredIndex={ringHover} defaultLabel="Sessions" />
			</div>
			<Legend items={channels} bind:hoveredIndex={ringHover} showProgress showPercentage />
		</div>
	</ShowcaseStage>

	<ShowcaseStage
		title="Legend"
		note="standalone: progress bars, percentages, hover-dim, keyboard focus"
		importPath={"import { Legend } from '@heyramzi/ui/charts';"}
	>
		<div class="full">
			<Legend title="Traffic by channel" items={channels} showProgress showPercentage />
		</div>
	</ShowcaseStage>

	<ShowcaseStage
		title="Sparkline"
		note="a trendline the width of whatever holds it"
		importPath={"import { Sparkline } from '@heyramzi/ui/charts';"}
	>
		<ShowcaseVariant label="showLast: end-cap dot and inline value">
			<div class="full">
				<Sparkline data={sparkSeries} xKey="i" yKey="v" color="var(--chart-1)" showLast />
			</div>
		</ShowcaseVariant>
		<ShowcaseVariant label="bare: no chrome, for the foot of a card that links">
			<div class="full">
				<Sparkline data={sparkSeries} xKey="i" yKey="v" color="var(--chart-1)" height={48} bare />
			</div>
		</ShowcaseVariant>
	</ShowcaseStage>

	<ShowcaseStage title="Chart tokens" note="Theme charts globally with five CSS custom properties">
		<!-- WHY the name sits beside the colour and not on it: five arbitrary palette entries cannot all carry legible text, and a fixed near-black label read -->
		<!-- 2.9:1 on --chart-1. A chip plus a label on the ground is AA whatever the token is set to, which is the point of a token showcase. -->
		<div class="swatches">
			{#each [1, 2, 3, 4, 5] as n (n)}
				<div class="swatch">
					<span class="swatch-chip" style="background: var(--chart-{n})"></span>
					<span class="swatch-name">--chart-{n}</span>
				</div>
			{/each}
		</div>
	</ShowcaseStage>
</div>

<header class="group-head">
	<h2 class="group-title">Cards</h2>
	<p class="group-note">
		Composed KPI blocks: one figure on its own, or a Figure (label, value, trend) over a chart, on a
		card.
	</p>
</header>
<div class="grid">
	<ShowcaseStage
		title="NumberChart"
		note="a figure on its own, with or without a scale under it"
		importPath={"import { NumberChart } from '@heyramzi/ui/charts';"}
	>
		<ShowcaseVariant label="size=lg: count-up, direction-aware delta">
			<div class="full">
				<NumberChart
					label="Total cash"
					value={128400}
					delta={6.1}
					direction="up-good"
					size="lg"
					caption="across 4 accounts"
					formatOptions={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
				/>
			</div>
		</ShowcaseVariant>
		<ShowcaseVariant label="share: the scale a lone number cannot carry">
			<div class="full">
				<NumberChart
					label="Expenses"
					value={41250}
					delta={-3.4}
					direction="down-good"
					share={0.38}
					shareLabel="of revenue"
					color="var(--chart-4)"
					formatOptions={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
				/>
			</div>
		</ShowcaseVariant>
		<ShowcaseVariant label="bare: no chrome, for a figure inside a band or a panel">
			<div class="full">
				<NumberChart
					bare
					label="Net income"
					value={67150}
					delta={0.2}
					direction="up-good"
					share={0.62}
					shareLabel="of revenue"
					color="var(--chart-2)"
					formatOptions={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
				/>
			</div>
		</ShowcaseVariant>
	</ShowcaseStage>

	<ShowcaseStage
		title="StatCard"
		note="a Figure over a chart, on a card: three chart kinds"
		importPath={"import { StatCard } from '@heyramzi/ui/charts';"}
	>
		<ShowcaseVariant label="variant=area: edge-to-edge chart, trend pill, count-up value">
			<div class="full">
				<StatCard
					label="Total Revenue"
					value={8200}
					delta={12.4}
					caption="Avg"
					data={revenueTrend}
					xKey="month"
					yKey="revenue"
					variant="area"
					formatValue={(v) =>
						v.toLocaleString("en-US", {
							style: "currency",
							currency: "USD",
							maximumFractionDigits: 0,
						})}
				/>
			</div>
		</ShowcaseVariant>
		<ShowcaseVariant label="variant=line: denser series">
			<div class="full">
				<StatCard
					label="Active sessions"
					value={1344}
					delta={8.2}
					caption="Avg"
					data={sessions}
					xKey="i"
					yKey="v"
					variant="line"
					color="var(--chart-3)"
				/>
			</div>
		</ShowcaseVariant>
		<ShowcaseVariant label="variant=bar: negative trend, down state">
			<div class="full">
				<StatCard
					label="Refunds"
					value={3500}
					delta={-2.8}
					caption="vs last month"
					data={monthly}
					xKey="month"
					yKey="costs"
					variant="bar"
					color="var(--chart-4)"
					formatValue={(v) =>
						v.toLocaleString("en-US", {
							style: "currency",
							currency: "USD",
							maximumFractionDigits: 0,
						})}
				/>
			</div>
		</ShowcaseVariant>
	</ShowcaseStage>

	<!-- The other two forms drop half the card, so they read together and not as
	     the tail of a row of three charts. -->
	<ShowcaseStage
		title="StatCard"
		note="the two forms that drop half the card"
		importPath={"import { StatCard } from '@heyramzi/ui/charts';"}
	>
		<ShowcaseVariant label="variant=gauge: figure left, radial gauge right">
			<div class="full">
				<StatCard
					variant="gauge"
					label="Deliverables"
					caption="2 of 6 complete"
					gaugeValue={33}
					delta={5}
					color="var(--chart-1)"
				/>
			</div>
		</ShowcaseVariant>
		<ShowcaseVariant label="figureOnly: the bare edge-to-edge chart, no labels">
			<div class="full">
				<StatCard
					figureOnly
					data={revenueTrend}
					xKey="month"
					yKey="revenue"
					variant="area"
					height={170}
				/>
			</div>
		</ShowcaseVariant>
	</ShowcaseStage>
</div>

<!-- ========================== -->
<!-- STYLE                      -->
<!-- ========================== -->
<style>
	.group-head {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
	/* WHY: the second group ("Cards") needs breathing room from the grid above it. */
	.group-head:not(:first-child) {
		margin-top: 2.5rem;
	}
	.group-title {
		font-size: 1.125rem;
		font-weight: 600;
		letter-spacing: -0.01em;
		margin: 0 0 0.125rem;
	}
	.group-note {
		margin: 0 0 1rem;
		font-size: 0.8125rem;
		color: var(--muted-foreground);
	}
	/* One demo per row, the rule ShowcaseSection states for `.sc-stack`. A
	   quarter-width column is also what squeezed the gauge card's title into
	   its trend pill. */
	.grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		column-gap: 1rem;
		row-gap: 0;
	}

	/*
	 * Every card in a band starts and ends on the same line. The stage's header and its ground are two tracks of this grid, so a two-line title no longer
	 */

	/*
	 * pushes its own card down past its neighbour's. Row gap is zero because the stage's own padding-block already separates the bands, and a subgrid
	 */

	/*
	 * inherits the parent's gutters into the tracks it spans.
	 */
	.grid > :global(.sc-stage) {
		display: grid;
		grid-template-rows: subgrid;
		grid-row: span 2;
	}

	.full {
		width: 100%;
	}
	.gauge {
		display: flex;
		justify-content: center;
		width: 100%;
	}
	.gauge :global(.hr-gauge) {
		max-width: 240px;
	}
	.ring-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1.25rem 1.5rem;
	}
	.ring-slot {
		flex: 0 0 auto;
		width: 180px;
	}
	.ring-row :global(.hr-legend) {
		flex: 1 1 160px;
	}
	.swatches {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		width: 100%;
	}
	.swatch {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		font-size: 0.75rem;
		font-family: ui-monospace, SFMono-Regular, monospace;
		color: var(--foreground);
	}
	.swatch-chip {
		width: 2.5rem;
		height: 1.25rem;
		flex: none;
		border-radius: 0.375rem;
		box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--border) 65%, transparent);
	}
</style>
