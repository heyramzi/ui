<script lang="ts">
  import { RingChart } from "@heyramzi/charts";

  const data = [
    { label: "Move", value: 520, maxValue: 600, color: "var(--chart-4)" },
    { label: "Exercise", value: 24, maxValue: 30, color: "var(--chart-2)" },
    { label: "Stand", value: 9, maxValue: 12, color: "var(--chart-1)" },
  ];
</script>

<div class="flex flex-wrap items-center justify-center gap-10">
  <RingChart {data} size={240} defaultLabel="Today" />
  <RingChart
    data={[{ label: "Training", value: 74, maxValue: 100, color: "var(--chart-4)" }]}
    size={104}
    showGlow={false}
    ariaLabel="12 days to race"
  >
    <span class="text-2xl leading-none font-bold tabular-nums">12</span>
    <span class="text-muted-foreground mt-1 text-[10px] font-medium uppercase">days to race</span>
  </RingChart>
</div>
