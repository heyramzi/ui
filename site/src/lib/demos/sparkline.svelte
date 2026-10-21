<script lang="ts">
  import { Sparkline } from "@heyramzi/ui/charts";

  const up = [3, 4, 3.6, 5, 5.4, 6.2, 6, 7.4, 8].map((v, i) => ({ i, v }));
  const down = [8, 7.2, 7.5, 6, 5.6, 5, 4.2, 4.4, 3].map((v, i) => ({ i, v }));
</script>

<div class="flex w-72 flex-col gap-5">
  <div class="flex items-center justify-between gap-4">
    <span class="text-sm text-muted-foreground">Signups</span>
    <div class="w-28"><Sparkline data={up} xKey="i" yKey="v" showLast /></div>
  </div>
  <div class="flex items-center justify-between gap-4">
    <span class="text-sm text-muted-foreground">Churn</span>
    <div class="w-28"><Sparkline data={down} xKey="i" yKey="v" color="var(--chart-4)" /></div>
  </div>
  <div class="flex items-center justify-between gap-4">
    <span class="text-sm text-muted-foreground">Ornament</span>
    <div class="w-28"><Sparkline data={up} xKey="i" yKey="v" bare height="2rem" /></div>
  </div>
</div>
