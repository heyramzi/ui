<script lang="ts">
	import { BarChart } from "@heyramzi/ui/charts";

	const data = [
		{ plan: "Free", users: 4200, mrr: 0 },
		{ plan: "Starter", users: 2650, mrr: 26500 },
		{ plan: "Pro", users: 1480, mrr: 43900 },
		{ plan: "Team", users: 720, mrr: 57600 },
		{ plan: "Scale", users: 310, mrr: 62000 },
	];
</script>

<BarChart
	{data}
	xKey="plan"
	yKey="users"
	yLabel="Users"
	height={260}
	details={(d) => [{ label: "MRR", value: `$${d.mrr.toLocaleString()}` }]}
/>
