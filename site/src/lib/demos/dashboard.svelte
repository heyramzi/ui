<script lang="ts">
	import { AreaChart, BarChart } from "@heyramzi/ui/charts";
	import {
		DataPanel,
		DataTable,
		DashboardSection,
		PanelGrid,
		PeriodFilter,
		StatBand,
		StatTile,
		CHART_HEIGHT,
		DAY_WINDOWS,
		type DataColumn,
	} from "@heyramzi/ui/charts/dashboard";

	// A small coffee roaster's shop: 180 days of orders, so every window has a previous one to
	// compare against. Built from a formula, not random, so the server and the browser agree.
	const END = Date.UTC(2026, 10, 9);
	const DAY = 86_400_000;
	// Monday to Sunday. Orders peak midweek and sag at the weekend, like most B2C shops.
	const WEEKDAY_PULL = [1.04, 1.12, 1.16, 1.08, 0.98, 0.78, 0.72];
	const days = Array.from({ length: 180 }, (_, i) => {
		const date = END - (179 - i) * DAY;
		const weekday = (new Date(date).getUTCDay() + 6) % 7;
		const wobble = 1 + 0.05 * Math.sin(i * 2.3) + 0.06 * Math.sin(i * 0.21);
		const orders = Math.round((17 + i * 0.045) * WEEKDAY_PULL[weekday] * wobble);
		const basket = 38 + 4 * Math.sin(i * 0.19) + (i % 5);
		const refunds = (i * 7) % 23 === 0 ? 2 : i % 4 === 0 ? 1 : 0;
		return { date, weekday, orders, revenue: Math.round(orders * basket), refunds };
	});

	const products = [
		{ id: "espresso", name: "House espresso, 1 kg", share: 0.34 },
		{ id: "guji", name: "Ethiopia Guji, 250 g", share: 0.21 },
		{ id: "decaf", name: "Colombia decaf, 500 g", share: 0.15 },
		{ id: "sub", name: "Monthly subscription", share: 0.19 },
		{ id: "kettle", name: "Gooseneck kettle", share: 0.11 },
	];

	const windows = DAY_WINDOWS.map((n) => ({ value: String(n), label: `${n}d` }));
	let period = $state("30");

	const n = $derived(Number(period));
	const current = $derived(days.slice(-n));
	const previous = $derived(days.slice(-2 * n, -n));

	const sum = (rows: typeof days, key: "orders" | "revenue" | "refunds") =>
		rows.reduce((total, row) => total + row[key], 0);
	const change = (now: number, before: number) =>
		before ? Math.round(((now - before) / before) * 1000) / 10 : null;

	const money = new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	});
	const cents = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
	const day = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

	const stats = $derived.by(() => {
		const revenue = sum(current, "revenue");
		const orders = sum(current, "orders");
		const refunds = sum(current, "refunds");
		const before = {
			revenue: sum(previous, "revenue"),
			orders: sum(previous, "orders"),
			refunds: sum(previous, "refunds"),
		};
		const basket = revenue / orders;
		const basketBefore = before.revenue / before.orders;
		const rate = refunds / orders;
		const rateBefore = before.refunds / before.orders;
		return {
			revenue: { value: money.format(revenue), delta: change(revenue, before.revenue) },
			orders: { value: orders.toLocaleString("en-US"), delta: change(orders, before.orders) },
			basket: { value: cents.format(basket), delta: change(basket, basketBefore) },
			refunds: { value: `${(rate * 100).toFixed(1)}%`, delta: change(rate, rateBefore) },
			total: revenue,
		};
	});

	// Each tile's shape: weekly figures read as a trend, where 90 daily points read as noise. A
	// 7-day window has one week, so it draws its days instead.
	// `end` is where the slice stops in the window, for a figure that looks further back.
	const weekly = (figure: (rows: typeof days, end: number) => number) => {
		const weeks: number[] = [];
		for (let i = current.length % 7; i < current.length; i += 7)
			weeks.push(figure(current.slice(i, i + 7), i + 7));
		return weeks.length > 2 ? weeks : current.map((row, i) => figure([row], i + 1));
	};
	const shapes = $derived({
		revenue: weekly((rows) => sum(rows, "revenue")),
		orders: weekly((rows) => sum(rows, "orders")),
		basket: weekly((rows) => sum(rows, "revenue") / sum(rows, "orders")),
		// Refunds per hundred orders over the trailing 3 weeks: one refund in a quiet week
		// otherwise draws a cliff.
		refunds: weekly((_, end) => {
			const span = current.slice(Math.max(0, end - 21), end);
			return sum(span, "refunds") / sum(span, "orders");
		}),
	});

	const daily = $derived(current.map((row) => ({ date: row.date, revenue: row.revenue })));
	const average = $derived(Math.round(stats.total / n));

	const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
	const byWeekday = $derived(
		WEEKDAYS.map((label, weekday) => ({
			label,
			orders: sum(
				current.filter((row) => row.weekday === weekday),
				"orders",
			),
		})),
	);

	type Product = (typeof products)[number] & { revenue: number };
	const top = $derived(
		products
			.map((p) => ({ ...p, revenue: Math.round(stats.total * p.share) }))
			.sort((a, b) => b.revenue - a.revenue),
	);
	const columns: DataColumn<Product>[] = [
		{
			key: "revenue",
			label: "Revenue",
			// Narrower on a phone, so the bar never runs into a long product name.
			width: "w-32 sm:w-40",
			align: "end",
			strong: true,
			value: (row) => money.format(row.revenue),
			bar: (row) => row.share / products[0].share,
		},
	];
