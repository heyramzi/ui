<script lang="ts">
	import { HoldToConfirm } from "@heyramzi/ui/components/hold-to-confirm";

	let deleted = $state(false);
</script>

<div class="flex flex-col items-center gap-3">
	<HoldToConfirm onConfirm={() => (deleted = true)}>
		{#snippet idle()}Hold to delete{/snippet}
		{#snippet holding()}Keep holding{/snippet}
	</HoldToConfirm>
	{#if deleted}
		<p class="text-sm text-muted-foreground">Deleted.</p>
	{/if}
</div>
