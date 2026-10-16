<script lang="ts">
  import { COLORS } from "@heyramzi/marketing/brand";

  const swatches = Object.entries(COLORS).slice(0, 8);
</script>

<div class="flex max-w-md flex-wrap items-center justify-center gap-3">
  {#each swatches as [name, value] (name)}
    <div class="flex w-20 flex-col items-center gap-1.5">
      <span class="size-11 rounded-xl border border-border" style:background={String(value)}></span>
      <span class="text-[11px] capitalize text-muted-foreground">{name.replace(/-/g, " ")}</span>
    </div>
  {/each}
</div>
