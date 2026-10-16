<script lang="ts">
  import TradeIcon from "@heyramzi/ui/icons/TradeIcon";

  const trades = ["plumbers", "electricians", "roofers", "carpenters", "locksmiths", "builders"] as const;
</script>

<div class="flex flex-wrap items-center justify-center gap-4">
  {#each trades as trade (trade)}
    <div class="flex w-16 flex-col items-center gap-1.5">
      <span class="grid size-11 place-items-center rounded-xl border border-border bg-card text-foreground">
        <TradeIcon {trade} size={20} />
      </span>
      <span class="text-[11px] capitalize text-muted-foreground">{trade}</span>
    </div>
  {/each}
</div>
