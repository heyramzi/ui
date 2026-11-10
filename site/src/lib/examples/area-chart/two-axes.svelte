<script lang="ts">
	import { AreaChart } from "@heyramzi/ui/charts";

	// Four weeks of search traffic: impressions run about 40 times clicks.
	const clicks = [
		112, 128, 141, 136, 98, 87, 119, 133, 152, 147, 158, 104, 96, 131, 144, 139, 161, 155, 109, 101,
		138, 149, 157, 166, 151, 112, 107, 143,
	];
	const impressions = [
		4410, 4890, 5230, 5120, 3980, 3710, 4620, 5010, 5540, 5390, 5810, 4170, 3920, 4980, 5360, 5240,
		5920, 5710, 4300, 4060, 5150, 5480, 5770, 6030, 5600, 4420, 4210, 5330,
	];
	const start = Date.UTC(2026, 9, 6);
	const data = clicks.map((c, i) => ({
		date: new Date(start + i * 86_400_000),
		clicks: c,
		impressions: impressions[i],
	}));
	const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
</script>

<AreaChart
	{data}
	xKey="date"
	series={[
		{ key: "clicks", label: "Clicks", color: "var(--chart-3)" },
		{ key: "impressions", label: "Impressions", color: "var(--chart-4)", axis: "right" },
	]}
	resting={{
		values: { clicks: sum(clicks), impressions: sum(impressions) },
		label: "Last 28 days",
	}}
	formatValue={(v) => Math.round(v).toLocaleString("en-US")}
	formatX={(v) =>
		(v as Date).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}
	height={240}
	label="Search clicks and impressions"
/>
