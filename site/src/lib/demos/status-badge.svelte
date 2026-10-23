<script lang="ts">
	import { StatusBadge } from "@heyramzi/ui/status";
	import { salesStatuses } from "@heyramzi/ui/work/presets/sales";
</script>

<div class="flex max-w-md flex-wrap items-center justify-center gap-2">
	{#each salesStatuses.ids as id (id)}
		<StatusBadge statuses={salesStatuses} status={id} />
	{/each}
	<StatusBadge statuses={salesStatuses} status="proposal" busy />
	<StatusBadge tone="success" dot>Connected</StatusBadge>
	<StatusBadge tone="warning" dot>Reconnect</StatusBadge>
	<StatusBadge tone="destructive" dot>Error</StatusBadge>
</div>
