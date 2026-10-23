<script lang="ts">
	import { AreaChart } from "@heyramzi/ui/charts";

	const data = [
		{ month: "Jan", revenue: 3200, cost: 1800 },
		{ month: "Feb", revenue: 4100, cost: 2100 },
		{ month: "Mar", revenue: 3800, cost: 2400 },
		{ month: "Apr", revenue: 5300, cost: 2600 },
		{ month: "May", revenue: 6100, cost: 3000 },
		{ month: "Jun", revenue: 7200, cost: 3300 },
		{ month: "Jul", revenue: 6900, cost: 3100 },
		{ month: "Aug", revenue: 8100, cost: 3600 },
	];
</script>

<AreaChart
	{data}
	xKey="month"
	series={[
		{ key: "revenue", label: "Revenue", color: "var(--chart-1)" },
		{ key: "cost", label: "Cost", color: "var(--chart-3)" },
	]}
	formatValue={(v) => `$${v.toLocaleString()}`}
	height={260}
/>
