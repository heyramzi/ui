<script lang="ts">
	import { Button } from "@heyramzi/ui/shadcn/button";
	import { Spinner } from "@heyramzi/ui/shadcn/spinner";
</script>

<div class="flex flex-wrap items-center justify-center gap-2">
	<Button variant="outline" disabled>Disabled</Button>
	<Button disabled>
		<Spinner data-icon="inline-start" />
		Saving
	</Button>
</div>
