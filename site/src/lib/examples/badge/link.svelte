<script lang="ts">
	import { ArrowUpRight } from "phosphor-svelte";
	import { Badge } from "@heyramzi/ui/shadcn/badge";
</script>

<div class="flex flex-wrap items-center justify-center gap-2">
	<Badge variant="outline" href="/components/button">
		Button
		<ArrowUpRight aria-hidden="true" />
	</Badge>
	<Badge variant="secondary" href="/components/input">
		Input
		<ArrowUpRight aria-hidden="true" />
	</Badge>
</div>
