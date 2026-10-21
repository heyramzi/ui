<script lang="ts">
  import { StatusDot } from "@heyramzi/ui/tasks";
  import { salesStatuses } from "@heyramzi/ui/tasks/presets/sales";
</script>

<ul class="flex w-64 flex-col gap-2">
  {#each salesStatuses.ids as id (id)}
    <li class="flex items-center gap-3 text-sm">
      <StatusDot statuses={salesStatuses} status={id} />
      <span>{salesStatuses.label(id)}</span>
      <span class="ml-auto font-mono text-xs text-muted-foreground">{id}</span>
    </li>
  {/each}
</ul>
