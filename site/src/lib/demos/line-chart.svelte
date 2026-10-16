<script lang="ts">
  import { LineChart } from "@heyramzi/charts";

  const data = [
    { day: "Mon", visits: 1240, signups: 120 },
    { day: "Tue", visits: 1480, signups: 160 },
    { day: "Wed", visits: 1390, signups: 148 },
    { day: "Thu", visits: 1810, signups: 210 },
    { day: "Fri", visits: 2090, signups: 260 },
    { day: "Sat", visits: 1760, signups: 190 },
    { day: "Sun", visits: 1950, signups: 240 },
  ];
</script>

<LineChart
  {data}
  xKey="day"
  series={[
    { key: "visits", label: "Visits", color: "var(--chart-1)" },
    { key: "signups", label: "Signups", color: "var(--chart-2)" },
  ]}
  showMarkers
  dashFromIndex={5}
  height={260}
/>
