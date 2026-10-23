<script lang="ts">
	import {
		GaugeChart,
		Legend,
		NumberChart,
		RingChart,
		Sparkline,
		StatCard,
	} from "@heyramzi/ui/charts";
	import DemoStage from "#lib/DemoStage.svelte";

	const usd = { style: "currency", currency: "USD", maximumFractionDigits: 0 } as const;
	const money = (v: number) =>
		v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

	const monthly = [
		{ month: "Jan", revenue: 4200, costs: 2800 },
		{ month: "Feb", revenue: 5100, costs: 3100 },
		{ month: "Mar", revenue: 4800, costs: 2950 },
		{ month: "Apr", revenue: 6200, costs: 3400 },
		{ month: "May", revenue: 7100, costs: 3600 },
		{ month: "Jun", revenue: 6800, costs: 3500 },
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
		v: 50 + Math.sin(i / 2) * 20 + ((i * 7) % 10),
	}));

	// A rising year for the area stat card.
	const revenueTrend = [4700, 5200, 4950, 4780, 5600, 6100, 5900, 6400, 7200, 6950, 7600, 8200].map(
		(revenue, i) => ({
			month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][
				i
			],
			revenue,
		}),
	);

	// Smooth and gently rising, so the curve reads as waves and not spikes.
	const sessions = Array.from({ length: 16 }, (_, i) => ({
		i,
		v: 1080 + Math.sin(i / 2.1) * 110 + i * 16,
	}));
</script>

<div class="flex w-full flex-col gap-4">
	<DemoStage
		title="Gauge with a count-up center"
		note="A notched radial meter that counts up its center value."
	>
		<div class="w-60">
			<GaugeChart
				value={66}
				centerValue={428000}
				defaultLabel="ARR run rate"
				formatOptions={{ style: "currency", currency: "USD", notation: "compact" }}
			/>
		</div>
	</DemoStage>

	<DemoStage
		title="Ring chart and Legend"
		note="Concentric rings with a legend that hovers in step, progress bars included."
	>
		<div class="flex flex-wrap items-center gap-x-6 gap-y-5">
			<div class="w-44">
				<RingChart data={channels} bind:hoveredIndex={ringHover} defaultLabel="Sessions" />
			</div>
			<div class="min-w-40 flex-1">
				<Legend items={channels} bind:hoveredIndex={ringHover} showProgress showPercentage />
			</div>
		</div>
	</DemoStage>

	<DemoStage
		title="Legend on its own"
		note="Progress bars, percentages, hover dim and keyboard focus."
	>
		<div class="w-full max-w-sm">
			<Legend title="Traffic by channel" items={channels} showProgress showPercentage />
		</div>
	</DemoStage>

	<DemoStage title="Sparkline" note="A trendline the width of whatever holds it.">
		<div class="flex w-full max-w-sm flex-col gap-4">
			<p class="text-xs text-muted-foreground">showLast: end-cap dot and inline value</p>
			<Sparkline data={sparkSeries} xKey="i" yKey="v" color="var(--chart-1)" showLast />
			<p class="text-xs text-muted-foreground">
				bare: no chrome, for the foot of a card that links
			</p>
			<Sparkline data={sparkSeries} xKey="i" yKey="v" color="var(--chart-1)" height={48} bare />
		</div>
	</DemoStage>

	<DemoStage title="Chart tokens" note="Theme charts globally with five CSS custom properties.">
		<!-- The name sits beside the colour, not on it: five arbitrary palette entries can't all carry legible text. -->
		<div class="flex w-full max-w-xs flex-col gap-1.5">
			{#each [1, 2, 3, 4, 5] as n (n)}
				<div class="flex items-center gap-2.5 font-mono text-xs">
					<span
						class="h-5 w-10 flex-none rounded-md shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--border)_65%,transparent)]"
						style="background: var(--chart-{n})"
					></span>
					--chart-{n}
				</div>
			{/each}
		</div>
	</DemoStage>

	<DemoStage title="Number chart" note="A figure on its own, with or without a scale under it.">
		<div class="flex w-full max-w-sm flex-col gap-6">
			<p class="text-xs text-muted-foreground">size=lg: count-up, direction-aware delta</p>
			<NumberChart
				label="Total cash"
				value={128400}
				delta={6.1}
				direction="up-good"
				size="lg"
				caption="across 4 accounts"
				formatOptions={usd}
			/>
			<p class="text-xs text-muted-foreground">share: the scale a lone number can't carry</p>
			<NumberChart
				label="Expenses"
				value={41250}
				delta={-3.4}
				direction="down-good"
				share={0.38}
				shareLabel="of revenue"
				color="var(--chart-4)"
				formatOptions={usd}
			/>
			<p class="text-xs text-muted-foreground">
				bare: no chrome, for a figure inside a band or a panel
			</p>
			<NumberChart
				bare
				label="Net income"
				value={67150}
				delta={0.2}
				direction="up-good"
				share={0.62}
				shareLabel="of revenue"
				color="var(--chart-2)"
				formatOptions={usd}
			/>
		</div>
	</DemoStage>

	<DemoStage
		title="Stat card"
		note="A figure over a chart, on a card: three chart kinds, a gauge form and a bare chart."
	>
		<div class="flex w-full max-w-sm flex-col gap-6">
			<p class="text-xs text-muted-foreground">
				variant=area: edge-to-edge chart, trend pill, count-up value
			</p>
			<StatCard
				label="Total Revenue"
				value={8200}
				delta={12.4}
				caption="Avg"
				data={revenueTrend}
				xKey="month"
				yKey="revenue"
				variant="area"
				formatValue={money}
			/>
			<p class="text-xs text-muted-foreground">variant=line: denser series</p>
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
			<p class="text-xs text-muted-foreground">variant=bar: negative trend, down state</p>
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
				formatValue={money}
			/>
			<p class="text-xs text-muted-foreground">variant=gauge: figure left, radial gauge right</p>
			<StatCard
				variant="gauge"
				label="Deliverables"
				caption="2 of 6 complete"
				gaugeValue={33}
				delta={5}
				color="var(--chart-1)"
			/>
			<p class="text-xs text-muted-foreground">
				figureOnly: the bare edge-to-edge chart, no labels
			</p>
			<StatCard
				figureOnly
				data={revenueTrend}
				xKey="month"
				yKey="revenue"
				variant="area"
				height={170}
			/>
		</div>
	</DemoStage>
</div>
