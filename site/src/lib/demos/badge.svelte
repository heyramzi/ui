<script lang="ts">
	import { Badge } from "@heyramzi/ui/shadcn/badge";
</script>

<div class="flex flex-wrap items-center justify-center gap-3">
	<Badge>Default</Badge>
	<Badge variant="secondary">Secondary</Badge>
	<Badge variant="outline">Outline</Badge>
	<Badge variant="destructive">Failed</Badge>
</div>
<div class="mt-3 flex flex-wrap items-center justify-center gap-3">
	<Badge tone="neutral">Draft</Badge>
	<Badge tone="info">Syncing</Badge>
	<Badge tone="success">Approved</Badge>
	<Badge tone="warning">Pending</Badge>
	<Badge tone="destructive">Failed</Badge>
</div>
