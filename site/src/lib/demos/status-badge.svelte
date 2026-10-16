<script lang="ts">
  import { StatusBadge } from "@heyramzi/tasks";
  import { salesStatuses } from "@heyramzi/tasks/presets/sales";
</script>

<div class="flex max-w-md flex-wrap items-center justify-center gap-2">
  {#each salesStatuses.ids as id (id)}
    <StatusBadge statuses={salesStatuses} status={id} />
  {/each}
  <StatusBadge statuses={salesStatuses} status="proposal" busy />
</div>
