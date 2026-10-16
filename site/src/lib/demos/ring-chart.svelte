<script lang="ts">
  import { RingChart } from "@heyramzi/ui/charts";

  const data = [
    { label: "Move", value: 520, maxValue: 600, color: "var(--chart-4)" },
    { label: "Exercise", value: 24, maxValue: 30, color: "var(--chart-2)" },
    { label: "Stand", value: 9, maxValue: 12, color: "var(--chart-1)" },
  ];
</script>

<RingChart {data} size={240} defaultLabel="Today" />
