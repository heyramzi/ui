<script lang="ts">
  import { TimeSeriesChart } from "@heyramzi/charts";

  const data = Array.from({ length: 60 }, (_, i) => {
    const d = new Date(2026, 6, 1 + i);
    const wave = Math.sin(i / 6) * 220 + i * 18;
    return {
      date: d.toISOString().slice(0, 10),
      value: Math.round(1200 + wave + (i % 7) * 40),
      value2: Math.round(900 + wave * 0.6),
    };
  });
</script>

<TimeSeriesChart {data} label="This period" label2="Previous" height={280} />