</script>

<div class="flex w-full max-w-4xl flex-col">
	<DashboardSection title="Sales" note="{day.format(current[0].date)} to {day.format(END)}">
		{#snippet actions()}
			<PeriodFilter
				options={windows}
				value={period}
				onValueChange={(next) => (period = next)}
				ariaLabel="Window"
			/>
		{/snippet}

		<StatBand columns={4}>
			<StatTile
				label="Revenue"
				value={stats.revenue.value}
				deltaPct={stats.revenue.delta}
				direction="up-good"
				lead
				series={shapes.revenue}
			/>
			<StatTile
				label="Orders"
				value={stats.orders.value}
				deltaPct={stats.orders.delta}
				direction="up-good"
				series={shapes.orders}
			/>
			<StatTile
				label="Average order"
				value={stats.basket.value}
				deltaPct={stats.basket.delta}
				direction="up-good"
				series={shapes.basket}
			/>
			<StatTile
				label="Refund rate"
				value={stats.refunds.value}
				deltaPct={stats.refunds.delta}
				direction="down-good"
				series={shapes.refunds}
			/>
		</StatBand>

		<DataPanel label="Revenue per day">
			<AreaChart
				data={daily}
				xKey="date"
				series={[{ key: "revenue", label: "Revenue" }]}
				height={CHART_HEIGHT}
				formatValue={(v) => money.format(v)}
				formatX={(v) => day.format(Number(v))}
				resting={{ value: average, label: "Daily average" }}
			/>
		</DataPanel>

		<PanelGrid columns={2}>
			<DataPanel label="Top products" pad={false}>
				<DataTable
					rows={top}
					{columns}
					rowKey={(row) => row.id}
					leadLabel="Product"
					emptyLabel="No sales"
					minWidth="min-w-0"
				>
					{#snippet lead(row)}<span class="truncate">{row.name}</span>{/snippet}
				</DataTable>
			</DataPanel>
			<DataPanel label="Orders by weekday">
				<BarChart
					data={byWeekday}
					xKey="label"
					yKey="orders"
					height={232}
					showFigure={false}
					label="Orders by weekday"
					yLabel="Orders"
				/>
			</DataPanel>
		</PanelGrid>
	</DashboardSection>
</div>
