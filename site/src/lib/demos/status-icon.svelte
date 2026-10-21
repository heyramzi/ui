<script lang="ts">
  import { StatusIcon, defineStatuses } from "@heyramzi/ui/tasks";
  import { Check, Clock, X } from "phosphor-svelte";

  const statuses = defineStatuses({
    queued: { label: "Queued", tone: "neutral", icon: Clock, variant: "open" },
    active: { label: "Active", tone: "info", icon: Clock, variant: "filled" },
    passed: { label: "Passed", tone: "success", icon: Check, variant: "completed" },
    failed: { label: "Failed", tone: "destructive", icon: X, variant: "lost" },
  });
</script>

<ul class="flex w-56 flex-col gap-2">
  {#each statuses.ids as id (id)}
    <li class="flex items-center gap-3 text-sm">
      <StatusIcon {statuses} status={id} />
      <span>{statuses.label(id)}</span>
    </li>
  {/each}
</ul>
