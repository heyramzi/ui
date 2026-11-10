<script lang="ts">
	import { CheckCircle, Clock } from "phosphor-svelte";
	import { Badge } from "@heyramzi/ui/shadcn/badge";
</script>

<div class="flex flex-wrap items-center justify-center gap-2">
	<Badge tone="success">
		<span class="size-1.5 rounded-full bg-current" aria-hidden="true"></span>
		Live
	</Badge>
	<Badge tone="warning">
		<Clock weight="bold" data-icon="inline-start" aria-hidden="true" />
		Pending
	</Badge>
	<Badge variant="secondary">
		<CheckCircle weight="bold" data-icon="inline-start" aria-hidden="true" />
		Verified
	</Badge>
</div>
