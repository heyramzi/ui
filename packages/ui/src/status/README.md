# @heyramzi/ui/status

Status badge, dot and icon from one map. `defineStatuses` builds the map, and the three parts read it, so a status looks the same everywhere. They used to live in `@heyramzi/ui/tasks`, which still re-exports every name.

```svelte
<script lang="ts">
  import { StatusBadge, defineStatuses } from "@heyramzi/ui/status";

  const statuses = defineStatuses({
    draft: { label: "Draft", tone: "neutral", variant: "open" },
    sent: { label: "Sent", tone: "info", variant: "completed" },
  });
</script>

<StatusBadge {statuses} status="sent" />
```

Exports: `StatusBadge`, `StatusDot`, `StatusIcon`, `defineStatuses` and the types `StatusDef`, `StatusDotVariant`, `StatusId`, `StatusMap`, `Statuses`. The old subpaths `tasks/status`, `tasks/status-dot` and `tasks/statuses` resolve to the same files.
