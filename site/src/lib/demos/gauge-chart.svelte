<script lang="ts">
  import { GaugeChart } from "@heyramzi/ui/charts";
</script>

<div class="flex flex-wrap items-center justify-center gap-10">
  <div class="size-44"><GaugeChart value={72} label="Health" /></div>
  <div class="size-44"><GaugeChart value={41} variant="ring" label="Quota" color="var(--chart-4)" /></div>
</div>
