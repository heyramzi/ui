<script lang="ts">
  import { DonutChart, Legend } from "@heyramzi/ui/charts";

  const data = [
    { source: "Direct", visits: 4200, color: "var(--chart-1)" },
    { source: "Search", visits: 3100, color: "var(--chart-2)" },
    { source: "Social", visits: 1800, color: "var(--chart-3)" },
    { source: "Email", visits: 900, color: "var(--chart-4)" },
  ];
</script>

<div class="flex flex-wrap items-center justify-center gap-8">
  <DonutChart {data} valueKey="visits" labelKey="source" colorKey="color" centerLabel="Visits" height={220} />
  <Legend
    items={data.map((d) => ({ label: d.source, value: d.visits, color: d.color }))}
    showValue
  />
</div>
